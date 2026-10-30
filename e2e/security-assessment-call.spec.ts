import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { load as parseYaml } from "js-yaml";
import { SDR_LINK_SECRET_ENV_NAME, signSdrToken } from "../src/lib/sdr-link";
import { E2E_SDR_LINK_SECRET } from "./support/sdrTestSecret";

/**
 * A whole discovery call across the SDR's console and the presenter tab they
 * share with the prospect. The save is stubbed, so the spec never reaches
 * Syncro or Resend. The token is signed with a fake secret, so this only runs
 * against a server started with that secret; see SKIP_REASON.
 */

const CONSOLE_PATH = "/security-assessment/call";
const CALL_ROUTE = "**/api/security-assessment/call";
const PRESENTER_CHANNEL = "sdr-call-presenter";
const SEGMENT = "small_team";

const SKIP_REASON =
  `The server at this baseURL doesn't accept links signed with the fake e2e secret. ` +
  `Let Playwright start the dev server (nothing else on port 3000), or start one with ` +
  `${SDR_LINK_SECRET_ENV_NAME} set to the value in e2e/support/sdrTestSecret.ts`;

const SDR_NAME = "Marisol Testcaller";
const PROSPECT = {
  name: "Ottoline Verhagen",
  email: "ottoline.verhagen@e2e-prospect.example",
  company: "Quillfeather Bookkeeping",
};
const OPENING_NOTE = "They were spooked by the Thornbury invoice scam.";
const POSTURE_NOTE = "Owner keeps the banking login on a sticky note.";
const CLOSING_NOTE = "Send it to the Thornbury office manager too.";
const CALL_SUMMARY = "Warm lead, wants the Quillfeather proposal by Friday.";
const OPENING_CHOICE = "Another IT company or MSP";
const CLOSING_CHOICE = "Send a proposal or quote";

type QuizQuestion = {
  id: string;
  segments: string[];
  text: string;
  answers: { text: string; points: number }[];
};
type DiscoveryQuestion = { id: string; group: string; text: string };
type QuizContent = {
  questions: QuizQuestion[];
  sdr: {
    talkTracks: Record<string, { whyItMatters: string; probe: string }>;
    nextSteps: Record<
      string,
      Record<string, { propose: string; service: string }>
    >;
    discovery: DiscoveryQuestion[];
  };
};

const content = parseYaml(
  readFileSync(
    path.join(process.cwd(), "content/quiz/security-assessment.yaml"),
    "utf8",
  ),
) as QuizContent;

const postureQuestions = content.questions.filter(({ segments }) =>
  segments.includes(SEGMENT),
);
const openingDiscovery = content.sdr.discovery.filter(
  ({ group }) => group === "opening",
);
const closingDiscovery = content.sdr.discovery.filter(
  ({ group }) => group === "closing",
);
const maxScore = postureQuestions.reduce(
  (total, { answers }) =>
    total + Math.max(...answers.map(({ points }) => points)),
  0,
);

/** Everything only the SDR may see, in full so generic words can't match. */
const PRIVATE_STRINGS = [
  SDR_NAME,
  PROSPECT.name,
  PROSPECT.email,
  PROSPECT.company,
  OPENING_NOTE,
  POSTURE_NOTE,
  CLOSING_NOTE,
  CALL_SUMMARY,
  OPENING_CHOICE,
  CLOSING_CHOICE,
  ...Object.values(content.sdr.talkTracks).flatMap(
    ({ whyItMatters, probe }) => [whyItMatters, probe],
  ),
  ...Object.values(content.sdr.nextSteps)
    .flatMap((tiers) => Object.values(tiers))
    .map(({ propose }) => propose),
  ...content.sdr.discovery.map(({ text }) => text),
];

function mintTestToken(): string {
  const previousSecret = process.env[SDR_LINK_SECRET_ENV_NAME];
  process.env[SDR_LINK_SECRET_ENV_NAME] = E2E_SDR_LINK_SECRET;
  try {
    return signSdrToken({ name: SDR_NAME });
  } finally {
    if (previousSecret === undefined) {
      delete process.env[SDR_LINK_SECRET_ENV_NAME];
    } else {
      process.env[SDR_LINK_SECRET_ENV_NAME] = previousSecret;
    }
  }
}

/** Undoes the escaping HTML and the RSC payload add, so a leak can't hide in it. */
function normalizeForSearch(raw: string): string {
  return raw
    .replace(/\\"/g, '"')
    .replace(/\\u0026/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

/**
 * Waits for the console to answer a sync, which proves everything it sent
 * before that has reached the presenter, then gives React a moment to render.
 * Without it, the checks could run ahead of a leak and pass. Returns the reply,
 * because the presenter holds what it receives whether it renders it or not.
 */
async function readConsoleMessageAfterSync(presenter: Page): Promise<string> {
  return presenter.evaluate(
    (channelName) =>
      new Promise<string>((resolve, reject) => {
        const channel = new BroadcastChannel(channelName);
        const timeout = setTimeout(() => {
          channel.close();
          reject(new Error("The console didn't answer a sync"));
        }, 5000);
        channel.onmessage = ({ data }) => {
          if (data.kind !== "screen") return;
          clearTimeout(timeout);
          channel.close();
          setTimeout(() => resolve(JSON.stringify(data)), 100);
        };
        channel.postMessage({ kind: "sync" });
      }),
    PRESENTER_CHANNEL,
  );
}

async function expectPresenterHasNoLeak(
  presenter: Page,
  token: string,
  step: string,
) {
  const consoleMessage = await readConsoleMessageAfterSync(presenter);
  const page = await presenter.evaluate(() => ({
    text: document.body.innerText,
    title: document.title,
    url: location.href,
    readableCookies: document.cookie,
    localStorage: JSON.stringify({ ...localStorage }),
    sessionStorage: JSON.stringify({ ...sessionStorage }),
    loadedUrls: JSON.stringify(
      performance.getEntries().map(({ name }) => name),
    ),
    windowName: window.name,
  }));
  const surfaces = {
    ...page,
    html: await presenter.content(),
    consoleMessage,
  };

  for (const [surface, raw] of Object.entries(surfaces)) {
    const searchable = normalizeForSearch(raw);
    for (const forbidden of [...PRIVATE_STRINGS, token]) {
      expect(
        searchable.includes(normalizeForSearch(forbidden)),
        `${step}: presenter ${surface} contains "${forbidden}"`,
      ).toBe(false);
    }
  }
}

test.describe("Discovery call console and presenter", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("runs a whole call across both tabs without the presenter leaking", async ({
    context,
    page: consolePage,
    request,
  }) => {
    test.setTimeout(180_000);

    const token = mintTestToken();
    const link = `${CONSOLE_PATH}?t=${encodeURIComponent(token)}`;
    const probe = await request.get(link, { maxRedirects: 0 });
    test.skip(probe.status() === 404, SKIP_REASON);
    expect(probe.status()).toBe(200);

    const saveRequests: unknown[] = [];
    await context.route(CALL_ROUTE, async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      saveRequests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await test.step("the link becomes a cookie the page can't read", async () => {
      await consolePage.goto(link);
      await expect(
        consolePage.getByText(`Signed in as ${SDR_NAME}`),
      ).toBeVisible();
      await expect(consolePage).toHaveURL(new RegExp(`${CONSOLE_PATH}$`));
      expect(await consolePage.content()).not.toContain(token);
      expect(
        await consolePage.evaluate(
          () =>
            document.cookie +
            JSON.stringify({ ...sessionStorage }) +
            JSON.stringify({ ...localStorage }),
        ),
      ).not.toContain(token);
      const cookies = await context.cookies();
      expect(cookies.find(({ value }) => value === token)?.httpOnly).toBe(true);
    });

    const consoleMain = consolePage.getByRole("main");
    const clickConsoleButton = (name: string) =>
      consoleMain.getByRole("button", { name, exact: true }).click();

    // A click before hydration does nothing, so wait until the console is live
    await expect(() => readConsoleMessageAfterSync(consolePage)).toPass({
      timeout: 60_000,
    });

    const presenterOpened = context.waitForEvent("page");
    await clickConsoleButton("Open presenter");
    const presenter = await presenterOpened;
    const presenterMain = presenter.getByRole("main");
    const expectPresenterHeading = (name: string) =>
      expect(presenterMain.getByRole("heading", { level: 1 })).toHaveText(name);
    const expectNoLeak = (step: string) =>
      expectPresenterHasNoLeak(presenter, token, step);
    const expectPresenterIsNeutral = () =>
      expectPresenterHeading("Getting to know your business");

    await expectPresenterIsNeutral();
    expect(presenter.url()).toMatch(/\/security-assessment\/call\/present$/);
    await expectNoLeak("presenter opened");

    await test.step("details", async () => {
      const form = consolePage.getByRole("form", { name: "Prospect details" });
      await form.getByRole("textbox", { name: "Name" }).fill(PROSPECT.name);
      await form.getByRole("textbox", { name: "Email" }).fill(PROSPECT.email);
      await form
        .getByRole("textbox", { name: "Company" })
        .fill(PROSPECT.company);
      await expectNoLeak("details typed");
      await clickConsoleButton("Continue");
      await expect(consoleMain.getByRole("heading", { level: 1 })).toHaveText(
        "How big is your business?",
      );
      await expectNoLeak("details submitted");
    });

    await test.step("size", async () => {
      await consoleMain.getByRole("radio", { name: /^Small team/ }).click();
      await clickConsoleButton("Continue");
      await expect(
        consoleMain.getByText(openingDiscovery[0].text),
      ).toBeVisible();
      await expectPresenterIsNeutral();
      await expectNoLeak("size picked");
    });

    await test.step("a presenter opened mid-call starts with none of the call", async () => {
      const lateOpened = context.waitForEvent("page");
      await clickConsoleButton("Open presenter");
      const latePresenter = await lateOpened;
      await expect(
        latePresenter.getByRole("heading", {
          name: "Getting to know your business",
        }),
      ).toBeVisible();
      await expectPresenterHasNoLeak(latePresenter, token, "opened mid-call");
      await latePresenter.close();
    });

    await test.step("opening discovery: one answered, the rest skipped", async () => {
      await consoleMain
        .getByRole("textbox", { name: /^Note/ })
        .fill(OPENING_NOTE);
      await expectNoLeak("opening note typed");
      await clickConsoleButton("Next");

      await expect(
        consoleMain.getByText(openingDiscovery[1].text),
      ).toBeVisible();
      await expectNoLeak("second opening question on screen");
      await consoleMain.getByRole("radio", { name: OPENING_CHOICE }).click();
      await expectNoLeak("opening choice picked");
      await clickConsoleButton("Next");

      for (const { text } of openingDiscovery.slice(2)) {
        await expect(consoleMain.getByText(text)).toBeVisible();
        await expectNoLeak(`opening question on screen: ${text}`);
        await clickConsoleButton("Skip");
      }
    });

    const answers: Record<string, number> = {};
    let lastQuestion: QuizQuestion | undefined;

    await test.step("posture: answers from both tabs, each shown on the other", async () => {
      for (let index = 0; index < postureQuestions.length; index++) {
        await expect(
          consoleMain.getByText(`Question ${index + 1} of`),
        ).toHaveText(`Question ${index + 1} of ${postureQuestions.length}`);
        const heading = await consoleMain
          .getByRole("heading", { level: 1 })
          .innerText();
        const question = postureQuestions.find(({ text }) => text === heading);
        if (!question) throw new Error(`Unknown question: ${heading}`);
        lastQuestion = question;

        await expectPresenterHeading(question.text);
        // Proves the leak list holds what the console really shows
        await expect(
          consoleMain.getByText(content.sdr.talkTracks[question.id].probe),
        ).toBeVisible();
        await expectNoLeak(`posture ${question.id} on screen`);

        const answerText = question.answers[0].text;
        const answerer = index % 2 === 0 ? consoleMain : presenterMain;
        const other = index % 2 === 0 ? presenterMain : consoleMain;
        await answerer.getByRole("radio", { name: answerText }).click();
        await expect(
          answerer.getByRole("radio", { name: answerText }),
        ).toBeChecked();
        await expect(
          other.getByRole("radio", { name: answerText }),
        ).toBeChecked();
        answers[question.id] = 0;

        if (index === 0) {
          await consoleMain
            .getByRole("textbox", { name: /^Note/ })
            .fill(POSTURE_NOTE);
        }
        await expectNoLeak(`posture ${question.id} answered`);
        await clickConsoleButton("Next");
      }
    });

    const consoleMeter = consoleMain.getByRole("meter", { name: "Score" });
    const presenterMeter = presenterMain.getByRole("meter", { name: "Score" });
    const buildScore = () =>
      postureQuestions.reduce(
        (total, { id, answers: options }) =>
          total + options[answers[id]].points,
        0,
      );
    const buildMeterText = (score: number) =>
      new RegExp(`^${score} of ${maxScore}, \\w+$`);
    const expectScoreOnBothPages = async () => {
      const score = buildScore();
      const meterText = buildMeterText(score);
      await expect(consoleMeter).toHaveAttribute("aria-valuetext", meterText);
      await expect(presenterMeter).toHaveAttribute("aria-valuetext", meterText);
      return score;
    };
    const expectNextStepOnlyOnConsole = async (step: string) => {
      await expect(
        consoleMain.getByRole("heading", { name: "Next step" }),
      ).toBeVisible();
      await expect(
        presenterMain.getByRole("heading", { name: "Next step" }),
      ).toHaveCount(0);
      await expectNoLeak(step);
    };

    await test.step("a changed answer updates the results on both pages", async () => {
      const firstScore = await expectScoreOnBothPages();
      await expectNextStepOnlyOnConsole("results reached");

      await clickConsoleButton("Back");
      const question = lastQuestion as QuizQuestion;
      await expectPresenterHeading(question.text);
      await expectNoLeak("stepped back");
      const lastAnswer = question.answers.length - 1;
      await consoleMain
        .getByRole("radio", { name: question.answers[lastAnswer].text })
        .click();
      await expect(
        presenterMain.getByRole("radio", {
          name: question.answers[lastAnswer].text,
        }),
      ).toBeChecked();
      answers[question.id] = lastAnswer;
      await clickConsoleButton("Next");

      expect(await expectScoreOnBothPages()).not.toBe(firstScore);
      await expectNextStepOnlyOnConsole("results after the change");
      await expect(
        presenterMain.getByRole("radio"),
        "the presenter's results have no answers left to click",
      ).toHaveCount(0);
      await clickConsoleButton("Continue");
    });

    await test.step("closing discovery", async () => {
      await expect(
        consoleMain.getByText(closingDiscovery[0].text),
      ).toBeVisible();
      await expectPresenterIsNeutral();
      await expectNoLeak("closing started");
      await clickConsoleButton("Skip");
      await expect(
        consoleMain.getByText(closingDiscovery[1].text),
      ).toBeVisible();
      await clickConsoleButton("Skip");
      await expect(
        consoleMain.getByText(closingDiscovery[2].text),
      ).toBeVisible();
      await expectNoLeak("third closing question on screen");
      await clickConsoleButton("Skip");

      await expect(
        consoleMain.getByText(closingDiscovery[3].text),
      ).toBeVisible();
      await consoleMain.getByRole("radio", { name: CLOSING_CHOICE }).click();
      await consoleMain
        .getByRole("textbox", { name: /^Note/ })
        .fill(CLOSING_NOTE);
      await expectNoLeak("closing answered");
      await clickConsoleButton("Next");
    });

    await test.step("summary and save", async () => {
      const summary = consoleMain.getByRole("textbox", { name: /^Summary/ });
      await summary.fill(CALL_SUMMARY);
      await expectNoLeak("summary typed");
      expect(saveRequests).toHaveLength(0);

      await clickConsoleButton("Save to Syncro");
      await expect(
        consoleMain.getByText("Saved", { exact: true }),
      ).toBeVisible();
      await expect(summary).not.toBeEditable();
      await expect(
        consoleMain.getByRole("button", { name: "Start a new call" }),
      ).toBeVisible();
      await expect(
        consoleMain.getByRole("button", { name: "Save to Syncro" }),
      ).toHaveCount(0);

      // The console stays on the summary; the presenter goes back to the results
      await expect(presenterMeter).toHaveAttribute(
        "aria-valuetext",
        buildMeterText(buildScore()),
      );
      await expectNoLeak("saved");
      expect(saveRequests).toEqual([
        {
          ...PROSPECT,
          segment: SEGMENT,
          answers,
          notes: { [postureQuestions[0].id]: POSTURE_NOTE },
          discovery: {
            why_now: { note: OPENING_NOTE },
            current_it: { choice: OPENING_CHOICE },
            user_count: { isNotAsked: true },
            email_platform: { isNotAsked: true },
            recent_incidents: { isNotAsked: true },
            decision_maker: { isNotAsked: true },
            timeline: { isNotAsked: true },
            budget: { isNotAsked: true },
            agreed_next_step: { choice: CLOSING_CHOICE, note: CLOSING_NOTE },
          },
          callSummary: CALL_SUMMARY,
        },
      ]);
      expect(consolePage.url()).not.toContain(token);
    });
  });
});

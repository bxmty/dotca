import { renderToStaticMarkup } from "react-dom/server";
import RootLayout from "@/app/layout";
import { SDR_PRESENTER_PATH } from "@/lib/sdr-console-route";

let mockPathname = "/";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));
jest.mock("@/app/components/GoogleAnalytics", () => () => null);
jest.mock("@/app/components/WebVitalsReporter", () => () => null);
jest.mock("@/app/components/BreadcrumbSchema", () => () => null);

/** What a viewer can see: the head's structured data isn't on screen. */
function renderLayoutAt(pathname: string) {
  mockPathname = pathname;
  const markup = renderToStaticMarkup(
    <RootLayout>
      <div>page content</div>
    </RootLayout>,
  );
  return markup.slice(markup.indexOf("<body"));
}

describe("the site's chrome in the root layout", () => {
  it.each([
    "/",
    "/pricing",
    "/security-assessment",
    "/security-assessment/call",
  ])("shows the nav, CTA and contact details on %s", (pathname) => {
    const markup = renderLayoutAt(pathname);

    expect(markup).toContain("<nav");
    expect(markup).toContain('href="/book"');
    expect(markup).toContain("<footer");
    expect(markup).toContain("hi@boximity.ca");
  });

  it("leaves only the page itself on the presenter", () => {
    const markup = renderLayoutAt(SDR_PRESENTER_PATH);

    expect(markup).toContain("page content");
    expect(markup).not.toContain("<nav");
    expect(markup).not.toContain("<header");
    expect(markup).not.toContain("<footer");
    expect(markup).not.toContain("/book");
    expect(markup).not.toContain("hi@boximity.ca");
    expect(markup).not.toContain("tel:");
  });
});

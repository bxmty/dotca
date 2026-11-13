// When this fails: a dynamic route is new. If its segment carries a secret, teach src/lib/sentry-scrub.ts to redact that path; if it is public, add its name to PUBLIC_SEGMENT_NAMES.
import { readdirSync } from "fs";
import { join, relative, sep } from "path";

import { scrubLinkTokens } from "@/lib/sentry-scrub";

/**
 * Guards the link between the route tree and the Sentry scrubber (#565): the
 * SDK records request URLs on events, spans and breadcrumbs, so a secret that
 * travels as a path segment reaches Sentry unless sentry-scrub.ts knows the
 * route. Every dynamic segment under src/app is classified here by name, and
 * every secret one must come out of the scrubber redacted.
 */
const APP_DIR = join(process.cwd(), "src", "app");

/** Segment names that mark a secret: `[token]`, `[inviteCode]`, `[apiKey]`… */
const SECRET_SEGMENT_NAME =
  /token|secret|key|signature|sig$|code|nonce|password|invite|session|magic/i;

/** Segments whose value is public content, safe to appear in Sentry */
const PUBLIC_SEGMENT_NAMES = new Set(["slug", "tag"]);

const DYNAMIC_SEGMENT = /^\[{1,2}(?:\.\.\.)?([^\]]+)\]{1,2}$/;
const ROUTE_GROUP = /^\(.*\)$/;
const SAMPLE_SECRET = "s3cr3tSampleValue-_1";

interface DynamicRoute {
  /** Path from src/app, e.g. `service-request/[token]` */
  routeDir: string;
  segmentName: string;
}

function listDynamicRoutes(dir: string): DynamicRoute[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const path = join(dir, entry.name);
      const segmentName = DYNAMIC_SEGMENT.exec(entry.name)?.[1];
      const nested = listDynamicRoutes(path);
      return segmentName
        ? [{ routeDir: relative(APP_DIR, path), segmentName }, ...nested]
        : nested;
    });
}

/** The URL path for a route, with the sample secret in its last segment */
function buildSamplePath(routeDir: string): string {
  const segments = routeDir
    .split(sep)
    .filter((name) => !ROUTE_GROUP.test(name));
  const last = segments.length - 1;
  return `/${segments
    .map((name, index) => {
      if (index === last) return SAMPLE_SECRET;
      return DYNAMIC_SEGMENT.test(name) ? "sample" : name;
    })
    .join("/")}`;
}

const dynamicRoutes = listDynamicRoutes(APP_DIR);
const secretRoutes = dynamicRoutes.filter(({ segmentName }) =>
  SECRET_SEGMENT_NAME.test(segmentName),
);

describe("Sentry scrubber coverage of dynamic routes", () => {
  it("finds the intake link route", () => {
    expect(secretRoutes.map(({ routeDir }) => routeDir)).toContain(
      join("service-request", "[token]"),
    );
  });

  it("has every dynamic segment classified as secret or public", () => {
    const unclassified = dynamicRoutes
      .filter(
        ({ segmentName }) =>
          !SECRET_SEGMENT_NAME.test(segmentName) &&
          !PUBLIC_SEGMENT_NAMES.has(segmentName),
      )
      .map(({ routeDir }) => routeDir);

    expect(unclassified).toEqual([]);
  });

  describe.each(secretRoutes)("$routeDir", ({ routeDir }) => {
    const path = buildSamplePath(routeDir);

    it.each([
      ["a path", path],
      ["a full URL", `https://boximity.ca${path}?from=mail#top`],
      ["a nested route under it", `https://boximity.ca${path}/done`],
      [
        "a percent-encoded URL",
        `/login?next=${encodeURIComponent(`${path}?from=mail`)}`,
      ],
      ["a log line", `GET ${path} 200 in 12ms`],
    ])("redacts the secret from %s", (_name, value) => {
      const event = {
        request: { url: value, headers: { Referer: value } },
        breadcrumbs: [{ data: { url: value } }],
      };

      expect(JSON.stringify(scrubLinkTokens(event))).not.toContain(
        SAMPLE_SECRET,
      );
    });
  });
});

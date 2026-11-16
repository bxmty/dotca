import { renderToStaticMarkup } from "react-dom/server";
import RootLayout from "@/app/layout";
import { SDR_PRESENTER_PATH } from "@/lib/sdr-console-route";
import { COMPANY_PHONE_DISPLAY } from "@/lib/company-phone";

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

  describe("on a service request page", () => {
    const INTAKE_PATH = "/service-request/test-token";

    it("keeps a header and footer but no link out of the page", () => {
      const markup = renderLayoutAt(INTAKE_PATH);

      expect(markup).toContain("page content");
      expect(markup).toContain("<header");
      expect(markup).toContain("<footer");
      const hrefs = [...markup.matchAll(/href="([^"]*)"/g)].map(
        ([, href]) => href,
      );
      // Only the skip link, which stays on the page
      expect(hrefs).toEqual(["#main-content"]);
      expect(markup).not.toContain("<nav");
    });

    it("shows the logo and the contact details as plain text", () => {
      const markup = renderLayoutAt(INTAKE_PATH);

      expect(markup).toContain("<svg");
      expect(markup).toContain("© 2026 Boximity MSP");
      expect(markup).toContain("hi@boximity.ca");
      expect(markup).toContain(COMPANY_PHONE_DISPLAY);
      expect(markup).not.toContain("mailto:");
      expect(markup).not.toContain("tel:");
    });

    it("keeps the full chrome on a path that is not a service request page", () => {
      expect(renderLayoutAt("/service-request")).toContain("<nav");
    });
  });
});

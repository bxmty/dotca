import { render } from "@testing-library/react";
import GoogleAnalytics from "@/app/components/GoogleAnalytics";
import { pageview } from "@/lib/gtag";

jest.mock("@/lib/gtag", () => ({ initGA: jest.fn(), pageview: jest.fn() }));

const navigation = { pathname: "/", search: "" };
jest.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

describe("GoogleAnalytics on the SDR console", () => {
  beforeEach(() => jest.mocked(pageview).mockClear());

  it.each(["/security-assessment/call", "/security-assessment/call/present"])(
    "sends no page view for %s, so a token never reaches GA",
    (pathname) => {
      navigation.pathname = pathname;
      navigation.search = "t=secret-token";

      render(<GoogleAnalytics />);

      expect(pageview).not.toHaveBeenCalled();
    },
  );

  it("still tracks the public assessment with its query", () => {
    navigation.pathname = "/security-assessment";
    navigation.search = "utm_source=mail";

    render(<GoogleAnalytics />);

    expect(pageview).toHaveBeenCalledWith(
      "/security-assessment?utm_source=mail",
    );
  });
});

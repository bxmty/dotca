import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import Footer from "@/app/components/Footer";

const ORIGINAL_COMMIT_HASH = process.env.NEXT_PUBLIC_COMMIT_HASH;

afterEach(() => {
  if (ORIGINAL_COMMIT_HASH === undefined) {
    delete process.env.NEXT_PUBLIC_COMMIT_HASH;
  } else {
    process.env.NEXT_PUBLIC_COMMIT_HASH = ORIGINAL_COMMIT_HASH;
  }
});

describe("Footer band", () => {
  it("is an oxford band in both modes, with the cultured lockup", () => {
    render(<Footer />);

    const footer = screen.getByRole("contentinfo");
    // bg-band is scheme-independent and re-points --logo and --fig
    // (focus rings) at the band tokens; see globals.css.
    expect(footer).toHaveClass("bg-band", "text-band-ink");
    expect(within(footer).getByRole("img", { name: "Boximity" })).toHaveClass(
      "text-logo",
    );
  });

  it("groups links into Services, Company and Legal columns", () => {
    render(<Footer />);

    const nav = screen.getByRole("navigation", { name: "Footer" });
    const groups = within(nav).getAllByRole("list");
    expect(groups).toHaveLength(3);
    expect(nav).toHaveTextContent(/Services.*Company.*Legal/);

    expect(
      within(nav).getByRole("link", { name: "Managed IT, Ontario" }),
    ).toHaveAttribute("href", "/services/managed-it-services-ontario");
    expect(
      within(nav).getByRole("link", { name: "Architecture firms" }),
    ).toHaveAttribute("href", "/services/it-services-for-architecture-firms");
    expect(
      within(nav).getByRole("link", { name: "Privacy policy" }),
    ).toHaveAttribute("href", "/privacy-policy");
    expect(
      within(nav).getByRole("link", { name: "Terms of service" }),
    ).toHaveAttribute("href", "/terms-of-service");
    expect(within(nav).getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/company/19035825/",
    );
  });

  it("shows the short build hash in band-fig when one was built in", () => {
    process.env.NEXT_PUBLIC_COMMIT_HASH =
      "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678";
    render(<Footer />);

    const build = screen.getByText("Build a1b2c3d");
    expect(build.closest(".text-band-fig")).not.toBeNull();
  });

  it("omits the build hash when none was built in", () => {
    delete process.env.NEXT_PUBLIC_COMMIT_HASH;
    render(<Footer />);

    expect(screen.queryByText(/^Build /)).not.toBeInTheDocument();
  });
});

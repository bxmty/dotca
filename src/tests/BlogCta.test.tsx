import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import BlogCta from "@/app/components/BlogCta";

const ASSESSMENT_LABEL = "Get a Business-First IT Assessment";

describe("BlogCta", () => {
  it("links an omitted cta to the assessment booking page", () => {
    render(<BlogCta />);

    const link = screen.getByRole("link", { name: ASSESSMENT_LABEL });
    expect(link).toHaveAttribute("href", "/book");
  });

  it("links an assessment cta to the assessment booking page", () => {
    render(<BlogCta offer={{ type: "assessment" }} />);

    const link = screen.getByRole("link", { name: ASSESSMENT_LABEL });
    expect(link).toHaveAttribute("href", "/book");
  });

  it("draws the assessment end CTA as the unbox button, the lead magnet as a plain one", () => {
    const { unmount } = render(<BlogCta />);
    expect(screen.getByText("opens Bookings")).toBeInTheDocument();
    unmount();

    render(
      <BlogCta
        offer={{
          type: "lead-magnet",
          slug: "x",
          title: "A guide",
          assetLabel: "Get the guide",
        }}
      />,
    );
    expect(screen.queryByText("opens Bookings")).not.toBeInTheDocument();
  });

  it("renders a rule-topped end block with a heading", () => {
    render(<BlogCta />);

    const block = screen.getByRole("complementary", { name: "Next step" });
    expect(block).toHaveClass("border-t-2", "border-ink");
    expect(
      within(block).getByRole("heading", {
        name: "Want a second pair of eyes on your setup?",
      }),
    ).toBeInTheDocument();
  });

  it("renders nothing when the cta is suppressed", () => {
    const { container } = render(<BlogCta offer={{ type: "none" }} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("offers a lead magnet under its title with its own button label", () => {
    render(
      <BlogCta
        offer={{
          type: "lead-magnet",
          slug: "cyber-insurance-readiness-checklist",
          title: "Cyber insurance readiness checklist",
          assetLabel: "Get the checklist",
        }}
      />,
    );

    const block = screen.getByRole("complementary", { name: "Next step" });
    expect(
      within(block).getByRole("heading", {
        name: "Cyber insurance readiness checklist",
      }),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Get the checklist" });
    expect(link).toHaveAttribute(
      "href",
      "/resources/cyber-insurance-readiness-checklist",
    );
  });

  it("labels a lead magnet without its own button text with the default", () => {
    render(
      <BlogCta
        offer={{
          type: "lead-magnet",
          slug: "backup-checklist",
          title: "Backup checklist",
        }}
      />,
    );

    const link = screen.getByRole("link", { name: "Download the guide" });
    expect(link).toHaveAttribute("href", "/resources/backup-checklist");
  });
});

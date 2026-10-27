import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import SecurityChecklistPage from "@/app/security-assessment/checklist/page";
import { securityChecklistItems } from "@/app/security-assessment/checklist/checklist-items";
import { metadata } from "@/app/security-assessment/checklist/metadata";

describe("Security checklist page", () => {
  it("renders all ten checklist items in priority order with details", () => {
    render(<SecurityChecklistPage />);

    const list = screen.getByRole("list");
    expect(list.tagName).toBe("OL");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(10);

    securityChecklistItems.forEach((checklistItem, index) => {
      const listItem = items[index];
      expect(
        within(listItem).getByRole("heading", {
          level: 3,
          name: checklistItem.title,
        }),
      ).toBeInTheDocument();
      expect(within(listItem).getByText(checklistItem.detail)).toBeInTheDocument();
    });
  });

  it("is ungated: no email field or download gate", () => {
    render(<SecurityChecklistPage />);

    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /download/i }),
    ).not.toBeInTheDocument();
  });

  it("offers a free consultation call to action", () => {
    render(<SecurityChecklistPage />);

    expect(
      screen.getByRole("link", { name: /book a free consultation/i }),
    ).toHaveAttribute("href", "/#contact");
  });

  it("carries page metadata with canonical URL and social fields", () => {
    expect(metadata).toMatchObject({
      title: "The 10-Point Small Business Security Checklist",
      description: expect.stringContaining("ten highest-impact"),
      alternates: { canonical: "/security-assessment/checklist" },
      openGraph: expect.objectContaining({
        url: "/security-assessment/checklist",
        title: expect.any(String),
        description: expect.any(String),
      }),
    });
  });
});

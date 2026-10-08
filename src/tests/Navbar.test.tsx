import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { usePathname } from "next/navigation";
import Navbar from "@/app/components/Navbar";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
}));

const mockUsePathname = usePathname as jest.Mock;

beforeEach(() => {
  mockUsePathname.mockReturnValue("/");
});

function getPrimaryNav() {
  return screen.getByRole("navigation", { name: "Main" });
}

describe("Navbar mobile toggle", () => {
  it("toggles aria-expanded and label between Menu and Close", () => {
    render(<Navbar />);
    const toggle = screen.getByRole("button", { name: "Menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "navbarNav");

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Close" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("closes the panel when a nav link is clicked", () => {
    render(<Navbar />);
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(screen.getByRole("link", { name: "Blog" }));
    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("closes the panel when the CTA is clicked", () => {
    render(<Navbar />);
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(
      screen.getByRole("link", { name: "Get a Business-First IT Assessment" }),
    );
    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("hides the panel on phones until it is opened", () => {
    render(<Navbar />);
    const panel = document.getElementById("navbarNav");
    expect(panel).toHaveClass("hidden", "md:flex");

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(panel).not.toHaveClass("hidden");
  });
});

describe("Navbar brand", () => {
  it("links home through the Boximity logo", () => {
    render(<Navbar />);

    const home = screen.getByRole("link", { name: "Boximity" });
    expect(home).toHaveAttribute("href", "/");
    expect(
      within(home).getByRole("img", { name: "Boximity" }),
    ).toBeInTheDocument();
  });
});

describe("Navbar links", () => {
  it("shows exactly four links, with Contact the only jump to a home section", () => {
    render(<Navbar />);

    const list = within(getPrimaryNav()).getByRole("list");
    const links = within(list).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Services",
      "Pricing",
      "Blog",
      "Contact",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/services/managed-it-services-ontario",
      "/pricing",
      "/blog",
      "/#contact",
    ]);
  });

  it("has one primary CTA to the assessment booking", () => {
    render(<Navbar />);

    const cta = within(getPrimaryNav()).getByRole("link", {
      name: "Get a Business-First IT Assessment",
    });
    expect(cta).toHaveAttribute("href", "/book");
    expect(cta).toHaveClass("bg-cta");
  });
});

describe("Navbar current page", () => {
  it.each([
    ["/pricing", "Pricing"],
    ["/blog", "Blog"],
    ["/blog/some-post", "Blog"],
    ["/services/managed-it-services-ontario", "Services"],
    ["/services/it-services-for-architecture-firms", "Services"],
  ])("marks %s as the %s page", (pathname, label) => {
    mockUsePathname.mockReturnValue(pathname);
    render(<Navbar />);

    const links = within(getPrimaryNav()).getAllByRole("link");
    const current = links.filter((link) => link.hasAttribute("aria-current"));
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent(label);
    expect(current[0]).toHaveAttribute("aria-current", "page");
  });

  it.each(["/", "/checkout", "/blogroll"])(
    "marks no link current on %s",
    (pathname) => {
      mockUsePathname.mockReturnValue(pathname);
      render(<Navbar />);

      const links = within(getPrimaryNav()).getAllByRole("link");
      expect(links.some((link) => link.hasAttribute("aria-current"))).toBe(
        false,
      );
    },
  );

  it("marks no link current when the pathname is unknown", () => {
    mockUsePathname.mockReturnValue(null);
    render(<Navbar />);

    const links = within(getPrimaryNav()).getAllByRole("link");
    expect(links.some((link) => link.hasAttribute("aria-current"))).toBe(false);
  });
});

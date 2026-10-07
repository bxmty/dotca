import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import ThemeSync from "@/app/components/ThemeSync";

describe("ThemeSync", () => {
  const originalMatchMedia = window.matchMedia;
  let handler: ((e: { matches: boolean }) => void) | undefined;
  const removeEventListener = jest.fn();

  beforeEach(() => {
    handler = undefined;
    removeEventListener.mockClear();
    document.documentElement.removeAttribute("data-bs-theme");
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: (_: string, h: typeof handler) => {
        handler = h;
      },
      removeEventListener,
    }));
  });

  afterAll(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("renders nothing and leaves the initial theme to the pre-paint script", () => {
    const { container } = render(<ThemeSync />);
    expect(container.firstChild).toBeNull();
    expect(document.documentElement).not.toHaveAttribute("data-bs-theme");
  });

  it("does not add a bootstrap-loaded class", () => {
    render(<ThemeSync />);
    expect(document.body).not.toHaveClass("bootstrap-loaded");
  });

  it("updates data-bs-theme when the OS preference changes", () => {
    render(<ThemeSync />);
    handler?.({ matches: true });
    expect(document.documentElement).toHaveAttribute("data-bs-theme", "dark");
    handler?.({ matches: false });
    expect(document.documentElement).toHaveAttribute("data-bs-theme", "light");
  });

  it("removes the listener on unmount", () => {
    const { unmount } = render(<ThemeSync />);
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith("change", handler);
  });
});

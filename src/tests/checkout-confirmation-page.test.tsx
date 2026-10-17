import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import CheckoutConfirmationPage from "@/app/checkout/confirmation/page";

// Render the async server component with the given redirect_status
async function renderConfirmation(redirectStatus?: string) {
  const page = await CheckoutConfirmationPage({
    searchParams: Promise.resolve(
      redirectStatus ? { redirect_status: redirectStatus } : {},
    ),
  });
  return render(page);
}

describe("Checkout Confirmation Page", () => {
  it("shows a success message when the payment succeeded", async () => {
    await renderConfirmation("succeeded");

    expect(
      screen.getByRole("heading", { name: /payment successful/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("shows a processing message while the payment is pending", async () => {
    await renderConfirmation("processing");

    expect(
      screen.getByRole("heading", { name: /payment processing/i }),
    ).toBeInTheDocument();
  });

  it("offers a retry link when the payment failed", async () => {
    await renderConfirmation("requires_payment_method");

    expect(
      screen.getByRole("heading", { name: /payment unsuccessful/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /return to checkout/i }),
    ).toHaveAttribute("href", "/checkout");
  });

  it("shows a generic confirmation when no redirect status is present", async () => {
    await renderConfirmation();

    expect(
      screen.getByRole("heading", { name: /order received/i }),
    ).toBeInTheDocument();
  });
});

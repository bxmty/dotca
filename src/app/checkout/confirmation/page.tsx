import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Confirmation",
  description: "Confirmation of your Boximity MSP payment.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/checkout/confirmation",
  },
};

interface PageProps {
  searchParams: Promise<{ redirect_status?: string }>;
}

interface ConfirmationContent {
  heading: string;
  message: string;
  showRetry: boolean;
}

// Stripe redirects back with redirect_status describing the payment outcome
function getConfirmationContent(
  redirectStatus: string | undefined,
): ConfirmationContent {
  switch (redirectStatus) {
    case "succeeded":
      return {
        heading: "Payment Successful",
        message:
          "Thank you for your purchase! A receipt has been sent to your email address. Our team will reach out shortly to get you onboarded.",
        showRetry: false,
      };
    case "processing":
      return {
        heading: "Payment Processing",
        message:
          "Your payment is being processed. We will email you a confirmation as soon as it completes — no further action is needed.",
        showRetry: false,
      };
    case "requires_payment_method":
    case "failed":
      return {
        heading: "Payment Unsuccessful",
        message:
          "Your payment could not be completed. No charge was made. Please return to checkout and try again with a different payment method.",
        showRetry: true,
      };
    default:
      return {
        heading: "Order Received",
        message:
          "We have received your order. If you do not receive a confirmation email shortly, please contact us at hi@boximity.ca or (289) 539-0098.",
        showRetry: false,
      };
  }
}

export default async function CheckoutConfirmationPage({
  searchParams,
}: PageProps) {
  const { redirect_status: redirectStatus } = await searchParams;
  const { heading, message, showRetry } =
    getConfirmationContent(redirectStatus);

  return (
    <div className="min-vh-100 d-flex flex-column">
      <header className="py-4 px-3 px-md-5 d-flex align-items-center justify-content-between">
        <Link
          href="/"
          className="fs-4 fw-semibold text-decoration-none text-body"
        >
          boximity msp
        </Link>
      </header>

      <section className="py-5 py-md-7 flex-grow-1">
        <div className="container text-center">
          <h1 className="fs-1 fw-light mb-4 border-bottom pb-3">{heading}</h1>
          <p className="lead text-body-secondary mb-4">{message}</p>
          {showRetry ? (
            <Link href="/checkout" className="btn btn-dark px-4 py-2">
              Return to Checkout
            </Link>
          ) : (
            <Link href="/" className="btn btn-dark px-4 py-2">
              Back to Home
            </Link>
          )}
        </div>
      </section>

      <footer className="py-4 py-md-5 border-top mt-auto">
        <div className="container text-center">
          <div className="fs-4 fw-semibold mb-2">boximity msp</div>
          <p className="small text-body-secondary mb-0">
            © 2025 boximity msp. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

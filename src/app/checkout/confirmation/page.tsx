import type { Metadata } from "next";
import { ButtonLink } from "../../components/Button";
import StatusNote from "../../components/StatusNote";
import StatusPage from "../../components/StatusPage";

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

  // A failed payment is the one outcome drawn as an error status (danger is
  // for field errors and failed payments only); the others read as copy.
  return (
    <StatusPage
      kicker="Checkout"
      heading={heading}
      action={
        showRetry ? (
          <ButtonLink variant="secondary" href="/checkout">
            Return to Checkout
          </ButtonLink>
        ) : (
          <ButtonLink variant="secondary" href="/">
            Back to Home
          </ButtonLink>
        )
      }
    >
      {showRetry ? (
        <StatusNote tone="error" label="Error">
          <p className="m-0 text-ink">{message}</p>
        </StatusNote>
      ) : (
        <p className="m-0">{message}</p>
      )}
    </StatusPage>
  );
}

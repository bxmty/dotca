import type { Metadata } from "next";
import CallPresenter from "../CallPresenter";

export const metadata: Metadata = {
  title: "Security assessment",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
  // The parent layout points these at the public quiz.
  alternates: { canonical: null },
  openGraph: null,
};

/**
 * The tab an SDR shares. It takes no token and no props, and doesn't look at
 * the session cookie that reaches it: everything shown arrives from the console.
 */
export default function PresenterPage() {
  return <CallPresenter />;
}

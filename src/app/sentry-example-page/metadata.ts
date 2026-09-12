import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sentry Example Page",
  description:
    "Internal Sentry verification route. Not a product page and not indexed.",
  robots: {
    index: false,
    follow: false,
  },
};

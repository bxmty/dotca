"use client";

import ErrorNotice from "./components/ErrorNotice";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorNotice error={error} retry={retry} />;
}

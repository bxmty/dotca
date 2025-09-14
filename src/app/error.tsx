'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container text-center my-5">
      <h2>Something went wrong!</h2>
      <button
        className="btn btn-primary mt-3"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
"use client";

import { useSdrCallSession } from "./SdrCallSession";

/** Placeholder until the call console is built (#714). */
export default function CallConsole() {
  const { sdrName } = useSdrCallSession();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-semibold">Discovery call console</h1>
      <p className="mt-4">Signed in as {sdrName}.</p>
    </div>
  );
}

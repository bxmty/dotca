import type { CallState } from "./callState";

const CALL_STORAGE_KEY = "sdr-call";

// Every access tolerates storage being unavailable (private windows, blocked
// site data): the call then just doesn't survive a reload.

/** The stored call, unvalidated, or null. */
export function readStoredCall(): unknown {
  try {
    const stored = window.sessionStorage.getItem(CALL_STORAGE_KEY);
    return stored === null ? null : JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Of the save's progress, keeps only that one may have left this tab: restored,
 * a save still sending has been cut off, and may have reached Syncro anyway.
 */
export function storeCall(call: CallState): void {
  const mayHaveSaved =
    call.save.status === "sending" || call.save.status === "interrupted";
  try {
    window.sessionStorage.setItem(
      CALL_STORAGE_KEY,
      JSON.stringify({
        ...call,
        save: mayHaveSaved ? { status: "interrupted" } : undefined,
      }),
    );
  } catch {
    // Nothing to do; see above
  }
}

export function clearStoredCall(): void {
  try {
    window.sessionStorage.removeItem(CALL_STORAGE_KEY);
  } catch {
    // Nothing to do; see above
  }
}

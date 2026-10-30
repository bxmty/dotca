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

/** The save's progress isn't kept: a resumed call hasn't been saved. */
export function storeCall(call: CallState): void {
  try {
    window.sessionStorage.setItem(
      CALL_STORAGE_KEY,
      JSON.stringify({ ...call, save: undefined }),
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

import { useEffect, useReducer, useRef, useState } from "react";
import type { SdrCallLeadResponse } from "@/lib/security-assessment/sdrTypes";
import {
  buildCallLeadRequest,
  INITIAL_CALL,
  isCallLocked,
  parseStoredCall,
  reduceCall,
  type CallAction,
  type CallContent,
  type CallState,
} from "./callState";
import { clearStoredCall, readStoredCall, storeCall } from "./callStorage";

const SAVE_ERROR_MESSAGE = "The call didn't save. Please try again.";
const SESSION_ENDED_MESSAGE =
  "Your session has ended, so the call didn't save. Open your SDR link again in this tab: everything you've entered will come back.";

type CallPostOutcome = { isSaved: true } | { isSaved: false; message: string };

async function postCall(body: unknown): Promise<CallPostOutcome> {
  const failWith = (message: string): CallPostOutcome => ({
    isSaved: false,
    message,
  });
  try {
    const response = await fetch("/api/security-assessment/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.status === 401) return failWith(SESSION_ENDED_MESSAGE);
    const responseBody: SdrCallLeadResponse = await response
      .json()
      .catch(() => ({ error: SAVE_ERROR_MESSAGE }));
    if (response.ok && "success" in responseBody) return { isSaved: true };
    return failWith(
      "error" in responseBody ? responseBody.error : SAVE_ERROR_MESSAGE,
    );
  } catch {
    return failWith(SAVE_ERROR_MESSAGE);
  }
}

/** The call: its reducer, its survival in sessionStorage, and saving it. */
export function useCallSession(content: CallContent) {
  const [state, dispatch] = useReducer(
    (current: CallState, action: CallAction) =>
      reduceCall(content, current, action),
    INITIAL_CALL,
  );
  const hasAttemptedRestore = useRef(false);
  const [isRestored, setIsRestored] = useState(false);

  // After mount, so the server's and the first client render agree
  useEffect(() => {
    if (hasAttemptedRestore.current) return;
    hasAttemptedRestore.current = true;
    const call = parseStoredCall(content, readStoredCall());
    if (call) dispatch({ type: "restore", call });
    setIsRestored(true);
  }, [content]);

  useEffect(() => {
    if (state === INITIAL_CALL || state.save.status === "saved") {
      clearStoredCall();
    } else {
      storeCall(state);
    }
  }, [state]);

  const handleSave = async () => {
    if (isCallLocked(state)) return;
    dispatch({ type: "saveStarted" });
    const outcome = await postCall(buildCallLeadRequest(content, state));
    dispatch(
      outcome.isSaved
        ? { type: "saveSucceeded" }
        : { type: "saveFailed", message: outcome.message },
    );
  };

  return { state, dispatch, isRestored, handleSave };
}

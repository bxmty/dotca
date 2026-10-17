"use client";

import { useState, FormEvent } from "react";
import { Button, getButtonClassName } from "./Button";
import { TextField } from "./Field";
import StatusNote from "./StatusNote";
import {
  INCOMPLETE_EMAIL_MESSAGE,
  isEmailAddress,
} from "../../lib/formValidation";

// The content model's default download label (LeadMagnetFrontmatter.assetLabel).
const DEFAULT_ASSET_LABEL = "Download the guide";
const EMAIL_FIELD_ID = "lead-magnet-email";
const BRIEF_FIELD_ID = "lead-magnet-brief";

interface LeadMagnetGateProps {
  slug: string;
  title: string;
  assetLabel?: string;
}

/**
 * The email gate in front of a lead magnet. Deliberately lighter than
 * ContactForm: an email, the same `website` honeypot, and one unchecked
 * opt-in — no name or phone. On success it unlocks the download link in
 * place; the delivery email is the durable copy.
 */
export default function LeadMagnetGate({
  slug,
  title,
  assetLabel = DEFAULT_ASSET_LABEL,
}: LeadMagnetGateProps) {
  const [email, setEmail] = useState("");
  const [wantsBrief, setWantsBrief] = useState(false);
  // Honeypot: humans never see this field; bots that fill it are dropped
  const [website, setWebsite] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const fieldError = !email.trim()
      ? "enter your email address"
      : !isEmailAddress(email)
        ? INCOMPLETE_EMAIL_MESSAGE
        : undefined;
    setEmailError(fieldError);
    if (fieldError) {
      setErrorMessage("");
      document.getElementById(EMAIL_FIELD_ID)?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/lead-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email, website, wantsBrief }),
      });
      const responseData = await response.json().catch(() => null);

      if (!response.ok || !responseData?.downloadUrl) {
        throw new Error(
          responseData?.error ??
            "Something went wrong. Please try again in a moment.",
        );
      }

      setDownloadUrl(responseData.downloadUrl);
    } catch (error) {
      console.error("Lead magnet submission error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again in a moment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (downloadUrl) {
    return (
      <section
        className="grid max-w-[560px] content-start gap-4.5"
        aria-label={`Download ${title}`}
      >
        <StatusNote tone="ok" label="Unlocked">
          <p className="m-0">Your copy of {title} is ready.</p>
        </StatusNote>
        <a
          href={downloadUrl}
          className={getButtonClassName({ variant: "primary", isBlock: true })}
        >
          {assetLabel}
        </a>
        <p className="m-0 text-small text-muted">We also emailed you a copy.</p>
      </section>
    );
  }

  return (
    <form
      className="grid max-w-[560px] content-start gap-4.5"
      onSubmit={handleSubmit}
      noValidate
      aria-label={`Get ${title}`}
    >
      {errorMessage && (
        <StatusNote tone="error" label="Error">
          {errorMessage}
        </StatusNote>
      )}

      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", opacity: 0 }}
      >
        <label htmlFor="lead-magnet-website">Website</label>
        <input
          type="text"
          id="lead-magnet-website"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <TextField
        id={EMAIL_FIELD_ID}
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setEmailError(undefined);
        }}
        required
        error={emailError}
      />
      <div className="flex items-start gap-2.5 text-small">
        <input
          type="checkbox"
          id={BRIEF_FIELD_ID}
          name="wantsBrief"
          checked={wantsBrief}
          onChange={(e) => setWantsBrief(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-fig"
        />
        <label htmlFor={BRIEF_FIELD_ID}>
          Send me Boximity&apos;s monthly security brief
        </label>
      </div>
      <Button type="submit" variant="primary" isBlock disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : assetLabel}
      </Button>
    </form>
  );
}

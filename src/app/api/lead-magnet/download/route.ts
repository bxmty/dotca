import { Buffer } from "node:buffer";
import fs from "fs";
import path from "path";
import * as Sentry from "@sentry/nextjs";
import {
  getLeadMagnetAssetsDir,
  getLeadMagnetBySlug,
} from "@/lib/lead-magnets";
import { verifyLeadMagnetToken } from "@/lib/lead-magnet-token";

// Every request checks a time-limited token, so never cache or prerender.
export const dynamic = "force-dynamic";

const NO_STORE = "private, no-store";

function linkExpiredResponse(slug: string): Response {
  // Reached by clicking a link in an email, so answer with a page a person can
  // act on rather than JSON. slug has already passed the loader's slug guard.
  const resourcePath = `/resources/${slug}`;
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Download link expired</title></head>
<body>
<h1>This download link has expired</h1>
<p>Download links last 24 hours. <a href="${resourcePath}">Re-enter your email</a> and we'll send you a fresh one.</p>
</body>
</html>`;
  return new Response(html, {
    status: 403,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": NO_STORE,
    },
  });
}

function logDownload(slug: string): void {
  // Feeds the weekly numbers. Slug and time only — never the email or token.
  try {
    console.log(
      JSON.stringify({
        event: "lead_magnet_download",
        slug,
        timestamp: new Date().toISOString(),
      }),
    );
  } catch {
    // Logging must never fail the download.
  }
}

export function GET(request: Request): Response {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") ?? "";
  const token = searchParams.get("token") ?? "";

  const magnet = getLeadMagnetBySlug(slug);
  if (!magnet) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let verification;
  try {
    verification = verifyLeadMagnetToken({ slug, token });
  } catch (error) {
    const detail = `Lead magnet download unavailable: ${(error as Error).message}`;
    console.error(detail);
    Sentry.captureMessage(detail, "error");
    return Response.json(
      {
        error: "Downloads are temporarily unavailable. Please try again later.",
      },
      { status: 503 },
    );
  }

  if (!verification.isValid) {
    return linkExpiredResponse(slug);
  }

  const { assetFile } = magnet.frontmatter;
  let pdf: Buffer;
  try {
    pdf = fs.readFileSync(path.join(getLeadMagnetAssetsDir(), assetFile));
  } catch (error) {
    console.error(`Lead magnet asset missing for ${slug}:`, error);
    Sentry.captureException(error);
    return Response.json(
      { error: "Failed to load the download" },
      { status: 500 },
    );
  }

  const response = new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${assetFile}"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": NO_STORE,
      "X-Robots-Tag": "noindex",
    },
  });
  logDownload(slug);
  return response;
}

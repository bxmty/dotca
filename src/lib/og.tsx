import { ImageResponse } from "next/og";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_CONTENT_TYPE = "image/png";

/**
 * Render a branded 1200x630 social card. Used by the opengraph-image file
 * conventions so every shared link gets a consistent, correctly sized image
 * instead of the mixed-aspect photos used on the pages themselves.
 */
export function renderOgImage(options: {
  title: string;
  eyebrow: string;
  footer?: string;
}) {
  const { title, eyebrow, footer } = options;
  const titleFontSize = title.length > 80 ? 44 : title.length > 50 ? 52 : 64;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        backgroundColor: "#212529",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: 28,
          color: "#8bb9fe",
          letterSpacing: 1,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: titleFontSize,
          fontWeight: 300,
          lineHeight: 1.2,
          maxWidth: 1000,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 26,
          color: "#adb5bd",
          borderTop: "1px solid #495057",
          paddingTop: 28,
        }}
      >
        <div style={{ display: "flex" }}>{footer ?? "boximity.ca"}</div>
        <div style={{ display: "flex", color: "#ffffff", fontWeight: 500 }}>
          Boximity MSP
        </div>
      </div>
    </div>,
    OG_IMAGE_SIZE,
  );
}

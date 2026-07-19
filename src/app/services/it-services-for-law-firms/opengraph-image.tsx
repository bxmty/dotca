import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderOgImage,
} from "@/lib/og";

export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;
export const alt = "IT Services for Law Firms - Boximity MSP";

export default function Image() {
  return renderOgImage({
    eyebrow: "SERVICES",
    title: "IT Services for Law Firms",
    footer: "Cloud 5 Pack from $1,250/month",
  });
}

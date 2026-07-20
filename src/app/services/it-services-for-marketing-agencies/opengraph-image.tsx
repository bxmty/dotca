import { OG_IMAGE_CONTENT_TYPE, OG_IMAGE_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;
export const alt = "IT Services for Marketing Agencies - Boximity MSP";

export default function Image() {
  return renderOgImage({
    eyebrow: "SERVICES",
    title: "IT Services for Marketing Agencies",
    footer: "Cloud 5 Pack from $1,250/month",
  });
}

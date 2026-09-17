import { ImageResponse } from "next/og";

import { SocialPreview } from "@/components/branding/SocialPreview";
import { SOCIAL_IMAGE_ALT } from "@/lib/config";

export const alt = SOCIAL_IMAGE_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<SocialPreview />, size);
}

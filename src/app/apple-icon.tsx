import { ImageResponse } from "next/og";

import { BRAND_COLORS } from "@/lib/config";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 36,
        background: BRAND_COLORS.canvas,
      }}
    >
      <div
        style={{
          width: 132,
          height: 132,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {[BRAND_COLORS.yellow, BRAND_COLORS.green, BRAND_COLORS.blue, BRAND_COLORS.purple].map(
          (color) => (
            <div
              key={color}
              style={{
                width: 60,
                height: 60,
                display: "flex",
                borderRadius: 16,
                background: color,
              }}
            />
          ),
        )}
      </div>
    </div>,
    size,
  );
}

import { APP_NAME, APP_TAGLINE, BRAND_COLORS } from "@/lib/config";

const tileColors = [
  BRAND_COLORS.yellow,
  BRAND_COLORS.green,
  BRAND_COLORS.blue,
  BRAND_COLORS.purple,
] as const;

export function SocialPreview() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 56,
        padding: "64px 72px",
        background: BRAND_COLORS.canvas,
        color: BRAND_COLORS.ink,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: 560,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "0.12em",
          }}
        >
          {APP_NAME.toUpperCase()}
          <span style={{ color: BRAND_COLORS.mutedInk }}>· GÜNLÜK BULMACA</span>
        </div>

        <div
          style={{
            marginTop: 34,
            display: "flex",
            flexDirection: "column",
            fontSize: 62,
            lineHeight: 1.02,
            fontWeight: 800,
            letterSpacing: "-0.045em",
          }}
        >
          <span>16 kelime.</span>
          <span>4 gizli bağ.</span>
        </div>

        <div
          style={{
            marginTop: 26,
            width: 480,
            color: BRAND_COLORS.mutedInk,
            fontSize: 24,
            lineHeight: 1.45,
          }}
        >
          {APP_TAGLINE}
        </div>
      </div>

      <div
        aria-hidden="true"
        style={{
          width: 420,
          height: 420,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          padding: 18,
          border: `2px solid #DED8CE`,
          borderRadius: 34,
          background: BRAND_COLORS.surface,
          boxShadow: "0 24px 70px rgba(32, 36, 45, 0.12)",
        }}
      >
        {Array.from({ length: 16 }, (_, index) => (
          <div
            key={index}
            style={{
              width: 84,
              height: 84,
              display: "flex",
              borderRadius: 18,
              background: tileColors[Math.floor(index / 4)] ?? BRAND_COLORS.surface,
              opacity: 0.9,
            }}
          />
        ))}
      </div>
    </div>
  );
}

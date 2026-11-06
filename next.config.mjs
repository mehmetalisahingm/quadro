/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Minimal defense-in-depth headers. Do not set a restrictive CSP here without
  // testing Next.js inline scripts and the Supabase authentication redirect.
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },

  // Günlük bulmacalar istek anında dosya sisteminden okunur (Q19,
  // `src/lib/daily/dailyPuzzle.ts`). Bu okuma dinamik olduğu için Next'in modül
  // izlemesi dosyaları kendiliğinden göremez; yayın stoğu sunucu çıktısına burada
  // açıkça eklenir. Yalnız `src/content/puzzles/` eklenir: editoryal kayıtlar ve kör
  // tahtalar sunucuya da gitmez. İçeriğin istemci paketine sızmadığı ayrıca
  // `npm run check:bundle` ile denetlenir.
  outputFileTracingIncludes: {
    "/journey/step": ["./src/content/journey/*.json"],
    "/pictures/board": ["./src/content/pictures/*.json"],
    "/api/health": ["./src/content/puzzles/*.json", "./src/content/modes/*.json"],
    "/": ["./src/content/puzzles/*.json", "./src/content/modes/*.json"],
    "/play": ["./src/content/puzzles/*.json", "./src/content/modes/*.json"],
  },
};

export default nextConfig;

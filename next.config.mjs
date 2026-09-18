/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Günlük bulmacalar istek anında dosya sisteminden okunur (Q19,
  // `src/lib/daily/dailyPuzzle.ts`). Bu okuma dinamik olduğu için Next'in modül
  // izlemesi dosyaları kendiliğinden göremez; yayın stoğu sunucu çıktısına burada
  // açıkça eklenir. Yalnız `src/content/puzzles/` eklenir: editoryal kayıtlar ve kör
  // tahtalar sunucuya da gitmez. İçeriğin istemci paketine sızmadığı ayrıca
  // `npm run check:bundle` ile denetlenir.
  outputFileTracingIncludes: {
    "/play": ["./src/content/puzzles/*.json"],
  },
};

export default nextConfig;

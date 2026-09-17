/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Varsayılan dizinlere ek olarak akış regresyon testleri (tests/e2e) de denetlenir.
    dirs: ["src", "tests"],
  },
};

export default nextConfig;

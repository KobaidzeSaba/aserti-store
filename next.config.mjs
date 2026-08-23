/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't bundle these into the serverless function — bundling breaks `ws`'s
  // frame masking ("t.mask is not a function"). Loading them from node_modules
  // at runtime keeps the Neon WebSocket driver working.
  experimental: {
    serverComponentsExternalPackages: [
      "@neondatabase/serverless",
      "@prisma/adapter-neon",
      "ws",
    ],
  },
  images: {
    // Allow remote product images if you later host them on a CDN.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;

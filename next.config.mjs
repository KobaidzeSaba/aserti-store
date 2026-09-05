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
    // All images are served from /public. No remote hosts are allowed, so the
    // image optimizer can't be abused as an open proxy for arbitrary URLs.
    // To use a CDN later, add its exact hostname here.
    remotePatterns: [],
  },
  async headers() {
    // Baseline security headers applied to every response.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

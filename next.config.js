const { headers } = require("next/headers");

/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  // enabled: process.env.ANALYZE === 'true',
});
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      { hostname: "firebasestorage.googleapis.com" },
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "ik.imagekit.io" },
      { hostname: "res.cloudinary.com" },
      { hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
// module.exports = withBundleAnalyzer(nextConfig)

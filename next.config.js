/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    remotePatterns: [
      { hostname: "firebasestorage.googleapis.com" },
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "ik.imagekit.io" },
      { hostname: "res.cloudinary.com" },
    ],
  },
};

module.exports = nextConfig;

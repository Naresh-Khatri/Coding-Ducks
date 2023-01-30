/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      "firebasestorage.googleapis.com",
      "lh3.googleusercontent.com",
      "ik.imagekit.io",
      "res.cloudinary.com",
    ],
  },
};

module.exports = nextConfig;

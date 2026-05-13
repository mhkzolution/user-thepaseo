/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  distDir: ".next",

  turbopack: {
    root: path.resolve(__dirname),
  },

  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox;",

    remotePatterns: [
      {
        protocol: "https",
        hostname: "profile.line-scdn.net",
      },
      {
        protocol: "https",
        hostname: "member.thepaseo.co.th",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "admin.thepaseo.co.th",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "user.thepaseo.co.th",
        pathname: "/**",
      },
    ],
  },

  trailingSlash: false,
};

module.exports = nextConfig;
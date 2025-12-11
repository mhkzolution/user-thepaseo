/** @type {import('next').NextConfig} */
const nextConfig = {
  // บังคับปิด turbopack build engine
  experimental: {
    turbo: {
      resolveAlias: {},
      rules: {},
    },
  },

  // อาจต้องใส่
  distDir: ".next",

  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "thepaseo.co.th",
      },
      {
        protocol: "https",
        hostname: "profile.line-scdn.net",
      },
    ],
  },
};

module.exports = nextConfig;

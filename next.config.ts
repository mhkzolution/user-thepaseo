/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: ".next",

  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "profile.line-scdn.net",
      },
      {
        protocol: "https",
        hostname: "member.thepaseo.co.th",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "admin.thepaseo.co.th",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "user.thepaseo.co.th",
        port: "",
        pathname: "/**",
      },
    ],
  },

  trailingSlash: false,
};

module.exports = nextConfig;


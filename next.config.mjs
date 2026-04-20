/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },
  serverExternalPackages: ["@node-rs/argon2"],
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        // Legacy utfs.io CDN — keep for existing stored URLs
        protocol: "https",
        hostname: "utfs.io",
        pathname: `/a/x083086k6k/*`,
      },
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: `/f/*`,
      },
      {
        // Current ufs.sh CDN — file.ufsUrl returns this format
        protocol: "https",
        hostname: `x083086k6k.ufs.sh`,
        pathname: `/f/*`,
      },
      {
        // Dicebear avatars used by seed data
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
    ],
  },
  rewrites: () => {
    return [
      {
        source: "/hashtag/:tag",
        destination: "/search?q=%23:tag",
      },
    ];
  },
};

export default nextConfig;

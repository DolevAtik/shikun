import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The design system and the contracts are workspace source, not built packages.
  transpilePackages: ["@moch/ui", "@moch/contracts"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "http", hostname: "localhost" },
      // The media bucket's public host, which differs per environment.
      ...(process.env.NEXT_PUBLIC_MEDIA_HOST
        ? [{ protocol: "https", hostname: process.env.NEXT_PUBLIC_MEDIA_HOST }]
        : []),
    ],
  },
};

export default withNextIntl(nextConfig);

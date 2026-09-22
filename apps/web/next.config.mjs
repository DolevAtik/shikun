import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The design system and the contracts are workspace source, not built packages.
  transpilePackages: ["@moch/ui", "@moch/contracts"],
  async redirects() {
    return [
      {
        // The job board used to be its own tab. Query strings (the scope filter) are kept.
        source: "/:locale(he|en)/jobs",
        destination: "/:locale/services/jobs",
        permanent: false,
      },
    ];
  },
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

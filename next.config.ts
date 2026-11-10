import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Note: next.config redirects are ignored under output:'export'.
  // Homepage 308 is configured in public/_redirects for Cloudflare Pages.
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/proxied/github/:path*",
        destination: "https://api.github.com/:path*",
      },
      // Keep gitlab dynamic since it can be self-hosted. 
      // If CORS issues occur for self-hosted instances, the user will need to configure their server.
      // But for gitlab.com, we can proxy it.
      {
        source: "/api/proxied/gitlab/:path*",
        destination: "https://gitlab.com/api/v4/:path*",
      },
    ];
  },
};

export default nextConfig;

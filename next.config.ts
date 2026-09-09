import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// BACKEND_URL is read at build time on Vercel. Set it in the project env
// and redeploy if the API origin changes.
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // Prevent Next from using C:\Users\DELL\package-lock.json as the workspace root.
  turbopack: {
    root: projectRoot,
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      // Legacy backend paths during migration
      {
        source: "/api/auth/:path*",
        destination: `${backendUrl}/api/auth/:path*`,
      },
      {
        source: "/api/wallet/:path*",
        destination: `${backendUrl}/api/wallet/:path*`,
      },
      {
        source: "/api/bets/:path*",
        destination: `${backendUrl}/api/bets/:path*`,
      },
      {
        source: "/api/catalog/:path*",
        destination: `${backendUrl}/api/catalog/:path*`,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.0.8.19", "10.0.8.240", "192.168.254.130"],
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {key: "Access-Control-Allow-Origin", value: "*"},
          {key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, OPTIONS"},
          {key: "Access-Control-Allow-Headers", value: "Authorization, Content-Type, Accept"},
        ],
      },
    ];
  },
};

export default nextConfig;

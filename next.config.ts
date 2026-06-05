import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "contribution.usercontent.google.com",
        pathname: "/**",
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false, accounts: false, 'pino-pretty': false, lokijs: false, encoding: false };
    return config;
  },
  serverExternalPackages: ['pino-pretty', 'lokijs', 'encoding', 'accounts'],
  turbopack: {
    resolveAlias: {
      accounts: './src/lib/empty.js',
      'pino-pretty': './src/lib/empty.js',
      lokijs: './src/lib/empty.js',
      encoding: './src/lib/empty.js',
    },
  },
};

export default nextConfig;

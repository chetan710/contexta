import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf2json', 'pdf-lib', 'pdf-poppler'],
  },
};

export default nextConfig;

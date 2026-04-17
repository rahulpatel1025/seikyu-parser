import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Next.js not to bundle Tesseract so its worker files don't break
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;
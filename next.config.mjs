import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  reactCompiler: true,
  output: "standalone",
  // 明确指定 Turbopack 的工作区根目录，避免被父目录的 lockfile 误导
  turbopack: {
    root: __dirname, // 使用绝对路径指向项目根目录
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.doubanio.com",
      },
      {
        protocol: "https",
        hostname: "tncache1-f1.v3mh.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;

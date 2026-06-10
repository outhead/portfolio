import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Разрешаем dev-доступ с телефона по локальному IP (иначе Next блокирует /_next/* и страница пустая)
  allowedDevOrigins: ["192.168.31.150"],
};

export default nextConfig;

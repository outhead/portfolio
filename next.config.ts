import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Инлайним CSS в <style> внутри HTML: Вебвизор Метрики записывает DOM,
  // и стили попадают в запись — записи сессий не ломаются после деплоев
  // (хэшированные .css старых билдов иначе отдают 404 в плеере)
  experimental: {
    inlineCss: true,
  },
  images: {
    unoptimized: true,
  },
  // Разрешаем dev-доступ с телефона по локальному IP (иначе Next блокирует /_next/* и страница пустая)
  allowedDevOrigins: ["192.168.31.150"],
};

export default nextConfig;

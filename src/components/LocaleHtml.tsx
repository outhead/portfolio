"use client";

import { useEffect } from "react";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/dict";

/**
 * Статический экспорт с одним root-layout не даёт выставить <html lang> per-route
 * на сервере. Выставляем на клиенте по текущей локали (из URL). Плюс рендерим
 * локализованную skip-ссылку «к содержимому».
 */
export default function LocaleHtml() {
  const locale = useLocale();
  const dict = getDict(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[300] focus:bg-[#A6FF00] focus:text-black focus:px-4 focus:py-2 focus:rounded focus:text-sm focus:font-semibold"
    >
      {dict.a11y.skip}
    </a>
  );
}

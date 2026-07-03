"use client";

import { usePathname } from "next/navigation";
import { localeFromPath, type Locale } from "./i18n";

/** Клиентский хук: текущая локаль по URL. */
export function useLocale(): Locale {
  const pathname = usePathname();
  return localeFromPath(pathname);
}

/**
 * Локализация сайта. RU живёт на корневых путях (/, /cases/..., /speaking),
 * EN — зеркалом на /en/*. Русские URL не меняются: цели Метрики, шаренные
 * ссылки на квесты и лидерборды Supabase завязаны на пути и остаются как есть.
 *
 * Локаль в клиентских компонентах берётся из pathname через useLocale().
 * В серверных (страница кейса, /mentoring, 404) — прокидывается пропом locale,
 * который задаёт /en-обёртка роута.
 *
 * Модуль ЧИСТЫЙ (без "use client") — эти функции зовутся и на сервере
 * (CaseView, метаданные), и на клиенте. Хук useLocale вынесен в ./useLocale.
 */

export type Locale = "ru" | "en";

export const LOCALES: Locale[] = ["ru", "en"];
export const DEFAULT_LOCALE: Locale = "ru";

/** Локаль из строки пути: /en, /en/cases/... → en; всё остальное → ru. */
export function localeFromPath(pathname: string | null | undefined): Locale {
  if (!pathname) return DEFAULT_LOCALE;
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ru";
}

/**
 * Ссылка с учётом локали. Внутренние пути на EN получают префикс /en.
 * Внешние (http…, mailto:, tel:, #якорь, .pdf-файлы) — без изменений.
 */
export function localizedHref(href: string, locale: Locale): string {
  if (locale === "ru") return href;
  if (
    !href.startsWith("/") ||
    href.startsWith("//") ||
    href.startsWith("/en/") ||
    href === "/en"
  ) {
    return href;
  }
  // Файлы в /public (CV, og и т.п.) не префиксуем — они не роуты.
  if (/\.[a-z0-9]+($|[?#])/i.test(href)) return href;
  if (href === "/") return "/en";
  return `/en${href}`;
}

/** Обратное: путь без языкового префикса (для переключателя и активных пунктов). */
export function stripLocale(pathname: string): string {
  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3);
  return pathname;
}

/** Путь-двойник в другой локали (для кнопки переключения языка). */
export function pathInLocale(pathname: string, locale: Locale): string {
  const base = stripLocale(pathname);
  return locale === "ru" ? base : localizedHref(base, "en");
}

/** Выбор значения по локали с фоллбэком на RU. */
export function pick<T>(ru: T, en: T | undefined, locale: Locale): T {
  return locale === "en" && en !== undefined ? en : ru;
}

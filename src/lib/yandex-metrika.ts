/**
 * Я.Метрика — типы и хелперы.
 *
 * ID счётчика берётся из NEXT_PUBLIC_YM_COUNTER_ID. Если переменной нет
 * (например, локальный dev без ключа) — все хелперы работают как no-op,
 * счётчик не загружается, ошибок не бросает.
 */

declare global {
  interface Window {
    ym?: (
      counterId: number,
      method: string,
      ...args: unknown[]
    ) => void;
  }
}

export const YM_COUNTER_ID: number | null = (() => {
  const raw = process.env.NEXT_PUBLIC_YM_COUNTER_ID;
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
})();

export const isYmEnabled = (): boolean =>
  YM_COUNTER_ID !== null && typeof window !== "undefined" && typeof window.ym === "function";

/**
 * Отправить достижение цели.
 * @param goal — короткий идентификатор (например, `cta_telegram`).
 * @param params — произвольные параметры визита (например, `{ case_slug: 'gazprom-neft' }`).
 */
export function ymGoal(goal: string, params?: Record<string, unknown>): void {
  if (!isYmEnabled()) return;
  try {
    window.ym!(YM_COUNTER_ID!, "reachGoal", goal, params);
  } catch {
    /* Глотаем — отсутствие аналитики не должно ронять UI. */
  }
}

/**
 * Зафиксировать просмотр страницы (нужно при клиентских переходах в App Router).
 */
export function ymHit(url: string, options?: { referer?: string; title?: string }): void {
  if (!isYmEnabled()) return;
  try {
    window.ym!(YM_COUNTER_ID!, "hit", url, options);
  } catch {
    /* no-op */
  }
}

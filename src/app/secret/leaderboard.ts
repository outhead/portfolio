// Общий лидерборд квеста (Supabase PostgREST, публичный anon-ключ + RLS).
// Хранит время прохождения ВСЕГО квеста. Текущие записи помечены tester=true
// (друзья/тестировщики). Новые игроки добавляются с tester=false.

export type LbEntry = { name: string; timeMs: number; hints: number; at: number; tester: boolean };
export type FbEntry = { name: string; feedback: string; at: number };

// Штраф за подсказку: к ВРЕМЕНИ ДЛЯ РАНЖИРОВАНИЯ прибавляется 30с за каждую.
// Реальное время показываем честно, штраф — отдельной пометкой (решение Егора).
export const HINT_PENALTY_MS = 30_000;
export const adjustedMs = (e: { timeMs: number; hints: number }): number =>
  e.timeMs + (e.hints || 0) * HINT_PENALTY_MS;

const SB_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hvkygaghhxgaolxemndr.supabase.co";
const SB_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a3lnYWdoaHhnYW9seGVtbmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDYwNjAsImV4cCI6MjA5NDg4MjA2MH0.IoRNKO3Jb51k1XA2y7-Q-PSaxpPhBj56G1SZJaKKau4";
const SB_TABLE = "leaderboard";

type SbRow = { name: string; time_ms: number; hints: number; created_at: string; tester: boolean };
const toEntry = (r: SbRow): LbEntry => ({
  name: r.name,
  timeMs: r.time_ms,
  hints: r.hints || 0,
  at: Date.parse(r.created_at) || 0,
  tester: !!r.tester,
});

export async function loadBoard(): Promise<LbEntry[]> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/${SB_TABLE}?select=name,time_ms,hints,created_at,tester&limit=100`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: "no-store" }
    );
    if (!res.ok) throw new Error("sb");
    // Сортируем по ВРЕМЕНИ СО ШТРАФОМ за подсказки (а не по чистому времени).
    return ((await res.json()) as SbRow[]).map(toEntry).sort((a, b) => adjustedMs(a) - adjustedMs(b));
  } catch {
    return [];
  }
}

// Отзыв/вейтлист ПОСЛЕ игр (пинг-понг). Пишем отдельной строкой, скрытой из таблицы
// (tester=true → по умолчанию не видна), но отзыв попадает на «стену прошедших».
export async function submitFeedback(
  name: string,
  extra: { telegram?: string; feedback?: string; published?: boolean }
): Promise<boolean> {
  const tg = (extra.telegram || "").trim().slice(0, 80);
  const fb = (extra.feedback || "").trim().slice(0, 500);
  if (!tg && !fb) return false;
  const body: Record<string, unknown> = { name: (name || "Гость").slice(0, 20), time_ms: 3_599_000, tester: true };
  if (tg) body.telegram = tg;
  if (fb) { body.feedback = fb; body.published = extra.published !== false; }
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${SB_TABLE}`, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

type SaveExtra = { telegram?: string; feedback?: string; published?: boolean; hints?: number };

export async function saveScore(
  name: string,
  timeMs: number,
  extra: SaveExtra = {}
): Promise<{ entries: LbEntry[]; at: number }> {
  // RLS принимает time_ms в диапазоне 200..3 600 000 — подстрахуемся.
  const t = Math.max(200, Math.min(3_599_000, Math.round(timeMs)));
  const tg = (extra.telegram || "").trim().slice(0, 80);
  const fb = (extra.feedback || "").trim().slice(0, 500);
  const body: Record<string, unknown> = {
    name: name.slice(0, 20),
    time_ms: t,
    hints: Math.max(0, Math.min(100, Math.round(extra.hints || 0))),
  };
  if (tg) body.telegram = tg;
  if (fb) {
    body.feedback = fb;
    body.published = !!extra.published; // публикуем на доске только с согласия
  }
  let at = Date.now();
  try {
    // ?select=created_at — не запрашиваем обратно telegram (колонка закрыта для anon).
    const res = await fetch(`${SB_URL}/rest/v1/${SB_TABLE}?select=created_at`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const ins = (await res.json()) as { created_at?: string }[];
      if (ins[0]?.created_at) at = Date.parse(ins[0].created_at);
    }
  } catch {
    /* ignore */
  }
  return { entries: await loadBoard(), at };
}

// Публичная доска отзывов — только опубликованные, без telegram.
export async function loadFeedback(): Promise<FbEntry[]> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/${SB_TABLE}?select=name,feedback,created_at&published=eq.true&feedback=not.is.null&order=created_at.desc&limit=50`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: "no-store" }
    );
    if (!res.ok) throw new Error("sb");
    return ((await res.json()) as { name: string; feedback: string; created_at: string }[])
      .filter((r) => r.feedback && r.feedback.trim())
      .map((r) => ({ name: r.name, feedback: r.feedback, at: Date.parse(r.created_at) || 0 }));
  } catch {
    return [];
  }
}

export function fmtQuestTime(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}:${String(s % 60).padStart(2, "0")}` : `${s} с`;
}

// Старт квеста (на входе в шифр). Возвращает elapsed (мс) или null.
export const QUEST_START_KEY = "quest_started_at";
export function questElapsed(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(QUEST_START_KEY);
  const t = raw ? Number(raw) : NaN;
  if (!t || Number.isNaN(t)) return null;
  return Date.now() - t;
}
export function markQuestStart() {
  if (typeof window === "undefined") return;
  if (!window.localStorage.getItem(QUEST_START_KEY)) {
    window.localStorage.setItem(QUEST_START_KEY, String(Date.now()));
    window.localStorage.setItem(HINTS_KEY, "0"); // новый заход — обнуляем подсказки
  }
}
export function clearQuestStart() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(QUEST_START_KEY);
}

// ─── Счётчик подсказок за весь квест ───
// Сквозной: считается на всех экранах (шифр, крестики, терминал), показывается в финале.
export const HINTS_KEY = "quest_hints";
export function questHints(): number {
  if (typeof window === "undefined") return 0;
  const n = Number(window.localStorage.getItem(HINTS_KEY));
  return Number.isFinite(n) && n > 0 ? n : 0;
}
// Вызывается один раз на каждую ВПЕРВЫЕ раскрытую подсказку. Возвращает новое значение.
export function bumpHint(): number {
  if (typeof window === "undefined") return 0;
  const n = questHints() + 1;
  window.localStorage.setItem(HINTS_KEY, String(n));
  return n;
}

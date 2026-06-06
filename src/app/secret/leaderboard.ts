// Общий лидерборд квеста (Supabase PostgREST, публичный anon-ключ + RLS).
// Хранит время прохождения ВСЕГО квеста. Текущие записи помечены tester=true
// (друзья/тестировщики). Новые игроки добавляются с tester=false.

export type LbEntry = { name: string; timeMs: number; at: number; tester: boolean };
export type FbEntry = { name: string; feedback: string; at: number };

const SB_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hvkygaghhxgaolxemndr.supabase.co";
const SB_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a3lnYWdoaHhnYW9seGVtbmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDYwNjAsImV4cCI6MjA5NDg4MjA2MH0.IoRNKO3Jb51k1XA2y7-Q-PSaxpPhBj56G1SZJaKKau4";
const SB_TABLE = "leaderboard";

type SbRow = { name: string; time_ms: number; created_at: string; tester: boolean };
const toEntry = (r: SbRow): LbEntry => ({
  name: r.name,
  timeMs: r.time_ms,
  at: Date.parse(r.created_at) || 0,
  tester: !!r.tester,
});

export async function loadBoard(): Promise<LbEntry[]> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/${SB_TABLE}?select=name,time_ms,created_at,tester&order=time_ms.asc&limit=100`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: "no-store" }
    );
    if (!res.ok) throw new Error("sb");
    return ((await res.json()) as SbRow[]).map(toEntry);
  } catch {
    return [];
  }
}

type SaveExtra = { telegram?: string; feedback?: string; published?: boolean };

export async function saveScore(
  name: string,
  timeMs: number,
  extra: SaveExtra = {}
): Promise<{ entries: LbEntry[]; at: number }> {
  // RLS принимает time_ms в диапазоне 200..3 600 000 — подстрахуемся.
  const t = Math.max(200, Math.min(3_599_000, Math.round(timeMs)));
  const tg = (extra.telegram || "").trim().slice(0, 80);
  const fb = (extra.feedback || "").trim().slice(0, 500);
  const body: Record<string, unknown> = { name: name.slice(0, 20), time_ms: t };
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
  }
}
export function clearQuestStart() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(QUEST_START_KEY);
}

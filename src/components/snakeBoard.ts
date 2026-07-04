// Отдельный лидерборд змейки на 404 (Supabase PostgREST, anon-ключ + RLS).
// Таблица public.snake_scores: name, score, created_at. Только эта игра.

export type SnakeEntry = { name: string; score: number; at: number };

const SB_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hvkygaghhxgaolxemndr.supabase.co";
const SB_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a3lnYWdoaHhnYW9seGVtbmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDYwNjAsImV4cCI6MjA5NDg4MjA2MH0.IoRNKO3Jb51k1XA2y7-Q-PSaxpPhBj56G1SZJaKKau4";
const SB_TABLE = "snake_scores";

type SbRow = { name: string; score: number; created_at: string };
const toEntry = (r: SbRow): SnakeEntry => ({
  name: r.name,
  score: r.score,
  at: Date.parse(r.created_at) || 0,
});

export async function loadSnakeBoard(limit = 10): Promise<SnakeEntry[]> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/${SB_TABLE}?select=name,score,created_at&order=score.desc,created_at.asc&limit=${limit}`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: "no-store" }
    );
    if (!res.ok) throw new Error("sb");
    return ((await res.json()) as SbRow[]).map(toEntry);
  } catch {
    return [];
  }
}

// Место по счёту: 1 + сколько результатов строго выше. HEAD + count=exact —
// данные не гоняем, PostgREST отдаёт только Content-Range: */N.
export async function snakePlace(score: number): Promise<number | null> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/${SB_TABLE}?select=name&score=gt.${Math.round(score)}`,
      {
        method: "HEAD",
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Prefer: "count=exact" },
        cache: "no-store",
      }
    );
    const range = res.headers.get("content-range"); // "*/N" или "0-9/N"
    const total = range ? parseInt(range.split("/")[1], 10) : NaN;
    return Number.isFinite(total) ? total + 1 : null;
  } catch {
    return null;
  }
}

export async function saveSnakeScore(
  name: string,
  score: number
): Promise<SnakeEntry[]> {
  const body = {
    name: (name || "Аноним").trim().slice(0, 32) || "Аноним",
    score: Math.max(0, Math.min(100000, Math.round(score))),
  };
  try {
    await fetch(`${SB_URL}/rest/v1/${SB_TABLE}`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
    });
  } catch {
    /* ignore */
  }
  return loadSnakeBoard();
}

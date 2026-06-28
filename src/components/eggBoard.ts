/* ─────────────────────────────────────────────────────────────────
 * eggBoard — лидерборд охоты за пасхалками (Supabase PostgREST, anon + RLS).
 * Таблица public.egg_hunt: name, duration_ms (время от первой пасхалки до
 * всех найденных), found, created_at. Рейтинг — по скорости (быстрее = выше).
 *
 * В проде ходим через свой домен (/sb/rest проксирует на Supabase —
 * *.supabase.co блокируется в РФ без VPN). В dev — напрямую.
 * ──────────────────────────────────────────────────────────────── */

export type EggEntry = { name: string; durationMs: number | null; found: number; at: number };

const SB_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hvkygaghhxgaolxemndr.supabase.co";
const SB_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a3lnYWdoaHhnYW9seGVtbmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDYwNjAsImV4cCI6MjA5NDg4MjA2MH0.IoRNKO3Jb51k1XA2y7-Q-PSaxpPhBj56G1SZJaKKau4";

const DEV = process.env.NODE_ENV === "development";
const REST = DEV ? `${SB_URL}/rest/v1` : "/sb/rest";
const TABLE = "egg_hunt";

type Row = { name: string; duration_ms: number | null; found: number; created_at: string };
const toEntry = (r: Row): EggEntry => ({
  name: r.name,
  durationMs: r.duration_ms,
  found: r.found,
  at: Date.parse(r.created_at) || 0,
});

export async function loadEggBoard(limit = 20): Promise<EggEntry[]> {
  try {
    const res = await fetch(
      `${REST}/${TABLE}?select=name,duration_ms,found,created_at&order=duration_ms.asc.nullslast,created_at.asc&limit=${limit}`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: "no-store" }
    );
    if (!res.ok) throw new Error("sb");
    return ((await res.json()) as Row[]).map(toEntry);
  } catch {
    return [];
  }
}

export async function saveEggScore(
  name: string,
  durationMs: number | null,
  found = 6
): Promise<EggEntry[]> {
  const body = {
    name: (name || "Аноним").trim().slice(0, 32) || "Аноним",
    duration_ms: durationMs == null ? null : Math.max(0, Math.min(604_800_000, Math.round(durationMs))),
    found: Math.max(1, Math.min(50, Math.round(found))),
  };
  try {
    await fetch(`${REST}/${TABLE}`, {
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
  return loadEggBoard();
}

// «1:23» / «12 с» / «—»
export function fmtEggTime(ms: number | null): string {
  if (ms == null) return "—";
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}:${String(s % 60).padStart(2, "0")}` : `${s} с`;
}

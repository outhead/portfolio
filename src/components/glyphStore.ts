/* ─────────────────────────────────────────────────────────────────
 * glyphStore — общая галерея глифов LED-конструктора (Supabase PostgREST).
 * Глифы шарятся между всеми посетителями. Публикация мгновенная,
 * модерация — флагом hidden на стороне БД. Дубли (та же битмапа) режутся
 * уникальной сигнатурой в таблице → POST вернёт 409.
 *
 * В проде ходим через свой домен (/sb/rest проксирует на Supabase —
 * *.supabase.co блокируется в РФ без VPN). В dev — напрямую.
 * ──────────────────────────────────────────────────────────────── */

export type SavedGlyph = {
  id: string;
  cols: number;
  rows: number;
  bitmap: string[]; // строки вида "01110" — формат LED_GLYPHS
  at: number;
};

const SB_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hvkygaghhxgaolxemndr.supabase.co";
const SB_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a3lnYWdoaHhnYW9seGVtbmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDYwNjAsImV4cCI6MjA5NDg4MjA2MH0.IoRNKO3Jb51k1XA2y7-Q-PSaxpPhBj56G1SZJaKKau4";

const DEV = process.env.NODE_ENV === "development";
const REST = DEV ? `${SB_URL}/rest/v1` : "/sb/rest";
const TABLE = "glyphs";

export const PAGE = 24;

type Row = { id: string; cols: number; rows: number; bitmap: string[]; created_at: string };
const toGlyph = (r: Row): SavedGlyph => ({
  id: r.id,
  cols: r.cols,
  rows: r.rows,
  bitmap: r.bitmap,
  at: Date.parse(r.created_at) || 0,
});

/** Страница галереи: свежие сверху. */
export async function loadGlyphs(limit = PAGE, offset = 0): Promise<SavedGlyph[]> {
  try {
    const res = await fetch(
      `${REST}/${TABLE}?select=id,cols,rows,bitmap,created_at&order=created_at.desc&limit=${limit}&offset=${offset}`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: "no-store" },
    );
    if (!res.ok) throw new Error("sb");
    return ((await res.json()) as Row[]).map(toGlyph);
  } catch {
    return [];
  }
}

export type SaveResult = { ok: boolean; duplicate?: boolean; entry?: SavedGlyph };

/** Публикует глиф в общую галерею. 409 → такой уже есть. */
export async function saveGlyph(bitmap: string[], cols: number, rows: number): Promise<SaveResult> {
  try {
    const res = await fetch(`${REST}/${TABLE}?select=id,cols,rows,bitmap,created_at`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ bitmap, cols, rows }),
    });
    if (res.status === 409) return { ok: false, duplicate: true };
    if (!res.ok) return { ok: false };
    const ins = (await res.json()) as Row[];
    return { ok: true, entry: ins[0] ? toGlyph(ins[0]) : undefined };
  } catch {
    return { ok: false };
  }
}

/** Пустой ли глиф (ни одной зажжённой точки) — нечего сохранять. */
export function isBlank(bitmap: string[]): boolean {
  return !bitmap.some((row) => row.includes("1"));
}

/** Сигнатура битмапы — для клиентской проверки дубля среди уже загруженных. */
export function sigOf(bitmap: string[]): string {
  return bitmap.join("|");
}

/* ─────────────────────────────────────────────────────────────────
 * glyphStore — сохранённые пользователем глифы LED-конструктора.
 * Живут в localStorage браузера, общие для /led и мини-рисовалки в кейсе.
 * ──────────────────────────────────────────────────────────────── */

export type SavedGlyph = {
  id: string;
  cols: number;
  rows: number;
  bitmap: string[]; // строки вида "01110" — формат LED_GLYPHS
  ts: number;
};

const KEY = "led-font-glyphs-v1";
const SEED_KEY = "led-font-seeded-v1";
const MAX = 40;

/* Примеры-глифы, которыми засеивается галерея при первом заходе.
 * Первый — 16×16 пиксель-арт, нарисованный в конструкторе. */
const DEFAULT_GLYPHS: { cols: number; rows: number; bitmap: string[] }[] = [
  {
    cols: 16,
    rows: 16,
    bitmap: [
      "0111100110011110",
      "1000010110100001",
      "1011010110101101",
      "1000010110100001",
      "0111100110011110",
      "0000000110000000",
      "1010101111010101",
      "1010101111010101",
      "0000001100000000",
      "1111001111001111",
      "0000011001100000",
      "1110110110110111",
      "0001100000011000",
      "1011001001001101",
      "0110011001100110",
      "1100111001110011",
    ],
  },
];

/** Засевает галерею примерами один раз (пока пользователь не очистил флаг). */
export function seedDefaults(): SavedGlyph[] {
  if (typeof window === "undefined") return [];
  try {
    if (window.localStorage.getItem(SEED_KEY)) return loadGlyphs();
    const existing = loadGlyphs();
    const seeded: SavedGlyph[] = DEFAULT_GLYPHS.map((g, i) => ({
      id: `seed-${i}`,
      cols: g.cols,
      rows: g.rows,
      bitmap: g.bitmap,
      ts: Date.now() - (DEFAULT_GLYPHS.length - i),
    }));
    const next = [...existing, ...seeded].slice(0, MAX);
    persistGlyphs(next);
    window.localStorage.setItem(SEED_KEY, "1");
    return next;
  } catch {
    return loadGlyphs();
  }
}

export function loadGlyphs(): SavedGlyph[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as SavedGlyph[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function persistGlyphs(list: SavedGlyph[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    // чтобы другие смонтированные редакторы на той же странице обновились
    window.dispatchEvent(new Event("led-glyphs-changed"));
  } catch {}
}

export function addGlyph(bitmap: string[], cols: number, rows: number): SavedGlyph[] {
  const entry: SavedGlyph = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    cols,
    rows,
    bitmap,
    ts: Date.now(),
  };
  const next = [entry, ...loadGlyphs()].slice(0, MAX);
  persistGlyphs(next);
  return next;
}

export function removeGlyph(id: string): SavedGlyph[] {
  const next = loadGlyphs().filter((g) => g.id !== id);
  persistGlyphs(next);
  return next;
}

/** Пустой ли глиф (ни одной зажжённой точки) — нечего сохранять. */
export function isBlank(bitmap: string[]): boolean {
  return !bitmap.some((row) => row.includes("1"));
}

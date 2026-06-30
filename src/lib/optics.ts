/* ─────────────────────────────────────────────────────────────────
 * optics — ядро головоломки «призмы и зеркало» (без React/canvas).
 * Уровень хранится в долях панели (0..1) — не зависит от размера.
 * trace() прогоняет лучи: камень-призма расщепляет на 2 цветных луча,
 * зеркало отражает (цвет сохраняется), белый — исходный луч эмиттера.
 * ──────────────────────────────────────────────────────────────── */

export type ColorKey = "white" | "amber" | "lime" | "cyan" | "magenta";
export type RGB = [number, number, number];

export const COLORS: Record<ColorKey, RGB> = {
  white: [235, 238, 230],
  amber: [220, 176, 86],
  lime: [166, 255, 0],
  cyan: [86, 210, 226],
  magenta: [226, 96, 198],
};
export const COLOR_KEYS: ColorKey[] = ["white", "amber", "lime", "cyan", "magenta"];

export const SPREAD = (26 * Math.PI) / 180;
export const STONE_R = 16; // радиус попадания луча в камень (px)
export const HITR = 20; // радиус попадания в цель (px)
export const ML = 46; // длина зеркала (px)

export type Stone = { minus: ColorKey; plus: ColorKey; x: number; y: number };
export type Mirror = { x: number; y: number; ang: number };
export type Target = { key: ColorKey; x: number; y: number };
export type Level = {
  emitter: { x: number; y: number };
  stones: Stone[]; // x,y — стартовые позиции (доли)
  mirror: Mirror | null;
  targets: Target[];
};

export type Pt = { x: number; y: number };
export type Seg = { a: Pt; b: Pt; key: ColorKey };

export const rot = (v: Pt, a: number): Pt => ({
  x: v.x * Math.cos(a) - v.y * Math.sin(a),
  y: v.x * Math.sin(a) + v.y * Math.cos(a),
});
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const mul = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k });
const dotp = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y;

export function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / l2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

function exitT(o: Pt, d: Pt, W: number, H: number): { p: Pt; t: number } {
  let t = 1e9;
  if (d.x > 1e-4) t = Math.min(t, (W - o.x) / d.x);
  else if (d.x < -1e-4) t = Math.min(t, -o.x / d.x);
  if (d.y > 1e-4) t = Math.min(t, (H - o.y) / d.y);
  else if (d.y < -1e-4) t = Math.min(t, -o.y / d.y);
  return { p: { x: o.x + d.x * t, y: o.y + d.y * t }, t };
}

function raySeg(o: Pt, d: Pt, a: Pt, b: Pt): number | null {
  const e = sub(b, a);
  const den = d.x * e.y - d.y * e.x;
  if (Math.abs(den) < 1e-6) return null;
  const diff = sub(a, o);
  const t = (diff.x * e.y - diff.y * e.x) / den;
  const u = (diff.x * d.y - diff.y * d.x) / den;
  if (t > 1e-3 && u >= 0 && u <= 1) return t;
  return null;
}

/** Живые позиции элементов (в px). */
export type Live = {
  emitter: Pt;
  stones: Array<{ p: Pt; minus: ColorKey; plus: ColorKey }>;
  mirror: { p: Pt; ang: number } | null;
};

export function mirrorEnds(m: { p: Pt; ang: number }): [Pt, Pt] {
  const tang: Pt = { x: Math.cos(m.ang), y: Math.sin(m.ang) };
  return [add(m.p, mul(tang, ML / 2)), sub(m.p, mul(tang, ML / 2))];
}

/** Прогон лучей. Возвращает сегменты с цветом. */
export function trace(live: Live, W: number, H: number, spread = SPREAD): Seg[] {
  const segs: Seg[] = [];
  let mA: Pt | null = null, mB: Pt | null = null, nrm: Pt | null = null;
  if (live.mirror) {
    [mA, mB] = mirrorEnds(live.mirror);
    const tang: Pt = { x: Math.cos(live.mirror.ang), y: Math.sin(live.mirror.ang) };
    nrm = { x: -tang.y, y: tang.x };
  }

  type B = { o: Pt; d: Pt; key: ColorKey; depth: number };
  const queue: B[] = [{ o: live.emitter, d: { x: 0, y: 1 }, key: "white", depth: 0 }];
  let guard = 0;
  while (queue.length && guard++ < 80) {
    const bm = queue.shift()!;
    const ex = exitT(bm.o, bm.d, W, H);
    let bestT = ex.t, kind: "stone" | "mirror" | null = null, hp = ex.p;
    let st: Live["stones"][number] | null = null;

    for (const stone of live.stones) {
      const rel = sub(stone.p, bm.o);
      const proj = dotp(rel, bm.d);
      if (proj > 6 && proj < bestT) {
        const near = add(bm.o, mul(bm.d, proj));
        if (Math.hypot(near.x - stone.p.x, near.y - stone.p.y) < STONE_R) {
          bestT = proj; kind = "stone"; hp = near; st = stone;
        }
      }
    }
    if (mA && mB) {
      const mt = raySeg(bm.o, bm.d, mA, mB);
      if (mt !== null && mt < bestT) { bestT = mt; kind = "mirror"; hp = add(bm.o, mul(bm.d, mt)); st = null; }
    }

    segs.push({ a: bm.o, b: hp, key: bm.key });

    if (kind === "stone" && st && bm.depth < 6) {
      const dm = rot(bm.d, -spread), dp = rot(bm.d, spread);
      queue.push({ o: add(hp, mul(dm, 2)), d: dm, key: st.minus, depth: bm.depth + 1 });
      queue.push({ o: add(hp, mul(dp, 2)), d: dp, key: st.plus, depth: bm.depth + 1 });
    } else if (kind === "mirror" && nrm && bm.depth < 6) {
      const dd = dotp(bm.d, nrm);
      const rd: Pt = { x: bm.d.x - 2 * dd * nrm.x, y: bm.d.y - 2 * dd * nrm.y };
      queue.push({ o: add(hp, mul(rd, 2)), d: rd, key: bm.key, depth: bm.depth + 1 });
    }
  }
  return segs;
}

/** Какие цели зажжены (луч своего цвета рядом). */
export function targetHits(segs: Seg[], targetsPx: Target[], hitr = HITR): boolean[] {
  return targetsPx.map((t) =>
    segs.some((s) => s.key === t.key && segDist(t.x, t.y, s.a.x, s.a.y, s.b.x, s.b.y) < hitr)
  );
}

/** Логический размер поля — игра и редактор считают в нём (uniform-scale). */
export const FIELD_W = 360;
export const FIELD_H = 380;

/** Боевой уровень менторинга: зеркало и цели зафиксированы, двигаются только камни. */
export const MENTORING_LEVEL: Level = {
  emitter: { x: 0.5, y: 0.08 },
  stones: [
    { minus: "amber", plus: "lime", x: 0.623, y: 0.552 },
    { minus: "cyan", plus: "magenta", x: 0.399, y: 0.546 },
    { minus: "lime", plus: "cyan", x: 0.491, y: 0.32 },
  ],
  mirror: { x: 0.397, y: 0.862, ang: -2.621 },
  targets: [
    { key: "amber", x: 0.928, y: 0.784 },
    { key: "cyan", x: 0.925, y: 0.555 },
    { key: "magenta", x: 0.089, y: 0.758 },
    { key: "lime", x: 0.617, y: 0.776 },
  ],
};

/** Уровень по умолчанию (доли панели). Белый узел на стволе — тоже надо зажечь. */
export const DEFAULT_LEVEL: Level = {
  emitter: { x: 0.5, y: 0.08 },
  stones: [
    { minus: "amber", plus: "lime", x: 0.2, y: 0.92 },
    { minus: "cyan", plus: "magenta", x: 0.5, y: 0.95 },
  ],
  mirror: { x: 0.8, y: 0.92, ang: 0 },
  targets: [
    { key: "white", x: 0.5, y: 0.19 },
    { key: "amber", x: 0.88, y: 0.83 },
    { key: "cyan", x: 0.397, y: 0.83 },
    { key: "magenta", x: 0.126, y: 0.7 },
  ],
};

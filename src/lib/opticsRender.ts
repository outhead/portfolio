/* ─────────────────────────────────────────────────────────────────
 * opticsRender — общая отрисовка поля головоломки (для игры и редактора).
 * Чистая функция над ctx; всё в CSS-px (caller ставит transform dpr).
 * ──────────────────────────────────────────────────────────────── */

import {
  COLORS,
  ML,
  mirrorEnds,
  type ColorKey,
  type Live,
  type Pt,
  type Seg,
  type Target,
} from "./optics";

const GRID = "150,160,138";
const css = (c: [number, number, number], a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export type DrawOpts = {
  segs: Seg[];
  targetsPx: Target[];
  hits: boolean[];
  time: number;
  solved?: boolean;
  solveT?: number;
  reduce?: boolean;
  edit?: boolean;
  selected?: { kind: "stone" | "mirror" | "target"; i: number } | null;
};

export function drawField(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  live: Live,
  o: DrawOpts
) {
  function dot(x: number, y: number, r: number, color: string, glow = 0, glowC = "166,255,0") {
    ctx.shadowBlur = glow;
    if (glow) ctx.shadowColor = `rgba(${glowC},0.9)`;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  function line(a: Pt, b: Pt, color: string, r = 1.5) {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.round(len / 6));
    for (let s = 0; s <= n; s++) {
      const t = s / n;
      dot(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, r, color);
    }
  }
  function ring(p: Pt, R: number, color: string) {
    for (let a = 0; a < Math.PI * 2; a += 0.5)
      dot(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R, 1.3, color);
  }
  function gem(p: Pt, s: number, cl: ColorKey, cr: ColorKey, sel: boolean) {
    for (let i = -s; i <= s; i++) {
      const w = s - Math.abs(i);
      for (let j = -w; j <= w; j += 2)
        dot(p.x + j, p.y + i, 1.1, css(COLORS[j < 0 ? cl : cr], 0.95));
    }
    if (sel) ring(p, s + 4, `rgba(${GRID},0.9)`);
  }

  ctx.clearRect(0, 0, W, H);
  // решётка
  const step = 14;
  for (let y = step; y < H; y += step)
    for (let x = step; x < W; x += step) dot(x, y, 0.8, `rgba(${GRID},0.05)`);

  // лучи
  for (const s of o.segs) line(s.a, s.b, css(COLORS[s.key], s.key === "white" ? 0.7 : 0.85));

  // импульсы по решающим лучам
  if (!o.reduce) {
    const pp = (o.time * 0.55) % 1;
    o.targetsPx.forEach((t, i) => {
      if (!o.hits[i]) return;
      const c = COLORS[t.key];
      const s = o.segs.find((sg) => sg.key === t.key);
      if (s) dot(s.a.x + (s.b.x - s.a.x) * pp, s.a.y + (s.b.y - s.a.y) * pp, 2.3, css(c, 0.95), 12, `${c[0]},${c[1]},${c[2]}`);
    });
  }

  // эмиттер
  ring(live.emitter, 6, `rgba(${GRID},0.75)`);
  dot(live.emitter.x, live.emitter.y, 2.2, css(COLORS.white, 0.95), 8, "235,238,230");

  // зеркало
  if (live.mirror) {
    const [mA, mB] = mirrorEnds(live.mirror);
    line(mA, mB, `rgba(${GRID},0.85)`, 1.6);
    dot(mA.x, mA.y, 3, `rgba(${GRID},0.9)`); // ручка поворота
    if (o.selected?.kind === "mirror") ring(live.mirror.p, ML / 2 + 4, `rgba(${GRID},0.7)`);
  }

  // цели
  o.targetsPx.forEach((t, i) => {
    const c = COLORS[t.key];
    if (o.hits[i]) {
      dot(t.x, t.y, 10, css(c, 0.12), 18, `${c[0]},${c[1]},${c[2]}`);
      dot(t.x, t.y, 4.5, css(c, 0.95), 14, `${c[0]},${c[1]},${c[2]}`);
      dot(t.x, t.y, 2, "rgba(255,255,240,1)", 8, `${c[0]},${c[1]},${c[2]}`);
    }
    ring({ x: t.x, y: t.y }, 7, css(c, o.hits[i] ? 0.85 : 0.45));
    if (o.selected?.kind === "target" && o.selected.i === i) ring({ x: t.x, y: t.y }, 11, `rgba(${GRID},0.8)`);
  });

  // камни
  live.stones.forEach((st, i) =>
    gem(st.p, 7, st.minus, st.plus, o.selected?.kind === "stone" && o.selected.i === i)
  );

  // вспышка успеха
  if (o.solved && o.solveT != null && o.solveT >= 0) {
    const bp = (o.time * 1000 - o.solveT) / 1100;
    if (bp < 1) {
      const wr = bp * Math.hypot(W, H) * 0.55;
      ctx.strokeStyle = css(COLORS.white, (1 - bp) * 0.5);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(live.emitter.x, live.emitter.y + H * 0.4, wr, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;
}

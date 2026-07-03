"use client";

/* ─────────────────────────────────────────────────────────────────
 * ConstellationFiguresV3 — псевдо-3D рендер головоломки «призмы и
 * зеркало» (песочница /secret/lab/optics). Логика — та же lib/optics,
 * движение осталось в одной плоскости; объём — только картинкой:
 *  • кристаллы — вращающиеся проволочные октаэдры из точек
 *    (язык дот-облака хиро), грань ближе — ярче;
 *  • у каждого кристалла эллипс-тень на «полу» (даёт плоскость);
 *  • цели — площадки-эллипсы в перспективе со столбом света,
 *    попадание зажигает столб;
 *  • лучи бегут как в V2 и отбрасывают тонкую тень.
 * Тач-фиксы и перф-бюджет (40fps, DPR 1.5, IO-пауза) — как в проде.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import {
  COLORS,
  FIELD_H,
  FIELD_W,
  HITR,
  MENTORING_LEVEL,
  STONE_R,
  mirrorEnds,
  segDist,
  targetHits,
  trace,
  type ColorKey,
  type Level,
  type Live,
  type Pt,
  type Target,
} from "@/lib/optics";
import type { V2Params } from "@/components/ConstellationFiguresV2";

const LW = FIELD_W, LH = FIELD_H;
const GRID = "150,160,138";
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const css = (c: [number, number, number], a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/* Стили элементов — переключаются в песочнице без пересоздания сцены */
export type GemStyle = "octa" | "brilliant" | "crystal" | "pixel" | "cluster";
export type RayStyle = "dots" | "thread" | "double" | "comet" | "wave";
export type TargetStyle = "ring" | "crosshair" | "iris" | "rings2" | "brackets";
export type V3Style = { gem: GemStyle; ray: RayStyle; target: TargetStyle };
/** Дефолты прода — связка, выбранная в песочнице 04.07.2026 */
export const V3_STYLE_DEFAULTS: V3Style = { gem: "brilliant", ray: "comet", target: "ring" };
export const V3_PARAM_DEFAULTS: V2Params = { raySpeed: 4, rayStep: 6, gemSize: 8, glow: 2, particles: true };

type Particle = { x: number; y: number; vx: number; vy: number; born: number; life: number; c: [number, number, number]; sz: number };

export default function ConstellationFiguresV3({
  className = "",
  level = MENTORING_LEVEL,
  lockMirror = true,
  paramsRef,
  styleRef,
  onSolve,
}: {
  className?: string;
  level?: Level;
  lockMirror?: boolean;
  paramsRef?: React.MutableRefObject<V2Params>;
  styleRef?: React.MutableRefObject<V3Style>;
  onSolve?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const solveCb = useRef(onSolve);
  solveCb.current = onSolve;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;

    let dpr = 1, s = 1, offX = 0, offY = 0;
    let raf = 0, stopped = false, visible = true;
    const FRAME_MS = 1000 / 40;
    let lastDraw = 0;
    const start = performance.now();

    const live: Live = { emitter: { x: 0, y: 0 }, stones: [], mirror: null };
    let targetsPx: Target[] = [];
    let drag: { kind: "stone" | "mirror" | "mrot"; i?: number } | null = null;
    let hover = -1;
    let solved = false, solveT = -1, fired = false;
    let prevHits: boolean[] = [];
    const parts: Particle[] = [];

    const P = () => paramsRef?.current ?? V3_PARAM_DEFAULTS;
    const S = () => styleRef?.current ?? V3_STYLE_DEFAULTS;

    function layoutFromLevel() {
      live.emitter = { x: level.emitter.x * LW, y: level.emitter.y * LH };
      live.stones = level.stones.map((st) => ({ p: { x: st.x * LW, y: st.y * LH }, minus: st.minus, plus: st.plus }));
      live.mirror = level.mirror ? { p: { x: level.mirror.x * LW, y: level.mirror.y * LH }, ang: level.mirror.ang } : null;
      targetsPx = level.targets.map((t) => ({ key: t.key, x: t.x * LW, y: t.y * LH }));
      prevHits = targetsPx.map(() => false);
    }

    function spawnBurst(x: number, y: number, c: [number, number, number], n: number, now: number, speed = 46) {
      if (!P().particles || reduce) return;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = speed * (0.35 + Math.random() * 0.85);
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 12, born: now, life: 500 + Math.random() * 450, c, sz: 1.4 + Math.random() * 1.4 });
      }
    }

    function dot(x: number, y: number, r: number, color: string, glow = 0, glowC = "166,255,0") {
      const g = glow * P().glow;
      ctx!.shadowBlur = g;
      if (g) ctx!.shadowColor = `rgba(${glowC},0.9)`;
      ctx!.fillStyle = color;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.shadowBlur = 0;
    }
    function px(x: number, y: number, sz: number, color: string) {
      ctx!.fillStyle = color;
      ctx!.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    }

    /** бегущий луч + тень; disperse=true — первые ~22px цвет раскрывается из белого.
     *  Стиль отрисовки — S().ray: dots / thread / double / comet / wave. */
    function ray(a: Pt, b: Pt, key: ColorKey, t: number, disperse = false) {
      const c = COLORS[key];
      const W0 = COLORS.white;
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < 1) return;
      const style = S().ray;
      const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
      const nx = -uy, ny = ux; // перпендикуляр
      const step = Math.max(4, coarse ? Math.min(P().rayStep, 8) : P().rayStep);
      const phase = ((t * P().raySpeed) % step + step) % step;
      const baseA = key === "white" ? 0.78 : 0.95;

      // нить: сплошная тонкая линия-подложка
      if (style === "thread") {
        ctx!.strokeStyle = css(c, 0.22);
        ctx!.lineWidth = 1.1;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();
      }

      const mix = (d: number): [number, number, number] => {
        if (!disperse || d >= 22) return c;
        const k = d / 22;
        return [
          Math.round(W0[0] + (c[0] - W0[0]) * k),
          Math.round(W0[1] + (c[1] - W0[1]) * k),
          Math.round(W0[2] + (c[2] - W0[2]) * k),
        ];
      };

      for (let d = phase; d < len; d += step) {
        const w = 0.82 + 0.18 * Math.sin(d * 0.55 - t * 5);
        const near = Math.min(1, d / 26);
        let x = a.x + ux * d, y = a.y + uy * d;
        const cc = mix(d);
        const alpha = baseA * w * (0.7 + 0.3 * near);
        // волна: поперечное колыхание малой амплитудой
        if (style === "wave" && !reduce) {
          const off = Math.sin(d * 0.3 + t * 3) * 1.2;
          x += nx * off; y += ny * off;
        }
        px(x + 1.5, y + 5, 1.4, css(cc, 0.12 * w)); // тень-отражение
        if (style === "double") {
          px(x + nx * 1.2, y + ny * 1.2, 1.7, css(cc, alpha * 0.9));
          px(x - nx * 1.2, y - ny * 1.2, 1.7, css(cc, alpha * 0.9));
        } else {
          px(x, y, 2.2 + 0.5 * w, css(cc, alpha));
        }
        // комета: затухающий хвост против движения
        if (style === "comet") {
          px(x - ux * 2.6, y - uy * 2.6, 1.6, css(cc, alpha * 0.5));
          px(x - ux * 5.2, y - uy * 5.2, 1.1, css(cc, alpha * 0.22));
        }
      }
      dot(a.x + ux * 3, a.y + uy * 3, 1.6, css(disperse ? W0 : c, 0.9), 10, `${c[0]},${c[1]},${c[2]}`);
    }

    /** точки вдоль отрезка 3D-проекции; mul — общий множитель яркости */
    function edge3(ax: number, ay: number, az: number, bx: number, by: number, bz: number, cl: [number, number, number], cr: [number, number, number], cx: number, cy: number, mul = 1) {
      const segs = 5;
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const x = ax + (bx - ax) * t, y = ay + (by - ay) * t, z = az + (bz - az) * t;
        // ближе к камере (z больше) — ярче и крупнее
        const depth = (z + 1) / 2; // 0..1
        const c = x < 0 ? cl : cr;
        px(cx + x * 1, cy + y * 1, 1.5 + depth * 1.1, css(c, (0.35 + depth * 0.6) * mul));
      }
    }

    /** кристалл: проволочный октаэдр из точек; active — цвета лучей, идущих через призму */
    function gem3d(p: Pt, size: number, clKey: ColorKey, crKey: ColorKey, t: number, lift: number, active: ColorKey[]) {
      const working = active.length > 0;
      const dim = working ? 1 : 0.55; // простаивающая призма тусклее
      const cl = COLORS[clKey], cr = COLORS[crKey];
      const bob = reduce ? 0 : Math.sin(t * 1.6 + p.x * 0.05) * 1.2;
      const y0 = p.y + bob - lift * 3;
      // призма статична: свет делится гранью, вращение ломало бы физику.
      // Фиксированный ракурс + чуть другой угол у каждого камня (по x).
      const ang = 0.55 + Math.sin(p.x * 0.02) * 0.25;
      const cos = Math.cos(ang), sin = Math.sin(ang);
      const sxz = size * 0.78; // экватор чуть уже высоты — огранка
      // вершины: топ, низ и 4 экваториальные (x,z вращаются)
      const eq = [
        { x: -sxz, z: 0 }, { x: sxz, z: 0 }, { x: 0, z: -sxz }, { x: 0, z: sxz },
      ].map((v) => ({ x: v.x * cos + v.z * sin, z: -v.x * sin + v.z * cos }));
      // «тень»-отражение на полу: эллипс из приглушённых цветных точек
      const shR = size * 0.9 - lift * 1.5;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const xx = Math.cos(a) * shR;
        const c = xx < 0 ? cl : cr;
        px(p.x + xx, p.y + size + 5 + Math.sin(a) * shR * 0.3, 1.2, css(c, 0.16 - lift * 0.05));
      }
      // мягкая подсветка под кристаллом (цветная)
      dot(p.x - size / 3, y0, size * 0.5, css(cl, 0.08), 14 + lift * 8, `${cl[0]},${cl[1]},${cl[2]}`);
      dot(p.x + size / 3, y0, size * 0.5, css(cr, 0.08), 14 + lift * 8, `${cr[0]},${cr[1]},${cr[2]}`);
      const style = S().gem;
      const nz = (z: number) => z / sxz; // -1..1

      // каркас октаэдра — базовая форма для octa / crystal / brilliant / cluster
      const frame = (cx: number, cy: number, sz: number, mul: number) => {
        const sx2 = sz * 0.78;
        const eqL = [
          { x: -sx2, z: 0 }, { x: sx2, z: 0 }, { x: 0, z: -sx2 }, { x: 0, z: sx2 },
        ].map((v) => ({ x: v.x * cos + v.z * sin, z: (-v.x * sin + v.z * cos) / sx2 }));
        for (const v of eqL) {
          edge3(0, -sz, 0, v.x, 0, v.z, cl, cr, cx, cy, mul);
          edge3(0, sz, 0, v.x, 0, v.z, cl, cr, cx, cy, mul);
        }
        const rr = [eqL[0], eqL[2], eqL[1], eqL[3]];
        for (let i = 0; i < 4; i++) {
          const a = rr[i], b = rr[(i + 1) % 4];
          edge3(a.x, 0, a.z, b.x, 0, b.z, cl, cr, cx, cy, mul);
        }
      };

      if (style === "pixel") {
        // честный 2D-самоцвет: заполненный ромб, две половины, диагональный блик
        for (let i = -size; i <= size; i++) {
          const w = size - Math.abs(i);
          for (let j = -w; j <= w; j += 2) {
            const c = j < 0 ? cl : cr;
            const edgeHl = i < 0 && Math.abs(j) >= w - 2 ? 1.35 : 1;
            ctx!.fillStyle = css(
              [Math.min(255, c[0] * edgeHl), Math.min(255, c[1] * edgeHl), Math.min(255, c[2] * edgeHl)],
              Math.min(1, (0.9 + 0.1 * Math.sin(t * 2.2 + i + j)) * dim + lift * 0.1),
            );
            ctx!.fillRect(p.x + j - 0.9, y0 + i - 0.9, 1.8, 1.8);
          }
        }
        // диагональный блик
        for (let k = 0; k < 4; k++) px(p.x - size * 0.5 + k * 2, y0 - size * 0.6 + k * 2, 1.4, `rgba(255,255,248,${0.5 * dim})`);
      } else if (style === "cluster") {
        frame(p.x, y0, size, dim);
        frame(p.x - size * 1.05, y0 + size * 0.45, size * 0.45, dim * 0.8);
        frame(p.x + size * 0.95, y0 + size * 0.55, size * 0.32, dim * 0.7);
      } else if (style === "crystal") {
        // хрусталь: каркас тише + дуги-блики внутри
        frame(p.x, y0, size, dim * 0.75);
        for (let k = 0; k < 5; k++) {
          const a = -0.9 + k * 0.22;
          px(p.x + Math.cos(a) * size * 0.42, y0 + Math.sin(a) * size * 0.55, 1.1, `rgba(255,255,250,${(0.35 - k * 0.05) * dim})`);
        }
        for (let k = 0; k < 3; k++) {
          const a = 1.6 + k * 0.3;
          px(p.x + Math.cos(a) * size * 0.3, y0 + Math.sin(a) * size * 0.4, 1, `rgba(255,255,250,${0.2 * dim})`);
        }
      } else if (style === "brilliant") {
        // гранёный: каркас + заливка точками, яркость по квадрантам
        frame(p.x, y0, size, dim);
        for (let iy = -size + 2; iy <= size - 2; iy += 3) {
          const w = (size - Math.abs(iy)) * 0.78;
          for (let ix = -w + 1; ix <= w - 1; ix += 3) {
            const c = ix < 0 ? cl : cr;
            const facet = (ix < 0 ? 1 : 0) + (iy < 0 ? 2 : 0);
            const fb = [0.55, 0.75, 0.95, 0.4][facet];
            px(p.x + ix, y0 + iy, 1.2, css(c, fb * dim * (0.8 + 0.2 * Math.sin(t * 2 + ix + iy))));
          }
        }
      } else {
        // octa — проволочный октаэдр (текущий)
        frame(p.x, y0, size, dim);
      }
      void nz; void eq;

      // ядро: рабочая призма горит изнутри цветами своих лучей
      if (working && !reduce) {
        active.forEach((k, ki) => {
          const c = COLORS[k];
          const ph = t * 4 + ki * 2.1;
          const rr = 1.6 + Math.sin(ph) * 0.7;
          const ox = Math.cos(ph * 0.7 + ki) * size * 0.18;
          const oy = Math.sin(ph * 0.9 + ki * 1.7) * size * 0.22;
          dot(p.x + ox, y0 + oy, Math.max(0.8, rr), css(c, 0.55 + 0.3 * Math.sin(ph)), 8, `${c[0]},${c[1]},${c[2]}`);
        });
      } else if (working) {
        dot(p.x, y0, 1.8, css(COLORS[active[0]], 0.7));
      }
      // вершинные точки — ярче
      px(p.x, y0 - size, 2.2, `rgba(255,255,248,${0.95 * dim})`);
      px(p.x, y0 + size, 2.0, css(cl, 0.8 * dim));
      // искра-блик
      if (!reduce) {
        const sp = (t * 0.9 + p.x * 0.013) % 1;
        if (sp < 0.3) px(p.x - size * 0.3, y0 - size * 0.45, 1.6, `rgba(255,255,245,${0.9 * (1 - sp / 0.3)})`);
      }
      // афорданс при ховере/драге
      if (lift > 0) {
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2 + t * 0.8;
          px(p.x + Math.cos(a) * (size + 6), y0 + Math.sin(a) * (size + 6) * 0.4 + size * 0.9, 1.2, `rgba(${GRID},${0.3 + lift * 0.4})`);
        }
      }
    }

    /** огонёк/маячок в центре цели — общий для всех стилей */
    function targetCore(tg: Target, on: boolean, t: number, i: number) {
      const c = COLORS[tg.key];
      if (on) {
        dot(tg.x, tg.y, 10, css(c, 0.12), 20, `${c[0]},${c[1]},${c[2]}`);
        const fl = reduce ? 1 : 0.75 + 0.25 * Math.sin(t * 9 + i * 2);
        dot(tg.x, tg.y, 4.2 * fl, css(c, 0.95), 16, `${c[0]},${c[1]},${c[2]}`);
        dot(tg.x, tg.y, 1.8, "rgba(255,255,240,1)", 8, `${c[0]},${c[1]},${c[2]}`);
      } else {
        const bp = reduce ? 0 : 0.5 + 0.5 * Math.sin(t * 2 + i * 1.7);
        dot(tg.x, tg.y, 1.6, css(c, 0.3 + bp * 0.25));
      }
    }

    /** цель; near 0..1 — «почти попал». Стиль — S().target. */
    function targetRing(tg: Target, on: boolean, t: number, i: number, nearHit = 0) {
      const c = COLORS[tg.key];
      const style = S().target;
      const jitter = on || reduce ? 0 : nearHit * (1 + Math.sin(t * 10 + i) * 1.3);
      const aBase = on ? 0.85 : 0.45 + nearHit * 0.35;

      if (style === "brackets") {
        // четыре уголка [ ] — рифма с лейблами сайта; дрожат при почти-попадании
        const r = 8 + (on ? 0 : jitter * 0.6);
        const L = 3.5;
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
          const cx = tg.x + sx * r, cy = tg.y + sy * r;
          for (let k = 0; k <= 2; k++) {
            px(cx - sx * (k * L) / 2, cy, 1.3, css(c, aBase));
            px(cx, cy - sy * (k * L) / 2, 1.3, css(c, aBase));
          }
        }
        targetCore(tg, on, t, i);
        return;
      }

      if (style === "iris") {
        // диафрагма: кольцо стягивается к центру при попадании и медленно вращается
        const r = on ? 4.2 : 7 + jitter * 0.5;
        const spin = on ? t * 1.2 : 0;
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * Math.PI * 2 + spin;
          dot(tg.x + Math.cos(a) * r, tg.y + Math.sin(a) * r, 1.3, css(c, aBase));
        }
        targetCore(tg, on, t, i);
        return;
      }

      if (style === "rings2") {
        for (let a = 0; a < Math.PI * 2; a += 0.6) dot(tg.x + Math.cos(a) * 9, tg.y + Math.sin(a) * 9, 1.1, css(c, aBase * 0.45));
        const rp = reduce ? 5 : 5 + Math.sin(t * 3 + i) * 0.8 + jitter * 0.5;
        for (let a = 0.3; a < Math.PI * 2; a += 0.6) dot(tg.x + Math.cos(a) * rp, tg.y + Math.sin(a) * rp, 1.3, css(c, aBase));
        targetCore(tg, on, t, i);
        return;
      }

      // ring / crosshair — базовый пунктирный круг
      for (let a = 0; a < Math.PI * 2; a += 0.5)
        dot(
          tg.x + Math.cos(a) * (7 + jitter * Math.sin(a * 3 + t * 8)),
          tg.y + Math.sin(a) * (7 + jitter * Math.cos(a * 2 - t * 7)),
          1.3,
          css(c, aBase),
        );
      if (style === "crosshair") {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          px(tg.x + dx * 10, tg.y + dy * 10, 1.4, css(c, aBase));
          px(tg.x + dx * 12.5, tg.y + dy * 12.5, 1.1, css(c, aBase * 0.6));
        }
      }
      targetCore(tg, on, t, i);
    }

    function draw(now: number) {
      if (stopped) return;
      const t = (now - start) / 1000;
      const p = P();

      ctx!.save();
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.restore();

      const segs = trace(live, LW, LH, undefined, targetsPx);
      const hits = targetHits(segs, targetsPx);
      hits.forEach((h, i) => {
        if (h && !prevHits[i]) spawnBurst(targetsPx[i].x, targetsPx[i].y, COLORS[targetsPx[i].key], 12, now);
      });
      prevHits = hits;
      const all = hits.length > 0 && hits.every(Boolean);
      if (all && !solved) {
        solved = true; solveT = now;
        targetsPx.forEach((tg) => spawnBurst(tg.x, tg.y, COLORS[tg.key], 22, now, 70));
        if (!fired) { fired = true; solveCb.current?.(); }
      }

      // решётка с лёгкой «перспективой»: к низу плотнее и ярче
      const step = 14;
      for (let y = step; y < LH; y += step) {
        const depth = y / LH;
        for (let x = step; x < LW; x += step) px(x, y, 0.8 + depth * 0.5, `rgba(${GRID},${0.03 + depth * 0.04})`);
      }

      // активность призм: через какие камни реально идёт свет
      const R2 = STONE_R + 6;
      const entryPts: Array<{ p: Pt } | null> = live.stones.map(() => null);
      const outCols: ColorKey[][] = live.stones.map(() => []);
      const segFromStone: boolean[] = segs.map(() => false);
      segs.forEach((sg, si) => {
        live.stones.forEach((st, i) => {
          if (Math.hypot(sg.b.x - st.p.x, sg.b.y - st.p.y) < R2) entryPts[i] = { p: sg.b };
          if (Math.hypot(sg.a.x - st.p.x, sg.a.y - st.p.y) < R2) {
            outCols[i].push(sg.key);
            segFromStone[si] = true;
          }
        });
      });

      // лучи (дисперсия у выходов из призм)
      segs.forEach((sg, si) => ray(sg.a, sg.b, sg.key, t, segFromStone[si]));

      // каустика: яркая точка + искры в месте входа луча в призму
      entryPts.forEach((e) => {
        if (!e) return;
        dot(e.p.x, e.p.y, 1.9, "rgba(255,255,250,0.95)", 12, "235,238,230");
        if (!reduce && P().particles) {
          for (let k = 0; k < 2; k++) {
            const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 4;
            px(e.p.x + Math.cos(a) * r, e.p.y + Math.sin(a) * r, 1, `rgba(255,255,245,${0.25 + Math.random() * 0.35})`);
          }
        }
      });

      // эмиттер: пульс
      const pulse = reduce ? 0 : (t * 1.4) % 1;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        px(live.emitter.x + Math.cos(a) * (6 + pulse * 4), live.emitter.y + Math.sin(a) * (6 + pulse * 4) * 0.5, 1.2, `rgba(${GRID},${0.7 * (1 - pulse)})`);
      }
      dot(live.emitter.x, live.emitter.y, 2.4, css(COLORS.white, 0.95), 10, "235,238,230");

      // зеркало + тень
      if (live.mirror) {
        const [mA, mB] = mirrorEnds(live.mirror);
        const len = Math.hypot(mB.x - mA.x, mB.y - mA.y);
        for (let d = 0; d <= len; d += 4) {
          const x = mA.x + (mB.x - mA.x) * (d / len), y = mA.y + (mB.y - mA.y) * (d / len);
          px(x + 2, y + 5, 1.4, "rgba(0,0,0,0.3)");
          px(x, y, 1.8, `rgba(${GRID},0.85)`);
        }
        dot(mA.x, mA.y, 3, `rgba(${GRID},0.9)`);
      }

      // цели — пунктирные круги; «почти попал» — кольцо волнуется
      targetsPx.forEach((tg, i) => {
        let nearHit = 0;
        if (!hits[i]) {
          let minD = 1e9;
          for (const sg of segs) {
            if (sg.key !== tg.key) continue;
            const d = segDist(tg.x, tg.y, sg.a.x, sg.a.y, sg.b.x, sg.b.y);
            if (d < minD) minD = d;
          }
          if (minD > HITR && minD < 30) nearHit = 1 - (minD - HITR) / (30 - HITR);
        }
        targetRing(tg, hits[i], t, i, nearHit);
      });

      // кристаллы-октаэдры (рабочие горят изнутри, простаивающие тусклее)
      const gs = Math.max(p.gemSize, Math.min(15, 20 / s));
      live.stones.forEach((st, i) => {
        const lift = drag?.kind === "stone" && drag.i === i ? 1 : hover === i ? 0.5 : 0;
        gem3d(st.p, gs, st.minus, st.plus, t, lift, outCols[i]);
      });

      // частицы
      for (let i = parts.length - 1; i >= 0; i--) {
        const pt = parts[i];
        const age = (now - pt.born) / pt.life;
        if (age >= 1) { parts.splice(i, 1); continue; }
        pt.x += pt.vx * 0.025; pt.y += pt.vy * 0.025; pt.vy += 2.2;
        px(pt.x, pt.y, pt.sz * (1 - age * 0.5), css(pt.c, (1 - age) * 0.95));
      }

      // победная волна
      if (solved && solveT >= 0) {
        const bp = (now - solveT) / 1100;
        if (bp < 1) {
          const wr = bp * Math.hypot(LW, LH) * 0.55;
          const n = 42;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            px(live.emitter.x + Math.cos(a) * wr, live.emitter.y + LH * 0.4 + Math.sin(a) * wr * 0.6, 1.8, css(COLORS.white, (1 - bp) * 0.5));
          }
        }
      }
      ctx!.shadowBlur = 0;
    }

    function tick(now: number) {
      if (stopped || !visible || reduce) return;
      raf = requestAnimationFrame(tick);
      if (now - lastDraw < FRAME_MS) return;
      lastDraw = now;
      draw(now);
    }

    function fit() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas!.width = Math.round(rect.width * dpr);
      canvas!.height = Math.round(rect.height * dpr);
      s = Math.min(rect.width / LW, rect.height / LH);
      offX = (rect.width - LW * s) / 2;
      offY = (rect.height - LH * s) / 2;
      ctx!.setTransform(dpr * s, 0, 0, dpr * s, dpr * offX, dpr * offY);
      layoutFromLevel();
      if (reduce) draw(performance.now());
    }

    function pos(e: PointerEvent): Pt {
      const rect = canvas!.getBoundingClientRect();
      return {
        x: clamp(((e.clientX - rect.left) - offX) / s, 0, LW),
        y: clamp(((e.clientY - rect.top) - offY) / s, 0, LH),
      };
    }
    const pick = (base: number) => Math.max(base, (coarse ? 34 : base) / s);
    function stoneAt(p: Pt): number {
      let bi = -1, best = pick(22);
      live.stones.forEach((st, i) => {
        const d = Math.hypot(p.x - st.p.x, p.y - st.p.y);
        if (d < best) { best = d; bi = i; }
      });
      return bi;
    }
    function onDown(e: PointerEvent) {
      const p = pos(e);
      if (live.mirror && !lockMirror) {
        const [mA] = mirrorEnds(live.mirror);
        if (Math.hypot(p.x - mA.x, p.y - mA.y) < pick(16)) drag = { kind: "mrot" };
      }
      if (!drag) {
        const bi = stoneAt(p);
        if (bi >= 0) drag = { kind: "stone", i: bi };
        else if (live.mirror && !lockMirror && Math.hypot(p.x - live.mirror.p.x, p.y - live.mirror.p.y) < pick(26)) drag = { kind: "mirror" };
      }
      try { canvas!.setPointerCapture(e.pointerId); } catch {}
      if (reduce && drag) draw(performance.now());
    }
    function onMove(e: PointerEvent) {
      const p = pos(e);
      if (!drag) { hover = stoneAt(p); canvas!.style.cursor = hover >= 0 ? "grab" : "default"; return; }
      canvas!.style.cursor = "grabbing";
      const cp = { x: clamp(p.x, 6, LW - 6), y: clamp(p.y, 6, LH - 6) };
      if (drag.kind === "stone" && drag.i != null) live.stones[drag.i].p = cp;
      else if (drag.kind === "mirror" && live.mirror) live.mirror.p = cp;
      else if (drag.kind === "mrot" && live.mirror) live.mirror.ang = Math.atan2(p.y - live.mirror.p.y, p.x - live.mirror.p.x);
      if (reduce) draw(performance.now());
    }
    function onUp() { drag = null; canvas!.style.cursor = "default"; }
    function onCtx(e: Event) { e.preventDefault(); }

    const ro = new ResizeObserver(() => fit());
    ro.observe(canvas);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("contextmenu", onCtx);
    fit();
    if (!reduce) raf = requestAnimationFrame(tick);

    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries[0]?.isIntersecting ?? true;
        if (vis && !visible && !reduce) { visible = true; raf = requestAnimationFrame(tick); }
        else if (!vis && visible) { visible = false; cancelAnimationFrame(raf); }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("contextmenu", onCtx);
    };
  }, [level, lockMirror, paramsRef]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      } as React.CSSProperties}
      aria-label="Головоломка (песочница V3): двигай кристаллы, чтобы зажечь все площадки"
      role="img"
    />
  );
}

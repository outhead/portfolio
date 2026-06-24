"use client";

import { useEffect, useRef, useState } from "react";

export type PulseVariant = "rain" | "build" | "radar";

interface PulseAnimationProps {
  variant: PulseVariant;
  /** Реверс направления. Для radar — луч крутится в обратную сторону. */
  reverse?: boolean;
  className?: string;
  /** Принудительная активация анимации (вместе с hover). Используется для мобильного scroll-trigger. */
  active?: boolean;
}

const W = 150;
const H = 150;
const cx = W / 2;
const cy = H / 2;

// ── Квадратная dot-matrix сетка, обрезанная в круг ──────────────────
// Точки лежат на узлах регулярной сетки (как LED-табло), круг — маска по
// радиусу. В анимациях позиции НЕ двигаются — меняются только яркость и
// (где нужно) размер, поэтому сетка всегда читается.
const STEP = 11; // шаг сетки, px
const GRID_R = 6; // колец сетки от центра → ~13 точек по диаметру
const MAX_R = GRID_R * STEP; // 66 — радиус круга-маски
const TAU = Math.PI * 2;
const BASE_SIZE = 1.7;

type Dot = { x: number; y: number; r: number; ang: number; gx: number; gy: number };
const dots: Dot[] = (() => {
  const out: Dot[] = [];
  for (let gy = -GRID_R; gy <= GRID_R; gy++) {
    for (let gx = -GRID_R; gx <= GRID_R; gx++) {
      const r = Math.hypot(gx, gy) * STEP;
      if (r > MAX_R + 0.5) continue; // маска круга
      out.push({ x: cx + gx * STEP, y: cy + gy * STEP, r, ang: Math.atan2(gy, gx), gx, gy });
    }
  }
  return out;
})();

const ss = (v: number) => {
  const c = Math.max(0, Math.min(1, v));
  return c * c * (3 - 2 * c);
};
const seed = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

// Порядок зажигания для «сборки»: от центра к краю, с лёгким рандомом внутри кольца.
const buildOrder: number[] = (() => {
  const idx = dots.map((_, i) => i).sort((a, b) => dots[a].r - dots[b].r || seed(a) - seed(b));
  const rank = new Array<number>(dots.length);
  idx.forEach((di, r) => (rank[di] = r));
  return rank;
})();

/** Pulse-анимации для плиток «Услуги & экспертиза»:
 *  - default: статичный кадр, точки серые
 *  - hover ближайшего .group-родителя / active: RAF-анимация, точки зелёные #A6FF00 */
export default function PulseAnimation({ variant, reverse = false, className, active = false }: PulseAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState(false);
  const isPlaying = hover || active;

  // hover-listener на ближайшем .group-родителе
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let el: HTMLElement | null = canvas;
    while (el && !el.classList.contains("group")) {
      el = el.parentElement;
    }
    const target: HTMLElement | null = el ?? canvas.parentElement;
    if (!target) return;
    const enter = () => setHover(true);
    const leave = () => setHover(false);
    target.addEventListener("mouseenter", enter);
    target.addEventListener("mouseleave", leave);
    return () => {
      target.removeEventListener("mouseenter", enter);
      target.removeEventListener("mouseleave", leave);
    };
  }, []);

  // RAF-loop при hover/active; статичный кадр без них
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const fill = (a: number) =>
      isPlaying
        ? `rgba(166, 255, 0, ${Math.max(0, Math.min(1, a))})`
        : `rgba(255, 255, 255, ${Math.max(0, Math.min(1, a * 0.55))})`;

    const dot = (d: Dot, op: number, size: number) => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, size, 0, TAU);
      ctx.fillStyle = fill(op);
      ctx.fill();
    };

    // Дождь — колонки точек «падают» сверху вниз со своей скоростью (matrix).
    const drawRain = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const cyc = GRID_R * 2 + 7;
      const trail = 3.2;
      for (const d of dots) {
        const col = d.gx + GRID_R;
        const spd = 3.2 + seed(col) * 2.2;
        const off = seed(col * 7.3) * cyc;
        const head = ((t * spd + off) % cyc) - GRID_R - 1;
        const dy = head - d.gy;
        const e = dy >= 0 ? Math.exp(-dy / trail) : 0;
        dot(d, 0.12 + ss(e) * 0.84, BASE_SIZE);
      }
    };

    // Сборка — точки набираются от центра к краю, затем плавный сброс (прогресс).
    const drawBuild = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const cyc = 2.4;
      const tc = t % cyc;
      const frac = tc < 1.8 ? ss(tc / 1.8) : 1 - ss((tc - 1.8) / 0.6);
      const fillN = frac * dots.length;
      for (let i = 0; i < dots.length; i++) {
        const e = Math.max(0, Math.min(1, fillN - buildOrder[i]));
        dot(dots[i], 0.12 + e * 0.78, BASE_SIZE);
      }
    };

    // Радар — вращающийся луч с затухающим хвостом.
    const drawRadar = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const dir = reverse ? -1 : 1;
      const sweep = ((t * 1.7 * dir) % TAU + TAU) % TAU;
      const width = 2.2;
      for (const d of dots) {
        let da = (d.ang - sweep) * dir;
        da = ((da % TAU) + TAU) % TAU;
        const e = Math.exp(-da / width);
        dot(d, 0.14 + ss(e) * 0.82, BASE_SIZE);
      }
    };

    const drawDefault = () => {
      ctx.clearRect(0, 0, W, H);
      for (const d of dots) dot(d, 0.45, BASE_SIZE);
    };

    const drawAt = (t: number) => {
      if (variant === "rain") drawRain(t);
      else if (variant === "build") drawBuild(t);
      else drawRadar(t);
    };

    let time = 0;
    let lastTime: number | null = null;
    let rafId = 0;
    let stopped = false;

    if (isPlaying) {
      const loop = (now: number) => {
        if (stopped) return;
        if (lastTime == null) lastTime = now;
        const dt = (now - lastTime) / 1000;
        lastTime = now;
        time += dt;
        drawAt(time);
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    } else {
      drawDefault();
    }

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
    };
  }, [isPlaying, variant, reverse]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: W, height: H }}
      className={className}
      aria-hidden
    />
  );
}

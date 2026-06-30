"use client";

import { useEffect, useRef } from "react";

/**
 * PixelFire — зелёный пиксельный огонь (doom-fire) на дот-решётке.
 * Источник снизу, языки поднимаются и гаснут; время от времени —
 * вспышка (flare): база тлеет тускло, изредка пламя резко взмётывается.
 * Фон hero кейса про диодный шрифт. Параметры подобраны в fire-lab.html.
 *
 * Перф: DPR ≤ 1.5, FPS-кап ~32, пауза вне экрана (IntersectionObserver),
 * reduced-motion → один застывший кадр.
 */
const CFG = {
  cell: 9,        // шаг диодов (px)
  dot: 0.38,      // радиус точки в долях cell на максимуме тепла
  cooling: 0.8,   // охлаждение → высота языков (больше = ниже)
  wind: 0.7,      // горизонтальный снос
  source: 0.42,   // базовая яркость источника (тлеет)
  flareFreq: 0.5, // частота вспышек (триггеров/сек)
  flareAmp: 0.7,  // сила вспышки
  density: 0.2,   // порог отрисовки точки (плотность пламени)
  bright: 1.1,    // множитель яркости палитры
};

export default function PixelFire({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const C = CFG;

    // Палитра по «теплу»: тускло-зелёный → лайм → почти белый.
    const BUCKETS = 7;
    const bColor: string[] = [];
    const bR: number[] = [];
    for (let b = 0; b < BUCKETS; b++) {
      const t = b / (BUCKETS - 1);
      const r = Math.min(255, Math.round(40 * t + 215 * t * t * t));
      const g = Math.min(255, Math.round(90 + 165 * t));
      const bl = Math.round(28 * t * t);
      const a = Math.min(1, (0.18 + 0.64 * t) * C.bright).toFixed(3);
      bColor[b] = `rgba(${r},${g},${bl},${a})`;
      bR[b] = (0.14 + t * C.dot) * C.cell;
    }

    let W = 1, H = 1, cols = 1, rows = 1;
    let heat = new Float32Array(1);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(1, rect.width); H = Math.max(1, rect.height);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / C.cell) + 1;
      rows = Math.ceil(H / C.cell) + 1;
      heat = new Float32Array(cols * rows);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    const FRAME_MS = 1000 / 32;
    let raf = 0, lastDraw = 0, visible = true, stopped = false, flareEnv = 0;

    const step = () => {
      flareEnv *= 0.93;
      if (Math.random() < C.flareFreq / 32) flareEnv = Math.min(1.4, flareEnv + 1);
      const eff = Math.min(1.3, C.source * (1 + C.flareAmp * flareEnv));
      const maxDecay = 0.035 + C.cooling * 0.34;

      for (let x = 0; x < cols; x++) {
        heat[(rows - 1) * cols + x] = Math.min(1.2, eff * (0.8 + Math.random() * 0.2));
        heat[(rows - 2) * cols + x] = Math.min(1.2, eff * (0.75 + Math.random() * 0.2));
      }
      for (let y = rows - 2; y >= 0; y--) {
        const base = y * cols, below = (y + 1) * cols;
        for (let x = 0; x < cols; x++) {
          const h = heat[below + x];
          if (h <= 0) continue;
          const dec = Math.random() * maxDecay;
          let nx = x + Math.round((Math.random() * 2 - 1) * C.wind);
          if (nx < 0) nx = 0; else if (nx >= cols) nx = cols - 1;
          const v = h - dec;
          if (v > heat[base + nx]) heat[base + nx] = v > 0 ? v : 0;
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const paths: Path2D[] = [];
      for (let b = 0; b < BUCKETS; b++) paths[b] = new Path2D();
      for (let y = 0; y < rows; y++) {
        const row = y * cols;
        for (let x = 0; x < cols; x++) {
          const h = heat[row + x];
          if (h < C.density) continue;
          let b = Math.floor(((h - C.density) / (1 - C.density)) * BUCKETS);
          if (b < 0) b = 0; else if (b >= BUCKETS) b = BUCKETS - 1;
          const cx = x * C.cell + C.cell / 2;
          const cy = y * C.cell + C.cell / 2;
          const r = bR[b];
          paths[b].moveTo(cx + r, cy);
          paths[b].arc(cx, cy, r, 0, 6.283);
        }
      }
      for (let b = 0; b < BUCKETS; b++) {
        ctx.fillStyle = bColor[b];
        ctx.fill(paths[b]);
      }
    };

    const loop = (now: number) => {
      if (stopped || !visible) return;
      raf = requestAnimationFrame(loop);
      if (now - lastDraw < FRAME_MS) return;
      lastDraw = now;
      step();
      draw();
    };

    if (reduce) {
      for (let i = 0; i < 50; i++) step();
      draw();
    } else {
      raf = requestAnimationFrame(loop);
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (reduce) return;
        const v = entries[0]?.isIntersecting ?? true;
        if (v && !visible) { visible = true; lastDraw = 0; raf = requestAnimationFrame(loop); }
        else if (!v && visible) { visible = false; cancelAnimationFrame(raf); }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    return () => { stopped = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} style={{ display: "block" }} />;
}

"use client";

import { useEffect, useRef } from "react";

/**
 * PixelFire — зелёный пиксельный огонь (doom-fire) на дот-решётке.
 * Пламя рисуется теми же диодами, что и весь сайт: «тепло» ячейки → размер
 * и яркость точки. Источник снизу, языки поднимаются вверх и гаснут.
 * Фон hero кейса про диодный шрифт — буквально «шрифт горит».
 *
 * Перф (как у LedCover/ParticlePortrait): DPR ≤ 1.5, FPS-кап ~32,
 * пауза рисования вне экрана (IntersectionObserver) и при reduced-motion
 * (один застывший кадр вместо анимации).
 */
export default function PixelFire({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const CELL = 13; // шаг диодов — крупный «пиксель» пламени
    let W = 1, H = 1, cols = 1, rows = 1;
    let heat = new Float32Array(1);

    // Палитра по «теплу»: тускло-зелёный → лайм → почти белый.
    const BUCKETS = 6;
    const bucketColor: string[] = [];
    const bucketR: number[] = [];
    for (let b = 0; b < BUCKETS; b++) {
      const t = b / (BUCKETS - 1); // 0..1
      const r = Math.min(255, Math.round(40 * t + 210 * t * t * t));
      const g = Math.min(255, Math.round(95 + 160 * t));
      const bl = Math.round(25 * t * t);
      const a = (0.2 + 0.62 * t).toFixed(3);
      bucketColor[b] = `rgba(${r},${g},${bl},${a})`;
      bucketR[b] = 1 + t * (CELL * 0.34);
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(1, rect.width); H = Math.max(1, rect.height);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / CELL) + 1;
      rows = Math.ceil(H / CELL) + 1;
      heat = new Float32Array(cols * rows);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    const FRAME_MS = 1000 / 32;
    let raf = 0, last = 0, visible = true, stopped = false;

    const step = () => {
      // Источник снизу: два горячих ряда с мерцанием.
      for (let x = 0; x < cols; x++) {
        heat[(rows - 1) * cols + x] = 0.78 + Math.random() * 0.22;
        heat[(rows - 2) * cols + x] = 0.7 + Math.random() * 0.25;
      }
      // Распространение вверх: охлаждение + горизонтальный снос (мерцание).
      for (let y = rows - 3; y >= 0; y--) {
        for (let x = 0; x < cols; x++) {
          const below = heat[(y + 1) * cols + x];
          const decay = Math.random() * 0.2;
          let nx = x + (Math.floor(Math.random() * 3) - 1);
          if (nx < 0) nx = 0; else if (nx >= cols) nx = cols - 1;
          const v = below - decay - y * 0.0007; // верх остывает чуть сильнее
          heat[y * cols + nx] = v > 0 ? v : 0;
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const paths: Path2D[] = [];
      for (let b = 0; b < BUCKETS; b++) paths[b] = new Path2D();
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const h = heat[y * cols + x];
          if (h < 0.16) continue;
          let b = Math.floor(((h - 0.16) / 0.84) * BUCKETS);
          if (b < 0) b = 0; else if (b >= BUCKETS) b = BUCKETS - 1;
          const cx = x * CELL + CELL / 2;
          const cy = y * CELL + CELL / 2;
          const r = bucketR[b];
          paths[b].moveTo(cx + r, cy);
          paths[b].arc(cx, cy, r, 0, 6.283);
        }
      }
      for (let b = 0; b < BUCKETS; b++) {
        ctx.fillStyle = bucketColor[b];
        ctx.fill(paths[b]);
      }
    };

    const loop = (now: number) => {
      if (stopped || !visible) return;
      raf = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return;
      last = now;
      step();
      draw();
    };

    if (reduce) {
      for (let i = 0; i < 40; i++) step(); // застывший кадр пламени
      draw();
    } else {
      raf = requestAnimationFrame(loop);
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (reduce) return;
        const v = entries[0]?.isIntersecting ?? true;
        if (v && !visible) { visible = true; last = 0; raf = requestAnimationFrame(loop); }
        else if (!v && visible) { visible = false; cancelAnimationFrame(raf); }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    return () => { stopped = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} style={{ display: "block" }} />;
}

"use client";

import { useEffect, useRef } from "react";
import { layoutLedText, LED_ROWS } from "@/components/ledFont";

/**
 * PixelFire — зелёный пиксельный огонь (doom-fire) на дот-решётке.
 * Если задан `text` — пламя поднимается ИЗ БУКВ слогана (text-emitter), а сами
 * буквы рисуются чёрным поверх: тёмный вырез в собственном огне. Без `text` —
 * классический огонь снизу. База тлеет тускло, изредка вспышка (flare).
 * Текст рисуется прямо в канвасе → идеально совпадает с пламенем.
 * Сетка прогревается на старте, поэтому пламя видно сразу (без «наливания»).
 *
 * Перф: DPR ≤ 1.5, FPS-кап ~32, пауза вне экрана (IO), reduced-motion → статика.
 * Параметры огня подбирались в fire-lab.html.
 */
const CFG = {
  cell: 9,
  dot: 0.38,
  cooling: 0.62,   // чуть ниже охлаждение → языки выше (читаемее буквы)
  wind: 0.8,
  source: 0.62,    // ярче базы, чтобы чёрный текст читался всегда
  flareFreq: 0.5,
  flareAmp: 0.7,
  density: 0.18,
  bright: 1.1,
};

export default function PixelFire({ text, className = "" }: { text?: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const textKey = text ?? "";

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const C = CFG;
    const hasText = !!textKey.trim();

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
    let mask = new Uint8Array(1);

    const buildText = () => {
      mask = new Uint8Array(cols * rows);
      if (!hasText) return;
      const lines = textKey.split("\n").filter((s) => s.length);
      const lays = lines.map((l) => layoutLedText(l, 1));
      const maxCols = Math.max(1, ...lays.map((l) => l.cols));
      const totalRows = lines.length * LED_ROWS + (lines.length - 1) * 2;
      let px = Math.floor((W * 0.78 / C.cell) / maxCols);
      px = Math.min(px, Math.floor((H * 0.4 / C.cell) / totalRows));
      px = Math.max(2, px);
      const blockRows = totalRows * px;
      // центр блока ~42% высоты — пламя из букв уходит в верхнюю треть
      let ry = Math.round(rows * 0.42 - blockRows / 2);
      for (const lay of lays) {
        const tW = lay.cols * px;
        const ox = Math.floor((cols - tW) / 2);
        for (const d of lay.dots) {
          if (!d.lit) continue;
          for (let yy = 0; yy < px; yy++)
            for (let xx = 0; xx < px; xx++) {
              const cx = ox + d.col * px + xx, cy = ry + d.row * px + yy;
              if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) mask[cy * cols + cx] = 1;
            }
        }
        ry += (LED_ROWS + 2) * px;
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(1, rect.width); H = Math.max(1, rect.height);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / C.cell) + 1;
      rows = Math.ceil(H / C.cell) + 1;
      heat = new Float32Array(cols * rows);
      buildText();
      for (let i = 0; i < 70; i++) step(); // прогрев — пламя сразу заполнено
    };

    const FRAME_MS = 1000 / 32;
    let raf = 0, lastDraw = 0, visible = true, stopped = false, flareEnv = 0;

    function step() {
      flareEnv *= 0.93;
      if (Math.random() < C.flareFreq / 32) flareEnv = Math.min(1.4, flareEnv + 1);
      const eff = Math.min(1.3, C.source * (1 + C.flareAmp * flareEnv));
      const maxDecay = 0.035 + C.cooling * 0.34;

      if (hasText) {
        for (let i = 0; i < mask.length; i++)
          if (mask[i]) heat[i] = Math.min(1.2, eff * (0.85 + Math.random() * 0.15));
      } else {
        for (let x = 0; x < cols; x++) {
          heat[(rows - 1) * cols + x] = Math.min(1.2, eff * (0.8 + Math.random() * 0.2));
          heat[(rows - 2) * cols + x] = Math.min(1.2, eff * (0.75 + Math.random() * 0.2));
        }
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
    }

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
      // чёрные буквы — вырез в собственном пламени
      if (hasText) {
        const p = new Path2D();
        const rr = C.cell * 0.52;
        for (let i = 0; i < mask.length; i++) {
          if (!mask[i]) continue;
          const x = i % cols, y = (i / cols) | 0;
          p.moveTo(x * C.cell + C.cell / 2 + rr, y * C.cell + C.cell / 2);
          p.arc(x * C.cell + C.cell / 2, y * C.cell + C.cell / 2, rr, 0, 6.283);
        }
        ctx.fillStyle = "#000";
        ctx.fill(p);
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

    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    if (reduce) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textKey]);

  return <canvas ref={ref} aria-hidden className={className} style={{ display: "block" }} />;
}

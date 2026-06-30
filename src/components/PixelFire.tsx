"use client";

import { useEffect, useRef } from "react";
import { layoutLedText, LED_ROWS } from "@/components/ledFont";

/**
 * PixelFire — зелёный пиксельный огонь (doom-fire) на дот-решётке.
 * С `text`: буквы слогана горят (пламя поднимается из ячеек под буквами),
 * сами буквы — чёрный вырез поверх. Разрешение текста ОТВЯЗАНО от шага огня:
 * буквы рисуются мелкой чёткой сеткой (tpx), а эмиттер огня — на грубой
 * решётке cell. Поэтому длинный слоган влезает, а пламя не сливается в стену.
 * База тлеет, изредка вспышка (flare). Сетка прогревается на старте.
 *
 * Перф: DPR ≤ 1.5, FPS-кап ~32, пауза вне экрана (IO), reduced-motion → статика.
 */
const CFG = {
  cell: 10,        // шаг решётки огня (px)
  dot: 0.4,        // радиус точки огня на максимуме тепла (доли cell)
  cooling: 0.75,   // охлаждение → высота языков (больше = короче)
  wind: 0.6,
  source: 0.52,
  flareFreq: 0.3,
  flareAmp: 0.5,
  density: 0.24,   // порог отрисовки (больше = реже пламя)
  bright: 1.05,
  textW: 0.66,     // целевая ширина текста (доля ширины hero)
  textH: 0.3,      // максимум высоты блока текста (доля высоты hero)
  textCenter: 0.4, // центр блока текста по высоте (доля)
  emitDrop: 3,     // источник огня ниже букв на N пиксельных рядов (пламя встаёт снизу)
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

    let W = 1, H = 1, cols = 1, rows = 1, tpx = 4;
    let heat = new Float32Array(1);
    let mask = new Uint8Array(1);
    let blackDots: number[] = []; // плоский [cx,cy, cx,cy, ...] центры чёрных точек (px)

    const buildText = () => {
      mask = new Uint8Array(cols * rows);
      blackDots = [];
      if (!hasText) return;
      const lines = textKey.split("\n").filter((s) => s.length);
      const lays = lines.map((l) => layoutLedText(l, 1));
      const maxCols = Math.max(1, ...lays.map((l) => l.cols));
      const totalRows = lines.length * LED_ROWS + (lines.length - 1) * 2;
      // tpx — пиксель буквы, отвязан от шага огня
      tpx = Math.round((W * C.textW) / maxCols);
      tpx = Math.min(tpx, Math.floor((H * C.textH) / totalRows));
      if (tpx < 3) tpx = 3;
      const blockH = totalRows * tpx;
      let yTop = Math.round(H * C.textCenter - blockH / 2);
      for (const lay of lays) {
        const tW = lay.cols * tpx;
        const ox = Math.round((W - tW) / 2);
        for (const d of lay.dots) {
          if (!d.lit) continue;
          const px = ox + d.col * tpx, py = yTop + d.row * tpx;
          blackDots.push(px + tpx / 2, py + tpx / 2);
          // эмиттер сплошняком от буквы вниз на emitDrop рядов — без тёмного зазора под текстом
          const ey = py + C.emitDrop * tpx;
          const c0 = Math.floor(px / C.cell), c1 = Math.floor((px + tpx - 1) / C.cell);
          const r0 = Math.floor(py / C.cell), r1 = Math.floor((ey + tpx - 1) / C.cell);
          for (let cc = c0; cc <= c1; cc++)
            for (let rr = r0; rr <= r1; rr++)
              if (cc >= 0 && cc < cols && rr >= 0 && rr < rows) mask[rr * cols + cc] = 1;
        }
        yTop += (LED_ROWS + 2) * tpx;
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
      for (let i = 0; i < 70; i++) step(); // прогрев — пламя сразу
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
          const cx = x * C.cell + C.cell / 2, cy = y * C.cell + C.cell / 2, r = bR[b];
          paths[b].moveTo(cx + r, cy);
          paths[b].arc(cx, cy, r, 0, 6.283);
        }
      }
      for (let b = 0; b < BUCKETS; b++) { ctx.fillStyle = bColor[b]; ctx.fill(paths[b]); }
      // чёрные буквы — мелкий чёткий вырез поверх своего пламени
      if (hasText && blackDots.length) {
        const p = new Path2D();
        const rr = tpx * 0.82;
        for (let i = 0; i < blackDots.length; i += 2) {
          p.moveTo(blackDots[i] + rr, blackDots[i + 1]);
          p.arc(blackDots[i], blackDots[i + 1], rr, 0, 6.283);
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

    if (reduce) draw();
    else raf = requestAnimationFrame(loop);

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

"use client";

/* ─────────────────────────────────────────────────────────────────
 * PixelPortrait — бинарный табло-портрет.
 * Каждая ячейка = символ 0/1, нарисованный теми же диодами 5×7,
 * что и весь LED-движок сайта (ledFont). Яркость диодов = яркость
 * портрета; тусклое поле цифр вокруг — как матрица.
 * Анимация — флипбук по кадрам (перерисовка только на смене кадра).
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import { LED_GLYPHS } from "@/components/ledFont";

const G0 = LED_GLYPHS["0"];
const G1 = LED_GLYPHS["1"];

export type PixelPortraitProps = {
  frames?: string[];
  src?: string;
  /** цифр по ширине */
  cols?: number;
  /** мс на кадр */
  holdMs?: number;
  /** контраст теней */
  gamma?: number;
  /** доля «живых» (изредка перещёлкивают 0↔1) 0..1 */
  shimmer?: number;
  className?: string;
};

const LO: [number, number, number] = [12, 16, 10];
const HI: [number, number, number] = [166, 255, 0];
const DIM = "rgba(120,150,90,0.10)"; // поле невключённых цифр

// стабильный псевдослучай по координате
function hash(x: number, y: number) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

export default function PixelPortrait({
  frames,
  src = "/images/hero-portrait.png",
  cols = 56,
  holdMs = 90,
  gamma = 0.95,
  shimmer = 0,
  className = "",
}: PixelPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const list = (frames && frames.length ? frames : [src]).join("|");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const urls = list.split("|");
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let stopped = false;

    type Grid = { cols: number; rows: number; lum: Float32Array };
    const grids: (Grid | null)[] = urls.map(() => null);
    const sampler = document.createElement("canvas");
    const sctx = sampler.getContext("2d", { willReadFrequently: true })!;

    // цифры выше квадрата → меньше рядов, чтобы лицо не вытягивалось
    const ROW_FACTOR = 0.62;

    function makeGrid(img: HTMLImageElement): Grid {
      const ratio = (img.height / img.width) * ROW_FACTOR;
      const rows = Math.max(1, Math.round(cols * ratio));
      sampler.width = cols;
      sampler.height = rows;
      sctx.clearRect(0, 0, cols, rows);
      sctx.drawImage(img, 0, 0, cols, rows);
      const d = sctx.getImageData(0, 0, cols, rows).data;
      const lum = new Float32Array(cols * rows);
      for (let i = 0, p = 0; i < d.length; i += 4, p++) {
        const a = d[i + 3] / 255;
        let l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
        l = Math.pow(l, gamma) * a;
        lum[p] = l;
      }
      return { cols, rows, lum };
    }

    let loaded = 0;
    urls.forEach((u, i) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        grids[i] = makeGrid(img);
        loaded++;
        if (loaded === 1) start();
      };
      img.src = u;
    });

    let dpr = 1;
    function fit() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.max(1, Math.round(rect.width * dpr));
      canvas!.height = Math.max(1, Math.round(rect.height * dpr));
      drawn = -1; // форсировать перерисовку
    }

    let cur = 0;
    let phaseStart = 0;
    let drawn = -1; // какой кадр уже нарисован
    let shimmerTick = 0;

    function start() {
      fit();
      phaseStart = performance.now();
      raf = requestAnimationFrame(loop);
    }

    function loop(now: number) {
      if (stopped) return;
      raf = requestAnimationFrame(loop);
      const multi = grids.length > 1 && !reduce;
      if (multi && now - phaseStart >= holdMs) {
        cur = (cur + 1) % grids.length;
        phaseStart = now;
      }
      const needShimmer = shimmer > 0 && !reduce && now - shimmerTick > 120;
      if (cur !== drawn || needShimmer) {
        if (needShimmer) shimmerTick = now;
        draw();
        drawn = cur;
      }
    }

    function draw() {
      const g = grids[cur];
      if (!g) return;
      const cw = canvas!.width;
      const ch = canvas!.height;
      ctx!.clearRect(0, 0, cw, ch);

      const gx = 1; // зазор между цифрами в субпикселях
      const gy = 1;
      const dataW = g.cols * (5 + gx);
      const dataH = g.rows * (7 + gy);
      const boardRatio = dataH / dataW;
      let dw = cw;
      let dh = cw * boardRatio;
      if (dh > ch) {
        dh = ch;
        dw = ch / boardRatio;
      }
      const sub = dw / dataW; // размер субпикселя
      const ox = (cw - dw) / 2;
      const oy = ch - dh; // прижать снизу
      const dot = sub * 0.42;
      const cellW = (5 + gx) * sub;
      const cellH = (7 + gy) * sub;

      for (let y = 0; y < g.rows; y++) {
        for (let x = 0; x < g.cols; x++) {
          const l = g.lum[y * g.cols + x];
          let useOne = hash(x, y) < 0.5;
          if (shimmer > 0 && hash(x + shimmerTick * 0.01, y) < shimmer) useOne = !useOne;
          const glyph = useOne ? G1 : G0;
          const lit = l >= 0.07;
          let fill: string;
          if (lit) {
            const cr = Math.round(LO[0] + (HI[0] - LO[0]) * Math.min(1, l));
            const cg = Math.round(LO[1] + (HI[1] - LO[1]) * Math.min(1, l));
            const cb = Math.round(LO[2] + (HI[2] - LO[2]) * Math.min(1, l));
            fill = `rgb(${cr},${cg},${cb})`;
          } else {
            fill = DIM;
          }
          ctx!.fillStyle = fill;
          const bx = ox + x * cellW;
          const by = oy + y * cellH;
          for (let r = 0; r < 7; r++) {
            const row = glyph[r];
            for (let c = 0; c < 5; c++) {
              if (row[c] !== "1") continue;
              const px = bx + c * sub + sub / 2;
              const py = by + r * sub + sub / 2;
              ctx!.beginPath();
              ctx!.arc(px, py, dot, 0, 6.283);
              ctx!.fill();
            }
          }
        }
      }
    }

    const ro = new ResizeObserver(() => fit());
    ro.observe(canvas);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [list, cols, holdMs, gamma, shimmer]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-label="Бинарный портрет"
      role="img"
    />
  );
}

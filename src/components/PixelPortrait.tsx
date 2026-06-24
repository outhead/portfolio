"use client";

/* ─────────────────────────────────────────────────────────────────
 * PixelPortrait — диодное табло-портрет.
 * Каждый «пиксель» = кругляш-диод (как LedBoard), высокая плотность.
 * Анимация: циклит несколько кадров (говорит / пишет / рисует)
 * с диодным переходом — яркость диодов перетекает кадр→кадр.
 * Один кадр = живёт лёгким мерцанием, без полос-переходов.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

export type PixelPortraitProps = {
  /** один или несколько кадров; >1 — циклятся */
  frames?: string[];
  src?: string; // алиас для одного кадра
  /** диодов по ширине */
  cols?: number;
  /** сколько держать кадр, мс */
  holdMs?: number;
  /** длительность перехода между кадрами, мс */
  morphMs?: number;
  /** лёгкое мерцание диодов 0..1 */
  flicker?: number;
  /** контраст теней */
  gamma?: number;
  className?: string;
};

const LO: [number, number, number] = [12, 16, 10];
const HI: [number, number, number] = [166, 255, 0];

type Grid = { cols: number; rows: number; lum: Float32Array };

export default function PixelPortrait({
  frames,
  src = "/images/hero-portrait.png",
  cols = 90,
  holdMs = 90,
  morphMs = 0,
  flicker = 0,
  gamma = 0.95,
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
    const grids: (Grid | null)[] = urls.map(() => null);

    const sampler = document.createElement("canvas");
    const sctx = sampler.getContext("2d", { willReadFrequently: true })!;

    function makeGrid(img: HTMLImageElement): Grid {
      const ratio = img.height / img.width;
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
    }

    let cur = 0;
    let phaseStart = 0;
    const fps = 30;
    const frameInterval = 1000 / fps;
    let last = 0;

    function start() {
      fit();
      phaseStart = performance.now();
      raf = requestAnimationFrame(loop);
    }

    function activeGrids() {
      const a = grids[cur];
      const nextIdx = (cur + 1) % grids.length;
      const b = grids[nextIdx] || a;
      return { a, b, nextIdx };
    }

    function loop(now: number) {
      if (stopped) return;
      raf = requestAnimationFrame(loop);
      if (now - last < frameInterval) return;
      last = now;

      const { a, b, nextIdx } = activeGrids();
      if (!a) return;

      // фаза кадра: hold -> morph -> переключение
      let t = 0; // 0..1 интерполяция a->b
      if (grids.length > 1 && !reduce) {
        const elapsed = now - phaseStart;
        if (elapsed > holdMs + morphMs) {
          cur = nextIdx;
          phaseStart = now;
        } else if (elapsed > holdMs) {
          const m = (elapsed - holdMs) / morphMs;
          t = m < 0.5 ? 2 * m * m : 1 - Math.pow(-2 * m + 2, 2) / 2; // easeInOut
        }
      }

      const cw = canvas!.width;
      const ch = canvas!.height;
      ctx!.clearRect(0, 0, cw, ch);
      ctx!.fillStyle = "#08090800";

      const gcols = a.cols;
      const grows = a.rows;
      // вписать по ширине, прижать снизу
      const boardRatio = grows / gcols;
      let dw = cw;
      let dh = cw * boardRatio;
      if (dh > ch) {
        dh = ch;
        dw = ch / boardRatio;
      }
      const ox = (cw - dw) / 2;
      const oy = ch - dh;
      const cell = dw / gcols;
      const rUnlit = cell * 0.16;
      const useB = t > 0 && b;

      for (let y = 0; y < grows; y++) {
        const py = oy + y * cell + cell / 2;
        for (let x = 0; x < gcols; x++) {
          const idx = y * gcols + x;
          let l = a.lum[idx];
          if (useB) l = l + (b!.lum[idx] - l) * t;
          if (flicker > 0 && !reduce) {
            // плавное мерцание: волна по координате+времени, без покадрового шума
            const w = Math.sin((x * 1.3 + y * 0.7) + now * 0.004);
            l *= 1 - flicker * 0.5 + ((w + 1) / 2) * flicker;
          }
          const px = ox + x * cell + cell / 2;
          if (l < 0.05) {
            // невключённый диод — тёмная точка
            ctx!.beginPath();
            ctx!.fillStyle = "rgba(28,32,24,0.55)";
            ctx!.arc(px, py, rUnlit, 0, 6.283);
            ctx!.fill();
            continue;
          }
          const r = cell * (0.28 + 0.22 * l);
          const cr = Math.round(LO[0] + (HI[0] - LO[0]) * l);
          const cg = Math.round(LO[1] + (HI[1] - LO[1]) * l);
          const cb = Math.round(LO[2] + (HI[2] - LO[2]) * l);
          ctx!.beginPath();
          ctx!.fillStyle = `rgb(${cr},${cg},${cb})`;
          ctx!.arc(px, py, r, 0, 6.283);
          ctx!.fill();
          if (l > 0.6) {
            ctx!.beginPath();
            ctx!.fillStyle = `rgba(166,255,0,${(l - 0.6) * 0.5})`;
            ctx!.arc(px, py, r * 1.5, 0, 6.283);
            ctx!.fill();
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
  }, [list, cols, holdMs, morphMs, flicker, gamma]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-label="Пиксельный портрет"
      role="img"
    />
  );
}

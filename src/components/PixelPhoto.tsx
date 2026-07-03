"use client";

/* ─────────────────────────────────────────────────────────────────
 * PixelPhoto — фото под пиксельной сеткой (как грани кубиков).
 * Картинка сэмплится в сетку квадратных ячеек; яркость пикселя →
 * яркость лаймовой ячейки. Незажжённые ячейки остаются тусклыми —
 * так читается сама сетка (LED-панель сайта).
 * object-cover кроп под заданный аспект, рендер на canvas.
 * Ховер мягко добивает яркость до максимума.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";

export type PixelPhotoProps = {
  src: string;
  /** ячеек по ширине */
  cols?: number;
  /** аспект кадра Ш:В (4:5 = 0.8) — под него кропается фото */
  aspect?: number;
  /** контраст теней (>1 — глубже тени) */
  gamma?: number;
  /** доля зазора между ячейками (0..0.5) */
  gap?: number;
  /** порог отсечки фона: ячейки темнее — уходят в тусклую сетку (0..1) */
  threshold?: number;
  /** радиус скругления ячейки в долях стороны (0 — квадрат) */
  radius?: number;
  /** яркость в покое 0..1 (ховер добивает до 1) */
  idle?: number;
  /** цвет тёмных ячеек (тени) — по умолчанию золото */
  loColor?: [number, number, number];
  /** цвет ярких ячеек (света) — по умолчанию тёплый белый */
  hiColor?: [number, number, number];
  className?: string;
};

// тени → золото, света → тёплый белый: «белый с золотым»
const DEF_LO: [number, number, number] = [196, 150, 64];
const DEF_HI: [number, number, number] = [255, 250, 244];
// поле незажжённых ячеек — тёплый нейтральный, еле видно (читается сетка)
const GRID: [number, number, number] = [190, 180, 160];

export default function PixelPhoto({
  src,
  cols = 72,
  aspect = 0.8,
  gamma = 1.0,
  gap = 0.1,
  threshold = 0.05,
  radius = 0.14,
  idle = 0.85,
  loColor = DEF_LO,
  hiColor = DEF_HI,
  className = "",
}: PixelPhotoProps) {
  const locale = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const rows = Math.max(1, Math.round(cols / aspect));
    const lum = new Float32Array(cols * rows);
    let ready = false;

    const sampler = document.createElement("canvas");
    const sctx = sampler.getContext("2d", { willReadFrequently: true })!;

    function buildGrid(img: HTMLImageElement) {
      // object-cover: вырезаем из фото прямоугольник нужного аспекта
      const ar = cols / rows; // целевой аспект Ш:В
      const iar = img.width / img.height;
      let sw = img.width, sh = img.height, sx = 0, sy = 0;
      if (iar > ar) { sw = img.height * ar; sx = (img.width - sw) / 2; }
      else { sh = img.width / ar; sy = (img.height - sh) / 2; }
      sampler.width = cols; sampler.height = rows;
      sctx.clearRect(0, 0, cols, rows);
      sctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
      const d = sctx.getImageData(0, 0, cols, rows).data;
      for (let i = 0, p = 0; i < d.length; i += 4, p++) {
        const a = d[i + 3] / 255;
        let l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
        l = Math.pow(l, gamma) * a;
        lum[p] = l;
      }
      ready = true;
      draw();
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => buildGrid(img);
    img.src = src;

    // ── ховер: плавно поднимаем яркость к 1 ──────────────────────
    let hover = 0, hoverT = 0, raf = 0, stopped = false;
    function onEnter() { hoverT = 1; tick(); }
    function onLeave() { hoverT = 0; tick(); }
    canvas!.addEventListener("pointerenter", onEnter);
    canvas!.addEventListener("pointerleave", onLeave);
    function tick() {
      if (stopped) return;
      cancelAnimationFrame(raf);
      const step = () => {
        hover += (hoverT - hover) * 0.12;
        draw();
        if (Math.abs(hoverT - hover) > 0.005 && !reduce) raf = requestAnimationFrame(step);
        else { hover = reduce ? hoverT : hover; draw(); }
      };
      raf = requestAnimationFrame(step);
    }

    // ── рендер ────────────────────────────────────────────────────
    let dpr = 1;
    function fit() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.max(1, Math.round(rect.width * dpr));
      canvas!.height = Math.max(1, Math.round(rect.height * dpr));
      draw();
    }

    function draw() {
      if (!ready) return;
      const cw = canvas!.width, ch = canvas!.height;
      ctx!.clearRect(0, 0, cw, ch);
      // вписываем сетку cols×rows в канвас по object-cover (заполняем целиком)
      const cell = Math.max(cw / cols, ch / rows);
      const ox = (cw - cell * cols) / 2;
      const oy = (ch - cell * rows) / 2;
      const inset = cell * gap * 0.5;
      const side = cell - inset * 2;
      const r = side * radius;
      const bright = idle + (1 - idle) * hover;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const l = lum[y * cols + x];
          const bx = ox + x * cell + inset;
          const by = oy + y * cell + inset;
          let cr: number, cg: number, cb: number, alpha: number;
          if (l >= threshold) {
            // растягиваем диапазон выше порога на 0..1 — больше тональной игры
            const tt = Math.min(1, (l - threshold) / (1 - threshold));
            // ОТТЕНОК: тени золотые, света → тёплый белый
            const hr = loColor[0] + (hiColor[0] - loColor[0]) * tt;
            const hg = loColor[1] + (hiColor[1] - loColor[1]) * tt;
            const hb = loColor[2] + (hiColor[2] - loColor[2]) * tt;
            // ЯРКОСТЬ ячейки гасим к нулю в тенях — тёмное остаётся чёрным,
            // а не заливается золотом (раньше lo-цвет горел на полную в тенях)
            const lvl = Math.pow(tt, 0.85) * bright;
            cr = Math.round(hr * lvl);
            cg = Math.round(hg * lvl);
            cb = Math.round(hb * lvl);
            alpha = 1;
          } else {
            cr = GRID[0]; cg = GRID[1]; cb = GRID[2];
            alpha = 0.08; // тусклая ячейка фона — видна сетка
          }
          ctx!.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
          roundRect(ctx!, bx, by, side, side, r);
          ctx!.fill();
        }
      }
    }

    function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rr: number) {
      const rad = Math.min(rr, w / 2, h / 2);
      c.beginPath();
      c.moveTo(x + rad, y);
      c.arcTo(x + w, y, x + w, y + h, rad);
      c.arcTo(x + w, y + h, x, y + h, rad);
      c.arcTo(x, y + h, x, y, rad);
      c.arcTo(x, y, x + w, y, rad);
      c.closePath();
    }

    const ro = new ResizeObserver(() => fit());
    ro.observe(canvas);
    fit();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas!.removeEventListener("pointerenter", onEnter);
      canvas!.removeEventListener("pointerleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, cols, aspect, gamma, gap, threshold, radius, idle, loColor.join(","), hiColor.join(",")]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-label={pick("Пиксельный портрет", "Pixel portrait", locale)}
      role="img"
    />
  );
}

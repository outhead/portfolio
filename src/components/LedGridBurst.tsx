"use client";

/* ─────────────────────────────────────────────────────────────────
 * LedGridBurst — LED-панель блока «обо мне».
 * Портрет (вырезка с альфой) сэмплится в сетку квадратных ячеек и
 * рисуется поверх тусклой золотой сетки — лицо собрано из отдельных
 * «диодов» с тем же шагом, что под кубом в хиро. Прозрачные ячейки —
 * тусклая золотая сетка. Живость даёт только редкое одиночное
 * «загорание» отдельных диодов (искры); радиальных волн-взрывов нет.
 * Перф: статичная база (сетка+портрет) пре-рендерится в offscreen и
 * каждый кадр только домалёвываются искры; DPR≤1.5, пауза вне экрана
 * (IO) и в фоне (visibility), статичная картинка при reduced-motion.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

type Props = {
  /** источник портрета (PNG с альфой); без него — только фоновая сетка */
  src?: string;
  className?: string;
  /** размер ячейки в CSS-пикселях (шаг сетки); меньше = детальнее */
  cell?: number;
  /** доля зазора между ячейками 0..0.5 */
  gap?: number;
};

const LIME: [number, number, number] = [166, 255, 0];
const GOLD: [number, number, number] = [201, 166, 107];

export default function LedGridBurst({
  src,
  className = "",
  cell = 5,
  gap = 0.2,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let dpr = 1;
    let cw = 0,
      ch = 0,
      cellPx = cell,
      cols = 0,
      rows = 0;

    // портрет, сэмплированный в сетку
    let pr: Uint8ClampedArray | null = null; // r,g,b,a по ячейкам
    let imgReady = false;

    // статичная база (сетка + портрет) — пре-рендер
    const base = document.createElement("canvas");
    const bctx = base.getContext("2d")!;
    const sampler = document.createElement("canvas");
    const sctx = sampler.getContext("2d", { willReadFrequently: true })!;

    type Spark = { gx: number; gy: number; t: number };
    let sparks: Spark[] = [];
    const SPARK_LIFE = 620;

    function roundRect(
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      rr: number
    ) {
      const rad = Math.min(rr, w / 2, h / 2);
      c.beginPath();
      c.moveTo(x + rad, y);
      c.arcTo(x + w, y, x + w, y + h, rad);
      c.arcTo(x + w, y + h, x, y + h, rad);
      c.arcTo(x, y + h, x, y, rad);
      c.arcTo(x, y, x + w, y, rad);
      c.closePath();
      c.fill();
    }

    function sampleImage(img: HTMLImageElement) {
      // object-cover кроп в сетку cols×rows
      const ar = cols / rows;
      const iar = img.width / img.height;
      let sw = img.width,
        sh = img.height,
        sx = 0,
        sy = 0;
      if (iar > ar) {
        sw = img.height * ar;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / ar;
        sy = (img.height - sh) / 2;
      }
      sampler.width = cols;
      sampler.height = rows;
      sctx.clearRect(0, 0, cols, rows);
      sctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
      pr = sctx.getImageData(0, 0, cols, rows).data;
      imgReady = true;
      buildBase();
    }

    function buildBase() {
      base.width = cw;
      base.height = ch;
      bctx.clearRect(0, 0, cw, ch);
      const inset = cellPx * gap * 0.5;
      const side = cellPx - inset * 2;
      const r = side * 0.22;
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const x = gx * cellPx + inset;
          const y = gy * cellPx + inset;
          // тусклая золотая сетка-подложка
          bctx.fillStyle = `rgba(${GOLD[0]},${GOLD[1]},${GOLD[2]},0.06)`;
          roundRect(bctx, x, y, side, side, r);
          // портрет поверх — диод в цвете пикселя
          if (pr) {
            const p = (gy * cols + gx) * 4;
            const a = pr[p + 3] / 255;
            if (a > 0.05) {
              bctx.fillStyle = `rgba(${pr[p]},${pr[p + 1]},${pr[p + 2]},${a})`;
              roundRect(bctx, x, y, side, side, r);
            }
          }
        }
      }
    }

    function layout() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cw = Math.max(1, Math.round(rect.width * dpr));
      ch = Math.max(1, Math.round(rect.height * dpr));
      canvas!.width = cw;
      canvas!.height = ch;
      cellPx = cell * dpr;
      cols = Math.ceil(cw / cellPx);
      rows = Math.ceil(ch / cellPx);
      if (imgRef && imgRef.complete && imgRef.naturalWidth) sampleImage(imgRef);
      else buildBase();
    }

    function addSpark() {
      sparks.push({
        gx: (Math.random() * cols) | 0,
        gy: (Math.random() * rows) | 0,
        t: performance.now(),
      });
      if (sparks.length > 14) sparks.shift();
    }

    function paint(now: number) {
      ctx!.clearRect(0, 0, cw, ch);
      ctx!.drawImage(base, 0, 0);

      const inset = cellPx * gap * 0.5;
      const side = cellPx - inset * 2;
      const r = side * 0.22;

      // одиночные «загорания» диодов
      for (const s of sparks) {
        const age = now - s.t;
        if (age > SPARK_LIFE) continue;
        const e = Math.sin((age / SPARK_LIFE) * Math.PI); // 0→1→0
        ctx!.fillStyle = `rgba(${LIME[0]},${LIME[1]},${LIME[2]},${e * 0.5})`;
        roundRect(
          ctx!,
          s.gx * cellPx + inset,
          s.gy * cellPx + inset,
          side,
          side,
          r
        );
      }
      sparks = sparks.filter((s) => now - s.t <= SPARK_LIFE);
    }

    // ── портрет ──────────────────────────────────────────────────
    let imgRef: HTMLImageElement | null = null;
    if (src) {
      imgRef = new Image();
      imgRef.crossOrigin = "anonymous";
      imgRef.onload = () => {
        if (cols && rows) sampleImage(imgRef!);
      };
      imgRef.src = src;
    }

    // ── жизненный цикл ───────────────────────────────────────────
    let raf = 0,
      running = false,
      lastSpark = 0,
      inView = true,
      visible = true;

    function loop(now: number) {
      if (now - lastSpark > 280 && Math.random() < 0.5) {
        addSpark();
        lastSpark = now;
      }
      paint(now);
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (running || reduce) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }
    function evaluate() {
      if (inView && visible) start();
      else stop();
    }

    layout();
    if (reduce) paint(performance.now());

    const ro = new ResizeObserver(() => {
      layout();
      if (reduce) paint(performance.now());
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      (es) => {
        inView = es[0]?.isIntersecting ?? true;
        evaluate();
      },
      { rootMargin: "120px" }
    );
    io.observe(canvas);

    const onVis = () => {
      visible = document.visibilityState === "visible";
      evaluate();
    };
    document.addEventListener("visibilitychange", onVis);

    evaluate();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, cell, gap]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none" }}
    />
  );
}

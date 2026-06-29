"use client";

/* ─────────────────────────────────────────────────────────────────
 * LedGridBurst — фоновая LED-сетка под вырезанным портретом.
 * Сетка квадратных ячеек горит тускло в покое (лёгкое мерцание),
 * периодически из точки расходится радиальная волна-«взрыв»: фронт
 * подсвечивает ячейки в тон бренда (лайм → золото к краю), затем гаснет.
 * Взрыв также триггерится по наведению/клику на родительский блок.
 * Перф: DPR≤1.5, пауза вне экрана (IO) и в фоне (visibility),
 * статичная сетка при prefers-reduced-motion.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  /** размер ячейки в CSS-пикселях */
  cell?: number;
  /** доля зазора между ячейками 0..0.5 */
  gap?: number;
  /** мс между авто-взрывами */
  interval?: number;
};

const LIME: [number, number, number] = [166, 255, 0];
const GOLD: [number, number, number] = [201, 166, 107];

export default function LedGridBurst({
  className = "",
  cell = 13,
  gap = 0.2,
  interval = 3800,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let dpr = 1;
    let cw = 0,
      ch = 0,
      cellPx = cell,
      cols = 0,
      rows = 0;
    let phase = new Float32Array(0);
    let maxR = 1;

    type Burst = { x: number; y: number; t: number };
    let bursts: Burst[] = [];

    const SPEED = 0.5; // px/мс — скорость фронта (в CSS-px, домножим на dpr)
    const WAVE = 44; // толщина волны (CSS-px)

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
      phase = new Float32Array(cols * rows);
      for (let i = 0; i < phase.length; i++) phase[i] = Math.random() * Math.PI * 2;
      maxR = Math.hypot(cw, ch);
    }

    function addBurst(px?: number, py?: number) {
      const x = px ?? cw * (0.32 + Math.random() * 0.36);
      const y = py ?? ch * (0.28 + Math.random() * 0.4);
      bursts.push({ x, y, t: performance.now() });
      if (bursts.length > 5) bursts.shift();
    }

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
    }

    function paint(now: number) {
      ctx!.clearRect(0, 0, cw, ch);
      const inset = cellPx * gap * 0.5;
      const side = cellPx - inset * 2;
      const r = side * 0.22;
      const speed = SPEED * dpr;
      const wave = WAVE * dpr;

      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const cxp = gx * cellPx + cellPx / 2;
          const cyp = gy * cellPx + cellPx / 2;
          // покой: тусклое золото с лёгким мерцанием
          let bright =
            0.05 + 0.02 * (0.5 + 0.5 * Math.sin(now * 0.0011 + phase[gy * cols + gx]));
          let cr = GOLD[0],
            cg = GOLD[1],
            cb = GOLD[2];

          for (let i = 0; i < bursts.length; i++) {
            const b = bursts[i];
            const front = (now - b.t) * speed;
            const d = Math.hypot(cxp - b.x, cyp - b.y);
            const band = Math.abs(d - front);
            if (band < wave) {
              const ring = 1 - band / wave; // близость к фронту 0..1
              const life = Math.max(0, 1 - front / maxR); // затухание по радиусу
              const e = ring * ring * life;
              if (e > bright) {
                bright = e;
                const tt = Math.min(1, front / maxR); // ядро лайм → хвост золото
                cr = LIME[0] + (GOLD[0] - LIME[0]) * tt;
                cg = LIME[1] + (GOLD[1] - LIME[1]) * tt;
                cb = LIME[2] + (GOLD[2] - LIME[2]) * tt;
              }
            }
          }

          if (bright <= 0.025) continue;
          ctx!.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${Math.min(1, bright)})`;
          roundRect(ctx!, gx * cellPx + inset, gy * cellPx + inset, side, side, r);
          ctx!.fill();
        }
      }
      bursts = bursts.filter((b) => (now - b.t) * speed < maxR + wave);
    }

    // ── жизненный цикл ───────────────────────────────────────────
    let raf = 0,
      running = false,
      lastBurst = 0,
      inView = true,
      visible = true;

    function loop(now: number) {
      if (now - lastBurst > interval) {
        addBurst();
        lastBurst = now;
      }
      paint(now);
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (running || reduce) return;
      running = true;
      lastBurst = performance.now();
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
    if (reduce) {
      paint(performance.now()); // статичная тусклая сетка
    } else {
      addBurst(cw * 0.5, ch * 0.42); // первый взрыв при появлении
    }

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

    // взрыв по наведению/клику на блок-родитель
    let lastPointer = 0;
    function pointerBurst(e: PointerEvent) {
      const t = performance.now();
      if (t - lastPointer < 320) return;
      lastPointer = t;
      const rect = canvas!.getBoundingClientRect();
      addBurst((e.clientX - rect.left) * dpr, (e.clientY - rect.top) * dpr);
    }
    parent?.addEventListener("pointerenter", pointerBurst);
    parent?.addEventListener("pointermove", pointerBurst);

    evaluate();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      parent?.removeEventListener("pointerenter", pointerBurst);
      parent?.removeEventListener("pointermove", pointerBurst);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cell, gap, interval]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none" }}
    />
  );
}

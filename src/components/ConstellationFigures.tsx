"use client";

/* ─────────────────────────────────────────────────────────────────
 * ConstellationFigures — облако точек, собранное в созвездие людей.
 * Несколько фигурок-человечков из точек, соединённых линиями; одна
 * фигура крупнее и ярче — ментор-хаб. Точки мерцают, по связям от
 * ментора бегут импульсы. Лаймовая LED-палитра сайта.
 * Рендер на canvas, DPR-aware, уважает prefers-reduced-motion.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

type Pt = { x: number; y: number; r: number };

// Человечек из точек (локальные координаты в «юнитах», центр в 0,0)
const FIGURE: Pt[] = [
  { x: 0, y: -7, r: 1.9 }, // голова
  { x: -3.1, y: -3, r: 1.1 }, // плечи
  { x: 3.1, y: -3, r: 1.1 },
  { x: -4.6, y: 0.5, r: 0.95 }, // руки
  { x: 4.6, y: 0.5, r: 0.95 },
  { x: 0, y: -3.4, r: 1.1 }, // грудь
  { x: 0, y: 0.4, r: 1.1 }, // торс
  { x: 0, y: 3.6, r: 1.0 }, // таз
  { x: -2.6, y: 7, r: 1.0 }, // ноги
  { x: 2.6, y: 7, r: 1.0 },
];

// Фигуры в нормализованных координатах кадра (0..1). #0 — ментор.
const NODES: Array<{ nx: number; ny: number; scale: number; mentor?: boolean }> = [
  { nx: 0.5, ny: 0.44, scale: 1.5, mentor: true },
  { nx: 0.2, ny: 0.2, scale: 1.0 },
  { nx: 0.8, ny: 0.24, scale: 1.0 },
  { nx: 0.13, ny: 0.62, scale: 1.0 },
  { nx: 0.87, ny: 0.64, scale: 1.0 },
  { nx: 0.34, ny: 0.84, scale: 1.0 },
  { nx: 0.67, ny: 0.83, scale: 1.0 },
];

// Связи созвездия: ментор → каждый + несколько одноранговых.
const EDGES: Array<[number, number]> = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
  [1, 2], [3, 5], [4, 6], [5, 6],
];
// По каким связям бегут импульсы (от ментора наружу)
const PULSE_EDGES = [0, 1, 2, 3, 4, 5];

const LIME: [number, number, number] = [166, 255, 0];
const DIM: [number, number, number] = [70, 110, 20];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function ConstellationFigures({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let dpr = 1;
    let cw = 1;
    let ch = 1;
    let raf = 0;
    let stopped = false;
    const start = performance.now();

    // фазы мерцания на каждую точку каждой фигуры
    const phases = NODES.map(() => FIGURE.map(() => Math.random() * Math.PI * 2));

    function nodePix(n: (typeof NODES)[number]) {
      const padX = cw * 0.12;
      const padY = ch * 0.12;
      return {
        x: padX + n.nx * (cw - padX * 2),
        y: padY + n.ny * (ch - padY * 2),
      };
    }

    function unit() {
      return Math.min(cw, ch) / 34;
    }

    function dot(x: number, y: number, r: number, b: number) {
      const cr = Math.round(lerp(DIM[0], LIME[0], b));
      const cg = Math.round(lerp(DIM[1], LIME[1], b));
      const cb = Math.round(lerp(DIM[2], LIME[2], b));
      if (b > 0.62) {
        ctx!.shadowColor = `rgba(166,255,0,${(b - 0.62) * 0.9})`;
        ctx!.shadowBlur = r * 3.2;
      } else {
        ctx!.shadowBlur = 0;
      }
      ctx!.fillStyle = `rgba(${cr},${cg},${cb},${0.35 + b * 0.65})`;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.shadowBlur = 0;
    }

    function draw(now: number) {
      if (stopped) return;
      const t = (now - start) / 1000;
      ctx!.clearRect(0, 0, cw, ch);
      const u = unit();

      const centers = NODES.map(nodePix);

      // ── связи ───────────────────────────────────────────────
      for (const [a, b] of EDGES) {
        const pa = centers[a];
        const pb = centers[b];
        ctx!.strokeStyle = "rgba(166,255,0,0.13)";
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(pa.x, pa.y);
        ctx!.lineTo(pb.x, pb.y);
        ctx!.stroke();
      }

      // ── импульсы по связям ментора ──────────────────────────
      if (!reduce) {
        for (let k = 0; k < PULSE_EDGES.length; k++) {
          const [a, b] = EDGES[PULSE_EDGES[k]];
          const pa = centers[a];
          const pb = centers[b];
          const prog = ((t * 0.35 + k * 0.17) % 1);
          const px = lerp(pa.x, pb.x, prog);
          const py = lerp(pa.y, pb.y, prog);
          const fade = Math.sin(prog * Math.PI); // ярче в середине пути
          ctx!.fillStyle = `rgba(166,255,0,${0.5 * fade})`;
          ctx!.shadowColor = `rgba(166,255,0,${0.6 * fade})`;
          ctx!.shadowBlur = 8;
          ctx!.beginPath();
          ctx!.arc(px, py, 1.7, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.shadowBlur = 0;
        }
      }

      // ── фигуры из точек ─────────────────────────────────────
      NODES.forEach((n, i) => {
        const c = centers[i];
        const s = u * n.scale;
        const base = n.mentor ? 0.78 : 0.5;
        FIGURE.forEach((p, j) => {
          const tw = reduce ? 0 : Math.sin(t * 1.6 + phases[i][j]) * 0.22;
          const b = Math.max(0, Math.min(1, base + tw + (p.r > 1.6 ? 0.12 : 0)));
          dot(c.x + p.x * s, c.y + p.y * s, p.r * n.scale, b);
        });
      });

      if (!reduce) raf = requestAnimationFrame(draw);
    }

    function fit() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = Math.max(1, rect.width);
      ch = Math.max(1, rect.height);
      canvas!.width = Math.round(cw * dpr);
      canvas!.height = Math.round(ch * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) draw(start);
    }

    const ro = new ResizeObserver(() => fit());
    ro.observe(canvas);
    fit();
    if (!reduce) raf = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-label="Созвездие фигур — менторинг"
      role="img"
    />
  );
}

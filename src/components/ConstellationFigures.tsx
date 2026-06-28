"use client";

/* ─────────────────────────────────────────────────────────────────
 * ConstellationFigures — LED-табло: пиксельные человечки-созвездие.
 * Фон — тусклая сетка диодов. Поверх — чанковые пиксель-арт фигуры,
 * собранные в созвездие: ментор крупнее и золотой, менти бело-серые,
 * связи и звёзды золотые. По связям бегут импульсы, звёзды мерцают.
 * Клик — пасхалка: волна-сверхновая по табло + падающая звезда +
 * вспышка фигур; шлёт `egg:found` (id "constellation").
 * Canvas, DPR-aware, уважает prefers-reduced-motion.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

// Пиксель-арт человечек 5×8 (1 — зажжённый «пиксель»)
const PERSON = [
  "01110",
  "01110",
  "11111",
  "00100",
  "00100",
  "01110",
  "01010",
  "01010",
];
const PW = 5;
const PH = 8;

// Фигуры: центр в долях панели (0..1), scale = диодов на пиксель глифа.
const NODES: Array<{ nx: number; ny: number; scale: number; mentor?: boolean }> = [
  { nx: 0.5, ny: 0.47, scale: 3, mentor: true },
  { nx: 0.18, ny: 0.21, scale: 2 },
  { nx: 0.82, ny: 0.23, scale: 2 },
  { nx: 0.17, ny: 0.76, scale: 2 },
  { nx: 0.83, ny: 0.74, scale: 2 },
];
const EDGES: Array<[number, number]> = [
  [0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [3, 4],
];

const TARGET_CELL = 9; // целевой размер диода, px

// Палитра: нейтраль (серый→белый) и золото (тёмное→тёплое золото).
// tone 0 — нейтраль (фон, менти), tone 1 — золото (ментор, звёзды, связи).
const N_LO: [number, number, number] = [104, 104, 100];
const N_HI: [number, number, number] = [246, 245, 240];
const G_LO: [number, number, number] = [92, 72, 36];
const G_HI: [number, number, number] = [255, 209, 128];

const NOVA_MS = 1500;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

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

    let dpr = 1, cw = 1, ch = 1, cols = 1, rows = 1, cell = TARGET_CELL;
    let base!: Float32Array;
    let amp!: Float32Array;
    let phase!: Float32Array;
    let tone!: Uint8Array;
    let occupied!: Uint8Array;
    let centers: Array<{ cx: number; cy: number }> = [];
    let raf = 0, stopped = false;
    const start = performance.now();

    // пасхалка
    let novaT0 = -1, novaX = 0, novaY = 0;
    let firedEgg = false;

    const idx = (i: number, j: number) => j * cols + i;

    function set(i: number, j: number, b: number, a: number, ph: number, tn: 0 | 1, occ = false) {
      if (i < 0 || j < 0 || i >= cols || j >= rows) return;
      const k = idx(i, j);
      if (b > base[k]) { base[k] = b; amp[k] = a; phase[k] = ph; tone[k] = tn; }
      if (occ) occupied[k] = 1;
    }

    function build() {
      cols = Math.max(8, Math.round(cw / TARGET_CELL));
      rows = Math.max(8, Math.round(ch / TARGET_CELL));
      cell = cw / cols;
      const n = cols * rows;
      base = new Float32Array(n);
      amp = new Float32Array(n);
      phase = new Float32Array(n);
      tone = new Uint8Array(n);
      occupied = new Uint8Array(n);

      // фон-табло
      for (let k = 0; k < n; k++) base[k] = 0.05;

      // фигуры: ментор золотой, менти бело-серые
      centers = NODES.map((node) => {
        const gw = PW * node.scale;
        const gh = PH * node.scale;
        const ci = Math.round(node.nx * cols);
        const cj = Math.round(node.ny * rows);
        const ox = ci - Math.floor(gw / 2);
        const oy = cj - Math.floor(gh / 2);
        const bright = node.mentor ? 0.95 : 0.66;
        const tn: 0 | 1 = node.mentor ? 1 : 0;
        for (let gy = 0; gy < PH; gy++) {
          for (let gx = 0; gx < PW; gx++) {
            if (PERSON[gy][gx] !== "1") continue;
            const ph = Math.random() * Math.PI * 2;
            for (let sy = 0; sy < node.scale; sy++)
              for (let sx = 0; sx < node.scale; sx++)
                set(ox + gx * node.scale + sx, oy + gy * node.scale + sy, bright, 0.08, ph, tn, true);
          }
        }
        return { cx: ci, cy: cj };
      });

      // связи-созвездие: золотой пунктир по сетке
      for (const [a, b] of EDGES) {
        const p = centers[a], q = centers[b];
        const steps = Math.max(1, Math.round(Math.hypot(q.cx - p.cx, q.cy - p.cy)));
        for (let s = 0; s <= steps; s++) {
          if (s % 2 === 1) continue;
          const i = Math.round(lerp(p.cx, q.cx, s / steps));
          const j = Math.round(lerp(p.cy, q.cy, s / steps));
          if (occupied[idx(i, j)]) continue;
          set(i, j, 0.22, 0.06, s * 0.6, 1);
        }
      }

      // звёзды: золотые мерцающие диоды
      const stars = Math.round((cols * rows) / 80);
      for (let s = 0; s < stars; s++) {
        const i = Math.floor(Math.random() * cols);
        const j = Math.floor(Math.random() * rows);
        if (occupied[idx(i, j)]) continue;
        set(i, j, 0.16, 0.55, Math.random() * Math.PI * 2, 1);
      }
    }

    function draw(now: number) {
      if (stopped) return;
      const t = (now - start) / 1000;
      ctx!.clearRect(0, 0, cw, ch);
      const side = cell * 0.8;
      const inset = (cell - side) / 2;
      const r = side * 0.22;

      // параметры пасхалки
      let novaP = -1, waveR = 0;
      if (novaT0 >= 0) {
        novaP = (now - novaT0) / NOVA_MS;
        if (novaP >= 1) { novaP = -1; novaT0 = -1; }
        else waveR = novaP * Math.hypot(cw, ch) * 0.7;
      }
      const ww = cell * 2.4;

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const k = idx(i, j);
          let b = base[k] + (reduce ? 0 : amp[k] * Math.sin(t * 1.7 + phase[k]));
          let gold = tone[k]; // 0/1, может подкраситься волной
          const x = i * cell, y = j * cell;

          // волна-сверхновая
          if (novaP >= 0) {
            const d = Math.hypot(x + cell / 2 - novaX, y + cell / 2 - novaY);
            const wave = Math.exp(-((d - waveR) ** 2) / (2 * ww * ww)) * (1 - novaP);
            if (wave > 0.01) { b += wave * 0.95; gold = 1; }
          }
          b = clamp01(b);
          if (b < 0.02) continue;

          const lo = gold ? G_LO : N_LO;
          const hi = gold ? G_HI : N_HI;
          const cr = Math.round(lerp(lo[0], hi[0], b));
          const cg = Math.round(lerp(lo[1], hi[1], b));
          const cb = Math.round(lerp(lo[2], hi[2], b));
          if (b > 0.75) {
            ctx!.shadowColor = `rgba(${gold ? "255,200,120" : "255,250,240"},${(b - 0.75) * 1.6})`;
            ctx!.shadowBlur = side * 1.1;
          } else ctx!.shadowBlur = 0;
          ctx!.fillStyle = `rgba(${cr},${cg},${cb},${0.32 + b * 0.68})`;
          roundRect(ctx!, x + inset, y + inset, side, side, r);
          ctx!.fill();
        }
      }
      ctx!.shadowBlur = 0;

      // импульсы по связям ментора
      if (!reduce) {
        for (let e = 0; e < 4; e++) {
          const [a, b] = EDGES[e];
          const p = centers[a], q = centers[b];
          const prog = (t * 0.4 + e * 0.2) % 1;
          const i = Math.round(lerp(p.cx, q.cx, prog));
          const j = Math.round(lerp(p.cy, q.cy, prog));
          const fade = Math.sin(prog * Math.PI);
          ctx!.fillStyle = `rgba(255,209,128,${0.85 * fade})`;
          ctx!.shadowColor = `rgba(255,200,120,${0.7 * fade})`;
          ctx!.shadowBlur = side * 1.4;
          roundRect(ctx!, i * cell + inset, j * cell + inset, side, side, r);
          ctx!.fill();
          ctx!.shadowBlur = 0;
        }
      }

      // падающая звезда по клику
      if (novaP >= 0) {
        const sp = clamp01(novaP * 1.25);
        const sx = lerp(cw * 0.05, cw * 0.95, sp);
        const sy = lerp(ch * 0.12, ch * 0.6, sp);
        const tail = 7;
        for (let tIdx = 0; tIdx < tail; tIdx++) {
          const tp = clamp01(sp - tIdx * 0.05);
          const tx = lerp(cw * 0.05, cw * 0.95, tp);
          const ty = lerp(ch * 0.12, ch * 0.6, tp);
          const a = (1 - tIdx / tail) * (1 - novaP);
          if (a <= 0.02) continue;
          ctx!.fillStyle = `rgba(255,224,160,${a})`;
          ctx!.shadowColor = "rgba(255,200,120,0.8)";
          ctx!.shadowBlur = side * (tIdx === 0 ? 2 : 0.6);
          roundRect(ctx!, tx, ty, side, side, r);
          ctx!.fill();
        }
        ctx!.shadowBlur = 0;
        void sx; void sy;
      }

      if (!reduce) raf = requestAnimationFrame(draw);
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

    function onClick(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      novaX = e.clientX - rect.left;
      novaY = e.clientY - rect.top;
      novaT0 = performance.now();
      if (!firedEgg) {
        firedEgg = true;
        try { window.dispatchEvent(new CustomEvent("egg:found", { detail: "constellation" })); } catch {}
      }
      if (reduce) draw(performance.now() + NOVA_MS * 0.4); // один яркий кадр
    }

    function fit() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = Math.max(1, rect.width);
      ch = Math.max(1, rect.height);
      canvas!.width = Math.round(cw * dpr);
      canvas!.height = Math.round(ch * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (reduce) draw(start);
    }

    const ro = new ResizeObserver(() => fit());
    ro.observe(canvas);
    canvas.addEventListener("pointerdown", onClick);
    fit();
    if (!reduce) raf = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block", cursor: "pointer" }}
      aria-label="LED-созвездие фигур — нажми, чтобы запустить сверхновую"
      role="img"
    />
  );
}

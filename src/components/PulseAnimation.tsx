"use client";

import { useEffect, useRef, useState } from "react";

export type PulseVariant = "network" | "target" | "ai";

interface PulseAnimationProps {
  variant: PulseVariant;
  reverse?: boolean;
  className?: string;
  /** Принудительная активация (вместе с hover) — мобильный scroll-trigger. */
  active?: boolean;
}

const W = 150;
const H = 150;
const cx = W / 2;
const cy = H / 2;

// Квадратная dot-matrix сетка, обрезанная в круг. Точки на узлах, позиции
// в анимациях не двигаются — меняются яркость и размер.
const STEP = 11;
const GRID_R = 6;
const MAX_R = GRID_R * STEP;
const TAU = Math.PI * 2;
const BASE_SIZE = 1.7;

type Dot = { x: number; y: number; r: number; ring: number; ang: number; gx: number; gy: number };
const dots: Dot[] = (() => {
  const out: Dot[] = [];
  for (let gy = -GRID_R; gy <= GRID_R; gy++) {
    for (let gx = -GRID_R; gx <= GRID_R; gx++) {
      const r = Math.hypot(gx, gy) * STEP;
      if (r > MAX_R + 0.5) continue;
      out.push({ x: cx + gx * STEP, y: cy + gy * STEP, r, ring: Math.round(r / STEP), ang: Math.atan2(gy, gx), gx, gy });
    }
  }
  return out;
})();
const MAX_RING = dots.reduce((m, d) => Math.max(m, d.ring), 0);

const ss = (v: number) => {
  const c = Math.max(0, Math.min(1, v));
  return c * c * (3 - 2 * c);
};
const seed = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// ── Змейка-сеть: серпантинный путь по узлам сетки (ряды змейкой), вдоль
//    которого зажигаются связи-прожилки. Соседние узлы пути всегда смежны. ─
const netPath: number[] = (() => {
  const byRow = new Map<number, number[]>();
  dots.forEach((d, i) => {
    const a = byRow.get(d.gy) ?? [];
    a.push(i);
    byRow.set(d.gy, a);
  });
  const rows = [...byRow.keys()].sort((a, b) => a - b);
  const path: number[] = [];
  rows.forEach((gy, ri) => {
    const a = byRow.get(gy)!.sort((p, q) => dots[p].gx - dots[q].gx);
    if (ri % 2) a.reverse(); // змейка: чётные слева-направо, нечётные наоборот
    path.push(...a);
  });
  return path;
})();

// ── Глиф «AI» для ремесла: 9×7, по центру сетки ─────────────────────
const AI_ROWS = (() => {
  const A = ["01110", "10001", "10001", "11111", "10001", "10001", "10001"];
  const I = ["111", "010", "010", "010", "010", "010", "111"];
  return A.map((r, i) => `${r}0${I[i]}`); // ширина 9
})();
const aiGlyph = (() => {
  const isG = new Array<boolean>(dots.length).fill(false);
  const order = new Array<number>(dots.length).fill(0);
  const g: number[] = [];
  dots.forEach((d, i) => {
    const col = d.gx + 4; // -4..4 → 0..8
    const row = d.gy + 3; // -3..3 → 0..6
    if (col >= 0 && col < 9 && row >= 0 && row < 7 && AI_ROWS[row][col] === "1") {
      isG[i] = true;
      g.push(i);
    }
  });
  g.sort((a, b) => dots[a].gx - dots[b].gx || dots[a].gy - dots[b].gy); // печать слева направо
  g.forEach((di, rank) => (order[di] = rank));
  return { isG, order, count: g.length };
})();

export default function PulseAnimation({ variant, reverse = false, className, active = false }: PulseAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState(false);
  const isPlaying = hover || active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let el: HTMLElement | null = canvas;
    while (el && !el.classList.contains("group")) el = el.parentElement;
    const target: HTMLElement | null = el ?? canvas.parentElement;
    if (!target) return;
    const enter = () => setHover(true);
    const leave = () => setHover(false);
    target.addEventListener("mouseenter", enter);
    target.addEventListener("mouseleave", leave);
    return () => {
      target.removeEventListener("mouseenter", enter);
      target.removeEventListener("mouseleave", leave);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = Math.min(1.5, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const fill = (a: number) =>
      isPlaying
        ? `rgba(166, 255, 0, ${clamp01(a)})`
        : `rgba(255, 255, 255, ${clamp01(a * 0.55)})`;

    const dot = (d: Dot, op: number, size: number) => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, size, 0, TAU);
      ctx.fillStyle = fill(op);
      ctx.fill();
    };

    // Змейка-сеть: голова бежит по узлам, за ней зажигаются связи-прожилки,
    // постепенно собирая связанную структуру. Доходит до конца, держит, сброс.
    const drawNetwork = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const L = netPath.length;
      const CYC = 4.8;
      const tc = t % CYC;
      let p: number;
      let resetK = 1;
      if (tc < 3.2) {
        p = ss(tc / 3.2) * L;
      } else {
        p = L;
        if (tc >= 4.0) resetK = 1 - ss((tc - 4.0) / 0.8);
      }
      // узлы (без соединительных линий — только точки)
      for (let k = 0; k < L; k++) {
        const nk = clamp01(p - k);
        const hd = Math.abs(k - p);
        const glow = Math.exp(-((hd / 1.4) ** 2)); // светящаяся голова змейки
        const op = (0.1 + nk * 0.5 + glow * 0.45) * resetK;
        const size = BASE_SIZE + nk * 0.3 + glow * 1.9;
        dot(dots[netPath[k]], op, size);
      }
    };

    // Мишень: дартс-полосы, кольцо сходится к центру, попадание в яблочко,
    // вращающийся прицел и исходящее подтверждающее кольцо.
    const drawTarget = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const speed = 3.2;
      const pad = 2.4;
      const cyc = MAX_RING + pad;
      const ph = (t * speed) % cyc;
      const wf = MAX_RING - ph;
      const hitPhase = ph - MAX_RING;
      const hit = hitPhase > 0 ? Math.exp(-(((hitPhase - 0.35) / 0.45) ** 2)) : 0;
      const confirmR = hitPhase > 0 ? hitPhase * 4.2 : -1;
      const crossA = t * 1.1;
      for (const d of dots) {
        const band = d.ring % 2 === 0 ? 0.2 : 0.1;
        const dist = d.ring - wf;
        const pf = Math.abs(dist) < 1.1 ? Math.max(0, Math.cos((dist / 1.1) * (Math.PI / 2))) : 0;
        let op = band + ss(pf) * 0.7;
        let size = BASE_SIZE + ss(pf) * 1.85;
        // вращающийся прицел (4 луча)
        if (d.ring > 0) {
          const aa = (((d.ang - crossA) % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2);
          const arm = Math.max(0, 1 - Math.min(aa, Math.PI / 2 - aa) / 0.16);
          op += arm * 0.16;
        }
        // подтверждающее кольцо после попадания
        if (confirmR > 0) {
          const dd = Math.abs(d.ring - confirmR);
          if (dd < 1) op = Math.max(op, (1 - dd) * (1 - clamp01(hitPhase / pad)) * 0.6);
        }
        if (d.ring === 0) {
          op = Math.max(op, 0.3 + hit * 0.7);
          size = Math.max(size, BASE_SIZE + 0.6 + hit * 3.2);
        }
        dot(d, op, size);
      }
    };

    // Ремесло: одна система. Плотная матрица-код падает постоянно, периодически
    // застывает в «AI», держится и снова растворяется в дожде.
    const drawAi = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const CYC = 4.4;
      const tc = t % CYC;
      // form: 0 — чистый дождь, 1 — собран «AI»
      const form =
        tc < 1.4 ? 0 : tc < 2.2 ? ss((tc - 1.4) / 0.8) : tc < 3.4 ? 1 : 1 - ss((tc - 3.4) / 1.0);
      const cycRows = GRID_R * 2 + 6;
      const rainAt = (col: number, gy: number, salt: number) => {
        const head = ((t * 5 + seed(col + salt) * cycRows) % cycRows) - GRID_R - 1;
        const dy = head - gy;
        return dy >= 0 ? Math.exp(-dy / 3.2) : 0;
      };
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const col = d.gx + GRID_R;
        // плотный дождь: две струи на колонку
        const rainE = Math.max(rainAt(col, d.gy, 0), rainAt(col, d.gy, 53) * 0.85);
        let e: number;
        if (aiGlyph.isG[i]) {
          // код стягивается в букву: к form=1 точка горит ровно
          e = Math.max(form, rainE * (1 - 0.5 * form));
        } else {
          // фон гаснет, чтобы «AI» читался
          e = rainE * (1 - 0.9 * form);
        }
        dot(d, 0.06 + e * 0.9, BASE_SIZE + e * 1.0);
      }
    };

    const drawDefault = () => {
      ctx.clearRect(0, 0, W, H);
      for (const d of dots) dot(d, 0.45, BASE_SIZE);
    };

    const drawAt = (t: number) => {
      if (variant === "network") drawNetwork(t);
      else if (variant === "target") drawTarget(t);
      else drawAi(t);
    };

    let time = 0;
    let lastTime: number | null = null;
    let rafId = 0;
    let stopped = false;
    // Кап ~40fps: анимация time-based (time += dt), на глаз неотличимо от 120fps.
    const FRAME_MS = 1000 / 40;
    let lastDraw = 0;

    if (isPlaying) {
      const loop = (now: number) => {
        if (stopped) return;
        rafId = requestAnimationFrame(loop);
        if (lastTime == null) lastTime = now;
        const dt = (now - lastTime) / 1000;
        lastTime = now;
        time += dt;
        if (now - lastDraw < FRAME_MS) return;
        lastDraw = now;
        drawAt(time);
      };
      rafId = requestAnimationFrame(loop);
    } else {
      drawDefault();
    }

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
    };
  }, [isPlaying, variant, reverse]);

  return (
    <canvas ref={canvasRef} style={{ width: W, height: H }} className={className} aria-hidden />
  );
}

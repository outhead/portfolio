"use client";

import { useEffect, useRef } from "react";

/**
 * LedLogo — «ЕГОР ШУГАЕВ» как диодное табло.
 *
 * Поведение:
 * - Текст статичен; по ховеру — блик яркости по буквам.
 * - Автоцикл эффектов (волна → эквалайзер → дождь → скан-строка):
 *   десктоп — пауза 9 с, тач — 5 с.
 * - prefers-reduced-motion: полная статика.
 */

// Логотип — единый битмап (правка Егора через редактор глифов). 1 = зажжённый диод.
const LOGO_BITMAP = [
  "111101111011110111100111111111111111001000101010111011101110110",
  "110001100011010110100110000100110011001000101010100010101000101",
  "111101100011010110100110111101111011001010101110100011101110111",
  "110001100011010111100110000101001011001010100010100010101000101",
  "110001100011010110000110111101001011001010100010100010101000101",
  "110001100011010110000110000100000011001010100010100010101000101",
  "111101100011110110000111111111111111001111101110100010101110110",
];
const ROWS = LOGO_BITMAP.length;
const PITCH = 4; // шаг сетки в юнитах viewBox
const R = 1.5; // радиус диода
const BASE = 0.07; // яркость незажжённого диода (фоновая сетка)
const GRAY = 0.5; // яркость правой (приглушённой) части
// Зелёный квадрат с «ЕШ» в центре — колонки SQ_START..SQ_END. Слева от него белая
// часть (ярко), справа — серая (приглушённо).
const SQ_START = 21;
const SQ_END = 35;
const GREEN = "#A6FF00";
const WHITE = "#FFFFFF";

type Dot = {
  col: number;
  row: number;
  cx: number;
  cy: number;
  lit: boolean;
  max: number;
  green: boolean;
};

function buildDots(): { dots: Dot[]; cols: number } {
  const cols = LOGO_BITMAP[0].length;
  const dots: Dot[] = [];
  for (let c = 0; c < cols; c++) {
    const inSquare = c >= SQ_START && c <= SQ_END;
    for (let r = 0; r < ROWS; r++) {
      dots.push({
        col: c,
        row: r,
        cx: c * PITCH + PITCH / 2,
        cy: r * PITCH + PITCH / 2,
        lit: LOGO_BITMAP[r][c] === "1",
        max: c > SQ_END ? GRAY : 1, // правая часть серая, квадрат и левая — полная яркость
        green: inSquare,
      });
    }
  }
  return { dots, cols };
}

const { dots: DOTS, cols: COLS } = buildDots();
const N = DOTS.length;
const VB_W = COLS * PITCH;
const VB_H = ROWS * PITCH;

type Phase = "text" | "out" | "in" | "fxwave" | "fxeq" | "fxrain" | "scan";
type FxName = "wave" | "eq" | "rain" | "scan";

const SEQ: Record<FxName, Phase[]> = {
  wave: ["out", "fxwave", "in"],
  eq: ["out", "fxeq", "in"],
  rain: ["out", "fxrain", "in"],
  scan: ["scan"],
};
const DUR: Record<Exclude<Phase, "text">, number> = {
  out: 0.5,
  in: 0.6,
  fxwave: 1.2,
  fxeq: 1.6,
  fxrain: 1.6,
  scan: 1.9,
};
const ORDER: FxName[] = ["wave", "eq", "rain", "scan"];
const SHINE_DUR = 1.2; // длительность блика

export default function LedLogo({ className }: { className?: string }) {
  const els = useRef<(SVGCircleElement | null)[]>([]);
  const shineWanted = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const HOLD = canHover ? 25 : 12;

    const dOut = DOTS.map(() => Math.random() * 0.45);
    const dIn = DOTS.map(() => Math.random() * 0.5);
    const rSpeed: number[] = [];
    const rOff: number[] = [];
    for (let c = 0; c < COLS; c++) {
      rSpeed.push(7 + Math.random() * 7);
      rOff.push(Math.random() * 22);
    }

    let phase: Phase = "text";
    let steps: Phase[] = [];
    let si = 0;
    let start = performance.now();
    let orderI = 0;
    let shineStart = -Infinity;
    let textDirty = true;
    let raf = 0;

    const set = (i: number, opacity: number, fill: string) => {
      const el = els.current[i];
      if (!el) return;
      el.style.opacity = String(opacity);
      el.setAttribute("fill", fill);
    };

    const nextStep = (now: number) => {
      si++;
      if (si < steps.length) {
        phase = steps[si];
      } else {
        phase = "text";
        textDirty = true;
      }
      start = now;
    };

    const frame = (now: number) => {
      const t = (now - start) / 1000;

      if (phase === "text") {
        if (shineWanted.current) {
          shineWanted.current = false;
          if (now - shineStart > SHINE_DUR * 1000) shineStart = now;
        }
        const st = (now - shineStart) / 1000;
        const shining = st < SHINE_DUR;
        if (shining) {
          const front = -6 + (st / SHINE_DUR) * (COLS + 12);
          for (let i = 0; i < N; i++) {
            const d = DOTS[i];
            if (!d.lit) continue;
            const x = d.col + d.row * 0.6 - front;
            const boost = Math.exp((-x * x) / 18);
            set(i, Math.min(1, d.max + boost * 0.7), WHITE);
          }
          textDirty = true;
        } else if (textDirty) {
          for (let i = 0; i < N; i++) {
            const d = DOTS[i];
            set(i, d.lit ? d.max : BASE, d.green ? GREEN : WHITE);
          }
          textDirty = false;
        }
        if (t > HOLD) {
          const fx = ORDER[orderI % ORDER.length];
          orderI++;
          steps = SEQ[fx];
          si = 0;
          phase = steps[0];
          start = now;
        }
      } else {
        const p = Math.min(t / DUR[phase], 1);

        if (phase === "out") {
          for (let i = 0; i < N; i++) {
            const d = DOTS[i];
            if (!d.lit) continue;
            const k = Math.min(Math.max((t - dOut[i]) / 0.22, 0), 1);
            set(i, Math.max(BASE, d.max * (1 - k)), d.green ? GREEN : WHITE);
          }
        } else if (phase === "in") {
          for (let i = 0; i < N; i++) {
            const d = DOTS[i];
            if (!d.lit) {
              set(i, BASE, WHITE);
              continue;
            }
            const k = Math.min(Math.max((t - dIn[i]) / 0.22, 0), 1);
            set(i, Math.max(BASE, d.max * k), d.green ? GREEN : WHITE);
          }
        } else if (phase === "fxwave") {
          const front = -8 + p * (COLS + ROWS * 0.6 + 16);
          for (let i = 0; i < N; i++) {
            const d = DOTS[i];
            const x = d.col + d.row * 0.6 - front;
            const b = Math.exp((-x * x) / 11.5);
            set(i, Math.max(BASE, b), b > 0.12 ? GREEN : WHITE);
          }
        } else if (phase === "fxeq") {
          const e = Math.min(1, p * 5, (1 - p) * 5);
          for (let i = 0; i < N; i++) {
            const d = DOTS[i];
            const w =
              Math.sin(d.col * 0.5 - p * 14) + 0.4 * Math.sin(d.col * 0.23 + p * 9);
            const h = (ROWS / 2) * (1 + w * 0.8);
            const rfb = ROWS - 1 - d.row;
            let b = rfb < h ? (rfb > h - 1.6 ? 1 : 0.3) : 0;
            b *= e;
            set(i, Math.max(BASE, b), b > 0.12 ? GREEN : WHITE);
          }
        } else if (phase === "fxrain") {
          const e = Math.min(1, p * 5, (1 - p) * 5);
          for (let i = 0; i < N; i++) {
            const d = DOTS[i];
            const y = (t * rSpeed[d.col] + rOff[d.col]) % (ROWS + 5) - 2;
            const dist = y - d.row;
            let b = dist >= 0 ? Math.exp(-dist / 1.8) : Math.exp((-dist * dist) / 0.4);
            b *= e;
            set(i, Math.max(BASE, b), b > 0.12 ? GREEN : WHITE);
          }
        } else {
          // scan — полоса стирает текст, вторым проходом проявляет
          const q = p < 0.5 ? p * 2 : (p - 0.5) * 2;
          const bar = -4 + q * (COLS + 8);
          const erase = p < 0.5;
          for (let i = 0; i < N; i++) {
            const d = DOTS[i];
            const x = d.col - bar;
            const barB = Math.exp((-x * x) / 3);
            let txt = 0;
            if (d.lit) txt = erase ? (d.col > bar ? d.max : 0) : d.col < bar ? d.max : 0;
            const b = Math.max(txt, barB);
            set(i, Math.max(BASE, b), barB > txt ? GREEN : WHITE);
          }
        }

        if (p >= 1) nextStep(now);
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className={className}
      role="img"
      aria-label="Егор Шугаев"
      onPointerEnter={() => {
        shineWanted.current = true;
      }}
    >
      {DOTS.map((d, i) => (
        <circle
          key={i}
          ref={(el) => {
            els.current[i] = el;
          }}
          cx={d.cx}
          cy={d.cy}
          r={R}
          fill={d.green ? GREEN : WHITE}
          style={{ opacity: d.lit ? d.max : BASE }}
        />
      ))}
    </svg>
  );
}

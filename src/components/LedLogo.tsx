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
  "111101111011110111100111111111111110001000101010111011101110110",
  "110001100011010110100111000111011110001000101010100010101000101",
  "111101100011010110100110111101010110001010101110100011101110111",
  "110001100011010111100110001101010110001010100010100010101000101",
  "110001100011010110000110111101010110001010100010100010101000101",
  "110001100011010110000111000110001110001010100010100010101000101",
  "111101100011110110000111111111111110001111101110100010101110110",
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

// Анимация монограммы внутри зелёного квадрата (покадрово, негатив = погашенные диоды).
// Колонки кадра 0..13 ложатся на колонки логотипа SQ_ANIM_LEFT..+13.
// Кадры заданы Егором (редактор ledmark-editor): ЕШ → морф → имплозия → гашение, петля.
const SQ_ANIM_LEFT = 21;
const SQ_ANIM_W = 14;
const FRAME_MS = 150;
const SQ_FRAMES: string[][] = [
  ["11111111111111","11100011101111","11011110101011","11000110101011","11011110101011","11100011000111","11111111111111"],
  ["11111111111111","11100011111111","11011110101011","11000110101011","11011110101011","11100011000111","11111111111111"],
  ["11111111111111","11100011111111","11011110111011","11000110101011","11011110101011","11100011000111","11111111111111"],
  ["11111111111111","11100011111111","11011110111011","11000110111011","11011110101011","11100011000111","11111111111111"],
  ["11111111111111","11100011111111","11011111111011","11000111111011","11011110101011","11100011000111","11111111111111"],
  ["11111111111111","11100011110111","11011111111011","11000111111011","11011111101011","11100011000111","11111111111111"],
  ["11111111111111","11100011000111","11011111111011","11000111100011","11011111111011","11100011000111","11111111111111"],
  ["11111111111111","11100011000111","11011111111011","11000111100011","11011111111011","11100011000111","11111111111111"],
  ["11111111111111","11100011000111","11011111111011","11000011000011","11011111111011","11100011000111","11111111111111"],
  ["11111111111111","11100011000111","11011111111011","11000011000011","11011111111011","11100011000111","11111111111111"],
  ["11111111111111","11100011000111","11011111111011","11000010000011","11011111111011","11100011000111","11111111111111"],
  ["11111111111111","11100010000111","11011111111011","11000010000011","11011111111011","11100010000111","11111111111111"],
  ["11111111111111","11100000000111","11011111111011","11000111000011","11011111111011","11100000000111","11111111111111"],
  ["11111111111111","11100000000111","11011111111011","11001111110011","11011111111011","11100000000111","11111111111111"],
  ["11111111111111","11100000000111","11011111111011","11011111111011","11011111111011","11100000000111","11111111111111"],
  ["11111111111111","11110000001111","11101111110111","11101111110111","11101111110111","11110000001111","11111111111111"],
  ["11111111111111","11111000011111","11110111101111","11110111101111","11110111101111","11111000011111","11111111111111"],
  ["11111111111111","11111100111111","11111011011111","11111011011111","11111011011111","11111100111111","11111111111111"],
  ["11111111111111","11111100111111","11111011011111","11111011011111","11111011011111","11111100111111","11111111111111"],
  ["11111111111111","11111100111111","11111011011111","11111011011111","11111011011111","11111100111111","11111111111111"],
  ["11111111111111","11111100111111","11111011011111","11111011011111","11111011011111","11111100111111","11111111111111"],
  ["11111111111111","11111100111111","11111011011111","11111011011111","11111011011111","11111100111111","11111111111111"],
  ["11111111111111","11111100111111","11111011011111","11111011011111","11111011011111","11111100111111","11111111111111"],
  ["11111111111111","11111100111111","11111011011111","11111011011111","11111011011111","11111100111111","11111111111111"],
  ["11111111111111","11111100111111","11111011011111","11111011011111","11111011011111","11111100111111","11111111111111"],
  ["11111111111111","11111100111111","11111011011111","11111011011111","11111011011111","11111100111111","11111111111111"],
  ["11111111111111","11101100110111","11011011011011","11011011011011","11011011011011","11101100110111","11111111111111"],
  ["11111111111111","11011100111011","10111011011101","10111011011101","10111011011101","11011100111011","11111111111111"],
  ["11111111111111","10111100111101","01111011011110","01111011011110","01111011011110","10111100111101","11111111111111"],
  ["11111111111111","11111100111111","11111011011111","11111011011111","11111011011111","11111100111111","11111111111111"],
  ["11111111111111","11111100111111","11111000011111","11111000011111","11111000011111","11111100111111","11111111111111"],
  ["11111100111111","11111000011111","11110000001111","11110000001111","11110000001111","11111000011111","11111100111111"],
  ["11110000001111","11100000000111","11000000000011","11000000000011","11000000000011","11100000000111","11110000001111"],
  ["11000000000011","10000000000001","00000000000000","00000000000000","00000000000000","10000000000001","11000000000011"],
  ["00000000000000","00000000000000","00000000000000","00000000000000","00000000000000","00000000000000","00000000000000"],
  ["00000000000000","00000000000000","00000000000000","00000000000000","00000000000000","00000000000000","00000000000000"],
];

type Dot = {
  col: number;
  row: number;
  cx: number;
  cy: number;
  lit: boolean;
  max: number;
  green: boolean;
  anim: boolean; // диод внутри анимируемого квадрата
  acol: number; // колонка внутри кадра (0..13), иначе -1
};

function buildDots(): { dots: Dot[]; cols: number } {
  const cols = LOGO_BITMAP[0].length;
  const dots: Dot[] = [];
  for (let c = 0; c < cols; c++) {
    const inSquare = c >= SQ_START && c <= SQ_END;
    const acol = c - SQ_ANIM_LEFT;
    const anim = acol >= 0 && acol < SQ_ANIM_W;
    for (let r = 0; r < ROWS; r++) {
      dots.push({
        col: c,
        row: r,
        cx: c * PITCH + PITCH / 2,
        cy: r * PITCH + PITCH / 2,
        lit: LOGO_BITMAP[r][c] === "1",
        max: c > SQ_END ? GRAY : 1, // правая часть серая, квадрат и левая — полная яркость
        green: inSquare,
        anim,
        acol: anim ? acol : -1,
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
  const hovering = useRef(false);
  const playing = useRef(false); // секвенция квадрата играет (по клику на квадрат)
  const playStart = useRef(0);
  const clickReq = useRef(false); // запрос проигрывания монограммы по клику (форсит фазу text)

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
    let lastFi = -1;

    const set = (i: number, opacity: number, fill: string) => {
      const el = els.current[i];
      if (!el) return;
      el.style.opacity = String(opacity);
      el.setAttribute("fill", fill);
    };

    // Зажжён ли диод в кадре fi: квадрат — из SQ_FRAMES, остальное — статичный битмап.
    const litAt = (d: Dot, fi: number) =>
      d.anim ? SQ_FRAMES[fi][d.row][d.acol] === "1" : d.lit;

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
      // Клик по квадрату — всегда проигрываем монограмму, даже если сейчас идёт
      // авто-эффект (волна/эквалайзер/дождь/скан). Иначе клик «не срабатывал».
      if (clickReq.current) {
        clickReq.current = false;
        phase = "text";
        start = now;            // сбросить таймер удержания, чтобы эффект не влез сразу
        playing.current = true;
        playStart.current = now;
        textDirty = true;
      }
      const t = (now - start) / 1000;

      if (phase === "text") {
        // Квадрат статичен (кадр 0 = ЕШ); секвенция играет один раз по клику на квадрат.
        let fi = 0;
        if (playing.current) {
          // Пинг-понг: 0→last→0 один раз, финиш на кадре 0 (ЕШ).
          const last = SQ_FRAMES.length - 1;
          const step = Math.floor((now - playStart.current) / FRAME_MS);
          if (step >= 2 * last) {
            playing.current = false;
            fi = 0;
          } else {
            fi = step <= last ? step : 2 * last - step;
          }
        }
        // Удержание яркости, пока курсор на логотипе. Квадрат играет только при клике.
        if (hovering.current) {
          for (let i = 0; i < N; i++) {
            const d = DOTS[i];
            set(i, litAt(d, fi) ? 1 : BASE, d.green ? GREEN : WHITE);
          }
          textDirty = true; // чтобы при уходе перерисовать в норму
          lastFi = fi;
          raf = requestAnimationFrame(frame);
          return;
        }
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
            if (!litAt(d, fi)) {
              set(i, BASE, d.green ? GREEN : WHITE);
              continue;
            }
            const x = d.col + d.row * 0.6 - front;
            const boost = Math.exp((-x * x) / 18);
            set(i, Math.min(1, d.max + boost * 0.7), d.green ? GREEN : WHITE);
          }
          textDirty = true;
          lastFi = fi;
        } else if (textDirty || fi !== lastFi) {
          for (let i = 0; i < N; i++) {
            const d = DOTS[i];
            set(i, litAt(d, fi) ? d.max : BASE, d.green ? GREEN : WHITE);
          }
          textDirty = false;
          lastFi = fi;
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
        hovering.current = true;
        shineWanted.current = true;
      }}
      onPointerLeave={() => {
        hovering.current = false;
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
      {/* Кликабельная зона — только зелёный квадрат. Клик запускает секвенцию один раз. */}
      <rect
        x={(SQ_ANIM_LEFT - 1) * PITCH}
        y={0}
        width={(SQ_ANIM_W + 2) * PITCH}
        height={VB_H}
        fill="#000"
        opacity={0}
        style={{ cursor: "pointer", pointerEvents: "all" }}
        role="button"
        aria-label="Запустить анимацию монограммы"
        onPointerDown={(e) => {
          e.stopPropagation();
          // Форсим проигрывание монограммы в след. кадре (даже если идёт эффект).
          clickReq.current = true;
          // Пасхалка «лого-центр» — засчитываем в счётчик главной.
          try {
            window.dispatchEvent(new CustomEvent("egg:found", { detail: "logo" }));
          } catch {}
        }}
      />
    </svg>
  );
}

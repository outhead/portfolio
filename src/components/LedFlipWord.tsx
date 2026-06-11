"use client";

import { useEffect, useRef } from "react";
import { layoutLedText } from "@/components/ledFont";

/**
 * LedFlipWord — крупное слово точечным LED-шрифтом, циклически
 * рассыпается и собирается в следующее (рифма с LedLogo в шапке).
 * Цвет — currentColor. prefers-reduced-motion: жёсткая смена без анимации.
 */

const PITCH = 4;
const HOLD = 2.4; // сек на слово
const OUT = 0.4; // рассыпание
const IN = 0.5; // сборка

export default function LedFlipWord({
  words,
  className,
  style,
  dot = 1.5,
  scale = 1,
}: {
  words: readonly string[];
  className?: string;
  style?: React.CSSProperties;
  /** Радиус диода в юнитах сетки (шаг 4), как у LedText. */
  dot?: number;
  /** Апскейл битмапы, как у LedText. */
  scale?: number;
}) {
  const els = useRef<(SVGCircleElement | null)[]>([]);

  // Сетка: общая ширина по самому широкому слову, битмапа на каждое слово
  const layouts = words.map((w) => layoutLedText(w, scale));
  const ROWS = layouts[0].rows;
  const maxCols = Math.max(...layouts.map((l) => l.cols));
  const grids = layouts.map((l) => {
    const g = new Uint8Array(maxCols * ROWS);
    for (const d of l.dots) if (d.lit) g[d.col * ROWS + d.row] = 1;
    return g;
  });
  const N = maxCols * ROWS;

  useEffect(() => {
    if (words.length < 2) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const set = (i: number, o: number) => {
      const el = els.current[i];
      if (el) el.style.opacity = String(o);
    };
    const draw = (w: number) => {
      for (let i = 0; i < N; i++) set(i, grids[w][i] ? 1 : 0);
    };

    if (reduced) {
      let w = 0;
      const id = setInterval(() => {
        w = (w + 1) % words.length;
        draw(w);
      }, (HOLD + OUT + IN) * 1000);
      return () => clearInterval(id);
    }

    const delays = Array.from({ length: N }, () => Math.random());
    let word = 0;
    let phase: "hold" | "out" | "in" = "hold";
    let start = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const t = (now - start) / 1000;
      if (phase === "hold") {
        if (t > HOLD) {
          phase = "out";
          start = now;
          for (let i = 0; i < N; i++) delays[i] = Math.random();
        }
      } else if (phase === "out") {
        const g = grids[word];
        for (let i = 0; i < N; i++) {
          if (!g[i]) continue;
          const k = Math.min(Math.max((t - delays[i] * (OUT - 0.18)) / 0.18, 0), 1);
          set(i, 1 - k);
        }
        if (t > OUT) {
          word = (word + 1) % words.length;
          phase = "in";
          start = now;
          for (let i = 0; i < N; i++) delays[i] = Math.random();
        }
      } else {
        const g = grids[word];
        for (let i = 0; i < N; i++) {
          const k = Math.min(Math.max((t - delays[i] * (IN - 0.18)) / 0.18, 0), 1);
          set(i, g[i] ? k : 0);
        }
        if (t > IN) {
          phase = "hold";
          start = now;
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words.join("|")]);

  const dots: { cx: number; cy: number; lit: boolean }[] = [];
  for (let c = 0; c < maxCols; c++)
    for (let r = 0; r < ROWS; r++)
      dots.push({
        cx: c * PITCH + PITCH / 2,
        cy: r * PITCH + PITCH / 2,
        lit: grids[0][c * ROWS + r] === 1,
      });

  return (
    <span className={className}>
      <span className="sr-only">{words[0]}</span>
      <svg
        viewBox={`0 0 ${maxCols * PITCH} ${ROWS * PITCH}`}
        aria-hidden
        focusable="false"
        style={{ display: "block", height: "0.72em", width: "auto", ...style }}
      >
        {dots.map((d, i) => (
          <circle
            key={i}
            ref={(el) => {
              els.current[i] = el;
            }}
            cx={d.cx}
            cy={d.cy}
            r={dot}
            fill="currentColor"
            style={{ opacity: d.lit ? 1 : 0 }}
          />
        ))}
      </svg>
    </span>
  );
}

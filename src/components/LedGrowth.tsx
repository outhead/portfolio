"use client";

import { useEffect, useRef } from "react";

/**
 * LedGrowth — диодный восходящий график для блока «Менторинг / Веду к росту».
 *
 * Тот же язык, что у LedLogo: SVG-сетка диодов, яркость
 * через opacity. Столбцы поднимаются ступенями слева направо (рост),
 * заполняются снизу вверх бегущей волной, затем «шапки» мягко дышат.
 * По ховеру рост перезапускается — табло прорастает заново.
 *
 * prefers-reduced-motion: статичный финальный кадр (полностью выросший).
 */

const COLS = 48;
const ROWS = 9;
const PITCH = 4;
const R = 1.5;
const BASE = 0.07;
const GREEN = "#A6FF00";
const WHITE = "#FFFFFF";

const VB_W = COLS * PITCH;
const VB_H = ROWS * PITCH;
const idx = (c: number, r: number) => c * ROWS + r;

// целевая высота столбца: восходящие ступени слева→направо + лёгкий шум
function buildTargets(): number[] {
  const t: number[] = [];
  for (let c = 0; c < COLS; c++) {
    const x = c / (COLS - 1); // 0..1
    const stepped = Math.floor(x * 5) / 5; // 5 плато-ступеней
    const ramp = 0.55 * stepped + 0.4 * x; // ступени + общий наклон
    const noise = (Math.sin(c * 1.7) * 0.5 + 0.5) * 0.12;
    t.push(Math.min(1, 0.18 + ramp + noise) * ROWS);
  }
  return t;
}
const TARGETS = buildTargets();

const GROW_DUR = 1.8; // длительность прорастания, сек

export default function LedGrowth({ className }: { className?: string }) {
  const els = useRef<(SVGCircleElement | null)[]>([]);
  const growStart = useRef(0);
  const restart = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const set = (i: number, opacity: number, fill: string) => {
      const el = els.current[i];
      if (!el) return;
      el.style.opacity = String(opacity);
      el.setAttribute("fill", fill);
    };

    const draw = (t: number) => {
      if (restart.current) {
        growStart.current = t;
        restart.current = false;
      }
      // прогресс прорастания, развёрнутый по столбцам слева направо
      const g = Math.min((t - growStart.current) / GROW_DUR, 1);
      for (let c = 0; c < COLS; c++) {
        const colDelay = (c / COLS) * 0.5; // правые столбцы стартуют позже
        const gc = Math.min(Math.max((g - colDelay) / 0.5, 0), 1);
        const ease = 1 - Math.pow(1 - gc, 3); // ease-out
        // мягкое дыхание шапки после прорастания
        const breathe = ease >= 1 ? 0.5 * Math.sin(t * 1.6 + c * 0.4) : 0;
        const h = TARGETS[c] * ease + breathe;
        for (let r = 0; r < ROWS; r++) {
          const fromBottom = ROWS - 1 - r;
          let b: number;
          let green = true;
          if (fromBottom < h) {
            if (fromBottom > h - 1.4) {
              b = 1; // светящаяся «шапка»
              green = false;
            } else {
              b = 0.3;
            }
          } else {
            b = BASE;
          }
          set(idx(c, r), Math.max(BASE, b), green ? GREEN : WHITE);
        }
      }
    };

    if (reduce) {
      growStart.current = -GROW_DUR; // считаем полностью выросшим
      draw(0);
      return;
    }

    const start = performance.now();
    growStart.current = 0;
    let raf = 0;
    const loop = (now: number) => {
      draw((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const dots = [];
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      dots.push(
        <circle
          key={idx(c, r)}
          ref={(el) => {
            els.current[idx(c, r)] = el;
          }}
          cx={c * PITCH + PITCH / 2}
          cy={r * PITCH + PITCH / 2}
          r={R}
          fill={GREEN}
          style={{ opacity: BASE }}
        />,
      );
    }
  }

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label="Восходящий график роста"
      onPointerEnter={() => {
        restart.current = true;
      }}
    >
      {dots}
    </svg>
  );
}

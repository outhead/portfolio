"use client";

/* ─────────────────────────────────────────────────────────────────
 * HeroBoard — хиро-табло на canvas (тысячи диодов без тормозов).
 * Три режима оживления:
 *   reactive  — точки реагируют на курсор: гало-подсветка + лаймовая рябь;
 *   cinematic — авто-цикл (волна → скан), сменное слово эффектно собирается;
 *   calm      — спокойная композиция (центр, крупнее) + мягкий блик по ховеру.
 * Раскладка букв — тем же движком ledFont, что и весь сайт.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef } from "react";
import { layoutLedText, LED_ROWS } from "@/components/ledFont";
import type { LedLine } from "@/components/LedBoard";

const PITCH = 4;
const GREEN: [number, number, number] = [166, 255, 0];

type Mode = "reactive" | "cinematic" | "calm";

type LitDot = { col: number; row: number; rgb: [number, number, number]; flip: boolean };

function hexRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const n = parseInt(m.length === 3 ? m.replace(/(.)/g, "$1$1") : m, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export default function HeroBoard({
  lines,
  mode,
  scale = 2,
  intervalMs = 2600,
  className = "",
}: {
  lines: LedLine[];
  mode: Mode;
  scale?: number;
  intervalMs?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -999, y: -999, active: false });

  const ROWS_LINE = LED_ROWS * scale;
  const GAP = 2 * scale;
  const PAD = 3;
  const align = mode === "calm" ? "center" : "left";

  // Стабильное поле: по самой широкой раскладке среди всех слов
  const { fieldCols, fieldRows } = useMemo(() => {
    let maxCols = 0;
    for (const l of lines) {
      const variants = l.words ?? [l.text ?? ""];
      for (const v of variants) maxCols = Math.max(maxCols, layoutLedText(v, scale).cols);
    }
    const cols = maxCols + PAD * 2;
    const rows = PAD * 2 + lines.length * ROWS_LINE + (lines.length - 1) * GAP;
    return { fieldCols: cols, fieldRows: rows };
  }, [lines, scale, ROWS_LINE, GAP]);

  // Раскладка горящих точек для конкретного кадра сменного слова
  const buildLit = useMemo(() => {
    return (idx: number): LitDot[] => {
      const out: LitDot[] = [];
      lines.forEach((l, li) => {
        const word = l.words ? l.words[idx % l.words.length] : (l.text ?? "");
        const lay = layoutLedText(word, scale);
        const colOff =
          align === "center"
            ? PAD + Math.floor((fieldCols - PAD * 2 - lay.cols) / 2)
            : PAD;
        const rowOff = PAD + li * (ROWS_LINE + GAP);
        const rgb = hexRgb(l.color);
        for (const d of lay.dots) {
          if (!d.lit) continue;
          out.push({ col: d.col + colOff, row: d.row + rowOff, rgb, flip: !!l.words });
        }
      });
      return out;
    };
  }, [lines, scale, align, fieldCols, ROWS_LINE, GAP]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasFlip = lines.some((l) => l.words && l.words.length > 1);
    const cleanups: Array<() => void> = [];

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cell = 4; // px на ячейку сетки (пересчёт по ширине)
    const resize = () => {
      const w = wrap.clientWidth;
      cell = w / fieldCols;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(fieldRows * cell * dpr);
      canvas.style.height = `${fieldRows * cell}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let idx = 0;
    let lit = buildLit(idx);
    let flipAt = performance.now(); // когда сменилось слово (для сборки)
    if (hasFlip && !reduce) {
      const t = setInterval(() => {
        idx++;
        lit = buildLit(idx);
        flipAt = performance.now();
      }, intervalMs);
      // очистка ниже через ro/raf cleanup замыкании
      cleanups.push(() => clearInterval(t));
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.current.x = ((e.clientX - r.left) / r.width) * fieldCols;
      mouse.current.y = ((e.clientY - r.top) / r.height) * fieldRows;
      mouse.current.active = true;
    };
    const onLeave = () => {
      mouse.current.active = false;
      mouse.current.x = -999;
      mouse.current.y = -999;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    const dot = (cx: number, cy: number, rad: number, r: number, g: number, b: number, a: number) => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${a})`;
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    };

    const start = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const T = (now - start) / 1000;
      const S = cell * dpr;
      const litR = S * (scale > 1 ? 1.45 : 1.72) / PITCH;
      const dimR = S * 1.0 / PITCH;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouse.current.x;
      const my = mouse.current.y;
      const mAct = mouse.current.active;

      // ── Поле незажжённых диодов ──
      for (let row = 0; row < fieldRows; row++) {
        for (let col = 0; col < fieldCols; col++) {
          const cx = (col + 0.5) * S;
          const cy = (row + 0.5) * S;
          let a = 0.05;
          let r = 255, g = 255, b = 255;

          if (mode === "reactive" && mAct) {
            const dx = col - mx, dy = row - my;
            const d2 = dx * dx + dy * dy;
            const halo = Math.exp(-d2 / 64); // радиус ~8 ячеек
            if (halo > 0.01) {
              a += halo * 0.55;
              r = 255 - (255 - GREEN[0]) * halo;
              g = 255 - (255 - GREEN[1]) * halo;
              b = 255 - (255 - GREEN[2]) * halo;
            }
          } else if (mode === "cinematic") {
            // редкая медленная искра
            const seed = (col * 37 + row * 17) % 97;
            const ph = (T * 0.5 + seed * 0.13) % 6;
            if (ph < 0.5) {
              const s = Math.sin((ph / 0.5) * Math.PI);
              a += s * 0.4;
              r = GREEN[0]; g = GREEN[1]; b = GREEN[2];
            }
          }
          dot(cx, cy, dimR, r, g, b, a);
        }
      }

      // ── Горящие точки текста ──
      const sinceFlip = (now - flipAt) / 1000;
      for (const d of lit) {
        const cx = (d.col + 0.5) * S;
        const cy = (d.row + 0.5) * S;
        let a = 1;
        let [r, g, b] = d.rgb;
        let rad = litR;

        // Появление сменного слова — сборка по столбцам слева направо
        if (d.flip && hasFlip && !reduce && idx > 0) {
          const appear = (d.col * 0.012) + 0.12;
          const k = Math.min(Math.max((sinceFlip - appear) / 0.18, 0), 1);
          a = k;
        }

        if (mode === "reactive" && mAct) {
          const dx = d.col - mx, dy = d.row - my;
          const boost = Math.exp(-(dx * dx + dy * dy) / 90);
          r = r + (255 - r) * boost;
          g = g + (255 - g) * boost;
          b = b + (255 - b) * boost;
          rad = litR * (1 + boost * 0.5);
        } else if (mode === "cinematic" && !reduce) {
          // волна-блик слева направо каждые ~5 c
          const period = 5;
          const ph = (T % period) / period;
          const front = -8 + ph * (fieldCols + 16);
          const x = d.col + d.row * 0.5 - front;
          const w = Math.exp(-(x * x) / 13);
          r = r + (255 - r) * w * 0.0 + (GREEN[0] - r) * w;
          g = g + (GREEN[1] - g) * w;
          b = b + (GREEN[2] - b) * w;
          rad = litR * (1 + w * 0.35);
        } else if (mode === "calm" && mAct && !reduce) {
          // мягкий блик: светлая полоса идёт за курсором по горизонтали
          const x = d.col - mx;
          const w = Math.exp(-(x * x) / 20);
          r = r + (255 - r) * w;
          g = g + (255 - g) * w;
          b = b + (255 - b) * w;
        }

        dot(cx, cy, rad, r, g, b, a);
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      cleanups.forEach((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, fieldCols, fieldRows, buildLit, intervalMs, scale]);

  return (
    <div ref={wrapRef} className={className}>
      <span className="sr-only">
        {lines.map((l) => l.words?.join(" ") ?? l.text).join(" ")}
      </span>
      <canvas ref={canvasRef} className="block w-full" aria-hidden />
    </div>
  );
}

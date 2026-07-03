"use client";

/* ─────────────────────────────────────────────────────────────────
 * LedBoard — табло: поле незажжённых диодов (SVG-pattern) + текст
 * LED-шрифтом. Сменное слово перерисовывается как на настоящем табло:
 * волна гашения слева направо → пауза → волна загорания.
 *
 * LedCounter — счётчик: цифры прокручиваются случайными значениями
 * и «встают» слева направо. Отсчёт по времени (не тикам) — фоновые
 * вкладки троттлят setInterval до 1 Гц.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { layoutLedText, LED_ROWS } from "@/components/ledFont";
import LedText from "@/components/LedText";
import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";

export type LedLine = { text?: string; words?: readonly string[]; color: string };

export const LED_DIM = "rgba(255,255,255,0.09)";

export function LedBoard({
  lines,
  className = "",
  intervalMs = 2400,
  scale = 1,
  dotR,
  pad = 1,
  gapRows,
  minCols = 0,
  minRows = 0,
  align = "center",
  dim = LED_DIM,
  dimR,
  sparkle = 0,
}: {
  lines: LedLine[];
  className?: string;
  intervalMs?: number;
  /** Апскейл битмапы (толщина штриха в диодах) */
  scale?: number;
  /** Радиус диода (юниты сетки, шаг 4) */
  dotR?: number;
  /** Поля вокруг текста, в диодах */
  pad?: number;
  /** Промежуток между строками, в диодах */
  gapRows?: number;
  /** Минимальная ширина/высота поля, в диодах — чтобы растянуть табло */
  minCols?: number;
  minRows?: number;
  align?: "center" | "left";
  /** Цвет незажжённых диодов поля */
  dim?: string;
  /** Радиус незажжённых диодов (меньше — поле «реже») */
  dimR?: number;
  /** Сколько случайных диодов поля изредка вспыхивает лаймом */
  sparkle?: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [idx, setIdx] = useState(0);
  const hasFlip = lines.some((l) => l.words && l.words.length > 1);

  useEffect(() => {
    if (!hasFlip) return;
    const id = setInterval(() => setIdx((v) => v + 1), intervalMs);
    return () => clearInterval(id);
  }, [hasFlip, intervalMs]);

  const PITCH = 4;
  const R = dotR ?? (scale > 1 ? 1.5 : 1.72);
  const GAP = gapRows ?? 2 * scale;
  const ROWS_LINE = LED_ROWS * scale;

  // Раскладки текущего кадра + предыдущего слова (для волны-гашения)
  const cur = lines.map((l) => {
    const t = l.words ? l.words[idx % l.words.length] : (l.text ?? "");
    return { ...layoutLedText(t, scale), color: l.color, flip: !!l.words };
  });
  const prev = lines.map((l) => {
    if (!l.words || idx === 0) return null;
    const t = l.words[(idx - 1) % l.words.length];
    return { ...layoutLedText(t, scale), color: l.color };
  });

  // Поле фиксируем по самой широкой раскладке среди всех слов
  const fieldCols = useMemo(() => {
    let max = 0;
    for (const l of lines) {
      const variants = l.words ?? [l.text ?? ""];
      for (const v of variants) max = Math.max(max, layoutLedText(v, scale).cols);
    }
    return Math.max(minCols, max + pad * 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(lines.map((l) => l.words ?? l.text)), scale, pad, minCols]);

  const textRows = pad * 2 + lines.length * ROWS_LINE + (lines.length - 1) * GAP;
  const fieldRows = Math.max(minRows, textRows);

  const colOff = (cols: number) =>
    align === "center" ? pad + Math.floor((fieldCols - pad * 2 - cols) / 2) : pad;
  // Вертикальное центрирование: когда поле выше текста (minRows растянул табло),
  // опускаем строки на половину свободного места, иначе текст лип бы к верху.
  const vExtra = Math.max(0, Math.floor((fieldRows - textRows) / 2));
  const rowOff = (li: number) => pad + vExtra + li * (ROWS_LINE + GAP);

  return (
    <svg
      viewBox={`0 0 ${fieldCols * PITCH} ${fieldRows * PITCH}`}
      className={className}
      aria-hidden
      focusable="false"
    >
      <style>{`
        @keyframes ledIn${uid} { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ledOut${uid} { from { opacity: 1; } to { opacity: 0; } }
        @keyframes ledSpark${uid} { 0%, 100% { opacity: 0; } 6% { opacity: 0.55; } 14% { opacity: 0; } }
      `}</style>
      <defs>
        <pattern id={`f${uid}`} width={PITCH} height={PITCH} patternUnits="userSpaceOnUse">
          <circle cx={PITCH / 2} cy={PITCH / 2} r={dimR ?? R} fill={dim} />
        </pattern>
      </defs>
      {/* Поле незажжённых диодов */}
      <rect width={fieldCols * PITCH} height={fieldRows * PITCH} fill={`url(#f${uid})`} />
      {/* Редкие «живые» диоды поля — мягко вспыхивают и гаснут */}
      {sparkle > 0 &&
        Array.from({ length: sparkle }).map((_, i) => {
          const c = (i * 37 + 11) % fieldCols;
          const r2 = (i * 53 + 7) % fieldRows;
          return (
            <circle
              key={`sp${i}`}
              cx={c * PITCH + PITCH / 2}
              cy={r2 * PITCH + PITCH / 2}
              r={R}
              fill="#A6FF00"
              style={{
                opacity: 0,
                animation: `ledSpark${uid} ${5 + (i % 4)}s ease-in-out ${(i * 0.9) % 5}s infinite`,
              }}
            />
          );
        })}
      {/* Гаснущее предыдущее слово: волна гашения слева направо, быстро */}
      {prev.map((lay, li) =>
        lay ? (
          <g key={`p-${li}-${idx}`}>
            {lay.dots
              .filter((d) => d.lit)
              .map((d, i) => (
                <circle
                  key={i}
                  cx={(d.col + colOff(lay.cols)) * PITCH + PITCH / 2}
                  cy={(d.row + rowOff(li)) * PITCH + PITCH / 2}
                  r={R}
                  fill={lay.color}
                  style={{
                    animation: `ledOut${uid} 90ms linear forwards`,
                    animationDelay: `${d.col * 2}ms`,
                  }}
                />
              ))}
          </g>
        ) : null,
      )}
      {/* Текущие строки. Сменное слово загорается ПОСЛЕ полного гашения
          старого (как настоящее табло: очистка → перерисовка). */}
      {cur.map((lay, li) => (
        <g key={lay.flip ? `c-${li}-${idx}` : `s-${li}`}>
          {lay.dots
            .filter((d) => d.lit)
            .map((d, i) => (
              <circle
                key={i}
                cx={(d.col + colOff(lay.cols)) * PITCH + PITCH / 2}
                cy={(d.row + rowOff(li)) * PITCH + PITCH / 2}
                r={R}
                fill={lay.color}
                style={
                  lay.flip && idx > 0
                    ? {
                        animation: `ledIn${uid} 120ms linear both`,
                        animationDelay: `${420 + d.col * 4 + ((d.col * 5 + d.row * 11) % 4) * 10}ms`,
                      }
                    : undefined
                }
              />
            ))}
        </g>
      ))}
    </svg>
  );
}

/* LedLines — многострочный LED-текст: грубый перенос по словам.
   Для заголовков карточек и секций — единый язык с табло хиро. */
export function LedLines({
  text,
  className = "",
  lineClass = "h-[16px] md:h-[20px]",
  scale = 2,
  dot = 1.45,
  maxChars = 24,
  center = false,
  accent,
  accentColor = "#A6FF00",
}: {
  text: string;
  className?: string;
  /** Высота строки (tailwind h-классы) */
  lineClass?: string;
  scale?: number;
  dot?: number;
  /** Примерно символов на строку до переноса */
  maxChars?: number;
  center?: boolean;
  /** Хвост-акцент лаймом (например «*» или «.») */
  accent?: string;
  /** Цвет accent-хвоста (default лайм). */
  accentColor?: string;
}) {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? `${cur} ${w}` : w;
    }
  }
  if (cur) lines.push(cur);
  return (
    <span
      className={`flex flex-col ${center ? "items-center" : "items-start"} gap-[7px] md:gap-[9px] ${className}`}
    >
      <span className="sr-only">{text + (accent ?? "")}</span>
      {lines.map((l, i) =>
        i === lines.length - 1 && accent ? (
          <span key={i} className="flex items-start gap-[6px]">
            <LedText text={l} scale={scale} dot={dot} className={`${lineClass} w-auto max-w-full min-w-0`} />
            <LedText text={accent} scale={scale} dot={dot} className={`${lineClass} w-auto shrink-0`} style={{ color: accentColor }} />
          </span>
        ) : (
          <LedText key={i} text={l} scale={scale} dot={dot} className={`${lineClass} w-auto max-w-full`} />
        ),
      )}
    </span>
  );
}

export function LedCounter({
  value,
  className = "",
  tone = "#F2F4EF",
}: {
  value: string;
  className?: string;
  tone?: string;
}) {
  const locale = useLocale();
  const [disp, setDisp] = useState(value);
  const busy = useRef(false);

  const spin = () => {
    if (busy.current) return;
    busy.current = true;
    const start = performance.now();
    const dur = 700 + value.length * 200;
    const id = setInterval(() => {
      const t = performance.now() - start;
      if (t >= dur) {
        clearInterval(id);
        setDisp(value);
        busy.current = false;
        return;
      }
      setDisp(
        value
          .split("")
          .map((ch, i) => {
            if (!/[0-9]/.test(ch)) return ch;
            const settleAt = dur - (value.length - 1 - i) * 200;
            return t >= settleAt - 200 ? ch : String(Math.floor(Math.random() * 10));
          })
          .join(""),
      );
    }, 55);
  };

  useEffect(() => {
    const t = setTimeout(spin, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      type="button"
      onClick={spin}
      aria-label={pick(`Значение ${value}`, `Value ${value}`, locale)}
      className={`appearance-none bg-transparent border-none p-0 cursor-pointer self-start ${className}`}
      style={{ color: tone }}
    >
      <LedText text={disp} scale={2} dot={1.45} className="h-[32px] md:h-[40px] lg:h-[32px] xl:h-[40px] w-auto" />
    </button>
  );
}

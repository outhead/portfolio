"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";

/**
 * Блок «Подход» с кнопкой «Расшифровать на человеческий».
 * По клику технический текст сменяется простой «человеческой» версией. Текст
 * проявляется тем же шрифтом через быстрый перебор рандомных букв с оседанием
 * по символам слева направо — как клик по цифрам-счётчикам на главной
 * (см. LedCounter): каждый символ крутит случайные буквы, потом «застывает».
 * Повторный клик возвращает технический текст.
 *
 * Уважает prefers-reduced-motion: при включённом — мгновенная замена.
 */

// Пул для перебора: кириллица + латиница + цифры. Из него берём случайный символ на тик.
const SCRAMBLE_POOL = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const randPoolChar = () =>
  SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)];

const CHAR_STEP = 5; // мс между стартами соседних символов (скорость волны)
const CHAR_WINDOW = 240; // мс перебора одного символа от исходной до конечной буквы
const TICK = 33; // частота кадров перебора (~30fps)
const isScrambleable = (ch: string) => /[0-9A-Za-zА-Яа-яЁё]/.test(ch);

type Seg = { text: string; bold: boolean };

function parseSegments(text: string): Seg[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**")
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false }
    );
}

function parseParagraphs(text: string): Seg[][] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(parseSegments);
}

type Cell = { fromCh: string; fromBold: boolean; toCh: string; toBold: boolean };

function flattenChars(segs: Seg[] | undefined): { ch: string; bold: boolean }[] {
  if (!segs) return [];
  const out: { ch: string; bold: boolean }[] = [];
  for (const seg of segs)
    for (const ch of Array.from(seg.text)) out.push({ ch, bold: seg.bold });
  return out;
}

/**
 * Непрерывная расшифровка БЕЗ стыка этапов: каждый символ на своём месте идёт по
 * одному таймлайну «буква техтекста → перебор рандомных букв → буква простого».
 * Лишние символы техтекста растворяются (→ пусто), недостающие проявляются из
 * перебора. Старт волны — слева направо/сверху вниз по глобальному индексу.
 * Структура не переключается посреди анимации, поэтому рывка нет.
 * prefers-reduced-motion — сразу финал.
 */
function DecryptReveal({
  techParas,
  simpleParas,
  prose,
}: {
  techParas: Seg[][];
  simpleParas: Seg[][];
  prose: string;
}) {
  // Позиции по параграфам: на каждый p — max длины тех/простого; глобальный g.
  const nParas = Math.max(techParas.length, simpleParas.length);
  let g = 0;
  const paras: { cells: Cell[]; g0: number }[] = [];
  for (let p = 0; p < nParas; p++) {
    const from = flattenChars(techParas[p]);
    const to = flattenChars(simpleParas[p]);
    const len = Math.max(from.length, to.length);
    const cells: Cell[] = [];
    for (let j = 0; j < len; j++) {
      cells.push({
        fromCh: from[j]?.ch ?? "",
        fromBold: from[j]?.bold ?? false,
        toCh: to[j]?.ch ?? "",
        toBold: to[j]?.bold ?? false,
      });
    }
    paras.push({ cells, g0: g });
    g += len;
  }
  const total = (g > 0 ? g - 1 : 0) * CHAR_STEP + CHAR_WINDOW;

  const [t, setT] = useState(() => {
    if (typeof window === "undefined") return total;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? total : 0;
  });
  const [tick, setTick] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (t >= total) return;
    startRef.current = performance.now();
    const id = setInterval(() => {
      const elapsed = performance.now() - (startRef.current ?? 0);
      setTick((v) => v + 1);
      if (elapsed >= total) {
        clearInterval(id);
        setT(total);
      } else {
        setT(elapsed);
      }
    }, TICK);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  void tick; // форсит ре-рандом на каждом кадре

  const glyph = (cell: Cell, gi: number): { ch: string; bold: boolean } => {
    const startT = gi * CHAR_STEP;
    const endT = startT + CHAR_WINDOW;
    if (t < startT) return { ch: cell.fromCh, bold: cell.fromBold };
    if (t >= endT) return { ch: cell.toCh, bold: cell.toBold };
    const past = t >= (startT + endT) / 2;
    const bold = past ? cell.toBold : cell.fromBold;
    if (isScrambleable(cell.fromCh) || isScrambleable(cell.toCh))
      return { ch: randPoolChar(), bold };
    return { ch: past ? cell.toCh : cell.fromCh, bold };
  };

  return (
    <div className="space-y-3">
      {paras.map((para, pi) => (
        <p key={pi} className={prose}>
          {para.cells.map((cell, k) => {
            const { ch, bold } = glyph(cell, para.g0 + k);
            return (
              <span
                key={k}
                className={bold ? "text-white/90 font-semibold" : undefined}
              >
                {ch}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}

export default function DecryptApproach({
  technical,
  simple,
}: {
  technical: string;
  simple: string;
}) {
  const locale = useLocale();
  const [revealed, setRevealed] = useState(false);

  const techParas = parseParagraphs(technical);
  const simpleParas = parseParagraphs(simple);

  // Единый стиль для обоих состояний: кегль и яркость не меняются при переключении.
  const prose = "text-white/65 leading-relaxed text-sm md:text-base";

  const renderParas = (paras: Seg[][]) => (
    <div className="space-y-3">
      {paras.map((segs, pi) => (
        <p key={pi} className={prose}>
          {segs.map((seg, si) =>
            seg.bold ? (
              <strong key={si} className="text-white/90 font-semibold">
                {seg.text}
              </strong>
            ) : (
              <span key={si}>{seg.text}</span>
            )
          )}
        </p>
      ))}
    </div>
  );

  // Оба варианта всегда в DOM (grid-стек в одной ячейке): высота области = по
  // большему тексту и не прыгает, абзацы и кнопка держат позицию. Невидимый слой
  // через visibility:hidden продолжает занимать место.
  return (
    <div>
      <div className="grid">
        <div
          className="[grid-area:1/1]"
          style={{ visibility: revealed ? "hidden" : "visible" }}
          aria-hidden={revealed}
        >
          {renderParas(techParas)}
        </div>
        <div
          className="[grid-area:1/1]"
          style={{ visibility: revealed ? "visible" : "hidden" }}
          aria-hidden={!revealed}
        >
          {revealed ? (
            <DecryptReveal
              techParas={techParas}
              simpleParas={simpleParas}
              prose={prose}
            />
          ) : (
            renderParas(simpleParas)
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        className="group mt-4 inline-flex items-center gap-2 rounded-md border border-[#A6FF00]/30 bg-[#A6FF00]/[0.06] px-4 py-2 text-[12px] md:text-[14px] tracking-[0.1em] uppercase text-[#A6FF00] hover:bg-[#A6FF00]/[0.12] hover:border-[#A6FF00]/50 transition-colors"
        aria-live="polite"
      >
        <span className="font-mono leading-none transition-transform group-hover:-translate-x-0.5">
          {revealed ? "←" : "⌖"}
        </span>
        {revealed
          ? pick("Вернуть как было", "Back to the original", locale)
          : pick("Расшифровать на человеческий", "Explain in plain words", locale)}
      </button>
    </div>
  );
}

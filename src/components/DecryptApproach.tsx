"use client";

import { useEffect, useRef, useState } from "react";

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

// Пул для перебора: кириллица + цифры. Из него берём случайный символ на тик.
const SCRAMBLE_POOL = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ0123456789";
const randPoolChar = () =>
  SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)];

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

/**
 * Перебор букв по символам. Все скрэмблируемые символы (буквы/цифры) получают
 * глобальный индекс; settleAt растёт слева направо (stagger). Пока t < settleAt —
 * показываем случайный символ из пула, после — настоящий. Пробелы и пунктуация
 * остаются на месте. Тик 45мс, как у счётчиков на главной.
 */
function ScrambleParagraphs({ paras }: { paras: Seg[][] }) {
  const proseSimple = "leading-relaxed text-base md:text-xl";

  // Глобальная индексация скрэмблируемых символов для stagger-оседания.
  let gi = 0;
  const model = paras.map((segs) =>
    segs.map((seg) => ({
      bold: seg.bold,
      chars: Array.from(seg.text).map((ch) => {
        const scramble = /[0-9A-Za-zА-Яа-яЁё]/.test(ch);
        return { ch, scramble, idx: scramble ? gi++ : -1 };
      }),
    }))
  );
  const total = gi;

  const STAGGER = 12; // мс на символ — скорость «волны» оседания
  const SCRAMBLE_MS = 320; // сколько символ крутится до своей точки оседания
  const TICK = 45;
  const dur = total * STAGGER + SCRAMBLE_MS;

  const [t, setT] = useState(() => {
    if (typeof window === "undefined") return dur; // SSR — сразу финал
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? dur : 0;
  });
  const [tick, setTick] = useState(0); // форсит ре-рандом на каждом кадре
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (t >= dur) return;
    startRef.current = performance.now();
    const id = setInterval(() => {
      const elapsed = performance.now() - (startRef.current ?? 0);
      setTick((v) => v + 1);
      if (elapsed >= dur) {
        clearInterval(id);
        setT(dur);
      } else {
        setT(elapsed);
      }
    }, TICK);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  void tick; // зависимость для перерисовки — рандом считается при рендере

  return (
    <div className="space-y-3">
      {model.map((segs, pi) => (
        <p key={pi} className={proseSimple}>
          {segs.map((seg, si) => (
            <span
              key={si}
              className={seg.bold ? "text-[#A6FF00] font-semibold" : "text-white/80"}
            >
              {seg.chars.map((c, k) => {
                if (!c.scramble) return <span key={k}>{c.ch}</span>;
                const settleAt = c.idx * STAGGER + SCRAMBLE_MS;
                const settled = t >= settleAt;
                return <span key={k}>{settled ? c.ch : randPoolChar()}</span>;
              })}
            </span>
          ))}
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
  const [revealed, setRevealed] = useState(false);

  const techParas = parseParagraphs(technical);
  const simpleParas = parseParagraphs(simple);

  const proseTech = "text-white/65 leading-relaxed text-sm md:text-base";

  const renderTech = () => (
    <div className="space-y-3 decrypt-fadeswap">
      {techParas.map((segs, pi) => (
        <p key={pi} className={proseTech}>
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

  return (
    <div>
      {revealed ? <ScrambleParagraphs paras={simpleParas} /> : renderTech()}

      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        className="group mt-4 inline-flex items-center gap-2 rounded-md border border-[#A6FF00]/30 bg-[#A6FF00]/[0.06] px-4 py-2 text-[12px] md:text-[14px] tracking-[0.1em] uppercase text-[#A6FF00] hover:bg-[#A6FF00]/[0.12] hover:border-[#A6FF00]/50 transition-colors"
        aria-live="polite"
      >
        <span className="font-mono leading-none transition-transform group-hover:-translate-x-0.5">
          {revealed ? "←" : "⌖"}
        </span>
        {revealed ? "Вернуть как было" : "Расшифровать на человеческий"}
      </button>
    </div>
  );
}

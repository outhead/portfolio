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

const STAGGER = 12; // мс на символ — скорость «волны» оседания
const STAGGER_OUT = 7; // мс на символ — скорость «волны» рассыпания техтекста
const SCRAMBLE_MS = 320; // сколько символ крутится до своей точки оседания
const TICK = 45; // частота кадров перебора
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

// Модель параграфов с глобальным индексом скрэмблируемых символов (для stagger).
function buildModel(paras: Seg[][]) {
  let gi = 0;
  const model = paras.map((segs) =>
    segs.map((seg) => ({
      bold: seg.bold,
      chars: Array.from(seg.text).map((ch) => {
        const scramble = isScrambleable(ch);
        return { ch, scramble, idx: scramble ? gi++ : -1 };
      }),
    }))
  );
  return { model, count: gi };
}

type Model = ReturnType<typeof buildModel>["model"];

function renderModel(
  model: Model,
  prose: string,
  glyph: (c: { ch: string; scramble: boolean; idx: number }) => string
) {
  return (
    <div className="space-y-3">
      {model.map((segs, pi) => (
        <p key={pi} className={prose}>
          {segs.map((seg, si) => (
            <span
              key={si}
              className={seg.bold ? "text-white/90 font-semibold" : undefined}
            >
              {seg.chars.map((c, k) => (
                <span key={k}>{c.scramble ? glyph(c) : c.ch}</span>
              ))}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

/**
 * Расшифровка в два слитных этапа, БЕЗ мгновенной подмены текста:
 *  1) буквы технического текста (то, что на экране) на своих местах уходят в
 *     перебор слева направо — «начинают расшифровываться»;
 *  2) из перебора слева направо оседает простой текст.
 * Структура (тех → простой) меняется в момент пикового шума, поэтому рывок не
 * виден. Тик 45мс, как у счётчиков на главной. prefers-reduced-motion — сразу финал.
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
  const tech = buildModel(techParas);
  const simple = buildModel(simpleParas);

  const dissolveDur = tech.count * STAGGER_OUT + 140; // тех уходит в шум
  const settleDur = simple.count * STAGGER + SCRAMBLE_MS; // простой оседает
  const total = dissolveDur + settleDur;

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

  // Этап 1: технический текст рассыпается в шум слева направо.
  if (t < dissolveDur) {
    return renderModel(tech.model, prose, (c) =>
      t < c.idx * STAGGER_OUT ? c.ch : randPoolChar()
    );
  }

  // Этап 2: из шума слева направо собирается простой текст.
  const tt = t - dissolveDur;
  return renderModel(simple.model, prose, (c) =>
    tt >= c.idx * STAGGER + SCRAMBLE_MS ? c.ch : randPoolChar()
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
        {revealed ? "Вернуть как было" : "Расшифровать на человеческий"}
      </button>
    </div>
  );
}

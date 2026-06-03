"use client";

import { useState } from "react";

/**
 * Блок «Подход» с кнопкой «Расшифровать на человеческий».
 * По клику технический текст сменяется простой «человеческой» версией, которая
 * плавно собирается по словам: fade + лёгкий blur-in + сдвиг вверх, словами по
 * очереди (stagger). Анимация — чистый CSS @keyframes с per-word animation-delay,
 * запускается сама при появлении слов (без rAF/таймеров, не зависит от вкладки).
 * Повторный клик возвращает технический текст.
 *
 * Уважает prefers-reduced-motion: при включённом — мгновенная замена.
 */

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
  const proseSimple = "leading-relaxed text-base md:text-xl";

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

  // Простая версия: каждое слово — inline-block с CSS-анимацией wordIn и
  // нарастающей задержкой (stagger). Пробелы сохраняются как есть.
  const renderSimple = () => {
    let wi = 0;
    const STAGGER = 16; // ms на слово
    const MAX_DELAY = 1100; // потолок, чтобы длинный текст не тянулся вечно
    return (
      <div className="space-y-3">
        {simpleParas.map((segs, pi) => (
          <p key={pi} className={proseSimple}>
            {segs.map((seg, si) => {
              const parts = seg.text.split(/(\s+)/);
              return (
                <span
                  key={si}
                  className={seg.bold ? "text-[#A6FF00] font-semibold" : "text-white/80"}
                >
                  {parts.map((part, k) => {
                    if (/^\s+$/.test(part) || part === "") return part;
                    const delay = Math.min(wi * STAGGER, MAX_DELAY);
                    wi++;
                    return (
                      <span
                        key={k}
                        className="decrypt-word"
                        style={{ animationDelay: `${delay}ms` }}
                      >
                        {part}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div>
      {revealed ? renderSimple() : renderTech()}

      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        className="group mt-4 inline-flex items-center gap-2 rounded-md border border-[#A6FF00]/30 bg-[#A6FF00]/[0.06] px-4 py-2 text-[12px] md:text-[13px] tracking-[0.1em] uppercase text-[#A6FF00] hover:bg-[#A6FF00]/[0.12] hover:border-[#A6FF00]/50 transition-colors"
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

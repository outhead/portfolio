"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Блок «Подход» с кнопкой «Расшифровать на человеческий».
 * По клику технический текст мягко уходит, а простая «человеческая» версия
 * плавно собирается по словам: fade + лёгкий blur-in + сдвиг вверх, словами
 * по очереди (stagger). Без скрэмбла случайных символов — спокойная «проявка».
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
  const [revealed, setRevealed] = useState(false); // показываем простую версию
  const [shown, setShown] = useState(false); // триггер staggered-проявки
  const rafRef = useRef<number | null>(null);

  const techParas = parseParagraphs(technical);
  const simpleParas = parseParagraphs(simple);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const toggle = () => {
    const next = !revealed;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!next) {
      setRevealed(false);
      setShown(false);
      return;
    }

    setRevealed(true);
    if (reduce) {
      setShown(true);
      return;
    }
    // Сначала слова скрыты, на следующем кадре — запускаем плавную проявку.
    setShown(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() =>
      requestAnimationFrame(() => setShown(true))
    );
  };

  const proseTech = "text-white/65 leading-relaxed text-sm md:text-base";
  const proseSimple = "leading-relaxed text-base md:text-xl";

  const renderTech = () => (
    <div className="space-y-3">
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

  // Простая версия: каждое слово — отдельный inline-block с CSS-transition
  // и нарастающей задержкой (stagger). Пробелы сохраняются как есть.
  const renderSimple = () => {
    let wi = 0; // глобальный индекс слова — для stagger-задержки
    const STAGGER = 16; // ms на слово
    const MAX_DELAY = 1100; // потолок, чтобы длинный текст не тянулся вечно
    return (
      <div className="space-y-3">
        {simpleParas.map((segs, pi) => (
          <p key={pi} className={proseSimple}>
            {segs.map((seg, si) => {
              const parts = seg.text.split(/(\s+)/); // слова и пробелы
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
                        style={{
                          display: "inline-block",
                          willChange: "opacity, transform, filter",
                          transition:
                            "opacity 520ms cubic-bezier(0.22,1,0.36,1), transform 520ms cubic-bezier(0.22,1,0.36,1), filter 520ms cubic-bezier(0.22,1,0.36,1)",
                          transitionDelay: `${delay}ms`,
                          opacity: shown ? 1 : 0,
                          filter: shown ? "blur(0px)" : "blur(6px)",
                          transform: shown ? "translateY(0)" : "translateY(7px)",
                        }}
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
      {/* Плавный кроссфейд между версиями + лёгкий рост размера */}
      <div
        key={revealed ? "simple" : "tech"}
        style={{ animation: "decryptFadeIn 360ms cubic-bezier(0.22,1,0.36,1) both" }}
      >
        {revealed ? renderSimple() : renderTech()}
      </div>

      <button
        type="button"
        onClick={toggle}
        className="group mt-4 inline-flex items-center gap-2 rounded-md border border-[#A6FF00]/30 bg-[#A6FF00]/[0.06] px-4 py-2 text-[12px] md:text-[13px] tracking-[0.1em] uppercase text-[#A6FF00] hover:bg-[#A6FF00]/[0.12] hover:border-[#A6FF00]/50 transition-colors"
        aria-live="polite"
      >
        <span className="font-mono leading-none transition-transform group-hover:-translate-x-0.5">
          {revealed ? "←" : "⌖"}
        </span>
        {revealed ? "Вернуть как было" : "Расшифровать на человеческий"}
      </button>

      <style jsx>{`
        @keyframes decryptFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          div[style*="decryptFadeIn"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Блок «Подход» с кнопкой «Расшифровать на человеческий».
 * По клику технический текст с анимацией-дешифровкой (скрэмбл символов,
 * собирающийся слева направо) заменяется на простую «человеческую» версию,
 * которая ещё и крупнее. Повторный клик возвращает технический текст.
 *
 * Уважает prefers-reduced-motion: при включённом — мгновенная замена без скрэмбла.
 */

type Seg = { text: string; bold: boolean };

const GLYPHS = "АБВГДЕЖЗИКЛМНОПРСabcdef0123456789#%&*<>/\\{}[]アイウエオカ";

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

function rnd() {
  return GLYPHS[(Math.random() * GLYPHS.length) | 0];
}

export default function DecryptApproach({
  technical,
  simple,
}: {
  technical: string;
  simple: string;
}) {
  const [revealed, setRevealed] = useState(false); // показываем ли простую версию
  const [progress, setProgress] = useState(1); // 0..1 — ход дешифровки
  const rafRef = useRef<number | null>(null);

  const techParas = parseParagraphs(technical);
  const simpleParas = parseParagraphs(simple);

  // total chars в простой версии (для скрэмбла)
  const total = simpleParas.reduce(
    (acc, segs) => acc + segs.reduce((a, s) => a + s.text.length, 0),
    0
  );

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const animateTo = (toSimple: boolean) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    setRevealed(toSimple);

    if (!toSimple || reduce) {
      setProgress(1);
      return;
    }

    const dur = 1100;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    setProgress(0);
    rafRef.current = requestAnimationFrame(tick);
  };

  const proseTech = "text-white/65 leading-relaxed text-sm md:text-base";
  const proseSimple = "text-white/80 leading-relaxed text-base md:text-xl";

  // Рендер простой версии с учётом прогресса дешифровки.
  // Символы с глобальным индексом < cut — настоящие, иначе — скрэмбл.
  const renderSimple = () => {
    const cut = Math.floor(progress * total);
    let gi = 0;
    return (
      <div className="space-y-3">
        {simpleParas.map((segs, pi) => (
          <p key={pi} className={proseSimple}>
            {segs.map((seg, si) => {
              let out = "";
              for (let i = 0; i < seg.text.length; i++) {
                const ch = seg.text[i];
                out += gi < cut || ch === " " ? ch : rnd();
                gi++;
              }
              return seg.bold ? (
                <strong key={si} className="text-[#A6FF00] font-semibold">
                  {out}
                </strong>
              ) : (
                <span key={si}>{out}</span>
              );
            })}
          </p>
        ))}
      </div>
    );
  };

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

  return (
    <div>
      <div
        className="transition-all duration-300"
        style={{ opacity: revealed && progress < 0.15 ? 0.6 : 1 }}
      >
        {revealed ? renderSimple() : renderTech()}
      </div>

      <button
        type="button"
        onClick={() => animateTo(!revealed)}
        className="group mt-4 inline-flex items-center gap-2 rounded-md border border-[#A6FF00]/30 bg-[#A6FF00]/[0.06] px-4 py-2 text-[12px] md:text-[13px] tracking-[0.1em] uppercase text-[#A6FF00] hover:bg-[#A6FF00]/[0.12] hover:border-[#A6FF00]/50 transition-colors"
        aria-live="polite"
      >
        <span className="font-mono leading-none">{revealed ? "←" : "⌖"}</span>
        {revealed ? "Вернуть как было" : "Расшифровать на человеческий"}
      </button>
    </div>
  );
}

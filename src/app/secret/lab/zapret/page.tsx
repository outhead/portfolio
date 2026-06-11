"use client";

import LedText from "@/components/LedText";
import { LedLines } from "@/components/LedBoard";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Прототип «Не нажимай» (There Is No Game). Очевидный ход («Выйти») — обманка.
 * Решение — нарушить запрет: нажать «НЕ НАЖИМАТЬ» ~7 раз (эскалация текста).
 * Поле заголовка/текста фиксированной высоты, чтобы кнопка не прыгала.
 */
const MESSAGES = [
  "Дальше ничего нет. Не жми кнопку ниже.",
  "Серьёзно, не надо.",
  "Я же просил.",
  "Это плохая идея.",
  "Ну хватит уже.",
  "Последний раз по-хорошему.",
  "...ну ты понял.",
];

export default function ZapretProto() {
  const [presses, setPresses] = useState(0);
  const [won, setWon] = useState(false);
  const [exitShake, setExitShake] = useState(false);

  const press = () => {
    const n = presses + 1;
    if (n >= MESSAGES.length) setWon(true);
    else setPresses(n);
  };

  return (
    <main className="relative bg-black text-white overflow-y-auto flex flex-col items-center px-5 pt-[88px] pb-16" style={{ minHeight: "100dvh" }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(166,255,0,0.06), transparent 60%)",
      }} />

      {!won ? (
        <div className="relative z-[1] w-full max-w-[440px] mx-auto flex flex-col items-center text-center">
          <p className="text-white/40 mb-3">
            <span className="sr-only">Прототип · A</span>
            <LedText text="Прототип · A" className="h-[9px] w-auto" />
          </p>

          {/* Фикс-высота заголовка+сообщения, чтобы кнопка не прыгала */}
          <div className="flex flex-col items-center justify-start" style={{ height: 200 }}>
            <h1 className="mb-4">
              <LedLines text="Тупик" center maxChars={20} lineClass="h-[17px] md:h-[24px]" />
            </h1>
            <p className="text-sm md:text-[15px] text-white/60 leading-relaxed max-w-sm">
              {MESSAGES[presses]}
            </p>
          </div>

          <button
            type="button"
            onClick={press}
            className="px-8 py-4 rounded-md border-2 border-[#A6FF00] bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-base md:text-lg uppercase tracking-tight hover:bg-[#A6FF00]/20 transition-colors"
          >
            Не нажимать
          </button>

          <button
            type="button"
            onClick={() => { setExitShake(true); setTimeout(() => setExitShake(false), 400); }}
            className={`mt-6 text-[13px] tracking-[0.12em] uppercase transition-all ${exitShake ? "translate-x-1 text-[#C9A66B]" : "text-white/40 hover:text-white/60"}`}
          >
            {exitShake ? "выхода тут нет" : "Выйти →"}
          </button>
        </div>
      ) : (
        <div className="relative z-[1] w-full max-w-[420px] mx-auto flex flex-col items-center text-center">
          <p className="text-white/40 mb-4">
            <span className="sr-only">Разгадал</span>
            <LedText text="Разгадал" className="h-[9px] w-auto" />
          </p>
          <h1 className="text-[#A6FF00] mb-5">
            <LedLines text="Готово" center maxChars={20} lineClass="h-[26px] md:h-[38px]" />
          </h1>
          <p className="text-sm text-white/60 mb-8 max-w-xs">Ты не послушался — в этом и был фокус.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] hover:bg-[#A6FF00] hover:text-black transition-colors no-underline">
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
            <span className="sr-only">На главную</span><LedText text="На главную" className="h-[10px] w-auto" />
          </Link>
        </div>
      )}
    </main>
  );
}

"use client";

/* ─────────────────────────────────────────────────────────────────
 * /led — живое демо LED-движка: набери своё слово, покрути точки.
 * MVP из кейса led-font-engine («Набери своё слово»).
 * ──────────────────────────────────────────────────────────────── */

import { useState } from "react";
import Link from "next/link";
import LedText from "@/components/LedText";
import { LedLines } from "@/components/LedBoard";
import { useLocale } from "@/lib/useLocale";
import { pick, localizedHref } from "@/lib/i18n";

const MAX_LEN = 24;

export default function LedDemo() {
  const locale = useLocale();
  const [text, setText] = useState(pick("Привет", "Hello", locale));
  const [dot, setDot] = useState(1.45);
  const [scale, setScale] = useState(2);

  const shown = text.trim() || "...";

  return (
    <main className="min-h-screen bg-black text-white flex flex-col px-5 md:px-[10%] pt-28 md:pt-32 pb-16">
      <div className="max-w-[900px] w-full mx-auto flex flex-col gap-10 flex-1">
        {/* Шапка */}
        <div className="flex flex-col gap-3">
          <div className="text-white/40">
            <LedText text={pick("Демо · LED-движок", "Demo · LED engine", locale)} className="h-[10px] w-auto" />
          </div>
          <h1 className="text-white">
            <span className="sr-only">{pick("Набери своё слово", "Type your word", locale)}</span>
            <LedLines text={pick("Набери своё слово", "Type your word", locale)} maxChars={20} lineClass="h-[16px] md:h-[20px]" />
          </h1>
          <p className="text-[14px] md:text-[16px] text-white/55 max-w-[480px]">
            {pick(
              "Тот же движок, что рисует весь этот сайт: 89 глифов 5×7, рендер точками. Текст ниже — не шрифт, а карта зажжённых диодов.",
              "The same engine that draws this whole site: 89 glyphs at 5×7, rendered as dots. The text below isn't a font — it's a map of lit diodes.",
              locale,
            )}
          </p>
        </div>

        {/* Табло */}
        <div
          className="relative rounded-2xl bg-[#0b0b0a] overflow-hidden min-h-[220px] md:min-h-[300px] flex items-center justify-center px-6 py-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(166,255,0,0.06) 1.1px, transparent 1.3px)",
            backgroundSize: "8px 8px",
          }}
        >
          <div className="text-[#A6FF00] max-w-full">
            <LedLines
              text={shown.toUpperCase()}
              center
              maxChars={12}
              scale={scale}
              dot={dot}
              lineClass="h-[28px] md:h-[44px]"
            />
          </div>
        </div>

        {/* Управление */}
        <div className="flex flex-col gap-6 max-w-[480px]">
          <input
            type="text"
            value={text}
            maxLength={MAX_LEN}
            onChange={(e) => setText(e.target.value)}
            placeholder={pick("Введи текст…", "Enter text…", locale)}
            className="bg-white/[0.04] border border-white/15 focus:border-[#A6FF00]/60 outline-none rounded-xl px-5 py-4 text-[16px] text-white placeholder:text-white/30 transition-colors"
            aria-label={pick("Текст для табло", "Board text", locale)}
          />
          <label className="flex items-center gap-4 text-white/50">
            <span className="w-28 shrink-0">
              <LedText text={pick("Точка", "Dot", locale)} className="h-[9px] w-auto" />
            </span>
            <input
              type="range"
              min={0.8}
              max={2}
              step={0.05}
              value={dot}
              onChange={(e) => setDot(Number(e.target.value))}
              className="flex-1 accent-[#A6FF00]"
              aria-label={pick("Радиус точки", "Dot radius", locale)}
            />
            <span className="w-12 text-right text-[14px] tabular-nums font-service">{dot.toFixed(2)}</span>
          </label>
          <label className="flex items-center gap-4 text-white/50">
            <span className="w-28 shrink-0">
              <LedText text={pick("Детализация", "Detail", locale)} className="h-[9px] w-auto" />
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={1}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="flex-1 accent-[#A6FF00]"
              aria-label={pick("Апскейл битмапы", "Bitmap upscale", locale)}
            />
            <span className="w-12 text-right text-[14px] tabular-nums font-service">×{scale}</span>
          </label>
        </div>

        {/* Низ */}
        <div className="mt-auto pt-10 flex flex-col gap-4">
          <Link
            href={localizedHref("/cases/led-font-engine", locale)}
            data-ym-goal="led_demo_to_case"
            className="inline-flex items-center gap-2 text-white/60 hover:text-[#A6FF00] transition-colors no-underline"
          >
            <span className="sr-only">{pick("Конструктор глифов и весь набор — в кейсе", "Glyph editor and the full set — in the case study", locale)}</span>
            <LedText text={pick("Конструктор глифов и весь набор — в кейсе", "Glyph editor and the full set — in the case study", locale)} className="h-[10px] w-auto" />
            <LedText text="→" className="h-[11px] w-auto" />
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";

import LedText from "@/components/LedText";
import { LedLines } from "@/components/LedBoard";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Wrench } from "lucide-react";
import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";

interface WIPOverlayProps {
  /** Заголовок поп-апа. По умолчанию «Кейс дорабатывается». */
  title?: string;
  /** Описание под заголовком. */
  description?: string;
}

/**
 * Полноэкранный оверлей для незакрытых кейсов / разделов.
 * Блюрит весь контент под собой и показывает по центру карточку
 * с пояснением «в работе» + ссылками на главную и в портфолио.
 */
export default function WIPOverlay({
  title,
  description,
}: WIPOverlayProps) {
  const locale = useLocale();
  const resolvedTitle = title ?? pick("Кейс дорабатывается", "Case in progress", locale);
  const resolvedDescription =
    description ??
    pick(
      "Эту страницу я доделываю прямо сейчас: дописываю текст, привожу в порядок скриншоты и собираю пресс. Заходите чуть позже или посмотрите готовые кейсы рядом.",
      "I'm still finishing this page right now: writing the copy, tidying up the screenshots and pulling the press together. Check back a little later, or take a look at the finished cases nearby.",
      locale
    );
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={resolvedTitle}
      className="fixed inset-0 z-[150] flex items-center justify-center px-5 md:px-8 bg-black/55 backdrop-blur-xl"
    >
      <div className="relative w-full max-w-[560px] rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0c0c0c] via-[#0a0a0a] to-[#080808] p-7 md:p-10 overflow-hidden">
        {/* Свечение лаймом снизу */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(166,255,0,0.14), transparent 65%)",
          }}
        />

        <div className="relative">
          <span className="inline-flex items-center gap-2 text-[#A6FF00]">
            <Wrench className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="sr-only">{pick("В работе", "In progress", locale)}</span>
            <LedText text={pick("В работе", "In progress", locale)} className="h-[9px] w-auto" />
          </span>

          <h2 className="mt-5 text-white">
            <LedLines text={resolvedTitle} accent="." maxChars={24} lineClass="h-[16px] md:h-[20px]" />
          </h2>

          <p className="mt-4 md:mt-5 text-sm md:text-[16px] text-white/65 leading-relaxed">
            {resolvedDescription}
          </p>

          <div className="mt-7 md:mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#A6FF00] text-black hover:bg-white transition-colors no-underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
              <span className="sr-only">{pick("На главную", "Home", locale)}</span><LedText text={pick("На главную", "Home", locale)} className="h-[11px] w-auto" />
            </Link>
            <Link
              href="/#portfolio"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/[0.15] text-white/85 hover:border-white/40 hover:text-white transition-colors no-underline"
            >
              <span className="sr-only">{pick("Готовые кейсы", "Finished cases", locale)}</span><LedText text={pick("Готовые кейсы", "Finished cases", locale)} className="h-[11px] w-auto" />
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

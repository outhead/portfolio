"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Wrench } from "lucide-react";

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
  title = "Кейс дорабатывается",
  description = "Эту страницу я доделываю прямо сейчас: дописываю текст, привожу в порядок скриншоты и собираю пресс. Заходите чуть позже или посмотрите готовые кейсы рядом.",
}: WIPOverlayProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
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
          <span className="inline-flex items-center gap-2 font-p95 text-[11px] md:text-[12px] tracking-[0.22em] uppercase text-[#A6FF00]">
            <Wrench className="w-3.5 h-3.5" strokeWidth={2} />
            В работе
          </span>

          <h2 className="mt-5 font-p95 text-[clamp(28px,4.5vw,44px)] uppercase leading-[1.0] tracking-tight text-white">
            {title}
            <span className="text-[#A6FF00]">.</span>
          </h2>

          <p className="mt-4 md:mt-5 text-sm md:text-[15px] text-white/65 leading-relaxed">
            {description}
          </p>

          <div className="mt-7 md:mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-3 md:px-6 md:py-3.5 rounded-full bg-[#A6FF00] text-black font-p95 text-[11px] md:text-[12px] tracking-[0.18em] uppercase hover:bg-white transition-colors no-underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
              На главную
            </Link>
            <Link
              href="/#portfolio"
              className="inline-flex items-center gap-2 px-5 py-3 md:px-6 md:py-3.5 rounded-full border border-white/[0.15] text-white/85 font-p95 text-[11px] md:text-[12px] tracking-[0.18em] uppercase hover:border-white/40 hover:text-white transition-colors no-underline"
            >
              Готовые кейсы
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

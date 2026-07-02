"use client";

/* ─────────────────────────────────────────────────────────────────
 * GlyphTicker — бегущая LED-лента между секциями. Дриббл-приём:
 * бесконечный marquee из пиксельного текста с ромбами-разделителями.
 * Чистый CSS keyframes (без rAF), reduced-motion — статичная лента.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import LedText from "@/components/LedText";

export default function GlyphTicker({
  items = ["Открыт к предложениям", "Дизайн-директор", "AI", "Менторинг"],
  color = "text-[#A6FF00]/70",
  speed = 38, // сек на полный проход
  className = "",
}: {
  items?: string[];
  color?: string;
  speed?: number;
  className?: string;
}) {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    setReduce(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  }, []);
  const line = items.join("  ◆  ") + "  ◆  ";
  return (
    <div
      aria-hidden
      className={`relative overflow-hidden select-none pointer-events-none ${className}`}
    >
      <style>{`@keyframes glyphTickerMove{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <div
        className={`flex whitespace-nowrap w-max ${color}`}
        style={reduce ? undefined : { animation: `glyphTickerMove ${speed}s linear infinite` }}
      >
        {[0, 1].map((i) => (
          <span key={i} className="flex items-center shrink-0 pr-8">
            <LedText text={line} className="h-[9px] md:h-[10px] w-auto" />
          </span>
        ))}
      </div>
    </div>
  );
}

"use client";

/* ─────────────────────────────────────────────────────────────────
 * BioRotator — био не стеной, а табло: абзацы сменяются по очереди.
 * Авто-смена с кроссфейдом, пауза по наведению, клик по точкам —
 * переход к нужному. Полный текст продублирован для скринридеров.
 * Уважает prefers-reduced-motion (показывает всё стопкой, без смены).
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BioRotator({
  items,
  interval = 6500,
  className = "",
}: {
  items: ReactNode[];
  interval?: number;
  className?: string;
}) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (paused || reduce.current || items.length < 2) return;
    const t = setTimeout(() => setI((p) => (p + 1) % items.length), interval);
    return () => clearTimeout(t);
  }, [i, paused, interval, items.length]);

  // reduced-motion — отдаём всё стопкой, без анимации
  if (reduce.current) {
    return (
      <div className={`space-y-4 md:space-y-5 ${className}`}>
        {items.map((it, k) => (
          <p key={k} className="text-[16px] text-white/70 leading-relaxed">{it}</p>
        ))}
      </div>
    );
  }

  return (
    <div
      className={className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* полный текст для скринридеров */}
      <div className="sr-only">
        {items.map((it, k) => (
          <p key={k}>{it}</p>
        ))}
      </div>

      {/* видимая часть — один абзац за раз */}
      <div className="relative min-h-[168px] md:min-h-[152px]" aria-hidden>
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-[16px] md:text-[18px] text-white/75 leading-relaxed"
          >
            {items[i]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* индикатор — квадратные LED-точки + прогресс активной */}
      <div className="mt-6 flex items-center gap-2" role="tablist" aria-label="Абзацы о себе">
        {items.map((_, k) => (
          <button
            key={k}
            role="tab"
            aria-selected={k === i}
            aria-label={`Абзац ${k + 1}`}
            onClick={() => setI(k)}
            className="group relative h-3 w-3 flex items-center justify-center"
          >
            <span
              className={`block h-[7px] transition-all duration-300 ${
                k === i ? "w-7 bg-[#C9A66B]" : "w-[7px] bg-white/20 group-hover:bg-white/40"
              }`}
              style={{ borderRadius: 1 }}
            />
            {k === i && !paused && (
              <motion.span
                key={`p${i}`}
                className="absolute left-0 top-1/2 -translate-y-1/2 h-[7px] bg-white/85"
                style={{ borderRadius: 1 }}
                initial={{ width: 0 }}
                animate={{ width: 28 }}
                transition={{ duration: interval / 1000, ease: "linear" }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

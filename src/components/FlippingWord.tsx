"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// FlippingWord — вертикальный ticker / split-roller. Слова стэкаются
// одним столбцом, при смене индекса столбец translateY-ится на нужное
// слово. Пружинный spring даёт лёгкий overshoot как у реальных
// roller-табло. Маска по вертикали смягчает вход и выход слов за
// границы окна — на концах они растворяются, а не обрезаются ножом.
//
// Ширина слота фиксируется невидимым sizer-ом по самому длинному
// слову, чтобы соседние элементы в строке не дёргались.
//
// line-height: 1 — критично для чёткого позиционирования:
// одно слово = ровно 1em высоты → translateY(-i * 100%) попадает ноль
// в ноль.

interface FlippingWordProps {
  words: readonly string[];
  intervalMs?: number;
  className?: string;
}

export default function FlippingWord({
  words,
  intervalMs = 2400,
  className = "",
}: FlippingWordProps) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (words.length < 2) return;
    const id = setInterval(
      () => setI((v) => (v + 1) % words.length),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [words.length, intervalMs]);

  // Самое длинное по количеству символов — приблизительная оценка ширины
  // слота.
  const longest = words.reduce(
    (a, b) => (b.length > a.length ? b : a),
    "",
  );

  return (
    <span
      className={`relative inline-block align-baseline ${className}`}
      style={{ lineHeight: 1 }}
    >
      {/* Невидимый sizer — держит ширину и baseline слота */}
      <span aria-hidden className="invisible whitespace-nowrap">
        {longest}
      </span>
      {/* Окно ticker-а с вертикальной маской — мягкий fade у верхней
          и нижней границ, чтобы уходящее/приходящее слово не резалось
          ровной линией, а растворялось. */}
      <span
        aria-live="polite"
        className="absolute inset-0 overflow-hidden"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
        }}
      >
        <motion.span
          className="block whitespace-nowrap"
          animate={{ y: `${-i * 100}%` }}
          transition={{
            type: "spring",
            stiffness: 160,
            damping: 22,
            mass: 0.9,
          }}
        >
          {words.map((w, idx) => (
            <span key={idx} className="block whitespace-nowrap">
              {w}
            </span>
          ))}
        </motion.span>
      </span>
    </span>
  );
}

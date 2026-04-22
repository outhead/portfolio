"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

// FlippingWord — «перекидное табло»: циклически переворачивает одно слово
// на другое с 3D-флипом вокруг оси X. Ширина слота фиксируется самым
// длинным словом, чтобы соседние элементы на строке не прыгали.
//
// Реализация — одним цельным слоем (не split-flap): уходящее слово
// вращается в rotateX 90° и плавно исчезает, приходящее приходит
// с rotateX -90° в 0°. Нет шва между половинками и проблемы «резкого
// пропадания», характерной для двухпанельного варианта.

interface FlippingWordProps {
  words: readonly string[];
  intervalMs?: number;
  durationMs?: number;
  className?: string;
}

export default function FlippingWord({
  words,
  intervalMs = 2400,
  durationMs = 420,
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

  const current = words[i] ?? "";
  // Самое длинное по количеству символов — приблизительная оценка ширины.
  const longest = words.reduce(
    (a, b) => (b.length > a.length ? b : a),
    "",
  );

  const dur = durationMs / 1000;

  return (
    <span
      className={`relative inline-block align-baseline ${className}`}
      style={{ perspective: 1200 }}
    >
      {/* Невидимый sizer — держит ширину слота стабильной */}
      <span aria-hidden className="invisible">
        {longest}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={current}
          className="absolute left-0 top-0 inline-block whitespace-nowrap"
          style={{
            transformOrigin: "50% 50%",
            backfaceVisibility: "hidden",
          }}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 90, opacity: 0 }}
          transition={{ duration: dur, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

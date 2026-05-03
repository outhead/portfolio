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

  // Окно карусели чуть выше 1em (1.15em), чтобы кириллические буквы
  // с диакритикой («Й», «Ё») не обрезались overflow-hidden. Но шаг
  // и line-height ВНЕШНЕГО span'а оставляем как у родителя (наследуем) —
  // иначе строка FlippingWord растягивает h1's leading.
  // Окно сдвигаем на -PAD_EM вверх, чтобы baseline слова совпадал с
  // baseline невидимого sizer'а (то есть с baseline соседней статичной
  // строки в h1).
  const STEP_EM = 1.15;
  const PAD_EM = (STEP_EM - 1) / 2; // 0.075

  return (
    <span
      className={`relative inline-block align-baseline ${className}`}
    >
      {/* Невидимый sizer — держит ширину и baseline слота. line-height
          наследуется от родителя (h1 → 0.92), чтобы внешний slot
          не ломал leading. */}
      <span aria-hidden className="invisible whitespace-nowrap">
        {longest}
      </span>
      {/* Окно ticker-а: внутри — собственный увеличенный line-height,
          чтобы breve не клиповался. Позиционируем так, чтобы baseline
          активного слова совпадал с baseline sizer'а: смещаем вверх
          на PAD_EM = (STEP_EM-1)/2. */}
      <span
        aria-live="polite"
        className="absolute left-0 right-0 overflow-hidden"
        style={{
          top: `-${PAD_EM}em`,
          height: `${STEP_EM}em`,
          lineHeight: STEP_EM,
        }}
      >
        <motion.span
          className="block whitespace-nowrap"
          animate={{ y: `${-i * STEP_EM}em` }}
          transition={{
            type: "tween",
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {words.map((w, idx) => (
            <span
              key={idx}
              className="block whitespace-nowrap"
              style={{ lineHeight: STEP_EM }}
            >
              {w}
            </span>
          ))}
        </motion.span>
      </span>
    </span>
  );
}

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
      {/* Окно ticker-а с очень узким vertical mask (4% сверху и снизу):
          раньше mask был широким (12% до 88%) и нижняя часть букв
          выглядела «затемнённой». Сейчас fade-зона совсем узкая —
          практически невидимая глазу, но скрывает соседние слова из
          стека (без неё overflow-hidden их пропускал из-за inline-сайзера). */}
      <span
        aria-live="polite"
        className="absolute inset-0 overflow-hidden"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 4%, black 96%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 4%, black 96%, transparent 100%)",
        }}
      >
        {/* ВАЖНО: y указываем в em, а НЕ в %. translateY(%) считается
            от высоты самого анимируемого элемента, а в нём лежат ВСЕ
            слова — высота столбца = N em, и «-i * 100%» уезжает в
            «-i * N em», т.е. в самый низ. В em расчёт детерминирован:
            одно слово = 1em, шаг = 1em. */}
        <motion.span
          className="block whitespace-nowrap"
          animate={{ y: `${-i}em` }}
          // Tween без overshoot: при spring следующее/предыдущее слово
          // выглядывало над/под видимой строкой при пружинном перепрыге,
          // и приходилось маскировать gradient'ом — что и читалось как
          // «затемнение второй строки». Tween ровно встаёт на 1em, без
          // вылетов, и mask больше не нужен.
          transition={{
            type: "tween",
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
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

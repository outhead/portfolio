"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./FlippingWord.module.css";

// FlippingWord — split-flap «перекидное табло». Слово делится по горизонтали
// пополам: верх и низ. При смене верхняя половинка с текущим словом падает
// вперёд, а нижняя с новым словом поднимается снизу. Анимация чисто на CSS,
// React только переключает класс .flip с force-reflow, чтобы ретриггерить
// keyframes без пересоздания DOM.

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
  const [idx, setIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(0);
  const cardRef = useRef<HTMLSpanElement | null>(null);

  // Циклический таймер — запоминаем предыдущий индекс, чтобы верх показывал
  // «уходящее» слово, а низ — «приходящее».
  useEffect(() => {
    if (words.length < 2) return;
    const id = setInterval(() => {
      setIdx((v) => {
        setPrevIdx(v);
        return (v + 1) % words.length;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [words.length, intervalMs]);

  // Ретриггер CSS-анимаций: снимаем класс, форсим reflow, вешаем обратно.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    el.classList.remove(styles.flip);
    // Force reflow чтобы браузер «пересобрал» кейфреймы
    void el.offsetWidth;
    el.classList.add(styles.flip);
  }, [idx]);

  const current = words[idx] ?? "";
  const previous = words[prevIdx] ?? current;

  // Самое длинное слово — держит ширину слота.
  const longest = words.reduce(
    (a, b) => (b.length > a.length ? b : a),
    "",
  );

  return (
    <span className={`${styles.wrap} ${className}`}>
      {/* Невидимый sizer — фиксирует габариты по самому длинному слову */}
      <span aria-hidden className={styles.sizer}>
        {longest}
      </span>
      <span ref={cardRef} className={styles.card} aria-live="polite">
        {/* Статика: верх показывает ЦЕЛЕВОЕ (новое) слово — вскрывается,
           когда .backTop откидывается. Низ показывает УХОДЯЩЕЕ (старое)
           слово — до тех пор, пока .backBottom с новым не перекроет.
           Такое распределение даёт одновременный флип верха и низа. */}
        <span className={styles.top} data-value={current} />
        <span className={styles.bottom} data-value={previous} />
        {/* Перекидные слои: верх с «уходящим» словом падает вперёд,
           низ с «приходящим» словом поднимается снизу — параллельно. */}
        <span className={styles.backTop} data-value={previous} />
        <span className={styles.backBottom} data-value={current} />
      </span>
    </span>
  );
}

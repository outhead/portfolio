"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./FlippingWord.module.css";

// FlippingWord — split-flap «перекидное табло». Слово делится по горизонтали
// пополам: верх и низ. При смене верхняя половинка со старым словом падает
// вперёд, а нижняя с новым словом поднимается снизу — синхронно.
//
// Тонкости, которые здесь решены:
// 1) Класс .flip переключается в useLayoutEffect ДО покраски, чтобы не было
//    кадра с новым data-value при старой геометрии анимации (flash нового
//    слова до начала флипа).
// 2) По окончании анимации нижнего слоя syncим previous → current. Это
//    убирает «хвосты» более длинного старого слова, которые иначе торчали
//    справа за левовыровненным новым (СЕРВИСЫ vs КОМАНДЫ).

interface FlippingWordProps {
  words: readonly string[];
  intervalMs?: number;
  className?: string;
}

// useLayoutEffect работает только в браузере; на SSR фолбэчим на useEffect,
// чтобы React не ругался.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function FlippingWord({
  words,
  intervalMs = 2400,
  className = "",
}: FlippingWordProps) {
  const [idx, setIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(0);
  const cardRef = useRef<HTMLSpanElement | null>(null);

  // Циклический таймер: запоминаем уходящий индекс и двигаем идx вперёд.
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

  // Ретриггер CSS-анимаций перед покраской, чтобы новое слово не мелькнуло
  // в статике до флипа.
  useIsomorphicLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    el.classList.remove(styles.flip);
    void el.offsetWidth; // force reflow — пересобираем keyframes
    el.classList.add(styles.flip);
  }, [idx]);

  const current = words[idx] ?? "";
  const previous = words[prevIdx] ?? current;

  // Самое длинное слово — держит ширину слота стабильной.
  const longest = words.reduce(
    (a, b) => (b.length > a.length ? b : a),
    "",
  );

  // По завершении анимации нижней половинки: backBottom в этот момент
  // полностью перекрывает static.bottom, поэтому обновление data-value
  // снизу визуально незаметно и убирает «хвосты» старого слова.
  const handleBottomAnimEnd = () => {
    if (prevIdx !== idx) setPrevIdx(idx);
  };

  return (
    <span className={`${styles.wrap} ${className}`}>
      {/* Невидимый sizer — держит ширину слота по самому длинному слову */}
      <span aria-hidden className={styles.sizer}>
        {longest}
      </span>
      <span ref={cardRef} className={styles.card} aria-live="polite">
        {/* Статика: верх = current (новое, раскрывается когда backTop упал),
           низ = previous (старое, видно до начала и в первый момент флипа).
           После завершения анимации previous синкается к current. */}
        <span className={styles.top} data-value={current} />
        <span className={styles.bottom} data-value={previous} />
        {/* Перекидные слои: верх со старым падает, низ с новым поднимается —
           синхронно, одной длительностью. */}
        <span className={styles.backTop} data-value={previous} />
        <span
          className={styles.backBottom}
          data-value={current}
          onAnimationEnd={handleBottomAnimEnd}
        />
      </span>
    </span>
  );
}

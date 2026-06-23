"use client";

import { useState } from "react";
import { bumpHint } from "@/app/secret/leaderboard";

/**
 * Подсказка по кнопке. Раскрывает намёки по одному (от мягкого к прямому);
 * каждый ВПЕРВЫЕ показанный намёк увеличивает сквозной счётчик подсказок квеста,
 * который показывается в финале. Заменяет прежние авто-подсказки по таймеру.
 */
export default function HintButton({
  hints,
  disabled = false,
  className = "",
}: {
  hints: string[];
  disabled?: boolean;
  className?: string;
}) {
  const [level, setLevel] = useState(0); // сколько намёков уже раскрыто

  const reveal = () => {
    if (level >= hints.length) return;
    bumpHint();
    setLevel((l) => l + 1);
  };

  const text = level > 0 ? hints[level - 1] : "";
  const more = level < hints.length;
  const label = level === 0 ? "Подсказка" : "Ещё подсказка";

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <p
        className="text-[13px] text-[#C9A66B]/85 transition-opacity duration-500 min-h-[20px] max-w-[280px] text-center"
        style={{ opacity: text ? 1 : 0 }}
        aria-live="polite"
      >
        {text}
      </p>
      {more && !disabled ? (
        <button
          type="button"
          onClick={reveal}
          className="text-[13px] text-white/45 hover:text-[#A6FF00] underline decoration-white/20 underline-offset-4 px-2 py-1.5 transition-colors"
        >
          {label}
        </button>
      ) : null}
    </div>
  );
}

import { layoutLedText, LED_ROWS } from "@/components/ledFont";

/**
 * LedText — статичный текст точечным LED-шрифтом 5×7.
 * Цвет — currentColor: красится и анимируется обычными text-* классами
 * родителя (hover, active и т.д.). Незажжённые диоды не рендерятся.
 */

const PITCH = 4;

export default function LedText({
  text,
  className,
  dot = 1.5,
}: {
  text: string;
  className?: string;
  /** Радиус диода в юнитах сетки (шаг 4). 1.5 — плотно (мелкие надписи),
   *  ~1.05 — разреженное табло (крупные). */
  dot?: number;
}) {
  const { dots, cols } = layoutLedText(text);
  return (
    <svg
      viewBox={`0 0 ${cols * PITCH} ${LED_ROWS * PITCH}`}
      className={className}
      aria-hidden
      focusable="false"
    >
      {dots
        .filter((d) => d.lit)
        .map((d, i) => (
          <circle
            key={i}
            cx={d.col * PITCH + PITCH / 2}
            cy={d.row * PITCH + PITCH / 2}
            r={dot}
            fill="currentColor"
          />
        ))}
    </svg>
  );
}

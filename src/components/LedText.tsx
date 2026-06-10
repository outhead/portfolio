import { layoutLedText, LED_ROWS } from "@/components/ledFont";

/**
 * LedText — статичный текст точечным LED-шрифтом 5×7.
 * Цвет — currentColor: красится и анимируется обычными text-* классами
 * родителя (hover, active и т.д.). Незажжённые диоды не рендерятся.
 */

const PITCH = 4;
const R = 1.5;

export default function LedText({
  text,
  className,
}: {
  text: string;
  className?: string;
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
            r={R}
            fill="currentColor"
          />
        ))}
    </svg>
  );
}

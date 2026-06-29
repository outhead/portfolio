import { layoutLedText } from "@/components/ledFont";

/**
 * LedText — статичный текст точечным LED-шрифтом 5×7.
 * Цвет — currentColor: красится и анимируется обычными text-* классами
 * родителя (hover, active и т.д.). Незажжённые диоды не рендерятся.
 */

const PITCH = 4;

export default function LedText({
  text,
  className,
  style,
  preserve,
  dot = 1.75,
  scale = 1,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  /** preserveAspectRatio SVG — напр. "xMinYMid meet", чтобы при max-w-full
   *  сжатый текст прижимался влево, а не центрировался. */
  preserve?: string;
  /** Радиус диода в юнитах сетки (шаг 4). 1.5 — плотно (мелкие надписи),
   *  ~1.05–1.2 — разреженное табло (крупные). */
  dot?: number;
  /** Апскейл битмапы: 2–3 → штрих в 2–3 точки, точки мельче и их больше. */
  scale?: number;
}) {
  const { dots, cols, rows } = layoutLedText(text, scale);
  // Все зажжённые диоды — одним <path> (каждая точка = окружность из двух дуг),
  // а не массивом <circle>. Визуально идентично, но 1 DOM-узел вместо сотен:
  // на странице это срезает десятки тысяч SVG-нод (главная причина нагрузки на CPU).
  const r = dot;
  const d = dots
    .filter((p) => p.lit)
    .map((p) => {
      const cx = p.col * PITCH + PITCH / 2;
      const cy = p.row * PITCH + PITCH / 2;
      return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
    })
    .join("");
  return (
    <svg
      viewBox={`0 0 ${cols * PITCH} ${rows * PITCH}`}
      className={className}
      style={style}
      preserveAspectRatio={preserve}
      aria-hidden
      focusable="false"
    >
      <path d={d} fill="currentColor" />
    </svg>
  );
}

"use client";

/* ─────────────────────────────────────────────────────────────────
 * PixelCube — пиксельная «иконка-кубик» из LED-точек на языке сайта.
 * Заменяет фотореалистичный глянцевый 3D-кубик в карточках кейсов.
 *
 * Геометрия: фронтальная скруглённая плитка (dot-matrix) + экструз
 * вниз-вправо в тёмном бренд-тоне — читается как объёмный блок.
 * Лого кладётся поверх фронтальной грани (LedText или bitmap-спрайт).
 *
 * Состояние покоя — точки притушены (диоды «спят»). На ховере карточки
 * (родитель — .group) матрица насыщается бренд-цветом и лого «зажигается».
 * ──────────────────────────────────────────────────────────────── */

const N = 20; // точек на грань
const OX = 3; // сдвиг экструза (глубина куба), в точках
const CORNER = 4; // радиус скругления, в точках

/** Точка внутри скруглённого квадрата N×N? */
function inRounded(x: number, y: number): boolean {
  const r = CORNER;
  const cx = x < r ? r : x > N - 1 - r ? N - 1 - r : x;
  const cy = y < r ? r : y > N - 1 - r ? N - 1 - r : y;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

export default function PixelCube({
  color,
  logo,
  active = false,
  className = "",
}: {
  /** Бренд-цвет (фронтальная грань). */
  color: string;
  /** Лого поверх грани — обычно <LedText text="МТС" /> или PixelGlyph. */
  logo?: React.ReactNode;
  /** Принудительно «зажжённое» состояние (для превью/мобильного фокуса). */
  active?: boolean;
  className?: string;
}) {
  const front: Array<[number, number]> = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (inRounded(x, y)) front.push([x, y]);
    }
  }
  // Экструз — тот же силуэт, сдвинут на OX вниз-вправо (рисуется позади).
  const side = front.map(([x, y]) => [x + OX, y + OX] as [number, number]);

  const VB = N + OX; // 23
  // Центр фронтальной грани в долях вьюбокса — для позиционирования лого.
  const cx = ((N - 1) / 2 + 0.5) / VB;
  const cy = ((N - 1) / 2 + 0.5) / VB;

  const ease = "transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";
  const glowCls = active ? "opacity-70" : "opacity-0 group-hover:opacity-70";
  const sideCls = active ? "opacity-30" : "opacity-[0.12] group-hover:opacity-30";
  const logoCls = active ? "opacity-100" : "opacity-70 group-hover:opacity-100";

  return (
    <div className={`relative ${className}`} style={{ aspectRatio: "1 / 1" }}>
      {/* Бренд-свечение под кубом — проявляется на ховере */}
      <div
        aria-hidden
        className={`absolute inset-0 ${ease} ${glowCls} pointer-events-none`}
        style={{
          background: `radial-gradient(closest-side, ${color}55, transparent 72%)`,
          filter: "blur(6px)",
        }}
      />
      <svg viewBox={`0 0 ${VB} ${VB}`} className="relative w-full h-full overflow-visible" aria-hidden>
        {/* Грань-экструз (тень/бок куба) */}
        {side.map(([x, y], i) => (
          <circle
            key={`s${i}`}
            cx={x + 0.5}
            cy={y + 0.5}
            r={0.34}
            fill={color}
            className={`${sideCls} ${ease}`}
          />
        ))}
        {/* Фронтальная грань */}
        {front.map(([x, y], i) => {
          // лёгкая текстура: шахматный разнобой яркости, чтобы матрица не была плоской
          const dim = (x + y) % 3 === 0;
          const frontCls = active
            ? "opacity-100"
            : `${dim ? "opacity-30" : "opacity-40"} group-hover:opacity-100`;
          return (
            <circle
              key={`f${i}`}
              cx={x + 0.5}
              cy={y + 0.5}
              r={0.36}
              fill={color}
              className={`${frontCls} ${ease}`}
              style={{ transitionDelay: `${((x + y) % 6) * 22}ms` }}
            />
          );
        })}
      </svg>
      {/* Лого поверх фронтальной грани */}
      {logo && (
        <div
          className={`absolute ${logoCls} ${ease} pointer-events-none`}
          style={{ left: `${cx * 100}%`, top: `${cy * 100}%`, transform: "translate(-50%, -50%)" }}
        >
          {logo}
        </div>
      )}
    </div>
  );
}

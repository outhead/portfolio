/* ─────────────────────────────────────────────────────────────────
 * OledKit — панели «премиального дисплея» и микро-визуализации:
 * Oled — плоская тёмная панель с тонкой обводкой (+ лайм-кромка),
 * DotGraph — тихий граф данных из точек,
 * Activity — минимальные золотые бары активности.
 * ──────────────────────────────────────────────────────────────── */

export function Oled({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Тонкий лаймовый контур-свечение по нижней кромке */
  glow?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border border-white/[0.06] bg-[#0f0f0e] shadow-[0_18px_50px_rgba(0,0,0,0.35)] overflow-hidden ${className}`}
    >
      {glow && (
        <div
          aria-hidden
          className="absolute inset-x-6 bottom-0 h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(166,255,0,0.45) 30%, rgba(166,255,0,0.45) 70%, transparent)",
          }}
        />
      )}
      {children}
    </div>
  );
}

export function DotGraph({ className = "" }: { className?: string }) {
  const pts = Array.from({ length: 26 }).map((_, i) => {
    const x = i / 25;
    return {
      x: 6 + x * 188,
      y: 14 + (0.72 - 0.48 * x - 0.12 * Math.sin(x * 5.2)) * 60,
    };
  });
  return (
    <svg viewBox="0 0 200 70" preserveAspectRatio="none" className={className} aria-hidden>
      <style>{`@keyframes dgwOled { 0%, 100% { opacity: 0.18; } 50% { opacity: 0.7; } }`}</style>
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={1.2}
          fill="#A6FF00"
          style={{ animation: `dgwOled 3.4s ease-in-out ${(i * 0.13).toFixed(2)}s infinite` }}
        />
      ))}
    </svg>
  );
}

/** PixelGlyph — пиктограмма из LED-точек по битмапе ("1" — горящий диод). */
export function PixelGlyph({ rows, className }: { rows: string[]; className?: string }) {
  const P = 4;
  const cols = rows[0].length;
  return (
    <svg
      viewBox={`0 0 ${cols * P} ${rows.length * P}`}
      className={className}
      aria-hidden
      focusable="false"
    >
      {rows.flatMap((r, y) =>
        [...r].map((c, x) =>
          c === "1" ? (
            <circle key={`${x}-${y}`} cx={x * P + P / 2} cy={y * P + P / 2} r={1.6} fill="currentColor" />
          ) : null,
        ),
      )}
    </svg>
  );
}

/** Иконки экспертизы: орг-схема / сегменты направлений / код */
export const GLYPH_ORG = [
  "000111000",
  "000111000",
  "000010000",
  "011111110",
  "010000010",
  "111000111",
  "111000111",
];
export const GLYPH_GRID = [
  "111101111",
  "111101111",
  "111101111",
  "000000000",
  "111101111",
  "111101111",
  "111101111",
];
export const GLYPH_CODE = [
  "000000000",
  "001001100",
  "010001010",
  "100010001",
  "010100010",
  "001100100",
  "000000000",
];

/** Пиксельный кубок — награда CX Awards. */
export const GLYPH_TROPHY = [
  "1111111111111",
  "1111111111111",
  "0111111111110",
  "0111111111110",
  "0011111111100",
  "0001111111000",
  "0000111110000",
  "0000011100000",
  "0000011100000",
  "0000111110000",
  "0011111111100",
  "0111111111110",
];

export function Activity({ seed = 0 }: { seed?: number }) {
  return (
    <span className="flex items-end gap-[2.5px] h-[14px] shrink-0" aria-hidden>
      <style>{`@keyframes actbOled { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }`}</style>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="w-[2.5px] rounded-[1px] bg-[#C9A66B]/80 origin-bottom"
          style={{
            height: 5 + ((i * 7 + seed * 5) % 9),
            animation: `actbOled ${(1.6 + ((i + seed) % 5) * 0.3).toFixed(1)}s ease-in-out ${(i * 0.21 + seed * 0.37).toFixed(2)}s infinite alternate`,
          }}
        />
      ))}
    </span>
  );
}

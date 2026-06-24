/**
 * Пиксель-арт иконки для реакций кооп-загадки (палец вверх / какашка).
 * Рисуем сеткой квадратов через SVG (crispEdges), цвет — currentColor по умолчанию
 * или явный fill. Стиль — в тон LED/пиксельной графике сайта.
 */

// 1 — закрашенный пиксель. Палец вверх (12×12).
export const THUMB_UP = [
  ".....XX.....",
  "....X..X....",
  "....X..X....",
  "....X..X....",
  "....X..XXXX.",
  ".XXXX.....X.",
  ".X........X.",
  ".X........X.",
  ".X........X.",
  ".X.......X..",
  ".X......X...",
  ".XXXXXXX....",
];

// Какашка (12×12) — мордочка-куча с острым верхом.
export const POOP = [
  ".....XX.....",
  "....XXXX....",
  "...XX..XX...",
  "...X....X...",
  "..XX....XX..",
  "..X......X..",
  ".XX......XX.",
  ".X........X.",
  ".X........X.",
  "XX........XX",
  "X..........X",
  "XXXXXXXXXXXX",
];

export default function PixelArt({
  rows,
  color = "currentColor",
  className,
}: {
  rows: string[];
  color?: string;
  className?: string;
}) {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const cells: React.ReactNode[] = [];
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) {
      if (r[x] === "X") cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />);
    }
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} shapeRendering="crispEdges" aria-hidden focusable="false">
      {cells}
    </svg>
  );
}

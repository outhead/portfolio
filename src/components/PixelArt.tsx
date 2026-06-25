/**
 * LED-реакции кооп-загадки: одноцветные силуэты (16×16) на зелёной точечной сетке —
 * в стиле LED-табло сайта. Незажжённые ячейки — тусклые точки, зажжённые — яркие
 * лаймовые диоды со свечением. С animate точки загораются волной (по диагонали).
 */
export type Pixmap = { rows: string[] };

export const THUMB_UP: Pixmap = {
  rows: [
    "................",
    "................",
    ".......X........",
    "......XXX.......",
    ".....XXXXX......",
    ".....XXXXX......",
    ".....XXXXX......",
    ".....XXXXX......",
    "......XXXX......",
    "....XXXXXXXX....",
    "....XXXXXXXX....",
    "...X........X...",
    "...XXXXXXXXXX...",
    "................",
    "....XXXXXXXX....",
    "...XXXXXXXXXX...",
  ],
};

export const POOP: Pixmap = {
  rows: [
    "................",
    "................",
    "................",
    ".......XXX......",
    ".......XXX......",
    "......XXXXX.....",
    ".....XXXXXXX....",
    "......XXXXX.....",
    "....XX.XXX.XX...",
    "....XX.XXX.XX...",
    "....XXXXXXXXX...",
    "...XXXXXXXXXXX..",
    "..XXX...X...XXX.",
    ".XXXXXX...XXXXXX",
    "..XXXXXXXXXXXXX.",
    "...XXXXXXXXXXX..",
  ],
};

export const POINT_RIGHT: Pixmap = {
  rows: [
    "................",
    "................",
    "................",
    ".....XX.........",
    "....XXXX........",
    "....XXXX........",
    "...XXXXXX.......",
    "...XXXXXXXXXXX..",
    "..X......XXXXXX.",
    "..XXXXXXXXXXXXX.",
    "..XXXXXXXXXXXX..",
    "................",
    "...XXXXXX.......",
    ".....XX.........",
    "................",
    "................",
  ],
};

export const POINT_LEFT: Pixmap = {
  rows: POINT_RIGHT.rows.map((r) => [...r].reverse().join("")),
};

export const REACTION_ART: Record<string, Pixmap> = {
  up: THUMB_UP,
  poop: POOP,
  left: POINT_LEFT,
  right: POINT_RIGHT,
};

export default function PixelArt({
  art,
  className,
  color = "#A6FF00",
  animate = false,
  grid = true,
}: {
  art: Pixmap;
  className?: string;
  color?: string;
  animate?: boolean;
  grid?: boolean;
}) {
  const h = art.rows.length;
  const w = art.rows[0]?.length ?? 0;
  const cells: React.ReactNode[] = [];
  art.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const cx = x + 0.5;
      const cy = y + 0.5;
      const lit = row[x] === "X";
      if (lit) {
        const delay = animate ? `${(x + y) * 0.028}s` : undefined;
        const cls = animate ? "led-dot" : undefined;
        cells.push(
          <circle key={`g${x}-${y}`} cx={cx} cy={cy} r={0.62} fill={color} opacity={0.2} className={cls} style={delay ? { animationDelay: delay } : undefined} />,
          <circle key={`d${x}-${y}`} cx={cx} cy={cy} r={0.4} fill={color} className={cls} style={delay ? { animationDelay: delay } : undefined} />
        );
      } else if (grid) {
        cells.push(<circle key={`u${x}-${y}`} cx={cx} cy={cy} r={0.12} fill={color} opacity={0.12} />);
      }
    }
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden focusable="false">
      {cells}
    </svg>
  );
}

/**
 * LED-реакции кооп-загадки: одноцветные силуэты (16×16) на зелёной точечной сетке —
 * в стиле LED-табло сайта. Незажжённые ячейки — тусклые точки, зажжённые — яркие
 * лаймовые диоды со свечением. С animate точки загораются по направлению (sweep):
 * стрелки — в свою сторону, палец — снизу вверх, какашка — по диагонали.
 */
type Sweep = "diag" | "ltr" | "rtl" | "btt";
export type Pixmap = { rows: string[]; sweep?: Sweep };

export const THUMB_UP: Pixmap = {
  sweep: "btt",
  rows: [
    "................",
    "................",
    "....XX..........",
    "...XXXX.........",
    "...XXXX.........",
    "...XXXX.........",
    "...XXXX.........",
    "...XXXXXXXX.....",
    "...XXXXXXXXX....",
    "...XXXXXXXXXX...",
    "...XXXXXXXXXX...",
    "...XX.......X...",
    "...XXXXXXXXXX...",
    "...XX.......X...",
    "....XXXXXXXX....",
    ".....XXXXXX.....",
  ],
};

export const POOP: Pixmap = {
  sweep: "diag",
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
  sweep: "ltr",
  rows: [
    "................",
    "........X.......",
    "........XX......",
    "........XXX.....",
    "........XXXX....",
    "........XXXXX...",
    "..XXXXXXXXXXXX..",
    "..XXXXXXXXXXXXX.",
    "..XXXXXXXXXXXXX.",
    "..XXXXXXXXXXXX..",
    "........XXXXX...",
    "........XXXX....",
    "........XXX.....",
    "........XX......",
    "........X.......",
    "................",
  ],
};

export const POINT_LEFT: Pixmap = {
  sweep: "rtl",
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
  const sweep: Sweep = art.sweep ?? "diag";
  const order = (x: number, y: number) =>
    sweep === "ltr" ? x : sweep === "rtl" ? w - 1 - x : sweep === "btt" ? h - 1 - y : x + y;
  const maxOrder = sweep === "diag" ? w - 1 + h - 1 : sweep === "btt" ? h - 1 : w - 1;
  const SPAN = 0.75; // за сколько секунд прокатывается волна загорания

  const cells: React.ReactNode[] = [];
  art.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const cx = x + 0.5;
      const cy = y + 0.5;
      if (row[x] === "X") {
        const style = animate
          ? { animationDelay: `${(order(x, y) / maxOrder) * SPAN}s` }
          : undefined;
        const cls = animate ? "led-dot" : undefined;
        cells.push(
          <circle key={`g${x}-${y}`} cx={cx} cy={cy} r={0.62} fill={color} opacity={0.2} className={cls} style={style} />,
          <circle key={`d${x}-${y}`} cx={cx} cy={cy} r={0.4} fill={color} className={cls} style={style} />
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

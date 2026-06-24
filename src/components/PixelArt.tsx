/**
 * Пиксель-арт иконки реакций кооп-загадки: палец вверх, какашка, рука влево/вправо.
 * Многоцветные битмапы (символ → цвет в палитре), рендер сеткой квадратов через SVG.
 */
export type Pixmap = { rows: string[]; palette: Record<string, string> };

const HAND: Record<string, string> = { X: "#F6C445", o: "#B5851F" };
const POO: Record<string, string> = { X: "#966335", d: "#5F3C18", w: "#FFFFFF", k: "#141414" };

export const THUMB_UP: Pixmap = {
  palette: HAND,
  rows: [
    "................",
    ".......XXX......",
    "......XXoXX.....",
    "......XXoXX.....",
    "......XXoXX.....",
    "...XXXXXoXXXX...",
    "..Xo........oX..",
    "..Xo.XXXXXX.oX..",
    "..Xo........oX..",
    "..Xo.XXXXXX.oX..",
    "..Xo........oX..",
    "..Xo.XXXXXX.oX..",
    "..XXo......ooX..",
    "...XXXXXXXXXX...",
    "....oooooooo....",
    "................",
  ],
};

export const POOP: Pixmap = {
  palette: POO,
  rows: [
    "................",
    ".......XX.......",
    "......XXXX......",
    ".....XXddXX.....",
    "....XXXXXXXX....",
    "...XXXXXXXXXX...",
    "..XXwwXXXXwwXX..",
    "..XXwkXXXXwkXX..",
    "..XXXXXXXXXXXX..",
    ".XXXXXXXXXXXXXX.",
    ".XXXkXXXXXXkXXX.",
    ".XXXXkkkkkkXXXX.",
    ".XXXXXXXXXXXXXX.",
    "XXXXXXXXXXXXXXXX",
    ".XXXXXXXXXXXXXX.",
    "................",
  ],
};

export const POINT_RIGHT: Pixmap = {
  palette: HAND,
  rows: [
    "................",
    "................",
    "....XXXXX.......",
    "...XoooooX......",
    "...XoooooXXXXX..",
    "...XooooooooooX.",
    "...XooooooooooX.",
    "...XoooooXXXXX..",
    "...XoooooX......",
    "...XoooooX......",
    "....XXXXX.......",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
};

export const POINT_LEFT: Pixmap = {
  palette: HAND,
  rows: POINT_RIGHT.rows.map((r) => [...r].reverse().join("")),
};

export const REACTION_ART: Record<string, Pixmap> = {
  up: THUMB_UP,
  poop: POOP,
  left: POINT_LEFT,
  right: POINT_RIGHT,
};

export default function PixelArt({ art, className }: { art: Pixmap; className?: string }) {
  const h = art.rows.length;
  const w = art.rows[0]?.length ?? 0;
  const cells: React.ReactNode[] = [];
  art.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = art.palette[row[x]];
      if (c) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={c} />);
    }
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} shapeRendering="crispEdges" aria-hidden focusable="false">
      {cells}
    </svg>
  );
}

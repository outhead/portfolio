/**
 * Пиксель-арт иконки реакций кооп-загадки (24×24, многоцветные):
 * палец вверх (с ноготком, манжетой и блёсткой), какашка с лицом и паром,
 * рука влево/вправо. Символ → цвет в палитре, рендер сеткой квадратов через SVG.
 */
export type Pixmap = { rows: string[]; palette: Record<string, string> };

const HAND: Record<string, string> = { X: "#F6C445", o: "#C69220", n: "#FFFFFF", b: "#3A6EA5" };
const POO: Record<string, string> = {
  X: "#A56C3A", m: "#784C26", d: "#4A2E14", l: "#C49460", w: "#FFFFFF", k: "#14100C", s: "#96C8FF",
};

export const THUMB_UP: Pixmap = {
  palette: HAND,
  rows: [
    "........................",
    "........................",
    "....................n...",
    ".........Xo.........n...",
    "........XXXo......nnnnn.",
    ".......oXnnXo.......n...",
    ".......oXXXXo.......n...",
    ".......oXXXXo...........",
    ".......oXXXXo...........",
    ".......oXXXXo...........",
    ".......oXXXooXXo........",
    ".......ooXooXXXXXo......",
    "......oXXooXXXXXXXo.....",
    "......oXoooooooooXo.....",
    ".....oXXXXXXXXXXXXXo....",
    ".....oXXXXXXXXXXXXXo....",
    ".....oXXoooooooooXXo....",
    ".....ooXXXXXXXXXXXoo....",
    "......oXXXXXXXXXXXo.....",
    "......ooooooooooooo.....",
    ".......bbbbbbbbbbb......",
    ".........bbbbbbb........",
    "........................",
    "........................",
  ],
};

export const POOP: Pixmap = {
  palette: POO,
  rows: [
    "........................",
    ".......s.......s........",
    ".........s.......s......",
    ".......s...ddd.s........",
    ".........sdXXXd..s......",
    "..........dXXXd.........",
    ".........ddlXXdd........",
    "........dlllllXXd.......",
    "........XlllllXXX.......",
    "........XXXlXXXXX.......",
    "........dwXXXXXwd.......",
    ".......dwwwllXwwwd......",
    "......dlwkwlllwkwXd.....",
    ".....dXXwkwllXwkwXXd....",
    ".....dXXXwXXXXXwXXXd....",
    "......dXkXXXXXXXkXd.....",
    ".....ddXkkXXXXXXkXdd....",
    "...ddXXllkkkkkkkXXXXdd..",
    "..ddXXXlllllXXXXXXXXXdd.",
    "..dXXXXXXXXXXXXXXXXXXXd.",
    "..ddmmmmmmmmmmmmmmmmmdd.",
    "...ddmmmmmmmmmmmmmmmdd..",
    ".....ddmmmmmmmmmmmdd....",
    ".......ddddddddddd......",
  ],
};

export const POINT_RIGHT: Pixmap = {
  palette: HAND,
  rows: [
    "........................",
    "........................",
    "........................",
    "........................",
    "........Xo..............",
    ".......XXXo.............",
    ".......XXXXo............",
    ".......XXXoo............",
    "......oXXooXo...........",
    ".....oXXXoXXXo..........",
    ".....oXXXXXXXooooooo....",
    "....oXXXXXXXXXXXXXXXX...",
    "....oXoooooooXXXXXXXoo..",
    "....oXXXXXXXXoXXXXXoo...",
    "....oXXXXXXXXXoooooo....",
    "....ooooooooXoo.........",
    ".....oXXXXXXXo..........",
    ".....ooXXXXXoo..........",
    "......ooooooo...........",
    "........ooo.............",
    "........................",
    "........................",
    "........................",
    "........................",
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

"use client";

import LedText from "@/components/LedText";
import { LedLines } from "@/components/LedBoard";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import QuestBackground from "@/components/QuestBackground";

// Игровое поле — решётка 5×5 (координаты 0..4).
// «Официальное» поле 3×3 — это центральные клетки (1..3, 1..3).
// Компьютер (нолики, O) ходит ТОЛЬКО внутри 3×3 и играет идеально —
// честно его не обыграть, максимум ничья. Единственная победа за крестики (X) —
// собрать три в ряд ЗА рамкой, куда компьютер «не ходит».

type Cell = "X" | "O";
type Marks = Record<string, Cell>;

const X_COLOR = "#FF4040"; // крестики — красные
const O_COLOR = "#A6FF00"; // нолики — зелёные
const WIN_COLOR = "#FFFFFF";

const innerCells: Array<[number, number]> = [
  [1, 1], [1, 2], [1, 3],
  [2, 1], [2, 2], [2, 3],
  [3, 1], [3, 2], [3, 3],
];

const lines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const key = (r: number, c: number) => `${r},${c}`;
const isInner = (r: number, c: number) => r >= 1 && r <= 3 && c >= 1 && c <= 3;
// Неравномерная решётка 5×5: тонкое кликабельное «кольцо» за рамкой (60px)
// и крупные внутренние клетки (100px) — чтобы сетка занимала больше кадра,
// а не тонула в пустом поле.
// Равномерная сетка 5×5 — одинаковый шаг между всеми клетками, поэтому
// крестики и снаружи стоят ровно на линии с тем же интервалом, что внутри.
const AXIS = [0, 100, 200, 300, 400]; // левые границы колонок/строк
const SIZE = [100, 100, 100, 100, 100]; // ширины/высоты клеток
const CC = [50, 150, 250, 350, 450]; // центры клеток
const BOX = 500;
const center = (r: number, c: number) => [CC[c], CC[r]] as const;

function innerBoard(marks: Marks): string[] {
  return innerCells.map(([r, c]) => marks[key(r, c)] || "");
}

function winnerInner(board: string[]): string | null {
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a];
  }
  return null;
}

function innerWinLine(marks: Marks): { who: Cell; cells: string[] } | null {
  const b = innerBoard(marks);
  for (const [a, bb, cc] of lines) {
    if (b[a] && b[a] === b[bb] && b[bb] === b[cc]) {
      return {
        who: b[a] as Cell,
        cells: [a, bb, cc].map((i) => key(innerCells[i][0], innerCells[i][1])),
      };
    }
  }
  return null;
}

// Минимакс: O максимизирует. O ходит первым и при таком оппоненте непобедим.
function minimax(
  board: string[],
  isO: boolean,
  depth = 0
): { score: number; idx?: number } {
  const w = winnerInner(board);
  // Взвешивание по глубине: немедленная победа ценнее отложенной,
  // поэтому O всегда забирает «три в ряд» сразу и не зевает выигрыш.
  if (w === "O") return { score: 10 - depth };
  if (w === "X") return { score: depth - 10 };
  if (board.every((x) => x !== "")) return { score: 0 };

  let best: { score: number; idx?: number } = isO
    ? { score: -Infinity }
    : { score: Infinity };

  for (let i = 0; i < 9; i++) {
    if (board[i] === "") {
      board[i] = isO ? "O" : "X";
      const res = minimax(board, !isO, depth + 1);
      board[i] = "";
      if (isO) {
        if (res.score > best.score) best = { score: res.score, idx: i };
      } else {
        if (res.score < best.score) best = { score: res.score, idx: i };
      }
    }
  }
  return best;
}

function bestMoveIdx(board: string[]): number {
  if (board.indexOf("") === -1) return -1;
  const m = minimax(board, true);
  return m.idx ?? -1;
}

const dirs: Array<[number, number]> = [
  [0, 1], [1, 0], [1, 1], [1, -1],
];

function humanWin(marks: Marks): string[] | null {
  for (let r = -1; r <= 5; r++) {
    for (let c = -1; c <= 5; c++) {
      if (marks[key(r, c)] !== "X") continue;
      for (const [dr, dc] of dirs) {
        if (
          marks[key(r + dr, c + dc)] === "X" &&
          marks[key(r + 2 * dr, c + 2 * dc)] === "X"
        ) {
          return [key(r, c), key(r + dr, c + dc), key(r + 2 * dr, c + 2 * dc)];
        }
      }
    }
  }
  return null;
}

const FIRST_MOVE: Marks = { "2,2": "O" };

// Прорисовка штрихом.
function useDrawn() {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return drawn;
}

function XMark({ cx, cy }: { cx: number; cy: number }) {
  const drawn = useDrawn();
  const s = 22;
  const len = Math.hypot(2 * s, 2 * s);
  const common = {
    stroke: X_COLOR,
    strokeWidth: 7,
    strokeLinecap: "round" as const,
    fill: "none",
  };
  return (
    <g style={{ pointerEvents: "none" }}>
      <line
        x1={cx - s} y1={cy - s} x2={cx + s} y2={cy + s}
        {...common}
        style={{ strokeDasharray: len, strokeDashoffset: drawn ? 0 : len, transition: "stroke-dashoffset .2s ease" }}
      />
      <line
        x1={cx + s} y1={cy - s} x2={cx - s} y2={cy + s}
        {...common}
        style={{ strokeDasharray: len, strokeDashoffset: drawn ? 0 : len, transition: "stroke-dashoffset .2s ease .19s" }}
      />
    </g>
  );
}

function OMark({ cx, cy }: { cx: number; cy: number }) {
  const drawn = useDrawn();
  const r = 22;
  const len = 2 * Math.PI * r;
  return (
    <circle
      cx={cx} cy={cy} r={r}
      stroke={O_COLOR} strokeWidth={7} fill="none"
      transform={`rotate(-90 ${cx} ${cy})`}
      style={{ strokeDasharray: len, strokeDashoffset: drawn ? 0 : len, transition: "stroke-dashoffset .34s ease", pointerEvents: "none" }}
    />
  );
}

function WinLine({ cells, color }: { cells: string[]; color: string }) {
  const drawn = useDrawn();
  const [r0, c0] = cells[0].split(",").map(Number);
  const [r2, c2] = cells[2].split(",").map(Number);
  let [x1, y1] = center(r0, c0);
  let [x2, y2] = center(r2, c2);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const ext = 30;
  x1 -= ux * ext; y1 -= uy * ext;
  x2 += ux * ext; y2 += uy * ext;
  const len = Math.hypot(x2 - x1, y2 - y1);
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color} strokeWidth={9} strokeLinecap="round"
      style={{ strokeDasharray: len, strokeDashoffset: drawn ? 0 : len, transition: "stroke-dashoffset .45s ease .12s", pointerEvents: "none" }}
    />
  );
}

// Салют — тот же canvas-confetti и лаймовая палитра, что и на остальном сайте.
function celebrate() {
  const colors = ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"];
  confetti({ particleCount: 120, spread: 100, startVelocity: 45, origin: { y: 0.62 }, colors, disableForReducedMotion: true });
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.25, y: 0.5 }, colors, disableForReducedMotion: true }), 220);
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.75, y: 0.5 }, colors, disableForReducedMotion: true }), 380);
  const end = Date.now() + 1100;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 55, startVelocity: 45, origin: { x: 0 }, colors, disableForReducedMotion: true });
    confetti({ particleCount: 5, angle: 120, spread: 55, startVelocity: 45, origin: { x: 1 }, colors, disableForReducedMotion: true });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

type Phase = "play" | "celebrate" | "score";

export default function SecretDalshePage() {
  const [marks, setMarks] = useState<Marks>(FIRST_MOVE);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [status, setStatus] = useState("");
  const [winLine, setWinLine] = useState<{ cells: string[]; color: string } | null>(null);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("play");
  const [lossCount, setLossCount] = useState(0); // число проигрышей/ничьих → эскалация подсказки «за рамкой»

  const startRef = useRef<number | null>(null);
  const compTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (compTimer.current) clearTimeout(compTimer.current);
      if (phaseTimer.current) clearTimeout(phaseTimer.current);
    };
  }, []);

  // После проигрыша/ничьи — намёк, что играть нужно не по правилам поля.
  // Считаем неудачи: 1-я → мягкий намёк, 2-я+ → прямая подсказка.
  const countedRef = useRef(false);
  useEffect(() => {
    if (over && !won && !countedRef.current) { countedRef.current = true; setLossCount((n) => n + 1); }
    if (!over) countedRef.current = false;
  }, [over, won]);

  function triggerWin(cells: string[]) {
    setOver(true);
    setWon(true);
    setWinLine({ cells, color: WIN_COLOR });
    setStatus("Победа");
    setPhase("celebrate");
    celebrate();
    phaseTimer.current = setTimeout(() => setPhase("score"), 1500);
  }

  function handleClick(r: number, c: number) {
    if (over || thinking) return;
    const k = key(r, c);
    if (marks[k]) return;

    if (startRef.current === null) startRef.current = Date.now();

    const next: Marks = { ...marks, [k]: "X" };
    setMarks(next);

    const hw = humanWin(next);
    if (hw) {
      triggerWin(hw);
      return;
    }

    // Ход за рамкой компьютер не «видит» (он заперт в поле 3×3) — не отвечает.
    if (!isInner(r, c)) return;

    if (innerBoard(next).indexOf("") === -1) {
      setOver(true);
      setStatus("Ничья");
      return;
    }

    setStatus("");
    setThinking(true);
    compTimer.current = setTimeout(() => {
      const idx = bestMoveIdx(innerBoard(next));
      let after = next;
      if (idx >= 0) {
        const [or, oc] = innerCells[idx];
        after = { ...next, [key(or, oc)]: "O" };
      }
      setMarks(after);
      setThinking(false);

      const wl = innerWinLine(after);
      if (wl && wl.who === "O") {
        setOver(true);
        setStatus("Компьютер выиграл.");
        setWinLine({ cells: wl.cells, color: WIN_COLOR });
      } else if (innerBoard(after).indexOf("") === -1) {
        setOver(true);
        setStatus("Ничья");
      }
    }, 520);
  }

  function reset() {
    if (compTimer.current) clearTimeout(compTimer.current);
    if (phaseTimer.current) clearTimeout(phaseTimer.current);
    startRef.current = null;
    setMarks({ ...FIRST_MOVE });
    setOver(false);
    setWon(false);
    setThinking(false);
    setWinLine(null);
    setStatus("");
    setRound((x) => x + 1);
    setPhase("play");
  }

  const board = (
    <div className="mx-auto" style={{ width: "min(90vw, 52vh, 460px)" }}>
      <svg
        viewBox={`0 0 ${BOX} ${BOX}`}
        style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
        role="img"
        aria-label="Игровое поле крестики-нолики"
      >
        {Array.from({ length: 25 }).map((_, i) => {
          const r = Math.floor(i / 5);
          const c = i % 5;
          return (
            <rect
              key={`hit-${r}-${c}`}
              x={AXIS[c]} y={AXIS[r]} width={SIZE[c]} height={SIZE[r]}
              fill="transparent"
              style={{ cursor: over || thinking ? "default" : "pointer" }}
              onClick={() => handleClick(r, c)}
            />
          );
        })}

        <g stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeLinecap="round" style={{ pointerEvents: "none" }}>
          <line x1={200} y1={100} x2={200} y2={400} vectorEffect="non-scaling-stroke" />
          <line x1={300} y1={100} x2={300} y2={400} vectorEffect="non-scaling-stroke" />
          <line x1={100} y1={200} x2={400} y2={200} vectorEffect="non-scaling-stroke" />
          <line x1={100} y1={300} x2={400} y2={300} vectorEffect="non-scaling-stroke" />
        </g>

        <g style={{ opacity: winLine ? 0.28 : 1, transition: "opacity .4s ease" }}>
          {Object.entries(marks).map(([k, v]) => {
            const [r, c] = k.split(",").map(Number);
            const [cx, cy] = center(r, c);
            return v === "X" ? (
              <XMark key={`${round}-${k}`} cx={cx} cy={cy} />
            ) : (
              <OMark key={`${round}-${k}`} cx={cx} cy={cy} />
            );
          })}
        </g>

        {winLine ? <WinLine key={`wl-${round}`} cells={winLine.cells} color={winLine.color} /> : null}
      </svg>
    </div>
  );

  return (
    <main
      className="relative bg-black text-white overflow-y-auto flex flex-col"
      style={{ minHeight: "100dvh" }}
    >
      <QuestBackground palette="green" />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(166,255,0,0.08), transparent 60%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(201,166,107,0.08), transparent 70%)",
        }}
      />

      <section className="relative z-[1] w-full flex flex-col items-center px-5 pt-[88px] pb-16">
        {phase === "score" ? (
          /* ─── Экран победы с таблицей лидеров ─── */
          <div className="w-full max-w-[420px] mx-auto flex flex-col items-center text-center">
            <h1 className="text-[#A6FF00] mb-8">
              <LedLines text="Победа" center maxChars={20} lineClass="h-[26px] md:h-[38px]" />
            </h1>

            <p className="text-sm md:text-[15px] text-white/60 mb-8 max-w-xs">
              Ты выиграл там, где выиграть нельзя. Дальше — сложнее.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/secret/dalshe2"
                data-ym-goal="quest2_solved"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] hover:bg-[#A6FF00] hover:text-black transition-colors no-underline"
              >
                <span className="sr-only">Следующая загадка</span><LedText text="Следующая загадка" className="h-[10px] w-auto" />
                <LedText text="→" className="h-[11px] w-auto" />
              </Link>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-colors"
              >
                <span className="sr-only">Сыграть снова</span><LedText text="Сыграть снова" className="h-[10px] w-auto" />
              </button>
            </div>
          </div>
        ) : (
          /* ─── Игра (ход / момент победы) ─── */
          <div className="w-full max-w-[460px] mx-auto flex flex-col items-center text-center">
            <p className="text-white/40 mb-3">
              <span className="sr-only">Крестики-нолики · Загадка №2</span>
              <LedText text="Крестики-нолики · Загадка №2" className="h-[9px] w-auto" />
            </p>

            {phase === "celebrate" ? (
              <>
                <h1 className="text-[#A6FF00] mb-6">
                  <LedLines text="Победа" center maxChars={20} lineClass="h-[26px] md:h-[38px]" />
                </h1>
                {board}
              </>
            ) : (
              <>
                {/* Шапка фикс-высоты (плашка №2 — снаружи) → поле на одной высоте с L2/L3 */}
                <div className="flex flex-col items-center" style={{ minHeight: "clamp(78px, 12vw, 118px)" }}>
                  <h1 className="mb-3">
                    <LedLines text="Обыграй компьютер" center maxChars={20} lineClass="h-[17px] md:h-[24px]" />
                  </h1>
                  <p className="text-[13px] md:text-sm text-white/55 leading-relaxed max-w-sm">
                    Компьютер ходит первым и не любит проигрывать.
                  </p>
                </div>
                {board}
                {status ? (
                  <p className={`mt-5 text-sm md:text-[15px] ${won ? "text-[#A6FF00]" : "text-white/70"}`}>
                    {status}
                  </p>
                ) : null}
                {lossCount > 0 && !won ? (
                  <p className="mt-3 text-[13px] md:text-sm text-[#C9A66B]/90 max-w-xs">
                    {lossCount >= 2
                      ? "Поле не заканчивается на рамке. Кликни по клеткам снаружи и собери ряд там."
                      : "Честно его не обыграть. Мысли «out of the box»."}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={reset}
                  className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-colors"
                >
                  <span className="sr-only">{over ? "Повторить" : "Начать заново"}</span>
                  <LedText text={over ? "Повторить" : "Начать заново"} className="h-[10px] w-auto" />
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

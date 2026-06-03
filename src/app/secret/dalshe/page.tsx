"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

// Игровое поле — решётка 5×5 (координаты 0..4).
// «Официальное» поле 3×3 — это центральные клетки (1..3, 1..3).
// Компьютер (нолики, O) ходит ТОЛЬКО внутри 3×3 и играет идеально —
// честно его не обыграть, максимум ничья. Единственная победа за крестики (X) —
// собрать три в ряд ЗА рамкой, куда компьютер «не ходит».

type Cell = "X" | "O";
type Marks = Record<string, Cell>;
type LbEntry = { name: string; timeMs: number; at: number };

const X_COLOR = "#A6FF00";
const O_COLOR = "#C9A66B";
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

// Дата и время разгадки — для таблицы «кто разгадал первым».
function formatDateTime(ms: number): string {
  try {
    return new Date(ms).toLocaleString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// Общий лидерборд — Supabase (PostgREST) по публичному anon-ключу + RLS.
// Сайт статический (output: "export"), поэтому пишем прямо из браузера.
// Если env не задан или Supabase недоступен — фолбэк на localStorage,
// чтобы флоу работал и без бэкенда.
const LB_KEY = "secret_dalshe_leaderboard_v1";
// Публичный anon-ключ Supabase — по дизайну безопасен в браузере (доступ ограничен
// политиками RLS: читать всем, вставлять валидную запись, править/удалять нельзя).
// env имеет приоритет, если когда-нибудь захочется переопределить.
const SB_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hvkygaghhxgaolxemndr.supabase.co";
const SB_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a3lnYWdoaHhnYW9seGVtbmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDYwNjAsImV4cCI6MjA5NDg4MjA2MH0.IoRNKO3Jb51k1XA2y7-Q-PSaxpPhBj56G1SZJaKKau4";
const hasSupabase = Boolean(SB_URL && SB_KEY);
const SB_TABLE = "leaderboard";

type SbRow = { name: string; time_ms: number; created_at: string };
const rowToEntry = (r: SbRow): LbEntry => ({
  name: r.name,
  timeMs: r.time_ms,
  at: Date.parse(r.created_at) || 0,
});

function loadLocal(): LbEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LB_KEY);
    const arr = raw ? (JSON.parse(raw) as LbEntry[]) : [];
    if (!Array.isArray(arr)) return [];
    return [...arr].sort((a, b) => a.at - b.at).slice(0, 10);
  } catch {
    return [];
  }
}

function saveLocal(entry: LbEntry): LbEntry[] {
  if (typeof window === "undefined") return [entry];
  try {
    const raw = window.localStorage.getItem(LB_KEY);
    const arr = raw ? (JSON.parse(raw) as LbEntry[]) : [];
    const next = [...(Array.isArray(arr) ? arr : []), entry]
      .sort((a, b) => a.at - b.at)
      .slice(0, 50);
    window.localStorage.setItem(LB_KEY, JSON.stringify(next));
    return next.slice(0, 10);
  } catch {
    return [entry];
  }
}

async function loadBoard(): Promise<LbEntry[]> {
  if (!hasSupabase) return loadLocal();
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/${SB_TABLE}?select=name,time_ms,created_at&order=created_at.asc&limit=10`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: "no-store" }
    );
    if (!res.ok) throw new Error("sb");
    const rows = (await res.json()) as SbRow[];
    return rows.map(rowToEntry);
  } catch {
    return loadLocal();
  }
}

async function saveScore(
  entry: LbEntry
): Promise<{ entries: LbEntry[]; atKey: number }> {
  if (!hasSupabase) return { entries: saveLocal(entry), atKey: entry.at };
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${SB_TABLE}`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ name: entry.name, time_ms: entry.timeMs }),
    });
    if (!res.ok) throw new Error("sb");
    const inserted = (await res.json()) as SbRow[];
    const atKey = inserted[0]?.created_at
      ? Date.parse(inserted[0].created_at)
      : entry.at;
    return { entries: await loadBoard(), atKey };
  } catch {
    return { entries: saveLocal(entry), atKey: entry.at };
  }
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
  const [winMs, setWinMs] = useState<number | null>(null);

  // Лидерборд
  const [entries, setEntries] = useState<LbEntry[]>([]);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [youAt, setYouAt] = useState<number | null>(null);

  const startRef = useRef<number | null>(null);
  const compTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (compTimer.current) clearTimeout(compTimer.current);
      if (phaseTimer.current) clearTimeout(phaseTimer.current);
    };
  }, []);

  function triggerWin(cells: string[]) {
    const ms = Date.now() - (startRef.current ?? Date.now());
    setWinMs(ms);
    setOver(true);
    setWon(true);
    setWinLine({ cells, color: WIN_COLOR });
    setStatus("Победа");
    setPhase("celebrate");
    celebrate();
    loadBoard().then(setEntries);
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

  async function submitScore() {
    if (submitting || submitted || winMs == null) return;
    setSubmitting(true);
    const entry: LbEntry = {
      name: (name.trim() || "Гость").slice(0, 20),
      timeMs: winMs,
      at: Date.now(),
    };
    const { entries: top, atKey } = await saveScore(entry);
    setEntries(top);
    setYouAt(atKey);
    setSubmitted(true);
    setSubmitting(false);
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
    setWinMs(null);
    setName("");
    setSubmitting(false);
    setSubmitted(false);
    setYouAt(null);
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

        <g stroke="rgba(255,255,255,0.22)" strokeWidth={3} strokeLinecap="round" style={{ pointerEvents: "none" }}>
          <line x1={200} y1={100} x2={200} y2={400} />
          <line x1={300} y1={100} x2={300} y2={400} />
          <line x1={100} y1={200} x2={400} y2={200} />
          <line x1={100} y1={300} x2={400} y2={300} />
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
      className="relative bg-black text-white overflow-hidden flex flex-col"
      style={{ minHeight: "100dvh" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(166,255,0,0.08), transparent 60%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(201,166,107,0.08), transparent 70%)",
        }}
      />

      <section className="relative z-[1] flex-1 flex items-start justify-center px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] pt-[88px] pb-12">
        {phase === "score" ? (
          /* ─── Экран победы с таблицей лидеров ─── */
          <div className="w-full max-w-[420px] mx-auto flex flex-col items-center text-center">
            <h1 className="font-p95 leading-none uppercase tracking-tight text-[#A6FF00] mb-8" style={{ fontSize: "clamp(44px, 12vw, 80px)" }}>
              Победа
            </h1>

            {!submitted ? (
              <div className="w-full flex flex-col sm:flex-row items-stretch gap-2.5 mb-8">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitScore();
                  }}
                  maxLength={20}
                  placeholder="Твоё имя"
                  aria-label="Твоё имя для таблицы лидеров"
                  className="flex-1 bg-white/[0.06] border border-white/15 rounded-full px-5 py-3 text-[15px] text-white text-center sm:text-left placeholder:text-white/35 outline-none focus:border-[#A6FF00]/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={submitScore}
                  disabled={submitting}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[14px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors disabled:opacity-50"
                >
                  <span className="leading-none translate-y-[1px]">
                    {submitting ? "..." : "Отправить"}
                  </span>
                </button>
              </div>
            ) : null}

            {entries.length > 0 ? (
              <div className="w-full max-w-[360px] mx-auto mb-8">
                <p className="font-p95 text-[11px] tracking-[0.25em] uppercase text-white/35 mb-3 text-center">
                  Кто разгадал первым
                </p>
                <ol className="text-left">
                  {entries.map((e, i) => {
                    const mine = youAt != null && e.at === youAt;
                    return (
                      <li
                        key={`${e.at}-${i}`}
                        className={`flex items-center gap-3 py-2 border-b border-white/[0.05] ${
                          mine ? "text-[#A6FF00]" : "text-white/80"
                        }`}
                      >
                        <span className="font-p95 tabular-nums text-[13px] w-5 text-white/35">
                          {i + 1}
                        </span>
                        <span className="flex-1 text-[15px] truncate">{e.name}</span>
                        <span className="text-[12px] text-white/45 whitespace-nowrap">
                          {formatDateTime(e.at)}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : !submitted ? (
              <p className="text-sm text-white/40 mb-8">Разгадай первым.</p>
            ) : null}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/secret/lovi"
                data-ym-goal="quest2_solved"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[14px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors no-underline"
              >
                <span className="leading-none translate-y-[1px]">Следующая загадка</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
              </Link>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/70 font-p95 text-[14px] tracking-[0.12em] uppercase hover:border-white/40 hover:text-white transition-colors"
              >
                <span className="leading-none translate-y-[1px]">Сыграть снова</span>
              </button>
            </div>

            <p className="mt-6 text-[13px] text-white/45">
              Спасибо, что доиграл. Третья загадка уже ждёт.
            </p>
            <Link
              href="/"
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors no-underline"
            >
              <ArrowLeft className="w-3 h-3" strokeWidth={2.2} />
              На главную
            </Link>
          </div>
        ) : (
          /* ─── Игра (ход / момент победы) ─── */
          <div className="w-full max-w-[440px] mx-auto flex flex-col items-center text-center">
            <p className="font-p95 text-[12px] md:text-[13px] tracking-[0.25em] uppercase text-white/40 mb-3">
              Крестики-нолики · Загадка №2
            </p>

            {phase === "celebrate" ? (
              <>
                <h1 className="font-p95 leading-[0.95] uppercase tracking-tight text-[#A6FF00] mb-6" style={{ fontSize: "clamp(34px, 7vw, 56px)" }}>
                  Победа
                </h1>
                {board}
              </>
            ) : (
              <>
                <h1 className="font-p95 leading-[0.95] uppercase tracking-tight mb-3" style={{ fontSize: "clamp(30px, 5vw, 52px)" }}>
                  Обыграй компьютер
                </h1>
                <p className="text-[13px] md:text-sm text-white/55 leading-relaxed max-w-md mb-4">
                  Играешь за крестики
                  <br />
                  Собери три в ряд или по диагонали
                  <br />
                  Компьютер ходит первым и не любит проигрывать
                </p>
                {board}
                {status ? (
                  <p className={`mt-5 text-sm md:text-[15px] ${won ? "text-[#A6FF00]" : "text-white/70"}`}>
                    {status}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={reset}
                  className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/70 font-p95 text-[14px] md:text-[15px] tracking-[0.12em] uppercase hover:border-white/40 hover:text-white transition-colors"
                >
                  <span className="leading-none translate-y-[1px]">
                    {over ? "Повторить" : "Начать заново"}
                  </span>
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

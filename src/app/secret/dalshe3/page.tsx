"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";

/**
 * Крестики L3 — «Этого не достаточно».
 * Начинается как обычная игра: нолик первый в центр, играешь X против идеального
 * минимакса, без подсказок, сетка без граней. Над полем — фраза «ЭТОГО НЕ ДОСТАТОЧНО»
 * («не» обычным словом). Подвох: любую фигуру можно перетаскивать — и если перетащить
 * свой X на слово «не», условие меняется на «достаточно» → открывается терминал с кодом.
 */
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
type M = "" | "X" | "O";
const win9 = (b: M[]): M | null => {
  for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[c] === b[d]) return b[a];
  return null;
};
function minimax(b: M[], isO: boolean, depth = 0): { s: number; i?: number } {
  const w = win9(b);
  if (w === "O") return { s: 10 - depth };
  if (w === "X") return { s: depth - 10 };
  if (b.every((x) => x)) return { s: 0 };
  let best: { s: number; i?: number } = isO ? { s: -1e9 } : { s: 1e9 };
  for (let i = 0; i < 9; i++) {
    if (!b[i]) {
      b[i] = isO ? "O" : "X";
      const r = minimax(b, !isO, depth + 1);
      b[i] = "";
      if (isO ? r.s > best.s : r.s < best.s) best = { s: r.s, i };
    }
  }
  return best;
}
const START = (): M[] => { const b: M[] = ["", "", "", "", "", "", "", "", ""]; b[4] = "O"; return b; };

function celebrate() {
  const colors = ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"];
  confetti({ particleCount: 130, spread: 110, startVelocity: 45, origin: { y: 0.6 }, colors, disableForReducedMotion: true });
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.25, y: 0.5 }, colors, disableForReducedMotion: true }), 200);
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.75, y: 0.5 }, colors, disableForReducedMotion: true }), 360);
}

export default function Dalshe3() {
  const [marks, setMarks] = useState<M[]>(START);
  const [solved, setSolved] = useState(false);
  const [thinking, setThinking] = useState(false);

  const [dragId, setDragId] = useState<number | null>(null);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ px: number; py: number } | null>(null);
  const moved = useRef(false);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const neRef = useRef<HTMLSpanElement>(null);
  const compTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (compTimer.current) clearTimeout(compTimer.current); }, []);

  const place = (i: number) => {
    if (solved || thinking || marks[i]) return;
    const next = [...marks]; next[i] = "X"; setMarks(next);
    if (win9(next) || next.every((x) => x)) return;
    setThinking(true);
    compTimer.current = setTimeout(() => {
      const mv = minimax([...next], true);
      const after = [...next];
      if (mv.i != null) after[mv.i] = "O";
      setMarks(after);
      setThinking(false);
    }, 460);
  };

  const onDown = (i: number) => (e: React.PointerEvent) => {
    if (solved || !marks[i]) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragId(i); setOff({ x: 0, y: 0 }); moved.current = false;
    dragStart.current = { px: e.clientX, py: e.clientY };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragStart.current || dragId === null) return;
    const dx = e.clientX - dragStart.current.px, dy = e.clientY - dragStart.current.py;
    if (Math.hypot(dx, dy) > 4) moved.current = true;
    setOff({ x: dx, y: dy });
  };
  const onUp = (e: React.PointerEvent) => {
    if (dragStart.current === null || dragId === null) return;
    const from = dragId;
    const wasMoved = moved.current;
    const draggedVal = marks[from];
    dragStart.current = null; setDragId(null); setOff({ x: 0, y: 0 });
    if (!wasMoved) return;

    // перетащили X на слово «не»?
    if (draggedVal === "X") {
      const ne = neRef.current?.getBoundingClientRect();
      if (ne) {
        const pad = 18;
        if (e.clientX > ne.left - pad && e.clientX < ne.right + pad && e.clientY > ne.top - pad && e.clientY < ne.bottom + pad) {
          setMarks((p) => { const n = [...p]; n[from] = ""; return n; });
          setSolved(true); celebrate(); return;
        }
      }
    }
    // иначе — переставить по ячейкам / за край
    const m = 40;
    const offscreen = e.clientX < m || e.clientX > window.innerWidth - m || e.clientY < m || e.clientY > window.innerHeight - m;
    setMarks((prev) => {
      const next = [...prev];
      if (offscreen) { next[from] = ""; return next; }
      let target: number | null = null;
      cellRefs.current.forEach((el, idx) => {
        if (!el) return; const r = el.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) target = idx;
      });
      if (target === null || target === from || next[target]) return prev;
      next[target] = next[from]; next[from] = "";
      return next;
    });
  };

  const reset = () => {
    if (compTimer.current) clearTimeout(compTimer.current);
    setMarks(START()); setSolved(false); setThinking(false); setDragId(null); setOff({ x: 0, y: 0 });
  };

  const S = "min(18vw, 10.4vh, 92px)";
  const cell = (i: number) => {
    const v = marks[i];
    const active = dragId === i;
    return (
      <div
        key={i}
        ref={(el) => { cellRefs.current[i] = el; }}
        onClick={() => { if (!v && !moved.current) place(i); }}
        className="relative flex items-center justify-center"
        style={{ width: S, height: S, cursor: v ? "default" : solved || thinking ? "default" : "pointer" }}
      >
        {v && (
          <div
            onPointerDown={onDown(i)}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="touch-none cursor-grab active:cursor-grabbing select-none font-p95"
            style={{
              fontSize: "clamp(38px, 11vw, 56px)", lineHeight: 1,
              color: v === "X" ? "#FF4040" : "#A6FF00",
              transform: active ? `translate(${off.x}px, ${off.y}px)` : "none",
              transition: active ? "none" : "transform .15s ease",
              zIndex: active ? 30 : 1,
              filter: v === "X" ? "drop-shadow(0 0 10px rgba(255,64,64,0.5))" : "drop-shadow(0 0 9px rgba(166,255,0,0.4))",
            }}
          >
            {v === "X" ? "✕" : "◯"}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="relative bg-black text-white overflow-y-auto grid place-items-center px-5 py-24" style={{ minHeight: "100dvh" }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 55% 45% at 50% 38%, rgba(166,255,0,0.07), transparent 60%)",
      }} />

      {!solved ? (
        <div className="relative z-[1] w-full max-w-[480px] mx-auto flex flex-col items-center text-center">
          <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-5">Крестики-нолики · Загадка №2</p>

          <h1 className="font-p95 leading-[1.05] uppercase tracking-tight mb-10" style={{ fontSize: "clamp(26px, 5vw, 48px)" }}>
            Этого <span ref={neRef}>не</span> достаточно
          </h1>

          <div className="relative" style={{ width: `calc(${S} * 3)`, height: `calc(${S} * 3)` }}>
            <div className="grid" style={{ gridTemplateColumns: `repeat(3, ${S})`, gridTemplateRows: `repeat(3, ${S})` }}>
              {Array.from({ length: 9 }).map((_, i) => cell(i))}
            </div>
            <div aria-hidden className="absolute top-0 bottom-0 bg-white/20" style={{ left: `calc(${S} - 1px)`, width: 2 }} />
            <div aria-hidden className="absolute top-0 bottom-0 bg-white/20" style={{ left: `calc(${S} * 2 - 1px)`, width: 2 }} />
            <div aria-hidden className="absolute left-0 right-0 bg-white/20" style={{ top: `calc(${S} - 1px)`, height: 2 }} />
            <div aria-hidden className="absolute left-0 right-0 bg-white/20" style={{ top: `calc(${S} * 2 - 1px)`, height: 2 }} />
          </div>

          <button type="button" onClick={reset}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/70 font-p95 text-[14px] tracking-[0.12em] uppercase hover:border-white/40 hover:text-white transition-colors">
            <span className="leading-none translate-y-[1px]">Начать заново</span>
          </button>
        </div>
      ) : (
        <div className="relative z-[1] w-full max-w-[420px] mx-auto flex flex-col items-center text-center">
          <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-4">Этого достаточно</p>
          <h1 className="font-p95 leading-none uppercase tracking-tight text-[#A6FF00] mb-5" style={{ fontSize: "clamp(36px, 10vw, 68px)" }}>
            Достаточно
          </h1>
          <p className="text-sm text-white/60 mb-8 max-w-xs">Ты закрыл «не» — и условие сменилось.</p>
          <Link href="/secret/lab/kod" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[14px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors no-underline">
            <span className="leading-none translate-y-[1px]">К терминалу</span><span className="leading-none">→</span>
          </Link>
          <Link href="/" className="mt-5 inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors no-underline">
            <ArrowLeft className="w-3 h-3" strokeWidth={2.2} /> На главную
          </Link>
        </div>
      )}
    </main>
  );
}

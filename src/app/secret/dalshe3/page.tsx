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
  const [lost, setLost] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [hint, setHint] = useState(false);
  const [hint2, setHint2] = useState(false);
  const over = solved || lost;

  useEffect(() => {
    const t = setTimeout(() => setHint(true), 8000);
    const t2 = setTimeout(() => setHint2(true), 18000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  const [dragId, setDragId] = useState<number | null>(null);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ px: number; py: number } | null>(null);
  const moved = useRef(false);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const neRef = useRef<HTMLSpanElement>(null);
  const compTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (compTimer.current) clearTimeout(compTimer.current); }, []);

  // победа компьютера (3 O) = проигрыш
  useEffect(() => {
    if (over) return;
    if (win9(marks) === "O") setLost(true);
  }, [marks, over]);

  const place = (i: number) => {
    if (over || thinking || marks[i]) return;
    setMarks((prev) => { const n = [...prev]; n[i] = "X"; return n; });
    setThinking(true);
    compTimer.current = setTimeout(() => {
      setMarks((prev) => {
        if (win9(prev) || prev.every((x) => x)) return prev;
        const mv = minimax([...prev], true);
        const after = [...prev];
        if (mv.i != null) after[mv.i] = "O";
        return after;
      });
      setThinking(false);
    }, 460);
  };

  const onDown = (i: number) => (e: React.PointerEvent) => {
    if (over || thinking || !marks[i]) return;
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
    setMarks(START()); setSolved(false); setLost(false); setThinking(false); setDragId(null); setOff({ x: 0, y: 0 });
  };

  const S = "min(18vw, 10.4vh, 92px)";
  const cell = (i: number) => {
    const v = marks[i];
    const active = dragId === i;
    return (
      <div
        key={i}
        ref={(el) => { cellRefs.current[i] = el; }}
        onClick={() => { if (moved.current) { moved.current = false; return; } if (!v) place(i); }}
        className="relative flex items-center justify-center"
        style={{ width: S, height: S, cursor: v ? "default" : over || thinking ? "default" : "pointer" }}
      >
        {v && (
          <div
            onPointerDown={onDown(i)}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="touch-none cursor-grab active:cursor-grabbing select-none"
            style={{
              width: "100%", height: "100%",
              transform: active ? `translate(${off.x}px, ${off.y}px)` : "none",
              transition: active ? "none" : "transform .15s ease",
              zIndex: active ? 30 : 1,
              filter: v === "X" ? "drop-shadow(0 0 8px rgba(255,64,64,0.5))" : "drop-shadow(0 0 8px rgba(166,255,0,0.4))",
            }}
          >
            <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: "block", pointerEvents: "none" }} aria-hidden>
              {v === "X" ? (
                <g stroke="#FF4040" strokeWidth={7} strokeLinecap="round" fill="none">
                  <line x1={28} y1={28} x2={72} y2={72} />
                  <line x1={72} y1={28} x2={28} y2={72} />
                </g>
              ) : (
                <circle cx={50} cy={50} r={22} stroke="#A6FF00" strokeWidth={7} fill="none" />
              )}
            </svg>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="relative bg-black text-white overflow-y-auto flex flex-col items-center px-5 pt-[88px] pb-16" style={{ minHeight: "100dvh" }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 55% 45% at 50% 38%, rgba(166,255,0,0.07), transparent 60%)",
      }} />

      {!solved ? (
        <div className="relative z-[1] w-full max-w-[460px] mx-auto flex flex-col items-center text-center">
          {/* Шапка фикс-высоты — одна высота поля во всех уровнях */}
          <div className="flex flex-col items-center justify-center" style={{ minHeight: "clamp(150px, 22vw, 200px)" }}>
            <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-3">Крестики-нолики · Загадка №4</p>
            <h1 className="font-p95 leading-[1.05] uppercase tracking-tight" style={{ fontSize: "clamp(26px, 5vw, 46px)" }}>
              Это <span ref={neRef}>не</span> решение
            </h1>
          </div>

          <div className="relative" style={{ width: `calc(${S} * 3)`, height: `calc(${S} * 3)` }}>
            <div className="grid" style={{ gridTemplateColumns: `repeat(3, ${S})`, gridTemplateRows: `repeat(3, ${S})` }}>
              {Array.from({ length: 9 }).map((_, i) => cell(i))}
            </div>
            <div aria-hidden className="absolute top-0 bottom-0 bg-white/20" style={{ left: `calc(${S} - 1px)`, width: 2 }} />
            <div aria-hidden className="absolute top-0 bottom-0 bg-white/20" style={{ left: `calc(${S} * 2 - 1px)`, width: 2 }} />
            <div aria-hidden className="absolute left-0 right-0 bg-white/20" style={{ top: `calc(${S} - 1px)`, height: 2 }} />
            <div aria-hidden className="absolute left-0 right-0 bg-white/20" style={{ top: `calc(${S} * 2 - 1px)`, height: 2 }} />
          </div>

          {lost ? (
            <p className="mt-5 text-sm text-[#C9A66B]">Компьютер собрал свою линию. Начни заново.</p>
          ) : null}

          <p className="mt-5 text-[13px] text-[#C9A66B]/85 max-w-xs transition-opacity duration-700" style={{ opacity: hint && !over ? 1 : 0 }}>
            {hint2
              ? "Фигуры можно перетаскивать. Перетащи крестик прямо на слово «не»."
              : "А кто сказал, что играть надо по правилам? Условие можно изменить."}
          </p>

          <button type="button" onClick={reset}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/70 font-p95 text-[14px] tracking-[0.12em] uppercase hover:border-white/40 hover:text-white transition-colors">
            <span className="leading-none translate-y-[1px]">Начать заново</span>
          </button>
        </div>
      ) : (
        <div className="relative z-[1] w-full max-w-[420px] mx-auto flex flex-col items-center text-center">
          <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-4">Это решение</p>
          <h1 className="font-p95 leading-none uppercase tracking-tight text-[#A6FF00] mb-5" style={{ fontSize: "clamp(36px, 10vw, 68px)" }}>
            Решение
          </h1>
          <p className="text-sm text-white/60 mb-8 max-w-xs">Ты убрал «не» — и это стало решением.</p>
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

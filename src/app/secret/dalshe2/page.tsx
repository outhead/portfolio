"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";

/**
 * Крестики L2 — «Переставь его фигуры».
 * Поле 3×3 с крестиками (X) компьютера. Кликами не сыграть, за рамкой — нельзя.
 * Подвох: можно ПЕРЕТАСКИВАТЬ X компьютера в другие ячейки (и за экран). Цель —
 * собрать 3 X в ряд / по диагонали, физически переставив его же фигуры.
 */
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
const START: (string | null)[] = [null, "X", null, null, null, "X", "X", null, null]; // не линия

function celebrate() {
  const colors = ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"];
  confetti({ particleCount: 120, spread: 100, startVelocity: 45, origin: { y: 0.62 }, colors, disableForReducedMotion: true });
  setTimeout(() => confetti({ particleCount: 70, spread: 120, origin: { x: 0.25, y: 0.5 }, colors, disableForReducedMotion: true }), 200);
  setTimeout(() => confetti({ particleCount: 70, spread: 120, origin: { x: 0.75, y: 0.5 }, colors, disableForReducedMotion: true }), 360);
}
const winner = (m: (string | null)[]) => LINES.some(([a, b, c]) => m[a] && m[a] === m[b] && m[b] === m[c]);
const countX = (m: (string | null)[]) => m.filter((x) => x === "X").length;

export default function Dalshe2() {
  const [marks, setMarks] = useState<(string | null)[]>(START);
  const [won, setWon] = useState(false);
  const [hint, setHint] = useState(false);

  const [dragId, setDragId] = useState<number | null>(null);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const startRef = useRef<{ px: number; py: number } | null>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setHint(true), 8000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (winner(marks) && !won) {
      setWon(true);
      celebrate();
    }
  }, [marks, won]);

  const onDown = (i: number) => (e: React.PointerEvent) => {
    if (won || marks[i] !== "X") return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragId(i);
    setOff({ x: 0, y: 0 });
    startRef.current = { px: e.clientX, py: e.clientY };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!startRef.current || dragId === null) return;
    setOff({ x: e.clientX - startRef.current.px, y: e.clientY - startRef.current.py });
  };
  const onUp = (e: React.PointerEvent) => {
    if (!startRef.current || dragId === null) { return; }
    const from = dragId;
    startRef.current = null;
    setDragId(null);
    setOff({ x: 0, y: 0 });

    const m = 40;
    const offscreen = e.clientX < m || e.clientX > window.innerWidth - m || e.clientY < m || e.clientY > window.innerHeight - m;

    setMarks((prev) => {
      const next = [...prev];
      if (offscreen) {
        next[from] = null;
      } else {
        // в какую ячейку отпустили
        let target: number | null = null;
        cellRefs.current.forEach((el, idx) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) target = idx;
        });
        if (target === null) return prev; // мимо поля — снап назад
        if (target !== from && next[target] !== null) return prev; // занято — снап назад
        next[from] = null;
        next[target] = "X";
      }
      // компьютер подкидывает X, если их стало меньше трёх (всегда есть из чего собрать)
      if (countX(next) < 3 && !winner(next)) {
        const empties = next.map((v, idx) => (v === null ? idx : -1)).filter((idx) => idx >= 0);
        if (empties.length) next[empties[(Math.random() * empties.length) | 0]] = "X";
      }
      return next;
    });
  };

  const reset = () => { setMarks(START); setWon(false); setDragId(null); setOff({ x: 0, y: 0 }); };

  const cell = (i: number) => {
    const isX = marks[i] === "X";
    const active = dragId === i;
    return (
      <div
        key={i}
        ref={(el) => { cellRefs.current[i] = el; }}
        className="relative flex items-center justify-center border border-white/15"
        style={{ width: "clamp(76px, 26vw, 116px)", height: "clamp(76px, 26vw, 116px)" }}
      >
        {isX && (
          <div
            onPointerDown={onDown(i)}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="touch-none cursor-grab active:cursor-grabbing select-none font-p95 text-[#A6FF00]"
            style={{
              fontSize: "clamp(40px, 12vw, 60px)", lineHeight: 1,
              transform: active ? `translate(${off.x}px, ${off.y}px)` : "none",
              transition: active ? "none" : "transform .15s ease",
              zIndex: active ? 30 : 1,
              filter: "drop-shadow(0 0 10px rgba(166,255,0,0.5))",
            }}
          >
            ✕
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="relative bg-black text-white overflow-hidden flex flex-col items-center justify-center px-5" style={{ minHeight: "100dvh" }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 55% 45% at 50% 38%, rgba(166,255,0,0.07), transparent 60%)",
      }} />

      {!won ? (
        <div className="relative z-[1] w-full max-w-[460px] mx-auto flex flex-col items-center text-center">
          <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-3">Крестики · Загадка №2 · ур. 2</p>
          <h1 className="font-p95 leading-[0.95] uppercase tracking-tight mb-3" style={{ fontSize: "clamp(26px, 5vw, 46px)" }}>
            Собери три в ряд
          </h1>
          <p className="text-[13px] md:text-sm text-white/55 leading-relaxed max-w-sm mb-8">
            За рамку больше нельзя. Но у тебя есть его крестики.
          </p>

          <div className="grid grid-cols-3" style={{ gridTemplateColumns: "repeat(3, max-content)" }}>
            {Array.from({ length: 9 }).map((_, i) => cell(i))}
          </div>

          <button type="button" onClick={reset}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/70 font-p95 text-[14px] tracking-[0.12em] uppercase hover:border-white/40 hover:text-white transition-colors">
            <span className="leading-none translate-y-[1px]">Начать заново</span>
          </button>

          <p className="mt-6 text-[13px] text-[#C9A66B]/85 transition-opacity duration-700 min-h-[20px]" style={{ opacity: hint ? 1 : 0 }}>
            Крестики компьютера можно перетаскивать. И даже за край.
          </p>
        </div>
      ) : (
        <div className="relative z-[1] w-full max-w-[420px] mx-auto flex flex-col items-center text-center">
          <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-4">Три в ряд</p>
          <h1 className="font-p95 leading-none uppercase tracking-tight text-[#A6FF00] mb-5" style={{ fontSize: "clamp(40px, 11vw, 76px)" }}>
            Готово
          </h1>
          <p className="text-sm text-white/60 mb-8 max-w-xs">Ты не переиграл его — ты переставил его же фигуры.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/secret/dalshe3" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[14px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors no-underline">
              <span className="leading-none translate-y-[1px]">Дальше</span>
              <span className="leading-none">→</span>
            </Link>
            <button type="button" onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/70 font-p95 text-[14px] tracking-[0.12em] uppercase hover:border-white/40 hover:text-white transition-colors">
              <span className="leading-none translate-y-[1px]">Ещё раз</span>
            </button>
          </div>
          <Link href="/" className="mt-5 inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors no-underline">
            <ArrowLeft className="w-3 h-3" strokeWidth={2.2} /> На главную
          </Link>
        </div>
      )}
    </main>
  );
}

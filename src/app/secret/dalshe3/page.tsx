"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";

/**
 * Крестики L3 — «Этого не достаточно».
 * Поле с крестиками (X) компьютера + фраза «ЭТОГО НЕ ДОСТАТОЧНО».
 * Подвох: перетащить X компьютера на слово «НЕ» — тогда «этого достаточно»,
 * и открывается следующий уровень с кодом (/secret/lab/kod).
 */
const START: (string | null)[] = ["X", null, null, null, "X", null, null, null, "X"];

function celebrate() {
  const colors = ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"];
  confetti({ particleCount: 130, spread: 110, startVelocity: 45, origin: { y: 0.6 }, colors, disableForReducedMotion: true });
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.25, y: 0.5 }, colors, disableForReducedMotion: true }), 200);
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.75, y: 0.5 }, colors, disableForReducedMotion: true }), 360);
}

export default function Dalshe3() {
  const [marks, setMarks] = useState<(string | null)[]>(START);
  const [solved, setSolved] = useState(false);
  const [hint, setHint] = useState(false);

  const [dragId, setDragId] = useState<number | null>(null);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const startRef = useRef<{ px: number; py: number } | null>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const neRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setHint(true), 9000);
    return () => clearTimeout(t);
  }, []);

  const onDown = (i: number) => (e: React.PointerEvent) => {
    if (solved || marks[i] !== "X") return;
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
    if (!startRef.current || dragId === null) return;
    const from = dragId;
    startRef.current = null;
    setDragId(null);
    setOff({ x: 0, y: 0 });

    // на слово «НЕ»?
    const ne = neRef.current?.getBoundingClientRect();
    if (ne) {
      const pad = 16;
      if (e.clientX > ne.left - pad && e.clientX < ne.right + pad && e.clientY > ne.top - pad && e.clientY < ne.bottom + pad) {
        setMarks((p) => { const n = [...p]; n[from] = null; return n; });
        setSolved(true);
        celebrate();
        return;
      }
    }
    // иначе — переставить по ячейкам (живость), без победного условия
    setMarks((prev) => {
      const next = [...prev];
      let target: number | null = null;
      cellRefs.current.forEach((el, idx) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) target = idx;
      });
      if (target === null) return prev;
      if (target !== from && next[target] !== null) return prev;
      next[from] = null; next[target] = "X";
      return next;
    });
  };

  const cell = (i: number) => {
    const isX = marks[i] === "X";
    const active = dragId === i;
    return (
      <div
        key={i}
        ref={(el) => { cellRefs.current[i] = el; }}
        className="relative flex items-center justify-center border border-white/15"
        style={{ width: "clamp(70px, 24vw, 104px)", height: "clamp(70px, 24vw, 104px)" }}
      >
        {isX && (
          <div
            onPointerDown={onDown(i)}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="touch-none cursor-grab active:cursor-grabbing select-none font-p95 text-[#A6FF00]"
            style={{
              fontSize: "clamp(36px, 11vw, 54px)", lineHeight: 1,
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

      {!solved ? (
        <div className="relative z-[1] w-full max-w-[480px] mx-auto flex flex-col items-center text-center">
          <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-5">Крестики · Загадка №2 · ур. 3</p>

          {/* фраза с целью «НЕ» */}
          <h1 className="font-p95 leading-[1.05] uppercase tracking-tight mb-10" style={{ fontSize: "clamp(26px, 5vw, 48px)" }}>
            Этого{" "}
            <span ref={neRef} className="inline-block px-2 rounded text-[#C9A66B] border border-dashed border-[#C9A66B]/40">
              не
            </span>{" "}
            достаточно
          </h1>

          <div className="grid" style={{ gridTemplateColumns: "repeat(3, max-content)" }}>
            {Array.from({ length: 9 }).map((_, i) => cell(i))}
          </div>

          <p className="mt-8 text-[13px] text-[#C9A66B]/85 transition-opacity duration-700 min-h-[20px]" style={{ opacity: hint ? 1 : 0 }}>
            Слово «не» мешает. У тебя в руках есть, чем его убрать.
          </p>
        </div>
      ) : (
        <div className="relative z-[1] w-full max-w-[420px] mx-auto flex flex-col items-center text-center">
          <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-4">Этого достаточно</p>
          <h1 className="font-p95 leading-none uppercase tracking-tight text-[#A6FF00] mb-5" style={{ fontSize: "clamp(36px, 10vw, 68px)" }}>
            Достаточно
          </h1>
          <p className="text-sm text-white/60 mb-8 max-w-xs">Ты закрыл «не» — и условие сменилось. Дальше — терминал.</p>
          <Link href="/secret/lab/kod" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[14px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors no-underline">
            <span className="leading-none translate-y-[1px]">К терминалу</span>
            <span className="leading-none">→</span>
          </Link>
          <Link href="/" className="mt-5 inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors no-underline">
            <ArrowLeft className="w-3 h-3" strokeWidth={2.2} /> На главную
          </Link>
        </div>
      )}
    </main>
  );
}

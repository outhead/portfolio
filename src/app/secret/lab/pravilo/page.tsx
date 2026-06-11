"use client";

import LedText from "@/components/LedText";
import { LedLines } from "@/components/LedBoard";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Прототип B-v2 — «Перепиши правило» (Baba Is You, усложнённый).
 * Правило: «ВЫХОД НЕ ОТКРЫТ». Перетасовки внутри ничего не дают (чип снапается
 * назад). Решение неочевидно: лишнее слово «НЕ» нужно ВЫБРОСИТЬ ЗА КРАЙ экрана —
 * тогда останется «ВЫХОД ОТКРЫТ». Перекликается с «ходи за рамкой» из крестиков.
 */
type Chip = { id: string; word: string };
const INITIAL: Chip[] = [
  { id: "a", word: "Выход" },
  { id: "b", word: "Не" },
  { id: "c", word: "Открыт" },
];

export default function PraviloProto() {
  const [chips, setChips] = useState<Chip[]>(INITIAL);
  const [won, setWon] = useState(false);
  const [hint, setHint] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const startRef = useRef<{ px: number; py: number } | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setHint(true), 8000);
    return () => clearTimeout(id);
  }, []);

  const open = chips.length === 2 && chips[0].word === "Выход" && chips[1].word === "Открыт";
  useEffect(() => {
    if (open) { const t = setTimeout(() => setWon(true), 700); return () => clearTimeout(t); }
  }, [open]);

  const onDown = (id: string) => (e: React.PointerEvent) => {
    if (won || open) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setActiveId(id);
    setOff({ x: 0, y: 0 });
    startRef.current = { px: e.clientX, py: e.clientY };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!startRef.current || !activeId) return;
    setOff({ x: e.clientX - startRef.current.px, y: e.clientY - startRef.current.py });
  };
  const onUp = (id: string) => (e: React.PointerEvent) => {
    if (!startRef.current) return;
    startRef.current = null;
    const m = 36;
    const offscreen = e.clientX < m || e.clientX > window.innerWidth - m || e.clientY < m || e.clientY > window.innerHeight - m;
    setActiveId(null);
    setOff({ x: 0, y: 0 });
    if (!offscreen) return; // перетасовка внутри — снап назад

    const removed = chips.find((c) => c.id === id);
    const rest = chips.filter((c) => c.id !== id);
    if (removed?.word === "Не") {
      setChips(rest); // останется «ВЫХОД ОТКРЫТ» → откроется
    } else {
      // выкинул нужное слово — так выход не собрать, вернуть всё
      setFlash("Так выход не собрать.");
      setTimeout(() => { setChips(INITIAL); setFlash(null); }, 900);
    }
  };

  return (
    <main className="relative bg-black text-white overflow-hidden flex flex-col items-center justify-center px-5" style={{ minHeight: "100dvh" }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(166,255,0,0.06), transparent 60%)",
      }} />

      {!won ? (
        <div className="relative z-[1] w-full max-w-[520px] mx-auto flex flex-col items-center text-center select-none">
          <p className="text-white/40 mb-3">
            <span className="sr-only">Прототип · B</span>
            <LedText text="Прототип · B" className="h-[9px] w-auto" />
          </p>
          <h1 className="mb-8">
            <LedLines text="Найди выход" center maxChars={20} lineClass="h-[17px] md:h-[24px]" />
          </h1>

          <div className={`w-24 h-32 rounded-lg border-2 mb-12 transition-all duration-500 ${open ? "border-[#A6FF00] bg-[#A6FF00]/15 shadow-[0_0_50px_-8px_rgba(166,255,0,0.7)]" : "border-white/25 bg-white/[0.03]"}`} />

          {/* правило из чипов */}
          <div className="flex items-center justify-center gap-2.5 flex-wrap min-h-[56px]">
            {chips.map((c) => {
              const active = c.id === activeId;
              const accent = c.word === "Открыт";
              const cls = accent
                ? "border-[#A6FF00]/60 bg-[#A6FF00]/15 text-[#A6FF00]"
                : "border-white/20 bg-white/[0.06] text-white/85";
              return (
                <div
                  key={c.id}
                  onPointerDown={onDown(c.id)}
                  onPointerMove={onMove}
                  onPointerUp={onUp(c.id)}
                  onPointerCancel={onUp(c.id)}
                  className={`touch-none cursor-grab active:cursor-grabbing inline-flex items-center px-4 py-2.5 rounded-md border ${cls} ${active ? "z-10 shadow-lg" : ""}`}
                  style={active ? { transform: `translate(${off.x}px, ${off.y}px)`, transition: "none" } : { transition: "transform .2s ease" }}
                >
                  <span className="sr-only">{c.word}</span>
                  <LedText text={c.word} className="h-[11px] md:h-[12px] w-auto pointer-events-none" />
                </div>
              );
            })}
          </div>

          <p className="mt-10 text-[13px] text-[#C9A66B]/85 transition-opacity duration-700 min-h-[20px]" style={{ opacity: hint || flash ? 1 : 0 }}>
            {flash ?? "Перетасовки тут не помогут. Лишнее — за край."}
          </p>
        </div>
      ) : (
        <Won note="Ты не переставил слова, а выбросил лишнее за край." />
      )}
    </main>
  );
}

function Won({ note }: { note: string }) {
  return (
    <div className="relative z-[1] w-full max-w-[420px] mx-auto flex flex-col items-center text-center">
      <p className="text-white/40 mb-4">
        <span className="sr-only">Разгадал</span>
        <LedText text="Разгадал" className="h-[9px] w-auto" />
      </p>
      <h1 className="text-[#A6FF00] mb-5">
        <LedLines text="Открыто" center maxChars={20} lineClass="h-[26px] md:h-[38px]" />
      </h1>
      <p className="text-sm text-white/60 mb-8 max-w-xs">{note}</p>
      <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] hover:bg-[#A6FF00] hover:text-black transition-colors no-underline">
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
        <span className="sr-only">На главную</span><LedText text="На главную" className="h-[10px] w-auto" />
      </Link>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Прототип B — «Перепиши правило» (Baba Is You: двигаешь не героя, а правило).
 * На экране правило из чипов: «ВЫХОД — ЗАКРЫТ». Рядом лежит чип «ОТКРЫТ».
 * Решение: перетащить «ОТКРЫТ» на «ЗАКРЫТ» — правило меняется, выход открыт.
 */
export default function PraviloProto() {
  const [won, setWon] = useState(false);
  const [hint, setHint] = useState(false);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [placed, setPlaced] = useState(false);

  const slotRef = useRef<HTMLSpanElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setHint(true), 6000);
    return () => clearTimeout(id);
  }, []);

  const onDown = (e: React.PointerEvent) => {
    if (placed) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    startRef.current = { px: e.clientX, py: e.clientY, ox: drag?.x ?? 0, oy: drag?.y ?? 0 };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!startRef.current) return;
    setDrag({ x: startRef.current.ox + (e.clientX - startRef.current.px), y: startRef.current.oy + (e.clientY - startRef.current.py) });
  };
  const onUp = (e: React.PointerEvent) => {
    if (!startRef.current) return;
    startRef.current = null;
    const slot = slotRef.current?.getBoundingClientRect();
    if (slot) {
      const m = 28; // запас на промах
      const over = e.clientX > slot.left - m && e.clientX < slot.right + m && e.clientY > slot.top - m && e.clientY < slot.bottom + m;
      if (over) {
        setPlaced(true);
        setTimeout(() => setWon(true), 700);
        return;
      }
    }
    setDrag({ x: 0, y: 0 }); // снап обратно
  };

  return (
    <main className="relative bg-black text-white overflow-hidden flex flex-col items-center justify-center px-5" style={{ minHeight: "100dvh" }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(166,255,0,0.06), transparent 60%)",
      }} />

      {!won ? (
        <div className="relative z-[1] w-full max-w-[460px] mx-auto flex flex-col items-center text-center select-none">
          <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-3">Прототип · B</p>
          <h1 className="font-p95 leading-[0.95] uppercase tracking-tight mb-8" style={{ fontSize: "clamp(28px, 5vw, 46px)" }}>
            Найди выход
          </h1>

          {/* дверь */}
          <div className={`w-24 h-32 rounded-lg border-2 mb-10 transition-all duration-500 ${placed ? "border-[#A6FF00] bg-[#A6FF00]/15 shadow-[0_0_50px_-8px_rgba(166,255,0,0.7)]" : "border-white/25 bg-white/[0.03]"}`} />

          {/* правило из чипов */}
          <div className="flex items-center gap-2.5 mb-12">
            <Chip>Выход</Chip>
            <span className="text-white/40 font-p95">—</span>
            <span ref={slotRef} className="inline-block">
              {placed ? <Chip accent>Открыт</Chip> : <Chip muted>Закрыт</Chip>}
            </span>
          </div>

          {/* свободный чип «ОТКРЫТ» */}
          {!placed && (
            <div
              ref={chipRef}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              className="touch-none cursor-grab active:cursor-grabbing"
              style={{ transform: `translate(${drag?.x ?? 0}px, ${drag?.y ?? 0}px)` }}
            >
              <Chip accent>Открыт</Chip>
            </div>
          )}

          <p className="mt-10 text-[13px] text-[#C9A66B]/85 transition-opacity duration-700" style={{ opacity: hint && !placed ? 1 : 0 }}>
            Правило можно переписать. Перетащи слово.
          </p>
        </div>
      ) : (
        <Won note="Ты переписал правило, а не стал ему подчиняться." />
      )}
    </main>
  );
}

function Chip({ children, accent, muted }: { children: React.ReactNode; accent?: boolean; muted?: boolean }) {
  const cls = accent
    ? "border-[#A6FF00]/60 bg-[#A6FF00]/15 text-[#A6FF00]"
    : muted
    ? "border-white/15 bg-white/[0.05] text-white/55"
    : "border-white/20 bg-white/[0.06] text-white/85";
  return (
    <span className={`inline-flex items-center px-4 py-2.5 rounded-md border font-p95 text-[15px] md:text-base tracking-[0.08em] uppercase ${cls}`}>
      {children}
    </span>
  );
}

function Won({ note }: { note: string }) {
  return (
    <div className="relative z-[1] w-full max-w-[420px] mx-auto flex flex-col items-center text-center">
      <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-4">Разгадал</p>
      <h1 className="font-p95 leading-none uppercase tracking-tight text-[#A6FF00] mb-5" style={{ fontSize: "clamp(40px, 11vw, 76px)" }}>
        Открыто
      </h1>
      <p className="text-sm text-white/60 mb-8 max-w-xs">{note}</p>
      <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[14px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors no-underline">
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
        <span className="leading-none translate-y-[1px]">На главную</span>
      </Link>
    </div>
  );
}

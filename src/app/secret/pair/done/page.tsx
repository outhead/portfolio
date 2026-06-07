"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";

export default function PairDone() {
  useEffect(() => {
    const colors = ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"];
    confetti({ particleCount: 150, spread: 120, startVelocity: 45, origin: { y: 0.6 }, colors, disableForReducedMotion: true });
  }, []);

  return (
    <main className="relative bg-black text-white overflow-y-auto flex flex-col items-center px-5 pt-[88px] pb-16" style={{ minHeight: "100dvh" }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 55% 45% at 50% 38%, rgba(166,255,0,0.08), transparent 60%)",
      }} />
      <div className="relative z-[1] w-full max-w-[440px] mx-auto flex flex-col items-center text-center">
        <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-4">Вдвоём</p>
        <h1 className="font-p95 leading-none uppercase tracking-tight text-[#A6FF00] mb-6" style={{ fontSize: "clamp(40px,11vw,76px)" }}>
          Готово
        </h1>
        <p className="text-[15px] text-white/70 max-w-sm leading-relaxed mb-8">
          Это нельзя было пройти одному. Спасибо вам обоим — и тому, кто видел, и тому, кто щёлкал.
        </p>
        <div className="mb-8 flex flex-col items-center">
          <p className="text-[13px] text-white/45 mb-3 max-w-xs">Раз уж вы вдвоём — сыграйте.</p>
          <Link href="/secret/pong" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[14px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors no-underline">
            <span className="leading-none translate-y-[1px]">Пинг-понг</span><span className="leading-none">→</span>
          </Link>
        </div>

        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/60 font-p95 text-[14px] tracking-[0.12em] uppercase hover:border-white/40 hover:text-white transition-colors no-underline">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
          <span className="leading-none translate-y-[1px]">На главную</span>
        </Link>
      </div>
    </main>
  );
}

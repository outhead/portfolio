"use client";

import LedText from "@/components/LedText";
import { useEffect, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import QuestBackground from "@/components/QuestBackground";

export default function PairDone() {
  // переносим комнату/роль в пинг-понг — играем тем же составом, без новой ссылки
  const [pongHref, setPongHref] = useState("/secret/pong");
  useEffect(() => {
    const colors = ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"];
    confetti({ particleCount: 150, spread: 120, startVelocity: 45, origin: { y: 0.6 }, colors, disableForReducedMotion: true });
    const p = new URLSearchParams(window.location.search);
    const room = p.get("room");
    if (room) setPongHref(`/secret/pong?room=${room}${p.get("host") === "1" ? "&host=1" : ""}`);
  }, []);

  return (
    <main className="relative bg-black text-white overflow-y-auto flex flex-col items-center px-5 pt-[88px] pb-16" style={{ minHeight: "100dvh" }}>
      <QuestBackground palette="violet" opacity={0.34} />
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 55% 45% at 50% 38%, rgba(166,255,0,0.08), transparent 60%)",
      }} />
      <div className="relative z-[1] w-full max-w-[440px] mx-auto flex flex-col items-center text-center">
        <p className="text-white/40 mb-4">
          <span className="sr-only">Вдвоём</span>
          <LedText text="Вдвоём" className="h-[9px] w-auto" />
        </p>
        <h1 className="font-p95 leading-none uppercase tracking-tight text-[#A6FF00] mb-6" style={{ fontSize: "clamp(40px,11vw,76px)" }}>
          Готово
        </h1>
        <p className="text-[15px] text-white/70 max-w-sm leading-relaxed mb-8">
          Это нельзя было пройти одному. Спасибо вам обоим — и тому, кто видел, и тому, кто щёлкал.
        </p>
        <div className="mb-8 flex flex-col items-center">
          <p className="text-[13px] text-white/45 mb-3 max-w-xs">Раз уж вы вдвоём — сыграйте.</p>
          <Link href={pongHref} className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] hover:bg-[#A6FF00] hover:text-black transition-colors no-underline">
            <span className="sr-only">Пинг-понг</span><LedText text="Пинг-понг" className="h-[10px] w-auto" /><LedText text="→" className="h-[11px] w-auto" />
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Прототип A — «Не нажимай» (нарушь запрет; в духе There Is No Game).
 * Очевидный ход (кнопка «Выйти») — обманка, ничего не делает. Решение —
 * сделать ровно запрещённое: нажать кнопку «НЕ НАЖИМАТЬ» (3 раза, с эскалацией).
 */
export default function ZapretProto() {
  const [presses, setPresses] = useState(0);
  const [won, setWon] = useState(false);
  const [exitShake, setExitShake] = useState(false);

  const messages = [
    "Дальше хода нет. Что угодно — только не жми кнопку ниже.",
    "Я же просил. Не нажимай.",
    "Последний раз по-хорошему: НЕ. НАЖИМАЙ.",
  ];

  const press = () => {
    const n = presses + 1;
    if (n >= 3) setWon(true);
    else setPresses(n);
  };

  return (
    <main className="relative bg-black text-white overflow-hidden flex flex-col items-center justify-center px-5" style={{ minHeight: "100dvh" }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(166,255,0,0.06), transparent 60%)",
      }} />

      {!won ? (
        <div className="relative z-[1] w-full max-w-[440px] mx-auto flex flex-col items-center text-center">
          <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-3">Прототип · A</p>
          <h1 className="font-p95 leading-[0.95] uppercase tracking-tight mb-4" style={{ fontSize: "clamp(30px, 6vw, 52px)" }}>
            Тупик
          </h1>
          <p className="text-sm md:text-[15px] text-white/60 leading-relaxed mb-10 min-h-[44px]">
            {messages[presses]}
          </p>

          <button
            type="button"
            onClick={press}
            className="px-8 py-4 rounded-md border-2 border-[#A6FF00] bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-base md:text-lg uppercase tracking-tight hover:bg-[#A6FF00]/20 transition-colors"
          >
            Не нажимать
          </button>

          <button
            type="button"
            onClick={() => { setExitShake(true); setTimeout(() => setExitShake(false), 400); }}
            className={`mt-6 text-[13px] tracking-[0.12em] uppercase text-white/40 hover:text-white/60 transition-all ${exitShake ? "translate-x-1" : ""}`}
            style={exitShake ? { color: "#C9A66B" } : undefined}
          >
            {exitShake ? "выхода тут нет" : "Выйти →"}
          </button>
        </div>
      ) : (
        <Won note="Ты не послушался — в этом и был фокус." />
      )}
    </main>
  );
}

function Won({ note }: { note: string }) {
  return (
    <div className="relative z-[1] w-full max-w-[420px] mx-auto flex flex-col items-center text-center">
      <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-4">Разгадал</p>
      <h1 className="font-p95 leading-none uppercase tracking-tight text-[#A6FF00] mb-5" style={{ fontSize: "clamp(40px, 11vw, 76px)" }}>
        Готово
      </h1>
      <p className="text-sm text-white/60 mb-8 max-w-xs">{note}</p>
      <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[14px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors no-underline">
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
        <span className="leading-none translate-y-[1px]">На главную</span>
      </Link>
    </div>
  );
}

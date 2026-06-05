"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Прототип C — «Код на виду» (ответ в «обвязке»; в духе Notpron).
 * Нужен 4-значный код. Перебором не взять, но он уже на экране — огромным
 * блёклым водяным знаком за клавиатурой. Трюк: заметить то, что игнорируешь.
 */
const CODE = "4719";

export default function KodProto() {
  const [entry, setEntry] = useState("");
  const [won, setWon] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setHint(true), 8000);
    return () => clearTimeout(id);
  }, []);

  const push = (d: string) => {
    if (won || entry.length >= 4) return;
    const next = entry + d;
    setEntry(next);
    if (next.length === 4) {
      if (next === CODE) setTimeout(() => setWon(true), 150);
      else { setWrong(true); setTimeout(() => { setWrong(false); setEntry(""); }, 600); }
    }
  };
  const back = () => setEntry((e) => e.slice(0, -1));

  return (
    <main className="relative bg-black text-white overflow-hidden flex flex-col items-center justify-center px-5" style={{ minHeight: "100dvh" }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(166,255,0,0.06), transparent 60%)",
      }} />

      {/* КОД НА ВИДУ — гигантский блёклый водяной знак за клавиатурой */}
      {!won && (
        <div aria-hidden className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none select-none">
          <span className="font-p95 tracking-[0.2em] text-[#A6FF00]" style={{ fontSize: "min(42vw, 360px)", opacity: 0.05, lineHeight: 1 }}>
            {CODE}
          </span>
        </div>
      )}

      {!won ? (
        <div className="relative z-[1] w-full max-w-[320px] mx-auto flex flex-col items-center text-center select-none">
          <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-3">Прототип · C</p>
          <h1 className="font-p95 leading-[0.95] uppercase tracking-tight mb-2" style={{ fontSize: "clamp(26px, 5vw, 44px)" }}>
            Введи код
          </h1>
          <p className="text-[13px] text-white/45 mb-8">Доступ закрыт · 4 цифры</p>

          {/* дисплей */}
          <div className={`flex gap-3 mb-8 transition-transform ${wrong ? "translate-x-1" : ""}`} style={wrong ? { color: "#C9A66B" } : undefined}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`w-12 h-14 rounded-md border flex items-center justify-center font-p95 text-2xl ${wrong ? "border-[#C9A66B]/60" : "border-white/20"} ${entry[i] ? "text-white" : "text-white/20"}`}>
                {entry[i] ?? "·"}
              </div>
            ))}
          </div>

          {/* клавиатура */}
          <div className="grid grid-cols-3 gap-2.5">
            {["1","2","3","4","5","6","7","8","9"].map((d) => (
              <button key={d} type="button" onClick={() => push(d)}
                className="w-16 h-16 rounded-md border border-white/12 bg-white/[0.03] text-white/85 font-p95 text-xl hover:border-white/30 hover:bg-white/[0.07] transition-colors">
                {d}
              </button>
            ))}
            <button type="button" onClick={back}
              className="w-16 h-16 rounded-md border border-white/12 bg-white/[0.03] text-white/45 text-sm hover:border-white/30 transition-colors">←</button>
            <button key="0" type="button" onClick={() => push("0")}
              className="w-16 h-16 rounded-md border border-white/12 bg-white/[0.03] text-white/85 font-p95 text-xl hover:border-white/30 hover:bg-white/[0.07] transition-colors">0</button>
            <span className="w-16 h-16" />
          </div>

          <p className="mt-8 text-[13px] text-[#C9A66B]/85 transition-opacity duration-700" style={{ opacity: hint ? 1 : 0 }}>
            Код подбирать не нужно. Он уже на экране.
          </p>
        </div>
      ) : (
        <Won note="Код был на виду — за клавиатурой. Ты просто его не замечал." />
      )}
    </main>
  );
}

function Won({ note }: { note: string }) {
  return (
    <div className="relative z-[1] w-full max-w-[420px] mx-auto flex flex-col items-center text-center">
      <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-4">Разгадал</p>
      <h1 className="font-p95 leading-none uppercase tracking-tight text-[#A6FF00] mb-5" style={{ fontSize: "clamp(40px, 11vw, 76px)" }}>
        Доступ
      </h1>
      <p className="text-sm text-white/60 mb-8 max-w-xs">{note}</p>
      <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[14px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors no-underline">
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
        <span className="leading-none translate-y-[1px]">На главную</span>
      </Link>
    </div>
  );
}

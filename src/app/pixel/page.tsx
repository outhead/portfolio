"use client";

/* ─────────────────────────────────────────────────────────────────
 * /pixel — лаба диодного табло-портрета.
 * Несколько сетов кадров (нарезаны из спрайт-листов, выровнены).
 * Хиро будет рандомить сет при загрузке.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import LedText from "@/components/LedText";
import PixelPortrait from "@/components/PixelPortrait";

const f = (dir: string, n: number) =>
  Array.from({ length: n }, (_, i) => `/images/${dir}/f${i}.png`);

// сет 1 — 6 кадров по порядку
const SET1 = f("pixel-hero", 6);
// сет 2 — 12 кадров по порядку
const SET2 = f("pixel-hero2", 12);

const SETS = [
  { label: "сет 1 · говорит + жест", frames: SET1 },
  { label: "сет 2 · липсинк 12", frames: SET2 },
];

const densities = [
  { label: "90 точек · крупно", cols: 90 },
  { label: "112 точек · база", cols: 112 },
  { label: "140 точек · детально", cols: 140 },
];

export default function PixelLab() {
  const [flicker, setFlicker] = useState(0);
  const [gamma, setGamma] = useState(0.95);
  const [holdMs, setHoldMs] = useState(90);
  const [morphMs, setMorphMs] = useState(0);
  const [active, setActive] = useState(1); // сет 2 по умолчанию

  // как в хиро: рандомный сет при загрузке
  useEffect(() => {
    setActive(Math.floor(Math.random() * SETS.length));
  }, []);

  return (
    <main className="min-h-screen bg-black text-white px-5 md:px-[8%] pt-28 md:pt-32 pb-20">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <div className="text-white/40">
            <LedText text="Лаба · табло-портрет" className="h-[10px] w-auto" />
          </div>
          <h1 className="text-2xl md:text-3xl">Табло-портрет — сеты анимаций</h1>
          <p className="text-[14px] md:text-[16px] text-white/55 max-w-[600px]">
            Каждый сет — отдельный спрайт-лист, нарезан и выровнен по голове.
            В хиро сет выбирается случайно при загрузке (кнопка ниже — сменить).
          </p>
        </div>

        {/* активный (как в хиро) */}
        <div className="flex flex-col gap-3 max-w-[420px]">
          <div className="relative rounded-2xl overflow-hidden border border-[#A6FF00]/20 bg-[#08090a] aspect-[4/5]">
            <PixelPortrait
              frames={SETS[active].frames}
              cols={112}
              holdMs={holdMs}
              morphMs={morphMs}
              flicker={flicker}
              gamma={gamma}
              className="absolute inset-0"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-white/55">активный: {SETS[active].label}</span>
            <button
              onClick={() => setActive((a) => (a + 1) % SETS.length)}
              className="text-[14px] px-3 py-1.5 rounded-full border border-white/15 text-white/60 hover:text-[#A6FF00] hover:border-[#A6FF00]/40 transition-colors"
            >
              другой сет
            </button>
          </div>
        </div>

        {/* ручки */}
        <div className="flex flex-col gap-4 max-w-[420px]">
          {([
            ["Кадр", holdMs, setHoldMs, 40, 600, 10, "мс"],
            ["Переход (0=резко)", morphMs, setMorphMs, 0, 500, 10, "мс"],
            ["Мерцание", flicker, setFlicker, 0, 0.4, 0.02, ""],
            ["Контраст", gamma, setGamma, 0.5, 1.4, 0.05, ""],
          ] as const).map(([label, val, set, min, max, step, unit]) => (
            <label key={label} className="flex items-center gap-4 text-white/50">
              <span className="w-28 shrink-0 text-[14px]">{label}</span>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={(e) => (set as (n: number) => void)(Number(e.target.value))}
                className="flex-1 accent-[#A6FF00]" />
              <span className="w-16 text-right text-[14px] tabular-nums">
                {val < 2 ? val.toFixed(2) : val}{unit}
              </span>
            </label>
          ))}
        </div>

        {/* все сеты рядом */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-[640px]">
          {SETS.map((s) => (
            <div key={s.label} className="flex flex-col gap-3">
              <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-[#08090a] aspect-[4/5]">
                <PixelPortrait frames={s.frames} cols={112} holdMs={holdMs}
                  morphMs={morphMs} flicker={flicker} gamma={gamma} className="absolute inset-0" />
              </div>
              <span className="text-[14px] text-white/55">{s.label}</span>
            </div>
          ))}
        </div>

        {/* плотность (на активном сете) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {densities.map((d) => (
            <div key={d.cols} className="flex flex-col gap-3">
              <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-[#08090a] aspect-[4/5]">
                <PixelPortrait frames={SETS[active].frames} cols={d.cols} holdMs={holdMs}
                  morphMs={morphMs} flicker={flicker} gamma={gamma} className="absolute inset-0" />
              </div>
              <span className="text-[14px] text-white/55">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

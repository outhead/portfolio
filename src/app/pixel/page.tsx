"use client";

/* ─────────────────────────────────────────────────────────────────
 * /pixel — лаба бинарного табло-портрета (0/1 нашими диодами).
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import LedText from "@/components/LedText";
import PixelPortrait from "@/components/PixelPortrait";
import ParticlePortrait from "@/components/ParticlePortrait";

const f = (dir: string, n: number) =>
  Array.from({ length: n }, (_, i) => `/images/${dir}/f${i}.png`);

const SET1 = f("pixel-hero", 6);
const SET2 = f("pixel-hero2", 12);

const SETS = [
  { label: "сет 1 · 6 кадров", frames: SET1 },
  { label: "сет 2 · липсинк 12", frames: SET2 },
];

const densities = [
  { label: "40 цифр · крупно", cols: 40 },
  { label: "56 цифр · база", cols: 56 },
  { label: "72 цифры · детально", cols: 72 },
];

export default function PixelLab() {
  const [gamma, setGamma] = useState(0.95);
  const [holdMs, setHoldMs] = useState(90);
  const [shimmer, setShimmer] = useState(0);
  const [cols, setCols] = useState(56);
  const [active, setActive] = useState(1);

  useEffect(() => {
    setActive(Math.floor(Math.random() * SETS.length));
  }, []);

  return (
    <main className="min-h-screen bg-black text-white px-5 md:px-[8%] pt-28 md:pt-32 pb-20">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <div className="text-white/40">
            <LedText text="Лаба · бинарный портрет" className="h-[10px] w-auto" />
          </div>
          <h1 className="text-2xl md:text-3xl">Портрет из 0 и 1</h1>
          <p className="text-[14px] md:text-[15px] text-white/55 max-w-[620px]">
            Каждая ячейка — символ 0/1, собранный теми же диодами 5×7, что и весь
            LED-движок сайта. Яркость диодов = яркость лица, вокруг — тусклое поле
            цифр. Анимация — флипбук по кадрам.
          </p>
        </div>

        {/* премиальный — облако частиц (приём шара) */}
        <div className="flex flex-col gap-3 max-w-[440px]">
          <div className="relative rounded-2xl overflow-hidden border border-[#A6FF00]/25 bg-[#08090a] aspect-[4/5]">
            <ParticlePortrait src="/images/hero-portrait.png" depthSrc="/images/hero-depth.png" className="absolute inset-0" />
          </div>
          <span className="text-[13px] text-white/55">частицы · наведи курсор — лицо собирается, уводишь — рассыпается</span>
        </div>

        {/* активный — бинарь */}
        <div className="flex flex-col gap-3 max-w-[440px]">
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-[#08090a] aspect-[4/5]">
            <PixelPortrait frames={SETS[active].frames} cols={cols} holdMs={holdMs}
              gamma={gamma} shimmer={shimmer} className="absolute inset-0" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-white/55">{SETS[active].label}</span>
            <button
              onClick={() => setActive((a) => (a + 1) % SETS.length)}
              className="text-[13px] px-3 py-1.5 rounded-full border border-white/15 text-white/60 hover:text-[#A6FF00] hover:border-[#A6FF00]/40 transition-colors"
            >
              другой сет
            </button>
          </div>
        </div>

        {/* ручки */}
        <div className="flex flex-col gap-4 max-w-[440px]">
          {([
            ["Цифр по ширине", cols, setCols, 28, 90, 2, ""],
            ["Кадр", holdMs, setHoldMs, 40, 600, 10, "мс"],
            ["Контраст", gamma, setGamma, 0.5, 1.6, 0.05, ""],
            ["Шиммер (0/1 живут)", shimmer, setShimmer, 0, 0.3, 0.02, ""],
          ] as const).map(([label, val, set, min, max, step, unit]) => (
            <label key={label} className="flex items-center gap-4 text-white/50">
              <span className="w-36 shrink-0 text-[13px]">{label}</span>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={(e) => (set as (n: number) => void)(Number(e.target.value))}
                className="flex-1 accent-[#A6FF00]" />
              <span className="w-16 text-right text-[13px] tabular-nums">
                {val < 2 ? val.toFixed(2) : val}{unit}
              </span>
            </label>
          ))}
        </div>

        {/* плотность */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {densities.map((d) => (
            <div key={d.cols} className="flex flex-col gap-3">
              <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-[#08090a] aspect-[4/5]">
                <PixelPortrait frames={SETS[active].frames} cols={d.cols} holdMs={holdMs}
                  gamma={gamma} shimmer={shimmer} className="absolute inset-0" />
              </div>
              <span className="text-[13px] text-white/55">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

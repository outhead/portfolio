"use client";

/* ─────────────────────────────────────────────────────────────────
 * /pixel — лаба частиц-портрета. Один холст + ползунки качества.
 * ──────────────────────────────────────────────────────────────── */

import { useState } from "react";
import LedText from "@/components/LedText";
import ParticlePortrait from "@/components/ParticlePortrait";

export default function PixelLab() {
  const [count, setCount] = useState(5500);
  const [depthScale, setDepthScale] = useState(0.6);
  const [tilt, setTilt] = useState(0.45);
  const [gamma, setGamma] = useState(1.05);
  const [hover, setHover] = useState(true);

  return (
    <main className="min-h-screen bg-black text-white px-5 md:px-[8%] pt-28 md:pt-32 pb-20">
      <div className="max-w-[900px] mx-auto flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <div className="text-white/40">
            <LedText text="Лаба · частицы-портрет" className="h-[10px] w-auto" />
          </div>
          <h1 className="text-2xl md:text-3xl">Портрет из частиц · 3D-глубина</h1>
          <p className="text-[14px] md:text-[15px] text-white/55 max-w-[620px]">
            Точки лежат по реальной карте глубины. Наведи курсор — лицо
            собирается и поворачивается. Ползунки ниже меняют качество/нагрузку.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* холст */}
          <div className="w-full md:w-[360px] shrink-0">
            <div className="relative rounded-2xl overflow-hidden border border-[#A6FF00]/25 bg-[#08090a] aspect-[4/5]">
              <ParticlePortrait
                key={count}
                src="/images/hero-portrait.png"
                depthSrc="/images/hero-depth.png"
                count={count}
                depthScale={depthScale}
                tilt={tilt}
                gamma={gamma}
                assembleOnHover={hover}
                className="absolute inset-0"
              />
            </div>
          </div>

          {/* ползунки */}
          <div className="flex-1 flex flex-col gap-5">
            {([
              ["Точек", count, setCount, 1000, 9000, 250, ""],
              ["Глубина", depthScale, setDepthScale, 0, 1.2, 0.05, ""],
              ["Наклон", tilt, setTilt, 0, 1, 0.05, ""],
              ["Контраст", gamma, setGamma, 0.5, 1.8, 0.05, ""],
            ] as const).map(([label, val, set, min, max, step]) => (
              <label key={label} className="flex items-center gap-4 text-white/50">
                <span className="w-24 shrink-0 text-[13px]">{label}</span>
                <input
                  type="range" min={min} max={max} step={step} value={val}
                  onChange={(e) => (set as (n: number) => void)(Number(e.target.value))}
                  className="flex-1 accent-[#A6FF00]"
                />
                <span className="w-14 text-right text-[13px] tabular-nums">
                  {val < 20 ? val.toFixed(2) : val}
                </span>
              </label>
            ))}

            <label className="flex items-center gap-3 text-white/50 text-[13px] mt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={hover}
                onChange={(e) => setHover(e.target.checked)}
                className="accent-[#A6FF00] w-4 h-4"
              />
              Собирать по наведению (выкл — всегда собран)
            </label>

            <p className="text-[12px] text-white/35 mt-2">
              Меньше точек = плавнее. Глубина — сила рельефа. Наведи на холст для
              сборки/поворота.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

/* ─────────────────────────────────────────────────────────────────
 * /pixel-test — тестовая область: фигуры из точек (силуэт + глубина).
 * ──────────────────────────────────────────────────────────────── */

import { useState } from "react";
import LedText from "@/components/LedText";
import ParticlePortrait from "@/components/ParticlePortrait";
import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";

export default function PixelTest() {
  const locale = useLocale();
  const FIGS = [
    { label: pick("Фигура A", "Figure A", locale), src: "/images/fig-a-portrait.png", depth: "/images/fig-a-depth.png" },
    { label: pick("Фигура B", "Figure B", locale), src: "/images/fig-b-portrait.png", depth: "/images/fig-b-depth.png" },
  ];

  const [count, setCount] = useState(5000);
  const [depthScale, setDepthScale] = useState(0.6);
  const [tilt, setTilt] = useState(0.5);

  return (
    <main className="min-h-screen bg-black text-white px-5 md:px-[8%] pt-28 md:pt-32 pb-20">
      <div className="max-w-[1000px] mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <div className="text-white/40">
            <LedText text={pick("Тест · фигуры из точек", "Test · figures from dots", locale)} className="h-[10px] w-auto" />
          </div>
          <h1 className="text-2xl md:text-3xl">{pick("Силуэт-фигуры (без детали)", "Silhouette figures (no detail)", locale)}</h1>
          <p className="text-[13px] text-white/50 max-w-[560px]">
            {pick(
              "Точки заполняют тело по маске, объём — из карты глубины. Наведи — собирается, уведи — остаётся.",
              "Dots fill the body by its mask, the volume comes from the depth map. Hover — it assembles, move away — it stays.",
              locale,
            )}
          </p>
        </div>

        <div className="flex flex-col gap-4 max-w-[420px]">
          {([
            [pick("Точек", "Dots", locale), count, setCount, 1500, 9000, 250],
            [pick("Глубина", "Depth", locale), depthScale, setDepthScale, 0, 1.2, 0.05],
            [pick("Наклон", "Tilt", locale), tilt, setTilt, 0, 1, 0.05],
          ] as const).map(([label, val, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-4 text-white/50">
              <span className="w-20 shrink-0 text-[13px]">{label}</span>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={(e) => (set as (n: number) => void)(Number(e.target.value))}
                className="flex-1 accent-[#A6FF00]" />
              <span className="w-12 text-right text-[13px] tabular-nums">
                {val < 20 ? val.toFixed(2) : val}
              </span>
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FIGS.map((f) => (
            <div key={f.label} className="flex flex-col gap-3">
              <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-[#08090a] aspect-[3/4]">
                <ParticlePortrait
                  key={`${f.label}-${count}`}
                  src={f.src}
                  depthSrc={f.depth}
                  count={count}
                  depthScale={depthScale}
                  tilt={tilt}
                  pointScale={0.7}
                  assembleOnHover
                  latchAssemble
                  className="absolute inset-0"
                />
              </div>
              <span className="text-[13px] text-white/55">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

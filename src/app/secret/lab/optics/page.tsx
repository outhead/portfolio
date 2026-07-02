"use client";

/* Песочница визуального апгрейда головоломки менторинга.
   Служебный роут, в навигации нет. Слева сцена (V2 или прод-V1 для
   сравнения), справа крутилки параметров V2. */

import { useRef, useState } from "react";
import ConstellationFigures from "@/components/ConstellationFigures";
import ConstellationFiguresV2, { V2_DEFAULTS, type V2Params } from "@/components/ConstellationFiguresV2";
import { MENTORING_LEVEL } from "@/lib/optics";

function Slider({
  label, value, min, max, step, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex justify-between text-[11px] uppercase tracking-wider text-white/50 mb-1">
        <span>{label}</span>
        <span className="text-white/80 tabular-nums">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-white/80 h-1.5"
      />
    </label>
  );
}

export default function OpticsLabPage() {
  const paramsRef = useRef<V2Params>({ ...V2_DEFAULTS });
  const [ui, setUi] = useState<V2Params>({ ...V2_DEFAULTS });
  const [mode, setMode] = useState<"v2" | "v1">("v2");
  const [nonce, setNonce] = useState(0); // пересоздать сцену (reset)
  const [solved, setSolved] = useState(false);

  const set = <K extends keyof V2Params>(k: K, v: V2Params[K]) => {
    paramsRef.current[k] = v;
    setUi((prev) => ({ ...prev, [k]: v }));
  };

  return (
    <main className="min-h-screen bg-[#080807] text-white px-4 py-8 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-lg font-medium tracking-tight">Optics sandbox</h1>
          <span className="text-[11px] text-white/40">{solved ? "решено ✓" : "двигай кристаллы"}</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* сцена */}
          <div>
            <div className="relative aspect-[16/12] md:aspect-[16/10] rounded-2xl overflow-hidden bg-[#0b0b0a] border border-white/[0.06]">
              {mode === "v2" ? (
                <ConstellationFiguresV2
                  key={`v2-${nonce}`}
                  className="absolute inset-0"
                  level={MENTORING_LEVEL}
                  lockMirror
                  paramsRef={paramsRef}
                  onSolve={() => setSolved(true)}
                />
              ) : (
                <ConstellationFigures
                  key={`v1-${nonce}`}
                  className="absolute inset-0"
                  level={MENTORING_LEVEL}
                  lockMirror
                  onSolve={() => setSolved(true)}
                />
              )}
            </div>

            <div className="flex gap-2 mt-3">
              {(["v2", "v1"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setSolved(false); setNonce((n) => n + 1); }}
                  className={`h-8 px-3 rounded-lg text-[12px] border transition-colors ${
                    mode === m ? "border-white/70 text-white bg-white/10" : "border-white/15 text-white/50 hover:text-white/80"
                  }`}
                >
                  {m === "v2" ? "V2 — новая" : "V1 — как на проде"}
                </button>
              ))}
              <button
                onClick={() => { setSolved(false); setNonce((n) => n + 1); }}
                className="h-8 px-3 rounded-lg text-[12px] border border-white/15 text-white/50 hover:text-white/80 ml-auto"
              >
                Reset
              </button>
            </div>
          </div>

          {/* контролы V2 */}
          <div className="space-y-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 h-fit">
            <div className="text-[11px] uppercase tracking-wider text-white/50">Параметры V2</div>
            <Slider label="Скорость луча" value={ui.raySpeed} min={0} max={80} step={2} onChange={(v) => set("raySpeed", v)} />
            <Slider label="Шаг точек луча" value={ui.rayStep} min={4} max={14} step={1} onChange={(v) => set("rayStep", v)} />
            <Slider label="Размер кристаллов" value={ui.gemSize} min={7} max={14} step={1} onChange={(v) => set("gemSize", v)} />
            <Slider label="Глоу" value={ui.glow} min={0} max={2} step={0.1} onChange={(v) => set("glow", v)} />
            <label className="flex items-center gap-2 text-[12px] text-white/70">
              <input
                type="checkbox"
                checked={ui.particles}
                onChange={(e) => set("particles", e.target.checked)}
                className="accent-white/80"
              />
              Искры и конфетти
            </label>
            <p className="text-[11px] leading-relaxed text-white/35">
              Что нового: бегущие лучи с дизерингом, кристаллы с гранью-бликом и
              дыханием, ромбы-цели с пульсом и огоньком, искры при попадании,
              хвост при перетаскивании, ховер-фидбек. Тач-зоны увеличены.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

/* Песочница физики кубов на карточках кейсов.
   Служебный роут, в навигации нет. Крутим параметры вживую, курсором
   водим по области — толкаем/тащим/закручиваем кубы. */

import { useRef, useState } from "react";
import PixelCubeSandbox, {
  DEFAULT_PARAMS,
  type CubeSandboxParams,
  type CursorMode,
} from "@/components/PixelCubeSandbox";
import LedText from "@/components/LedText";
import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";

const PRESETS: { color: string; logo: string; label: string }[] = [
  { color: "#FF2436", logo: "/images/logos/mts.svg", label: "MTS" },
  { color: "#1C92E5", logo: "/images/logos/gazpromneft.svg", label: "GPN" },
  { color: "#2E6BFF", logo: "/images/logos/ozon.svg", label: "OZON" },
  { color: "#3DDC84", logo: "/images/logos/smiley.svg", label: ":)" },
];

const MODES: { v: CursorMode; label: string; hintRu: string; hintEn: string }[] = [
  { v: "stir", label: "Stir", hintRu: "тащит кубы за курсором", hintEn: "drags cubes after the cursor" },
  { v: "push", label: "Push", hintRu: "расталкивает от курсора", hintEn: "pushes away from the cursor" },
  { v: "vortex", label: "Vortex", hintRu: "закручивает воронкой", hintEn: "spins them into a vortex" },
  { v: "off", label: "Off", hintRu: "курсор не влияет", hintEn: "cursor has no effect" },
];

function Slider({
  label, value, min, max, step, onChange, fmt,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; fmt?: (v: number) => string;
}) {
  return (
    <label className="block">
      <div className="flex justify-between text-[11px] uppercase tracking-wider text-white/50 mb-1">
        <span>{label}</span>
        <span className="text-white/80 tabular-nums">{fmt ? fmt(value) : value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-white/80 h-1.5"
      />
    </label>
  );
}

export default function CubeSandboxPage() {
  const locale = useLocale();
  const paramsRef = useRef<CubeSandboxParams>({ ...DEFAULT_PARAMS });
  const [ui, setUi] = useState<CubeSandboxParams>({ ...DEFAULT_PARAMS });
  const [preset, setPreset] = useState(0);
  const [count, setCount] = useState(0);
  // ключ, чтобы пересоздать канвас при смене пресета цвета/лого
  const p = PRESETS[preset];

  const set = <K extends keyof CubeSandboxParams>(k: K, v: CubeSandboxParams[K]) => {
    paramsRef.current[k] = v;
    setUi((prev) => ({ ...prev, [k]: v }));
  };

  return (
    <main className="min-h-screen bg-[#080807] text-white px-4 py-8 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-lg font-medium tracking-tight">Cube sandbox</h1>
          <span className="text-[11px] text-white/40 tabular-nums">{pick("активных кубов: ", "active cubes: ", locale)}{count}</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* сцена */}
          <div>
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-[#0b0b0a] border border-white/[0.06]">
              <PixelCubeSandbox
                key={preset}
                color={p.color}
                logoSrc={p.logo}
                pitch={5.2}
                paramsRef={paramsRef}
                onCount={setCount}
              />
              <div className="absolute top-4 left-4 z-[2] text-white/75 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                <LedText text={p.label} className="h-[10px] w-auto" />
              </div>
              <div className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-white/35 pointer-events-none">
                {pick("наведи и веди курсором по области", "hover and move the cursor across the area", locale)}
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              {PRESETS.map((pr, i) => (
                <button
                  key={pr.label}
                  onClick={() => setPreset(i)}
                  className={`h-8 px-3 rounded-lg text-[12px] border transition-colors ${
                    i === preset ? "border-white/70 text-white" : "border-white/15 text-white/50 hover:text-white/80"
                  }`}
                  style={{ background: i === preset ? pr.color + "22" : "transparent" }}
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>

          {/* контролы */}
          <div className="space-y-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/50 mb-2">{pick("Курсор", "Cursor", locale)}</div>
              <div className="grid grid-cols-4 gap-1.5">
                {MODES.map((m) => (
                  <button
                    key={m.v}
                    onClick={() => set("cursorMode", m.v)}
                    title={pick(m.hintRu, m.hintEn, locale)}
                    className={`h-8 rounded-lg text-[12px] border transition-colors ${
                      ui.cursorMode === m.v ? "border-white/70 text-white bg-white/10" : "border-white/15 text-white/50 hover:text-white/80"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-white/35 mt-1.5">{(() => { const m = MODES.find((m) => m.v === ui.cursorMode); return m ? pick(m.hintRu, m.hintEn, locale) : ""; })()}</p>
            </div>

            <Slider label={pick("Радиус курсора", "Cursor radius", locale)} value={ui.cursorRadius} min={0.4} max={2.5} step={0.05}
              onChange={(v) => set("cursorRadius", v)} fmt={(v) => v.toFixed(2)} />
            <Slider label={pick("Сила курсора", "Cursor force", locale)} value={ui.cursorPush} min={0} max={100} step={1}
              onChange={(v) => set("cursorPush", v)} />

            <hr className="border-white/10" />

            <Slider label={pick("Гравитация", "Gravity", locale)} value={ui.gravity} min={5} max={60} step={1}
              onChange={(v) => set("gravity", v)} />
            <Slider label={pick("Отскок (restitution)", "Bounce (restitution)", locale)} value={ui.restitution} min={0} max={0.7} step={0.02}
              onChange={(v) => set("restitution", v)} fmt={(v) => v.toFixed(2)} />
            <Slider label={pick("Трение", "Friction", locale)} value={ui.friction} min={0} max={1} step={0.02}
              onChange={(v) => set("friction", v)} fmt={(v) => v.toFixed(2)} />
            <Slider label={pick("Размер кубика", "Cube size", locale)} value={ui.cubeScale} min={0.35} max={1.1} step={0.02}
              onChange={(v) => set("cubeScale", v)} fmt={(v) => v.toFixed(2)} />

            <hr className="border-white/10" />

            <Slider label={pick("Скорость спавна (куб/с)", "Spawn rate (cubes/s)", locale)} value={ui.spawnRate} min={2} max={80} step={1}
              onChange={(v) => set("spawnRate", v)} />
            <Slider label={pick("Макс. кубов", "Max cubes", locale)} value={ui.maxCubes} min={5} max={90} step={1}
              onChange={(v) => set("maxCubes", v)} />

            <label className="flex items-center justify-between text-[12px] text-white/70">
              <span>{pick("Сыпать без курсора", "Rain without cursor", locale)}</span>
              <input type="checkbox" checked={ui.autoRain}
                onChange={(e) => set("autoRain", e.target.checked)} className="accent-white/80 w-4 h-4" />
            </label>

            <button
              onClick={() => { paramsRef.current = { ...DEFAULT_PARAMS }; setUi({ ...DEFAULT_PARAMS }); }}
              className="w-full h-9 rounded-lg border border-white/15 text-[12px] text-white/60 hover:text-white hover:border-white/40 transition-colors"
            >
              {pick("Сбросить к дефолту", "Reset to defaults", locale)}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

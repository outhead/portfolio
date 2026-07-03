"use client";

/* Песочница визуального апгрейда головоломки менторинга.
   Служебный роут, в навигации нет. Слева сцена (V2 или прод-V1 для
   сравнения), справа крутилки параметров V2. */

import { useRef, useState } from "react";
import ConstellationFigures from "@/components/ConstellationFigures";
import ConstellationFiguresV2, { V2_DEFAULTS, type V2Params } from "@/components/ConstellationFiguresV2";
import ConstellationFiguresV3, {
  V3_STYLE_DEFAULTS,
  type GemStyle,
  type RayStyle,
  type TargetStyle,
  type V3Style,
} from "@/components/ConstellationFiguresV3";
import { MENTORING_LEVEL } from "@/lib/optics";
import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";

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
  const locale = useLocale();
  const paramsRef = useRef<V2Params>({ ...V2_DEFAULTS });
  const [ui, setUi] = useState<V2Params>({ ...V2_DEFAULTS });
  const [mode, setMode] = useState<"v3" | "v2" | "v1">("v3");
  const [nonce, setNonce] = useState(0); // пересоздать сцену (reset)
  const [solved, setSolved] = useState(false);

  const set = <K extends keyof V2Params>(k: K, v: V2Params[K]) => {
    paramsRef.current[k] = v;
    setUi((prev) => ({ ...prev, [k]: v }));
  };

  const styleRef = useRef<V3Style>({ ...V3_STYLE_DEFAULTS });
  const [styleUi, setStyleUi] = useState<V3Style>({ ...V3_STYLE_DEFAULTS });
  const setStyle = <K extends keyof V3Style>(k: K, v: V3Style[K]) => {
    styleRef.current[k] = v;
    setStyleUi((prev) => ({ ...prev, [k]: v }));
  };
  const applyPreset = (s: V3Style) => {
    styleRef.current = { ...s };
    setStyleUi({ ...s });
  };

  const GEMS: Array<{ v: GemStyle; ru: string; en: string }> = [
    { v: "octa", ru: "3D-каркас", en: "3D wire" },
    { v: "brilliant", ru: "Гранёный", en: "Faceted" },
    { v: "crystal", ru: "Хрусталь", en: "Crystal" },
    { v: "pixel", ru: "Пиксельный", en: "Pixel" },
    { v: "cluster", ru: "Друза", en: "Cluster" },
  ];
  const RAYS: Array<{ v: RayStyle; ru: string; en: string }> = [
    { v: "dots", ru: "Точки", en: "Dots" },
    { v: "thread", ru: "Нить", en: "Thread" },
    { v: "double", ru: "Двойной", en: "Double" },
    { v: "comet", ru: "Кометы", en: "Comets" },
    { v: "wave", ru: "Волна", en: "Wave" },
  ];
  const TARGETS: Array<{ v: TargetStyle; ru: string; en: string }> = [
    { v: "ring", ru: "Круг", en: "Ring" },
    { v: "crosshair", ru: "Прицел", en: "Crosshair" },
    { v: "iris", ru: "Диафрагма", en: "Iris" },
    { v: "rings2", ru: "Два кольца", en: "Two rings" },
    { v: "brackets", ru: "Скобки", en: "Brackets" },
  ];

  return (
    <main className="min-h-screen bg-[#080807] text-white px-4 py-8 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-lg font-medium tracking-tight">Optics sandbox</h1>
          <span className="text-[11px] text-white/40">{solved ? pick("решено ✓", "solved ✓", locale) : pick("двигай кристаллы", "move the crystals", locale)}</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* сцена */}
          <div>
            <div className="relative aspect-[16/12] md:aspect-[16/10] rounded-2xl overflow-hidden bg-[#0b0b0a] border border-white/[0.06]">
              {mode === "v3" ? (
                <ConstellationFiguresV3
                  key={`v3-${nonce}`}
                  className="absolute inset-0"
                  level={MENTORING_LEVEL}
                  lockMirror
                  paramsRef={paramsRef}
                  styleRef={styleRef}
                  onSolve={() => setSolved(true)}
                />
              ) : mode === "v2" ? (
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
              {(["v3", "v2", "v1"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setSolved(false); setNonce((n) => n + 1); }}
                  className={`h-8 px-3 rounded-lg text-[12px] border transition-colors ${
                    mode === m ? "border-white/70 text-white bg-white/10" : "border-white/15 text-white/50 hover:text-white/80"
                  }`}
                >
                  {m === "v3"
                    ? pick("V3 — псевдо-3D", "V3 — pseudo-3D", locale)
                    : m === "v2"
                      ? pick("V2 — как на проде", "V2 — as in prod", locale)
                      : pick("V1 — старая", "V1 — legacy", locale)}
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
            {/* Стили V3: кристалл / луч / цель + пресеты */}
            {mode === "v3" && (
              <div className="space-y-4 pb-4 border-b border-white/[0.08]">
                <div className="text-[11px] uppercase tracking-wider text-white/50">{pick("Стили V3", "V3 styles", locale)}</div>
                {([
                  { label: pick("Кристалл", "Crystal", locale), items: GEMS, k: "gem" as const },
                  { label: pick("Луч", "Ray", locale), items: RAYS, k: "ray" as const },
                  { label: pick("Цель", "Target", locale), items: TARGETS, k: "target" as const },
                ]).map((g) => (
                  <div key={g.k}>
                    <div className="text-[10px] uppercase tracking-wider text-white/35 mb-1.5">{g.label}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {g.items.map((it) => (
                        <button
                          key={it.v}
                          onClick={() => setStyle(g.k, it.v as never)}
                          className={`h-7 px-2.5 rounded-md text-[11px] border transition-colors ${
                            styleUi[g.k] === it.v
                              ? "border-white/70 text-white bg-white/10"
                              : "border-white/15 text-white/50 hover:text-white/80"
                          }`}
                        >
                          {pick(it.ru, it.en, locale)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => applyPreset({ gem: "pixel", ray: "thread", target: "brackets" })}
                    className="h-7 px-2.5 rounded-md text-[11px] border border-[#A6FF00]/40 text-[#A6FF00]/90 hover:bg-[#A6FF00]/10 transition-colors"
                  >
                    {pick("Пресет: LED", "Preset: LED", locale)}
                  </button>
                  <button
                    onClick={() => applyPreset({ gem: "crystal", ray: "comet", target: "iris" })}
                    className="h-7 px-2.5 rounded-md text-[11px] border border-white/25 text-white/70 hover:bg-white/10 transition-colors"
                  >
                    {pick("Пресет: Хрусталь", "Preset: Crystal", locale)}
                  </button>
                  <button
                    onClick={() => applyPreset({ ...V3_STYLE_DEFAULTS })}
                    className="h-7 px-2.5 rounded-md text-[11px] border border-white/15 text-white/50 hover:text-white/80 transition-colors"
                  >
                    {pick("Сброс", "Reset", locale)}
                  </button>
                </div>
              </div>
            )}
            <div className="text-[11px] uppercase tracking-wider text-white/50">{pick("Параметры V2", "V2 parameters", locale)}</div>
            <Slider label={pick("Скорость луча", "Ray speed", locale)} value={ui.raySpeed} min={0} max={80} step={2} onChange={(v) => set("raySpeed", v)} />
            <Slider label={pick("Шаг точек луча", "Ray dot spacing", locale)} value={ui.rayStep} min={4} max={14} step={1} onChange={(v) => set("rayStep", v)} />
            <Slider label={pick("Размер кристаллов", "Crystal size", locale)} value={ui.gemSize} min={7} max={14} step={1} onChange={(v) => set("gemSize", v)} />
            <Slider label={pick("Глоу", "Glow", locale)} value={ui.glow} min={0} max={2} step={0.1} onChange={(v) => set("glow", v)} />
            <label className="flex items-center gap-2 text-[12px] text-white/70">
              <input
                type="checkbox"
                checked={ui.particles}
                onChange={(e) => set("particles", e.target.checked)}
                className="accent-white/80"
              />
              {pick("Искры и конфетти", "Sparks and confetti", locale)}
            </label>
            <p className="text-[11px] leading-relaxed text-white/35">
              {pick(
                "Что нового: бегущие лучи с дизерингом, кристаллы с гранью-бликом и дыханием, ромбы-цели с пульсом и огоньком, искры при попадании, хвост при перетаскивании, ховер-фидбек. Тач-зоны увеличены.",
                "What's new: running rays with dithering, crystals with a facet highlight and breathing, target diamonds with a pulse and a glint, sparks on hit, a trail while dragging, hover feedback. Touch zones enlarged.",
                locale,
              )}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

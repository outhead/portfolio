"use client";

/* ─────────────────────────────────────────────────────────────────
 * FontSpecimen — интерактивный спесимен LED-движка для кейса led-font-engine.
 * Не картинка глифов, а живой рендер на том же движке, что и весь сайт:
 *   • отдельные поля — Кириллица / Latin / Цифры / Знаки;
 *   • переключатель размерностей (Подпись / Заголовок / Табло);
 *   • ручки «Точка» и «Детализация» — те самые три параметра движка;
 *   • type-tester: RU/EN/своё слово рендерится крупно теми же точками.
 * ──────────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react";
import { LED_GLYPHS } from "@/components/ledFont";
import LedText from "@/components/LedText";
import { LedLines } from "@/components/LedBoard";
import GlyphEditor from "@/components/GlyphEditor";

const PITCH = 4;
const LED_ROWS = 7;

/* ── Категоризация всех глифов движка по полям ── */
const ALL_KEYS = Object.keys(LED_GLYPHS).filter((k) => k !== " ");
const isCyr = (c: string) => /[А-Я]/.test(c);
const isLat = (c: string) => /[A-Z]/.test(c);
const isNum = (c: string) => /[0-9]/.test(c);

const GROUPS: { id: string; label: string; chars: string[] }[] = [
  { id: "cyr", label: "Кириллица", chars: ALL_KEYS.filter(isCyr).sort((a, b) => a.localeCompare(b, "ru")) },
  { id: "lat", label: "Latin", chars: ALL_KEYS.filter(isLat).sort() },
  { id: "num", label: "Цифры", chars: ALL_KEYS.filter(isNum).sort() },
  {
    id: "sym",
    label: "Знаки",
    chars: ALL_KEYS.filter((c) => !isCyr(c) && !isLat(c) && !isNum(c)),
  },
];

/* ── Размерности шрифта: пресеты трёх режимов ── */
type Preset = { id: string; label: string; cellH: number; dot: number; scale: number };
const PRESETS: Preset[] = [
  { id: "sign", label: "Подпись", cellH: 16, dot: 1.6, scale: 1 },
  { id: "head", label: "Заголовок", cellH: 28, dot: 1.4, scale: 2 },
  { id: "board", label: "Табло", cellH: 44, dot: 1.05, scale: 2 },
];

/* ── Одиночный глиф: рендер всех диодов (горящие + погашенные) ── */
function GlyphMatrix({
  char,
  dot,
  scale,
  grid,
  cellH,
}: {
  char: string;
  dot: number;
  scale: number;
  grid: boolean;
  cellH: number;
}) {
  const g = LED_GLYPHS[char];
  if (!g) return null;
  const w = g[0].length;
  const cols = w * scale;
  const rows = LED_ROWS * scale;
  const lit: { x: number; y: number }[] = [];
  const off: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const on = g[Math.floor(r / scale)][Math.floor(c / scale)] === "1";
      const p = { x: c * PITCH + PITCH / 2, y: r * PITCH + PITCH / 2 };
      (on ? lit : off).push(p);
    }
  }
  return (
    <svg
      viewBox={`0 0 ${cols * PITCH} ${rows * PITCH}`}
      style={{ height: cellH, width: "auto" }}
      aria-hidden
      focusable="false"
      className="overflow-visible"
    >
      {grid &&
        off.map((p, i) => (
          <circle key={`o${i}`} cx={p.x} cy={p.y} r={dot} className="fill-current opacity-[0.08]" />
        ))}
      {lit.map((p, i) => (
        <circle key={`l${i}`} cx={p.x} cy={p.y} r={dot} fill="currentColor" />
      ))}
    </svg>
  );
}

const CAPTION: Record<string, string> = { " ": "␣" };

export default function FontSpecimen() {
  const [presetId, setPresetId] = useState("head");
  const preset = PRESETS.find((p) => p.id === presetId)!;
  const [dot, setDot] = useState(preset.dot);
  const [scale, setScale] = useState(preset.scale);
  const [grid, setGrid] = useState(true);

  const [tester, setTester] = useState("Привет, World");

  function applyPreset(p: Preset) {
    setPresetId(p.id);
    setDot(p.dot);
    setScale(p.scale);
  }

  const SAMPLES = useMemo(
    () => [
      { id: "ru", label: "RU", text: "Съешь ещё этих булок" },
      { id: "en", label: "EN", text: "The quick brown fox" },
      { id: "mix", label: "0-9", text: "0123456789 +-© @" },
    ],
    [],
  );

  return (
    <div className="mt-8 md:mt-10 rounded-2xl border border-white/[0.07] bg-[#0b0b0a] overflow-hidden">
      {/* ── Управление: размерности + ручки ── */}
      <div className="px-5 md:px-8 py-6 border-b border-white/[0.06] flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          {/* Размерность — сегменты */}
          <div className="flex items-center gap-3">
            <span className="text-white/35">
              <LedText text="Размер" className="h-[9px] w-auto" />
            </span>
            <div className="flex gap-1.5 p-1 rounded-full bg-white/[0.04]">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`px-3.5 py-1.5 rounded-full transition-colors ${
                    presetId === p.id
                      ? "bg-[#A6FF00] text-black"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  <span className="sr-only">{p.label}</span>
                  <LedText text={p.label} className="h-[8px] w-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Сетка вкл/выкл */}
          <button
            type="button"
            onClick={() => setGrid((v) => !v)}
            className={`px-3.5 py-1.5 rounded-full border transition-colors ${
              grid
                ? "border-[#A6FF00]/50 text-[#A6FF00]"
                : "border-white/15 text-white/45 hover:text-white"
            }`}
          >
            <span className="sr-only">Показывать погашенные диоды</span>
            <LedText text="Сетка диодов" className="h-[8px] w-auto" />
          </button>
        </div>

        {/* Ручки движка */}
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 max-w-[640px]">
          <label className="flex items-center gap-3 text-white/45">
            <span className="w-24 shrink-0">
              <LedText text="Точка" className="h-[8px] w-auto" />
            </span>
            <input
              type="range"
              min={0.8}
              max={2}
              step={0.05}
              value={dot}
              onChange={(e) => setDot(Number(e.target.value))}
              className="flex-1 accent-[#A6FF00]"
              aria-label="Радиус точки"
            />
            <span className="w-10 text-right text-[14px] tabular-nums">{dot.toFixed(2)}</span>
          </label>
          <label className="flex items-center gap-3 text-white/45">
            <span className="w-24 shrink-0">
              <LedText text="Детализация" className="h-[8px] w-auto" />
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={1}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="flex-1 accent-[#A6FF00]"
              aria-label="Апскейл битмапы"
            />
            <span className="w-10 text-right text-[14px] tabular-nums">×{scale}</span>
          </label>
        </div>
      </div>

      {/* ── Поля глифов: весь шрифт ── */}
      <div className="px-5 md:px-8 py-7 flex flex-col gap-9 border-b border-white/[0.06]">
        {GROUPS.map((group) => (
          <section key={group.id}>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-white/45">
                <LedText text={group.label} className="h-[10px] w-auto" />
              </span>
              <span className="text-[12px] tabular-nums text-white/25">{group.chars.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.chars.map((char) => (
                <div
                  key={char}
                  title={char}
                  className="group relative flex flex-col items-center justify-end gap-2 rounded-lg border border-white/[0.06] bg-black px-2.5 py-3 min-w-[52px] hover:border-[#A6FF00]/45 hover:bg-[#A6FF00]/[0.03] transition-colors"
                >
                  <div className="flex items-center justify-center flex-1 text-white/85 group-hover:text-[#A6FF00] transition-colors">
                    <GlyphMatrix char={char} dot={dot} scale={scale} grid={grid} cellH={preset.cellH} />
                  </div>
                  <div className="text-[12px] leading-none text-white/30 group-hover:text-white/60 tabular-nums transition-colors">
                    {CAPTION[char] ?? char}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="text-[14px] text-white/35 leading-relaxed">
          Весь набор — кириллица, латиница, цифры и знаки. Всё, что выше, нарисовано
          прямо сейчас тем же движком 5×7, что рендерит весь сайт: это не картинки, а карта
          зажжённых диодов.
        </div>
      </div>

      {/* ── Интерактив: набери своё ── */}
      <div
        className="relative px-5 md:px-8 py-8 md:py-10 border-b border-white/[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(166,255,0,0.05) 1.1px, transparent 1.3px)",
          backgroundSize: "8px 8px",
        }}
      >
        <div className="text-white/35 mb-5">
          <LedText text="Набери своё" className="h-[9px] w-auto" />
        </div>
        <div className="text-[#A6FF00] max-w-full min-h-[44px] md:min-h-[60px] flex items-center">
          <LedLines
            text={(tester.trim() || "...").toUpperCase()}
            maxChars={16}
            scale={2}
            dot={1.2}
            lineClass="h-[26px] md:h-[40px]"
          />
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
          <input
            type="text"
            value={tester}
            maxLength={28}
            onChange={(e) => setTester(e.target.value)}
            placeholder="Набери своё…"
            aria-label="Текст для спесимена"
            className="flex-1 bg-white/[0.04] border border-white/15 focus:border-[#A6FF00]/60 outline-none rounded-xl px-4 py-3 text-[16px] text-white placeholder:text-white/30 transition-colors"
          />
          <div className="flex gap-2">
            {SAMPLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setTester(s.text)}
                className="px-3.5 py-2 rounded-full border border-white/15 text-white/55 hover:text-[#A6FF00] hover:border-[#A6FF00]/50 transition-colors"
              >
                <span className="sr-only">{s.label}</span>
                <LedText text={s.label} className="h-[9px] w-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Свой глиф: мини-рисовалка с сохранением ── */}
      <div className="px-5 md:px-8 py-7">
        <div className="text-white/35 mb-5">
          <LedText text="Нарисуй свой глиф" className="h-[9px] w-auto" />
        </div>
        <GlyphEditor />
      </div>
    </div>
  );
}

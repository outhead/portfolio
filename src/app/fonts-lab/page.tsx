"use client";

/* ─────────────────────────────────────────────────────────────────
 * /fonts-lab — примерка шрифтов для «служебного слоя» (лейблы,
 * подписи, чипы) и опционально боди. LED-шрифт не трогаем — он свой.
 * Свитчер сверху, ниже — живые паттерны сайта в выбранном варианте.
 * Служебная страница, в проде не линкуется.
 * ──────────────────────────────────────────────────────────────── */

import { useState } from "react";
import {
  IBM_Plex_Mono,
  Handjet,
  Rubik_Pixels,
  Rubik_80s_Fade,
  Rubik_Glitch,
  Tektur,
} from "next/font/google";
import localFont from "next/font/local";
import LedText from "@/components/LedText";
import { LedLines, LedCounter } from "@/components/LedBoard";
import { Oled } from "@/components/OledKit";
import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-lab-plex",
});
const handjet = Handjet({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-lab-handjet",
});
// Пиксельно-стилизованные с кириллицей (Google Fonts metadata, проверено)
const rubikPixels = Rubik_Pixels({
  subsets: ["latin", "cyrillic"],
  weight: "400",
  variable: "--font-lab-rpx",
});
const rubik80s = Rubik_80s_Fade({
  subsets: ["latin", "cyrillic"],
  weight: "400",
  variable: "--font-lab-r80",
});
const rubikGlitch = Rubik_Glitch({
  subsets: ["latin", "cyrillic"],
  weight: "400",
  variable: "--font-lab-rgl",
});
const tektur = Tektur({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-lab-tektur",
});
// Локальные аутентичные битмапы с кириллицей (скачаны Егором, лежат в public/fonts)
const ibmVga = localFont({
  src: "../../../public/fonts/int10h_ibm_vga_8x16.woff",
  variable: "--font-lab-vga",
  display: "swap",
});
const cozette = localFont({
  src: "../../../public/fonts/CozetteVector.ttf",
  variable: "--font-lab-cozette",
  display: "swap",
});
const unifont = localFont({
  src: "../../../public/fonts/unifont-17.0.04.otf",
  variable: "--font-lab-unifont",
  display: "swap",
});

const VARIANTS = [
  { id: "plex", name: "IBM Plex Mono", css: "var(--font-lab-plex)" },
  { id: "handjet", name: "Handjet", css: "var(--font-lab-handjet)" },
  { id: "rpx", name: "Rubik Pixels", css: "var(--font-lab-rpx)" },
  { id: "r80", name: "Rubik 80s Fade", css: "var(--font-lab-r80)" },
  { id: "rgl", name: "Rubik Glitch", css: "var(--font-lab-rgl)" },
  { id: "tektur", name: "Tektur", css: "var(--font-lab-tektur)" },
  { id: "vga", name: "IBM VGA · CP866 (DOS/Norton)", css: "var(--font-lab-vga)" },
  { id: "cozette", name: "Cozette", css: "var(--font-lab-cozette)" },
  { id: "unifont", name: "GNU Unifont", css: "var(--font-lab-unifont)" },
] as const;

export default function FontsLab() {
  const locale = useLocale();
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]>(VARIANTS[0]);
  const [applyBody, setApplyBody] = useState(false);

  const service = { fontFamily: variant.css };
  const body = applyBody ? { fontFamily: variant.css } : undefined;

  return (
    <main
      className={`min-h-screen bg-black text-white px-5 md:px-[8%] py-24 ${plexMono.variable} ${handjet.variable} ${rubikPixels.variable} ${rubik80s.variable} ${rubikGlitch.variable} ${tektur.variable} ${ibmVga.variable} ${cozette.variable} ${unifont.variable}`}
    >
      <div className="max-w-[1100px] mx-auto flex flex-col gap-10">
        {/* Шапка лаборатории */}
        <div className="flex flex-col gap-4">
          <div className="text-white/40">
            <LedText text={pick("Лаборатория", "Lab", locale)} className="h-[10px] w-auto" />
          </div>
          <h1 className="text-white">
            <LedLines text={pick("Шрифт служебного слоя", "Utility layer typeface", locale)} maxChars={24} lineClass="h-[18px] md:h-[22px]" />
          </h1>
        </div>

        {/* Свитчер */}
        <div className="flex flex-wrap items-center gap-2">
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVariant(v)}
              className={`px-4 py-2 rounded-full border transition-colors text-[14px] tracking-[0.04em] ${
                variant.id === v.id
                  ? "border-[#A6FF00]/60 text-[#A6FF00] bg-[#A6FF00]/10"
                  : "border-white/15 text-white/60 hover:text-white hover:border-white/30"
              }`}
              style={{ fontFamily: v.css }}
            >
              {v.name}
            </button>
          ))}
          <label className="ml-2 inline-flex items-center gap-2 text-[14px] text-white/50 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={applyBody}
              onChange={(e) => setApplyBody(e.target.checked)}
              className="accent-[#A6FF00]"
            />
            {pick("применить и к боди", "apply to body too", locale)}
          </label>
        </div>

        {/* ── Паттерн: лейблы + цифры (блок «в цифрах») ── */}
        <Oled className="p-6 md:p-8">
          <div className="flex justify-start gap-12 md:gap-16">
            {[
              { v: "30", l: pick("запусков", "launches", locale) },
              { v: "11", l: pick("лет в дизайне", "years in design", locale) },
              { v: "27", l: pick("команд", "teams", locale) },
            ].map((m) => (
              <div key={m.l} className="flex flex-col gap-4">
                <LedCounter value={m.v} tone="#C9A66B" />
                <span
                  className="text-[12px] md:text-[14px] uppercase tracking-[0.08em] text-white/40"
                  style={service}
                >
                  {m.l}
                </span>
              </div>
            ))}
          </div>
        </Oled>

        {/* ── Паттерн: список экспертизы — лейбл + note ── */}
        <Oled className="p-6 md:p-8">
          <div
            className="mb-5 text-[12px] uppercase tracking-[0.1em] text-white/40"
            style={service}
          >
            {pick("Экспертиза", "Expertise", locale)}
          </div>
          <ul className="flex flex-col">
            {[
              { num: "01", label: pick("Управление", "Leadership", locale), note: pick("дизайн-функции и команды", "design functions and teams", locale) },
              { num: "02", label: pick("Направления", "Domains", locale), note: "B2C / B2E / EdTech / E-com" },
              { num: "03", label: pick("Ремесло", "Craft", locale), note: pick("процессы и применение AI", "processes and applying AI", locale) },
            ].map((item) => (
              <li key={item.num} className="flex items-center gap-4 py-3.5 border-b border-white/[0.05] last:border-0">
                <span className="w-7 shrink-0 text-[12px] text-[#C9A66B]/70" style={service}>
                  {item.num}
                </span>
                <span className="text-white">
                  <LedText text={item.label} className="h-[11px] w-auto" />
                </span>
                <span
                  className="text-[12px] md:text-[14px] uppercase tracking-[0.06em] text-white/45"
                  style={service}
                >
                  {item.note}
                </span>
              </li>
            ))}
          </ul>
        </Oled>

        {/* ── Паттерн: боди-абзац рядом с LED-заголовком ── */}
        <Oled className="p-6 md:p-8 flex flex-col gap-5">
          <h2 className="text-white">
            <LedLines text={pick("Сейчас мне интересна связка дизайн и AI", "Right now I'm into design and AI together", locale)} maxChars={26} lineClass="h-[13px] md:h-[15px]" />
          </h2>
          <p className="max-w-[560px] text-[16px] md:text-[16px] leading-relaxed text-white/70" style={body}>
            {pick(
              "Менторю дизайнеров и лидов, экспериментирую сам, пишу код. Иногда поделки получаются криво, но это часть процесса. От стратегии и культуры до AI и цифровых продуктов.",
              "I mentor designers and leads, experiment myself, and write code. Sometimes the side projects come out rough, but that's part of the process. From strategy and culture to AI and digital products.",
              locale,
            )}
          </p>
          <div className="flex gap-2">
            {["Mentorship", "AI Agents", "Claude Code"].map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/15 bg-black/40 text-[12px] tracking-[0.08em] uppercase text-white/80"
                style={service}
              >
                {t}
              </span>
            ))}
          </div>
        </Oled>

        {/* ── Контрольная строка: цифры/латиница/кириллица ── */}
        <Oled className="p-6 md:p-8">
          <div className="text-[14px] leading-loose text-white/60" style={service}>
            АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ абвгдежзиклмноп 0123456789 — B2C / B2E ·
            EdTech · 30+ менти · CX-24 · «ёлки» (скобки) [метки] 17:45
          </div>
        </Oled>
      </div>
    </main>
  );
}

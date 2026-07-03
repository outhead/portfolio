"use client";

/* ─────────────────────────────────────────────────────────────────
 * /hero-lab — сравнение трёх режимов оживления хиро-табло.
 * Временная лаб-страница: выбираем характер, потом ставим в живой хиро.
 * ──────────────────────────────────────────────────────────────── */

import LedText from "@/components/LedText";
import { Oled } from "@/components/OledKit";
import HeroBoard from "@/components/HeroBoard";
import type { LedLine } from "@/components/LedBoard";
import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";

const heroLinesRu: LedLine[] = [
  { text: "7 ЛЕТ", color: "#F2F4EF" },
  { text: "РАЗВИВАЮ", color: "#F2F4EF" },
  { words: ["ЛЮДЕЙ", "КОМАНДЫ", "ВИЗУАЛ", "СЕРВИСЫ", "ИНТЕРЕС"], color: "#A6FF00" },
];

const heroLinesEn: LedLine[] = [
  { text: "7 YEARS", color: "#F2F4EF" },
  { text: "GROWING", color: "#F2F4EF" },
  { words: ["PEOPLE", "TEAMS", "VISUALS", "SERVICES", "INTEREST"], color: "#A6FF00" },
];

const VARIANTS: { mode: "reactive" | "cinematic" | "calm"; title: string; titleEn: string; note: string; noteEn: string }[] = [
  { mode: "reactive", title: "1 · Реактив на курсор", titleEn: "1 · Cursor-reactive", note: "Веди мышью по табло — точки оживают: гало и лаймовая рябь идут за курсором, фон откликается.", noteEn: "Move the mouse across the board — the dots come alive: a halo and a lime ripple follow the cursor, the background responds." },
  { mode: "cinematic", title: "2 · Кинематичный авто-цикл", titleEn: "2 · Cinematic auto-loop", note: "Ничего не надо делать: волна-блик идёт по буквам, сменное слово собирается из точек. Как табло в аэропорту.", noteEn: "Nothing to do: a wave of light runs across the letters and the rotating word assembles from dots. Like an airport board." },
  { mode: "calm", title: "3 · Сдержанность + композиция", titleEn: "3 · Restraint + composition", note: "Текст по центру, мёртвое поле убрано, крупнее и чище. По наведению — мягкий светлый блик за курсором.", noteEn: "Text centered, dead space removed, larger and cleaner. On hover — a soft light glow trailing the cursor." },
];

export default function HeroLab() {
  const locale = useLocale();
  const heroLines = pick(heroLinesRu, heroLinesEn, locale);
  return (
    <main className="min-h-screen bg-black text-white px-5 md:px-[8%] pt-28 md:pt-32 pb-20">
      <div className="max-w-[1000px] mx-auto flex flex-col gap-4">
        <div className="text-white/40">
          <LedText text={pick("Лаб · хиро-табло", "Lab · hero board", locale)} className="h-[10px] w-auto" />
        </div>
        <p className="text-[14px] md:text-[15px] text-white/55 max-w-[560px]">
          {pick(
            "Три характера оживления одного и того же табло. Наведи мышь на каждое, посмотри в покое. Скажи номер — поставлю в живой хиро на главной.",
            "Three ways of bringing the same board to life. Hover over each one, watch it at rest. Name a number and I'll drop it into the live hero on the homepage.",
            locale,
          )}
        </p>

        <div className="flex flex-col gap-8 mt-4">
          {VARIANTS.map((v) => (
            <section key={v.mode} className="flex flex-col gap-3">
              <div className="flex items-baseline gap-3">
                <span className="text-[#A6FF00]">
                  <LedText text={pick(v.title, v.titleEn, locale)} className="h-[11px] w-auto" />
                </span>
              </div>
              <Oled className="p-5 md:p-8">
                <HeroBoard lines={heroLines} mode={v.mode} scale={2} className="w-full max-w-[640px]" />
                <p className="font-service mt-5 max-w-[460px] text-[15px] md:text-[18px] leading-snug text-white/55">
                  {pick("От стратегии и культуры до AI и цифровых продуктов.", "From strategy and culture to AI and digital products.", locale)}
                </p>
              </Oled>
              <p className="text-[13px] text-white/40 max-w-[560px]">{pick(v.note, v.noteEn, locale)}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

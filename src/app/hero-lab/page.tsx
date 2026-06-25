"use client";

/* ─────────────────────────────────────────────────────────────────
 * /hero-lab — сравнение трёх режимов оживления хиро-табло.
 * Временная лаб-страница: выбираем характер, потом ставим в живой хиро.
 * ──────────────────────────────────────────────────────────────── */

import LedText from "@/components/LedText";
import { Oled } from "@/components/OledKit";
import HeroBoard from "@/components/HeroBoard";
import type { LedLine } from "@/components/LedBoard";

const heroLines: LedLine[] = [
  { text: "7 ЛЕТ", color: "#F2F4EF" },
  { text: "РАЗВИВАЮ", color: "#F2F4EF" },
  { words: ["ЛЮДЕЙ", "КОМАНДЫ", "ВИЗУАЛ", "СЕРВИСЫ", "ИНТЕРЕС"], color: "#A6FF00" },
];

const VARIANTS: { mode: "reactive" | "cinematic" | "calm"; title: string; note: string }[] = [
  { mode: "reactive", title: "1 · Реактив на курсор", note: "Веди мышью по табло — точки оживают: гало и лаймовая рябь идут за курсором, фон откликается." },
  { mode: "cinematic", title: "2 · Кинематичный авто-цикл", note: "Ничего не надо делать: волна-блик идёт по буквам, сменное слово собирается из точек. Как табло в аэропорту." },
  { mode: "calm", title: "3 · Сдержанность + композиция", note: "Текст по центру, мёртвое поле убрано, крупнее и чище. По наведению — мягкий светлый блик за курсором." },
];

export default function HeroLab() {
  return (
    <main className="min-h-screen bg-black text-white px-5 md:px-[8%] pt-28 md:pt-32 pb-20">
      <div className="max-w-[1000px] mx-auto flex flex-col gap-4">
        <div className="text-white/40">
          <LedText text="Лаб · хиро-табло" className="h-[10px] w-auto" />
        </div>
        <p className="text-[14px] md:text-[15px] text-white/55 max-w-[560px]">
          Три характера оживления одного и того же табло. Наведи мышь на каждое,
          посмотри в покое. Скажи номер — поставлю в живой хиро на главной.
        </p>

        <div className="flex flex-col gap-8 mt-4">
          {VARIANTS.map((v) => (
            <section key={v.mode} className="flex flex-col gap-3">
              <div className="flex items-baseline gap-3">
                <span className="text-[#A6FF00]">
                  <LedText text={v.title} className="h-[11px] w-auto" />
                </span>
              </div>
              <Oled className="p-5 md:p-8">
                <HeroBoard lines={heroLines} mode={v.mode} scale={2} className="w-full max-w-[640px]" />
                <p className="font-service mt-5 max-w-[460px] text-[15px] md:text-[18px] leading-snug text-white/55">
                  От стратегии и культуры до AI и цифровых продуктов.
                </p>
              </Oled>
              <p className="text-[13px] text-white/40 max-w-[560px]">{v.note}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

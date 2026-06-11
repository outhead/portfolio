"use client";

/* Превью пиксельных заглушек карточек кейсов (PixelCube).
   Роут служебный, в навигации нет. Сравнение: покой ↔ ховер. */

import LedText from "@/components/LedText";
import { LedLines } from "@/components/LedBoard";
import PixelCube from "@/components/PixelCube";
import PixelCube3D from "@/components/PixelCube3D";
import { ArrowUpRight } from "lucide-react";

const MTS_RED = "#FF2436";

function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/15 bg-black/40 text-[12px] md:text-[13px] tracking-[0.08em] uppercase text-white/80 leading-[1.2] backdrop-blur-sm">
      {children}
    </span>
  );
}

/** Карточка-прототип: окно с PixelCube вместо видео/глянца. */
function PrototypeCard({ active = false }: { active?: boolean }) {
  return (
    <div className="no-underline group h-full block w-full max-w-[520px]">
      <article className="relative rounded-2xl overflow-hidden bg-[#0f0f0e] border border-white/[0.06] group-hover:border-white/20 transition-colors duration-300 h-full">
        <div className="h-full flex flex-col p-3 md:p-4 pb-0 md:pb-0">
          {/* Медиа-окно */}
          <div className="relative w-full aspect-[16/9] rounded-xl border border-white/[0.08] overflow-hidden bg-black/40 flex items-center justify-center">
            {/* фоновая dot-сетка окна — тихий контекст */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.5]"
              style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1.4px)",
                backgroundSize: "12px 12px",
              }}
            />
            <PixelCube
              color={MTS_RED}
              active={active}
              className="relative h-[64%]"
              logo={
                <span className="text-white">
                  <LedText text="МТС" className="h-[14px] w-auto" />
                </span>
              }
            />
            {/* hover-стрелка */}
            <div className="absolute top-3 right-3 md:top-4 md:right-4 w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/20 flex items-center justify-center bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 z-[3]">
              <ArrowUpRight className="w-4 h-4 text-white/90" strokeWidth={2} />
            </div>
            {/* компания — верхний левый угол */}
            <div className="absolute top-4 left-4 md:top-5 md:left-5 z-[2] text-white/75 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              <LedText text="МТС" className="h-[9px] md:h-[10px] w-auto" />
            </div>
          </div>
          {/* Заголовок */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4 md:gap-5 text-center px-5 py-6 md:py-7">
            <h3 className="text-white max-w-full">
              <LedLines
                text="Дать МТС голос и собрать Мой МТС в платформу"
                center
                maxChars={22}
                lineClass="h-[15px] md:h-[18px]"
              />
            </h3>
            <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
              <TagChip>B2C</TagChip>
              <TagChip>Ecosystem</TagChip>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

/** Карточка с настоящим 3D-кубом, спроецированным в дот-матрицу. */
function PrototypeCard3D() {
  return (
    <div className="no-underline group h-full block w-full max-w-[520px]">
      <article className="relative rounded-2xl overflow-hidden bg-[#0f0f0e] border border-white/[0.06] group-hover:border-white/20 transition-colors duration-300 h-full">
        <div className="h-full flex flex-col p-3 md:p-4 pb-0 md:pb-0">
          <div className="relative w-full aspect-[16/9] rounded-xl border border-white/[0.08] overflow-hidden bg-black/40 flex items-center justify-center">
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.5]"
              style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1.4px)",
                backgroundSize: "12px 12px",
              }}
            />
            <PixelCube3D color={MTS_RED} logoText="МТС" className="relative h-[78%]" />
            <div className="absolute top-3 right-3 md:top-4 md:right-4 w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/20 flex items-center justify-center bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 z-[3]">
              <ArrowUpRight className="w-4 h-4 text-white/90" strokeWidth={2} />
            </div>
            <div className="absolute top-4 left-4 md:top-5 md:left-5 z-[2] text-white/75 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              <LedText text="МТС" className="h-[9px] md:h-[10px] w-auto" />
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-4 md:gap-5 text-center px-5 py-6 md:py-7">
            <h3 className="text-white max-w-full">
              <LedLines text="Дать МТС голос и собрать Мой МТС в платформу" center maxChars={22} lineClass="h-[15px] md:h-[18px]" />
            </h3>
            <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
              <TagChip>B2C</TagChip>
              <TagChip>Ecosystem</TagChip>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

export default function CardsLabPage() {
  return (
    <main className="min-h-screen bg-black px-5 md:px-[8%] py-16 md:py-24">
      <div className="mb-12 text-white/40">
        <LedText text="Прототип · пиксельные заглушки" className="h-[11px] w-auto" />
      </div>

      {/* Вариант B — настоящий 3D-куб в дот-матрице */}
      <div className="mb-16">
        <span className="block mb-4 text-[12px] tracking-[0.1em] uppercase text-white/35">
          Вариант B · 3D-куб спроецирован в LED-сетку (вращается, ховер ускоряет и зажигает)
        </span>
        <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-start">
          <PrototypeCard3D />
          <div className="flex items-center justify-center">
            <div className="w-[260px]">
              <PixelCube3D color={MTS_RED} logoText="МТС" grid={34} className="w-full" />
            </div>
          </div>
        </div>
      </div>

      <span className="block mb-4 text-[12px] tracking-[0.1em] uppercase text-white/35">
        Вариант A · статичная изо-плитка (отклонён)
      </span>
      <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-start">
        <div className="flex flex-col gap-4">
          <span className="text-[12px] tracking-[0.1em] uppercase text-white/35">Покой (наведи мышь →)</span>
          <PrototypeCard />
        </div>
        <div className="flex flex-col gap-4">
          <span className="text-[12px] tracking-[0.1em] uppercase text-white/35">Зажжённое состояние (active)</span>
          <PrototypeCard active />
        </div>
      </div>

      <p className="mt-14 max-w-2xl text-white/45 text-[14px] leading-relaxed">
        Куб собран из LED-точек на языке сайта. В покое диоды притушены, на ховере карточки
        матрица насыщается бренд-цветом и лого зажигается. Видео убрано. Для Газпрома и
        смайла понадобятся bitmap-спрайты лого (МТС читается через LedText как есть).
      </p>
    </main>
  );
}

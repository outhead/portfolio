"use client";

import { useState } from "react";
import { ChevronDown, Newspaper } from "lucide-react";
import CaseLinkCard, { type CaseLinkData } from "./CaseLinkCard";

interface Props {
  links: CaseLinkData[];
}

/**
 * Сворачиваемый блок «Пресса и публикации».
 * По умолчанию свёрнут — кнопка-таб с иконкой газеты, счётчиком и шевроном.
 * При клике — раскрывает грид CaseLinkCard'ов с плавной анимацией высоты.
 */
export default function PressCollapse({ links }: Props) {
  const [open, setOpen] = useState(false);
  if (!links || links.length === 0) return null;

  return (
    <div className="mt-8 md:mt-10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-[#A6FF00]/25 hover:border-[#A6FF00]/55 bg-[#A6FF00]/[0.04] hover:bg-[#A6FF00]/[0.08] text-white/80 hover:text-white transition-colors"
      >
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#A6FF00]/15 ring-1 ring-[#A6FF00]/35">
          <Newspaper className="w-3.5 h-3.5 text-[#A6FF00]" strokeWidth={2.25} />
        </span>
        <span className="font-p95 text-[12px] tracking-[0.18em] uppercase">
          Пресса и публикации · {links.length}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#A6FF00] transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2.25}
        />
      </button>

      {/* Grid trick для плавной анимации height: grid-rows 0fr → 1fr */}
      <div
        className={`grid transition-[grid-template-rows,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "grid-rows-[1fr] mt-5 md:mt-6" : "grid-rows-[0fr] mt-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {links.map((link) => (
              <CaseLinkCard key={link.url} link={link} size="sm" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

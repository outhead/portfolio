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
        className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-white/[0.08] hover:border-white/[0.2] text-white/65 hover:text-white transition-colors"
      >
        <Newspaper className="w-3.5 h-3.5 text-white/45 group-hover:text-[#A6FF00] transition-colors" strokeWidth={2} />
        <span className="font-p95 text-[10px] tracking-[0.18em] uppercase">
          Пресса и публикации · {links.length}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/45 group-hover:text-white transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2}
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

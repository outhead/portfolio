"use client";

/* ─────────────────────────────────────────────────────────────────
 * LedShowcase — мини-галерея исполнений LED-шрифта в кейсе led-font.
 * Четыре живые виньетки на существующих движках: неоновая вывеска
 * (глоу+мерцание), аэропортовое табло (волна LedBoard), денежный
 * счётчик (LedCounter, новый глиф ₽), пиксельный огонь (PixelFire).
 * ──────────────────────────────────────────────────────────────── */

import LedText from "@/components/LedText";
import { LedBoard, LedCounter } from "@/components/LedBoard";
import PixelFire from "@/components/PixelFire";

function Tile({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border border-white/[0.06] bg-[#0b0b0a] overflow-hidden min-h-[210px] md:min-h-[260px] flex items-center justify-center ${className}`}
    >
      {children}
      <div className="absolute top-3.5 left-4 text-white/40">
        <span className="sr-only">{label}</span>
        <LedText text={label} className="h-[8px] md:h-[9px] w-auto" />
      </div>
    </div>
  );
}

export default function LedShowcase({ className = "" }: { className?: string }) {
  return (
    <div className={`grid md:grid-cols-2 gap-4 md:gap-5 ${className}`}>
      {/* мерцание вывески — локальные keyframes */}
      <style>{`
        @keyframes ledNeonFlicker {
          0%, 100% { opacity: 1 }
          92% { opacity: 1 }
          93% { opacity: .35 }
          94% { opacity: 1 }
          96% { opacity: .6 }
          97% { opacity: 1 }
        }
      `}</style>

      {/* 1. Неоновая вывеска: глоу в два слоя + редкое подмигивание */}
      <Tile label="Вывеска · глоу">
        <div className="flex flex-col items-center gap-3 py-10">
          <span
            className="text-[#A6FF00]"
            style={{
              animation: "ledNeonFlicker 6s linear infinite",
              filter:
                "drop-shadow(0 0 6px rgba(166,255,0,0.55)) drop-shadow(0 0 22px rgba(166,255,0,0.25))",
            }}
          >
            <span className="sr-only">Открыто</span>
            <LedText text="Открыто" scale={2} dot={1.5} className="h-[26px] md:h-[32px] w-auto" />
          </span>
          <span className="text-white/55">
            <span className="sr-only">« 24/7 »</span>
            <LedText text="« 24/7 »" className="h-[11px] md:h-[12px] w-auto" />
          </span>
        </div>
      </Tile>

      {/* 2. Аэропортовое табло: волна гашения/загорания */}
      <Tile label="Табло · волна">
        <div className="w-[86%] max-w-[420px]">
          <LedBoard
            className="w-full h-auto"
            align="left"
            scale={1}
            pad={2}
            minCols={46}
            minRows={26}
            dim="rgba(255,255,255,0.04)"
            intervalMs={2600}
            lines={[
              { words: ["Рейс SU-1874", "Рейс DP-405", "Рейс FV-6021"], color: "#F2F4EF" },
              { words: ["Выход B12", "Выход A3", "Выход C7"], color: "#C9A66B" },
              { words: ["Посадка идёт", "Ожидание", "Закрыт ->"], color: "#A6FF00" },
            ]}
          />
        </div>
      </Tile>

      {/* 3. Счётчик: прокрут цифр, новый глиф ₽ (клик — перекрутить) */}
      <Tile label="Счётчик · клик">
        <div className="flex flex-col items-center gap-3 py-10">
          <LedCounter value="1 240 500 ₽" className="h-[24px] md:h-[30px]" tone="#F2F4EF" />
          <span className="text-white/45">
            <span className="sr-only">Выручка стенда, %+12</span>
            <LedText text="Выручка стенда ↑ 12%" className="h-[9px] md:h-[10px] w-auto" />
          </span>
        </div>
      </Tile>

      {/* 4. Пиксельный огонь: doom-fire сквозь маску текста.
          Сдвиг вниз — эмиттер текста в CFG стоит высоко, выравниваем композицию плитки. */}
      <Tile label="Огонь · маска">
        <div className="absolute inset-x-0 top-[22%] -bottom-[8%]">
          <PixelFire text="ЖАРА" className="w-full h-full" />
        </div>
      </Tile>
    </div>
  );
}

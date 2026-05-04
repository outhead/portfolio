"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

function pluralize(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "раз";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "раза";
  return "раз";
}

interface Props {
  onClick: () => void;
  globalCount: number | null;
  pressing: boolean;
}

/**
 * Чёрная кнопка «Улыбнуться» с непрерывным салютом внутри.
 * Использует canvas-confetti с локальным canvas (не весь viewport).
 * Click — onClick + усиленный залп.
 */
export default function SmileFireworksButton({
  onClick,
  globalCount,
  pressing,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fireRef = useRef<((opts?: confetti.Options) => Promise<null> | null) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const local = confetti.create(canvas, {
      resize: true,
      useWorker: false,
    });
    fireRef.current = local;

    const PALETTE = ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"];

    let stopped = false;
    const fireBurst = () => {
      if (stopped) return;
      // Случайный источник внутри нижней половины — феерверки летят вверх
      const originX = 0.15 + Math.random() * 0.7;
      const originY = 0.7 + Math.random() * 0.2;
      local({
        particleCount: 14 + Math.floor(Math.random() * 10),
        angle: 60 + Math.random() * 60,
        spread: 65 + Math.random() * 25,
        startVelocity: 26 + Math.random() * 8,
        gravity: 0.55,
        ticks: 110,
        decay: 0.93,
        scalar: 0.85,
        origin: { x: originX, y: originY },
        colors: PALETTE,
        disableForReducedMotion: true,
      });
    };

    // Старт: маленький burst, потом интервал
    fireBurst();
    const intervalId = window.setInterval(fireBurst, 900 + Math.random() * 400);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
      local.reset();
    };
  }, []);

  const handleClick = () => {
    onClick();
    // Доп.залп при клике — крупнее
    fireRef.current?.({
      particleCount: 60,
      spread: 110,
      startVelocity: 40,
      gravity: 0.6,
      ticks: 160,
      origin: { x: 0.5, y: 0.8 },
      colors: ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"],
      disableForReducedMotion: true,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Улыбнуться"
      className={`group relative aspect-[5/3] md:aspect-square w-full md:w-[220px] lg:w-[260px] rounded-3xl bg-black overflow-hidden border border-[#A6FF00]/30 select-none cursor-pointer transition-all duration-300 hover:border-[#A6FF00]/70 hover:shadow-[0_0_100px_-10px_rgba(166,255,0,0.6)] ${
        pressing ? "scale-[0.96]" : "scale-100"
      }`}
    >
      {/* Salute canvas — на полный размер кнопки, не блокирует click */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
      />
      {/* Лёгкое свечение у нижнего края — место «вылета» салютов */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(166,255,0,0.18), transparent 70%)",
        }}
      />
      {/* Текст */}
      <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-3 md:gap-4 pointer-events-none">
        <span className="font-p95 text-[clamp(28px,3.8vw,52px)] leading-none uppercase tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
          Улыбнуться
        </span>
        {globalCount != null && (
          <span className="inline-flex items-baseline gap-1.5 font-p95 text-white/70">
            <span className="text-[18px] md:text-[20px] leading-none tabular-nums drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {globalCount.toLocaleString("ru-RU")}
            </span>
            <span className="text-[10px] md:text-[11px] tracking-[0.18em] uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {pluralize(globalCount)} нажали
            </span>
          </span>
        )}
      </div>
    </button>
  );
}

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

    // Основной залп — снизу-в-центре, веером вверх
    const fireMain = () => {
      if (stopped) return;
      const originX = 0.35 + Math.random() * 0.3;
      local({
        particleCount: 28 + Math.floor(Math.random() * 14),
        angle: 90,
        spread: 95 + Math.random() * 25,
        startVelocity: 32 + Math.random() * 10,
        gravity: 0.45,
        ticks: 140,
        decay: 0.94,
        scalar: 1.0,
        origin: { x: originX, y: 0.92 },
        colors: PALETTE,
        disableForReducedMotion: true,
      });
    };

    // Боковой залп — из левого/правого нижнего угла под углом
    const fireSide = (side: "left" | "right") => {
      if (stopped) return;
      const isLeft = side === "left";
      local({
        particleCount: 18 + Math.floor(Math.random() * 8),
        angle: isLeft ? 70 : 110,
        spread: 50,
        startVelocity: 28 + Math.random() * 6,
        gravity: 0.5,
        ticks: 130,
        decay: 0.94,
        scalar: 0.9,
        origin: { x: isLeft ? 0.1 : 0.9, y: 0.95 },
        colors: PALETTE,
        disableForReducedMotion: true,
      });
    };

    // Sparkle — крошечные искры по всей площади
    const fireSparkle = () => {
      if (stopped) return;
      local({
        particleCount: 6,
        spread: 360,
        startVelocity: 8,
        gravity: 0.25,
        ticks: 80,
        decay: 0.91,
        scalar: 0.55,
        origin: { x: 0.2 + Math.random() * 0.6, y: 0.3 + Math.random() * 0.5 },
        colors: PALETTE,
        disableForReducedMotion: true,
      });
    };

    // Старт: тройной burst, потом разные интервалы для разных типов
    fireMain();
    setTimeout(() => fireSide("left"), 200);
    setTimeout(() => fireSide("right"), 400);

    const mainId = window.setInterval(fireMain, 700);
    const sideId = window.setInterval(
      () => fireSide(Math.random() < 0.5 ? "left" : "right"),
      950,
    );
    const sparkleId = window.setInterval(fireSparkle, 350);

    return () => {
      stopped = true;
      window.clearInterval(mainId);
      window.clearInterval(sideId);
      window.clearInterval(sparkleId);
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
      {/* Свечение у нижнего края — место «вылета» салютов; и тонкий ободок света сверху */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(166,255,0,0.32), transparent 70%), radial-gradient(ellipse 50% 30% at 50% 0%, rgba(166,255,0,0.08), transparent 70%)",
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

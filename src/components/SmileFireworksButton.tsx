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

function formatCount(n: number): string {
  // < 100K — со смысловыми пробелами (1 234, 12 345, 99 999)
  if (n < 100_000) return n.toLocaleString("ru-RU");
  // 100K – 999K
  if (n < 1_000_000) return `${Math.floor(n / 1000)}K`;
  // 1M+
  const m = n / 1_000_000;
  return m >= 10 ? `${Math.floor(m)}M` : `${m.toFixed(1).replace(".", ",")}M`;
}

interface Props {
  onClick: () => void;
  globalCount: number | null;
  pressing: boolean;
}

/**
 * «Улыбнуться» — пилль-форма, чёрный фон, лаймовый ободок и пульсация.
 * При hover — короткий confetti-шлейф; при click — крупный залп.
 * Счётчик отдельным блоком под кнопкой с форматированием 1-100K-1M.
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
    const local = confetti.create(canvas, { resize: true, useWorker: false });
    fireRef.current = local;

    const PALETTE = ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"];
    let stopped = false;

    // Маленькие фонтанчики снизу — летят вверх внутрь пилюли
    const fireFountain = () => {
      if (stopped) return;
      const x = 0.25 + Math.random() * 0.5;
      local({
        particleCount: 6 + Math.floor(Math.random() * 5),
        angle: 90,
        spread: 50 + Math.random() * 25,
        startVelocity: 18 + Math.random() * 6,
        gravity: 0.7,
        ticks: 80,
        decay: 0.92,
        scalar: 0.55,
        origin: { x, y: 1.0 },
        colors: PALETTE,
        disableForReducedMotion: true,
      });
    };

    // Случайные искры по площади пилюли
    const fireSparkle = () => {
      if (stopped) return;
      local({
        particleCount: 3,
        spread: 360,
        startVelocity: 5,
        gravity: 0.3,
        ticks: 60,
        decay: 0.9,
        scalar: 0.4,
        origin: { x: 0.2 + Math.random() * 0.6, y: 0.4 + Math.random() * 0.4 },
        colors: PALETTE,
        disableForReducedMotion: true,
      });
    };

    // Стартовый burst
    fireFountain();
    setTimeout(fireFountain, 200);
    setTimeout(fireSparkle, 100);

    const fountainId = window.setInterval(fireFountain, 480);
    const sparkleId = window.setInterval(fireSparkle, 280);

    return () => {
      stopped = true;
      window.clearInterval(fountainId);
      window.clearInterval(sparkleId);
      local.reset();
    };
  }, []);

  const handleClick = () => {
    onClick();
    fireRef.current?.({
      particleCount: 80,
      spread: 100,
      startVelocity: 38,
      gravity: 0.6,
      ticks: 180,
      origin: { x: 0.5, y: 0.95 },
      colors: ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"],
      disableForReducedMotion: true,
    });
  };

  const handleHover = () => {
    fireRef.current?.({
      particleCount: 18,
      spread: 70,
      startVelocity: 26,
      gravity: 0.55,
      ticks: 130,
      origin: { x: 0.5, y: 0.85 },
      colors: ["#A6FF00", "#D9FF66", "#FFFFFF"],
      disableForReducedMotion: true,
    });
  };

  return (
    <div className="flex flex-col items-center gap-3 md:gap-4 w-full md:w-auto">
      {/* Кнопка-пилюля */}
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={handleHover}
        aria-label="Улыбнуться"
        className={`group relative inline-flex items-center justify-center w-full md:w-[300px] h-[88px] md:h-[96px] rounded-full bg-black overflow-hidden border border-[#A6FF00]/35 select-none cursor-pointer transition-all duration-300 hover:border-[#A6FF00] hover:shadow-[0_0_70px_-10px_rgba(166,255,0,0.7)] ${
          pressing ? "scale-[0.97]" : "scale-100"
        }`}
      >
        {/* Пульсирующий лайм-glow внутри */}
        <span
          aria-hidden
          className="absolute inset-0 pointer-events-none animate-[smilePulse_3s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(166,255,0,0.28), transparent 70%)",
          }}
        />
        {/* Confetti canvas, не блокирует click */}
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        {/* Текст — translate-y компенсирует cap-height-смещение Bebas Neue */}
        <span className="relative font-p95 text-[clamp(28px,3.5vw,44px)] leading-none uppercase tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] translate-y-[2px]">
          Улыбнуться
        </span>
        {/* Hover-fill: лайм-полоска, выезжающая снизу */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-0 group-hover:h-1 bg-[#A6FF00] transition-all duration-300"
        />
      </button>

      {/* Счётчик — отдельной строкой под кнопкой */}
      <div className="min-h-[24px] flex items-baseline gap-2 font-p95">
        {globalCount != null ? (
          <>
            <span className="text-[18px] md:text-[20px] leading-none tabular-nums text-white">
              {formatCount(globalCount)}
            </span>
            <span className="text-[11px] md:text-[12px] tracking-[0.18em] uppercase text-white/45">
              {pluralize(globalCount)} нажали
            </span>
          </>
        ) : (
          <span className="text-[11px] md:text-[12px] tracking-[0.18em] uppercase text-white/30">
            &nbsp;
          </span>
        )}
      </div>

      <style jsx>{`
        @keyframes smilePulse {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

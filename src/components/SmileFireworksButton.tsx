"use client";

import LedText from "@/components/LedText";
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
  if (n < 100_000) return n.toLocaleString("ru-RU");
  if (n < 1_000_000) return `${Math.floor(n / 1000)}K`;
  const m = n / 1_000_000;
  return m >= 10 ? `${Math.floor(m)}M` : `${m.toFixed(1).replace(".", ",")}M`;
}

interface Props {
  onClick: () => void;
  globalCount?: number | null;
  pressing?: boolean;
  /** compact = маленькая инлайн-пилюля без счётчика, эффекты масштабированы */
  compact?: boolean;
}

/**
 * «Не нажимать» — пилль-форма с непрерывными фонтанчиками + искрами внутри,
 * hover-шлейф и крупный залп при клике.
 *
 * Два варианта рендера:
 *   • большой (default) — focal-блок 300×96 + блок счётчика под кнопкой;
 *   • compact — маленькая инлайн-пилюля под мелкие CTA-ряды; счётчик не рендерится
 *     (он живёт отдельно, например, в правой колонке секции).
 */
export default function SmileFireworksButton({
  onClick,
  globalCount = null,
  pressing = false,
  compact = false,
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

    // Масштаб эффектов: компактная пилюля меньше → меньше частиц, ниже скорости
    const k = compact ? 0.55 : 1;

    const fireFountain = () => {
      if (stopped) return;
      const x = 0.25 + Math.random() * 0.5;
      local({
        particleCount: Math.max(2, Math.round((6 + Math.random() * 5) * k)),
        angle: 90,
        spread: 50 + Math.random() * 25,
        startVelocity: (18 + Math.random() * 6) * k,
        gravity: 0.7,
        ticks: 80,
        decay: 0.92,
        scalar: 0.55 * (compact ? 0.7 : 1),
        origin: { x, y: 1.0 },
        colors: PALETTE,
        disableForReducedMotion: true,
      });
    };

    const fireSparkle = () => {
      if (stopped) return;
      local({
        particleCount: Math.max(1, Math.round(3 * k)),
        spread: 360,
        startVelocity: 5 * k,
        gravity: 0.3,
        ticks: 60,
        decay: 0.9,
        scalar: 0.4 * (compact ? 0.7 : 1),
        origin: { x: 0.2 + Math.random() * 0.6, y: 0.4 + Math.random() * 0.4 },
        colors: PALETTE,
        disableForReducedMotion: true,
      });
    };

    fireFountain();
    setTimeout(fireFountain, 200);
    setTimeout(fireSparkle, 100);

    const fountainId = window.setInterval(fireFountain, compact ? 600 : 480);
    const sparkleId = window.setInterval(fireSparkle, compact ? 360 : 280);

    return () => {
      stopped = true;
      window.clearInterval(fountainId);
      window.clearInterval(sparkleId);
      local.reset();
    };
  }, [compact]);

  const handleClick = () => {
    onClick();
    fireRef.current?.({
      particleCount: compact ? 40 : 80,
      spread: compact ? 80 : 100,
      startVelocity: compact ? 24 : 38,
      gravity: 0.6,
      ticks: compact ? 130 : 180,
      origin: { x: 0.5, y: 0.95 },
      colors: ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"],
      disableForReducedMotion: true,
    });
  };

  const handleHover = () => {
    fireRef.current?.({
      particleCount: compact ? 10 : 18,
      spread: 70,
      startVelocity: compact ? 16 : 26,
      gravity: 0.55,
      ticks: compact ? 100 : 130,
      origin: { x: 0.5, y: 0.85 },
      colors: ["#A6FF00", "#D9FF66", "#FFFFFF"],
      disableForReducedMotion: true,
    });
  };

  // ─── Compact: маленькая инлайн-пилюля без счётчика ──────────────
  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={handleHover}
        aria-label="Не нажимать"
        className={`group relative inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-transparent overflow-hidden border border-[#A6FF00]/40 text-[#A6FF00] select-none cursor-pointer transition-colors duration-200 hover:border-[#A6FF00] hover:bg-[#A6FF00] hover:text-black ${
          pressing ? "scale-[0.97]" : "scale-100"
        }`}
      >
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        <span className="relative z-[1]">
          <span className="sr-only">Не нажимать</span>
          <LedText text="Не нажимать" className="h-[11px] w-auto" />
        </span>
      </button>
    );
  }

  // ─── Большая пилюля + счётчик (старый layout) ──────────────────
  return (
    <div className="flex flex-col items-center gap-3 md:gap-4 w-full md:w-auto">
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={handleHover}
        aria-label="Не нажимать"
        className={`group relative inline-flex items-center justify-center w-full md:w-[300px] h-[88px] md:h-[96px] rounded-full bg-black overflow-hidden border border-[#A6FF00]/35 select-none cursor-pointer transition-all duration-300 hover:border-[#A6FF00] hover:shadow-[0_0_70px_-10px_rgba(166,255,0,0.7)] ${
          pressing ? "scale-[0.97]" : "scale-100"
        }`}
      >
        <span
          aria-hidden
          className="absolute inset-0 pointer-events-none animate-[smilePulse_3s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(166,255,0,0.28), transparent 70%)",
          }}
        />
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        <span className="relative text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
          <span className="sr-only">Не нажимать</span>
          <LedText text="Не нажимать" scale={2} dot={1.45} className="h-[18px] md:h-[24px] w-auto" />
        </span>
      </button>

      <div className="min-h-[24px] flex items-center gap-2.5">
        {globalCount != null ? (
          <>
            <span className="text-white">
              <LedText text={formatCount(globalCount)} className="h-[13px] w-auto" />
            </span>
            <span className="text-white/45">
              <LedText text={`${pluralize(globalCount)} нажали`} className="h-[8px] w-auto" />
            </span>
          </>
        ) : (
          <span className="text-white/30">&nbsp;</span>
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

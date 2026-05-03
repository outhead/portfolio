"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

// Глобальный счётчик через abacus.jasoncameron.dev — без своего бэка.
// Namespace и ключ публичные, hit увеличивает значение на сервере.
const NS = "shugaev-portfolio";
const KEY = "scroll-thanks";
const GET_URL = `https://abacus.jasoncameron.dev/get/${NS}/${KEY}`;
const HIT_URL = `https://abacus.jasoncameron.dev/hit/${NS}/${KEY}`;

function pluralize(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "раз";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "раза";
  return "раз";
}

function fireworks() {
  // Залп фейерверка: несколько случайных взрывов в течение 1.5 секунды.
  const duration = 1500;
  const end = Date.now() + duration;
  const colors = ["#A6FF00", "#C9A66B", "#ffffff", "#A6FF00"];

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.8 },
      colors,
      startVelocity: 55,
      gravity: 0.9,
      scalar: 0.95,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.8 },
      colors,
      startVelocity: 55,
      gravity: 0.9,
      scalar: 0.95,
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();

  // Финальный «бум» по центру
  confetti({
    particleCount: 120,
    spread: 100,
    origin: { x: 0.5, y: 0.7 },
    colors,
    startVelocity: 45,
    gravity: 1.0,
    scalar: 1.05,
  });
}

export default function ThanksCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [pressing, setPressing] = useState(false);
  const inflight = useRef(false);

  // Подгружаем текущее значение при маунте
  useEffect(() => {
    let cancelled = false;
    fetch(GET_URL, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { value?: number }) => {
        if (!cancelled && typeof data.value === "number") {
          setCount(data.value);
        }
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onClick = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    setPressing(true);

    // Оптимистично увеличиваем счётчик и запускаем фейерверк сразу
    setCount((c) => (c == null ? 1 : c + 1));
    fireworks();

    try {
      const res = await fetch(HIT_URL, { cache: "no-store" });
      const data = (await res.json()) as { value?: number };
      if (typeof data.value === "number") {
        setCount(data.value);
      }
    } catch {
      // Если сеть упала — оставляем оптимистичное значение
    } finally {
      inflight.current = false;
      setTimeout(() => setPressing(false), 200);
    }
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-5 md:gap-6">
      <button
        type="button"
        onClick={onClick}
        className={`group relative inline-flex items-center justify-center px-9 py-5 md:px-11 md:py-6 rounded-full bg-[#A6FF00] text-black font-p95 text-sm md:text-[15px] tracking-[0.16em] uppercase hover:bg-white transition-all select-none ${
          pressing ? "scale-95" : "scale-100"
        }`}
        aria-label="Нажмите кнопку"
      >
        <span className="relative">Нажать</span>
      </button>

      <div className="inline-flex items-baseline gap-2 font-p95">
        <span className="text-[clamp(28px,4.5vw,52px)] leading-none text-white tabular-nums">
          {count == null ? "—" : count.toLocaleString("ru-RU")}
        </span>
        <span className="text-[11px] md:text-[12px] tracking-[0.2em] uppercase text-white/45">
          {count == null ? "загружаем" : `${pluralize(count)} нажали`}
        </span>
      </div>
    </div>
  );
}

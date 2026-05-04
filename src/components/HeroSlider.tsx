"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

export interface HeroImage {
  src: string;
  alt?: string;
  /** Соотношение сторон, например "16/9" или "4/5". По умолчанию 16/9. */
  aspect?: string;
}

interface HeroSliderProps {
  heroes: HeroImage[];
  /** Подпись над слайдером, например «Постеры · 4». */
  label?: string;
}

const SWIPE_THRESHOLD = 40; // px по горизонтали для срабатывания свайпа
const SWIPE_MAX_VERTICAL = 60; // если вертикальное смещение слишком большое — это скролл, а не свайп

/**
 * Слайдер hero-постеров с full-screen zoom по клику.
 * - Соотношение сторон контейнера = соотношение текущего постера: ничего не обрезается, превью совпадает с увеличенным видом.
 * - object-contain везде. Для широких 16:9 — заполняет рамку, для 4:5 — letterbox по бокам.
 * - Стрелки prev/next, точки-индикатор + счётчик 01/04, поддержка ← → клавиш.
 * - Touch swipe влево/вправо для перелистывания на мобиле.
 * - Click на постер → fullscreen overlay; ESC закрывает; в overlay — тоже свайп.
 */
export default function HeroSlider({ heroes, label }: HeroSliderProps) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  // Состояние свайпа: фиксируем точку касания, чтобы отличать tap от swipe.
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const didSwipe = useRef(false);

  const next = useCallback(
    () => setActive((a) => (a + 1) % heroes.length),
    [heroes.length],
  );
  const prev = useCallback(
    () => setActive((a) => (a - 1 + heroes.length) % heroes.length),
    [heroes.length],
  );
  const close = useCallback(() => setZoomed(false), []);

  // ESC и стрелки
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (zoomed) {
        if (e.key === "Escape") close();
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
      } else {
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed, close, prev, next]);

  // Lock body scroll когда zoom открыт
  useEffect(() => {
    if (zoomed) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [zoomed]);

  // --- Swipe handlers (общие для слайдера и оверлея) ---
  const onPointerDown = (e: React.PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
    didSwipe.current = false;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_MAX_VERTICAL) {
      didSwipe.current = true;
      if (dx < 0) next();
      else prev();
    }
  };

  const onPointerCancel = () => {
    swipeStart.current = null;
  };

  // Клик по постеру → открыть зум, но НЕ открывать, если только что был свайп.
  const onPosterClick = () => {
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    setZoomed(true);
  };

  if (!heroes || heroes.length === 0) return null;

  const current = heroes[active];
  const aspect = current.aspect ?? "16/9";

  return (
    <>
      {label ? (
        <div className="text-[12px] tracking-[0.18em] uppercase text-white/40 mb-4 md:mb-5">
          {label}
        </div>
      ) : null}

      <div className="relative">
        {/* Главный слайд — aspect совпадает с активной картинкой, object-contain никогда не режет */}
        <button
          type="button"
          onClick={onPosterClick}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          aria-label="Открыть постер в полном размере"
          className="group relative block w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-black cursor-zoom-in select-none touch-pan-y"
          style={{ aspectRatio: aspect }}
        >
          <Image
            key={current.src}
            src={current.src}
            alt={current.alt ?? `Постер ${active + 1}`}
            fill
            sizes="(min-width: 1024px) 80vw, 100vw"
            className="object-contain transition-opacity duration-300 pointer-events-none"
            priority
            draggable={false}
          />
          <span className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/55 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <ZoomIn className="w-4 h-4 text-white" strokeWidth={2} />
          </span>
        </button>

        {/* Стрелки prev/next */}
        {heroes.length > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Предыдущий постер"
              className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/25 hover:bg-black/60 active:bg-black text-white/30 hover:text-white/85 border border-white/[0.05] hover:border-white/[0.12] backdrop-blur-sm transition-colors z-10"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Следующий постер"
              className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/25 hover:bg-black/60 active:bg-black text-white/30 hover:text-white/85 border border-white/[0.05] hover:border-white/[0.12] backdrop-blur-sm transition-colors z-10"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2} />
            </button>
          </>
        ) : null}
      </div>

      {/* Точки-индикатор + счётчик */}
      {heroes.length > 1 ? (
        <div className="flex items-center gap-2 mt-4 md:mt-5">
          {heroes.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActive(idx)}
              aria-label={`Перейти к постеру ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                idx === active
                  ? "w-8 bg-[#A6FF00]"
                  : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
          <span className="ml-3 font-mono text-[15px] tracking-[0.14em] uppercase text-white/45 tabular-nums">
            {String(active + 1).padStart(2, "0")} /{" "}
            {String(heroes.length).padStart(2, "0")}
          </span>
        </div>
      ) : null}

      {/* Fullscreen overlay */}
      {zoomed ? (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          {/* Крестик закрытия — z-20 над image-врапером (у врапера w-full h-full и stopPropagation) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            aria-label="Закрыть"
            className="fixed top-[max(1.25rem,env(safe-area-inset-top))] right-[max(1.25rem,env(safe-area-inset-right))] z-20 inline-flex items-center justify-center w-12 h-12 rounded-full bg-black/70 hover:bg-black active:bg-black text-white border border-white/15 backdrop-blur-sm transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>

          {heroes.length > 1 ? (
            <div className="fixed top-[max(1.5rem,env(safe-area-inset-top))] left-5 z-20 font-mono text-[15px] tracking-[0.14em] uppercase text-white/55 tabular-nums pointer-events-none">
              {String(active + 1).padStart(2, "0")} /{" "}
              {String(heroes.length).padStart(2, "0")}
            </div>
          ) : null}

          {heroes.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Предыдущий"
                className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center w-11 h-11 rounded-full bg-black/60 hover:bg-black active:bg-black text-white border border-white/15 backdrop-blur-sm transition-colors"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Следующий"
                className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center w-11 h-11 rounded-full bg-black/60 hover:bg-black active:bg-black text-white border border-white/15 backdrop-blur-sm transition-colors"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={2} />
              </button>
            </>
          ) : null}

          {/* Image-врапер: stopPropagation, чтобы клик по картинке не закрывал overlay,
              + свайп влево/вправо для перелистывания */}
          <div
            className="relative w-full h-full max-w-[1600px] flex items-center justify-center select-none touch-pan-y"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
          >
            <div className="relative w-full max-h-full" style={{ aspectRatio: aspect }}>
              <Image
                key={current.src}
                src={current.src}
                alt={current.alt ?? `Постер ${active + 1}`}
                fill
                sizes="100vw"
                className="object-contain pointer-events-none"
                priority
                draggable={false}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

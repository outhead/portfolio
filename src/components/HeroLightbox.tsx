"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";

export interface HeroImage {
  src: string;
  alt?: string;
  /** Соотношение сторон, например "16/9" или "4/5". По умолчанию 16/9. */
  aspect?: string;
}

interface HeroLightboxProps {
  heroes: HeroImage[];
  /** Подпись над блоком (например, «Постеры · 4»). */
  label?: string;
}

/**
 * Сетка hero-плакатов с возможностью увеличить каждое изображение в overlay.
 * - Никогда не сжимает в 4 колонки: max 2 col на десктопе, чтобы плакаты оставались читаемыми.
 * - Клик по плакату — fullscreen-overlay с навигацией стрелками и Esc для закрытия.
 */
export default function HeroLightbox({ heroes, label }: HeroLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);

  // ESC + стрелки
  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight")
        setActiveIndex((i) => (i !== null && i < heroes.length - 1 ? i + 1 : i));
      if (e.key === "ArrowLeft")
        setActiveIndex((i) => (i !== null && i > 0 ? i - 1 : i));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, heroes.length, close]);

  // Лочим скролл body когда overlay открыт
  useEffect(() => {
    if (activeIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeIndex]);

  if (!heroes || heroes.length === 0) return null;

  const grid =
    heroes.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2";

  const sizesAttr =
    heroes.length === 1
      ? "100vw"
      : "(min-width: 768px) 50vw, 100vw";

  return (
    <>
      {label ? (
        <div className="text-[10px] tracking-[0.18em] uppercase text-white/40 mb-4 md:mb-5">
          {label}
        </div>
      ) : null}

      <div className={`grid gap-4 md:gap-5 ${grid}`}>
        {heroes.map((h, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveIndex(idx)}
            aria-label={`Открыть постер ${idx + 1} в полном размере`}
            className="group relative w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-black hover:border-[#A6FF00]/30 transition-colors cursor-zoom-in"
            style={{ aspectRatio: h.aspect ?? "16/9" }}
          >
            <Image
              src={h.src}
              alt={h.alt ?? `Постер ${idx + 1}`}
              fill
              sizes={sizesAttr}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            {/* Иконка-зум в углу при ховере */}
            <span className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/55 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-4 h-4 text-white" strokeWidth={2} />
            </span>
          </button>
        ))}
      </div>

      {/* Overlay-просмотр */}
      {activeIndex !== null ? (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          {/* Кнопка закрыть */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            aria-label="Закрыть"
            className="absolute top-5 right-5 inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>

          {/* Счётчик */}
          {heroes.length > 1 ? (
            <div className="absolute top-5 left-5 font-mono text-[11px] tracking-[0.14em] uppercase text-white/45 tabular-nums">
              {String(activeIndex + 1).padStart(2, "0")} / {String(heroes.length).padStart(2, "0")}
            </div>
          ) : null}

          {/* Стрелка влево */}
          {heroes.length > 1 && activeIndex > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((i) => (i !== null && i > 0 ? i - 1 : i));
              }}
              aria-label="Предыдущий"
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white transition-colors"
            >
              ‹
            </button>
          ) : null}

          {/* Стрелка вправо */}
          {heroes.length > 1 && activeIndex < heroes.length - 1 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((i) =>
                  i !== null && i < heroes.length - 1 ? i + 1 : i,
                );
              }}
              aria-label="Следующий"
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white transition-colors"
            >
              ›
            </button>
          ) : null}

          {/* Изображение */}
          <div
            className="relative w-full h-full max-w-[1600px] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative w-full max-h-full"
              style={{ aspectRatio: heroes[activeIndex].aspect ?? "16/9" }}
            >
              <Image
                src={heroes[activeIndex].src}
                alt={heroes[activeIndex].alt ?? `Постер ${activeIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

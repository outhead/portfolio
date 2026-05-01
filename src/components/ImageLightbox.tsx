"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface ImageLightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

interface ImageLightboxProps {
  images: ImageLightboxImage[];
}

export default function ImageLightbox({ images }: ImageLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (activeIndex !== null) {
        if (e.key === "ArrowRight") setActiveIndex((i) => (i !== null && i < images.length - 1 ? i + 1 : i));
        if (e.key === "ArrowLeft") setActiveIndex((i) => (i !== null && i > 0 ? i - 1 : i));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, images.length, close]);

  useEffect(() => {
    if (activeIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [activeIndex]);

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        {images.map((img, n) => (
          <figure key={n} className="flex flex-col gap-2">
            <button
              onClick={() => setActiveIndex(n)}
              className="relative aspect-video rounded-lg border border-white/[0.06] overflow-hidden group cursor-zoom-in bg-transparent p-0"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
            </button>
            {img.caption && (
              <figcaption className="text-[11px] md:text-[12px] tracking-[0.04em] text-white/45 leading-snug px-1">
                {img.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {/* Lightbox overlay */}
      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          onClick={close}
        >
          <button
            onClick={close}
            className="absolute top-4 right-4 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-colors bg-black/50 cursor-pointer z-[201]"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>

          <div
            className="relative max-w-[90vw] max-h-[85vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[activeIndex].src}
              alt={images[activeIndex].alt}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {/* Caption + navigation hints в footer overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[90vw] flex flex-col items-center gap-1.5 text-center px-4">
            {images[activeIndex].caption && (
              <div className="text-sm md:text-base text-white/85 leading-snug max-w-2xl">
                {images[activeIndex].caption}
              </div>
            )}
            <div className="text-[10px] tracking-[0.12em] uppercase text-white/25">
              {activeIndex + 1} / {images.length} · ESC для выхода
            </div>
          </div>
        </div>
      )}
    </>
  );
}

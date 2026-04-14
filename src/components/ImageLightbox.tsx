"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface ImageLightboxProps {
  images: { src: string; alt: string }[];
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
          <button
            key={n}
            onClick={() => setActiveIndex(n)}
            className="relative aspect-video rounded-lg border border-white/[0.06] overflow-hidden group cursor-zoom-in bg-transparent p-0"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
          </button>
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

          {/* Navigation hints */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.12em] uppercase text-white/25">
            {activeIndex + 1} / {images.length} · ESC для выхода
          </div>
        </div>
      )}
    </>
  );
}

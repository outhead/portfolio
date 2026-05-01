"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { X, Lock } from "lucide-react";

interface ImageLightboxImage {
  src: string;
  alt: string;
  /** Короткий моно-лейбл под плиткой (a-la Kardio: «SPLASH SCREEN»). */
  label?: string;
  /** Полное описание в overlay-просмотре. */
  caption?: string;
  /** NDA-защищённый кадр: рендерится в блюре до ввода пароля. */
  protected?: boolean;
  /** `"video"` — рендерит `<video>` с autoplay-muted-loop в плитке и controls в overlay. */
  kind?: "image" | "video";
  /** Постер для video. */
  poster?: string;
}

interface ImageLightboxProps {
  images: ImageLightboxImage[];
  /**
   * Режим раскладки сетки.
   * - `"web"` (default) — 2 столбца, 16:9, под десктопные веб-интерфейсы.
   * - `"phone"` — до 5 столбцов, портретный iPhone-aspect 1290:2796, под мобильные скрины (Kardio-style).
   */
  mode?: "web" | "phone";
}

const PROTECT_PASSWORD = "4444";
const PROTECT_STORAGE_KEY = "portfolio-protected-unlocked";

export default function ImageLightbox({ images, mode = "web" }: ImageLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const promptRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hasProtected = images.some((img) => img.protected);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(PROTECT_STORAGE_KEY) === "true") {
      setUnlocked(true);
    }
  }, []);

  const tryUnlock = useCallback(() => {
    if (passwordInput.trim() === PROTECT_PASSWORD) {
      setUnlocked(true);
      setPasswordError(false);
      try {
        window.localStorage.setItem(PROTECT_STORAGE_KEY, "true");
      } catch {
        /* ignore */
      }
    } else {
      setPasswordError(true);
    }
  }, [passwordInput]);

  /** Клик по locked-плитке → плавный скролл к prompt + фокус на input. */
  const focusPasswordInput = useCallback(() => {
    promptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 250);
  }, []);

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
      {/* NDA prompt поверх группы скринов, если есть protected и не unlocked */}
      {hasProtected && !unlocked && (
        <div
          ref={promptRef}
          className="mb-6 p-5 md:p-6 rounded-lg border border-white/[0.08] bg-white/[0.02] flex flex-col md:flex-row items-start md:items-center gap-4"
        >
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-[#A6FF00]/10 border border-[#A6FF00]/30 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-[#A6FF00]" strokeWidth={2} />
            </div>
            <div className="md:max-w-xs">
              <div className="text-sm md:text-[15px] text-white/85 font-medium leading-snug">Закрыто по NDA</div>
              <div className="text-[11px] text-white/45 mt-0.5">Скрины внутренних продуктов. Введите пароль доступа.</div>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              tryUnlock();
            }}
            className="flex items-stretch gap-2 flex-1 md:max-w-md w-full"
          >
            <input
              ref={inputRef}
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError(false);
              }}
              placeholder="Пароль"
              autoComplete="off"
              className={`flex-1 px-3 py-2 rounded-md bg-black border text-sm text-white placeholder:text-white/30 outline-none transition-colors ${
                passwordError
                  ? "border-red-500/60"
                  : "border-white/10 focus:border-[#A6FF00]/60"
              }`}
              aria-label="Пароль доступа"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#A6FF00] text-black text-sm font-medium hover:bg-[#A6FF00]/85 transition-colors"
            >
              Открыть
            </button>
          </form>
          {passwordError && (
            <div className="text-[11px] text-red-400/85">Неверный пароль</div>
          )}
        </div>
      )}

      {/* Сетка/слайдер плиток.
          В режиме phone — ОДИН ДЛИННЫЙ ГОРИЗОНТАЛЬНЫЙ РЯД на всех экранах. Плитки крупные (фиксированной ширины), скролл свайпом/мышью.
          В режиме web — на мобиле horizontal-snap-scroll, на md+ — grid 2 столбца (по умолчанию). */}
      <div
        className={
          mode === "phone"
            ? "-mx-5 lg:-mx-12 px-5 lg:px-12 flex gap-x-4 md:gap-x-5 lg:gap-x-6 overflow-x-auto snap-x snap-mandatory scroll-px-5 lg:scroll-px-12 pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
            : "-mx-5 md:mx-0 px-5 md:px-0 flex md:grid md:grid-cols-2 gap-x-4 md:gap-x-6 gap-y-10 md:gap-y-14 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none scroll-px-5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        }
      >
        {images.map((img, n) => {
          const isLocked = !!img.protected && !unlocked;
          return (
            <figure
              key={n}
              className={
                mode === "phone"
                  ? "flex flex-col gap-3 items-center flex-shrink-0 w-[200px] sm:w-[220px] md:w-[230px] lg:w-[250px] xl:w-[270px] snap-start"
                  : "flex flex-col gap-3 items-center flex-shrink-0 w-[85%] sm:w-[70%] md:w-auto snap-center"
              }
            >
              <button
                onClick={() => {
                  if (isLocked) {
                    focusPasswordInput();
                    return;
                  }
                  setActiveIndex(n);
                }}
                className={`relative overflow-hidden group bg-black p-0 w-full ${
                  mode === "phone"
                    ? "aspect-[1290/2796] rounded-2xl ring-1 ring-white/[0.06]"
                    : "aspect-video rounded-lg"
                } ${isLocked ? "cursor-pointer" : "cursor-zoom-in"}`}
              >
                {img.kind === "video" ? (
                  <video
                    src={img.src}
                    poster={img.poster}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className={`absolute inset-0 w-full h-full ${
                      mode === "phone" ? "object-cover object-top" : "object-cover object-center"
                    } transition-transform duration-500 ${
                      isLocked ? "blur-2xl scale-110" : "group-hover:scale-105"
                    }`}
                  />
                ) : (
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes={
                      mode === "phone"
                        ? "(max-width: 640px) 260px, (max-width: 768px) 280px, (max-width: 1024px) 300px, (max-width: 1280px) 340px, 380px"
                        : "(max-width: 768px) 85vw, 50vw"
                    }
                    className={`${
                      mode === "phone" ? "object-cover object-top" : "object-cover object-center"
                    } transition-transform duration-500 ${
                      isLocked ? "blur-2xl scale-110" : "group-hover:scale-105"
                    }`}
                  />
                )}
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Lock className="w-5 h-5 text-white/70" strokeWidth={2} />
                  </div>
                )}
              </button>
              {(img.label || img.caption) && (
                <figcaption className="font-mono text-[10px] md:text-[11px] tracking-[0.16em] uppercase text-white/40 text-center px-2">
                  {img.label ?? img.caption}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>

      {/* Lightbox overlay */}
      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex flex-col"
          onClick={close}
        >
          <div className="flex justify-end p-4 flex-shrink-0">
            <button
              onClick={close}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-colors bg-black/50 cursor-pointer"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          <div
            className="flex-1 min-h-0 flex items-center justify-center px-4 md:px-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full max-w-[1400px]">
              {images[activeIndex].kind === "video" ? (
                <video
                  src={images[activeIndex].src}
                  poster={images[activeIndex].poster}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-contain"
                />
              ) : (
                <Image
                  src={images[activeIndex].src}
                  alt={images[activeIndex].alt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1400px) 100vw, 1400px"
                />
              )}
            </div>
          </div>

          <div className="flex-shrink-0 px-4 py-4 md:py-5 flex flex-col items-center gap-2 text-center">
            {images[activeIndex].label && (
              <div className="font-mono text-[10px] md:text-[11px] tracking-[0.18em] uppercase text-white/45">
                {images[activeIndex].label}
              </div>
            )}
            {images[activeIndex].caption && (
              <div className="text-sm md:text-base text-white/85 leading-snug max-w-3xl max-h-[20vh] overflow-y-auto">
                {images[activeIndex].caption}
              </div>
            )}
            <div className="text-[10px] tracking-[0.12em] uppercase text-white/30">
              {activeIndex + 1} / {images.length} · ESC для выхода · ← →
            </div>
          </div>
        </div>
      )}
    </>
  );
}

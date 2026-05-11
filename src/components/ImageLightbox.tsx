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

  // Pinch-to-zoom + двойной тап для зума в открытой картинке (мобила).
  // На десктопе те же transform работают: dblclick → toggle 1× ↔ 2.5×.
  const [zoom, setZoom] = useState<{ scale: number; x: number; y: number }>({
    scale: 1,
    x: 0,
    y: 0,
  });
  // gestureStart хранит начальные значения дистанции/позиций пальцев на старте жеста.
  const gestureStart = useRef<
    | {
        kind: "pinch";
        dist: number;
        scale: number;
        x: number;
        y: number;
      }
    | { kind: "pan"; px: number; py: number; x: number; y: number }
    | null
  >(null);
  const lastTapRef = useRef(0);

  // Сбрасываем зум при смене слайда / закрытии оверлея.
  useEffect(() => {
    setZoom({ scale: 1, x: 0, y: 0 });
    gestureStart.current = null;
  }, [activeIndex]);

  const hasProtected = images.some((img) => img.protected);
  const protectedCount = images.filter((img) => img.protected).length;

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

  // ===== Жесты в оверлее: pinch для зума + pan при scale>1, double-tap toggle =====
  const MIN_SCALE = 1;
  const MAX_SCALE = 4;
  const toggleZoomAt = useCallback(() => {
    setZoom((z) => (z.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: 2.5, x: 0, y: 0 }));
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const [a, b] = [e.touches[0], e.touches[1]];
        const dx = a.clientX - b.clientX;
        const dy = a.clientY - b.clientY;
        gestureStart.current = {
          kind: "pinch",
          dist: Math.hypot(dx, dy) || 1,
          scale: zoom.scale,
          x: zoom.x,
          y: zoom.y,
        };
      } else if (e.touches.length === 1) {
        // double-tap detection
        const now = Date.now();
        if (now - lastTapRef.current < 280) {
          toggleZoomAt();
          lastTapRef.current = 0;
          gestureStart.current = null;
          return;
        }
        lastTapRef.current = now;
        // pan только когда уже зум-ин
        gestureStart.current = {
          kind: "pan",
          px: e.touches[0].clientX,
          py: e.touches[0].clientY,
          x: zoom.x,
          y: zoom.y,
        };
      }
    },
    [zoom, toggleZoomAt]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const g = gestureStart.current;
      if (!g) return;
      if (e.touches.length === 2 && g.kind === "pinch") {
        const [a, b] = [e.touches[0], e.touches[1]];
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1;
        const ratio = d / g.dist;
        const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, g.scale * ratio));
        setZoom({ scale: next, x: g.x, y: g.y });
        // блокируем нативный pinch-zoom страницы
        if (e.cancelable) e.preventDefault();
      } else if (e.touches.length === 1 && g.kind === "pan" && zoom.scale > 1) {
        const dx = e.touches[0].clientX - g.px;
        const dy = e.touches[0].clientY - g.py;
        setZoom({ scale: zoom.scale, x: g.x + dx, y: g.y + dy });
        if (e.cancelable) e.preventDefault();
      }
    },
    [zoom.scale]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      // если осталось 0–1 палец — сбрасываем жест, чтобы следующий tap начался чисто
      if (e.touches.length < 2) gestureStart.current = null;
      // если ушли ниже 1× — нормализуем
      setZoom((z) => (z.scale <= 1.02 ? { scale: 1, x: 0, y: 0 } : z));
    },
    []
  );

  const isZoomed = zoom.scale > 1.02;

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
              <div className="text-sm md:text-[15px] text-white/85 font-medium leading-snug">
                Закрыто по NDA{protectedCount > 0 ? ` · ${protectedCount}` : ""}
              </div>
              <div className="text-[13px] text-white/45 mt-0.5">Скрины внутренних продуктов. Введите пароль, чтобы раскрыть.</div>
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
            <div className="text-[13px] text-red-400/85">Неверный пароль</div>
          )}
        </div>
      )}

      {/* Сетка/слайдер плиток.
          В режиме phone — на мобиле horizontal-scroll, на md+ — grid 3/4/5 в ряд (без обрезки по правому краю viewport).
          В режиме web — на мобиле horizontal-snap-scroll, на md+ — grid 2 столбца (по умолчанию). */}
      <div
        className={
          mode === "phone"
            ? "-mx-5 md:mx-0 px-5 md:px-0 flex md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 md:gap-x-4 lg:gap-x-5 gap-y-8 md:gap-y-10 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none scroll-px-5 pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
            : "-mx-5 md:mx-0 px-5 md:px-0 flex md:grid md:grid-cols-2 gap-x-4 md:gap-x-6 gap-y-10 md:gap-y-14 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none scroll-px-5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        }
      >
        {images.map((img, n) => {
          const isLocked = !!img.protected && !unlocked;
          // Скрытые NDA-плитки вообще не показываем — оставляем только prompt сверху,
          // где можно ввести пароль и раскрыть всю группу разом.
          if (isLocked) return null;
          return (
            <figure
              key={n}
              className={
                mode === "phone"
                  ? "flex flex-col gap-3 items-center flex-shrink-0 w-[60%] sm:w-[42%] md:w-auto snap-center"
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
                <figcaption className="font-mono text-[12px] md:text-[13px] tracking-[0.16em] uppercase text-white/40 text-center px-2">
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
            className="flex-1 min-h-0 flex items-center justify-center px-4 md:px-8 overflow-hidden select-none [touch-action:none]"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onDoubleClick={toggleZoomAt}
            style={{ cursor: isZoomed ? "zoom-out" : "zoom-in" }}
          >
            <div
              className="relative w-full h-full max-w-[1400px] will-change-transform"
              style={{
                transform: `translate3d(${zoom.x}px, ${zoom.y}px, 0) scale(${zoom.scale})`,
                transformOrigin: "center center",
                transition: gestureStart.current ? "none" : "transform 180ms cubic-bezier(0.22,1,0.36,1)",
              }}
            >
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
                  className="object-contain pointer-events-none"
                  sizes="(max-width: 1400px) 100vw, 1400px"
                  draggable={false}
                />
              )}
            </div>
          </div>

          <div className="flex-shrink-0 px-4 py-4 md:py-5 flex flex-col items-center gap-2 text-center">
            {images[activeIndex].label && (
              <div className="font-mono text-[12px] md:text-[13px] tracking-[0.18em] uppercase text-white/45">
                {images[activeIndex].label}
              </div>
            )}
            {images[activeIndex].caption && (
              <div className="text-sm md:text-base text-white/85 leading-snug max-w-3xl max-h-[20vh] overflow-y-auto">
                {images[activeIndex].caption}
              </div>
            )}
            <div className="text-[12px] tracking-[0.12em] uppercase text-white/30">
              <span className="hidden md:inline">{activeIndex + 1} / {images.length} · ESC · ← → · 2× клик — зум</span>
              <span className="md:hidden">{activeIndex + 1} / {images.length} · щипок или 2× тап — зум</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

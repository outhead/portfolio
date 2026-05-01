"use client";

import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────────
 * HeroCoverVideo
 * Статичная видео-обложка hero на странице кейса.
 * Если задан pauseAt — видео ставится на эту секунду и стоит paused,
 * без autoplay/loop. Без pauseAt — обычная autoplay-петля.
 * ──────────────────────────────────────────────────────────────── */
export function HeroCoverVideo({
  src,
  poster,
  pauseAt,
  className,
}: {
  src: string;
  poster?: string;
  /** Секунда, на которой нужно «заморозить» кадр. Если undefined — обычный autoplay loop. */
  pauseAt?: number;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v || pauseAt === undefined) return;
    const seek = () => {
      try {
        v.currentTime = pauseAt;
      } catch {}
      v.pause();
    };
    if (v.readyState >= 1 /* HAVE_METADATA */) {
      seek();
    } else {
      v.addEventListener("loadedmetadata", seek, { once: true });
    }
  }, [pauseAt]);

  const usePauseMode = pauseAt !== undefined;
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay={!usePauseMode}
      muted
      loop={!usePauseMode}
      playsInline
      preload="auto"
      className={className}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────
 * CardCoverVideo
 * Видео-обложка для карточки проекта на главной.
 * State machine:
 *   - default      → currentTime = pauseAt, paused (если pauseAt задан)
 *                    иначе обычный autoplay loop
 *   - mouse enter  → play 0 → pauseAt → pause
 *   - mouse leave  → play pauseAt → end → pause на конце
 * ──────────────────────────────────────────────────────────────── */
export function CardCoverVideo({
  src,
  poster,
  pauseAt,
  className,
  hoverTarget,
}: {
  src: string;
  poster?: string;
  /** Секунда, на которой нужно зависнуть. */
  pauseAt?: number;
  className?: string;
  /** Внешний элемент, по hover которого надо реагировать (например, обёртка-Link). Пробрасывается через ref. */
  hoverTarget?: React.RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Изначальный seek в pauseAt
  useEffect(() => {
    const v = ref.current;
    if (!v || pauseAt === undefined) return;
    const seek = () => {
      try {
        v.currentTime = pauseAt;
      } catch {}
      v.pause();
    };
    if (v.readyState >= 1) seek();
    else v.addEventListener("loadedmetadata", seek, { once: true });
  }, [pauseAt]);

  // Hover-слушатели
  useEffect(() => {
    const target = hoverTarget?.current ?? ref.current?.parentElement;
    if (!target) return;
    const enter = () => setIsHovering(true);
    const leave = () => setIsHovering(false);
    target.addEventListener("mouseenter", enter);
    target.addEventListener("mouseleave", leave);
    return () => {
      target.removeEventListener("mouseenter", enter);
      target.removeEventListener("mouseleave", leave);
    };
  }, [hoverTarget]);

  // Реакция на смену hover-состояния
  useEffect(() => {
    const v = ref.current;
    if (!v || pauseAt === undefined) return;
    let cancelled = false;

    const onTimeUpdateEnter = () => {
      if (cancelled) return;
      if (v.currentTime >= pauseAt) {
        v.pause();
        v.removeEventListener("timeupdate", onTimeUpdateEnter);
      }
    };

    if (isHovering) {
      // Hover enter: play from 0 to pauseAt
      try {
        v.currentTime = 0;
      } catch {}
      v.removeEventListener("timeupdate", onTimeUpdateEnter);
      v.addEventListener("timeupdate", onTimeUpdateEnter);
      v.play().catch(() => {});
    } else {
      // Mouse leave: play from pauseAt → end
      try {
        v.currentTime = pauseAt;
      } catch {}
      v.removeEventListener("timeupdate", onTimeUpdateEnter);
      v.play().catch(() => {});
    }

    return () => {
      cancelled = true;
      v.removeEventListener("timeupdate", onTimeUpdateEnter);
    };
  }, [isHovering, pauseAt]);

  const usePauseMode = pauseAt !== undefined;
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay={!usePauseMode}
      muted
      loop={!usePauseMode}
      playsInline
      preload="auto"
      className={className}
      aria-hidden="true"
    />
  );
}

"use client";

import { useEffect, useRef } from "react";

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
  /** Был ли уже hover-цикл. Нужно чтобы на init НЕ запускать leave-логику. */
  const hasHoveredRef = useRef(false);

  useEffect(() => {
    const v = ref.current;
    if (!v || pauseAt === undefined) return;

    /** Гарантированно поставить на pauseAt и встать. */
    const seekAndPause = () => {
      try {
        v.currentTime = pauseAt;
      } catch {}
      v.pause();
    };

    /** Воспроизвести от 0 до pauseAt и встать. */
    const onTimeUpdateEnter = () => {
      if (v.currentTime >= pauseAt) {
        v.pause();
        v.removeEventListener("timeupdate", onTimeUpdateEnter);
      }
    };

    const onEnter = () => {
      hasHoveredRef.current = true;
      v.removeEventListener("timeupdate", onTimeUpdateEnter);
      try {
        v.currentTime = 0;
      } catch {}
      v.addEventListener("timeupdate", onTimeUpdateEnter);
      v.play().catch(() => {});
    };

    const onLeave = () => {
      // Не запускать play-out пока пользователь не hover-нул хотя бы один раз.
      // Иначе ловим mouseleave при первом рендере и видео уходит в play-out.
      if (!hasHoveredRef.current) return;
      v.removeEventListener("timeupdate", onTimeUpdateEnter);
      try {
        v.currentTime = pauseAt;
      } catch {}
      v.play().catch(() => {});
    };

    // Initial: дождаться метаданных, поставить на pauseAt, встать.
    if (v.readyState >= 1) {
      seekAndPause();
    } else {
      v.addEventListener("loadedmetadata", seekAndPause, { once: true });
    }

    // Hover-listener'ы вешаем на parentElement видео (это div-контейнер карточки внутри Link)
    const target = hoverTarget?.current ?? v.parentElement;
    if (target) {
      target.addEventListener("mouseenter", onEnter);
      target.addEventListener("mouseleave", onLeave);
    }

    return () => {
      v.removeEventListener("loadedmetadata", seekAndPause);
      v.removeEventListener("timeupdate", onTimeUpdateEnter);
      if (target) {
        target.removeEventListener("mouseenter", onEnter);
        target.removeEventListener("mouseleave", onLeave);
      }
    };
  }, [pauseAt, hoverTarget]);

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

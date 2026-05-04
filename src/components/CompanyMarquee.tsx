"use client";

import { useEffect, useRef } from "react";

/**
 * Бесконечный ряд компаний с auto-scroll + drag-to-spin (с инерцией).
 * Поведение:
 * - По умолчанию идёт медленно влево (-80 px/sec).
 * - На pointer-down — захват, лента следует за курсором.
 * - На pointer-up — текущая velocity flick'а сохраняется, постепенно
 *   затухает до базовой (decay ~0.96 за кадр).
 * - Мах flick'а ограничен ±3000 px/sec.
 * - При prefers-reduced-motion — лента стоит, drag всё ещё работает.
 */

const COMPANIES = ["МТС", "Ozon", "Газпром Нефть", "MWS AI", "ВШЭ"];

// Сколько раз дублировать список — чтобы контента всегда хватало даже при быстром флике
// на широком экране (4К). 5 копий × ~800px ≈ 4000px, покрывает любую раскрутку.
const N_COPIES = 5;

const BASE_VELOCITY = -80; // px/sec — обычная скорость дрейфа влево
const MAX_VELOCITY = 3000; // px/sec — потолок флика
const DECAY = 0.96; // коэф затухания velocity к BASE_VELOCITY за кадр

export default function CompanyMarquee() {
  const trackRef = useRef<HTMLDivElement>(null);
  const halfWidthRef = useRef(0);
  const offsetRef = useRef(0);
  const velocityRef = useRef(BASE_VELOCITY);
  const isDraggingRef = useRef(false);
  const lastFrameTimeRef = useRef(0);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const dragHistoryRef = useRef<Array<{ t: number; x: number }>>([]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) velocityRef.current = 0;

    const measure = () => {
      // Период повтора = ширина одного набора. Рендерим N_COPIES копий → делим scrollWidth на N.
      halfWidthRef.current = el.scrollWidth / N_COPIES;
    };
    measure();

    let raf = 0;
    const tick = (t: number) => {
      const last = lastFrameTimeRef.current || t;
      const dt = Math.min((t - last) / 1000, 0.05); // clamp dt чтобы не телепортировало
      lastFrameTimeRef.current = t;

      if (!isDraggingRef.current) {
        const target = reduced ? 0 : BASE_VELOCITY;
        const v = velocityRef.current;
        if (Math.abs(v - target) > 0.5) {
          velocityRef.current = target + (v - target) * DECAY;
        } else {
          velocityRef.current = target;
        }
        offsetRef.current += velocityRef.current * dt;

        const half = halfWidthRef.current;
        if (half > 0) {
          while (offsetRef.current <= -half) offsetRef.current += half;
          while (offsetRef.current > 0) offsetRef.current -= half;
        }
      }

      el.style.transform = `translateX(${offsetRef.current}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    dragHistoryRef.current = [{ t: performance.now(), x: e.clientX }];
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    offsetRef.current = dragStartOffsetRef.current + dx;

    const half = halfWidthRef.current;
    if (half > 0) {
      while (offsetRef.current <= -half) {
        offsetRef.current += half;
        dragStartOffsetRef.current += half;
      }
      while (offsetRef.current > 0) {
        offsetRef.current -= half;
        dragStartOffsetRef.current -= half;
      }
    }

    dragHistoryRef.current.push({ t: performance.now(), x: e.clientX });
    const cutoff = performance.now() - 100;
    while (dragHistoryRef.current.length > 1 && dragHistoryRef.current[0].t < cutoff) {
      dragHistoryRef.current.shift();
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore — pointerCapture мог не быть
    }

    const history = dragHistoryRef.current;
    if (history.length >= 2) {
      const first = history[0];
      const last = history[history.length - 1];
      const dt = (last.t - first.t) / 1000;
      if (dt > 0.01) {
        const dx = last.x - first.x;
        const v = dx / dt;
        velocityRef.current = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, v));
      }
    }
    dragHistoryRef.current = [];
  };

  return (
    <div
      aria-label="Компании, в которых я работал"
      className="relative rounded-2xl border border-white/[0.08] bg-white/[0.015] py-6 md:py-8 overflow-hidden"
    >
      <div
        className="relative overflow-hidden select-none touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ cursor: isDraggingRef.current ? "grabbing" : "grab" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-24 z-10"
          style={{ background: "linear-gradient(to right, rgba(10,10,10,1), rgba(10,10,10,0))" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-24 z-10"
          style={{ background: "linear-gradient(to left, rgba(10,10,10,1), rgba(10,10,10,0))" }}
        />
        <div ref={trackRef} className="flex items-center whitespace-nowrap will-change-transform">
          {Array.from({ length: N_COPIES }, (_, loopIdx) => (
            <div key={loopIdx} className="flex items-center shrink-0" aria-hidden={loopIdx > 0}>
              {COMPANIES.map((name) => (
                <span key={name + loopIdx} className="flex items-center">
                  <span className="font-p95 text-[22px] md:text-[32px] lg:text-[40px] tracking-[0.04em] uppercase text-white/80 leading-none px-6 md:px-10">
                    {name}
                  </span>
                  <span aria-hidden className="text-white/20 text-2xl md:text-3xl select-none leading-none">
                    ·
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

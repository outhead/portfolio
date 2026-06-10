"use client";

import { useEffect, useRef, type RefObject } from "react";
import { FW, FH, flowAngle } from "./field";

/**
 * Живой фон режима «магнитное поле»: частицы текут по тому же флоу-нойзу,
 * по которому хост сносит мяч (формула — в field.ts). Canvas 2D с fade-следами
 * («нити»), полноэкранный, pointer-events:none.
 *
 * Координаты: экранная точка маппится в канонические координаты поля через
 * rect игрового канваса (anchor) — над полем линии совпадают с реальной силой.
 * У гостя поле зеркалится по Y (mirror), как и игра, иначе он «читает» поле
 * наоборот. Время — локальное (у гостя косметика, физику всё равно шлёт хост).
 */
export default function MagneticWaves({
  anchor,
  mirror,
  opacity = 0.5,
}: {
  anchor: RefObject<HTMLCanvasElement | null>;
  mirror: boolean;
  opacity?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.max(1, Math.round(W * dpr));
      cv.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
    };
    size();
    window.addEventListener("resize", size);

    // rect игрового канваса — для маппинга экран → поле. Кэш, обновляем редко.
    let rL = 0, rT = 0, rScale = 1;
    const syncRect = () => {
      const a = anchor.current;
      if (!a) return;
      const r = a.getBoundingClientRect();
      if (!r.width) return;
      rL = r.left; rT = r.top; rScale = r.width / FW;
    };
    syncRect();
    window.addEventListener("resize", syncRect);

    // экран → канонические координаты поля (с зеркалом гостя)
    const toFieldY = (sy: number) => {
      const fy = (sy - rT) / rScale;
      return mirror ? FH - fy : fy;
    };

    const n = Math.min(850, Math.max(350, Math.round((W * H) / 1600)));
    const px = new Float32Array(n), py = new Float32Array(n);
    for (let i = 0; i < n; i++) { px[i] = Math.random() * W; py[i] = Math.random() * H; }

    const SPEED = 0.8;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let raf = 0, frames = 0;
    const frame = () => {
      if (++frames % 90 === 0) syncRect(); // лэйаут меняется редко
      const t = performance.now();
      // fade-след: прошлый кадр чуть гасится — частицы оставляют «нити»
      ctx.fillStyle = "rgba(0,0,0,0.055)";
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < n; i++) {
        const a = flowAngle((px[i] - rL) / rScale, toFieldY(py[i]), t);
        const vx = Math.cos(a) * SPEED;
        const vy = (mirror ? -Math.sin(a) : Math.sin(a)) * SPEED;
        px[i] += vx; py[i] += vy;
        // яркость дышит по тому же нойзу — лаймовые нити с тёмными провалами
        const sh = 0.35 + 0.65 * ((Math.sin(a) + 1) / 2);
        ctx.fillStyle = `rgba(${Math.round(140 * sh + 26)},255,${Math.round(40 * (1 - sh))},0.26)`;
        ctx.fillRect(px[i], py[i], 1.2, 1.2);
        if (px[i] < 0 || px[i] > W || py[i] < 0 || py[i] > H) {
          px[i] = Math.random() * W; py[i] = Math.random() * H;
        }
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    };

    if (reduce) {
      // статичный кадр: короткие штрихи вдоль поля, без анимации
      const t = performance.now();
      ctx.strokeStyle = "rgba(166,255,0,0.18)";
      ctx.lineWidth = 1;
      for (let i = 0; i < n * 2; i++) {
        let x = Math.random() * W, y = Math.random() * H;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let s = 0; s < 6; s++) {
          const a = flowAngle((x - rL) / rScale, toFieldY(y), t);
          x += Math.cos(a) * 3; y += (mirror ? -Math.sin(a) : Math.sin(a)) * 3;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else {
      frame();
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      window.removeEventListener("resize", syncRect);
    };
  }, [anchor, mirror]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity }}
    />
  );
}

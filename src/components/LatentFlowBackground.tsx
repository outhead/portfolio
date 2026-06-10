"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** цвет частиц "R,G,B" */
  color?: string;
  /** количество частиц */
  count?: number;
  /** скорость движения */
  speed?: number;
  /** масштаб поля (меньше — крупнее завихрения) */
  flowScale?: number;
  /** скорость растворения следов (больше — короче нити) */
  fade?: number;
  /** размер частицы, px */
  dotSize?: number;
  /** сила расталкивания курсором */
  push?: number;
  zIndex?: number;
};

export default function LatentFlowBackground({
  color = "110,150,125",
  count = 1600,
  speed = 0.55,
  flowScale = 0.0013,
  fade = 0.045,
  dotSize = 1.1,
  push = 0.6,
  zIndex = 0,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const [cr, cg, cb] = color.split(",").map(Number);
    let W = 0, H = 0, dpr = 1;
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#070907";
      ctx.fillRect(0, 0, W, H);
    };
    size();
    window.addEventListener("resize", size);

    const fr = (v: number) => v - Math.floor(v);
    const hs = (x: number, y: number) => fr(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
    const noise = (x: number, y: number) => {
      const ix = Math.floor(x), iy = Math.floor(y);
      let fx = x - ix, fy = y - iy;
      fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
      const a = hs(ix, iy), b = hs(ix + 1, iy), c = hs(ix, iy + 1), d = hs(ix + 1, iy + 1);
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };

    const n = Math.round(count);
    const px = new Float32Array(n), py = new Float32Array(n);
    for (let i = 0; i < n; i++) { px[i] = Math.random() * W; py[i] = Math.random() * H; }

    let mx = -9999, my = -9999, t = 0;
    const onMove = (e: PointerEvent) => { mx = e.clientX; my = e.clientY; };
    const onLeave = () => { mx = -9999; my = -9999; };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onLeave);

    let raf = 0;
    const frame = () => {
      ctx.fillStyle = `rgba(7,9,7,${fade})`;
      ctx.fillRect(0, 0, W, H);
      t += 0.0009;
      for (let i = 0; i < n; i++) {
        const a = noise(px[i] * flowScale, py[i] * flowScale + t) * 6.2831 * 2.0;
        let vx = Math.cos(a), vy = Math.sin(a);
        if (mx > -9000) {
          const dx = px[i] - mx, dy = py[i] - my, d = Math.hypot(dx, dy);
          if (d < 180) { vx += (dx / d) * push; vy += (dy / d) * push; }
        }
        px[i] += vx * speed; py[i] += vy * speed;
        const sh = 0.45 + 0.4 * noise(px[i] * 0.003, py[i] * 0.003);
        ctx.fillStyle = `rgba(${Math.round(cr * sh)},${Math.round(cg * sh)},${Math.round(cb * sh)},0.32)`;
        ctx.fillRect(px[i], py[i], dotSize, dotSize);
        if (px[i] < 0 || px[i] > W || py[i] < 0 || py[i] > H) { px[i] = Math.random() * W; py[i] = Math.random() * H; }
      }
      raf = requestAnimationFrame(frame);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onLeave);
    };
  }, [color, count, speed, flowScale, fade, dotSize, push]);

  return (
    <canvas ref={ref} aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", background: "#070907", zIndex }} />
  );
}

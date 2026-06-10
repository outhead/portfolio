"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** база (фон) "R,G,B" */
  bg?: string;
  /** цвет линий "R,G,B" */
  line?: string;
  /** акцент узлов "R,G,B" */
  accent?: string;
  /** количество линий */
  lines?: number;
  /** скорость дыхания */
  speed?: number;
  /** амплитуда потока, px */
  amp?: number;
  /** радиус реакции на курсор, px */
  cursorRadius?: number;
  /** высота вспучивания под курсором, px */
  cursorLift?: number;
  /** подсветка узлов у курсора */
  nodes?: boolean;
  zIndex?: number;
};

const rgb = (s: string) => s.replace("#", "").match(/.{2}/g)?.map((h) => parseInt(h, 16)).join(",") ?? s;

export default function ContourBackground({
  bg = "6,8,10",
  line = "45,150,70",
  accent = "160,255,90",
  lines = 44,
  speed = 0.013,
  amp = 92,
  cursorRadius = 150,
  cursorLift = 48,
  nodes = true,
  zIndex = 0,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const BG = rgb(bg), LN = rgb(line), AC = rgb(accent);
    const lnParts = LN.split(",").map(Number);

    let W = 0, H = 0, dpr = 1;
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size);

    const fr = (v: number) => v - Math.floor(v);
    const hash = (x: number, y: number) => fr(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
    const noise = (x: number, y: number) => {
      const ix = Math.floor(x), iy = Math.floor(y);
      let fx = x - ix, fy = y - iy;
      fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
      const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };

    let cx = -9999, cy = -9999, tcx = -9999, tcy = -9999, has = false, t = 0;
    const onMove = (e: PointerEvent) => { tcx = e.clientX; tcy = e.clientY; has = true; };
    const onLeave = () => { has = false; };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onLeave);

    const R2 = 2 * cursorRadius * cursorRadius;
    let raf = 0;
    const frame = () => {
      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, W, H);
      t += speed;
      if (has) {
        if (cx < -9000) { cx = tcx; cy = tcy; }
        cx += (tcx - cx) * 0.08; cy += (tcy - cy) * 0.08;
      }
      const gap = H / (lines - 9);
      for (let i = 0; i < lines; i++) {
        const baseY = i * gap - gap * 4.5;
        const pts: [number, number][] = [];
        for (let x = -12; x <= W + 12; x += 8) {
          const flow = (noise(x * 0.0015 + i * 0.1, t + i * 0.07) - 0.5) * amp +
            (noise(x * 0.005, t * 1.6 + i * 0.2) - 0.5) * (amp * 0.24);
          let y = baseY + flow;
          if (has) { const dx = x - cx, dy = y - cy; y -= cursorLift * Math.exp(-(dx * dx + dy * dy) / R2); }
          pts.push([x, y]);
        }
        const glow = has ? Math.exp(-((baseY - cy) * (baseY - cy)) / R2) : 0;
        const a = 0.09 + 0.15 * (i / lines) + glow * 0.3;
        ctx.beginPath();
        for (let k = 0; k < pts.length; k++) k ? ctx.lineTo(pts[k][0], pts[k][1]) : ctx.moveTo(pts[k][0], pts[k][1]);
        ctx.strokeStyle = `rgba(${lnParts[0] + Math.floor(glow * 90)},${lnParts[1] + i * 1.4},${lnParts[2] + Math.floor(glow * 60)},${a})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        if (has && nodes) {
          for (let n = 2; n < pts.length; n += 5) {
            const px = pts[n][0], py = pts[n][1], dx = px - cx, dy = py - cy;
            const g = Math.exp(-(dx * dx + dy * dy) / R2);
            if (g > 0.05) {
              ctx.fillStyle = `rgba(${AC},${g * 0.6})`;
              ctx.beginPath(); ctx.arc(px, py, 1 + g * 1.8, 0, 6.2832); ctx.fill();
            }
          }
        }
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
  }, [bg, line, accent, lines, speed, amp, cursorRadius, cursorLift, nodes]);

  return (
    <canvas ref={ref} aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex }} />
  );
}

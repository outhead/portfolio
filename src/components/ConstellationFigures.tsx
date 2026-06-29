"use client";

/* ─────────────────────────────────────────────────────────────────
 * ConstellationFigures — LED-панель менторинга: пиксельная «развилка».
 * Узел сверху ветвится вниз; центральный путь загорается зелёным и
 * ведёт к светящемуся узлу сеньор-лида, боковые развилки остаются
 * тусклым пунктиром (пути не пройдены). Фон — редкое зерно диодов.
 * Заголовок/CTA живут в секции (LedText) — панель рисует только арт.
 * Клик — пасхалка: зелёная сверхновая; шлёт `egg:found` ("constellation").
 * Canvas, DPR-aware (≤1.5), 40fps-кап, IO-пауза, prefers-reduced-motion.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

type Pt = { x: number; y: number };

// Геометрия в долях панели (портрет ~340×360). Развилка как в макете.
const TOP: Pt = { x: 0.52, y: 0.13 };
const MID: Pt = { x: 0.52, y: 0.40 };
const GOAL: Pt = { x: 0.52, y: 0.64 }; // зелёный светящийся — сеньор-лид
const LRING: Pt = { x: 0.24, y: 0.72 };
const RRING: Pt = { x: 0.82, y: 0.50 };
const LCTRL: Pt = { x: 0.40, y: 0.62 }; // контрол кривой к левому кольцу
const RCTRL: Pt = { x: 0.74, y: 0.42 }; // контрол кривой к правому кольцу

const GREEN = "166,255,0"; // акцент блока #A6FF00
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default function ConstellationFigures({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let dpr = 1, W = 1, H = 1;
    let stars: Array<{ x: number; y: number; p: number; s: number }> = [];
    let raf = 0, stopped = false, visible = true;
    const FRAME_MS = 1000 / 40;
    let lastDraw = 0;
    const start = performance.now();

    // курсор-параллакс и клик-сверхновая
    let mx = 0.5, my = 0.5;
    let burst = -1, bx = 0, by = 0, firedEgg = false;

    const P = (o: Pt) => ({ x: o.x * W, y: o.y * H });

    function dot(x: number, y: number, r: number, color: string, glow = 0) {
      if (glow) { ctx!.shadowColor = color; ctx!.shadowBlur = glow; } else ctx!.shadowBlur = 0;
      ctx!.fillStyle = color;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fill();
    }

    function lineDots(a: Pt, b: Pt, frac: number, r: number, color: string, gap: number) {
      const pa = P(a), pb = P(b);
      const len = Math.hypot(pb.x - pa.x, pb.y - pa.y);
      const n = Math.max(2, Math.round(len / gap));
      const lim = n * frac;
      for (let s = 0; s <= n; s++) {
        if (s > lim) break;
        const t = s / n;
        dot(lerp(pa.x, pb.x, t), lerp(pa.y, pb.y, t), r, color);
      }
    }

    function curveDots(a: Pt, c: Pt, b: Pt, frac: number, r: number, color: string) {
      const pa = P(a), pc = P(c), pb = P(b);
      const n = 26, lim = n * frac;
      for (let s = 0; s <= n; s++) {
        if (s > lim) break;
        if (s % 2) continue;
        const t = s / n, it = 1 - t;
        const x = it * it * pa.x + 2 * it * t * pc.x + t * t * pb.x;
        const y = it * it * pa.y + 2 * it * t * pc.y + t * t * pb.y;
        dot(x, y, r, color);
      }
    }

    function ringNode(o: Pt, R: number, color: string, phase: number, coreA: number) {
      const p = P(o);
      for (let a = 0; a < Math.PI * 2; a += 0.45) {
        if (((a * 2) | 0) % 2) continue;
        dot(p.x + Math.cos(a + phase) * R, p.y + Math.sin(a + phase) * R, 1.5, color);
      }
      dot(p.x, p.y, 2.4, `rgba(150,160,138,${coreA})`);
    }

    function crosshair(nx: number, ny: number, a: number) {
      const x = nx * W, y = ny * H;
      ctx!.strokeStyle = `rgba(150,160,138,${a})`;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(x - 6, y); ctx!.lineTo(x + 6, y);
      ctx!.moveTo(x, y - 6); ctx!.lineTo(x, y + 6);
      ctx!.stroke();
    }

    function bracket(nx: number, ny: number, s: number) {
      const x = nx * W, y = ny * H;
      ctx!.strokeStyle = `rgba(${GREEN},0.45)`;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(x - s, y - s + 6); ctx!.lineTo(x - s, y - s); ctx!.lineTo(x - s + 6, y - s);
      ctx!.moveTo(x + s - 6, y - s); ctx!.lineTo(x + s, y - s); ctx!.lineTo(x + s, y - s + 6);
      ctx!.moveTo(x - s, y + s - 6); ctx!.lineTo(x - s, y + s); ctx!.lineTo(x - s + 6, y + s);
      ctx!.moveTo(x + s - 6, y + s); ctx!.lineTo(x + s, y + s); ctx!.lineTo(x + s, y + s - 6);
      ctx!.stroke();
    }

    function draw(now: number) {
      if (stopped) return;
      const tt = (now - start) / 1000;
      ctx!.clearRect(0, 0, W, H);
      const px = (mx - 0.5) * 6, py = (my - 0.5) * 6;
      ctx!.save();
      ctx!.translate(px, py);

      // фон — редкое зерно диодов
      for (const st of stars) {
        const b = 0.07 + 0.07 * Math.sin(tt * st.s * 2 + st.p);
        dot(st.x, st.y, 1, `rgba(150,160,138,${reduce ? 0.08 : b})`);
      }

      // прогресс прорисовки
      const ip = reduce ? 1 : clamp01((tt - 0.3) / 1.6);
      const fp = reduce ? 1 : clamp01((ip - 0.5) * 2);

      // ствол сверху → развилка
      lineDots(TOP, MID, clamp01(ip * 2), 1.6, "rgba(150,160,138,0.75)", 9);
      // боковые развилки — тусклый пунктир
      curveDots(MID, LCTRL, LRING, fp, 1.5, "rgba(120,128,108,0.6)");
      curveDots(MID, RCTRL, RRING, fp, 1.5, "rgba(120,128,108,0.6)");
      // выбранный путь — зелёный
      lineDots(MID, GOAL, fp, 1.8, `rgba(${GREEN},0.45)`, 8);

      // узлы
      ringNode(TOP, 7, "rgba(120,128,108,0.7)", 0, 0.5);
      if (fp > 0.5) {
        ringNode(LRING, 7, "rgba(110,118,98,0.5)", reduce ? 0 : tt * 0.25, 0.4);
        ringNode(RRING, 7, "rgba(110,118,98,0.5)", reduce ? 0 : -tt * 0.25, 0.4);
      }

      // зелёный узел-цель с блумом
      if (fp > 0.7) {
        const g = P(GOAL);
        const br = reduce ? 1 : 0.8 + 0.2 * Math.sin(tt * 2.3);
        dot(g.x, g.y, 12, `rgba(${GREEN},${0.10 * br})`, 26);
        dot(g.x, g.y, 5.5, `rgba(${GREEN},${br})`, 18);
        dot(g.x, g.y, 2.4, "rgba(234,255,176,1)", 10);
        if (!reduce)
          for (let a = 0; a < Math.PI * 2; a += 0.52)
            dot(g.x + Math.cos(a + tt * 0.6) * 9, g.y + Math.sin(a + tt * 0.6) * 9, 1.3, `rgba(${GREEN},0.7)`);
      }

      // зелёный импульс: вершина → цель по выбранному пути
      if (!reduce && fp > 0.9) {
        const pp = (tt * 0.5) % 1;
        const top = P(TOP), mid = P(MID), goal = P(GOAL);
        let x: number, y: number;
        if (pp < 0.45) { const t = pp / 0.45; x = lerp(top.x, mid.x, t); y = lerp(top.y, mid.y, t); }
        else { const t = (pp - 0.45) / 0.55; x = lerp(mid.x, goal.x, t); y = lerp(mid.y, goal.y, t); }
        dot(x, y, 3, "rgba(207,255,122,1)", 14);
      }

      // мишени + скобка-рамка (редко мигают)
      if (ip > 0.6) {
        const bl = reduce ? 0.2 : 0.18 + 0.16 * Math.max(0, Math.sin(tt * 0.7));
        crosshair(0.16, 0.30, bl);
        crosshair(0.9, 0.86, bl * 0.8);
        bracket(0.86, 0.24, 12);
      }

      // клик-сверхновая
      if (burst >= 0) {
        const bp = (now - burst) / 1200;
        if (bp >= 1) burst = -1;
        else {
          const wr = bp * Math.hypot(W, H) * 0.55;
          ctx!.strokeStyle = `rgba(${GREEN},${(1 - bp) * 0.5})`;
          ctx!.lineWidth = 2;
          ctx!.beginPath();
          ctx!.arc(bx, by, wr, 0, Math.PI * 2);
          ctx!.stroke();
        }
      }

      ctx!.restore();
      ctx!.shadowBlur = 0;
    }

    function tick(now: number) {
      if (stopped || !visible || reduce) return;
      raf = requestAnimationFrame(tick);
      if (now - lastDraw < FRAME_MS) return;
      lastDraw = now;
      draw(now);
    }

    function fit() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((W * H) / 1100);
      stars = [];
      for (let i = 0; i < n; i++)
        stars.push({ x: Math.random() * W, y: Math.random() * H, p: Math.random() * Math.PI * 2, s: 0.3 + Math.random() * 0.5 });
      if (reduce) draw(start + 3000);
    }

    function onMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      mx = (e.clientX - rect.left) / rect.width;
      my = (e.clientY - rect.top) / rect.height;
    }

    function onDown(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      bx = e.clientX - rect.left;
      by = e.clientY - rect.top;
      burst = performance.now();
      if (!firedEgg) {
        firedEgg = true;
        try { window.dispatchEvent(new CustomEvent("egg:found", { detail: "constellation" })); } catch {}
      }
      if (reduce) draw(performance.now());
    }

    const ro = new ResizeObserver(() => fit());
    ro.observe(canvas);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    fit();
    if (!reduce) raf = requestAnimationFrame(tick);

    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries[0]?.isIntersecting ?? true;
        if (vis && !visible && !reduce) {
          visible = true;
          raf = requestAnimationFrame(tick);
        } else if (!vis && visible) {
          visible = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block", cursor: "pointer" }}
      aria-label="LED-развилка: путь к узлу сеньор-лида — нажми, чтобы запустить сверхновую"
      role="img"
    />
  );
}

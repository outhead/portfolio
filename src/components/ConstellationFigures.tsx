"use client";

/* ─────────────────────────────────────────────────────────────────
 * ConstellationFigures — игрок головоломки «призмы и зеркало».
 * Логика и отрисовка — в lib/optics + lib/opticsRender. Здесь только
 * стартовое состояние из уровня, перетаскивание элементов и цикл кадра.
 * Уровень data-driven (DEFAULT_LEVEL или проп level). Все цели своего
 * цвета (включая белую) → onSolve() + egg:found("constellation").
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import {
  DEFAULT_LEVEL,
  mirrorEnds,
  targetHits,
  trace,
  type Level,
  type Live,
  type Pt,
  type Target,
} from "@/lib/optics";
import { drawField } from "@/lib/opticsRender";

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export default function ConstellationFigures({
  className = "",
  level = DEFAULT_LEVEL,
  onSolve,
}: {
  className?: string;
  level?: Level;
  onSolve?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const solveCb = useRef(onSolve);
  solveCb.current = onSolve;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let dpr = 1, W = 1, H = 1;
    let raf = 0, stopped = false, visible = true;
    const FRAME_MS = 1000 / 40;
    let lastDraw = 0;
    const start = performance.now();

    const live: Live = { emitter: { x: 0, y: 0 }, stones: [], mirror: null };
    let targetsPx: Target[] = [];
    let drag: { kind: "stone" | "mirror" | "mrot"; i?: number } | null = null;
    let solved = false, solveT = -1, fired = false;

    function layoutFromLevel() {
      live.emitter = { x: level.emitter.x * W, y: level.emitter.y * H };
      live.stones = level.stones.map((s) => ({ p: { x: s.x * W, y: s.y * H }, minus: s.minus, plus: s.plus }));
      live.mirror = level.mirror ? { p: { x: level.mirror.x * W, y: level.mirror.y * H }, ang: level.mirror.ang } : null;
      targetsPx = level.targets.map((t) => ({ key: t.key, x: t.x * W, y: t.y * H }));
    }

    function draw(now: number) {
      if (stopped) return;
      const segs = trace(live, W, H);
      const hits = targetHits(segs, targetsPx);
      const all = hits.length > 0 && hits.every(Boolean);
      if (all && !solved) {
        solved = true; solveT = now;
        if (!fired) {
          fired = true;
          try { window.dispatchEvent(new CustomEvent("egg:found", { detail: "constellation" })); } catch {}
          solveCb.current?.();
        }
      }
      drawField(ctx!, W, H, live, { segs, targetsPx, hits, time: (now - start) / 1000, solved, solveT, reduce });
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
      layoutFromLevel();
      if (reduce) draw(performance.now());
    }

    function pos(e: PointerEvent): Pt {
      const rect = canvas!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onDown(e: PointerEvent) {
      const p = pos(e);
      if (live.mirror) {
        const [mA] = mirrorEnds(live.mirror);
        if (Math.hypot(p.x - mA.x, p.y - mA.y) < 16) { drag = { kind: "mrot" }; }
      }
      if (!drag) {
        let bi = -1, best = 20;
        live.stones.forEach((s, i) => {
          const d = Math.hypot(p.x - s.p.x, p.y - s.p.y);
          if (d < best) { best = d; bi = i; }
        });
        if (bi >= 0) drag = { kind: "stone", i: bi };
        else if (live.mirror && Math.hypot(p.x - live.mirror.p.x, p.y - live.mirror.p.y) < 26) drag = { kind: "mirror" };
      }
      try { canvas!.setPointerCapture(e.pointerId); } catch {}
      if (reduce && drag) draw(performance.now());
    }
    function onMove(e: PointerEvent) {
      if (!drag) return;
      const p = pos(e);
      const cp = { x: clamp(p.x, 8, W - 8), y: clamp(p.y, 8, H - 8) };
      if (drag.kind === "stone" && drag.i != null) live.stones[drag.i].p = cp;
      else if (drag.kind === "mirror" && live.mirror) live.mirror.p = cp;
      else if (drag.kind === "mrot" && live.mirror) live.mirror.ang = Math.atan2(p.y - live.mirror.p.y, p.x - live.mirror.p.x);
      if (reduce) draw(performance.now());
    }
    function onUp() { drag = null; }

    const ro = new ResizeObserver(() => fit());
    ro.observe(canvas);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    fit();
    if (!reduce) raf = requestAnimationFrame(tick);

    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries[0]?.isIntersecting ?? true;
        if (vis && !visible && !reduce) { visible = true; raf = requestAnimationFrame(tick); }
        else if (!vis && visible) { visible = false; cancelAnimationFrame(raf); }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [level]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block", cursor: "grab", touchAction: "none" }}
      aria-label="Головоломка: расщепи луч призмами и заверни зеркалом — зажги все узлы своего цвета"
      role="img"
    />
  );
}

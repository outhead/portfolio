"use client";

/* ─────────────────────────────────────────────────────────────────
 * ConstellationFigures — игрок головоломки «призмы и зеркало».
 * Логика/отрисовка — lib/optics + lib/opticsRender. Геометрия в
 * логическом поле FIELD_W×FIELD_H (uniform-scale в канвас), чтобы
 * раскладка из редактора переносилась один-в-один независимо от
 * размера панели. lockMirror=true — двигать можно только камни.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import {
  DEFAULT_LEVEL,
  FIELD_H,
  FIELD_W,
  mirrorEnds,
  targetHits,
  trace,
  type Level,
  type Live,
  type Pt,
  type Target,
} from "@/lib/optics";
import { drawField } from "@/lib/opticsRender";

const LW = FIELD_W, LH = FIELD_H;
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export default function ConstellationFigures({
  className = "",
  level = DEFAULT_LEVEL,
  lockMirror = false,
  onSolve,
}: {
  className?: string;
  level?: Level;
  lockMirror?: boolean;
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

    let dpr = 1, s = 1, offX = 0, offY = 0;
    let raf = 0, stopped = false, visible = true;
    const FRAME_MS = 1000 / 40;
    let lastDraw = 0;
    const start = performance.now();

    const live: Live = { emitter: { x: 0, y: 0 }, stones: [], mirror: null };
    let targetsPx: Target[] = [];
    let drag: { kind: "stone" | "mirror" | "mrot"; i?: number } | null = null;
    let solved = false, solveT = -1, fired = false;

    function layoutFromLevel() {
      live.emitter = { x: level.emitter.x * LW, y: level.emitter.y * LH };
      live.stones = level.stones.map((st) => ({ p: { x: st.x * LW, y: st.y * LH }, minus: st.minus, plus: st.plus }));
      live.mirror = level.mirror ? { p: { x: level.mirror.x * LW, y: level.mirror.y * LH }, ang: level.mirror.ang } : null;
      targetsPx = level.targets.map((t) => ({ key: t.key, x: t.x * LW, y: t.y * LH }));
    }

    function draw(now: number) {
      if (stopped) return;
      const segs = trace(live, LW, LH, undefined, targetsPx);
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
      drawField(ctx!, LW, LH, live, { segs, targetsPx, hits, time: (now - start) / 1000, solved, solveT, reduce });
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
      canvas!.width = Math.round(rect.width * dpr);
      canvas!.height = Math.round(rect.height * dpr);
      // uniform-scale логического поля в канвас (contain)
      s = Math.min(rect.width / LW, rect.height / LH);
      offX = (rect.width - LW * s) / 2;
      offY = (rect.height - LH * s) / 2;
      ctx!.setTransform(dpr * s, 0, 0, dpr * s, dpr * offX, dpr * offY);
      layoutFromLevel();
      if (reduce) draw(performance.now());
    }

    function pos(e: PointerEvent): Pt {
      const rect = canvas!.getBoundingClientRect();
      return {
        x: clamp(((e.clientX - rect.left) - offX) / s, 0, LW),
        y: clamp(((e.clientY - rect.top) - offY) / s, 0, LH),
      };
    }
    function onDown(e: PointerEvent) {
      const p = pos(e);
      if (live.mirror && !lockMirror) {
        const [mA] = mirrorEnds(live.mirror);
        if (Math.hypot(p.x - mA.x, p.y - mA.y) < 16) drag = { kind: "mrot" };
      }
      if (!drag) {
        let bi = -1, best = 22;
        live.stones.forEach((st, i) => {
          const d = Math.hypot(p.x - st.p.x, p.y - st.p.y);
          if (d < best) { best = d; bi = i; }
        });
        if (bi >= 0) drag = { kind: "stone", i: bi };
        else if (live.mirror && !lockMirror && Math.hypot(p.x - live.mirror.p.x, p.y - live.mirror.p.y) < 26) drag = { kind: "mirror" };
      }
      try { canvas!.setPointerCapture(e.pointerId); } catch {}
      if (reduce && drag) draw(performance.now());
    }
    function onMove(e: PointerEvent) {
      if (!drag) return;
      const p = pos(e);
      const cp = { x: clamp(p.x, 6, LW - 6), y: clamp(p.y, 6, LH - 6) };
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
  }, [level, lockMirror]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block", cursor: "grab", touchAction: "none" }}
      aria-label="Головоломка: двигай камни-призмы, чтобы зажечь все узлы своего цвета"
      role="img"
    />
  );
}

"use client";

/* ─────────────────────────────────────────────────────────────────
 * ConstellationFigures — мини-головоломка «двойное разделение луча».
 * Эмиттер сверху пускает луч. Два ДЕЛИТЕЛЯ (ромбы) надо перетащить на
 * луч: первый расщепляет ствол на боковые ветви + центр; второй ставится
 * на центральную ветвь и расщепляет её ещё раз. Нужно зажечь все 4 узла.
 * Луч можно крутить (сбивает прицел). Все цели зажжены → onSolve() +
 * пасхалка egg:found("constellation"). Без параллакса/мерцания.
 * Canvas, DPR≤1.5, 40fps-кап, IO-пауза, prefers-reduced-motion.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

type Pt = { x: number; y: number };

const GREEN = "166,255,0";
const DIM = "120,128,108";
const GRID = "150,160,138";

const EM_F: Pt = { x: 0.5, y: 0.1 };
const SA_Y = 0.34; // каноническая высота делителя A
const SB_Y = 0.56; // делителя B
const TOP_Y = 0.5; // высота верхних целей
const BOT_Y = 0.8; // высота нижних целей
const SPREAD = (38 * Math.PI) / 180;
const SPREAD2 = (33 * Math.PI) / 180;
const THR = 15; // допуск «делитель на луче» (px)
const HITR = 17; // допуск попадания в цель (px)

const rot = (v: Pt, a: number): Pt => ({
  x: v.x * Math.cos(a) - v.y * Math.sin(a),
  y: v.x * Math.sin(a) + v.y * Math.cos(a),
});
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / l2;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

export default function ConstellationFigures({
  className = "",
  onSolve,
}: {
  className?: string;
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

    let theta = 0;
    let EM: Pt = { x: 0, y: 0 };
    let TL: Pt = { x: 0, y: 0 }, TR: Pt = { x: 0, y: 0 };
    let BL: Pt = { x: 0, y: 0 }, BR: Pt = { x: 0, y: 0 };
    let spA: Pt = { x: 0, y: 0 }, spB: Pt = { x: 0, y: 0 };
    let drag: "beam" | "A" | "B" | null = null;
    let solved = false, solveT = -1, fired = false;
    let lattice: Pt[] = [];

    const F = (o: Pt): Pt => ({ x: o.x * W, y: o.y * H });

    function dot(x: number, y: number, r: number, color: string, glow = 0) {
      ctx!.shadowBlur = glow;
      if (glow) ctx!.shadowColor = `rgba(${GREEN},0.9)`;
      ctx!.fillStyle = color;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.shadowBlur = 0;
    }

    function beam(a: Pt, b: Pt, color: string, gap = 6, r = 1.5) {
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const n = Math.max(1, Math.round(len / gap));
      for (let s = 0; s <= n; s++) {
        const t = s / n;
        dot(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, r, color);
      }
    }

    function node(p: Pt, R: number, color: string, fill = 0) {
      for (let a = 0; a < Math.PI * 2; a += 0.5)
        dot(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R, 1.3, color);
      if (fill) dot(p.x, p.y, 2.2, `rgba(${GREEN},${fill})`);
    }

    function diamond(p: Pt, s: number, color: string) {
      for (let i = -s; i <= s; i++) {
        const w = s - Math.abs(i);
        for (let j = -w; j <= w; j += 2) dot(p.x + j, p.y + i, 1.1, color);
      }
    }

    function corner(nx: number, ny: number, sz: number, color: string) {
      const x = nx * W, y = ny * H;
      ctx!.strokeStyle = color;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(x - sz, y - sz + 6); ctx!.lineTo(x - sz, y - sz); ctx!.lineTo(x - sz + 6, y - sz);
      ctx!.moveTo(x + sz - 6, y - sz); ctx!.lineTo(x + sz, y - sz); ctx!.lineTo(x + sz, y - sz + 6);
      ctx!.moveTo(x - sz, y + sz - 6); ctx!.lineTo(x - sz, y + sz); ctx!.lineTo(x - sz + 6, y + sz);
      ctx!.moveTo(x + sz - 6, y + sz); ctx!.lineTo(x + sz, y + sz); ctx!.lineTo(x + sz, y + sz - 6);
      ctx!.stroke();
    }

    function exit(o: Pt, d: Pt): Pt {
      let t = 1e9;
      if (d.x > 1e-4) t = Math.min(t, (W - o.x) / d.x);
      else if (d.x < -1e-4) t = Math.min(t, -o.x / d.x);
      if (d.y > 1e-4) t = Math.min(t, (H - o.y) / d.y);
      else if (d.y < -1e-4) t = Math.min(t, -o.y / d.y);
      return { x: o.x + d.x * t, y: o.y + d.y * t };
    }

    type Geo = {
      d: Pt;
      aOn: boolean; bOn: boolean;
      A: Pt | null; B: Pt | null;
      trunkEnd: Pt;
      aLend: Pt; aRend: Pt; cEnd: Pt; bLend: Pt; bRend: Pt;
    };

    function geometry(): Geo {
      const d: Pt = { x: Math.sin(theta), y: Math.cos(theta) };
      // делитель A на стволе?
      const ax = spA.x - EM.x, ay = spA.y - EM.y;
      const ap = ax * d.x + ay * d.y;
      const aN = { x: EM.x + d.x * ap, y: EM.y + d.y * ap };
      const aOn = ap > 24 && Math.hypot(spA.x - aN.x, spA.y - aN.y) < THR;
      const A = aOn ? aN : null;

      const cOrigin = A ?? EM;
      // делитель B на центральной ветви (после A)?
      let bOn = false, B: Pt | null = null;
      if (aOn) {
        const bx = spB.x - cOrigin.x, by = spB.y - cOrigin.y;
        const bp = bx * d.x + by * d.y;
        const bN = { x: cOrigin.x + d.x * bp, y: cOrigin.y + d.y * bp };
        bOn = bp > 16 && Math.hypot(spB.x - bN.x, spB.y - bN.y) < THR;
        if (bOn) B = bN;
      }

      const trunkEnd = A ?? exit(EM, d);
      const aLend = A ? exit(A, rot(d, -SPREAD)) : EM;
      const aRend = A ? exit(A, rot(d, SPREAD)) : EM;
      const cEnd = B ?? exit(cOrigin, d);
      const bLend = B ? exit(B, rot(d, -SPREAD2)) : EM;
      const bRend = B ? exit(B, rot(d, SPREAD2)) : EM;

      return { d, aOn, bOn, A, B, trunkEnd, aLend, aRend, cEnd, bLend, bRend };
    }

    function draw(now: number) {
      if (stopped) return;
      const tt = (now - start) / 1000;
      ctx!.clearRect(0, 0, W, H);
      for (const g of lattice) dot(g.x, g.y, 0.8, `rgba(${GRID},0.05)`);

      const G = geometry();
      const lit = `rgba(${GREEN},0.85)`;
      const dim = `rgba(${DIM},0.7)`;

      // попадания
      const hTL = G.aOn && segDist(TL.x, TL.y, G.A!.x, G.A!.y, G.aLend.x, G.aLend.y) < HITR;
      const hTR = G.aOn && segDist(TR.x, TR.y, G.A!.x, G.A!.y, G.aRend.x, G.aRend.y) < HITR;
      const hBL = G.bOn && segDist(BL.x, BL.y, G.B!.x, G.B!.y, G.bLend.x, G.bLend.y) < HITR;
      const hBR = G.bOn && segDist(BR.x, BR.y, G.B!.x, G.B!.y, G.bRend.x, G.bRend.y) < HITR;
      const all = hTL && hTR && hBL && hBR;
      if (all && !solved) {
        solved = true; solveT = now;
        if (!fired) {
          fired = true;
          try { window.dispatchEvent(new CustomEvent("egg:found", { detail: "constellation" })); } catch {}
          solveCb.current?.();
        }
      }

      // ствол
      beam(EM, G.trunkEnd, lit, 6, 1.6);
      if (G.aOn && G.A) {
        beam(G.A, G.aLend, hTL ? lit : dim, 6, 1.5);
        beam(G.A, G.aRend, hTR ? lit : dim, 6, 1.5);
        beam(G.A, G.cEnd, lit, 6, 1.5);
        if (G.bOn && G.B) {
          beam(G.B, G.bLend, hBL ? lit : dim, 6, 1.5);
          beam(G.B, G.bRend, hBR ? lit : dim, 6, 1.5);
        }
      }

      // бегущие импульсы по горящим ветвям
      if (!reduce) {
        const pp = (tt * 0.55) % 1;
        const pulse = (a: Pt, b: Pt) => dot(a.x + (b.x - a.x) * pp, a.y + (b.y - a.y) * pp, 2.4, "rgba(207,255,122,0.95)", 12);
        if (hTL && G.A) pulse(G.A, G.aLend);
        if (hTR && G.A) pulse(G.A, G.aRend);
        if (hBL && G.B) pulse(G.B, G.bLend);
        if (hBR && G.B) pulse(G.B, G.bRend);
      }

      // эмиттер
      node(EM, 6, `rgba(${GRID},0.75)`, 0.5);
      dot(EM.x, EM.y, 2.2, `rgba(${GREEN},0.9)`, 8);

      // цели
      const target = (p: Pt, hit: boolean) => {
        if (hit) {
          dot(p.x, p.y, 9, `rgba(${GREEN},0.10)`, 16);
          dot(p.x, p.y, 4, `rgba(${GREEN},0.95)`, 14);
          dot(p.x, p.y, 2, "rgba(234,255,176,1)", 8);
          node(p, 7, `rgba(${GREEN},0.8)`);
        } else {
          node(p, 7, `rgba(${DIM},0.5)`, 0.25);
        }
      };
      target(TL, hTL); target(TR, hTR); target(BL, hBL); target(BR, hBR);

      // делители
      diamond(spA, 7, G.aOn ? `rgba(${GREEN},0.95)` : `rgba(${GRID},0.6)`);
      diamond(spB, 6, G.bOn ? `rgba(${GREEN},0.95)` : `rgba(${GRID},0.55)`);

      corner(0.9, 0.18, 11, solved ? `rgba(${GREEN},0.6)` : `rgba(${GRID},0.28)`);

      // вспышка успеха
      if (solved && solveT >= 0) {
        const bp = (now - solveT) / 1100;
        if (bp < 1) {
          const wr = bp * Math.hypot(W, H) * 0.55;
          ctx!.strokeStyle = `rgba(${GREEN},${(1 - bp) * 0.55})`;
          ctx!.lineWidth = 2;
          ctx!.beginPath();
          ctx!.arc(EM.x, EM.y + H * 0.4, wr, 0, Math.PI * 2);
          ctx!.stroke();
        }
      }
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

      EM = F(EM_F);
      const d = { x: 0, y: 1 };
      const SA = { x: EM.x, y: SA_Y * H };
      const dAl = rot(d, -SPREAD), dAr = rot(d, SPREAD);
      TL = { x: SA.x + dAl.x * ((TOP_Y * H - SA.y) / dAl.y), y: TOP_Y * H };
      TR = { x: SA.x + dAr.x * ((TOP_Y * H - SA.y) / dAr.y), y: TOP_Y * H };
      const SB = { x: EM.x, y: SB_Y * H };
      const dBl = rot(d, -SPREAD2), dBr = rot(d, SPREAD2);
      BL = { x: SB.x + dBl.x * ((BOT_Y * H - SB.y) / dBl.y), y: BOT_Y * H };
      BR = { x: SB.x + dBr.x * ((BOT_Y * H - SB.y) / dBr.y), y: BOT_Y * H };

      lattice = [];
      const step = 14;
      for (let y = step; y < H; y += step)
        for (let x = step; x < W; x += step) lattice.push({ x, y });

      // стартовые позиции делителей — в углах снизу, не на луче
      if (spA.x === 0) spA = { x: 0.18 * W, y: 0.9 * H };
      if (spB.x === 0) spB = { x: 0.82 * W, y: 0.9 * H };

      if (reduce) draw(start + 3000);
    }

    function pos(e: PointerEvent): Pt {
      const rect = canvas!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onDown(e: PointerEvent) {
      const p = pos(e);
      if (Math.hypot(p.x - spA.x, p.y - spA.y) < 22) drag = "A";
      else if (Math.hypot(p.x - spB.x, p.y - spB.y) < 22) drag = "B";
      else { drag = "beam"; theta = clamp(Math.atan2(p.x - EM.x, p.y - EM.y), -0.7, 0.7); }
      try { canvas!.setPointerCapture(e.pointerId); } catch {}
      if (reduce) draw(performance.now());
    }
    function onMove(e: PointerEvent) {
      if (!drag) return;
      const p = pos(e);
      if (drag === "A") spA = { x: clamp(p.x, 8, W - 8), y: clamp(p.y, 8, H - 8) };
      else if (drag === "B") spB = { x: clamp(p.x, 8, W - 8), y: clamp(p.y, 8, H - 8) };
      else theta = clamp(Math.atan2(p.x - EM.x, p.y - EM.y), -0.7, 0.7);
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block", cursor: "grab", touchAction: "none" }}
      aria-label="Головоломка: перетащи два делителя на луч и зажги все четыре узла"
      role="img"
    />
  );
}

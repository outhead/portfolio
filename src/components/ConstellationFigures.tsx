"use client";

/* ─────────────────────────────────────────────────────────────────
 * ConstellationFigures — мини-головоломка «луч развилки» в LED-стиле.
 * Эмиттер сверху пускает луч. По умолчанию луч идёт вниз в центральный
 * узел (сеньор-лид) — путь уже есть. На поле лежит ДЕЛИТЕЛЬ (призма):
 * перетащи его на луч — луч расщепляется натрое, боковые ветви зажигают
 * два боковых узла. Все три цели зажжены → «срабатывает»: вспышка +
 * пасхалка egg:found("constellation"). Луч можно крутить (сбивает цель).
 * Без параллакса/мерцания (статичный фон). Canvas, DPR≤1.5, 40fps-кап,
 * IO-пауза, prefers-reduced-motion рисует решённое состояние.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

type Pt = { x: number; y: number };

const GREEN = "166,255,0"; // #A6FF00
const DIM = "120,128,108";
const GRID = "150,160,138";

const EM_F: Pt = { x: 0.5, y: 0.11 }; // эмиттер
const GOAL_F: Pt = { x: 0.5, y: 0.66 }; // центральная цель
const SPLIT_Y = 0.42; // каноническая высота делителя
const SIDE_Y = 0.7; // высота боковых целей
const SPREAD = (40 * Math.PI) / 180; // угол расщепления
const HITR = 17; // допуск попадания (px)

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
    let raf = 0, stopped = false, visible = true;
    const FRAME_MS = 1000 / 40;
    let lastDraw = 0;
    const start = performance.now();

    // ── состояние игры ──────────────────────────────────────────
    let theta = 0; // угол луча (0 = строго вниз)
    let EM: Pt = { x: 0, y: 0 };
    let GOAL: Pt = { x: 0, y: 0 };
    let LEFT: Pt = { x: 0, y: 0 };
    let RIGHT: Pt = { x: 0, y: 0 };
    let splitter: Pt = { x: 0, y: 0 }; // позиция делителя (px)
    let drag: "beam" | "split" | null = null;
    let solved = false, solveT = -1, firedEgg = false;
    // статичная решётка фона
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

    // дотовый луч-сегмент
    function beam(ax: number, ay: number, bx: number, by: number, color: string, gap = 6, r = 1.5) {
      const len = Math.hypot(bx - ax, by - ay);
      const n = Math.max(1, Math.round(len / gap));
      for (let s = 0; s <= n; s++) {
        const t = s / n;
        dot(ax + (bx - ax) * t, ay + (by - ay) * t, r, color);
      }
    }

    // пиксельное кольцо-узел
    function node(p: Pt, R: number, color: string, fill = 0) {
      for (let a = 0; a < Math.PI * 2; a += 0.5)
        dot(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R, 1.3, color);
      if (fill) dot(p.x, p.y, 2.2, `rgba(${GREEN},${fill})`);
    }

    function diamond(p: Pt, s: number, color: string) {
      // пиксельный ромб-делитель
      ctx!.fillStyle = color;
      for (let i = -s; i <= s; i++) {
        const w = s - Math.abs(i);
        for (let j = -w; j <= w; j += 2)
          dot(p.x + j, p.y + i, 1.1, color);
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

    // ── геометрия луча ──────────────────────────────────────────
    function exit(o: Pt, d: Pt): Pt {
      // точка выхода луча за пределы панели
      let t = 1e9;
      if (d.x > 1e-4) t = Math.min(t, (W - o.x) / d.x);
      else if (d.x < -1e-4) t = Math.min(t, -o.x / d.x);
      if (d.y > 1e-4) t = Math.min(t, (H - o.y) / d.y);
      else if (d.y < -1e-4) t = Math.min(t, -o.y / d.y);
      return { x: o.x + d.x * t, y: o.y + d.y * t };
    }

    type Seg = { a: Pt; b: Pt };
    function geometry(): { segs: Seg[]; active: boolean; split: Pt | null } {
      const d: Pt = { x: Math.sin(theta), y: Math.cos(theta) };
      // проекция делителя на луч
      const tx = splitter.x - EM.x, ty = splitter.y - EM.y;
      const proj = tx * d.x + ty * d.y;
      const nearest = { x: EM.x + d.x * proj, y: EM.y + d.y * proj };
      const perp = Math.hypot(splitter.x - nearest.x, splitter.y - nearest.y);
      const active = proj > 24 && proj < Math.hypot(W, H) && perp < 16;

      if (!active) {
        return { segs: [{ a: EM, b: exit(EM, d) }], active: false, split: null };
      }
      const S = nearest;
      const dl = rot(d, -SPREAD), drr = rot(d, SPREAD);
      return {
        segs: [
          { a: EM, b: S }, // ствол
          { a: S, b: exit(S, d) }, // центр
          { a: S, b: exit(S, dl) }, // левая ветвь
          { a: S, b: exit(S, drr) }, // правая ветвь
        ],
        active: true,
        split: S,
      };
    }

    function hits(segs: Seg[], tgt: Pt) {
      for (const s of segs) {
        // цель должна быть «по ходу» — между началом и концом сегмента
        if (segDist(tgt.x, tgt.y, s.a.x, s.a.y, s.b.x, s.b.y) < HITR) return true;
      }
      return false;
    }

    function draw(now: number) {
      if (stopped) return;
      const tt = (now - start) / 1000;
      ctx!.clearRect(0, 0, W, H);

      // статичный фон-решётка (без мерцания)
      for (const g of lattice) dot(g.x, g.y, 0.8, `rgba(${GRID},0.05)`);

      const { segs, active, split } = geometry();

      // попадания
      const hG = hits([segs[1] ?? segs[0]], GOAL) || (!active && hits(segs, GOAL));
      const hL = active && hits([segs[2]], LEFT);
      const hR = active && hits([segs[3]], RIGHT);
      const allHit = hG && hL && hR;
      if (allHit && !solved) {
        solved = true; solveT = now;
        if (!firedEgg) {
          firedEgg = true;
          try { window.dispatchEvent(new CustomEvent("egg:found", { detail: "constellation" })); } catch {}
        }
      }
      if (!allHit && solved) { solved = false; solveT = -1; }

      // лучи: горящие — зелёные, ствол чуть мягче
      const litColor = `rgba(${GREEN},0.85)`;
      beam(segs[0].a.x, segs[0].a.y, segs[0].b.x, segs[0].b.y, active ? litColor : litColor, 6, 1.6);
      if (active) {
        beam(segs[1].a.x, segs[1].a.y, segs[1].b.x, segs[1].b.y, hG ? litColor : `rgba(${DIM},0.7)`, 6, 1.5);
        beam(segs[2].a.x, segs[2].a.y, segs[2].b.x, segs[2].b.y, hL ? litColor : `rgba(${DIM},0.7)`, 6, 1.5);
        beam(segs[3].a.x, segs[3].a.y, segs[3].b.x, segs[3].b.y, hR ? litColor : `rgba(${DIM},0.7)`, 6, 1.5);
      }

      // бегущий импульс по горящим лучам (направленный, не дрожь)
      if (!reduce) {
        const pp = (tt * 0.55) % 1;
        const pulseSeg = (s: Seg) => dot(s.a.x + (s.b.x - s.a.x) * pp, s.a.y + (s.b.y - s.a.y) * pp, 2.4, "rgba(207,255,122,0.95)", 12);
        if (!active) { if (hG) pulseSeg(segs[0]); }
        else {
          if (hG) pulseSeg(segs[1]);
          if (hL) pulseSeg(segs[2]);
          if (hR) pulseSeg(segs[3]);
        }
      }

      // эмиттер
      node(EM, 6, `rgba(${GRID},0.75)`, 0.5);
      dot(EM.x, EM.y, 2.2, `rgba(${GREEN},0.9)`, 8);

      // цели
      const target = (p: Pt, hit: boolean, big = false) => {
        if (hit) {
          dot(p.x, p.y, big ? 12 : 9, `rgba(${GREEN},0.10)`, big ? 24 : 16);
          dot(p.x, p.y, big ? 5 : 4, `rgba(${GREEN},0.95)`, 14);
          dot(p.x, p.y, 2, "rgba(234,255,176,1)", 8);
          node(p, big ? 9 : 7, `rgba(${GREEN},0.8)`);
        } else {
          node(p, big ? 9 : 7, `rgba(${DIM},0.55)`, 0.3);
        }
      };
      target(GOAL, hG, true);
      target(LEFT, hL);
      target(RIGHT, hR);

      // делитель
      diamond(splitter, 7, active ? `rgba(${GREEN},0.95)` : `rgba(${GRID},0.6)`);
      if (active && split) node(split, 5, `rgba(${GREEN},0.7)`);

      // угловые декали (статичные); рамка зеленеет на решении
      corner(0.9, 0.2, 11, solved ? `rgba(${GREEN},0.6)` : `rgba(${GRID},0.28)`);
      dot(0.12 * W, 0.86 * H, 1.4, `rgba(${GRID},0.3)`);
      dot(0.12 * W + 5, 0.86 * H, 1, `rgba(${GRID},0.2)`);

      // вспышка успеха (одноразовая, направленная)
      if (solved && solveT >= 0) {
        const bp = (now - solveT) / 1100;
        if (bp < 1) {
          const g = GOAL;
          const wr = bp * Math.hypot(W, H) * 0.5;
          ctx!.strokeStyle = `rgba(${GREEN},${(1 - bp) * 0.5})`;
          ctx!.lineWidth = 2;
          ctx!.beginPath();
          ctx!.arc(g.x, g.y, wr, 0, Math.PI * 2);
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
      GOAL = F(GOAL_F);
      // боковые цели = куда канонически бьют ветви при вертикальном луче и делителе на SPLIT_Y
      const Sx = EM.x, Sy = SPLIT_Y * H;
      const dl = rot({ x: 0, y: 1 }, -SPREAD), drr = rot({ x: 0, y: 1 }, SPREAD);
      const kL = (SIDE_Y * H - Sy) / dl.y, kR = (SIDE_Y * H - Sy) / drr.y;
      LEFT = { x: Sx + dl.x * kL, y: SIDE_Y * H };
      RIGHT = { x: Sx + drr.x * kR, y: SIDE_Y * H };

      // решётка фона (шаг 14px, статичная)
      lattice = [];
      const step = 14;
      for (let y = step; y < H; y += step)
        for (let x = step; x < W; x += step) lattice.push({ x, y });

      if (reduce || drag === null) {
        // если игрок ещё не трогал — делитель лежит сбоку (путь к центру уже горит)
        if (!solved && drag === null && splitter.x === 0)
          splitter = { x: 0.72 * W, y: 0.26 * H };
      }
      if (reduce) {
        // решённое статичное состояние
        splitter = { x: EM.x, y: SPLIT_Y * H };
        draw(start + 3000);
      }
    }

    function pos(e: PointerEvent): Pt {
      const rect = canvas!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onDown(e: PointerEvent) {
      const p = pos(e);
      if (Math.hypot(p.x - splitter.x, p.y - splitter.y) < 22) drag = "split";
      else {
        drag = "beam";
        theta = clamp(Math.atan2(p.x - EM.x, p.y - EM.y), -0.7, 0.7);
      }
      try { canvas!.setPointerCapture(e.pointerId); } catch {}
      if (reduce) draw(performance.now());
    }
    function onMove(e: PointerEvent) {
      if (!drag) return;
      const p = pos(e);
      if (drag === "split") splitter = { x: clamp(p.x, 8, W - 8), y: clamp(p.y, 8, H - 8) };
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
      aria-label="Головоломка: перетащи делитель на луч и зажги все три узла"
      role="img"
    />
  );
}

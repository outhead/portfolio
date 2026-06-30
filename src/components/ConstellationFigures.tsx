"use client";

/* ─────────────────────────────────────────────────────────────────
 * ConstellationFigures — головоломка «призмы и зеркало».
 * Белый луч идёт из эмиттера вниз. КАМЕНЬ-ПРИЗМА расщепляет луч на ДВА
 * цветных (свои цвета у каждого камня). Камень A: янтарь + лайм.
 * Камень B: cyan + magenta — в него надо завести один из лучей A.
 * ЗЕРКАЛО (плоскость) двигается и крутится — отражает луч, не меняя цвет;
 * нужно, чтобы достать узел, до которого напрямую не дойти.
 * Три узла принимают свой цвет. Все три зажглись → onSolve() + пасхалка.
 * Canvas, DPR≤1.5, 40fps-кап, IO-пауза, prefers-reduced-motion.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

type Pt = { x: number; y: number };
type RGB = [number, number, number];

const COLORS: Record<string, RGB> = {
  white: [235, 238, 230],
  amber: [220, 176, 86],
  lime: [166, 255, 0],
  cyan: [86, 210, 226],
  magenta: [226, 96, 198],
};
const css = (c: RGB, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const GRID = "150,160,138";

const EM_F: Pt = { x: 0.5, y: 0.08 };
const SPREAD = (26 * Math.PI) / 180;
const STONE_R = 16; // попадание луча в камень
const HITR = 20; // попадание в цель
const ML = 46; // длина зеркала (px)

const rot = (v: Pt, a: number): Pt => ({
  x: v.x * Math.cos(a) - v.y * Math.sin(a),
  y: v.x * Math.sin(a) + v.y * Math.cos(a),
});
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const mul = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k });
const dotp = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y;

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

    let EM: Pt = { x: 0, y: 0 };
    // камни: minus/plus — цвета двух ветвей (rot(d,∓SPREAD))
    const stoneA = { p: { x: 0, y: 0 }, minus: "amber", plus: "lime" };
    const stoneB = { p: { x: 0, y: 0 }, minus: "cyan", plus: "magenta" };
    const mirror = { p: { x: 0, y: 0 }, ang: 0 }; // ang — направление плоскости
    // цели
    let targets: Array<{ p: Pt; key: string; hit: boolean }> = [];
    let drag: "A" | "B" | "M" | "Mrot" | null = null;
    let solved = false, solveT = -1, fired = false;
    let lattice: Pt[] = [];

    const F = (o: Pt): Pt => ({ x: o.x * W, y: o.y * H });

    function dot(x: number, y: number, r: number, color: string, glow = 0, glowC = "166,255,0") {
      ctx!.shadowBlur = glow;
      if (glow) ctx!.shadowColor = `rgba(${glowC},0.9)`;
      ctx!.fillStyle = color;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.shadowBlur = 0;
    }
    function beamSeg(a: Pt, b: Pt, color: string, r = 1.5) {
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const n = Math.max(1, Math.round(len / 6));
      for (let s = 0; s <= n; s++) {
        const t = s / n;
        dot(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, r, color);
      }
    }
    function node(p: Pt, R: number, color: string) {
      for (let a = 0; a < Math.PI * 2; a += 0.5)
        dot(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R, 1.3, color);
    }
    function gem(p: Pt, s: number, cl: RGB, cr: RGB) {
      // ромб-призма: левая половина — minus-цвет, правая — plus
      for (let i = -s; i <= s; i++) {
        const w = s - Math.abs(i);
        for (let j = -w; j <= w; j += 2)
          dot(p.x + j, p.y + i, 1.1, css(j < 0 ? cl : cr, 0.95));
      }
    }
    function exit(o: Pt, d: Pt): { p: Pt; t: number } {
      let t = 1e9;
      if (d.x > 1e-4) t = Math.min(t, (W - o.x) / d.x);
      else if (d.x < -1e-4) t = Math.min(t, -o.x / d.x);
      if (d.y > 1e-4) t = Math.min(t, (H - o.y) / d.y);
      else if (d.y < -1e-4) t = Math.min(t, -o.y / d.y);
      return { p: { x: o.x + d.x * t, y: o.y + d.y * t }, t };
    }
    function raySeg(o: Pt, d: Pt, a: Pt, b: Pt): number | null {
      // параметр t по лучу до пересечения с отрезком a-b
      const e = sub(b, a);
      const denom = d.x * e.y - d.y * e.x;
      if (Math.abs(denom) < 1e-6) return null;
      const diff = sub(a, o);
      const t = (diff.x * e.y - diff.y * e.x) / denom;
      const u = (diff.x * d.y - diff.y * d.x) / denom;
      if (t > 1e-3 && u >= 0 && u <= 1) return t;
      return null;
    }

    type Seg = { a: Pt; b: Pt; key: string };
    function trace(): Seg[] {
      const segs: Seg[] = [];
      const tang: Pt = { x: Math.cos(mirror.ang), y: Math.sin(mirror.ang) };
      const mA = add(mirror.p, mul(tang, ML / 2));
      const mB = sub(mirror.p, mul(tang, ML / 2));
      const nrm: Pt = { x: -tang.y, y: tang.x };

      type B = { o: Pt; d: Pt; key: string; depth: number };
      const queue: B[] = [{ o: EM, d: { x: 0, y: 1 }, key: "white", depth: 0 }];
      let guard = 0;
      while (queue.length && guard++ < 60) {
        const bm = queue.shift()!;
        const ex = exit(bm.o, bm.d);
        let bestT = ex.t, kind: "stone" | "mirror" | null = null, hp = ex.p, st: typeof stoneA | null = null;

        for (const stone of [stoneA, stoneB]) {
          const rel = sub(stone.p, bm.o);
          const proj = dotp(rel, bm.d);
          if (proj > 6 && proj < bestT) {
            const near = add(bm.o, mul(bm.d, proj));
            if (Math.hypot(near.x - stone.p.x, near.y - stone.p.y) < STONE_R) {
              bestT = proj; kind = "stone"; hp = near; st = stone;
            }
          }
        }
        const mt = raySeg(bm.o, bm.d, mA, mB);
        if (mt !== null && mt < bestT) { bestT = mt; kind = "mirror"; hp = add(bm.o, mul(bm.d, mt)); st = null; }

        segs.push({ a: bm.o, b: hp, key: bm.key });

        if (kind === "stone" && st && bm.depth < 5) {
          const dm = rot(bm.d, -SPREAD), dp = rot(bm.d, SPREAD);
          queue.push({ o: add(hp, mul(dm, 2)), d: dm, key: st.minus, depth: bm.depth + 1 });
          queue.push({ o: add(hp, mul(dp, 2)), d: dp, key: st.plus, depth: bm.depth + 1 });
        } else if (kind === "mirror" && bm.depth < 5) {
          const dd = dotp(bm.d, nrm);
          const rd: Pt = { x: bm.d.x - 2 * dd * nrm.x, y: bm.d.y - 2 * dd * nrm.y };
          queue.push({ o: add(hp, mul(rd, 2)), d: rd, key: bm.key, depth: bm.depth + 1 });
        }
      }
      return segs;
    }

    function draw(now: number) {
      if (stopped) return;
      const tt = (now - start) / 1000;
      ctx!.clearRect(0, 0, W, H);
      for (const g of lattice) dot(g.x, g.y, 0.8, `rgba(${GRID},0.05)`);

      const segs = trace();

      // попадания: цель = свой цвет рядом
      for (const t of targets) {
        t.hit = segs.some(
          (s) => s.key === t.key && segDist(t.p.x, t.p.y, s.a.x, s.a.y, s.b.x, s.b.y) < HITR
        );
      }
      const all = targets.length > 0 && targets.every((t) => t.hit);
      if (all && !solved) {
        solved = true; solveT = now;
        if (!fired) {
          fired = true;
          try { window.dispatchEvent(new CustomEvent("egg:found", { detail: "constellation" })); } catch {}
          solveCb.current?.();
        }
      }

      // лучи
      for (const s of segs) beamSeg(s.a, s.b, css(COLORS[s.key], s.key === "white" ? 0.7 : 0.85), 1.5);
      // импульсы по «решающим» лучам
      if (!reduce) {
        const pp = (tt * 0.55) % 1;
        for (const t of targets)
          if (t.hit) {
            const c = COLORS[t.key];
            // найдём сегмент его цвета у цели
            const s = segs.find((sg) => sg.key === t.key && segDist(t.p.x, t.p.y, sg.a.x, sg.a.y, sg.b.x, sg.b.y) < HITR);
            if (s) dot(s.a.x + (s.b.x - s.a.x) * pp, s.a.y + (s.b.y - s.a.y) * pp, 2.3, css(c, 0.95), 12, `${c[0]},${c[1]},${c[2]}`);
          }
      }

      // эмиттер
      node(EM, 6, `rgba(${GRID},0.75)`);
      dot(EM.x, EM.y, 2.2, css(COLORS.white, 0.95), 8, "235,238,230");

      // зеркало
      const tang: Pt = { x: Math.cos(mirror.ang), y: Math.sin(mirror.ang) };
      const mA = add(mirror.p, mul(tang, ML / 2));
      const mB = sub(mirror.p, mul(tang, ML / 2));
      beamSeg(mA, mB, `rgba(${GRID},0.85)`, 1.6);
      dot(mA.x, mA.y, 3, `rgba(${GRID},0.9)`); // ручка поворота

      // цели
      for (const t of targets) {
        const c = COLORS[t.key];
        if (t.hit) {
          dot(t.p.x, t.p.y, 10, css(c, 0.12), 18, `${c[0]},${c[1]},${c[2]}`);
          dot(t.p.x, t.p.y, 4.5, css(c, 0.95), 14, `${c[0]},${c[1]},${c[2]}`);
          dot(t.p.x, t.p.y, 2, "rgba(255,255,240,1)", 8, `${c[0]},${c[1]},${c[2]}`);
        }
        node(t.p, 7, css(c, t.hit ? 0.85 : 0.45));
      }

      // камни
      gem(stoneA.p, 7, COLORS[stoneA.minus], COLORS[stoneA.plus]);
      gem(stoneB.p, 7, COLORS[stoneB.minus], COLORS[stoneB.plus]);

      // вспышка успеха
      if (solved && solveT >= 0) {
        const bp = (now - solveT) / 1100;
        if (bp < 1) {
          const wr = bp * Math.hypot(W, H) * 0.55;
          ctx!.strokeStyle = css(COLORS.white, (1 - bp) * 0.5);
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
      // канонические цели (под раскладку, гарантированно решаемую)
      const SA = { x: 0.5 * W, y: 0.3 * H };
      const down = { x: 0, y: 1 };
      const limeDir = rot(down, SPREAD);
      const SB = add(SA, mul(limeDir, (0.5 * H - SA.y) / limeDir.y));
      const cyanDir = rot(limeDir, -SPREAD), magDir = rot(limeDir, SPREAD);
      const Tcyan = add(SB, mul(cyanDir, (0.83 * H - SB.y) / cyanDir.y));
      const Tmag = add(SB, mul(magDir, (0.7 * H - SB.y) / magDir.y));
      targets = [
        { p: { x: 0.88 * W, y: 0.83 * H }, key: "amber", hit: false }, // через зеркало
        { p: Tcyan, key: "cyan", hit: false },
        { p: Tmag, key: "magenta", hit: false },
      ];

      lattice = [];
      const step = 14;
      for (let y = step; y < H; y += step)
        for (let x = step; x < W; x += step) lattice.push({ x, y });

      // стартовые позиции — в трее снизу, не на луче
      if (stoneA.p.x === 0) stoneA.p = { x: 0.2 * W, y: 0.92 * H };
      if (stoneB.p.x === 0) stoneB.p = { x: 0.5 * W, y: 0.94 * H };
      if (mirror.p.x === 0) { mirror.p = { x: 0.8 * W, y: 0.92 * H }; mirror.ang = 0; }

      if (reduce) draw(start + 3000);
    }

    function pos(e: PointerEvent): Pt {
      const rect = canvas!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function mirrorHandle(): Pt {
      const tang: Pt = { x: Math.cos(mirror.ang), y: Math.sin(mirror.ang) };
      return add(mirror.p, mul(tang, ML / 2));
    }
    function onDown(e: PointerEvent) {
      const p = pos(e);
      const h = mirrorHandle();
      if (Math.hypot(p.x - h.x, p.y - h.y) < 16) drag = "Mrot";
      else if (Math.hypot(p.x - stoneA.p.x, p.y - stoneA.p.y) < 20) drag = "A";
      else if (Math.hypot(p.x - stoneB.p.x, p.y - stoneB.p.y) < 20) drag = "B";
      else if (Math.hypot(p.x - mirror.p.x, p.y - mirror.p.y) < 26) drag = "M";
      else drag = null;
      try { canvas!.setPointerCapture(e.pointerId); } catch {}
      if (reduce && drag) draw(performance.now());
    }
    function onMove(e: PointerEvent) {
      if (!drag) return;
      const p = pos(e);
      const cp = { x: clamp(p.x, 8, W - 8), y: clamp(p.y, 8, H - 8) };
      if (drag === "A") stoneA.p = cp;
      else if (drag === "B") stoneB.p = cp;
      else if (drag === "M") mirror.p = cp;
      else if (drag === "Mrot") mirror.ang = Math.atan2(p.y - mirror.p.y, p.x - mirror.p.x);
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
      aria-label="Головоломка: расщепи луч призмами и заверни зеркалом — зажги три цветных узла"
      role="img"
    />
  );
}

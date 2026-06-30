"use client";

/* ─────────────────────────────────────────────────────────────────
 * ConstellationFigures — головоломка «частоты луча».
 * Эмиттер пускает белый луч. ДЕЛИТЕЛЬ (ромб) расщепляет ствол на три
 * ветви: левая / центр / правая. В трее три цветных ФИЛЬТРА — их надо
 * перетащить на ветви: фильтр красит ветвь в свой цвет. Каждый узел
 * принимает только свой цвет (цвет кольца = подсказка). Два фильтра на
 * одну ветвь → цвет «грязный», не считается. Все три узла своего цвета
 * → onSolve() + egg:found("constellation"). Луч можно крутить.
 * Canvas, DPR≤1.5, 40fps-кап, IO-пауза, prefers-reduced-motion.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

type Pt = { x: number; y: number };
type RGB = [number, number, number];

const GRID = "150,160,138";
const DIM = "120,128,108";
const COLORS: Record<string, RGB> = {
  lime: [166, 255, 0],
  amber: [220, 176, 86],
  cyan: [86, 210, 226],
};
const css = (c: RGB, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const EM_F: Pt = { x: 0.5, y: 0.1 };
const SPLIT_Y = 0.4;
const SIDE_Y = 0.72;
const SPREAD = (40 * Math.PI) / 180;
const THR = 15; // делитель на луче
const FTHR = 16; // фильтр на ветви
const HITR = 18; // попадание в цель

// порядок ветвей: 0=левая, 1=центр, 2=правая → нужный цвет узла
const NEED: string[] = ["amber", "lime", "cyan"];

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
    let TARGETS: Pt[] = []; // [левая, центр, правая]
    let splitter: Pt = { x: 0, y: 0 };
    // три фильтра c цветом и позицией
    let filters: Array<{ key: string; p: Pt }> = [];
    let drag: { kind: "beam" | "split" | "filter"; i?: number } | null = null;
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
    function beam(a: Pt, b: Pt, color: string, gap = 6, r = 1.5) {
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const n = Math.max(1, Math.round(len / gap));
      for (let s = 0; s <= n; s++) {
        const t = s / n;
        dot(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, r, color);
      }
    }
    function node(p: Pt, R: number, color: string) {
      for (let a = 0; a < Math.PI * 2; a += 0.5)
        dot(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R, 1.3, color);
    }
    function diamond(p: Pt, s: number, color: string) {
      for (let i = -s; i <= s; i++) {
        const w = s - Math.abs(i);
        for (let j = -w; j <= w; j += 2) dot(p.x + j, p.y + i, 1.1, color);
      }
    }
    function chip(p: Pt, s: number, color: string, on: boolean) {
      // пиксельный квадрат-фильтр
      for (let i = -s; i <= s; i++)
        for (let j = -s; j <= s; j += 2) dot(p.x + j, p.y + i, 1.1, color);
      if (on) node(p, s + 3, color); // обводка — фильтр стоит на ветви
    }
    function exit(o: Pt, d: Pt): Pt {
      let t = 1e9;
      if (d.x > 1e-4) t = Math.min(t, (W - o.x) / d.x);
      else if (d.x < -1e-4) t = Math.min(t, -o.x / d.x);
      if (d.y > 1e-4) t = Math.min(t, (H - o.y) / d.y);
      else if (d.y < -1e-4) t = Math.min(t, -o.y / d.y);
      return { x: o.x + d.x * t, y: o.y + d.y * t };
    }

    function draw(now: number) {
      if (stopped) return;
      const tt = (now - start) / 1000;
      ctx!.clearRect(0, 0, W, H);
      for (const g of lattice) dot(g.x, g.y, 0.8, `rgba(${GRID},0.05)`);

      const d: Pt = { x: Math.sin(theta), y: Math.cos(theta) };
      // делитель на стволе?
      const ax = splitter.x - EM.x, ay = splitter.y - EM.y;
      const ap = ax * d.x + ay * d.y;
      const aN = { x: EM.x + d.x * ap, y: EM.y + d.y * ap };
      const active = ap > 24 && Math.hypot(splitter.x - aN.x, splitter.y - aN.y) < THR;
      const S = active ? aN : null;

      // ветви
      const dirs = [rot(d, -SPREAD), d, rot(d, SPREAD)];
      const ends = S ? dirs.map((dd) => exit(S, dd)) : [];

      // какой фильтр на какой ветви
      const branchColor: (string | null | "mix")[] = [null, null, null];
      if (S) {
        for (const f of filters) {
          let best = FTHR, bi = -1;
          for (let b = 0; b < 3; b++) {
            const dd = segDist(f.p.x, f.p.y, S.x, S.y, ends[b].x, ends[b].y);
            if (dd < best) { best = dd; bi = b; }
          }
          if (bi >= 0) {
            if (branchColor[bi] === null) branchColor[bi] = f.key;
            else branchColor[bi] = "mix";
          }
        }
      }

      // попадания: ветвь дотягивается до своего узла И цвет совпадает
      const hit = [false, false, false];
      if (S) {
        for (let b = 0; b < 3; b++) {
          const reach = segDist(TARGETS[b].x, TARGETS[b].y, S.x, S.y, ends[b].x, ends[b].y) < HITR;
          hit[b] = reach && branchColor[b] === NEED[b];
        }
      }
      const all = hit[0] && hit[1] && hit[2];
      if (all && !solved) {
        solved = true; solveT = now;
        if (!fired) {
          fired = true;
          try { window.dispatchEvent(new CustomEvent("egg:found", { detail: "constellation" })); } catch {}
          solveCb.current?.();
        }
      }

      // ствол (белый)
      beam(EM, S ?? exit(EM, d), "rgba(235,238,230,0.8)", 6, 1.6);
      // ветви — цвет фильтра / грязный / белый
      if (S) {
        for (let b = 0; b < 3; b++) {
          const bc = branchColor[b];
          let col = "rgba(235,238,230,0.55)"; // белая (без фильтра)
          if (bc === "mix") col = "rgba(120,110,90,0.7)"; // грязный
          else if (bc) col = css(COLORS[bc], hit[b] ? 0.9 : 0.7);
          beam(S, ends[b], col, 6, 1.5);
        }
        // бегущий импульс по верным ветвям
        if (!reduce) {
          const pp = (tt * 0.55) % 1;
          for (let b = 0; b < 3; b++)
            if (hit[b]) {
              const c = COLORS[NEED[b]];
              dot(S.x + (ends[b].x - S.x) * pp, S.y + (ends[b].y - S.y) * pp, 2.4, css(c, 0.95), 12, `${c[0]},${c[1]},${c[2]}`);
            }
        }
      }

      // эмиттер
      node(EM, 6, `rgba(${GRID},0.75)`);
      dot(EM.x, EM.y, 2.2, "rgba(235,238,230,0.95)", 8, "235,238,230");

      // цели — кольцо своего цвета; зажглось → ядро + блум
      for (let b = 0; b < 3; b++) {
        const c = COLORS[NEED[b]];
        const p = TARGETS[b];
        if (hit[b]) {
          dot(p.x, p.y, 10, css(c, 0.12), 18, `${c[0]},${c[1]},${c[2]}`);
          dot(p.x, p.y, 4.5, css(c, 0.95), 14, `${c[0]},${c[1]},${c[2]}`);
          dot(p.x, p.y, 2, "rgba(255,255,240,1)", 8, `${c[0]},${c[1]},${c[2]}`);
        }
        node(p, 7, css(c, hit[b] ? 0.85 : 0.45));
      }

      // делитель
      diamond(splitter, 7, active ? "rgba(235,238,230,0.95)" : `rgba(${GRID},0.6)`);
      if (active && S) node(S, 5, "rgba(235,238,230,0.7)");

      // фильтры
      for (let i = 0; i < filters.length; i++) {
        const f = filters[i];
        const onBranch = S
          ? Math.min(...ends.map((e) => segDist(f.p.x, f.p.y, S.x, S.y, e.x, e.y))) < FTHR
          : false;
        chip(f.p, 5, css(COLORS[f.key], 0.95), onBranch);
      }

      // вспышка успеха
      if (solved && solveT >= 0) {
        const bp = (now - solveT) / 1100;
        if (bp < 1) {
          const wr = bp * Math.hypot(W, H) * 0.55;
          ctx!.strokeStyle = `rgba(235,238,230,${(1 - bp) * 0.5})`;
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
      const S = { x: EM.x, y: SPLIT_Y * H };
      const dl = rot(d, -SPREAD), dr = rot(d, SPREAD);
      const kL = (SIDE_Y * H - S.y) / dl.y, kR = (SIDE_Y * H - S.y) / dr.y;
      TARGETS = [
        { x: S.x + dl.x * kL, y: SIDE_Y * H }, // левая ветвь
        { x: S.x, y: SIDE_Y * H }, // центр
        { x: S.x + dr.x * kR, y: SIDE_Y * H }, // правая ветвь
      ];

      lattice = [];
      const step = 14;
      for (let y = step; y < H; y += step)
        for (let x = step; x < W; x += step) lattice.push({ x, y });

      if (splitter.x === 0) splitter = { x: 0.82 * W, y: 0.16 * H };
      if (filters.length === 0)
        filters = [
          { key: "amber", p: { x: 0.18 * W, y: 0.9 * H } },
          { key: "lime", p: { x: 0.5 * W, y: 0.92 * H } },
          { key: "cyan", p: { x: 0.82 * W, y: 0.9 * H } },
        ];

      if (reduce) draw(start + 3000);
    }

    function pos(e: PointerEvent): Pt {
      const rect = canvas!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onDown(e: PointerEvent) {
      const p = pos(e);
      let fi = -1, fbest = 22;
      for (let i = 0; i < filters.length; i++) {
        const dd = Math.hypot(p.x - filters[i].p.x, p.y - filters[i].p.y);
        if (dd < fbest) { fbest = dd; fi = i; }
      }
      if (fi >= 0) drag = { kind: "filter", i: fi };
      else if (Math.hypot(p.x - splitter.x, p.y - splitter.y) < 22) drag = { kind: "split" };
      else { drag = { kind: "beam" }; theta = clamp(Math.atan2(p.x - EM.x, p.y - EM.y), -0.7, 0.7); }
      try { canvas!.setPointerCapture(e.pointerId); } catch {}
      if (reduce) draw(performance.now());
    }
    function onMove(e: PointerEvent) {
      if (!drag) return;
      const p = pos(e);
      const cp = { x: clamp(p.x, 8, W - 8), y: clamp(p.y, 8, H - 8) };
      if (drag.kind === "filter" && drag.i != null) filters[drag.i].p = cp;
      else if (drag.kind === "split") splitter = cp;
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
      aria-label="Головоломка: расщепи луч и разведи три цветных фильтра по своим узлам"
      role="img"
    />
  );
}

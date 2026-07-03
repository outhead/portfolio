"use client";

/* ─────────────────────────────────────────────────────────────────
 * ConstellationFiguresV3 — псевдо-3D рендер головоломки «призмы и
 * зеркало» (песочница /secret/lab/optics). Логика — та же lib/optics,
 * движение осталось в одной плоскости; объём — только картинкой:
 *  • кристаллы — вращающиеся проволочные октаэдры из точек
 *    (язык дот-облака хиро), грань ближе — ярче;
 *  • у каждого кристалла эллипс-тень на «полу» (даёт плоскость);
 *  • цели — площадки-эллипсы в перспективе со столбом света,
 *    попадание зажигает столб;
 *  • лучи бегут как в V2 и отбрасывают тонкую тень.
 * Тач-фиксы и перф-бюджет (40fps, DPR 1.5, IO-пауза) — как в проде.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import {
  COLORS,
  FIELD_H,
  FIELD_W,
  MENTORING_LEVEL,
  mirrorEnds,
  targetHits,
  trace,
  type ColorKey,
  type Level,
  type Live,
  type Pt,
  type Target,
} from "@/lib/optics";
import type { V2Params } from "@/components/ConstellationFiguresV2";
import { V2_DEFAULTS } from "@/components/ConstellationFiguresV2";

const LW = FIELD_W, LH = FIELD_H;
const GRID = "150,160,138";
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const css = (c: [number, number, number], a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

type Particle = { x: number; y: number; vx: number; vy: number; born: number; life: number; c: [number, number, number]; sz: number };

export default function ConstellationFiguresV3({
  className = "",
  level = MENTORING_LEVEL,
  lockMirror = true,
  paramsRef,
  onSolve,
}: {
  className?: string;
  level?: Level;
  lockMirror?: boolean;
  paramsRef?: React.MutableRefObject<V2Params>;
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

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;

    let dpr = 1, s = 1, offX = 0, offY = 0;
    let raf = 0, stopped = false, visible = true;
    const FRAME_MS = 1000 / 40;
    let lastDraw = 0;
    const start = performance.now();

    const live: Live = { emitter: { x: 0, y: 0 }, stones: [], mirror: null };
    let targetsPx: Target[] = [];
    let drag: { kind: "stone" | "mirror" | "mrot"; i?: number } | null = null;
    let hover = -1;
    let solved = false, solveT = -1, fired = false;
    let prevHits: boolean[] = [];
    const parts: Particle[] = [];

    const P = () => paramsRef?.current ?? V2_DEFAULTS;

    function layoutFromLevel() {
      live.emitter = { x: level.emitter.x * LW, y: level.emitter.y * LH };
      live.stones = level.stones.map((st) => ({ p: { x: st.x * LW, y: st.y * LH }, minus: st.minus, plus: st.plus }));
      live.mirror = level.mirror ? { p: { x: level.mirror.x * LW, y: level.mirror.y * LH }, ang: level.mirror.ang } : null;
      targetsPx = level.targets.map((t) => ({ key: t.key, x: t.x * LW, y: t.y * LH }));
      prevHits = targetsPx.map(() => false);
    }

    function spawnBurst(x: number, y: number, c: [number, number, number], n: number, now: number, speed = 46) {
      if (!P().particles || reduce) return;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = speed * (0.35 + Math.random() * 0.85);
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 12, born: now, life: 500 + Math.random() * 450, c, sz: 1.4 + Math.random() * 1.4 });
      }
    }

    function dot(x: number, y: number, r: number, color: string, glow = 0, glowC = "166,255,0") {
      const g = glow * P().glow;
      ctx!.shadowBlur = g;
      if (g) ctx!.shadowColor = `rgba(${glowC},0.9)`;
      ctx!.fillStyle = color;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.shadowBlur = 0;
    }
    function px(x: number, y: number, sz: number, color: string) {
      ctx!.fillStyle = color;
      ctx!.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    }

    /** бегущий луч + тонкая тень на «полу» (смещение вниз) */
    function ray(a: Pt, b: Pt, key: ColorKey, t: number) {
      const c = COLORS[key];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < 1) return;
      const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
      const step = Math.max(4, coarse ? Math.min(P().rayStep, 8) : P().rayStep);
      const phase = ((t * P().raySpeed) % step + step) % step;
      const baseA = key === "white" ? 0.78 : 0.95;
      for (let d = phase; d < len; d += step) {
        const w = 0.82 + 0.18 * Math.sin(d * 0.55 - t * 5);
        const near = Math.min(1, d / 26);
        const x = a.x + ux * d, y = a.y + uy * d;
        // «тень»-отражение луча на тёмном полу — приглушённый цвет со смещением
        px(x + 1.5, y + 5, 1.4, css(c, 0.12 * w));
        // сам луч
        px(x, y, 2.2 + 0.5 * w, css(c, baseA * w * (0.7 + 0.3 * near)));
      }
      dot(a.x + ux * 3, a.y + uy * 3, 1.6, css(c, 0.9), 10, `${c[0]},${c[1]},${c[2]}`);
    }

    /** точки вдоль отрезка 3D-проекции */
    function edge3(ax: number, ay: number, az: number, bx: number, by: number, bz: number, cl: [number, number, number], cr: [number, number, number], cx: number, cy: number) {
      const segs = 5;
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const x = ax + (bx - ax) * t, y = ay + (by - ay) * t, z = az + (bz - az) * t;
        // ближе к камере (z больше) — ярче и крупнее
        const depth = (z + 1) / 2; // 0..1
        const c = x < 0 ? cl : cr;
        px(cx + x * 1, cy + y * 1, 1.5 + depth * 1.1, css(c, 0.35 + depth * 0.6));
      }
    }

    /** кристалл: проволочный октаэдр из точек, вращение по Y, тень на полу */
    function gem3d(p: Pt, size: number, clKey: ColorKey, crKey: ColorKey, t: number, lift: number) {
      const cl = COLORS[clKey], cr = COLORS[crKey];
      const bob = reduce ? 0 : Math.sin(t * 1.6 + p.x * 0.05) * 1.2;
      const y0 = p.y + bob - lift * 3;
      const ang = reduce ? 0.5 : t * (0.7 + lift * 0.9) + p.x * 0.01;
      const cos = Math.cos(ang), sin = Math.sin(ang);
      const sxz = size * 0.78; // экватор чуть уже высоты — огранка
      // вершины: топ, низ и 4 экваториальные (x,z вращаются)
      const eq = [
        { x: -sxz, z: 0 }, { x: sxz, z: 0 }, { x: 0, z: -sxz }, { x: 0, z: sxz },
      ].map((v) => ({ x: v.x * cos + v.z * sin, z: -v.x * sin + v.z * cos }));
      // «тень»-отражение на полу: эллипс из приглушённых цветных точек
      const shR = size * 0.9 - lift * 1.5;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const xx = Math.cos(a) * shR;
        const c = xx < 0 ? cl : cr;
        px(p.x + xx, p.y + size + 5 + Math.sin(a) * shR * 0.3, 1.2, css(c, 0.16 - lift * 0.05));
      }
      // мягкая подсветка под кристаллом (цветная)
      dot(p.x - size / 3, y0, size * 0.5, css(cl, 0.08), 14 + lift * 8, `${cl[0]},${cl[1]},${cl[2]}`);
      dot(p.x + size / 3, y0, size * 0.5, css(cr, 0.08), 14 + lift * 8, `${cr[0]},${cr[1]},${cr[2]}`);
      // рёбра: топ→экватор и низ→экватор
      const nz = (z: number) => z / sxz; // -1..1
      for (const v of eq) {
        edge3(0, -size, 0, v.x, 0, nz(v.z), cl, cr, p.x, y0);
        edge3(0, size, 0, v.x, 0, nz(v.z), cl, cr, p.x, y0);
      }
      // экваториальный пояс — соседи по кругу
      const ring = [eq[0], eq[2], eq[1], eq[3]];
      for (let i = 0; i < 4; i++) {
        const a = ring[i], b = ring[(i + 1) % 4];
        edge3(a.x, 0, nz(a.z), b.x, 0, nz(b.z), cl, cr, p.x, y0);
      }
      // вершинные точки — ярче
      px(p.x, y0 - size, 2.2, "rgba(255,255,248,0.95)");
      px(p.x, y0 + size, 2.0, css(cl, 0.8));
      // искра-блик
      if (!reduce) {
        const sp = (t * 0.9 + p.x * 0.013) % 1;
        if (sp < 0.3) px(p.x - size * 0.3, y0 - size * 0.45, 1.6, `rgba(255,255,245,${0.9 * (1 - sp / 0.3)})`);
      }
      // афорданс при ховере/драге
      if (lift > 0) {
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2 + t * 0.8;
          px(p.x + Math.cos(a) * (size + 6), y0 + Math.sin(a) * (size + 6) * 0.4 + size * 0.9, 1.2, `rgba(${GRID},${0.3 + lift * 0.4})`);
        }
      }
    }

    /** цель: площадка-эллипс в перспективе + столб света при попадании */
    function targetPad(tg: Target, on: boolean, t: number, i: number) {
      const c = COLORS[tg.key];
      const rx = 9, ry = 3.8;
      // площадка из точек
      const n = 14;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + (on ? t * 0.6 : 0);
        px(tg.x + Math.cos(a) * rx, tg.y + 3 + Math.sin(a) * ry, 1.5, css(c, on ? 0.9 : 0.4));
      }
      // маячок в центре
      const bp = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(t * 2 + i * 1.7);
      dot(tg.x, tg.y + 3, 1.6, css(c, on ? 0.95 : 0.25 + bp * 0.25), on ? 10 : 0, `${c[0]},${c[1]},${c[2]}`);
      // столб света
      const colH = 26;
      const steps = 7;
      for (let k = 1; k <= steps; k++) {
        const yy = tg.y + 3 - (colH * k) / steps;
        const fl = reduce ? 1 : 0.7 + 0.3 * Math.sin(t * 7 + k * 1.3 + i * 2);
        const alpha = on ? (1 - k / (steps + 1)) * 0.75 * fl : (1 - k / (steps + 1)) * 0.1;
        px(tg.x, yy, on ? 2.1 : 1.5, css(c, alpha));
        if (on) {
          px(tg.x - 2.5, yy + 1, 1.1, css(c, alpha * 0.45));
          px(tg.x + 2.5, yy + 1, 1.1, css(c, alpha * 0.45));
        }
      }
      if (on) dot(tg.x, tg.y + 3 - colH, 1.8, "rgba(255,255,240,0.95)", 10, `${c[0]},${c[1]},${c[2]}`);
    }

    function draw(now: number) {
      if (stopped) return;
      const t = (now - start) / 1000;
      const p = P();

      ctx!.save();
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.restore();

      const segs = trace(live, LW, LH, undefined, targetsPx);
      const hits = targetHits(segs, targetsPx);
      hits.forEach((h, i) => {
        if (h && !prevHits[i]) spawnBurst(targetsPx[i].x, targetsPx[i].y, COLORS[targetsPx[i].key], 12, now);
      });
      prevHits = hits;
      const all = hits.length > 0 && hits.every(Boolean);
      if (all && !solved) {
        solved = true; solveT = now;
        targetsPx.forEach((tg) => spawnBurst(tg.x, tg.y, COLORS[tg.key], 22, now, 70));
        if (!fired) { fired = true; solveCb.current?.(); }
      }

      // решётка с лёгкой «перспективой»: к низу плотнее и ярче
      const step = 14;
      for (let y = step; y < LH; y += step) {
        const depth = y / LH;
        for (let x = step; x < LW; x += step) px(x, y, 0.8 + depth * 0.5, `rgba(${GRID},${0.03 + depth * 0.04})`);
      }

      // лучи (с тенями)
      for (const sg of segs) ray(sg.a, sg.b, sg.key, t);

      // эмиттер: пульс
      const pulse = reduce ? 0 : (t * 1.4) % 1;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        px(live.emitter.x + Math.cos(a) * (6 + pulse * 4), live.emitter.y + Math.sin(a) * (6 + pulse * 4) * 0.5, 1.2, `rgba(${GRID},${0.7 * (1 - pulse)})`);
      }
      dot(live.emitter.x, live.emitter.y, 2.4, css(COLORS.white, 0.95), 10, "235,238,230");

      // зеркало + тень
      if (live.mirror) {
        const [mA, mB] = mirrorEnds(live.mirror);
        const len = Math.hypot(mB.x - mA.x, mB.y - mA.y);
        for (let d = 0; d <= len; d += 4) {
          const x = mA.x + (mB.x - mA.x) * (d / len), y = mA.y + (mB.y - mA.y) * (d / len);
          px(x + 2, y + 5, 1.4, "rgba(0,0,0,0.3)");
          px(x, y, 1.8, `rgba(${GRID},0.85)`);
        }
        dot(mA.x, mA.y, 3, `rgba(${GRID},0.9)`);
      }

      // цели-площадки
      targetsPx.forEach((tg, i) => targetPad(tg, hits[i], t, i));

      // кристаллы-октаэдры
      const gs = Math.max(p.gemSize, Math.min(15, 20 / s));
      live.stones.forEach((st, i) => {
        const lift = drag?.kind === "stone" && drag.i === i ? 1 : hover === i ? 0.5 : 0;
        gem3d(st.p, gs, st.minus, st.plus, t, lift);
      });

      // частицы
      for (let i = parts.length - 1; i >= 0; i--) {
        const pt = parts[i];
        const age = (now - pt.born) / pt.life;
        if (age >= 1) { parts.splice(i, 1); continue; }
        pt.x += pt.vx * 0.025; pt.y += pt.vy * 0.025; pt.vy += 2.2;
        px(pt.x, pt.y, pt.sz * (1 - age * 0.5), css(pt.c, (1 - age) * 0.95));
      }

      // победная волна
      if (solved && solveT >= 0) {
        const bp = (now - solveT) / 1100;
        if (bp < 1) {
          const wr = bp * Math.hypot(LW, LH) * 0.55;
          const n = 42;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            px(live.emitter.x + Math.cos(a) * wr, live.emitter.y + LH * 0.4 + Math.sin(a) * wr * 0.6, 1.8, css(COLORS.white, (1 - bp) * 0.5));
          }
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
      canvas!.width = Math.round(rect.width * dpr);
      canvas!.height = Math.round(rect.height * dpr);
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
    const pick = (base: number) => Math.max(base, (coarse ? 34 : base) / s);
    function stoneAt(p: Pt): number {
      let bi = -1, best = pick(22);
      live.stones.forEach((st, i) => {
        const d = Math.hypot(p.x - st.p.x, p.y - st.p.y);
        if (d < best) { best = d; bi = i; }
      });
      return bi;
    }
    function onDown(e: PointerEvent) {
      const p = pos(e);
      if (live.mirror && !lockMirror) {
        const [mA] = mirrorEnds(live.mirror);
        if (Math.hypot(p.x - mA.x, p.y - mA.y) < pick(16)) drag = { kind: "mrot" };
      }
      if (!drag) {
        const bi = stoneAt(p);
        if (bi >= 0) drag = { kind: "stone", i: bi };
        else if (live.mirror && !lockMirror && Math.hypot(p.x - live.mirror.p.x, p.y - live.mirror.p.y) < pick(26)) drag = { kind: "mirror" };
      }
      try { canvas!.setPointerCapture(e.pointerId); } catch {}
      if (reduce && drag) draw(performance.now());
    }
    function onMove(e: PointerEvent) {
      const p = pos(e);
      if (!drag) { hover = stoneAt(p); canvas!.style.cursor = hover >= 0 ? "grab" : "default"; return; }
      canvas!.style.cursor = "grabbing";
      const cp = { x: clamp(p.x, 6, LW - 6), y: clamp(p.y, 6, LH - 6) };
      if (drag.kind === "stone" && drag.i != null) live.stones[drag.i].p = cp;
      else if (drag.kind === "mirror" && live.mirror) live.mirror.p = cp;
      else if (drag.kind === "mrot" && live.mirror) live.mirror.ang = Math.atan2(p.y - live.mirror.p.y, p.x - live.mirror.p.x);
      if (reduce) draw(performance.now());
    }
    function onUp() { drag = null; canvas!.style.cursor = "default"; }
    function onCtx(e: Event) { e.preventDefault(); }

    const ro = new ResizeObserver(() => fit());
    ro.observe(canvas);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("contextmenu", onCtx);
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
      canvas.removeEventListener("contextmenu", onCtx);
    };
  }, [level, lockMirror, paramsRef]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      } as React.CSSProperties}
      aria-label="Головоломка (песочница V3): двигай кристаллы, чтобы зажечь все площадки"
      role="img"
    />
  );
}

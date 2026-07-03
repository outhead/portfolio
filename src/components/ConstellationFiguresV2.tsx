"use client";

/* ─────────────────────────────────────────────────────────────────
 * ConstellationFiguresV2 — экспериментальная отрисовка головоломки
 * «призмы и зеркало» (песочница /secret/lab/optics, прод не трогаем).
 * Логика — та же lib/optics; переделана только картинка:
 *  • лучи — «бегущие» пиксельные точки с дизерингом и глоу у истока;
 *  • кристаллы крупнее, с бликом-гранью, дыханием и хвостом при драге;
 *  • цели — пиксельные ромбы-контуры, при попадании искры + огонёк;
 *  • ховер/драг-фидбек, пиксельное конфетти на победе.
 * Тач-фиксы из прод-версии (хит-зоны в экранных px, no-select) включены.
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
import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";

const LW = FIELD_W, LH = FIELD_H;
const GRID = "150,160,138";
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const css = (c: [number, number, number], a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export type V2Params = {
  raySpeed: number;   // скорость бегущих точек, px/s
  rayStep: number;    // шаг точек вдоль луча, px
  gemSize: number;    // полуразмер кристалла, логич. px
  glow: number;       // 0..2 множитель свечения
  particles: boolean; // искры/конфетти
};

export const V2_DEFAULTS: V2Params = {
  // значения из песочницы, утверждены 02.07.2026
  raySpeed: 28,
  rayStep: 14,
  gemSize: 13,
  glow: 2,
  particles: true,
};

type Particle = { x: number; y: number; vx: number; vy: number; born: number; life: number; c: [number, number, number]; sz: number };

export default function ConstellationFiguresV2({
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
  const locale = useLocale();
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
    const trail: Array<{ x: number; y: number; born: number }> = [];

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
        parts.push({
          x, y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 12,
          born: now,
          life: 500 + Math.random() * 450,
          c,
          sz: 1.4 + Math.random() * 1.4,
        });
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

    /** бегущий пиксельный луч: точки маршируют по направлению, дизеринг по синусу */
    function ray(a: Pt, b: Pt, key: ColorKey, t: number) {
      const c = COLORS[key];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < 1) return;
      const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
      // на тач-устройствах поле ужато — уплотняем шаг, чтобы луч читался
      const step = Math.max(4, coarse ? Math.min(P().rayStep, 8) : P().rayStep);
      const phase = ((t * P().raySpeed) % step + step) % step;
      const baseA = key === "white" ? 0.78 : 0.95;
      for (let d = phase; d < len; d += step) {
        const w = 0.82 + 0.18 * Math.sin(d * 0.55 - t * 5); // дизеринг яркости
        const near = Math.min(1, d / 26); // разгон у истока
        px(a.x + ux * d, a.y + uy * d, 2.2 + 0.5 * w, css(c, baseA * w * (0.7 + 0.3 * near)));
      }
      // яркое ядро у истока
      dot(a.x + ux * 3, a.y + uy * 3, 1.6, css(c, 0.9), 10, `${c[0]},${c[1]},${c[2]}`);
    }

    function diamondRing(p: Pt, R: number, color: string, t: number, spin = 0.4) {
      // пиксельный ромб-контур из точек
      const n = 16;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + t * spin;
        const ca = Math.cos(a), sa = Math.sin(a);
        const k = R / (Math.abs(ca) + Math.abs(sa)); // ромб: |x|+|y|=R
        px(p.x + ca * k, p.y + sa * k, 1.6, color);
      }
    }

    function gem(p: Pt, size: number, cl: ColorKey, cr: ColorKey, t: number, lift: number) {
      const bob = reduce ? 0 : Math.sin(t * 1.7 + p.x * 0.05) * 0.8;
      const y0 = p.y + bob - lift * 2;
      const cLm = COLORS[cl], cRm = COLORS[cr];
      // мягкая цветная подсветка под кристаллом
      dot(p.x - size / 3, y0, size * 0.55, css(cLm, 0.10), 16 + lift * 8, `${cLm[0]},${cLm[1]},${cLm[2]}`);
      dot(p.x + size / 3, y0, size * 0.55, css(cRm, 0.10), 16 + lift * 8, `${cRm[0]},${cRm[1]},${cRm[2]}`);
      // тело — пиксельный ромб, две половины
      for (let i = -size; i <= size; i++) {
        const w = size - Math.abs(i);
        for (let j = -w; j <= w; j += 2) {
          const c = j < 0 ? cLm : cRm;
          // грань-блик: верхняя левая кромка светлее
          const edge = i < 0 && Math.abs(j) >= w - 2 ? 1.35 : 1;
          const a = (0.9 + 0.1 * Math.sin(t * 2.2 + i + j)) * (lift ? 1 : 0.92);
          ctx!.fillStyle = css(
            [Math.min(255, c[0] * edge), Math.min(255, c[1] * edge), Math.min(255, c[2] * edge)],
            Math.min(1, a)
          );
          ctx!.fillRect(p.x + j - 0.9, y0 + i - 0.9, 1.8, 1.8);
        }
      }
      // искра-блик
      if (!reduce) {
        const sp = (t * 0.9 + p.x * 0.01) % 1;
        if (sp < 0.35) px(p.x - size * 0.35, y0 - size * 0.4, 1.6, `rgba(255,255,245,${0.9 * (1 - sp / 0.35)})`);
      }
      // афорданс: точечное кольцо-подставка
      if (lift > 0) diamondRing(p, size + 5 + lift * 2, `rgba(${GRID},${0.35 + lift * 0.45})`, t, 0.8);
    }

    function draw(now: number) {
      if (stopped) return;
      const t = (now - start) / 1000;
      const p = P();

      // полная очистка в device-px — от артефактов на letterbox-полях
      ctx!.save();
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.restore();

      const segs = trace(live, LW, LH, undefined, targetsPx);
      const hits = targetHits(segs, targetsPx);
      hits.forEach((h, i) => {
        if (h && !prevHits[i]) {
          const c = COLORS[targetsPx[i].key];
          spawnBurst(targetsPx[i].x, targetsPx[i].y, c, 12, now);
        }
      });
      prevHits = hits;
      const all = hits.length > 0 && hits.every(Boolean);
      if (all && !solved) {
        solved = true; solveT = now;
        targetsPx.forEach((tg) => spawnBurst(tg.x, tg.y, COLORS[tg.key], 22, now, 70));
        if (!fired) { fired = true; solveCb.current?.(); }
      }

      // решётка
      const step = 14;
      for (let y = step; y < LH; y += step)
        for (let x = step; x < LW; x += step) px(x, y, 1, `rgba(${GRID},0.05)`);

      // лучи
      for (const sg of segs) ray(sg.a, sg.b, sg.key, t);

      // эмиттер: пульс заряда
      const pulse = reduce ? 0 : (t * 1.4) % 1;
      diamondRing(live.emitter, 6 + pulse * 4, `rgba(${GRID},${0.7 * (1 - pulse)})`, t, 0);
      dot(live.emitter.x, live.emitter.y, 2.4, css(COLORS.white, 0.95), 10, "235,238,230");

      // зеркало
      if (live.mirror) {
        const [mA, mB] = mirrorEnds(live.mirror);
        const len = Math.hypot(mB.x - mA.x, mB.y - mA.y);
        for (let d = 0; d <= len; d += 4) px(mA.x + (mB.x - mA.x) * (d / len), mA.y + (mB.y - mA.y) * (d / len), 1.8, `rgba(${GRID},0.85)`);
        dot(mA.x, mA.y, 3, `rgba(${GRID},0.9)`);
      }

      // цели
      targetsPx.forEach((tg, i) => {
        const c = COLORS[tg.key];
        const on = hits[i];
        if (on) {
          dot(tg.x, tg.y, 10, css(c, 0.12), 20, `${c[0]},${c[1]},${c[2]}`);
          // огонёк: мерцающее ядро
          const fl = reduce ? 1 : 0.75 + 0.25 * Math.sin(t * 9 + i * 2);
          dot(tg.x, tg.y, 4.2 * fl, css(c, 0.95), 16, `${c[0]},${c[1]},${c[2]}`);
          dot(tg.x, tg.y, 1.8, "rgba(255,255,240,1)", 8, `${c[0]},${c[1]},${c[2]}`);
        } else {
          // маячок: медленный пульс, чтобы читалось «это цель»
          const bp = reduce ? 0 : 0.5 + 0.5 * Math.sin(t * 2 + i * 1.7);
          dot(tg.x, tg.y, 1.6, css(c, 0.3 + bp * 0.25));
        }
        diamondRing({ x: tg.x, y: tg.y }, 8, css(c, on ? 0.9 : 0.4), on ? t : 0, on ? 0.5 : 0);
      });

      // хвост драга
      const nowMs = now;
      for (let i = trail.length - 1; i >= 0; i--) {
        const tr = trail[i];
        const a = 1 - (nowMs - tr.born) / 380;
        if (a <= 0) { trail.splice(i, 1); continue; }
        px(tr.x, tr.y, 1.6, `rgba(${GRID},${a * 0.3})`);
      }

      // камни
      const gs = Math.max(p.gemSize, Math.min(15, 20 / s));
      live.stones.forEach((st, i) => {
        const lift = drag?.kind === "stone" && drag.i === i ? 1 : hover === i ? 0.5 : 0;
        gem(st.p, gs, st.minus, st.plus, t, lift);
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
            px(live.emitter.x + Math.cos(a) * wr, live.emitter.y + LH * 0.4 + Math.sin(a) * wr, 1.8, css(COLORS.white, (1 - bp) * 0.5));
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
      if (drag.kind === "stone" && drag.i != null) {
        live.stones[drag.i].p = cp;
        if (!reduce) trail.push({ x: cp.x, y: cp.y + 2, born: performance.now() });
      } else if (drag.kind === "mirror" && live.mirror) live.mirror.p = cp;
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
      aria-label={pick(
        "Головоломка (песочница): двигай кристаллы, чтобы зажечь все узлы",
        "Puzzle (sandbox): drag the crystals to light up every node",
        locale
      )}
      role="img"
    />
  );
}

"use client";

/* ─────────────────────────────────────────────────────────────────
 * OpticsEditor — редактор уровня головоломки. Перетаскивай камни,
 * зеркало и цели; добавляй/удаляй элементы, меняй цвета. Позиции
 * элементов = их СТАРТОВОЕ положение в игре. Лучи считаются вживую —
 * двигаешь, видишь решение. Внизу — JSON уровня (скопируй и пришли).
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import {
  COLOR_KEYS,
  DEFAULT_LEVEL,
  mirrorEnds,
  targetHits,
  trace,
  type ColorKey,
  type Level,
  type Live,
  type Pt,
  type Target,
} from "@/lib/optics";
import { drawField } from "@/lib/opticsRender";

const VW = 360, VH = 380; // логический размер поля (≈ панель менторинга)
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const r3 = (v: number) => Math.round(v * 1000) / 1000;

type Sel = { kind: "stone" | "mirror" | "target"; i: number } | null;

function clone(l: Level): Level {
  return JSON.parse(JSON.stringify(l));
}

export default function OpticsEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelRef = useRef<Level>(clone(DEFAULT_LEVEL));
  const selRef = useRef<Sel>(null);
  const [, force] = useState(0);
  const [json, setJson] = useState("");

  const refresh = () => {
    setJson(JSON.stringify(levelRef.current, (k, v) => (typeof v === "number" ? r3(v) : v), 2));
    force((n) => n + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = VW * dpr;
    canvas.height = VH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const start = performance.now();
    let raf = 0, stopped = false;

    function live(): Live {
      const L = levelRef.current;
      return {
        emitter: { x: L.emitter.x * VW, y: L.emitter.y * VH },
        stones: L.stones.map((s) => ({ p: { x: s.x * VW, y: s.y * VH }, minus: s.minus, plus: s.plus })),
        mirror: L.mirror ? { p: { x: L.mirror.x * VW, y: L.mirror.y * VH }, ang: L.mirror.ang } : null,
      };
    }
    function targetsPx(): Target[] {
      return levelRef.current.targets.map((t) => ({ key: t.key, x: t.x * VW, y: t.y * VH }));
    }

    function loop(now: number) {
      if (stopped) return;
      raf = requestAnimationFrame(loop);
      const lv = live();
      const tp = targetsPx();
      const segs = trace(lv, VW, VH);
      const hits = targetHits(segs, tp);
      drawField(ctx!, VW, VH, lv, { segs, targetsPx: tp, hits, time: (now - start) / 1000, edit: true, selected: selRef.current });
    }
    raf = requestAnimationFrame(loop);

    let drag: { kind: "stone" | "mirror" | "mrot" | "target"; i: number } | null = null;
    const pos = (e: PointerEvent): Pt => {
      const rect = canvas.getBoundingClientRect();
      return { x: ((e.clientX - rect.left) / rect.width) * VW, y: ((e.clientY - rect.top) / rect.height) * VH };
    };
    const onDown = (e: PointerEvent) => {
      const p = pos(e);
      const L = levelRef.current;
      // ручка зеркала
      if (L.mirror) {
        const [mA] = mirrorEnds({ p: { x: L.mirror.x * VW, y: L.mirror.y * VH }, ang: L.mirror.ang });
        if (Math.hypot(p.x - mA.x, p.y - mA.y) < 16) { drag = { kind: "mrot", i: 0 }; selRef.current = { kind: "mirror", i: 0 }; refresh(); }
      }
      if (!drag) {
        // цели
        let bi = -1, best = 18;
        L.targets.forEach((t, i) => { const d = Math.hypot(p.x - t.x * VW, p.y - t.y * VH); if (d < best) { best = d; bi = i; } });
        if (bi >= 0) { drag = { kind: "target", i: bi }; selRef.current = { kind: "target", i: bi }; }
      }
      if (!drag) {
        let bi = -1, best = 20;
        L.stones.forEach((s, i) => { const d = Math.hypot(p.x - s.x * VW, p.y - s.y * VH); if (d < best) { best = d; bi = i; } });
        if (bi >= 0) { drag = { kind: "stone", i: bi }; selRef.current = { kind: "stone", i: bi }; }
      }
      if (!drag && L.mirror && Math.hypot(p.x - L.mirror.x * VW, p.y - L.mirror.y * VH) < 26) {
        drag = { kind: "mirror", i: 0 }; selRef.current = { kind: "mirror", i: 0 };
      }
      if (!drag) selRef.current = null;
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      refresh();
    };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      const p = pos(e);
      const L = levelRef.current;
      const fx = clamp(p.x / VW, 0.02, 0.98), fy = clamp(p.y / VH, 0.02, 0.98);
      if (drag.kind === "stone") { L.stones[drag.i].x = fx; L.stones[drag.i].y = fy; }
      else if (drag.kind === "target") { L.targets[drag.i].x = fx; L.targets[drag.i].y = fy; }
      else if (drag.kind === "mirror" && L.mirror) { L.mirror.x = fx; L.mirror.y = fy; }
      else if (drag.kind === "mrot" && L.mirror) L.mirror.ang = Math.atan2(p.y - L.mirror.y * VH, p.x - L.mirror.x * VW);
    };
    const onUp = () => { if (drag) { drag = null; refresh(); } };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    refresh();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sel = selRef.current;
  const L = levelRef.current;

  const cycle = (cur: ColorKey): ColorKey => COLOR_KEYS[(COLOR_KEYS.indexOf(cur) + 1) % COLOR_KEYS.length];
  const addStone = () => { L.stones.push({ minus: "amber", plus: "lime", x: 0.5, y: 0.5 }); refresh(); };
  const addTarget = () => { L.targets.push({ key: "white", x: 0.5, y: 0.5 }); refresh(); };
  const toggleMirror = () => { L.mirror = L.mirror ? null : { x: 0.5, y: 0.6, ang: 0 }; refresh(); };
  const del = () => {
    if (!sel) return;
    if (sel.kind === "stone") L.stones.splice(sel.i, 1);
    else if (sel.kind === "target") L.targets.splice(sel.i, 1);
    else if (sel.kind === "mirror") L.mirror = null;
    selRef.current = null; refresh();
  };
  const reset = () => { levelRef.current = clone(DEFAULT_LEVEL); selRef.current = null; refresh(); };
  const copy = () => { navigator.clipboard?.writeText(json).catch(() => {}); };

  const btn = "px-3 py-1.5 rounded-md border border-white/15 text-white/80 text-[13px] hover:bg-white/10 transition";

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex flex-col gap-3">
        <canvas
          ref={canvasRef}
          style={{ width: VW, height: VH, display: "block", background: "#0b0d09", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", touchAction: "none", cursor: "grab" }}
        />
        <div className="flex flex-wrap gap-2">
          <button className={btn} onClick={addStone}>+ камень</button>
          <button className={btn} onClick={addTarget}>+ цель</button>
          <button className={btn} onClick={toggleMirror}>{L.mirror ? "убрать зеркало" : "+ зеркало"}</button>
          <button className={btn} onClick={reset}>сброс</button>
        </div>
        {sel && (
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-white/70">
            <span className="uppercase tracking-wider text-white/40">{sel.kind === "stone" ? "камень" : sel.kind === "target" ? "цель" : "зеркало"}</span>
            {sel.kind === "target" && (
              <button className={btn} onClick={() => { L.targets[sel.i].key = cycle(L.targets[sel.i].key); refresh(); }}>
                цвет: {L.targets[sel.i].key}
              </button>
            )}
            {sel.kind === "stone" && (
              <>
                <button className={btn} onClick={() => { L.stones[sel.i].minus = cycle(L.stones[sel.i].minus); refresh(); }}>лево: {L.stones[sel.i].minus}</button>
                <button className={btn} onClick={() => { L.stones[sel.i].plus = cycle(L.stones[sel.i].plus); refresh(); }}>право: {L.stones[sel.i].plus}</button>
              </>
            )}
            <button className={btn} onClick={del}>удалить</button>
          </div>
        )}
        <p className="text-[12px] text-white/40 max-w-[360px]">
          Тащи элементы и цели. Камень: левая половина — цвет левой ветви, правая — правой.
          Зеркало: тело двигает, серая точка крутит. Цель горит, когда в неё бьёт луч её цвета.
          Позиции = стартовые. Когда соберёшь — скопируй JSON и пришли, вкручу как уровень.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-white/50">JSON уровня</span>
          <button className={btn} onClick={copy}>копировать</button>
        </div>
        <textarea
          readOnly
          value={json}
          className="w-full lg:w-[360px] h-[420px] rounded-md border border-white/10 bg-black/40 p-3 text-[12px] font-mono text-white/70"
        />
      </div>
    </div>
  );
}

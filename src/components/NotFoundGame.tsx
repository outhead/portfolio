"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LedText from "@/components/LedText";
import { layoutLedText } from "@/components/ledFont";

const ACCENT = "#A6FF00";
const GOLD = "#C9A66B";
const STEP = 20; // шаг клетки/диода, px
const TICK0 = 0.14; // стартовый интервал хода, сек
const TICK_MIN = 0.07; // потолок скорости
const BEST_KEY = "nf_snake_best";

type Pt = { x: number; y: number };
type FX = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string };
type Ring = { x: number; y: number; r: number; maxR: number; life: number; color: string };

export default function NotFoundGame() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [started, setStarted] = useState(false);
  const restartRef = useRef<() => void>(() => {});

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const DPR = Math.min(2, window.devicePixelRatio || 1);

    let cols = 0, rows = 0, offX = 0, offY = 0, Wc = 0, Hc = 0;
    let digit = new Set<number>();

    let snake: Pt[] = [];
    let dir: Pt = { x: 1, y: 0 };
    let nextDir: Pt = { x: 1, y: 0 };
    let food: Pt = { x: 0, y: 0 };
    let trail: { x: number; y: number }[] = []; // шлейф головы (px)
    let acc = 0, tick = TICK0, running = false, dead = false, sc = 0;
    let bestSc = 0;
    const fx: FX[] = [];
    const rings: Ring[] = [];
    const shake = { t: 0, mag: 0 };
    let flash = 0; // красная вспышка смерти
    let dieTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      bestSc = parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0;
      setBest(bestSc);
    } catch {}

    const key = (p: Pt) => p.y * cols + p.x;

    const placeFood = () => {
      const occ = new Set(snake.map(key));
      let p: Pt, g = 0;
      do {
        p = { x: (Math.random() * cols) | 0, y: (Math.random() * rows) | 0 };
      } while (occ.has(key(p)) && g++ < 500);
      food = p;
    };

    const reset = () => {
      const cx = (cols / 2) | 0, cy = (rows / 2) | 0;
      snake = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      tick = TICK0;
      acc = 0;
      sc = 0;
      dead = false;
      running = false;
      trail = [];
      fx.length = 0;
      rings.length = 0;
      flash = 0;
      if (dieTimer) { clearTimeout(dieTimer); dieTimer = null; }
      placeFood();
      setScore(0);
      setOver(false);
      setStarted(false);
    };
    restartRef.current = reset;

    const buildDigits = () => {
      const bmp = layoutLedText("404", 1);
      const bs = Math.max(1, Math.floor(Math.min((cols * 0.6) / bmp.cols, (rows * 0.62) / bmp.rows)));
      const dw = bmp.cols * bs, dh = bmp.rows * bs;
      const ox = Math.floor((cols - dw) / 2), oy = Math.floor((rows - dh) / 2);
      digit = new Set();
      for (const d of bmp.dots) {
        if (!d.lit) continue;
        for (let yy = 0; yy < bs; yy++)
          for (let xx = 0; xx < bs; xx++) {
            const gx = ox + d.col * bs + xx, gy = oy + d.row * bs + yy;
            if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) digit.add(gy * cols + gx);
          }
      }
    };

    const build = () => {
      const rect = wrap.getBoundingClientRect();
      Wc = rect.width;
      Hc = rect.height;
      canvas.width = Math.round(Wc * DPR);
      canvas.height = Math.round(Hc * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cols = Math.max(8, Math.floor(Wc / STEP));
      rows = Math.max(8, Math.floor(Hc / STEP));
      offX = (Wc - (cols - 1) * STEP) / 2;
      offY = (Hc - (rows - 1) * STEP) / 2;
      buildDigits();
      reset();
    };

    const cellXY = (p: Pt) => ({ x: offX + p.x * STEP, y: offY + p.y * STEP });

    const spawnEat = (p: Pt) => {
      const { x, y } = cellXY(p);
      rings.push({ x, y, r: 4, maxR: STEP * 2.4, life: 1, color: ACCENT });
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 40 + Math.random() * 110;
        fx.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, max: 0.5 + Math.random() * 0.3, size: 1.4 + Math.random() * 1.8, color: Math.random() < 0.4 ? GOLD : ACCENT });
      }
    };

    const spawnDeath = () => {
      for (const s of snake) {
        const { x, y } = cellXY(s);
        for (let i = 0; i < 4; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 50 + Math.random() * 160;
          fx.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, max: 0.6 + Math.random() * 0.5, size: 1.6 + Math.random() * 2.2, color: Math.random() < 0.5 ? "#ff5a4d" : ACCENT });
        }
      }
      const h = cellXY(snake[0]);
      rings.push({ x: h.x, y: h.y, r: 6, maxR: STEP * 5, life: 1, color: "#ff5a4d" });
      shake.t = 0.5;
      shake.mag = 9;
      flash = 1;
    };

    const die = () => {
      if (dead) return;
      dead = true;
      running = false;
      spawnDeath();
      if (sc > bestSc) {
        bestSc = sc;
        setBest(bestSc);
        try { localStorage.setItem(BEST_KEY, String(bestSc)); } catch {}
      }
      dieTimer = setTimeout(() => { if (!stopped) setOver(true); }, 620);
    };

    const step = () => {
      dir = nextDir;
      const head = snake[0];
      const nx = head.x + dir.x, ny = head.y + dir.y;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return die();
      if (snake.some((s, i) => i < snake.length - 1 && s.x === nx && s.y === ny)) return die();
      snake.unshift({ x: nx, y: ny });
      if (nx === food.x && ny === food.y) {
        sc++;
        setScore(sc);
        tick = Math.max(TICK_MIN, TICK0 - sc * 0.006);
        spawnEat(food);
        placeFood();
      } else {
        snake.pop();
      }
    };

    let raf = 0, stopped = false, last: number | null = null;

    const frame = (now: number) => {
      if (stopped) return;
      if (last == null) last = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;

      if (running && !dead) {
        acc += dt;
        while (acc >= tick) {
          acc -= tick;
          step();
        }
        // шлейф головы
        const h = cellXY(snake[0]);
        trail.unshift({ x: h.x, y: h.y });
        if (trail.length > 10) trail.pop();
      }

      // апдейт частиц/колец/тряски
      for (const p of fx) {
        p.life -= dt / p.max;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.92;
        p.vy *= 0.92;
      }
      for (let i = fx.length - 1; i >= 0; i--) if (fx[i].life <= 0) fx.splice(i, 1);
      for (const r of rings) {
        r.life -= dt / 0.5;
        r.r += (r.maxR - r.r) * Math.min(1, dt * 6);
      }
      for (let i = rings.length - 1; i >= 0; i--) if (rings[i].life <= 0) rings.splice(i, 1);
      if (shake.t > 0) shake.t -= dt;
      if (flash > 0) flash = Math.max(0, flash - dt / 0.5);

      ctx.clearRect(0, 0, Wc, Hc);
      ctx.save();
      if (shake.t > 0) {
        const m = shake.mag * (shake.t / 0.5);
        ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
      }

      // фон: сетка + дышащее «404»
      const breathe = 0.13 + 0.06 * Math.sin(t * 1.4);
      for (let gy = 0; gy < rows; gy++)
        for (let gx = 0; gx < cols; gx++) {
          const isD = digit.has(gy * cols + gx);
          dot({ x: gx, y: gy }, isD ? GOLD : "#ffffff", 1.4, isD ? breathe : 0.045);
        }

      // неоновая рамка поля
      const bx = offX - STEP / 2, by = offY - STEP / 2;
      const bw = cols * STEP, bh = rows * STEP;
      ctx.save();
      ctx.shadowColor = "rgba(166,255,0,0.5)";
      ctx.shadowBlur = 14;
      ctx.strokeStyle = "rgba(166,255,0,0.32)";
      ctx.lineWidth = 1.5;
      roundRect(bx, by, bw, bh, 10);
      ctx.stroke();
      ctx.restore();

      // кольца
      for (const r of rings) {
        ctx.globalAlpha = Math.max(0, r.life) * 0.6;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // еда — glow + искра
      const fxy = cellXY(food);
      const pulse = 0.6 + 0.4 * Math.sin(t * 5);
      const grd = ctx.createRadialGradient(fxy.x, fxy.y, 1, fxy.x, fxy.y, 16 + pulse * 6);
      grd.addColorStop(0, "rgba(201,166,107,0.9)");
      grd.addColorStop(1, "rgba(201,166,107,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(fxy.x - 24, fxy.y - 24, 48, 48);
      ctx.fillStyle = "#F4E3C0";
      ctx.beginPath();
      ctx.arc(fxy.x, fxy.y, 3 + pulse * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // шлейф головы
      if (!dead) {
        for (let i = trail.length - 1; i >= 0; i--) {
          const k = 1 - i / trail.length;
          ctx.globalAlpha = k * 0.18;
          ctx.fillStyle = ACCENT;
          ctx.beginPath();
          ctx.arc(trail[i].x, trail[i].y, 5 * k, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // змейка — неон, голова ярче
      if (!dead) {
        ctx.save();
        ctx.shadowColor = "rgba(166,255,0,0.65)";
        for (let i = snake.length - 1; i >= 0; i--) {
          const hn = 1 - i / Math.max(1, snake.length);
          const { x, y } = cellXY(snake[i]);
          ctx.shadowBlur = 6 + hn * 12;
          ctx.globalAlpha = 0.5 + hn * 0.5;
          ctx.fillStyle = i === 0 ? "#D8FF8F" : ACCENT;
          ctx.beginPath();
          ctx.arc(x, y, 4.2 + hn * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // частицы
      for (const p of fx) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.restore();

      // оверлеи: сканлайны, виньетка, вспышка
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = "#000";
      for (let y = 0; y < Hc; y += 3) ctx.fillRect(0, y, Wc, 1);
      ctx.globalAlpha = 1;

      const vg = ctx.createRadialGradient(Wc / 2, Hc / 2, Hc * 0.25, Wc / 2, Hc / 2, Hc * 0.8);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, Wc, Hc);

      if (flash > 0) {
        ctx.globalAlpha = flash * 0.4;
        ctx.fillStyle = "#ff3b30";
        ctx.fillRect(0, 0, Wc, Hc);
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(frame);
    };

    function dot(p: Pt, color: string, r: number, a: number) {
      const x = offX + p.x * STEP, y = offY + p.y * STEP;
      ctx!.globalAlpha = a;
      ctx!.fillStyle = color;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.globalAlpha = 1;
    }

    function roundRect(x: number, y: number, w: number, h: number, rad: number) {
      ctx!.beginPath();
      ctx!.moveTo(x + rad, y);
      ctx!.arcTo(x + w, y, x + w, y + h, rad);
      ctx!.arcTo(x + w, y + h, x, y + h, rad);
      ctx!.arcTo(x, y + h, x, y, rad);
      ctx!.arcTo(x, y, x + w, y, rad);
      ctx!.closePath();
    }

    const setDir = (x: number, y: number) => {
      if (x === -dir.x && y === -dir.y) return;
      nextDir = { x, y };
      if (!running && !dead) {
        running = true;
        setStarted(true);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      let handled = true;
      switch (e.key) {
        case "ArrowUp": case "w": case "W": case "ц": case "Ц": setDir(0, -1); break;
        case "ArrowDown": case "s": case "S": case "ы": case "Ы": setDir(0, 1); break;
        case "ArrowLeft": case "a": case "A": case "ф": case "Ф": setDir(-1, 0); break;
        case "ArrowRight": case "d": case "D": case "в": case "В": setDir(1, 0); break;
        default: handled = false;
      }
      if (handled) e.preventDefault();
    };

    let tsx = 0, tsy = 0;
    const onPDown = (e: PointerEvent) => { tsx = e.clientX; tsy = e.clientY; };
    const onPUp = (e: PointerEvent) => {
      const dx = e.clientX - tsx, dy = e.clientY - tsy;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
      else setDir(0, dy > 0 ? 1 : -1);
    };

    let ro: ResizeObserver | null = null;
    build();
    raf = requestAnimationFrame(frame);
    window.addEventListener("keydown", onKey);
    canvas.addEventListener("pointerdown", onPDown);
    canvas.addEventListener("pointerup", onPUp);
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(() => build());
      ro.observe(wrap);
    }

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      if (dieTimer) clearTimeout(dieTimer);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointerdown", onPDown);
      canvas.removeEventListener("pointerup", onPUp);
      ro?.disconnect();
    };
  }, []);

  return (
    <section className="relative z-[1] min-h-[88vh] bg-black overflow-hidden select-none">
      <div ref={wrapRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none" aria-hidden />
      </div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none text-center">
        <p className="text-white/45">
          <span className="sr-only">Счёт: {score}</span>
          <LedText
            text={`СЧЁТ ${score}${best > 0 ? `   РЕКОРД ${best}` : ""}`}
            className="h-[9px] md:h-[11px] w-auto mx-auto"
          />
        </p>
      </div>

      {!started && !over && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[64px] pointer-events-none text-center">
          <p className="text-white/35">
            <LedText text="СТРЕЛКИ ИЛИ СВАЙП — ВПЕРЁД" className="h-[9px] w-auto mx-auto" />
          </p>
        </div>
      )}

      {over && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center px-5">
          <p className="text-white/70">
            <span className="sr-only">Игра окончена. Счёт {score}.</span>
            <LedText text="ТУПИК" className="h-[16px] md:h-[22px] w-auto mx-auto" />
          </p>
          <p className="text-white/40">
            <LedText text={`СЧЁТ ${score}${best > 0 ? `   РЕКОРД ${best}` : ""}`} className="h-[10px] w-auto mx-auto" />
          </p>
          <button
            type="button"
            onClick={() => restartRef.current()}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 bg-[#A6FF00] text-black hover:bg-[#B8FF33] transition-colors"
          >
            <span className="sr-only">Ещё раз</span>
            <LedText text="ЕЩЁ РАЗ" className="h-[11px] w-auto" />
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 bg-white/[0.06] text-white/70 hover:bg-white/[0.1] transition-colors no-underline"
          >
            <span className="sr-only">На главную</span>
            <LedText text="На главную" className="h-[10px] w-auto" />
          </Link>
        </div>
      )}

      {!over && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 bg-white/[0.05] text-white/55 hover:bg-white/[0.1] hover:text-white/80 transition-colors no-underline"
          >
            <span className="sr-only">На главную</span>
            <LedText text="На главную" className="h-[10px] w-auto" />
          </Link>
        </div>
      )}
    </section>
  );
}

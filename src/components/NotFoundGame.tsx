"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LedText from "@/components/LedText";
import { layoutLedText } from "@/components/ledFont";
import { loadSnakeBoard, saveSnakeScore, type SnakeEntry } from "@/components/snakeBoard";

const NAME_KEY = "nf_snake_name";
const BEST_KEY = "nf_snake_best";
const ACCENT = "#A6FF00";
const GOLD = "#C9A66B";
const STEP = 18; // шаг диода, px
const TICK0 = 0.14;
const TICK_MIN = 0.075;

// Прямоугольные цифры одной линией (треки). «0» — кольцо без перечёркивания.
const D4: [number, number][] = [
  [0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1], [3, 0], [3, 4], [3, 5], [3, 6],
];
const D0_LOOP: [number, number][] = [
  [0, 6], [0, 5], [0, 4], [0, 3], [0, 2], [0, 1], [0, 0], [1, 0], [2, 0], [3, 0],
  [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [2, 6], [1, 6],
];

type Pt = { x: number; y: number };
type FX = { x: number; y: number; vx: number; vy: number; life: number; max: number; col: [number, number, number] };

export default function NotFoundGame() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [name, setName] = useState("");
  const [board, setBoard] = useState<SnakeEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const restartRef = useRef<() => void>(() => {});
  const introRef = useRef<() => void>(() => {});

  useEffect(() => {
    try {
      const n = localStorage.getItem(NAME_KEY);
      if (n) setName(n);
    } catch {}
  }, []);

  useEffect(() => {
    if (over) loadSnakeBoard().then(setBoard);
    else setSubmitted(false);
  }, [over]);

  const submitScore = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      localStorage.setItem(NAME_KEY, name.trim());
    } catch {}
    const b = await saveSnakeScore(name, score);
    setBoard(b);
    setSubmitted(true);
    setSubmitting(false);
  };

  const buildShareCanvas = () => {
    const S = 1080;
    const cv = document.createElement("canvas");
    cv.width = S;
    cv.height = S;
    const c = cv.getContext("2d");
    if (!c) return cv;
    c.fillStyle = "#050505";
    c.fillRect(0, 0, S, S);
    c.fillStyle = "rgba(255,255,255,0.045)";
    for (let y = 56; y < S; y += 26)
      for (let x = 56; x < S; x += 26) {
        c.beginPath();
        c.arc(x, y, 1.5, 0, Math.PI * 2);
        c.fill();
      }
    const led = (text: string, cy: number, pitch: number, color: string) => {
      const { dots, cols, rows } = layoutLedText(text, 1);
      const w = cols * pitch;
      const sx = S / 2 - w / 2;
      const sy = cy - (rows * pitch) / 2;
      c.fillStyle = color;
      for (const d of dots) {
        if (!d.lit) continue;
        c.beginPath();
        c.arc(sx + d.col * pitch + pitch / 2, sy + d.row * pitch + pitch / 2, pitch * 0.42, 0, Math.PI * 2);
        c.fill();
      }
    };
    led("404", 320, 30, ACCENT);
    led(`СЧЁТ ${score}`, 600, 17, ACCENT);
    if (best > 0) led(`РЕКОРД ${best}`, 712, 11, "rgba(201,166,107,0.85)");
    c.fillStyle = ACCENT;
    for (let i = 0; i < 11; i++) {
      c.globalAlpha = 0.25 + i * 0.07;
      c.beginPath();
      c.arc(S / 2 - 130 + i * 26, 838, 8, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
    const host = (typeof location !== "undefined" ? location.host : "").toUpperCase() || "EGORADI";
    led(host, 968, 9, "rgba(255,255,255,0.5)");
    return cv;
  };

  const handleShare = async () => {
    setShareMsg("");
    const cv = buildShareCanvas();
    const host = typeof location !== "undefined" ? location.host : "";
    const text = `Змейка на 404: счёт ${score}${best > 0 ? `, рекорд ${best}` : ""}${host ? ` — ${host}` : ""}`;
    const blob: Blob | null = await new Promise((res) => cv.toBlob((b) => res(b), "image/png"));
    if (!blob) return;
    const file = new File([blob], "404-snake.png", { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    try {
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], text, title: "404 — змейка" });
        return;
      }
    } catch {
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "404-snake.png";
    a.click();
    URL.revokeObjectURL(url);
    try {
      await navigator.clipboard.writeText(text);
      setShareMsg("Картинка сохранена · счёт скопирован");
    } catch {
      setShareMsg("Картинка сохранена");
    }
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const DPR = Math.min(2, window.devicePixelRatio || 1);

    let cols = 0, rows = 0, offX = 0, offY = 0, Wc = 0, Hc = 0;
    let four: Pt[] = [];
    let zeroLoop: Pt[] = [];

    let mode: "intro" | "play" | "dead" = "intro";
    let ih = 0; // фаза света по «0» в интро
    let snake: Pt[] = [];
    let dir: Pt = { x: 1, y: 0 };
    let nextDir: Pt = { x: 1, y: 0 };
    let food: Pt = { x: 0, y: 0 };
    let grow = 0;
    let acc = 0;
    let tick = TICK0;
    let sc = 0;
    let bestSc = 0;
    let ghost: Float32Array = new Float32Array(0); // остывающие «угли» за хвостом
    const fx: FX[] = [];
    let dieTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      bestSc = parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0;
      setBest(bestSc);
    } catch {}

    const cl = (v: number) => Math.max(0, Math.min(1, v));
    const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
    const cxy = (x: number, y: number) => ({ x: offX + x * STEP, y: offY + y * STEP });
    const key = (p: Pt) => p.y * cols + p.x;

    const sdot = (x: number, y: number, r: number, c: [number, number, number], a: number) => {
      ctx.globalAlpha = cl(a);
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };
    // зелёный накал; синий приглушён → центр не белеет
    const therm = (tt: number): [number, number, number] => {
      tt = cl(tt);
      return [lerp(70, 150, tt), lerp(140, 255, tt), lerp(4, 16, tt)];
    };
    const cell = (x: number, y: number, tt: number) => {
      if (tt <= 0.01) return;
      ctx.globalCompositeOperation = "lighter";
      const c = therm(tt);
      for (let k = 2; k >= 1; k--) sdot(x, y, 2.0 * k * (0.55 + 0.5 * tt), c, tt * 0.22 * k);
      sdot(x, y, 1.7, c, Math.min(1, tt * 1.2));
      if (tt > 0.7) sdot(x, y, 1.0, [180, 255, 40], (tt - 0.7) / 0.3);
      ctx.globalCompositeOperation = "source-over";
    };
    const foodDot = (x: number, y: number, pu: number) => {
      const g: [number, number, number] = [201, 166, 107];
      ctx.globalCompositeOperation = "lighter";
      for (let k = 2; k >= 1; k--) sdot(x, y, 2.0 * k * (0.7 + 0.3 * pu), g, 0.22 * k * (0.6 + 0.4 * pu));
      sdot(x, y, 1.7, [224, 196, 140], 0.95);
      ctx.globalCompositeOperation = "source-over";
    };

    const buildDigits = () => {
      const bw = 14, bh = 7;
      const ox = Math.floor((cols - bw) / 2);
      const oy = Math.floor((rows - bh) / 2);
      four = [];
      zeroLoop = [];
      for (const bx of [0, 10]) for (const p of D4) four.push({ x: ox + bx + p[0], y: oy + p[1] });
      for (const p of D0_LOOP) zeroLoop.push({ x: ox + 5 + p[0], y: oy + p[1] });
    };

    const build = () => {
      const rect = wrap.getBoundingClientRect();
      Wc = rect.width;
      Hc = rect.height;
      canvas.width = Math.round(Wc * DPR);
      canvas.height = Math.round(Hc * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cols = Math.max(10, Math.floor(Wc / STEP));
      rows = Math.max(8, Math.floor(Hc / STEP));
      offX = (Wc - (cols - 1) * STEP) / 2;
      offY = (Hc - (rows - 1) * STEP) / 2;
      ghost = new Float32Array(cols * rows);
      buildDigits();
    };

    const placeFood = () => {
      const occ = new Set(snake.map(key));
      let p: Pt, g = 0;
      do {
        p = { x: (Math.random() * cols) | 0, y: (Math.random() * rows) | 0 };
      } while (occ.has(key(p)) && g++ < 400);
      food = p;
    };

    const toIntro = () => {
      mode = "intro";
      snake = [];
      ghost.fill(0);
      fx.length = 0;
      setOver(false);
      setStarted(false);
      setScore(0);
    };

    const startFromRing = (px: number, py: number) => {
      const P = zeroLoop.length, La = 6, hi = Math.floor(ih);
      snake = [];
      for (let i = 0; i < La; i++) {
        const idx = ((hi - i) % P + P) % P;
        snake.push({ x: zeroLoop[idx].x, y: zeroLoop[idx].y });
      }
      const hd = { x: Math.sign(snake[0].x - snake[1].x), y: Math.sign(snake[0].y - snake[1].y) };
      dir = { x: hd.x || 1, y: hd.y };
      nextDir = px === -dir.x && py === -dir.y ? { ...dir } : { x: px, y: py };
      begin();
    };

    const startCenter = () => {
      const cyc = (rows / 2) | 0, cxc = (cols / 2) | 0;
      snake = [{ x: cxc, y: cyc }, { x: cxc - 1, y: cyc }, { x: cxc - 2, y: cyc }, { x: cxc - 3, y: cyc }];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      begin();
    };

    const begin = () => {
      mode = "play";
      grow = 0;
      acc = 0;
      tick = TICK0;
      sc = 0;
      ghost.fill(0);
      fx.length = 0;
      if (dieTimer) { clearTimeout(dieTimer); dieTimer = null; }
      setScore(0);
      setOver(false);
      setStarted(true);
      placeFood();
    };
    restartRef.current = () => startCenter();

    const die = () => {
      if (mode === "dead") return;
      mode = "dead";
      for (const s of snake) {
        const c = cxy(s.x, s.y);
        for (let i = 0; i < 3; i++) {
          const a = Math.random() * Math.PI * 2, sp = 30 + Math.random() * 110;
          fx.push({ x: c.x, y: c.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, max: 0.6 + Math.random() * 0.4, col: Math.random() < 0.5 ? [255, 90, 70] : [166, 255, 0] });
        }
      }
      if (sc > bestSc) {
        bestSc = sc;
        setBest(bestSc);
        try { localStorage.setItem(BEST_KEY, String(bestSc)); } catch {}
      }
      dieTimer = setTimeout(() => { if (!stopped) setOver(true); }, 600);
    };

    const burst = (gx: number, gy: number) => {
      const c = cxy(gx, gy);
      for (let i = 0; i < 9; i++) {
        const a = Math.random() * Math.PI * 2, sp = 30 + Math.random() * 80;
        fx.push({ x: c.x, y: c.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, max: 0.4 + Math.random() * 0.3, col: Math.random() < 0.5 ? [201, 166, 107] : [166, 255, 0] });
      }
    };

    const stepGame = () => {
      dir = nextDir;
      const h = snake[0];
      const nx = h.x + dir.x, ny = h.y + dir.y;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return die();
      if (snake.some((s, i) => i < snake.length - 1 && s.x === nx && s.y === ny)) return die();
      snake.unshift({ x: nx, y: ny });
      if (nx === food.x && ny === food.y) {
        sc++;
        setScore(sc);
        tick = Math.max(TICK_MIN, TICK0 - sc * 0.006);
        burst(food.x, food.y);
        placeFood();
        grow += 1;
      }
      if (grow > 0) grow--;
      else {
        const tail = snake.pop();
        if (tail) ghost[tail.y * cols + tail.x] = 0.5; // уголёк за хвостом
      }
    };

    const setDir = (x: number, y: number) => {
      if (mode === "intro") { startFromRing(x, y); return; }
      if (mode === "dead") return;
      if (x === -dir.x && y === -dir.y) return;
      nextDir = { x, y };
    };

    let raf = 0, stopped = false, last: number | null = null;

    const frame = (now: number) => {
      if (stopped) return;
      if (last == null) last = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ts = now / 1000;
      ctx.clearRect(0, 0, Wc, Hc);

      // тусклая сетка точек (везде)
      for (let gy = 0; gy < rows; gy++)
        for (let gx = 0; gx < cols; gx++) {
          const c = cxy(gx, gy);
          sdot(c.x, c.y, 1.3, [255, 255, 255], 0.045);
        }

      if (mode === "intro") {
        const breathe = 0.62 + 0.12 * Math.sin(ts * 2);
        for (const d of four) {
          const c = cxy(d.x, d.y);
          cell(c.x, c.y, breathe);
        }
        for (const d of zeroLoop) {
          const c = cxy(d.x, d.y);
          cell(c.x, c.y, 0.3);
        }
        ih += dt * 8;
        const P = zeroLoop.length, La = 6;
        for (let i = 0; i < La; i++) {
          const idx = ((Math.floor(ih) - i) % P + P) % P;
          const c = cxy(zeroLoop[idx].x, zeroLoop[idx].y);
          cell(c.x, c.y, 0.55 + (1 - i / La) * 0.7);
        }
        raf = requestAnimationFrame(frame);
        return;
      }

      if (mode === "play") {
        acc += dt;
        while (acc >= tick) { acc -= tick; stepGame(); }
      }

      // остывающие угли
      for (let i = 0; i < ghost.length; i++) {
        if (ghost[i] > 0) {
          ghost[i] = Math.max(0, ghost[i] - dt * 1.6);
          if (ghost[i] > 0.01) {
            const gx = i % cols, gy = (i / cols) | 0;
            const c = cxy(gx, gy);
            cell(c.x, c.y, ghost[i] * 0.7);
          }
        }
      }

      // еда
      const fp = cxy(food.x, food.y);
      foodDot(fp.x, fp.y, 0.6 + 0.4 * Math.sin(ts * 5));

      // змейка: накал-градиент по телу (голова раскалена → хвост остывает)
      const L = snake.length;
      for (let i = L - 1; i >= 0; i--) {
        const tt = mode === "dead" ? 0 : lerp(0.45, 1.25, L > 1 ? 1 - i / (L - 1) : 1);
        if (tt > 0.01) {
          const c = cxy(snake[i].x, snake[i].y);
          cell(c.x, c.y, tt);
        }
      }

      // искры
      for (const p of fx) {
        p.life -= dt / p.max;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.92;
        p.vy *= 0.92;
        sdot(p.x, p.y, 1.6, p.col, Math.max(0, p.life));
      }
      for (let i = fx.length - 1; i >= 0; i--) if (fx[i].life <= 0) fx.splice(i, 1);

      raf = requestAnimationFrame(frame);
    };

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
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
      if (Math.abs(dx) < 16 && Math.abs(dy) < 16) return;
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
    // экспорт «в интро» для кнопок
    introRef.current = toIntro;

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
    <section className="relative z-[1] min-h-[calc(100svh-5rem)] bg-black flex flex-col items-center justify-start px-5 pt-8 md:pt-12 pb-6 select-none overflow-hidden">
      <div className="w-full max-w-[760px] flex flex-col items-center">
        <div ref={wrapRef} className="relative w-full h-[clamp(240px,46vh,400px)] rounded-xl border border-white/20 overflow-hidden">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none" aria-hidden />

          {/* HUD счёта во время игры */}
          {started && !over && (
            <div className="absolute top-3 left-4 pointer-events-none">
              <span className="sr-only">Счёт: {score}</span>
              <LedText text={`СЧЁТ ${score}${best > 0 ? `   РЕКОРД ${best}` : ""}`} className="h-[8px] md:h-[10px] w-auto" />
            </div>
          )}

          {/* Экран проигрыша */}
          {over && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-5 py-6 overflow-y-auto bg-black/55">
              <p className="text-white/75">
                <span className="sr-only">Игра окончена. Счёт {score}.</span>
                <LedText text="ТУПИК" className="h-[15px] md:h-[20px] w-auto mx-auto" />
              </p>
              <p className="text-white/40">
                <LedText text={`СЧЁТ ${score}${best > 0 ? `   РЕКОРД ${best}` : ""}`} className="h-[9px] w-auto mx-auto" />
              </p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => restartRef.current()} className="inline-flex items-center rounded-lg px-5 py-2.5 bg-[#A6FF00] text-black hover:bg-[#B8FF33] transition-colors">
                  <LedText text="ЕЩЁ РАЗ" className="h-[10px] w-auto" />
                </button>
                <button type="button" onClick={handleShare} className="inline-flex items-center rounded-lg px-5 py-2.5 bg-white/[0.06] text-white/75 hover:bg-white/[0.12] transition-colors">
                  <LedText text="ПОДЕЛИТЬСЯ" className="h-[10px] w-auto" />
                </button>
              </div>
              {shareMsg && <p className="text-white/40 -mt-1"><LedText text={shareMsg} className="h-[7px] w-auto mx-auto" /></p>}

              <div className="mt-1 w-full max-w-[330px] rounded-2xl border border-white/[0.08] bg-[#0c0c0b]/80 p-4">
                <p className="text-[#A6FF00]/70 mb-3 flex justify-center"><LedText text="РЕЙТИНГ ЗМЕЙКИ" className="h-[8px] w-auto" /></p>
                {score > 0 && !submitted && (
                  <div className="flex items-center gap-2 mb-3">
                    <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitScore()} maxLength={32} placeholder="Имя"
                      className="flex-1 min-w-0 bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-[14px] text-white/85 placeholder:text-white/30 outline-none focus:border-[#A6FF00]/40" />
                    <button type="button" onClick={submitScore} disabled={submitting}
                      className="shrink-0 rounded-lg px-3.5 py-2.5 bg-[#A6FF00] text-black hover:bg-[#B8FF33] disabled:opacity-50 transition-colors">
                      <LedText text={submitting ? "..." : "В РЕЙТИНГ"} className="h-[8px] w-auto" />
                    </button>
                  </div>
                )}
                <ol className="space-y-1.5 text-left">
                  {board.length === 0 && <li className="text-white/30 text-[13px] text-center py-1">Пока пусто — будь первым</li>}
                  {board.slice(0, 7).map((e, i) => (
                    <li key={`${e.name}-${e.at}-${i}`} className="flex items-center gap-3 text-[13px] tabular-nums">
                      <span className="w-5 text-right text-white/35">{i + 1}</span>
                      <span className="flex-1 min-w-0 truncate text-white/75">{e.name}</span>
                      <span className="text-[#A6FF00]/85 font-medium">{e.score}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Подпись под полем */}
        {!started && !over && (
          <div className="mt-6 text-center">
            <p className="text-white/40 leading-relaxed">
              <span className="sr-only">Такой страницы нет</span>
              <LedText text="ТАКОЙ СТРАНИЦЫ НЕТ" className="h-[8px] md:h-[9px] w-auto mx-auto" />
            </p>
            <p className="mt-3 text-[#A6FF00]/70">
              <LedText text="ЖМИ ← → И ПОЕХАЛИ" className="h-[9px] md:h-[11px] w-auto mx-auto" />
            </p>
          </div>
        )}

        {/* Выход */}
        <Link href="/" onClick={() => introRef.current()} className="mt-6 inline-flex items-center rounded-lg px-5 py-2.5 bg-white/[0.05] text-white/55 hover:bg-white/[0.1] hover:text-white/80 transition-colors no-underline">
          <span className="sr-only">На главную</span>
          <LedText text="На главную" className="h-[10px] w-auto" />
        </Link>
      </div>
    </section>
  );
}

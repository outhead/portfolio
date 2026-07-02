"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LedText from "@/components/LedText";
import { layoutLedText } from "@/components/ledFont";
import { flowAngle } from "@/app/secret/pong/field";
import { loadSnakeBoard, saveSnakeScore, type SnakeEntry } from "@/components/snakeBoard";

const NAME_KEY = "nf_snake_name";
const BEST_KEY = "nf_snake_best";
const ACCENT = "#A6FF00";
const GOLD = "#C9A66B";
const STEP = 18; // шаг диода, px
const TICK0 = 0.14;
const TICK_MIN = 0.075;
const START_FOOD = 2;   // еды на старте
const MAX_FOOD = 3;     // максимум одновременно
const FOOD_SPAWN = 2.4; // сек между автоподсевом
const COMBO_WINDOW = 2500; // мс между съеденными для комбо

// Похвала: на каждую новую съеденную — следующая, по нарастающей.
const PRAISE = [
  "ОТЛИЧНО", "МОЛОДЕЦ", "ТАК ДЕРЖАТЬ", "КРАСИВО", "ВОТ ЭТО ДА",
  "НЕ ОСТАНАВЛИВАЙСЯ", "ОГОНЬ", "ТЫ В УДАРЕ", "РАСТЁМ", "ПРОФИ",
  "ВКУСНО", "ДАВАЙ ЕЩЁ", "ЛОВКО", "КЛАСС", "МАСТЕР",
  "БОМБА", "НЕУДЕРЖИМ", "КРАСАВА", "ЛЕГЕНДА", "КОСМОС",
  "ГЕНИАЛЬНО", "ВИРТУОЗ", "МАШИНА", "ПОЧТИ РЕКОРД",
];
const praiseFor = (n: number) => PRAISE[(n - 1) % PRAISE.length];
const HINT_AT = 25; // после стольких съеденных — подсказка про пасхалку

// Прямоугольные цифры одной линией (треки). «0» — кольцо без перечёркивания.
const D4: [number, number][] = [
  [0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1], [3, 0], [3, 4], [3, 5], [3, 6],
];
const D0_LOOP: [number, number][] = [
  [0, 6], [0, 5], [0, 4], [0, 3], [0, 2], [0, 1], [0, 0], [1, 0], [2, 0], [3, 0],
  [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [2, 6], [1, 6],
];

type Pt = { x: number; y: number };
type FX = {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; col: [number, number, number];
  kind: "line" | "dot";
};
type Food = Pt & { born: number };
type Wave = { x: number; y: number; t0: number; col: string };
type Float = { x: number; y: number; t0: number; text: string };

export default function NotFoundGame() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [name, setName] = useState("");
  const [board, setBoard] = useState<SnakeEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [praise, setPraise] = useState("");
  const [hint, setHint] = useState(false);
  const restartRef = useRef<() => void>(() => {});
  const introRef = useRef<() => void>(() => {});
  const dirRef = useRef<(x: number, y: number) => void>(() => {});

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
    const bgCanvas = bgRef.current;
    if (!wrap || !canvas || !bgCanvas) return;
    const ctx = canvas.getContext("2d");
    const bctx = bgCanvas.getContext("2d");
    if (!ctx || !bctx) return;
    const DPR = Math.min(1.5, window.devicePixelRatio || 1);
    const BDPR = Math.min(1.25, window.devicePixelRatio || 1);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    let cols = 0, rows = 0, offX = 0, offY = 0, Wc = 0, Hc = 0;
    let four: Pt[] = [];
    let zeroLoop: Pt[] = [];
    let vignette: CanvasGradient | null = null;

    let mode: "intro" | "play" | "dead" = "intro";
    let ih = 0; // фаза света по «0» в интро
    let snake: Pt[] = [];
    let lastTail: Pt | null = null; // откуда «дотягивается» хвост между тиками
    let justGrew = false;           // на этом тике хвост стоит на месте
    let stepped = false;            // был ли хоть один тик (для интерполяции)
    let dir: Pt = { x: 1, y: 0 };
    let nextDir: Pt = { x: 1, y: 0 };
    let foods: Food[] = [];
    let foodAcc = 0; // таймер автоподсева еды
    let grow = 0;
    let acc = 0;
    let tick = TICK0;
    let sc = 0;
    let bestSc = 0;
    let combo = 0;
    let lastEatAt = -1e9;
    let ghost: Float32Array = new Float32Array(0); // остывающие «угли» за хвостом
    const fx: FX[] = [];
    const waves: Wave[] = [];   // ударные волны
    const floats: Float[] = []; // всплывающие «+1»/«XN» LED-точками
    let flashA = 0;             // вспышка поверх поля
    let flashCol = "166,255,0";
    let shake = 0;              // тряска поля
    let energy = 0;             // «энергия» фона: растёт на съеденных, гаснет
    let deadAt = 0;             // старт волны распада
    let lastDeadN = 0;          // сколько сегментов уже взорвалось
    let deadSnake: Pt[] = [];   // копия тела на момент смерти
    let dieTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      bestSc = parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0;
      setBest(bestSc);
    } catch {}

    const cl = (v: number) => Math.max(0, Math.min(1, v));
    const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
    const eob = (t: number) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2); // easeOutBack
    const eoc = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
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
    const foodDot = (x: number, y: number, pu: number, scale = 1) => {
      const g: [number, number, number] = [201, 166, 107];
      ctx.globalCompositeOperation = "lighter";
      for (let k = 2; k >= 1; k--) sdot(x, y, 2.0 * k * (0.7 + 0.3 * pu) * scale, g, 0.22 * k * (0.6 + 0.4 * pu));
      sdot(x, y, 1.7 * scale, [224, 196, 140], 0.95);
      ctx.globalCompositeOperation = "source-over";
    };

    // искры в стиле понга: чёрточки-спидлайны по направлению + точки россыпью,
    // лёгкая гравитация. Координаты экранные.
    const sparks = (
      x: number, y: number, palette: [number, number, number][],
      n: number, dx = 0, dy = 0,
    ) => {
      if (reduced) return;
      const hasDir = dx !== 0 || dy !== 0;
      const baseA = Math.atan2(dy, dx);
      for (let i = 0; i < n; i++) {
        const a = hasDir ? baseA + (Math.random() - 0.5) * 1.6 : Math.random() * Math.PI * 2;
        const sp = (hasDir ? 70 : 30) + Math.random() * 110;
        fx.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: 1, max: 0.35 + Math.random() * 0.4,
          col: palette[(Math.random() * palette.length) | 0],
          kind: Math.random() < 0.5 ? "line" : "dot",
        });
      }
      if (fx.length > 240) fx.splice(0, fx.length - 240);
    };

    const wave = (x: number, y: number, col: string) => {
      if (reduced) return;
      waves.push({ x, y, t0: performance.now(), col });
      if (waves.length > 8) waves.shift();
    };

    const floatLayouts = new Map<string, ReturnType<typeof layoutLedText>>();
    const addFloat = (x: number, y: number, text: string) => {
      if (reduced) return;
      if (!floatLayouts.has(text)) floatLayouts.set(text, layoutLedText(text, 1));
      floats.push({ x, y, t0: performance.now(), text });
      if (floats.length > 6) floats.shift();
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

    // ── живой фон: частицы текут по тому же флоу-нойзу, что поле в понге ──
    let bgN = 0;
    let bpx: Float32Array = new Float32Array(0);
    let bpy: Float32Array = new Float32Array(0);
    const buildBg = () => {
      bgCanvas.width = Math.max(1, Math.round(Wc * BDPR));
      bgCanvas.height = Math.max(1, Math.round(Hc * BDPR));
      bctx.setTransform(BDPR, 0, 0, BDPR, 0, 0);
      bctx.fillStyle = "#000";
      bctx.fillRect(0, 0, Wc, Hc);
      bgN = Math.min(420, Math.max(160, Math.round((Wc * Hc) / 2600)));
      bpx = new Float32Array(bgN);
      bpy = new Float32Array(bgN);
      for (let i = 0; i < bgN; i++) { bpx[i] = Math.random() * Wc; bpy[i] = Math.random() * Hc; }
      if (reduced) {
        // статичный кадр: короткие штрихи вдоль поля, без анимации
        const t = performance.now();
        bctx.strokeStyle = "rgba(166,255,0,0.10)";
        bctx.lineWidth = 1;
        for (let i = 0; i < bgN; i++) {
          let x = Math.random() * Wc, y = Math.random() * Hc;
          bctx.beginPath(); bctx.moveTo(x, y);
          for (let s = 0; s < 6; s++) {
            const a = flowAngle(x, y, t);
            x += Math.cos(a) * 3; y += Math.sin(a) * 3;
            bctx.lineTo(x, y);
          }
          bctx.stroke();
        }
      }
    };
    const drawBg = (tNow: number) => {
      // fade-след: прошлый кадр гасится — частицы оставляют «нити»
      bctx.fillStyle = "rgba(0,0,0,0.06)";
      bctx.fillRect(0, 0, Wc, Hc);
      const sp = 0.5 + energy * 1.6;
      const baseA = 0.12 + energy * 0.2;
      for (let i = 0; i < bgN; i++) {
        const a = flowAngle(bpx[i], bpy[i], tNow);
        bpx[i] += Math.cos(a) * sp;
        bpy[i] += Math.sin(a) * sp;
        const sh = 0.35 + 0.65 * ((Math.sin(a) + 1) / 2);
        bctx.fillStyle = `rgba(${Math.round(140 * sh + 26)},255,${Math.round(40 * (1 - sh))},${baseA.toFixed(3)})`;
        bctx.fillRect(bpx[i], bpy[i], 1.2, 1.2);
        if (bpx[i] < 0 || bpx[i] > Wc || bpy[i] < 0 || bpy[i] > Hc) {
          bpx[i] = Math.random() * Wc;
          bpy[i] = Math.random() * Hc;
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
      cols = Math.max(10, Math.floor(Wc / STEP));
      rows = Math.max(8, Math.floor(Hc / STEP));
      offX = (Wc - (cols - 1) * STEP) / 2;
      offY = (Hc - (rows - 1) * STEP) / 2;
      ghost = new Float32Array(cols * rows);
      vignette = ctx.createRadialGradient(Wc / 2, Hc / 2, Math.min(Wc, Hc) * 0.35, Wc / 2, Hc / 2, Math.max(Wc, Hc) * 0.68);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.42)");
      buildDigits();
      buildBg();
    };

    const spawnFood = (silent = false) => {
      const occ = new Set(snake.map(key));
      for (const f of foods) occ.add(key(f));
      if (occ.size >= cols * rows) return; // поле забито
      let p: Pt, g = 0;
      do {
        p = { x: (Math.random() * cols) | 0, y: (Math.random() * rows) | 0 };
      } while (occ.has(key(p)) && g++ < 400);
      foods.push({ ...p, born: performance.now() });
      if (!silent) {
        const c = cxy(p.x, p.y);
        sparks(c.x, c.y, [[201, 166, 107], [224, 196, 140]], 5);
      }
    };
    const fillFood = (n: number, silent = false) => {
      while (foods.length < n) spawnFood(silent);
    };

    const toIntro = () => {
      mode = "intro";
      snake = [];
      foods = [];
      ghost.fill(0);
      fx.length = 0;
      waves.length = 0;
      floats.length = 0;
      flashA = 0;
      shake = 0;
      setOver(false);
      setStarted(false);
      setScore(0);
      setPraise("");
      setHint(false);
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
      foodAcc = 0;
      tick = TICK0;
      sc = 0;
      combo = 0;
      lastEatAt = -1e9;
      stepped = false;
      justGrew = false;
      lastTail = snake.length ? { ...snake[snake.length - 1] } : null;
      ghost.fill(0);
      fx.length = 0;
      waves.length = 0;
      floats.length = 0;
      flashA = 0;
      shake = 0;
      foods = [];
      if (dieTimer) { clearTimeout(dieTimer); dieTimer = null; }
      setScore(0);
      setOver(false);
      setStarted(true);
      setPraise("");
      setHint(false);
      fillFood(START_FOOD, true);
    };
    restartRef.current = () => startCenter();

    const die = () => {
      if (mode === "dead") return;
      mode = "dead";
      deadAt = performance.now();
      lastDeadN = 0;
      deadSnake = snake.map((s) => ({ ...s }));
      shake = reduced ? 0 : 9;
      flashA = reduced ? 0 : 0.3;
      flashCol = "255,80,60";
      const h = cxy(snake[0].x, snake[0].y);
      wave(h.x, h.y, "255,90,70");
      if (sc > bestSc) {
        bestSc = sc;
        setBest(bestSc);
        try { localStorage.setItem(BEST_KEY, String(bestSc)); } catch {}
      }
      // распад — волна от головы к хвосту; оверлей после того, как всё догорит
      const wait = Math.max(700, Math.min(1400, deadSnake.length * 35 + 500));
      dieTimer = setTimeout(() => { if (!stopped) setOver(true); }, reduced ? 500 : wait);
    };

    let praiseTimer: ReturnType<typeof setTimeout> | null = null;
    const showPraise = (text: string) => {
      setPraise(text);
      if (praiseTimer) clearTimeout(praiseTimer);
      praiseTimer = setTimeout(() => { if (!stopped) setPraise(""); }, 1500);
    };

    const eatFx = (gx: number, gy: number) => {
      const c = cxy(gx, gy);
      sparks(c.x, c.y, [[201, 166, 107], [166, 255, 0]], 12, dir.x, dir.y);
      wave(c.x, c.y, "166,255,0");
      if (!reduced) {
        flashA = Math.max(flashA, 0.09);
        flashCol = "166,255,0";
        shake = Math.max(shake, 2.5);
      }
      energy = Math.min(1, energy + 0.45);
      addFloat(c.x, c.y - 8, combo > 1 ? `X${combo}` : "+1");
    };

    const stepGame = () => {
      dir = nextDir;
      const h = snake[0];
      const nx = h.x + dir.x, ny = h.y + dir.y;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return die();
      if (snake.some((s, i) => i < snake.length - 1 && s.x === nx && s.y === ny)) return die();
      snake.unshift({ x: nx, y: ny });
      stepped = true;
      const fi = foods.findIndex((f) => f.x === nx && f.y === ny);
      if (fi >= 0) {
        sc++;
        setScore(sc);
        tick = Math.max(TICK_MIN, TICK0 - sc * 0.006);
        const nowMs = performance.now();
        combo = nowMs - lastEatAt < COMBO_WINDOW ? combo + 1 : 1;
        lastEatAt = nowMs;
        eatFx(foods[fi].x, foods[fi].y);
        foods.splice(fi, 1);
        // пока съеденная гаснет — на её место сразу новая
        fillFood(Math.max(START_FOOD, foods.length + 1));
        grow += 1;
        // похвала: каждое число — своя; на HINT_AT — подсказка
        if (sc === HINT_AT) setHint(true);
        else showPraise(praiseFor(sc));
      }
      if (grow > 0) {
        grow--;
        justGrew = true;
        lastTail = { ...snake[snake.length - 1] };
      } else {
        justGrew = false;
        const tail = snake.pop();
        if (tail) {
          ghost[tail.y * cols + tail.x] = 0.45; // уголёк за хвостом
          lastTail = tail;
        }
      }
    };

    const setDir = (x: number, y: number) => {
      if (mode === "intro") { startFromRing(x, y); return; }
      if (mode === "dead") return;
      if (x === -dir.x && y === -dir.y) return;
      nextDir = { x, y };
    };
    dirRef.current = setDir;

    let raf = 0, stopped = false, last: number | null = null;

    const frame = (now: number) => {
      if (stopped) return;
      if (last == null) last = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ts = now / 1000;

      // фон — нити течения (в reduce статичен, нарисован в buildBg)
      if (!reduced) drawBg(now);
      energy = Math.max(0, energy - dt * 0.55 * energy - dt * 0.02);

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, Wc, Hc);

      // тряска поля
      if (shake > 0.3) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        shake *= 0.86;
      } else shake = 0;

      // интерполяция: доля пути между тиками
      const k = mode === "play" && stepped ? cl(acc / tick) : 1;
      // экранная позиция головы (для подсветки сетки и гало)
      let hx = -99, hy = -99;
      if (mode === "play" && snake.length > 1) {
        hx = lerp(snake[1].x, snake[0].x, k);
        hy = lerp(snake[1].y, snake[0].y, k);
      }

      // тусклая сетка точек; рядом с головой диоды подсвечиваются
      for (let gy = 0; gy < rows; gy++)
        for (let gx = 0; gx < cols; gx++) {
          const c = cxy(gx, gy);
          let a = 0.045;
          if (hx > -50) {
            const dd = Math.hypot(gx - hx, gy - hy);
            if (dd < 4) a += (1 - dd / 4) * 0.09;
          }
          sdot(c.x, c.y, 1.3, [255, 255, 255], a);
        }

      if (mode === "intro") {
        const breathe = 0.62 + 0.12 * Math.sin(ts * 2);
        for (const d of four) {
          const c = cxy(d.x, d.y);
          // лёгкий шиммер: каждый диод дышит в своей фазе
          cell(c.x, c.y, breathe + 0.06 * Math.sin(ts * 3 + d.x * 7 + d.y * 13));
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
        drawOverlays(now);
        raf = requestAnimationFrame(frame);
        return;
      }

      if (mode === "play") {
        acc += dt;
        while (acc >= tick) { acc -= tick; stepGame(); }
        foodAcc += dt;
        if (foodAcc >= FOOD_SPAWN) {
          foodAcc = 0;
          if (foods.length < MAX_FOOD) spawnFood();
        }
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

      // еда: рождается с перелётом (easeOutBack), пульсирует, вокруг —
      // вращающееся пунктирное кольцо как у бустов в понге
      for (let i = 0; i < foods.length; i++) {
        const f = foods[i];
        const fp = cxy(f.x, f.y);
        const bk = Math.min((now - f.born) / 220, 1);
        const scale = reduced ? 1 : eob(bk);
        foodDot(fp.x, fp.y, 0.6 + 0.4 * Math.sin(ts * 5 + i * 1.7), scale);
        ctx.save();
        ctx.strokeStyle = GOLD;
        ctx.globalAlpha = (0.22 + 0.14 * Math.sin(ts * 5 + i * 1.7)) * bk;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 5]);
        ctx.lineDashOffset = -now / 40;
        ctx.beginPath();
        ctx.arc(fp.x, fp.y, 7.5 * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (mode === "play") {
        // змейка скользит: каждый сегмент дотягивается до своей клетки
        const L = snake.length;
        for (let i = L - 1; i >= 0; i--) {
          const to = snake[i];
          const from = i < L - 1 ? snake[i + 1] : (justGrew ? to : (lastTail ?? to));
          const x = lerp(from.x, to.x, k);
          const y = lerp(from.y, to.y, k);
          const tt = lerp(0.45, 1.25, L > 1 ? 1 - i / (L - 1) : 1);
          const c = cxy(x, y);
          cell(c.x, c.y, tt);
        }
        // гало вокруг головы — растёт со скоростью
        if (L > 0 && !reduced) {
          const hc = cxy(hx, hy);
          const spd = cl((TICK0 - tick) / (TICK0 - TICK_MIN));
          const R = STEP * (1.6 + spd * 1.1);
          const g = ctx.createRadialGradient(hc.x, hc.y, 2, hc.x, hc.y, R);
          g.addColorStop(0, `rgba(166,255,0,${(0.10 + 0.12 * spd).toFixed(3)})`);
          g.addColorStop(1, "rgba(166,255,0,0)");
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(hc.x, hc.y, R, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
        }
      } else if (mode === "dead") {
        // волна распада: сегменты взрываются от головы к хвосту
        const deadN = reduced
          ? deadSnake.length
          : Math.min(deadSnake.length, Math.floor((now - deadAt) / 35));
        for (let i = lastDeadN; i < deadN; i++) {
          const c = cxy(deadSnake[i].x, deadSnake[i].y);
          sparks(c.x, c.y, [[255, 90, 70], [166, 255, 0]], 4);
          shake = Math.min(6, shake + 0.7);
        }
        lastDeadN = Math.max(lastDeadN, deadN);
        const L = deadSnake.length;
        for (let i = deadN; i < L; i++) {
          const tt = lerp(0.45, 1.25, L > 1 ? 1 - i / (L - 1) : 1) * 0.9;
          const c = cxy(deadSnake[i].x, deadSnake[i].y);
          cell(c.x, c.y, tt);
        }
      }

      drawOverlays(now);
      raf = requestAnimationFrame(frame);
    };

    // искры, волны, флоаты, виньетка, уголки, вспышка — поверх всего
    const drawOverlays = (now: number) => {
      const dt = 1 / 60;
      // искры: чёрточки летят по направлению, точки — россыпью, гравитация
      for (const p of fx) {
        p.life -= dt / p.max;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        p.vy = p.vy * 0.94 + 140 * dt * 0.4;
        if (p.life <= 0) continue;
        ctx.globalAlpha = cl(p.life) * 0.9;
        if (p.kind === "line") {
          ctx.strokeStyle = `rgb(${p.col[0]},${p.col[1]},${p.col[2]})`;
          ctx.lineWidth = 1.2;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.045, p.y - p.vy * 0.045);
          ctx.stroke();
        } else {
          sdot(p.x, p.y, 1.6, p.col, cl(p.life));
        }
      }
      ctx.globalAlpha = 1;
      for (let i = fx.length - 1; i >= 0; i--) if (fx[i].life <= 0) fx.splice(i, 1);

      // ударные волны
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i];
        const wk = (now - w.t0) / 450;
        if (wk >= 1) { waves.splice(i, 1); continue; }
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = `rgba(${w.col},${(0.5 * (1 - wk)).toFixed(3)})`;
        ctx.lineWidth = 2 * (1 - wk) + 0.5;
        ctx.beginPath();
        ctx.arc(w.x, w.y, eoc(wk) * STEP * 2.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
      }

      // всплывающие «+1»/«XN» — LED-точками, на языке табло
      for (let i = floats.length - 1; i >= 0; i--) {
        const f = floats[i];
        const fk = (now - f.t0) / 700;
        if (fk >= 1) { floats.splice(i, 1); continue; }
        const lay = floatLayouts.get(f.text);
        if (!lay) continue;
        const pitch = 3;
        const sx = f.x - (lay.cols * pitch) / 2;
        const sy = f.y - fk * 22 - (lay.rows * pitch) / 2;
        ctx.globalAlpha = (1 - fk) * 0.95;
        ctx.fillStyle = f.text.startsWith("X") ? GOLD : ACCENT;
        for (const d of lay.dots) {
          if (!d.lit) continue;
          ctx.beginPath();
          ctx.arc(sx + d.col * pitch, sy + d.row * pitch, pitch * 0.42, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // виньетка — глубина поля
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (vignette) { ctx.fillStyle = vignette; ctx.fillRect(0, 0, Wc, Hc); }

      // лаймовые уголки — рамка поля как в понге
      ctx.strokeStyle = "rgba(166,255,0,0.4)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      const tk = 13, m = 3;
      ctx.beginPath();
      ctx.moveTo(m, m + tk); ctx.lineTo(m, m); ctx.lineTo(m + tk, m);
      ctx.moveTo(Wc - m - tk, m); ctx.lineTo(Wc - m, m); ctx.lineTo(Wc - m, m + tk);
      ctx.moveTo(m, Hc - m - tk); ctx.lineTo(m, Hc - m); ctx.lineTo(m + tk, Hc - m);
      ctx.moveTo(Wc - m - tk, Hc - m); ctx.lineTo(Wc - m, Hc - m); ctx.lineTo(Wc - m, Hc - m - tk);
      ctx.stroke();

      // вспышка (съел/врезался) поверх всего
      if (flashA > 0.02) {
        ctx.fillStyle = `rgba(${flashCol},${(flashA * 0.6).toFixed(3)})`;
        ctx.fillRect(0, 0, Wc, Hc);
        flashA *= 0.86;
      } else flashA = 0;
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

    // Непрерывный свайп: ведёшь пальцем — змейка поворачивает на каждом
    // пройденном пороге, якорь сбрасывается. Один палец рулит без отрыва.
    const SWIPE = 20; // порог поворота, px
    let pressed = false, moved = false, ax = 0, ay = 0;
    const onPDown = (e: PointerEvent) => {
      pressed = true; moved = false; ax = e.clientX; ay = e.clientY;
      canvas.setPointerCapture?.(e.pointerId);
    };
    const onPMove = (e: PointerEvent) => {
      if (!pressed) return;
      const dx = e.clientX - ax, dy = e.clientY - ay;
      if (Math.abs(dx) < SWIPE && Math.abs(dy) < SWIPE) return;
      if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
      else setDir(0, dy > 0 ? 1 : -1);
      ax = e.clientX; ay = e.clientY; moved = true;
    };
    const onPUp = (e: PointerEvent) => {
      pressed = false;
      // короткий тап в интро — стартуем вправо
      if (!moved && mode === "intro") setDir(1, 0);
      canvas.releasePointerCapture?.(e.pointerId);
    };

    let ro: ResizeObserver | null = null;
    build();
    raf = requestAnimationFrame(frame);
    window.addEventListener("keydown", onKey);
    canvas.addEventListener("pointerdown", onPDown);
    canvas.addEventListener("pointermove", onPMove);
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
      if (praiseTimer) clearTimeout(praiseTimer);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointerdown", onPDown);
      canvas.removeEventListener("pointermove", onPMove);
      canvas.removeEventListener("pointerup", onPUp);
      ro?.disconnect();
    };
  }, []);

  return (
    <section className="relative z-[1] min-h-[calc(100svh-5rem)] bg-black flex flex-col items-center justify-start px-5 pt-8 md:pt-12 pb-6 select-none overflow-hidden">
      <style>{`@keyframes nfPraise{0%{opacity:0;transform:translateY(6px) scale(.92)}18%{opacity:1;transform:translateY(0) scale(1)}78%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-4px) scale(1)}}`}</style>

        {/* Похвала — над полем, своя на каждую съеденную */}
        <div className="h-7 mb-1.5 flex items-end justify-center w-full pointer-events-none">
          {started && !over && praise && (
            <div key={praise + score} className="animate-[nfPraise_1.5s_ease-out]">
              <LedText text={praise} className="h-[11px] md:h-[13px] w-auto" />
            </div>
          )}
        </div>
      <div className="w-full max-w-[760px] flex flex-col items-center">
        <div ref={wrapRef} className="relative w-full h-[clamp(240px,46vh,400px)] rounded-xl border border-white/10 overflow-hidden">
          {/* живой фон: течение поля, как в понге */}
          <canvas ref={bgRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden />
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

        {/* Подсказка про пасхалку — под полем, после 25 съеденных */}
        {started && !over && hint && (
          <div className="mt-3 w-full max-w-[560px] rounded-lg bg-white/[0.04] border border-[#A6FF00]/15 px-3 py-2.5 flex flex-col items-center gap-1.5 text-center">
            <LedText text="ПАСХАЛКА НА ГЛАВНОЙ" className="h-[8px] md:h-[9px] w-auto" />
            <LedText text="ЖМИ ЛОГО В ПОРЯДКЕ РАБОТЫ ЕГОРА" className="h-[6px] md:h-[7px] w-auto" />
          </div>
        )}

        {/* D-pad для телефона */}
        {started && !over && (
          <div className="md:hidden mt-5 grid grid-cols-3 gap-2 w-[190px] select-none touch-none">
            {([
              ["↑", 0, -1, "col-start-2 row-start-1"],
              ["←", -1, 0, "col-start-1 row-start-2"],
              ["↓", 0, 1, "col-start-2 row-start-2"],
              ["→", 1, 0, "col-start-3 row-start-2"],
            ] as [string, number, number, string][]).map(([g, x, y, pos]) => (
              <button
                key={g}
                type="button"
                aria-label={g}
                onPointerDown={(e) => { e.preventDefault(); dirRef.current(x, y); }}
                className={`${pos} h-[58px] rounded-xl bg-white/[0.07] active:bg-[#A6FF00]/25 text-[#A6FF00]/80 text-2xl leading-none flex items-center justify-center transition-colors`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {/* Подпись под полем */}
        {!started && !over && (
          <div className="mt-6 text-center">
            <p className="text-white/40 leading-relaxed">
              <span className="sr-only">Такой страницы нет</span>
              <LedText text="ТАКОЙ СТРАНИЦЫ НЕТ" className="h-[8px] md:h-[9px] w-auto mx-auto" />
            </p>
            <p className="mt-3 text-[#A6FF00]/70">
              <LedText text="СВАЙП ИЛИ ← → — ПОЕХАЛИ" className="h-[9px] md:h-[11px] w-auto mx-auto" />
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

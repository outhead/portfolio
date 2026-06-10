"use client";

import { useEffect, useRef, useState } from "react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";

/**
 * Сетевой ретро-пинг-понг (двое, по ссылке или сразу из кооп-пары через ?room=).
 * Вертикальная ориентация: ТЫ всегда снизу, соперник сверху (у гостя поле зеркалится).
 * Хост авторитетно считает физику и шлёт состояние через Supabase Realtime (~30 Гц);
 * гость шлёт только X своей ракетки. Перед подачей — обратный отсчёт 3-2-1.
 */
const SB_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hvkygaghhxgaolxemndr.supabase.co";
const SB_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a3lnYWdoaHhnYW9seGVtbmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDYwNjAsImV4cCI6MjA5NDg4MjA2MH0.IoRNKO3Jb51k1XA2y7-Q-PSaxpPhBj56G1SZJaKKau4";

// Канонические координаты поля (портрет). Низ = host (p1), верх = guest (p2).
const FW = 420, FH = 640;
const R = 9;                 // радиус мяча
const PW = 96, PH = 14;      // ракетка (горизонтальная)
const MARGIN = 26;
const BOTTOM_Y = FH - MARGIN - PH; // верхняя грань нижней ракетки
const TOP_Y = MARGIN;              // верхняя грань верхней ракетки
const WIN_SCORE = 7;
const BASE = 3.4;            // стартовая скорость (в ~1.5 раза медленнее прежней)
const MAXV = 9;             // потолок скорости
const ACC = 1.05;          // ускорение на каждом отскоке

type Phase = "connecting" | "waiting" | "count" | "playing" | "over";

const rndCode = () =>
  Array.from({ length: 5 }, () => "abcdefghijkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 32)]).join("");
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function PongPage() {
  const [phase, setPhase] = useState<Phase>("connecting");
  const [role, setRole] = useState<"host" | "guest">("host");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [score, setScore] = useState<[number, number]>([0, 0]); // [host, guest]
  const [winner, setWinner] = useState<0 | 1 | null>(null);
  const [count, setCount] = useState(0); // число обратного отсчёта (3..1, 0=скрыт)

  const roleRef = useRef<"host" | "guest">("host");
  const chRef = useRef<RealtimeChannel | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  type Ball = { x: number; y: number; vx: number; vy: number; last: 0 | 1 };
  type Boost = { x: number; y: number; type: "x2" | "size" };

  const px1 = useRef((FW - PW) / 2); // нижняя ракетка (host)
  const px2 = useRef((FW - PW) / 2); // верхняя ракетка (guest)
  const pw1 = useRef(PW);            // ширина нижней ракетки (буст size)
  const pw2 = useRef(PW);            // ширина верхней ракетки
  const balls = useRef<Ball[]>([{ x: FW / 2, y: FH / 2, vx: 0, vy: 0, last: 0 }]);
  const boost = useRef<Boost | null>(null);
  const x2Until = useRef(0);
  const sizeUntil = useRef<[number, number]>([0, 0]); // [p1,p2] expiry
  const nextBoostAt = useRef(0);
  const boostGoneAt = useRef(0);
  const sc = useRef<[number, number]>([0, 0]);
  const phaseRef = useRef<Phase>("connecting");
  const countRef = useRef(0);
  const myX = useRef((FW - PW) / 2);
  const winnerRef = useRef<0 | 1 | null>(null);
  // ─── визуальные эффекты (живут только на клиенте, в физику не лезут) ───
  type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number };
  const fxRef = useRef<Spark[]>([]);                                  // искры
  const trailRef = useRef<{ x: number; y: number }[][]>([]);          // шлейф мяча (по индексу)
  const lastPosRef = useRef<{ x: number; y: number; dx: number; dy: number }[]>([]); // для детекта отскоков
  const prevBoostRef = useRef<Boost | null>(null);                    // появление буста
  const flashRef = useRef(0);                                         // вспышка на гол
  const shakeRef = useRef(0);                                         // тряска поля
  const prevScoreFx = useRef<[number, number]>([0, 0]);
  const serveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const setPhaseBoth = (p: Phase) => { phaseRef.current = p; setPhase(p); };
  const setCountBoth = (c: number) => { countRef.current = c; setCount(c); };

  function serve(dir: number) {
    balls.current = [{ x: FW / 2, y: FH / 2, vx: (Math.random() * 2 - 1) * 2.2, vy: dir * BASE, last: dir > 0 ? 1 : 0 }];
    boost.current = null;
    x2Until.current = 0; sizeUntil.current = [0, 0];
    pw1.current = PW; pw2.current = PW;
    nextBoostAt.current = performance.now() + 6000 + Math.random() * 6000;
  }

  // на мобиле прячем глобальный подвал/шапку, чтобы понг влезал и был выше.
  // Плюс блокируем скролл/pull-to-refresh: палец = ракетка, страница не едет.
  useEffect(() => {
    document.body.classList.add("pong-immersive");
    const tm = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", tm, { passive: false });
    return () => {
      document.body.classList.remove("pong-immersive");
      document.removeEventListener("touchmove", tm);
    };
  }, []);

  // ─── подключение ───
  useEffect(() => {
    const sb = createClient(SB_URL, SB_KEY, { realtime: { params: { eventsPerSecond: 60 } } });
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    const sParam = params.get("s");
    let code = room || sParam || "";
    const r: "host" | "guest" = room
      ? (params.get("host") === "1" ? "host" : "guest")
      : (sParam ? "guest" : "host");
    roleRef.current = r; setRole(r);
    if (!code) code = rndCode();
    if (r === "host" && !room) setShareUrl(`${window.location.origin}/secret/pong?s=${code}`);

    const ch = sb.channel(`pong-${code}`, { config: { broadcast: { self: false }, presence: { key: r } } });
    chRef.current = ch;

    ch.on("broadcast", { event: "state" }, ({ payload }) => {
      if (roleRef.current !== "guest") return;
      const bs = payload.balls as [number, number][];
      balls.current = bs.map(([x, y]) => ({ x, y, vx: 0, vy: 0, last: 0 as const }));
      px1.current = payload.px1;
      pw1.current = payload.pw1; pw2.current = payload.pw2;
      boost.current = payload.boost || null;
      if (payload.s1 !== sc.current[0] || payload.s2 !== sc.current[1]) {
        sc.current = [payload.s1, payload.s2]; setScore([payload.s1, payload.s2]);
      }
      if (payload.phase && payload.phase !== phaseRef.current) setPhaseBoth(payload.phase);
      if (payload.count !== countRef.current) setCountBoth(payload.count);
      const w = payload.winner;
      if ((w === 0 || w === 1) && w !== winnerRef.current) { winnerRef.current = w; setWinner(w); }
    });
    ch.on("broadcast", { event: "paddle" }, ({ payload }) => {
      if (roleRef.current === "host") px2.current = payload.x;
    });
    ch.on("broadcast", { event: "rematch" }, () => { if (roleRef.current === "host") startMatch(); });
    ch.on("broadcast", { event: "hello" }, () => {
      if (roleRef.current === "host") {
        if (phaseRef.current === "waiting" || phaseRef.current === "connecting") startMatch();
        ch.send({ type: "broadcast", event: "hello", payload: {} });
      }
    });
    ch.on("presence", { event: "sync" }, () => {
      const both = Object.keys(ch.presenceState()).length >= 2;
      if (!both && phaseRef.current !== "waiting" && phaseRef.current !== "connecting") {
        // соперник ушёл
        setPhaseBoth("waiting");
      }
      if (both && roleRef.current === "host" && (phaseRef.current === "waiting" || phaseRef.current === "connecting")) startMatch();
    });

    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        ch.track({ at: Date.now() });
        setPhaseBoth("waiting");
        if (roleRef.current === "guest") {
          const hi = () => chRef.current?.send({ type: "broadcast", event: "hello", payload: {} });
          hi(); setTimeout(hi, 500); setTimeout(hi, 1400);
        }
      }
    });

    return () => {
      if (serveTimer.current) clearTimeout(serveTimer.current);
      if (countTimer.current) clearInterval(countTimer.current);
      ch.unsubscribe(); sb.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // обратный отсчёт 3-2-1 (только хост), затем подача
  function startCountdown(dir: number) {
    if (countTimer.current) clearInterval(countTimer.current);
    balls.current = [{ x: FW / 2, y: FH / 2, vx: 0, vy: 0, last: 0 }];
    boost.current = null;
    setCountBoth(3);
    setPhaseBoth("count");
    countTimer.current = setInterval(() => {
      const n = countRef.current - 1;
      if (n <= 0) {
        if (countTimer.current) clearInterval(countTimer.current);
        setCountBoth(0);
        setPhaseBoth("playing");
        serve(dir);
      } else {
        setCountBoth(n);
      }
    }, 800);
  }

  function startMatch() {
    sc.current = [0, 0]; setScore([0, 0]); winnerRef.current = null; setWinner(null);
    px1.current = (FW - PW) / 2; px2.current = (FW - PW) / 2;
    startCountdown(Math.random() < 0.5 ? 1 : -1);
  }

  // ─── игровой цикл + ввод + отрисовка ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0, lastSend = 0;
    const keys: Record<string, boolean> = {};

    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "a", "d"].includes(k)) { keys[k] = down; e.preventDefault(); }
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);

    // палец/мышь — ловим на ВСЁМ окне, чтобы можно было водить и ниже ракетки
    // (не перекрывая поле). Берём только X, маппим через прямоугольник канваса.
    const pointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      const ownPw = roleRef.current === "host" ? pw1.current : pw2.current;
      const x = ((e.clientX - rect.left) / rect.width) * FW;
      myX.current = clamp(x - ownPw / 2, 0, FW - ownPw);
    };
    window.addEventListener("pointermove", pointer);
    window.addEventListener("pointerdown", pointer);

    const drawBoost = (b: Boost, yv: (n: number) => number) => {
      const bw = 48, bh = 30, x = b.x - bw / 2, y = yv(b.y) - bh / 2;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.strokeStyle = b.type === "x2" ? "#FFD60A" : "#33C7FF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, bw, bh, 8); else ctx.rect(x, y, bw, bh);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle as string;
      ctx.font = "700 14px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(b.type === "x2" ? "x2" : "+SIZE", b.x, yv(b.y) + 1);
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // искры в ЭКРАННЫХ координатах (yv уже применён при спавне)
    const sparks = (x: number, y: number, color: string, n = 10, spread = 2.6) => {
      if (reducedMotion) return;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 0.8 + Math.random() * spread;
        fxRef.current.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, color, size: 1 + Math.random() * 2 });
      }
      if (fxRef.current.length > 220) fxRef.current.splice(0, fxRef.current.length - 220);
    };

    // короткий зигзаг-разряд от точки (экранные координаты)
    const bolt = (x: number, y: number, color: string) => {
      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.7;
      ctx.beginPath();
      let bx = x, by = y;
      ctx.moveTo(bx, by);
      const a = Math.random() * Math.PI * 2;
      const segs = 3 + Math.floor(Math.random() * 3);
      for (let s = 0; s < segs; s++) {
        bx += Math.cos(a) * (5 + Math.random() * 7) + (Math.random() - 0.5) * 8;
        by += Math.sin(a) * (5 + Math.random() * 7) + (Math.random() - 0.5) * 8;
        ctx.lineTo(bx, by);
      }
      ctx.stroke(); ctx.globalAlpha = 1;
    };

    const draw = () => {
      const mirror = roleRef.current === "guest";
      const yv = (cy: number) => (mirror ? FH - cy : cy);
      const playing = phaseRef.current === "playing";

      // гол → вспышка + тряска (и у хоста, и у гостя — по смене счёта)
      if (sc.current[0] !== prevScoreFx.current[0] || sc.current[1] !== prevScoreFx.current[1]) {
        prevScoreFx.current = [sc.current[0], sc.current[1]];
        if (!reducedMotion) { flashRef.current = 1; shakeRef.current = 7; }
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, FW, FH);
      if (shakeRef.current > 0.3) {
        ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);
        shakeRef.current *= 0.86;
      } else shakeRef.current = 0;

      ctx.fillStyle = "rgba(255,255,255,0.22)";
      for (let x = 8; x < FW; x += 30) ctx.fillRect(x, FH / 2 - 2, 18, 4);
      const host = roleRef.current === "host";
      const meX = host ? px1.current : px2.current, meW = host ? pw1.current : pw2.current;
      const opX = host ? px2.current : px1.current, opW = host ? pw2.current : pw1.current;
      ctx.fillStyle = "#A6FF00"; ctx.fillRect(meX, FH - MARGIN - PH, meW, PH);
      ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.fillRect(opX, MARGIN, opW, PH);

      // буст: при появлении — электрический треск, пока висит — пульс и редкие разряды
      const bst = boost.current;
      if (bst && !prevBoostRef.current) {
        sparks(bst.x, yv(bst.y), bst.type === "x2" ? "#FFD60A" : "#33C7FF", 18, 3.2);
      }
      prevBoostRef.current = bst;
      if (bst) {
        const c = bst.type === "x2" ? "#FFD60A" : "#33C7FF";
        const pulse = 1 + Math.sin(performance.now() / 160) * 0.5;
        ctx.strokeStyle = c; ctx.globalAlpha = 0.22 * pulse; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(bst.x, yv(bst.y), 30 + pulse * 3, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
        if (!reducedMotion && Math.random() < 0.3) {
          const ang = Math.random() * Math.PI * 2;
          bolt(bst.x + Math.cos(ang) * 26, yv(bst.y) + Math.sin(ang) * 18, c);
        }
        drawBoost(bst, yv);
      }

      // шлейф мяча
      if (playing && !reducedMotion) {
        balls.current.forEach((b, i) => {
          const tr = (trailRef.current[i] ||= []);
          tr.push({ x: b.x, y: b.y });
          if (tr.length > 9) tr.shift();
        });
        trailRef.current.length = balls.current.length;
        for (const tr of trailRef.current) {
          if (!tr) continue;
          tr.forEach((p, j) => {
            ctx.globalAlpha = (j / tr.length) * 0.22;
            ctx.fillStyle = "#fff";
            ctx.beginPath(); ctx.arc(p.x, yv(p.y), R * (0.35 + (j / tr.length) * 0.5), 0, Math.PI * 2); ctx.fill();
          });
        }
        ctx.globalAlpha = 1;
      } else if (!playing && trailRef.current.length) {
        trailRef.current = [];
      }

      // отскоки: ловим смену направления по координатам — работает и у хоста, и у гостя
      balls.current.forEach((b, i) => {
        const lp = lastPosRef.current[i];
        if (lp && playing) {
          const dx = b.x - lp.x, dy = b.y - lp.y;
          if (lp.dy !== 0 && dy !== 0 && Math.sign(dy) !== Math.sign(lp.dy) && Math.abs(lp.dy) > 1) {
            const sy = yv(b.y);
            sparks(b.x, sy, sy > FH / 2 ? "#A6FF00" : "rgba(255,255,255,0.85)", 12, 2.8);
          }
          if (lp.dx !== 0 && dx !== 0 && Math.sign(dx) !== Math.sign(lp.dx) && Math.abs(lp.dx) > 0.6) {
            sparks(b.x, yv(b.y), "rgba(255,255,255,0.5)", 6, 1.8);
          }
          lastPosRef.current[i] = { x: b.x, y: b.y, dx, dy };
        } else {
          lastPosRef.current[i] = { x: b.x, y: b.y, dx: 0, dy: 0 };
        }
      });
      lastPosRef.current.length = balls.current.length;

      // искры
      for (const p of fxRef.current) {
        p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96; p.life -= 0.035;
        if (p.life > 0) {
          ctx.globalAlpha = p.life * 0.9;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
      }
      fxRef.current = fxRef.current.filter((p) => p.life > 0);
      ctx.globalAlpha = 1;

      // мячи
      ctx.fillStyle = "#fff";
      for (const b of balls.current) { ctx.beginPath(); ctx.arc(b.x, yv(b.y), R, 0, Math.PI * 2); ctx.fill(); }

      // вспышка гола поверх всего
      if (flashRef.current > 0.02) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = `rgba(166,255,0,${(flashRef.current * 0.16).toFixed(3)})`;
        ctx.fillRect(0, 0, FW, FH);
        flashRef.current *= 0.88;
      } else flashRef.current = 0;
    };

    const activate = (type: "x2" | "size", owner: 0 | 1) => {
      const now = performance.now();
      if (type === "x2") {
        const cur = balls.current.length;
        const add = Math.min(cur, 4 - cur);
        for (let i = 0; i < add; i++) {
          const s = balls.current[i % cur];
          balls.current.push({ x: s.x, y: s.y, vx: -(s.vx || 2), vy: s.vy, last: s.last });
        }
        x2Until.current = now + 10000;
      } else {
        if (owner === 0) { pw1.current = PW * 1.5; sizeUntil.current[0] = now + 10000; }
        else { pw2.current = PW * 1.5; sizeUntil.current[1] = now + 10000; }
      }
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const host = roleRef.current === "host";
      const now = performance.now();

      // ввод — своя ракетка по X (с учётом текущей ширины)
      const ownRef = host ? px1 : px2;
      const ownPw = host ? pw1.current : pw2.current;
      const speed = 9;
      let me = ownRef.current;
      if (keys["arrowleft"] || keys["a"]) me -= speed;
      if (keys["arrowright"] || keys["d"]) me += speed;
      if (Math.abs(myX.current - ownRef.current) > 0.5) me = myX.current;
      me = clamp(me, 0, FW - ownPw);
      ownRef.current = me; myX.current = me;

      if (host && phaseRef.current === "playing") {
        // истечение бустов
        if (x2Until.current && now > x2Until.current && balls.current.length > 1) { balls.current = [balls.current[0]]; x2Until.current = 0; }
        if (sizeUntil.current[0] && now > sizeUntil.current[0]) { pw1.current = PW; sizeUntil.current[0] = 0; }
        if (sizeUntil.current[1] && now > sizeUntil.current[1]) { pw2.current = PW; sizeUntil.current[1] = 0; }
        // спавн/деспавн буста
        if (!boost.current && now > nextBoostAt.current) {
          boost.current = { x: 60 + Math.random() * (FW - 120), y: FH * 0.32 + Math.random() * FH * 0.36, type: Math.random() < 0.5 ? "x2" : "size" };
          boostGoneAt.current = now + 9000;
        }
        if (boost.current && now > boostGoneAt.current) { boost.current = null; nextBoostAt.current = now + 8000 + Math.random() * 6000; }

        const W1 = pw1.current, W2 = pw2.current;
        for (const b of balls.current) {
          const oldY = b.y;
          b.x += b.vx; b.y += b.vy;
          if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); }
          if (b.x > FW - R) { b.x = FW - R; b.vx = -Math.abs(b.vx); }
          // нижняя ракетка (p1) — свёрнутая проверка пересечения плоскости
          if (b.vy > 0 && oldY + R <= BOTTOM_Y + 2 && b.y + R >= BOTTOM_Y &&
              b.x >= px1.current - R && b.x <= px1.current + W1 + R) {
            b.y = BOTTOM_Y - R; b.vy = -Math.abs(b.vy) * ACC;
            b.vx += ((b.x - (px1.current + W1 / 2)) / (W1 / 2)) * 2.6; b.last = 0;
          }
          // верхняя ракетка (p2)
          else if (b.vy < 0 && oldY - R >= TOP_Y + PH - 2 && b.y - R <= TOP_Y + PH &&
              b.x >= px2.current - R && b.x <= px2.current + W2 + R) {
            b.y = TOP_Y + PH + R; b.vy = Math.abs(b.vy) * ACC;
            b.vx += ((b.x - (px2.current + W2 / 2)) / (W2 / 2)) * 2.6; b.last = 1;
          }
          b.vy = clamp(b.vy, -MAXV, MAXV); b.vx = clamp(b.vx, -MAXV, MAXV);
          // сбор буста
          if (boost.current && Math.hypot(b.x - boost.current.x, b.y - boost.current.y) < 26) {
            activate(boost.current.type, b.last); boost.current = null;
            nextBoostAt.current = now + 8000 + Math.random() * 6000;
          }
        }
        // голы — убираем вылетевшие мячи
        let scored = false;
        balls.current = balls.current.filter((b) => {
          if (b.y > FH + R) { sc.current[1]++; scored = true; return false; }
          if (b.y < -R) { sc.current[0]++; scored = true; return false; }
          return true;
        });
        if (scored) {
          setScore([sc.current[0], sc.current[1]]);
          if (sc.current[0] >= WIN_SCORE || sc.current[1] >= WIN_SCORE) {
            const w = sc.current[0] > sc.current[1] ? 0 : 1;
            winnerRef.current = w; setWinner(w); setPhaseBoth("over");
            balls.current = []; boost.current = null;
          } else if (balls.current.length === 0) {
            startCountdown(Math.random() < 0.5 ? 1 : -1);
          }
        }
      }

      // сеть ~50 Гц для отзывчивости
      const ch = chRef.current;
      if (ch && t - lastSend > 20) {
        lastSend = t;
        if (host) {
          ch.send({ type: "broadcast", event: "state", payload: {
            balls: balls.current.map((b) => [Math.round(b.x), Math.round(b.y)]),
            px1: px1.current, pw1: pw1.current, pw2: pw2.current,
            boost: boost.current ? { x: Math.round(boost.current.x), y: Math.round(boost.current.y), type: boost.current.type } : null,
            s1: sc.current[0], s2: sc.current[1], phase: phaseRef.current, count: countRef.current,
            winner: phaseRef.current === "over" ? (sc.current[0] > sc.current[1] ? 0 : 1) : null,
          }});
        } else {
          ch.send({ type: "broadcast", event: "paddle", payload: { x: px2.current } });
        }
      }
      draw();
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku);
      window.removeEventListener("pointermove", pointer);
      window.removeEventListener("pointerdown", pointer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copy() {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ }
  }
  function rematch() {
    if (roleRef.current === "host") startMatch();
    else chRef.current?.send({ type: "broadcast", event: "rematch", payload: {} });
  }

  const mine = role === "host" ? score[0] : score[1];
  const theirs = role === "host" ? score[1] : score[0];
  const iWon = winner === (role === "host" ? 0 : 1);

  return (
    <main className="pong-page relative bg-black text-white overflow-hidden flex flex-col items-center px-4 pt-[60px] sm:pt-[68px] pb-4" style={{ minHeight: "100dvh" }}>
      <div className="relative z-[1] w-full max-w-[440px] mx-auto flex flex-col items-center text-center">
        <p className="font-p95 text-[11px] sm:text-[12px] tracking-[0.25em] uppercase text-white/40 mb-1.5">Пинг-понг · вдвоём</p>
        <div className="flex items-center justify-center gap-2.5 sm:gap-5 mb-2 font-p95 tabular-nums" style={{ fontSize: "clamp(20px,5vw,30px)" }}>
          <span className="text-white/40 text-[10px] sm:text-xs uppercase tracking-[0.12em]">соперник</span>
          <span className="text-white/80">{theirs}</span>
          <span className="text-white/20">:</span>
          <span className="text-[#A6FF00]">{mine}</span>
          <span className="text-white/40 text-[10px] sm:text-xs uppercase tracking-[0.12em]">ты</span>
        </div>

        {/* высотная посадка — канвас всегда влезает по вертикали и центрирован */}
        <div className="relative mx-auto" style={{ height: "min(62dvh, 600px)", aspectRatio: `${FW}/${FH}` }}>
          <canvas ref={canvasRef} width={FW} height={FH}
            className="block w-full h-full rounded-lg border border-white/10 touch-none select-none"
            style={{ background: "#000" }} />

          {count > 0 && phase === "count" ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="font-p95 text-[#A6FF00]" style={{ fontSize: "clamp(64px,18vw,120px)" }}>{count}</span>
            </div>
          ) : null}

          {phase !== "playing" && phase !== "count" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-lg px-6 text-center">
              {phase === "connecting" ? <p className="text-white/60 text-sm">Подключаюсь…</p> : null}

              {phase === "waiting" ? (
                role === "host" ? (
                  shareUrl ? (
                    <>
                      <p className="text-[15px] text-white/80 mb-1">Жду соперника</p>
                      <p className="text-[13px] text-white/45 mb-5 max-w-xs">Кинь ссылку другу — игра начнётся, когда он откроет.</p>
                      <button type="button" onClick={copy}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[13px] tracking-[0.1em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors">
                        <span className="leading-none translate-y-[1px]">{copied ? "скопировано" : "копировать ссылку"}</span>
                      </button>
                    </>
                  ) : (
                    <p className="text-white/70 text-sm">Жду, пока напарник откроет пинг-понг…</p>
                  )
                ) : (
                  <p className="text-white/70 text-sm">Готов. Начинаем…</p>
                )
              ) : null}

              {phase === "over" ? (
                <>
                  <p className="font-p95 uppercase tracking-tight text-[#A6FF00] mb-3" style={{ fontSize: "clamp(28px,7vw,48px)" }}>
                    {iWon ? "Ты выиграл" : "Ты проиграл"}
                  </p>
                  <button type="button" onClick={rematch}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[13px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors">
                    <span className="leading-none translate-y-[1px]">{role === "host" ? "Реванш" : "Запросить реванш"}</span>
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        <p className="hidden sm:block mt-3 text-[12px] text-white/40 max-w-xs">Двигай ракетку (внизу) пальцем или ←→. Мяч летит — отбивай. До {WIN_SCORE}.</p>
      </div>
    </main>
  );
}

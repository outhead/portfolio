"use client";

import LedText from "@/components/LedText";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { connectP2P, type P2PHandle } from "./rtc";
import { connectRelay, type Relay } from "./pongRelay";
import MagneticWaves from "./MagneticWaves";
import { FW, FH, FIELD_STRENGTH, FIELD_FADE_PX, flowAngle } from "./field";

/**
 * Сетевой ретро-пинг-понг (двое, по ссылке или сразу из кооп-пары через ?room=).
 * Вертикальная ориентация: ТЫ всегда снизу, соперник сверху (у гостя поле зеркалится).
 * Хост авторитетно считает физику и шлёт состояние через Supabase Realtime (~30 Гц);
 * гость шлёт только X своей ракетки. Перед подачей — обратный отсчёт 3-2-1.
 */
// Канонические координаты поля: FW/FH — в field.ts (общие с фоном и силой поля).
// Низ = host (p1), верх = guest (p2).
const R = 9;                 // радиус мяча
const PW = 96, PH = 14;      // ракетка (горизонтальная)
const MARGIN = 26;
const BOTTOM_Y = FH - MARGIN - PH; // верхняя грань нижней ракетки
const TOP_Y = MARGIN;              // верхняя грань верхней ракетки
const WIN_SCORE = 3;
const BASE = 3.4;            // стартовая скорость (в ~1.5 раза медленнее прежней)
const MAXV = 8;              // потолок скорости (px за шаг 60 Гц)
const ACC = 1.04;            // ускорение на каждом отскоке

type Phase = "connecting" | "waiting" | "count" | "playing" | "over";
// Режимы: classic — обычный понг (по умолчанию), field — «магнитное поле»:
// живой фон-течение, которое реально сносит мяч (силу считает только хост).
type Mode = "classic" | "field";

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
  const [mode, setMode] = useState<Mode>("classic");
  const modeRef = useRef<Mode>("classic");

  const roleRef = useRef<"host" | "guest">("host");
  const chRef = useRef<Relay | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // P2P: основной транспорт — WebRTC DataChannel; Supabase Realtime остаётся фолбэком
  const p2pRef = useRef<P2PHandle | null>(null);
  const useP2P = useRef(false);
  const [transport, setTransport] = useState<"relay" | "p2p">("relay");
  const relayPeers = useRef(false); // на релее видно соперника (count>=2)
  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null); // дебаунс ухода в «ожидание»

  type Ball = { x: number; y: number; vx: number; vy: number; last: 0 | 1 };
  type Boost = { x: number; y: number; type: "x2" | "size" | "stick"; t?: number }; // t: остаток жизни 0..1 (для таймер-дуги у гостя)

  const px1 = useRef((FW - PW) / 2); // нижняя ракетка (host)
  const px2 = useRef((FW - PW) / 2); // верхняя ракетка (guest)
  const pw1 = useRef(PW);            // ширина нижней ракетки (буст size)
  const pw2 = useRef(PW);            // ширина верхней ракетки
  const balls = useRef<Ball[]>([{ x: FW / 2, y: FH / 2, vx: 0, vy: 0, last: 0 }]);
  const boost = useRef<Boost | null>(null);
  const sizeUntil = useRef<[number, number]>([0, 0]); // [p1,p2] expiry
  const nextBoostAt = useRef(0);
  const boostGoneAt = useRef(0);
  const sc = useRef<[number, number]>([0, 0]);
  const phaseRef = useRef<Phase>("connecting");
  const countRef = useRef(0);
  const myX = useRef((FW - PW) / 2);
  const winnerRef = useRef<0 | 1 | null>(null);
  // ─── сглаживание сети ───
  const px2Vel = useRef(0);            // скорость ракетки гостя (px/кадр), приходит в пакете
  const px2At = useRef(0);             // когда пришёл последний пакет ракетки
  const px2Eff = useRef((FW - PW) / 2); // экстраполированная позиция ракетки гостя (для физики и отрисовки)
  const prevMyX = useRef((FW - PW) / 2);
  const myVel = useRef(0);             // своя скорость ракетки (сглаженная) — шлём хосту
  // ─── визуальные эффекты (живут только на клиенте, в физику не лезут) ───
  type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; kind: "dot" | "line" };
  const fxRef = useRef<Spark[]>([]);                                  // искры
  const paddleHitAt = useRef<[number, number]>([0, 0]);               // squash ракеток, канонически [p1, p2]
  const floats = useRef<{ x: number; y: number; t0: number; text: string; color: string }[]>([]); // всплывающие «+1»
  const boostBornAt = useRef(0);                                      // для scale-in буста
  const trailRef = useRef<{ x: number; y: number }[][]>([]);          // шлейф мяча (по индексу)
  const prevBoostRef = useRef<Boost | null>(null);                    // появление буста
  const flashRef = useRef(0);                                         // вспышка на гол
  const shakeRef = useRef(0);                                         // тряска поля
  const prevScoreFx = useRef<[number, number]>([0, 0]);
  // ─── буст-липучка ───
  const stickArmed = useRef<[number, number]>([0, 0]);  // expiry «взведённости» по игрокам [host, guest]
  const stuck = useRef<{ b: Ball; owner: 0 | 1; off: number; until: number; since: number; spd: number } | null>(null); // у хоста (spd — скорость на входе, с ней же отлипнет)
  const guestDown = useRef(false); // палец гостя на экране (из paddle-пакетов) — для запуска липучки
  const stuckNet = useRef<{ i: number; owner: 0 | 1; off: number } | null>(null);           // у гостя, из пакетов
  const onReleaseRef = useRef<(owner: 0 | 1) => void>(() => {});      // запуск прилипшего мяча
  const applyHitRef = useRef<(p: Record<string, unknown>) => void>(() => {}); // лаг-компенсация отскока гостя
  const lastClaim = useRef(0);
  const countTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  // ─── выбор хоста: если оба зашли по одной ?s=-ссылке (два гостя), через 4с
  // без state-пакетов и без живого хоста гость с бОльшим id берёт роль хоста ───
  const myId = useRef(Math.random().toString(36).slice(2));
  const lastStateAt = useRef(0);
  const hostSeenAt = useRef(0);
  const peerGuestId = useRef<string | null>(null);
  // P2P бывает односторонним (open у одного, у другого нет) — тогда каждый шлёт
  // в свой транспорт и оба молчат. Лечим: пакеты дублируются в релей (реже),
  // а relay-приём включается, как только P2P молчит дольше 700мс.
  const lastP2pAt = useRef(0);

  const setPhaseBoth = (p: Phase) => { phaseRef.current = p; setPhase(p); };
  const setCountBoth = (c: number) => { countRef.current = c; setCount(c); };
  const setModeBoth = (m: Mode) => { modeRef.current = m; setMode(m); };

  function serve(dir: number) {
    balls.current = [{ x: FW / 2, y: FH / 2, vx: (Math.random() * 2 - 1) * 2.2, vy: dir * BASE, last: dir > 0 ? 1 : 0 }];
    boost.current = null;
    stuck.current = null; stickArmed.current = [0, 0];
    sizeUntil.current = [0, 0];
    pw1.current = PW; pw2.current = PW;
    nextBoostAt.current = performance.now() + 2500 + Math.random() * 3000;
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
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    const sParam = params.get("s");
    let code = room || sParam || "";
    const r: "host" | "guest" = room
      ? (params.get("host") === "1" ? "host" : "guest")
      : (sParam ? "guest" : "host");
    roleRef.current = r; setRole(r);
    // пресет режима из URL; дальше режимом владеет хост (тумблер + state-пакеты)
    if (params.get("mode") === "field") setModeBoth("field");
    if (!code) code = rndCode();
    if (r === "host" && !room) setShareUrl(`${window.location.origin}/secret/pong?s=${code}`);

    // Запасной транспорт — Cloudflare WS-релей (свой домен, доступен в РФ без VPN).
    // Основной — P2P ниже; релей используется, пока/если P2P не собрался.
    const ch = connectRelay(code);
    chRef.current = ch;

    // ─── общие обработчики для обоих транспортов (P2P и Realtime) ───
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const applyState = (payload: any) => {
      lastStateAt.current = performance.now();
      if (roleRef.current !== "guest") return;
      // Мяч у гостя живёт локально (dead reckoning по vx/vy), пакет хоста — авторитетная
      // коррекция: близко — мягко подтягиваем (без дёрганья), далеко — снапаем.
      const bs = payload.balls as [number, number, number, number][];
      const prev = balls.current;
      balls.current = bs.map(([x, y, vx, vy], i) => {
        const loc = prev[i];
        if (loc && Math.hypot(x - loc.x, y - loc.y) < 48) {
          return { x: loc.x + (x - loc.x) * 0.35, y: loc.y + (y - loc.y) * 0.35, vx, vy, last: 0 as const };
        }
        return { x, y, vx, vy, last: 0 as const };
      });
      px1.current = payload.px1;
      pw1.current = payload.pw1; pw2.current = payload.pw2;
      boost.current = payload.boost || null;
      stuckNet.current = payload.stuck || null;
      if (payload.s1 !== sc.current[0] || payload.s2 !== sc.current[1]) {
        sc.current = [payload.s1, payload.s2]; setScore([payload.s1, payload.s2]);
      }
      if (payload.phase && payload.phase !== phaseRef.current) setPhaseBoth(payload.phase);
      if (payload.count !== countRef.current) setCountBoth(payload.count);
      // режим задаёт хост; гостю поле — только картинка (физика всё равно приходит)
      const md: Mode = payload.mode === 1 ? "field" : "classic";
      if (md !== modeRef.current) setModeBoth(md);
      const w = payload.winner;
      if ((w === 0 || w === 1) && w !== winnerRef.current) { winnerRef.current = w; setWinner(w); }
    };
    const applyPaddle = (payload: any) => {
      if (roleRef.current !== "host") return;
      px2.current = payload.x;
      px2Vel.current = typeof payload.v === "number" ? payload.v : 0;
      guestDown.current = payload.d === 1;
      px2At.current = performance.now();
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const onHelloMsg = () => {
      if (roleRef.current === "host" &&
          (phaseRef.current === "waiting" || phaseRef.current === "connecting")) resumeOrStart();
    };

    const p2pFresh = () => useP2P.current && performance.now() - lastP2pAt.current < 700;
    ch.on("state", (payload) => { if (p2pFresh()) return; applyState(payload); });
    ch.on("paddle", (payload) => { if (p2pFresh()) return; applyPaddle(payload); });
    ch.on("rematch", () => { if (roleRef.current === "host") startMatch(); });
    ch.on("hit", (payload) => { applyHitRef.current(payload as Record<string, unknown>); });
    ch.on("release", () => { onReleaseRef.current(1); });
    const handleHello = (payload: unknown) => {
      const p = (payload ?? {}) as { id?: string; h?: number };
      if (p.h === 1) hostSeenAt.current = performance.now();
      else if (p.id) peerGuestId.current = p.id;
      if (roleRef.current === "host") {
        onHelloMsg();
        chRef.current?.send("hello", { id: myId.current, h: 1 });
      }
    };
    ch.on("hello", handleHello);

    // Связь есть, если жив P2P ИЛИ на релее виден соперник. «Ожидание» показываем
    // только когда нет НИ того, ни другого, и с дебаунсом 3с — иначе мобильные
    // реконнекты мигали надписью «Готов, начинаем» прямо во время игры.
    const cancelWaiting = () => { if (waitTimer.current) { clearTimeout(waitTimer.current); waitTimer.current = null; } };
    const scheduleWaiting = () => {
      if (waitTimer.current) return;
      waitTimer.current = setTimeout(() => {
        waitTimer.current = null;
        if (!useP2P.current && !relayPeers.current &&
            (phaseRef.current === "playing" || phaseRef.current === "count")) setPhaseBoth("waiting");
      }, 3000);
    };
    const evalConn = () => {
      if (useP2P.current || relayPeers.current) {
        cancelWaiting();
        if (roleRef.current === "host" && (phaseRef.current === "waiting" || phaseRef.current === "connecting")) resumeOrStart();
      } else {
        scheduleWaiting();
      }
    };

    // ─── P2P поверх: если DataChannel собрался — он становится основным транспортом ───
    p2pRef.current = connectP2P({
      room: code,
      role: r,
      onMessage: (m) => {
        if (m.event === "state") { lastP2pAt.current = performance.now(); applyState(m.payload); }
        else if (m.event === "paddle") { lastP2pAt.current = performance.now(); applyPaddle(m.payload); }
        else if (m.event === "hello") handleHello(m.payload);
        else if (m.event === "rematch") { if (roleRef.current === "host") startMatch(); }
        else if (m.event === "hit") applyHitRef.current(m.payload);
        else if (m.event === "release") onReleaseRef.current(1);
      },
      onOpen: () => {
        useP2P.current = true;
        setTransport("p2p");
        if (roleRef.current === "guest") p2pRef.current?.sendCtl({ event: "hello", payload: { id: myId.current } });
        evalConn();
      },
      onClose: () => {
        // P2P отвалился — НЕ роняем игру, если релей ещё держит соперника
        useP2P.current = false;
        setTransport("relay");
        evalConn();
      },
    });

    // Если за 2.5с вообще ничего не поднялось — выходим из «Подключаюсь…» в ожидание
    const connT = setTimeout(() => {
      if (phaseRef.current === "connecting") setPhaseBoth("waiting");
    }, 2500);

    ch.onPeers((count) => {
      relayPeers.current = count >= 2;
      evalConn();
    });

    // Тупик «двух гостей»: зондируем hello; если 4с нет ни state-пакетов,
    // ни ответа хоста (h:1), и наш id больше id второго гостя — становимся хостом.
    lastStateAt.current = performance.now();
    hostSeenAt.current = performance.now();
    const electT = setInterval(() => {
      if (roleRef.current !== "guest") return;
      if (!(useP2P.current || relayPeers.current)) return;
      if (phaseRef.current !== "waiting" && phaseRef.current !== "connecting") return;
      chRef.current?.send("hello", { id: myId.current });
      const now = performance.now();
      if (
        now - lastStateAt.current > 4000 &&
        now - hostSeenAt.current > 4000 &&
        peerGuestId.current &&
        myId.current > peerGuestId.current
      ) {
        roleRef.current = "host";
        setRole("host");
        chRef.current?.send("hello", { id: myId.current, h: 1 });
        resumeOrStart();
      }
    }, 1500);

    ch.onOpen(() => {
      // на (ре)коннекте релея активную игру НЕ сбрасываем; ожидание — только на старте
      if (phaseRef.current === "connecting") setPhaseBoth("waiting");
      if (roleRef.current === "guest") {
        const hi = () => chRef.current?.send("hello", { id: myId.current });
        hi(); setTimeout(hi, 500); setTimeout(hi, 1400);
      }
    });

    return () => {
      clearTimeout(connT);
      clearInterval(electT);
      cancelWaiting();
      if (countTimer.current) clearInterval(countTimer.current);
      p2pRef.current?.close(); p2pRef.current = null;
      ch.close();
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

  function startMatch(keepScore = false) {
    if (!keepScore) { sc.current = [0, 0]; setScore([0, 0]); }
    winnerRef.current = null; setWinner(null);
    px1.current = (FW - PW) / 2; px2.current = (FW - PW) / 2;
    startCountdown(Math.random() < 0.5 ? 1 : -1);
  }
  // реконнект/перезаход посреди матча продолжает игру со счётом, а не обнуляет его
  function resumeOrStart() {
    startMatch(sc.current[0] + sc.current[1] > 0 && winnerRef.current === null);
  }

  // ─── игровой цикл + ввод + отрисовка ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    // ретина: рендерим в физические пиксели, иначе на телефонах канвас мыльный
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = FW * dpr; canvas.height = FH * dpr;
    let raf = 0, lastSend = 0, lastMirror = 0;
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
    let pressed = false; // палец/кнопка сейчас зажаты (для липучки)
    const down = (e: PointerEvent) => { pressed = true; pointer(e); };
    window.addEventListener("pointermove", pointer);
    window.addEventListener("pointerdown", down);
    // отпустил палец — запуск прилипшего мяча (хост сразу, гость событием хосту)
    const up = () => {
      pressed = false;
      if (roleRef.current === "host") {
        if (stuck.current?.owner === 0) onReleaseRef.current(0);
      } else if (useP2P.current) {
        p2pRef.current?.sendCtl({ event: "release", payload: {} });
      } else {
        chRef.current?.send("release", {});
      }
    };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    // виньетка поля — кэшируем градиент один раз
    const vignette = ctx.createRadialGradient(FW / 2, FH / 2, FH * 0.3, FW / 2, FH / 2, FH * 0.78);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.42)");

    const capsule = (x: number, y: number, w: number, h: number) => {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, h / 2); else ctx.rect(x, y, w, h);
    };

    // иконки бустов — рисуем руками, без текста
    const boostIcon = (t: "x2" | "size" | "stick", x: number, y: number, c: string) => {
      ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.lineCap = "round";
      if (t === "x2") {
        ctx.beginPath(); ctx.arc(x - 5, y, 3.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 5, y, 3.6, 0, Math.PI * 2); ctx.fill();
      } else if (t === "size") {
        ctx.beginPath();
        ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y);
        ctx.moveTo(x - 9, y); ctx.lineTo(x - 5, y - 4);
        ctx.moveTo(x - 9, y); ctx.lineTo(x - 5, y + 4);
        ctx.moveTo(x + 9, y); ctx.lineTo(x + 5, y - 4);
        ctx.moveTo(x + 9, y); ctx.lineTo(x + 5, y + 4);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y - 1, 6, Math.PI, 0, false);
        ctx.moveTo(x - 6, y - 1); ctx.lineTo(x - 6, y + 4);
        ctx.moveTo(x + 6, y - 1); ctx.lineTo(x + 6, y + 4);
        ctx.stroke();
        ctx.fillRect(x - 7.6, y + 4, 3.2, 3); ctx.fillRect(x + 4.4, y + 4, 3.2, 3);
      }
    };

    const eob = (t: number) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2); // easeOutBack

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // искры в ЭКРАННЫХ координатах (yv уже применён при спавне).
    // dx/dy задают направление — летят конусом от удара, а не во все стороны;
    // смесь чёрточек-спидлайнов и точек + лёгкая гравитация
    const sparks = (x: number, y: number, color: string, n = 10, spread = 2.6, dx = 0, dy = 0) => {
      if (reducedMotion) return;
      const hasDir = dx !== 0 || dy !== 0;
      const baseA = Math.atan2(dy, dx);
      for (let i = 0; i < n; i++) {
        const a = hasDir ? baseA + (Math.random() - 0.5) * 1.7 : Math.random() * Math.PI * 2;
        const v = (hasDir ? 1.4 : 0.8) + Math.random() * spread;
        fxRef.current.push({
          x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, color,
          size: 1 + Math.random() * 2, kind: Math.random() < 0.55 ? "line" : "dot",
        });
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
      const nowMs = performance.now();
      const host = roleRef.current === "host";

      // гол → вспышка + тряска + всплывающее «+1» у ворот
      if (sc.current[0] !== prevScoreFx.current[0] || sc.current[1] !== prevScoreFx.current[1]) {
        const mineIdx = host ? 0 : 1;
        const gained = sc.current[0] > prevScoreFx.current[0] ? 0 : 1;
        if (!reducedMotion) {
          flashRef.current = 1; shakeRef.current = 7;
          floats.current.push({
            x: FW / 2,
            y: gained === mineIdx ? 64 : FH - 64, // мой балл — у ворот соперника
            t0: nowMs,
            text: "+1",
            color: gained === mineIdx ? "#A6FF00" : "rgba(255,255,255,0.85)",
          });
        }
        prevScoreFx.current = [sc.current[0], sc.current[1]];
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // в режиме поля канвас полупрозрачный — сквозь него читаются волны фона
      if (modeRef.current === "field") {
        ctx.clearRect(0, 0, FW, FH);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
      } else {
        ctx.fillStyle = "#000";
      }
      ctx.fillRect(0, 0, FW, FH);
      if (shakeRef.current > 0.3) {
        ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);
        shakeRef.current *= 0.86;
      } else shakeRef.current = 0;

      // сетка точек — та же, что в фоне сайта
      ctx.fillStyle = "rgba(255,255,255,0.035)";
      for (let gx = 11; gx < FW; gx += 22)
        for (let gy = 11; gy < FH; gy += 22) ctx.fillRect(gx, gy, 1.4, 1.4);

      // центральная линия — точки, затухающие к краям
      ctx.fillStyle = "#fff";
      for (let x = 14; x < FW - 8; x += 22) {
        const k = 1 - Math.abs(x - FW / 2) / (FW / 2);
        ctx.globalAlpha = 0.07 + 0.2 * k;
        ctx.beginPath(); ctx.arc(x, FH / 2, 1.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // виньетка — глубина поля
      ctx.fillStyle = vignette; ctx.fillRect(0, 0, FW, FH);

      // лаймовые уголки вместо сплошной рамки
      ctx.strokeStyle = "rgba(166,255,0,0.45)"; ctx.lineWidth = 2; ctx.lineCap = "round";
      const tick = 13, m = 3;
      ctx.beginPath();
      ctx.moveTo(m, m + tick); ctx.lineTo(m, m); ctx.lineTo(m + tick, m);
      ctx.moveTo(FW - m - tick, m); ctx.lineTo(FW - m, m); ctx.lineTo(FW - m, m + tick);
      ctx.moveTo(m, FH - m - tick); ctx.lineTo(m, FH - m); ctx.lineTo(m + tick, FH - m);
      ctx.moveTo(FW - m - tick, FH - m); ctx.lineTo(FW - m, FH - m); ctx.lineTo(FW - m, FH - m - tick);
      ctx.stroke();

      // ракетки-капсулы: своя — лайм с градиентом и свечением, squash при ударе
      const meX = host ? px1.current : px2.current, meW = host ? pw1.current : pw2.current;
      const opX = host ? px2Eff.current : px1.current, opW = host ? pw2.current : pw1.current;
      const meHit = Math.max(0, 1 - (nowMs - paddleHitAt.current[host ? 0 : 1]) / 130);
      const opHit = Math.max(0, 1 - (nowMs - paddleHitAt.current[host ? 1 : 0]) / 130);
      const paddle = (x: number, w: number, top: boolean, own: boolean, hit: number) => {
        const sw = w * (1 + 0.12 * hit), sh = PH * (1 - 0.18 * hit);
        const px = x - (sw - w) / 2;
        const py = (top ? MARGIN : FH - MARGIN - PH) + (PH - sh) / 2;
        if (own) {
          const g = ctx.createLinearGradient(px, 0, px + sw, 0);
          g.addColorStop(0, "#8FE000"); g.addColorStop(0.5, "#C6FF4D"); g.addColorStop(1, "#8FE000");
          ctx.shadowColor = "rgba(166,255,0,0.55)"; ctx.shadowBlur = 12;
          ctx.fillStyle = g;
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.55)";
        }
        capsule(px, py, sw, sh); ctx.fill();
        ctx.shadowBlur = 0;
        if (hit > 0) {
          ctx.globalAlpha = 0.35 * hit; ctx.fillStyle = "#fff";
          capsule(px, py, sw, sh); ctx.fill(); ctx.globalAlpha = 1;
        }
      };
      paddle(meX, meW, false, true, meHit);
      paddle(opX, opW, true, false, opHit);

      // буст-чип: иконка в круге, вращающееся пунктирное кольцо, таймер-дуга,
      // появление со scale-перелётом и электрическим треском
      const bst = boost.current;
      const boostColor = (t: "x2" | "size" | "stick") => t === "x2" ? "#FFD60A" : t === "size" ? "#33C7FF" : "#FF6EC7";
      if (bst && !prevBoostRef.current) {
        boostBornAt.current = nowMs;
        sparks(bst.x, yv(bst.y), boostColor(bst.type), 18, 3.2);
      }
      prevBoostRef.current = bst;
      if (bst) {
        const c = boostColor(bst.type);
        const bx = bst.x, by = yv(bst.y);
        const k = Math.min((nowMs - boostBornAt.current) / 220, 1);
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(eob(k), eob(k));
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([3, 7]); ctx.lineDashOffset = -nowMs / 30; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.45;
        ctx.beginPath(); ctx.arc(0, 0, 27, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        // сколько бусту осталось висеть
        const tt = host
          ? clamp((boostGoneAt.current - nowMs) / 9000, 0, 1)
          : clamp(bst.t ?? 1, 0, 1);
        ctx.globalAlpha = 0.9; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 0, 23, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * tt); ctx.stroke();
        ctx.globalAlpha = 1;
        boostIcon(bst.type, 0, 0, c);
        ctx.restore();
        if (!reducedMotion && Math.random() < 0.25) {
          const ang = Math.random() * Math.PI * 2;
          bolt(bx + Math.cos(ang) * 27, by + Math.sin(ang) * 20, c);
        }
      }

      // шлейф мяча — сплошная лента, на скорости вытягивается и уходит в лайм
      if (playing && !reducedMotion) {
        balls.current.forEach((b, i) => {
          const tr = (trailRef.current[i] ||= []);
          tr.push({ x: b.x, y: b.y });
          if (tr.length > 10) tr.shift();
        });
        trailRef.current.length = balls.current.length;
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        balls.current.forEach((b, i) => {
          const tr = trailRef.current[i];
          if (!tr || tr.length < 2) return;
          const sf = clamp(Math.max(Math.abs(b.vx), Math.abs(b.vy)) / MAXV, 0, 1);
          const mix = clamp((sf - 0.4) / 0.6, 0, 1); // 0=белый, 1=лайм
          const cr = Math.round(255 - (255 - 166) * mix);
          const cb = Math.round(255 - 255 * mix);
          for (let j = 1; j < tr.length; j++) {
            const k = j / tr.length;
            ctx.globalAlpha = k * (0.1 + 0.25 * sf);
            ctx.strokeStyle = `rgb(${cr},255,${cb})`;
            ctx.lineWidth = R * 1.7 * k;
            ctx.beginPath();
            ctx.moveTo(tr[j - 1].x, yv(tr[j - 1].y));
            ctx.lineTo(tr[j].x, yv(tr[j].y));
            ctx.stroke();
          }
        });
        ctx.globalAlpha = 1;
      } else if (!playing && trailRef.current.length) {
        trailRef.current = [];
      }

      // прилипший мяч — розовое пульсирующее кольцо
      const stBall = roleRef.current === "host"
        ? stuck.current?.b ?? null
        : stuckNet.current ? balls.current[stuckNet.current.i] ?? null : null;
      if (stBall) {
        const pulse = 1 + Math.sin(performance.now() / 120) * 0.5;
        ctx.strokeStyle = "#FF6EC7"; ctx.globalAlpha = 0.5 * pulse; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(stBall.x, yv(stBall.y), R + 5 + pulse * 2, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // искры: чёрточки летят по направлению, точки — россыпью, всё с лёгкой гравитацией
      for (const p of fxRef.current) {
        p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy = p.vy * 0.96 + 0.05; p.life -= 0.035;
        if (p.life > 0) {
          ctx.globalAlpha = p.life * 0.9;
          if (p.kind === "line") {
            ctx.strokeStyle = p.color; ctx.lineWidth = 1.2; ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 3.2, p.y - p.vy * 3.2); ctx.stroke();
          } else {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          }
        }
      }
      fxRef.current = fxRef.current.filter((p) => p.life > 0);
      ctx.globalAlpha = 1;

      // мячи: световое гало + лёгкое вытяжение по вектору скорости
      for (const b of balls.current) {
        const sx = b.x, sy = yv(b.y);
        const spd = Math.hypot(b.vx, b.vy);
        const sf = clamp(spd / (MAXV * 1.2), 0, 1);
        const g = ctx.createRadialGradient(sx, sy, R * 0.4, sx, sy, R * 2.4);
        g.addColorStop(0, `rgba(255,255,255,${(0.16 + 0.1 * sf).toFixed(2)})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(sx, sy, R * 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.save();
        ctx.translate(sx, sy);
        if (spd > 0.5) {
          ctx.rotate(Math.atan2(mirror ? -b.vy : b.vy, b.vx));
          ctx.scale(1 + 0.16 * sf, 1 - 0.1 * sf);
        }
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // всплывающие «+1» у ворот
      for (const f of floats.current) {
        const k = (nowMs - f.t0) / 750;
        if (k >= 1) continue;
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = f.color;
        ctx.font = "700 26px system-ui, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(f.text, f.x, f.y - k * 26);
      }
      floats.current = floats.current.filter((f) => nowMs - f.t0 < 750);
      ctx.globalAlpha = 1;

      // вспышка гола поверх всего
      if (flashRef.current > 0.02) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = `rgba(166,255,0,${(flashRef.current * 0.16).toFixed(3)})`;
        ctx.fillRect(0, 0, FW, FH);
        flashRef.current *= 0.88;
      } else flashRef.current = 0;
    };

    const activate = (type: "x2" | "size" | "stick", owner: 0 | 1) => {
      const now = performance.now();
      if (type === "x2") {
        const cur = balls.current.length;
        const add = Math.min(cur, 4 - cur);
        for (let i = 0; i < add; i++) {
          const s = balls.current[i % cur];
          if (stuck.current?.b === s) continue; // от прилипшего не клонируем
          // новый мяч — «свежая подача»: стартовая скорость и свой случайный вектор,
          // а не зеркальная копия разогнанного
          balls.current.push({
            x: s.x, y: s.y,
            vx: (Math.random() * 2 - 1) * 2.6,
            vy: Math.sign(s.vy || 1) * BASE,
            last: s.last,
          });
        }
        // намеренно НЕ ставим срок жизни мультибола — мячи остаются до гола
      } else if (type === "stick") {
        // взведена 12с: следующий приём этой ракеткой — прилипание
        stickArmed.current[owner] = now + 12000;
      } else {
        if (owner === 0) { pw1.current = PW * 1.5; sizeUntil.current[0] = now + 10000; }
        else { pw2.current = PW * 1.5; sizeUntil.current[1] = now + 10000; }
      }
    };

    // ФИКСИРОВАННЫЙ шаг физики 60 Гц: rAF на 120Гц-экранах тикает вдвое чаще,
    // и без аккумулятора игра на таких телефонах шла в 2 раза быстрее задуманного
    // (и мяч за кадр проходил дальше — отсюда и «пролетает сквозь ракетку»).
    // запуск прилипшего мяча — только хост (авторитетная физика)
    onReleaseRef.current = (owner) => {
      const st = stuck.current;
      if (roleRef.current !== "host" || !st || st.owner !== owner) return;
      const W = st.owner === 0 ? pw1.current : pw2.current;
      const px = st.owner === 0 ? px1.current : px2Eff.current;
      const c = px + W / 2;
      // отлипаем с той же скоростью, с которой прилипли (а не фиксированной):
      // vy в сторону соперника, vx — от точки на ракетке, |v| ≈ скорости входа.
      const dirY = st.owner === 0 ? -1 : 1;
      const spd = Math.max(st.spd || BASE * 1.6, BASE);
      const vxCap = Math.min(4, spd * 0.7);
      const vx = clamp(((st.b.x - c) / (W / 2)) * 3, -vxCap, vxCap);
      st.b.vx = vx;
      st.b.vy = dirY * Math.sqrt(Math.max(spd * spd - vx * vx, (spd * 0.5) ** 2));
      st.b.last = st.owner;
      paddleHitAt.current[st.owner] = performance.now();
      sparks(st.b.x, st.b.y, "#FF6EC7", 16, 3, st.b.vx, st.b.vy);
      stuck.current = null;
    };

    // лаг-компенсация: гость заявил «я отбил» — хост верит, если мяч ещё летит вниз к нему
    // и недалеко от плоскости верхней ракетки (закрывает «сквозь палку» при позднем рывке)
    applyHitRef.current = (p) => {
      if (roleRef.current !== "host" || phaseRef.current !== "playing") return;
      const cx = Number(p.x);
      if (!Number.isFinite(cx)) return;
      let best: Ball | null = null;
      for (const b of balls.current) {
        if (stuck.current?.b === b) continue;
        if (b.vy >= 0) continue;            // уже отбит
        if (b.y - R > TOP_Y + PH + 110 || b.y < -R - 40) continue; // слишком далеко от ракетки
        if (!best || b.y < best.y) best = b;
      }
      if (!best) return;
      const now = performance.now();
      if (stickArmed.current[1] > now && !stuck.current) {
        stickArmed.current[1] = 0;
        const spdIn = Math.max(Math.hypot(best.vx, best.vy), Number(p.vx) ? Math.abs(Number(p.vx)) : 0);
        stuck.current = { b: best, owner: 1, off: clamp(cx, R, FW - R) - px2Eff.current, until: now + 2500, since: now, spd: spdIn || BASE * 1.6 };
        best.x = clamp(cx, R, FW - R); best.y = TOP_Y + PH + R; best.vx = 0; best.vy = 0; best.last = 1;
        sparks(best.x, best.y, "#FF6EC7", 14, 2.6);
        return;
      }
      best.x = clamp(cx, R, FW - R);
      best.y = TOP_Y + PH + R;
      best.vy = Math.abs(best.vy) * ACC;
      const cvx = Number(p.vx);
      if (Number.isFinite(cvx)) best.vx = clamp(cvx, -MAXV, MAXV);
      best.last = 1;
      paddleHitAt.current[1] = now;
      sparks(best.x, best.y, "rgba(255,255,255,0.85)", 12, 2.8, best.vx, best.vy);
    };

    const STEP = 1000 / 60;
    let lastT = 0, acc = 0;

    const step = () => {
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
      // своя скорость (px/кадр), сглаженная — гость шлёт её хосту для экстраполяции
      myVel.current = myVel.current * 0.7 + (me - prevMyX.current) * 0.3;
      prevMyX.current = me;

      // хост: экстраполируем ракетку гостя на возраст последнего пакета (до ~4 кадров),
      // чтобы коллизии считались по тому, где палец гостя СЕЙЧАС, а не RTT/2 назад
      if (host) {
        // по P2P пакеты свежие (кап 4 кадра), по relay лаг больше — экстраполируем дальше
        const cap = useP2P.current ? 4 : 10;
        const age = px2At.current ? Math.min((now - px2At.current) / 16.7, cap) : 0;
        px2Eff.current = clamp(px2.current + px2Vel.current * age, 0, FW - pw2.current);
      }

      // гость: мяч летит локально по последним известным скоростям (dead reckoning).
      // Стены И ракетки отбиваем предсказательно (без ACC) — иначе между пакетами мяч
      // визуально проходит сквозь ракетку, а потом телепортируется. Хост скорректирует.
      if (!host && phaseRef.current === "playing") {
        const W1 = pw1.current, W2 = pw2.current;
        balls.current.forEach((b, i) => {
          // прилипший мяч едет на ракетке владельца, физику пропускаем
          const st = stuckNet.current;
          if (st && st.i === i) {
            if (st.owner === 1) { b.x = clamp(px2.current + st.off, R, FW - R); b.y = TOP_Y + PH + R; }
            else { b.x = clamp(px1.current + st.off, R, FW - R); b.y = BOTTOM_Y - R; }
            b.vx = 0; b.vy = 0;
            return;
          }
          const oldY = b.y;
          b.x += b.vx; b.y += b.vy;
          if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); sparks(b.x, FH - b.y, "rgba(255,255,255,0.5)", 5, 1.6, b.vx, -b.vy * 0.4); }
          if (b.x > FW - R) { b.x = FW - R; b.vx = -Math.abs(b.vx); sparks(b.x, FH - b.y, "rgba(255,255,255,0.5)", 5, 1.6, b.vx, -b.vy * 0.4); }
          if (b.vy > 0 && oldY + R <= BOTTOM_Y + 2 && b.y + R >= BOTTOM_Y &&
              b.x >= px1.current - R && b.x <= px1.current + W1 + R) {
            b.y = BOTTOM_Y - R; b.vy = -Math.abs(b.vy);
            paddleHitAt.current[0] = performance.now();
            sparks(b.x, FH - b.y, "rgba(255,255,255,0.85)", 12, 2.8, b.vx, -b.vy);
          } else if (b.vy < 0 && oldY - R >= TOP_Y + PH - 2 && b.y - R <= TOP_Y + PH &&
              b.x >= px2.current - R && b.x <= px2.current + W2 + R) {
            b.y = TOP_Y + PH + R; b.vy = Math.abs(b.vy);
            paddleHitAt.current[1] = performance.now();
            sparks(b.x, FH - b.y, "#A6FF00", 12, 2.8, b.vx, -b.vy);
            // лаг-компенсация: заявляем хосту «я отбил» — иначе при рывке ракетки в последний
            // момент хост (видящий её с опозданием) пропустит мяч «сквозь палку»
            const nowMs = performance.now();
            if (nowMs - lastClaim.current > 150) {
              lastClaim.current = nowMs;
              const claim = { x: Math.round(b.x), vx: Math.round(b.vx * 100) / 100 };
              if (useP2P.current) p2pRef.current?.sendCtl({ event: "hit", payload: claim });
              else chRef.current?.send("hit", claim);
            }
          }
          b.y = clamp(b.y, -30, FH + 30);
        });
      }

      if (host && phaseRef.current === "playing") {
        // истечение бустов. Мультибол (x2) НЕ снимаем по таймеру — лишние мячи
        // живут вместе до тех пор, пока не вылетят в гол (Егор: «два шарика играют постоянно»).
        if (sizeUntil.current[0] && now > sizeUntil.current[0]) { pw1.current = PW; sizeUntil.current[0] = 0; }
        if (sizeUntil.current[1] && now > sizeUntil.current[1]) { pw2.current = PW; sizeUntil.current[1] = 0; }
        // спавн/деспавн буста
        if (!boost.current && now > nextBoostAt.current) {
          const rr = Math.random();
          boost.current = {
            x: 60 + Math.random() * (FW - 120),
            y: FH * 0.32 + Math.random() * FH * 0.36,
            // мультибол (x2) выпадает чаще остальных — это «второй шарик», которого Егор хочет больше
            type: rr < 0.5 ? "x2" : rr < 0.8 ? "size" : "stick",
          };
          boostGoneAt.current = now + 10000;
        }
        if (boost.current && now > boostGoneAt.current) { boost.current = null; nextBoostAt.current = now + 3000 + Math.random() * 3500; }

        // прилипший мяч следует за ракеткой владельца.
        // Запуск: владелец отпустил палец (живой флаг из ввода/пакетов) или таймаут 2.5с
        if (stuck.current) {
          const st = stuck.current;
          if (st.owner === 0) { st.b.x = clamp(px1.current + st.off, R, FW - R); st.b.y = BOTTOM_Y - R; }
          else { st.b.x = clamp(px2Eff.current + st.off, R, FW - R); st.b.y = TOP_Y + PH + R; }
          const holderDown = st.owner === 0 ? pressed : guestDown.current;
          if (now > st.until || (!holderDown && now > st.since + 220)) onReleaseRef.current(st.owner);
        }

        const W1 = pw1.current, W2 = pw2.current;
        const p2x = px2Eff.current; // ракетка гостя с компенсацией лага
        for (const b of balls.current) {
          if (stuck.current?.b === b) continue; // прилип — физика не нужна
          // ─── режим «магнитное поле»: снос мяча по линиям течения ───
          // Силу считает ТОЛЬКО хост (авторитетная физика) — гость получит
          // готовые vx/vy в state-пакетах, dead reckoning сгладит между ними.
          if (modeRef.current === "field") {
            const a = flowAngle(b.x, b.y, now);
            // у ракеток поле гаснет — без «нечестных» промахов у самой палки
            let k = clamp(Math.min(b.y - (TOP_Y + PH), BOTTOM_Y - b.y) / FIELD_FADE_PX, 0, 1);
            k = k * k * (3 - 2 * k);
            b.vx += Math.cos(a) * FIELD_STRENGTH * k;
            b.vy += Math.sin(a) * FIELD_STRENGTH * 0.8 * k; // поперёк поля сносит чуть слабее
            // страховка: поле не должно «подвесить» мяч поперёк поля навсегда
            if (Math.abs(b.vy) < 0.9) b.vy = 0.9 * (b.vy !== 0 ? Math.sign(b.vy) : (b.last === 0 ? -1 : 1));
            b.vx = clamp(b.vx, -MAXV, MAXV); b.vy = clamp(b.vy, -MAXV, MAXV);
          }
          // подшаги: на высокой скорости двигаем мяч кусками ≤ ~6px,
          // чтобы он физически не мог проскочить плоскость ракетки за кадр
          const sp = Math.max(Math.abs(b.vx), Math.abs(b.vy));
          const steps = sp > 12 ? 3 : sp > 6 ? 2 : 1;
          for (let s = 0; s < steps; s++) {
            const oldY = b.y;
            b.x += b.vx / steps; b.y += b.vy / steps;
            if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); sparks(b.x, b.y, "rgba(255,255,255,0.5)", 5, 1.6, b.vx, b.vy * 0.4); }
            if (b.x > FW - R) { b.x = FW - R; b.vx = -Math.abs(b.vx); sparks(b.x, b.y, "rgba(255,255,255,0.5)", 5, 1.6, b.vx, b.vy * 0.4); }
            // нижняя ракетка (p1) — проверка пересечения плоскости за подшаг
            if (b.vy > 0 && oldY + R <= BOTTOM_Y + 2 && b.y + R >= BOTTOM_Y &&
                b.x >= px1.current - R && b.x <= px1.current + W1 + R) {
              if (stickArmed.current[0] > now && !stuck.current) {
                stickArmed.current[0] = 0;
                stuck.current = { b, owner: 0, off: b.x - px1.current, until: now + 2500, since: now, spd: Math.hypot(b.vx, b.vy) };
                b.y = BOTTOM_Y - R; b.vx = 0; b.vy = 0; b.last = 0;
                sparks(b.x, b.y, "#FF6EC7", 14, 2.6);
                break;
              }
              b.y = BOTTOM_Y - R; b.vy = -Math.abs(b.vy) * ACC;
              b.vx += ((b.x - (px1.current + W1 / 2)) / (W1 / 2)) * 2.6; b.last = 0;
              paddleHitAt.current[0] = now;
              sparks(b.x, b.y, "#A6FF00", 12, 2.8, b.vx, b.vy);
            }
            // верхняя ракетка (p2) — по экстраполированной позиции
            else if (b.vy < 0 && oldY - R >= TOP_Y + PH - 2 && b.y - R <= TOP_Y + PH &&
                b.x >= p2x - R && b.x <= p2x + W2 + R) {
              if (stickArmed.current[1] > now && !stuck.current) {
                stickArmed.current[1] = 0;
                stuck.current = { b, owner: 1, off: b.x - p2x, until: now + 2500, since: now, spd: Math.hypot(b.vx, b.vy) };
                b.y = TOP_Y + PH + R; b.vx = 0; b.vy = 0; b.last = 1;
                sparks(b.x, b.y, "#FF6EC7", 14, 2.6);
                break;
              }
              b.y = TOP_Y + PH + R; b.vy = Math.abs(b.vy) * ACC;
              b.vx += ((b.x - (p2x + W2 / 2)) / (W2 / 2)) * 2.6; b.last = 1;
              paddleHitAt.current[1] = now;
              sparks(b.x, b.y, "rgba(255,255,255,0.85)", 12, 2.8, b.vx, b.vy);
            }
            b.vy = clamp(b.vy, -MAXV, MAXV); b.vx = clamp(b.vx, -MAXV, MAXV);
          }
          // сбор буста
          if (boost.current && Math.hypot(b.x - boost.current.x, b.y - boost.current.y) < 26) {
            activate(boost.current.type, b.last); boost.current = null;
            nextBoostAt.current = now + 3000 + Math.random() * 3500;
          }
        }
        // голы — убираем вылетевшие мячи
        let scored = false;
        balls.current = balls.current.filter((b) => {
          if (b.y > FH + R) { sc.current[1]++; scored = true; return false; }
          // верхний гол — с запасом ~5 кадров: даём hit-claim гостя долететь,
          // прежде чем засчитать (мяч в это время уже за краем экрана, не видно)
          if (b.y < -R - 40) { sc.current[0]++; scored = true; return false; }
          return true;
        });
        if (scored) {
          setScore([sc.current[0], sc.current[1]]);
          if (sc.current[0] >= WIN_SCORE || sc.current[1] >= WIN_SCORE) {
            const w = sc.current[0] > sc.current[1] ? 0 : 1;
            winnerRef.current = w; setWinner(w); setPhaseBoth("over");
            balls.current = []; boost.current = null; stuck.current = null;
          } else if (balls.current.length === 0) {
            startCountdown(Math.random() < 0.5 ? 1 : -1);
          }
        }
      }
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!lastT) lastT = t;
      acc += Math.min(t - lastT, 100); // кап: фоновая вкладка не догоняет махом
      lastT = t;
      while (acc >= STEP) { acc -= STEP; step(); }
      const host = roleRef.current === "host";

      // сеть: P2P — 60 Гц (дёшево, напрямую), relay — 30 Гц (бережём квоты Supabase,
      // dead reckoning гостя гладко заполняет промежутки)
      const ch = chRef.current;
      const p2p = useP2P.current;
      if (t - lastSend > (p2p ? 15 : 33)) {
        lastSend = t;
        if (host) {
          const statePayload = {
            balls: balls.current.map((b) => [
              Math.round(b.x), Math.round(b.y),
              Math.round(b.vx * 100) / 100, Math.round(b.vy * 100) / 100,
            ]),
            px1: px1.current, pw1: pw1.current, pw2: pw2.current,
            boost: boost.current ? {
              x: Math.round(boost.current.x), y: Math.round(boost.current.y), type: boost.current.type,
              t: Math.round(clamp((boostGoneAt.current - performance.now()) / 9000, 0, 1) * 100) / 100,
            } : null,
            stuck: stuck.current ? { i: balls.current.indexOf(stuck.current.b), owner: stuck.current.owner, off: Math.round(stuck.current.off) } : null,
            s1: sc.current[0], s2: sc.current[1], phase: phaseRef.current, count: countRef.current,
            mode: modeRef.current === "field" ? 1 : 0,
            winner: phaseRef.current === "over" ? (sc.current[0] > sc.current[1] ? 0 : 1) : null,
          };
          if (p2p) {
            p2pRef.current?.sendFast({ event: "state", payload: statePayload });
            // зеркало в релей пореже — спасает односторонний P2P
            if (t - lastMirror > 100) { lastMirror = t; ch?.send("state", statePayload); }
          } else ch?.send("state", statePayload);
        } else {
          const pp = { x: px2.current, v: Math.round(myVel.current * 100) / 100, d: pressed ? 1 : 0 };
          if (p2p) {
            p2pRef.current?.sendFast({ event: "paddle", payload: pp });
            if (t - lastMirror > 100) { lastMirror = t; ch?.send("paddle", pp); }
          } else ch?.send("paddle", pp);
        }
      }
      draw();
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku);
      window.removeEventListener("pointermove", pointer);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copy() {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ }
  }
  function rematch() {
    if (roleRef.current === "host") startMatch();
    else if (useP2P.current) p2pRef.current?.sendCtl({ event: "rematch", payload: {} });
    else chRef.current?.send("rematch", {});
  }
  // тумблер режима — только хост, на экранах ожидания/конца матча
  function toggleMode() {
    setModeBoth(modeRef.current === "field" ? "classic" : "field");
  }

  const mine = role === "host" ? score[0] : score[1];
  const theirs = role === "host" ? score[1] : score[0];
  const iWon = winner === (role === "host" ? 0 : 1);

  // победный залп — в цветах сайта
  useEffect(() => {
    if (phase === "over" && iWon) {
      confetti({
        particleCount: 130, spread: 100, startVelocity: 42, origin: { y: 0.6 },
        colors: ["#A6FF00", "#D9FF66", "#FFFFFF"], disableForReducedMotion: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, winner]);

  return (
    <main className="pong-page relative bg-black text-white overflow-hidden flex flex-col items-center px-4 pt-[60px] sm:pt-[68px] pb-4" style={{ minHeight: "100dvh" }}>
      {/* режим «магнитное поле»: живой фон-течение (сквозь полупрозрачный канвас) */}
      {mode === "field" ? (
        <MagneticWaves anchor={canvasRef} mirror={role === "guest"} opacity={0.5} />
      ) : null}
      {/* лёгкое лаймовое свечение — как на остальных страницах квеста */}
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 55% 45% at 50% 38%, rgba(166,255,0,0.05), transparent 62%)",
      }} />
      <div className="relative z-[1] w-full max-w-[440px] mx-auto flex flex-col items-center text-center">
        <p className="text-white/40 mb-1.5">
          <span className="sr-only">Пинг-понг · вдвоём</span>
          <LedText text="Пинг-понг · вдвоём" className="h-[8px] w-auto" />
          <span className="ml-2 normal-case tracking-normal" style={{ color: transport === "p2p" ? "rgba(166,255,0,0.65)" : "rgba(255,255,255,0.25)" }}>
            <span className={transport === "p2p" ? "animate-pulse" : ""}>●</span> {transport === "p2p" ? "p2p" : "сервер"}
          </span>
          {mode === "field" ? (
            <span className="ml-2 normal-case tracking-normal text-[#A6FF00]/65">⌁ поле</span>
          ) : null}
        </p>
        <div className="flex items-center justify-center gap-2.5 sm:gap-5 mb-2">
          <span className="text-white/40">
            <LedText text="соперник" className="h-[7px] sm:h-[8px] w-auto" />
          </span>
          <span key={`t${theirs}`} className="text-white/80 score-pop inline-flex">
            <LedText text={String(theirs)} scale={2} dot={1.45} className="h-[16px] sm:h-[20px] w-auto" />
          </span>
          <span className="text-white/20">
            <LedText text=":" className="h-[12px] w-auto" />
          </span>
          <span key={`m${mine}`} className="text-[#A6FF00] score-pop inline-flex">
            <LedText text={String(mine)} scale={2} dot={1.45} className="h-[16px] sm:h-[20px] w-auto" />
          </span>
          <span className="text-white/40 text-[10px] sm:text-xs uppercase tracking-[0.12em]">ты</span>
        </div>

        {/* высотная посадка — канвас всегда влезает по вертикали и центрирован */}
        <div className="relative mx-auto" style={{ height: "min(62dvh, 600px)", aspectRatio: `${FW}/${FH}` }}>
          <canvas ref={canvasRef} width={FW} height={FH}
            className="block w-full h-full rounded-lg border border-white/10 touch-none select-none"
            style={{ background: mode === "field" ? "transparent" : "#000" }} />

          {count > 0 && phase === "count" ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span key={count} className="text-[#A6FF00] count-in inline-flex">
                <LedText text={String(count)} scale={2} dot={1.45} className="h-[56px] sm:h-[80px] w-auto" />
              </span>
            </div>
          ) : null}

          {phase !== "playing" && phase !== "count" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md rounded-lg px-6 text-center">
              {phase === "connecting" ? <p className="text-white/60 text-sm">Подключаюсь…</p> : null}

              {phase === "waiting" ? (
                role === "host" ? (
                  shareUrl ? (
                    <>
                      <p className="text-[15px] text-white/80 mb-1">Жду соперника</p>
                      <p className="text-[13px] text-white/45 mb-5 max-w-xs">Кинь ссылку другу — игра начнётся, когда он откроет.</p>
                      <button type="button" onClick={copy}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] hover:bg-[#A6FF00] hover:text-black transition-colors">
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
                  <p className="text-[#A6FF00] mb-3 flex justify-center">
                    <span className="sr-only">{iWon ? "Ты выиграл" : "Ты проиграл"}</span>
                    <LedText
                      text={iWon ? "Ты выиграл" : "Ты проиграл"}
                      scale={2}
                      dot={1.45}
                      className="h-[20px] sm:h-[26px] w-auto"
                    />
                  </p>
                  <button type="button" onClick={rematch}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] hover:bg-[#A6FF00] hover:text-black transition-colors">
                    <span className="leading-none translate-y-[1px]">{role === "host" ? "Реванш" : "Запросить реванш"}</span>
                  </button>
                </>
              ) : null}

              {/* выбор режима — хост, пока игра не идёт; второй режим, не дефолт */}
              {role === "host" && (phase === "waiting" || phase === "over") ? (
                <button type="button" onClick={toggleMode}
                  className="mt-5 text-white/35 hover:text-white/70 transition-colors">
                  режим:{" "}
                  <span className={mode === "field" ? "text-[#A6FF00]" : "text-white/70"}>
                    {mode === "field" ? "⌁ магнитное поле" : "классика"}
                  </span>
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <p className="hidden sm:block mt-3 text-[12px] text-white/40 max-w-xs">Двигай ракетку (внизу) пальцем или ←→. Мяч летит — отбивай. До {WIN_SCORE}.</p>
        {mode === "field" ? (
          <p className="mt-2 text-[12px] text-[#A6FF00]/55 max-w-xs">Магнитное поле сносит мяч — читай течение по линиям фона.</p>
        ) : null}
      </div>
    </main>
  );
}

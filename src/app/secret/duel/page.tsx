"use client";

import LedText from "@/components/LedText";
import QuestButton from "@/components/QuestButton";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { connectP2P, type P2PHandle } from "../pong/rtc";
import { connectRelay, type Relay } from "../pong/pongRelay";
import { FW, FH } from "../pong/field";
import { submitFeedback } from "../leaderboard";
import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";

// Телеграм-канал для вейтлиста после игр.
const TG_CHANNEL = "https://t.me/aiegorka";

/**
 * Сетевая дуэль-сквош — третья игра серии «поиграм».
 * Геометрия отличается от понга: ОБЕ ракетки внизу, сверху — стенка-отбойник.
 * Поле делится по центру: левая половина — хост (p1), правая — гость (p2),
 * каждый ходит только в своей половине и отбивает мячи, прилетающие в его зону.
 * Промахнулся у себя — очко сопернику.
 *
 * Мультибол (бонус x2 удваивает шарики) и бонус size (шире ракетка). Бонусы лежат
 * на поле ПАЧКОЙ (несколько одновременно).
 *
 * Сеть как в понге: хост авторитетно считает физику и шлёт состояние, гость —
 * dead reckoning + коррекция. Транспорт: P2P (rtc) с фолбэком на relay.
 * Зеркала нет — оба видят одинаковое поле, своя ракетка подсвечена лаймом.
 */
const R = 8;                       // радиус мяча
const PW = 84, PH = 14;            // ракетка (уже понговой — две влезают в половины)
const MARGIN = 26;
const BOTTOM_Y = FH - MARGIN - PH; // верхняя грань ракеток (обе внизу)
const WALL_Y = MARGIN;             // нижняя грань верхней стенки-отбойника
const MID = FW / 2;                // граница половин
const WIN_SCORE = 5;
const BASE = 3.4;                  // стартовая скорость мяча
const MAXV = 8;                    // потолок скорости
const ACC = 1.035;                // ускорение на отскоке от ракетки
const MAX_BALLS = 6;
const MAX_BOOSTS = 3;

type Phase = "connecting" | "waiting" | "count" | "playing" | "over";
type BoostType = "x2" | "size";
type Ball = { x: number; y: number; vx: number; vy: number; last: 0 | 1; touched: boolean };
type Boost = { id: number; x: number; y: number; type: BoostType };

const rndCode = () =>
  Array.from({ length: 5 }, () => "abcdefghijkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 32)]).join("");
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
// границы движения ракетки по своей половине (с учётом текущей ширины)
const clampPaddle = (x: number, owner: 0 | 1, w: number) =>
  owner === 0 ? clamp(x, 0, MID - w) : clamp(x, MID, FW - w);

export default function DuelPage() {
  const locale = useLocale();
  const [phase, setPhase] = useState<Phase>("connecting");
  const [role, setRole] = useState<"host" | "guest">("host");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [score, setScore] = useState<[number, number]>([0, 0]); // [host, guest]
  const [winner, setWinner] = useState<0 | 1 | null>(null);
  const [count, setCount] = useState(0);
  const [transport, setTransport] = useState<"relay" | "p2p">("relay");
  const [ping, setPing] = useState<number | null>(null); // RTT до соперника, мс
  const [oppName, setOppName] = useState("");
  const [myName, setMyName] = useState("");

  const roleRef = useRef<"host" | "guest">("host");
  const chRef = useRef<Relay | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const p2pRef = useRef<P2PHandle | null>(null);
  const useP2P = useRef(false);
  const myNameRef = useRef("");

  // вейтлист/отзыв после второго матча
  const overCountRef = useRef(0);
  const [followOpen, setFollowOpen] = useState(false);
  const [fbTg, setFbTg] = useState("");
  const [fbText, setFbText] = useState("");
  const [fbSending, setFbSending] = useState(false);
  const [fbDone, setFbDone] = useState(false);
  const relayPeers = useRef(false);
  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── игровое состояние ───
  const px1 = useRef((MID - PW) / 2);          // ракетка хоста (левая половина)
  const px2 = useRef(MID + (MID - PW) / 2);    // ракетка гостя (правая половина)
  const pw1 = useRef(PW);
  const pw2 = useRef(PW);
  const balls = useRef<Ball[]>([{ x: FW / 2, y: FH / 2, vx: 0, vy: 0, last: 0, touched: false }]);
  const boosts = useRef<Boost[]>([]);
  const boostId = useRef(1);
  const sizeUntil = useRef<[number, number]>([0, 0]);
  const nextBoostAt = useRef(0);
  const soloRef = useRef(false);

  const sc = useRef<[number, number]>([0, 0]);
  const phaseRef = useRef<Phase>("connecting");
  const countRef = useRef(0);
  const myX = useRef((MID - PW) / 2);
  const winnerRef = useRef<0 | 1 | null>(null);

  // сглаживание сети
  const px2Vel = useRef(0);
  const px2At = useRef(0);
  const px2Eff = useRef(MID + (MID - PW) / 2);
  const prevMyX = useRef((MID - PW) / 2);
  const myVel = useRef(0);

  // визуальные эффекты
  type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; kind: "dot" | "line" };
  const fxRef = useRef<Spark[]>([]);
  const paddleHitAt = useRef<[number, number]>([0, 0]);
  const floats = useRef<{ x: number; y: number; t0: number; text: string; color: string }[]>([]);
  const trailRef = useRef<{ x: number; y: number }[][]>([]);
  const boostBorn = useRef<Record<number, number>>({});
  const flashRef = useRef(0);
  const shakeRef = useRef(0);
  const prevScoreFx = useRef<[number, number]>([0, 0]);

  const hadMatch = useRef(false);
  const countTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // выбор хоста при «двух гостях»
  const myId = useRef(Math.random().toString(36).slice(2));
  const lastStateAt = useRef(0);
  const hostSeenAt = useRef(0);
  const peerGuestId = useRef<string | null>(null);
  // авто-выбор транспорта по задержке: меряем пинг p2p и релея, основной — кто быстрее
  const pingP2P = useRef<number | null>(null);
  const pingRelay = useRef<number | null>(null);
  const primaryRef = useRef<"relay" | "p2p">("relay");
  // рендер-сглаживание (визуально, физику не трогаем)
  const rOppX = useRef<number | null>(null);
  const rBalls = useRef<{ x: number; y: number }[]>([]);

  const setPhaseBoth = (p: Phase) => { phaseRef.current = p; setPhase(p); };
  const setCountBoth = (c: number) => { countRef.current = c; setCount(c); };

  function serve(dir: number) {
    // подача из центра ВВЕРХ к стенке (даёт время среагировать), снос в случайную половину
    balls.current = [{ x: FW / 2, y: FH / 2, vx: (Math.random() * 2 - 1) * 2.4, vy: -BASE * dir, last: 0, touched: false }];
    boosts.current = [];
    sizeUntil.current = [0, 0];
    pw1.current = PW; pw2.current = PW;
    nextBoostAt.current = performance.now() + 1800 + Math.random() * 1800;
  }

  // мобила: прячем шапку/подвал, блокируем скролл (палец = ракетка)
  useEffect(() => {
    document.body.classList.add("pong-immersive");
    const tm = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", tm, { passive: false });
    return () => {
      document.body.classList.remove("pong-immersive");
      document.removeEventListener("touchmove", tm);
    };
  }, []);

  // ─── подключение (повторяет каркас понга) ───
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    try { const nm = (localStorage.getItem("quest_name") || "").trim().slice(0, 16); myNameRef.current = nm; setMyName(nm); } catch { /* */ }
    const room = params.get("room");
    const sParam = params.get("s");
    let code = room || sParam || "";
    const r: "host" | "guest" = room
      ? (params.get("host") === "1" ? "host" : "guest")
      : (sParam ? "guest" : "host");
    roleRef.current = r; setRole(r);

    // одиночная тренировка против ИИ (?solo=1)
    if (params.get("solo") === "1") {
      soloRef.current = true;
      roleRef.current = "host"; setRole("host");
      setShareUrl("");
      const t = setTimeout(() => { if (phaseRef.current !== "playing") startMatch(); }, 500);
      return () => clearTimeout(t);
    }

    if (!code) code = rndCode();
    if (r === "host" && !room) setShareUrl(`${window.location.origin}/secret/duel?s=${code}`);

    const ch = connectRelay(code);
    chRef.current = ch;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const applyState = (payload: any) => {
      lastStateAt.current = performance.now();
      if (roleRef.current !== "guest") return;
      const bs = payload.balls as [number, number, number, number][];
      const prev = balls.current;
      balls.current = bs.map(([x, y, vx, vy], i) => {
        const loc = prev[i];
        if (loc && Math.hypot(x - loc.x, y - loc.y) < 48) {
          return { x: loc.x + (x - loc.x) * 0.35, y: loc.y + (y - loc.y) * 0.35, vx, vy, last: 0 as const, touched: true };
        }
        return { x, y, vx, vy, last: 0 as const, touched: true };
      });
      px1.current = payload.px1;
      pw1.current = payload.pw1; pw2.current = payload.pw2;
      boosts.current = (payload.boosts || []).map((b: any) => ({ id: b.id, x: b.x, y: b.y, type: b.type }));
      if (payload.s1 !== sc.current[0] || payload.s2 !== sc.current[1]) {
        sc.current = [payload.s1, payload.s2]; setScore([payload.s1, payload.s2]);
      }
      if (payload.phase && payload.phase !== phaseRef.current) setPhaseBoth(payload.phase);
      if (payload.count !== countRef.current) setCountBoth(payload.count);
      const w = payload.winner;
      if ((w === 0 || w === 1) && w !== winnerRef.current) { winnerRef.current = w; setWinner(w); }
    };
    const applyPaddle = (payload: any) => {
      if (roleRef.current !== "host") return;
      px2.current = payload.x;
      px2Vel.current = typeof payload.v === "number" ? payload.v : 0;
      px2At.current = performance.now();
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const onHelloMsg = () => {
      if (roleRef.current === "host" &&
          (phaseRef.current === "waiting" || phaseRef.current === "connecting")) resumeOrStart();
    };

    // основной транспорт по пингам; приём с обоих, запасной только если основной молчит >700мс
    const lastRecv: Record<"p2p" | "relay", number> = { p2p: 0, relay: 0 };
    const recompute = () => {
      const p = useP2P.current ? pingP2P.current : null;
      const rl = relayPeers.current ? pingRelay.current : null;
      let next = primaryRef.current;
      if (!useP2P.current) next = "relay";
      else if (p == null && rl == null) next = "p2p";
      else if (p == null) next = "relay";
      else if (rl == null) next = "p2p";
      else if (primaryRef.current === "p2p" && rl < p - 30) next = "relay";
      else if (primaryRef.current === "relay" && p < rl - 30) next = "p2p";
      primaryRef.current = next;
      setTransport(next);
      setPing(next === "p2p" ? pingP2P.current : pingRelay.current);
    };
    const accept = (via: "p2p" | "relay") => {
      const now = performance.now();
      lastRecv[via] = now;
      const prim = primaryRef.current;
      return via === prim || now - lastRecv[prim] > 700;
    };
    ch.on("state", (payload) => { if (accept("relay")) applyState(payload); });
    ch.on("paddle", (payload) => { if (accept("relay")) applyPaddle(payload); });
    ch.on("rematch", () => { if (roleRef.current === "host") startMatch(); });
    // ─── пинг: эхо по тому же транспорту, тег via сохраняем ───
    const replyPong = (via: "p2p" | "relay", t: number) =>
      via === "p2p" ? p2pRef.current?.sendCtl({ event: "pong", payload: { t, via } })
                    : chRef.current?.send("pong", { t, via });
    const onPong = (p: unknown) => {
      const d = (p ?? {}) as { t?: number; via?: "p2p" | "relay" };
      if (typeof d.t !== "number" || d.t <= 0) return;
      const rtt = Math.round(performance.now() - d.t);
      if (d.via === "p2p") pingP2P.current = rtt; else pingRelay.current = rtt;
      recompute();
    };
    ch.on("ping", (p) => replyPong("relay", (p as { t?: number })?.t ?? 0));
    ch.on("pong", onPong);
    const handleHello = (payload: unknown) => {
      const p = (payload ?? {}) as { id?: string; h?: number; name?: string };
      if (p.h === 1) hostSeenAt.current = performance.now();
      else if (p.id) peerGuestId.current = p.id;
      if (p.name && p.name !== myNameRef.current) setOppName(p.name);
      if (roleRef.current === "host") {
        onHelloMsg();
        chRef.current?.send("hello", { id: myId.current, name: myNameRef.current, h: 1 });
      }
    };
    ch.on("hello", handleHello);

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

    p2pRef.current = connectP2P({
      room: code,
      role: r,
      onMessage: (m) => {
        if (m.event === "state") { if (accept("p2p")) applyState(m.payload); }
        else if (m.event === "paddle") { if (accept("p2p")) applyPaddle(m.payload); }
        else if (m.event === "hello") handleHello(m.payload);
        else if (m.event === "rematch") { if (roleRef.current === "host") startMatch(); }
        else if (m.event === "ping") replyPong("p2p", (m.payload as { t?: number })?.t ?? 0);
        else if (m.event === "pong") onPong(m.payload);
      },
      onOpen: () => {
        useP2P.current = true;
        recompute();
        if (roleRef.current === "guest") p2pRef.current?.sendCtl({ event: "hello", payload: { id: myId.current, name: myNameRef.current } });
        evalConn();
      },
      onClose: () => {
        useP2P.current = false;
        pingP2P.current = null;
        recompute();
        evalConn();
      },
    });

    const connT = setTimeout(() => {
      if (phaseRef.current === "connecting") setPhaseBoth("waiting");
    }, 2500);

    ch.onPeers((cnt) => {
      relayPeers.current = cnt >= 2;
      if (cnt < 2) pingRelay.current = null;
      recompute();
      evalConn();
    });

    lastStateAt.current = performance.now();
    hostSeenAt.current = performance.now();
    const electT = setInterval(() => {
      if (roleRef.current !== "guest") return;
      if (!(useP2P.current || relayPeers.current)) return;
      if (phaseRef.current !== "waiting" && phaseRef.current !== "connecting") return;
      chRef.current?.send("hello", { id: myId.current, name: myNameRef.current });
      const now = performance.now();
      if (
        now - lastStateAt.current > 4000 &&
        now - hostSeenAt.current > 4000 &&
        peerGuestId.current &&
        myId.current > peerGuestId.current
      ) {
        roleRef.current = "host";
        setRole("host");
        chRef.current?.send("hello", { id: myId.current, name: myNameRef.current, h: 1 });
        resumeOrStart();
      }
    }, 1500);

    const pingT = setInterval(() => {
      const now = performance.now();
      if (useP2P.current) p2pRef.current?.sendCtl({ event: "ping", payload: { t: now, via: "p2p" } });
      if (relayPeers.current) chRef.current?.send("ping", { t: now, via: "relay" });
      if (!useP2P.current && !relayPeers.current) { setPing(null); pingP2P.current = null; pingRelay.current = null; }
    }, 1200);

    ch.onOpen(() => {
      if (phaseRef.current === "connecting") setPhaseBoth("waiting");
      if (roleRef.current === "guest") {
        const hi = () => chRef.current?.send("hello", { id: myId.current, name: myNameRef.current });
        hi(); setTimeout(hi, 500); setTimeout(hi, 1400);
      }
    });

    return () => {
      clearTimeout(connT);
      clearInterval(electT);
      clearInterval(pingT);
      cancelWaiting();
      if (countTimer.current) clearInterval(countTimer.current);
      p2pRef.current?.close(); p2pRef.current = null;
      ch.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCountdown(dir: number) {
    if (countTimer.current) clearInterval(countTimer.current);
    balls.current = [{ x: FW / 2, y: FH / 2, vx: 0, vy: 0, last: 0, touched: false }];
    boosts.current = [];
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
    px1.current = (MID - PW) / 2; px2.current = MID + (MID - PW) / 2;
    startCountdown(Math.random() < 0.5 ? 1 : -1);
  }
  function resumeOrStart() {
    startMatch(sc.current[0] + sc.current[1] > 0 && winnerRef.current === null);
  }

  // ─── игровой цикл + ввод + отрисовка ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = FW * dpr; canvas.height = FH * dpr;
    let raf = 0, lastSend = 0, lastMirror = 0;
    const keys: Record<string, boolean> = {};

    const onKey = (e: KeyboardEvent, downK: boolean) => {
      const k = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "a", "d"].includes(k)) { keys[k] = downK; e.preventDefault(); }
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);

    // палец/мышь — ловим на всём окне, берём X. Маппим в свою половину поля.
    const pointer = (e: PointerEvent) => {
      // тап по кнопке/инпуту не должен дёргать ракетку
      if ((e.target as HTMLElement)?.closest("button, a, input, textarea")) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      const ownPw = roleRef.current === "host" ? pw1.current : pw2.current;
      const x = ((e.clientX - rect.left) / rect.width) * FW;
      myX.current = clampPaddle(x - ownPw / 2, roleRef.current === "host" ? 0 : 1, ownPw);
    };
    const down = (e: PointerEvent) => pointer(e);
    window.addEventListener("pointermove", pointer);
    window.addEventListener("pointerdown", down);

    const vignette = ctx.createRadialGradient(FW / 2, FH / 2, FH * 0.3, FW / 2, FH / 2, FH * 0.78);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.42)");

    const capsule = (x: number, y: number, w: number, h: number) => {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, h / 2); else ctx.rect(x, y, w, h);
    };

    const boostColor = (t: BoostType) => t === "x2" ? "#A6FF00" : "#33C7FF";
    const boostIcon = (t: BoostType, x: number, y: number, c: string) => {
      ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.lineCap = "round";
      if (t === "x2") {
        ctx.beginPath(); ctx.arc(x - 5, y, 3.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 5, y, 3.4, 0, Math.PI * 2); ctx.fill();
      } else {
        // size — «растяжка»
        ctx.beginPath();
        ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y);
        ctx.moveTo(x - 9, y); ctx.lineTo(x - 5, y - 4);
        ctx.moveTo(x - 9, y); ctx.lineTo(x - 5, y + 4);
        ctx.moveTo(x + 9, y); ctx.lineTo(x + 5, y - 4);
        ctx.moveTo(x + 9, y); ctx.lineTo(x + 5, y + 4);
        ctx.stroke();
      }
    };

    const eob = (t: number) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function sparks(x: number, y: number, color: string, n = 10, spread = 2.6, dx = 0, dy = 0) {
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
      if (fxRef.current.length > 240) fxRef.current.splice(0, fxRef.current.length - 240);
    }

    const draw = () => {
      const host = roleRef.current === "host";
      const playing = phaseRef.current === "playing";
      const nowMs = performance.now();
      const meIdx: 0 | 1 = host ? 0 : 1;

      // гол → вспышка + тряска + «+1»
      if (sc.current[0] !== prevScoreFx.current[0] || sc.current[1] !== prevScoreFx.current[1]) {
        const gained = sc.current[0] > prevScoreFx.current[0] ? 0 : 1;
        if (!reducedMotion) {
          flashRef.current = 1; shakeRef.current = 7;
          floats.current.push({
            x: gained === 0 ? MID / 2 : MID + MID / 2,
            y: BOTTOM_Y - 30, t0: nowMs, text: "+1",
            color: gained === meIdx ? "#A6FF00" : "rgba(255,255,255,0.8)",
          });
        }
        prevScoreFx.current = [sc.current[0], sc.current[1]];
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, FW, FH);
      if (shakeRef.current > 0.3) {
        ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);
        shakeRef.current *= 0.86;
      } else shakeRef.current = 0;

      // фоновая сетка точек
      ctx.fillStyle = "rgba(255,255,255,0.035)";
      for (let gx = 11; gx < FW; gx += 22)
        for (let gy = 11; gy < FH; gy += 22) ctx.fillRect(gx, gy, 1.4, 1.4);

      // подсветка СВОЕЙ половины (лайм) — где твоя зона ответственности
      const myLeft = meIdx === 0;
      const hg = ctx.createLinearGradient(0, BOTTOM_Y, 0, FH);
      hg.addColorStop(0, "rgba(166,255,0,0)");
      hg.addColorStop(1, "rgba(166,255,0,0.10)");
      ctx.fillStyle = hg;
      ctx.fillRect(myLeft ? 0 : MID, BOTTOM_Y - 4, MID, FH - BOTTOM_Y + 4);

      // центральная вертикальная линия — точки
      ctx.fillStyle = "#fff";
      for (let y = WALL_Y + 10; y < FH - 8; y += 22) {
        const k = 1 - Math.abs(y - FH / 2) / (FH / 2);
        ctx.globalAlpha = 0.06 + 0.16 * k;
        ctx.beginPath(); ctx.arc(MID, y, 1.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // верхняя стенка-отбойник
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.fillRect(4, WALL_Y - 4, FW - 8, 4);
      ctx.fillStyle = "rgba(166,255,0,0.5)";
      ctx.fillRect(4, WALL_Y, FW - 8, 2);

      ctx.fillStyle = vignette; ctx.fillRect(0, 0, FW, FH);

      // нижние уголки — лаймовые засечки
      ctx.strokeStyle = "rgba(166,255,0,0.4)"; ctx.lineWidth = 2; ctx.lineCap = "round";
      const tick = 13, m = 3;
      ctx.beginPath();
      ctx.moveTo(m, FH - m - tick); ctx.lineTo(m, FH - m); ctx.lineTo(m + tick, FH - m);
      ctx.moveTo(FW - m - tick, FH - m); ctx.lineTo(FW - m, FH - m); ctx.lineTo(FW - m, FH - m - tick);
      ctx.stroke();

      // ракетки (обе внизу). Своя — лайм со свечением, чужая — белая.
      const paddle = (x: number, w: number, own: boolean, idx: 0 | 1) => {
        const hit = Math.max(0, 1 - (nowMs - paddleHitAt.current[idx]) / 130);
        const sw = w * (1 + 0.12 * hit), sh = PH * (1 - 0.18 * hit);
        const px = x - (sw - w) / 2;
        const py = (FH - MARGIN - PH) + (PH - sh) / 2;
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
        if (hit > 0) { ctx.globalAlpha = 0.35 * hit; ctx.fillStyle = "#fff"; capsule(px, py, sw, sh); ctx.fill(); ctx.globalAlpha = 1; }
      };
      // сглаживание чужой ракетки (адаптивно к пингу)
      const curPing = primaryRef.current === "p2p" ? pingP2P.current : pingRelay.current;
      const ease = clamp(0.62 - (curPing ?? 70) / 450, 0.16, 0.6);
      const oppX = host ? px2Eff.current : px1.current;
      if (rOppX.current == null || Math.abs(oppX - rOppX.current) > 140) rOppX.current = oppX;
      else rOppX.current += (oppX - rOppX.current) * Math.min(1, ease * 1.4);
      if (host) {
        paddle(px1.current, pw1.current, true, 0);
        paddle(rOppX.current, pw2.current, false, 1);
      } else {
        paddle(rOppX.current, pw1.current, false, 0);
        paddle(px2.current, pw2.current, true, 1);
      }

      // бонусы (пачкой)
      for (const bst of boosts.current) {
        const born = boostBorn.current[bst.id] ?? (boostBorn.current[bst.id] = nowMs);
        const c = boostColor(bst.type);
        const k = Math.min((nowMs - born) / 220, 1);
        ctx.save();
        ctx.translate(bst.x, bst.y);
        ctx.scale(eob(k), eob(k));
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([3, 7]); ctx.lineDashOffset = -nowMs / 30; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
        boostIcon(bst.type, 0, 0, c);
        ctx.restore();
      }
      // подчистка born-кэша
      if (boosts.current.length === 0) boostBorn.current = {};

      // сглаживаем рендер мячей у гостя (логику-физику не трогаем)
      if (!host) {
        const rb = rBalls.current;
        balls.current.forEach((b, i) => {
          if (!rb[i] || Math.hypot(b.x - rb[i].x, b.y - rb[i].y) > 140) rb[i] = { x: b.x, y: b.y };
          else { rb[i].x += (b.x - rb[i].x) * ease; rb[i].y += (b.y - rb[i].y) * ease; }
        });
        rb.length = balls.current.length;
      }
      const bpos = (b: Ball, i: number) => (!host && rBalls.current[i]) ? rBalls.current[i] : b;

      // шлейф мяча
      if (playing && !reducedMotion) {
        balls.current.forEach((b, i) => {
          const tr = (trailRef.current[i] ||= []);
          const p = bpos(b, i); tr.push({ x: p.x, y: p.y });
          if (tr.length > 10) tr.shift();
        });
        trailRef.current.length = balls.current.length;
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        balls.current.forEach((b, i) => {
          const tr = trailRef.current[i];
          if (!tr || tr.length < 2) return;
          const sf = clamp(Math.max(Math.abs(b.vx), Math.abs(b.vy)) / MAXV, 0, 1);
          const mix = clamp((sf - 0.4) / 0.6, 0, 1);
          const cr = Math.round(255 - (255 - 166) * mix);
          const cb = Math.round(255 - 255 * mix);
          for (let j = 1; j < tr.length; j++) {
            const k = j / tr.length;
            ctx.globalAlpha = k * (0.1 + 0.25 * sf);
            ctx.strokeStyle = `rgb(${cr},255,${cb})`;
            ctx.lineWidth = R * 1.7 * k;
            ctx.beginPath();
            ctx.moveTo(tr[j - 1].x, tr[j - 1].y);
            ctx.lineTo(tr[j].x, tr[j].y);
            ctx.stroke();
          }
        });
        ctx.globalAlpha = 1;
      } else if (!playing && trailRef.current.length) {
        trailRef.current = [];
      }

      // искры
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

      // мячи
      balls.current.forEach((b, i) => {
        const p = bpos(b, i);
        const spd = Math.hypot(b.vx, b.vy);
        const sf = clamp(spd / (MAXV * 1.2), 0, 1);
        const g = ctx.createRadialGradient(p.x, p.y, R * 0.4, p.x, p.y, R * 2.4);
        g.addColorStop(0, `rgba(255,255,255,${(0.16 + 0.1 * sf).toFixed(2)})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, R * 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.save();
        ctx.translate(p.x, p.y);
        if (spd > 0.5) { ctx.rotate(Math.atan2(b.vy, b.vx)); ctx.scale(1 + 0.16 * sf, 1 - 0.1 * sf); }
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      // «+1»
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

      // вспышка гола
      if (flashRef.current > 0.02) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = `rgba(166,255,0,${(flashRef.current * 0.16).toFixed(3)})`;
        ctx.fillRect(0, 0, FW, FH);
        flashRef.current *= 0.88;
      } else flashRef.current = 0;
    };

    const activate = (type: BoostType, owner: 0 | 1) => {
      const now = performance.now();
      if (type === "x2") {
        const cur = balls.current.length;
        const add = Math.min(cur, MAX_BALLS - cur);
        for (let i = 0; i < add; i++) {
          const s = balls.current[i % cur];
          balls.current.push({
            x: s.x, y: s.y,
            vx: (Math.random() * 2 - 1) * 2.6,
            vy: (s.vy >= 0 ? 1 : -1) * BASE,
            last: s.last, touched: true,
          });
        }
      } else {
        // size — шире ракетка на 10с
        if (owner === 0) { pw1.current = PW * 1.5; sizeUntil.current[0] = now + 10000; }
        else { pw2.current = PW * 1.5; sizeUntil.current[1] = now + 10000; }
      }
    };

    const STEP = 1000 / 60;
    let lastT = 0, acc = 0;

    const step = () => {
      const host = roleRef.current === "host";
      const now = performance.now();

      // ввод своей ракетки
      const meIdx: 0 | 1 = host ? 0 : 1;
      const ownRef = host ? px1 : px2;
      const ownPw = host ? pw1.current : pw2.current;
      {
        const speed = 9;
        let me = ownRef.current;
        if (keys["arrowleft"] || keys["a"]) me -= speed;
        if (keys["arrowright"] || keys["d"]) me += speed;
        if (Math.abs(myX.current - ownRef.current) > 0.5) me = myX.current;
        me = clampPaddle(me, meIdx, ownPw);
        ownRef.current = me; myX.current = me;
        myVel.current = myVel.current * 0.7 + (me - prevMyX.current) * 0.3;
        prevMyX.current = me;
      }

      // хост: экстраполяция ракетки гостя
      if (host) {
        const cap = useP2P.current ? 4 : 10;
        const age = px2At.current ? Math.min((now - px2At.current) / 16.7, cap) : 0;
        px2Eff.current = clampPaddle(px2.current + px2Vel.current * age, 1, pw2.current);
      }

      // solo: ИИ ведёт правую ракетку
      if (soloRef.current && host && phaseRef.current === "playing") {
        let target = MID + (MID - pw2.current) / 2, best = Infinity;
        for (const b of balls.current) {
          if (b.x >= MID && b.vy > 0 && b.y < best) { best = b.y; target = b.x - pw2.current / 2; }
        }
        const cur = px2.current;
        px2.current = clampPaddle(cur + clamp(target - cur, -6.5, 6.5), 1, pw2.current);
        px2Eff.current = px2.current; px2At.current = now;
      }

      // гость: dead reckoning мяча (стены, верхний отбойник, обе ракетки)
      if (!host && phaseRef.current === "playing") {
        const W1 = pw1.current, W2 = pw2.current;
        balls.current.forEach((b) => {
          b.x += b.vx; b.y += b.vy;
          if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); }
          if (b.x > FW - R) { b.x = FW - R; b.vx = -Math.abs(b.vx); }
          if (b.vy < 0 && b.y - R <= WALL_Y) { b.y = WALL_Y + R; b.vy = Math.abs(b.vy); }
          if (b.vy > 0 && b.y + R >= BOTTOM_Y && b.y + R <= BOTTOM_Y + 14) {
            if (b.x >= px1.current - R && b.x <= px1.current + W1 + R) {
              b.y = BOTTOM_Y - R; b.vy = -Math.abs(b.vy); paddleHitAt.current[0] = now;
              sparks(b.x, b.y, "#A6FF00", 10, 2.6, b.vx, -b.vy);
            } else if (b.x >= px2.current - R && b.x <= px2.current + W2 + R) {
              b.y = BOTTOM_Y - R; b.vy = -Math.abs(b.vy); paddleHitAt.current[1] = now;
              sparks(b.x, b.y, "#A6FF00", 10, 2.6, b.vx, -b.vy);
            }
          }
          b.y = clamp(b.y, -30, FH + 30);
        });
      }

      if (host && phaseRef.current === "playing") {
        // истечение size
        if (sizeUntil.current[0] && now > sizeUntil.current[0]) { pw1.current = PW; sizeUntil.current[0] = 0; }
        if (sizeUntil.current[1] && now > sizeUntil.current[1]) { pw2.current = PW; sizeUntil.current[1] = 0; }

        // спавн бонусов пачкой: x2 (мультибол) чаще, size реже
        if (now > nextBoostAt.current && boosts.current.length < MAX_BOOSTS) {
          const type: BoostType = Math.random() < 0.6 ? "x2" : "size";
          boosts.current.push({
            id: boostId.current++,
            x: 50 + Math.random() * (FW - 100),
            y: WALL_Y + 50 + Math.random() * (FH * 0.5),
            type,
          });
          nextBoostAt.current = now + 1600 + Math.random() * 2600;
        }

        const W1 = pw1.current, W2 = pw2.current;
        const p2x = px2Eff.current;
        for (const b of balls.current) {
          const sp = Math.max(Math.abs(b.vx), Math.abs(b.vy));
          const steps = sp > 12 ? 3 : sp > 6 ? 2 : 1;
          for (let s = 0; s < steps; s++) {
            b.x += b.vx / steps; b.y += b.vy / steps;
            if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); sparks(b.x, b.y, "rgba(255,255,255,0.5)", 5, 1.6, b.vx, b.vy * 0.4); }
            if (b.x > FW - R) { b.x = FW - R; b.vx = -Math.abs(b.vx); sparks(b.x, b.y, "rgba(255,255,255,0.5)", 5, 1.6, b.vx, b.vy * 0.4); }
            // верхняя стенка-отбойник
            if (b.vy < 0 && b.y - R <= WALL_Y) {
              b.y = WALL_Y + R; b.vy = Math.abs(b.vy);
              sparks(b.x, b.y, "rgba(255,255,255,0.5)", 5, 1.8, b.vx, b.vy);
            }
            // ракетки (обе внизу) — ловят мяч, идущий вниз, каждая в своей зоне
            if (b.vy > 0 && b.y + R >= BOTTOM_Y && b.y + R <= BOTTOM_Y + 14) {
              if (b.x >= px1.current - R && b.x <= px1.current + W1 + R) {
                b.y = BOTTOM_Y - R; b.vy = -Math.abs(b.vy) * ACC;
                b.vx += ((b.x - (px1.current + W1 / 2)) / (W1 / 2)) * 2.6; b.last = 0; b.touched = true;
                paddleHitAt.current[0] = now;
                sparks(b.x, b.y, "#A6FF00", 12, 2.8, b.vx, b.vy);
              } else if (b.x >= p2x - R && b.x <= p2x + W2 + R) {
                b.y = BOTTOM_Y - R; b.vy = -Math.abs(b.vy) * ACC;
                b.vx += ((b.x - (p2x + W2 / 2)) / (W2 / 2)) * 2.6; b.last = 1; b.touched = true;
                paddleHitAt.current[1] = now;
                sparks(b.x, b.y, "#A6FF00", 12, 2.8, b.vx, b.vy);
              }
            }
            b.vy = clamp(b.vy, -MAXV, MAXV); b.vx = clamp(b.vx, -MAXV, MAXV);
          }
          // сбор бонусов
          for (let i = boosts.current.length - 1; i >= 0; i--) {
            const bo = boosts.current[i];
            if (Math.hypot(b.x - bo.x, b.y - bo.y) < 24) {
              const owner: 0 | 1 = b.touched ? b.last : (b.x < MID ? 0 : 1);
              activate(bo.type, owner);
              sparks(bo.x, bo.y, boostColor(bo.type), 16, 3);
              boosts.current.splice(i, 1);
            }
          }
        }

        // голы: мяч ушёл вниз → очко защитнику ПРОТИВОПОЛОЖНОЙ зоны
        let scored = false;
        balls.current = balls.current.filter((b) => {
          if (b.y > FH + R) {
            if (b.x < MID) sc.current[1]++; else sc.current[0]++;
            scored = true; return false;
          }
          return true;
        });
        if (scored) {
          setScore([sc.current[0], sc.current[1]]);
          if (sc.current[0] >= WIN_SCORE || sc.current[1] >= WIN_SCORE) {
            const w = sc.current[0] > sc.current[1] ? 0 : 1;
            winnerRef.current = w; setWinner(w); setPhaseBoth("over");
            hadMatch.current = true;
            balls.current = []; boosts.current = [];
          } else if (balls.current.length === 0) {
            startCountdown(Math.random() < 0.5 ? 1 : -1);
          }
        }
      }
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!lastT) lastT = t;
      acc += Math.min(t - lastT, 100);
      lastT = t;
      while (acc >= STEP) { acc -= STEP; step(); }
      const host = roleRef.current === "host";

      const ch = chRef.current;
      const prim = primaryRef.current === "p2p" && useP2P.current ? "p2p" : "relay";
      if (t - lastSend > (prim === "p2p" ? 15 : 33)) {
        lastSend = t;
        if (host) {
          const statePayload = {
            balls: balls.current.map((b) => [
              Math.round(b.x), Math.round(b.y),
              Math.round(b.vx * 100) / 100, Math.round(b.vy * 100) / 100,
            ]),
            px1: Math.round(px1.current), pw1: pw1.current, pw2: pw2.current,
            boosts: boosts.current.map((b) => ({ id: b.id, x: Math.round(b.x), y: Math.round(b.y), type: b.type })),
            s1: sc.current[0], s2: sc.current[1], phase: phaseRef.current, count: countRef.current,
            winner: phaseRef.current === "over" ? (sc.current[0] > sc.current[1] ? 0 : 1) : null,
          };
          if (prim === "p2p") {
            p2pRef.current?.sendFast({ event: "state", payload: statePayload });
            if (t - lastMirror > 100) { lastMirror = t; ch?.send("state", statePayload); }
          } else {
            ch?.send("state", statePayload);
            if (useP2P.current && t - lastMirror > 100) { lastMirror = t; p2pRef.current?.sendFast({ event: "state", payload: statePayload }); }
          }
        } else {
          const pp = { x: px2.current, v: Math.round(myVel.current * 100) / 100 };
          if (prim === "p2p") {
            p2pRef.current?.sendFast({ event: "paddle", payload: pp });
            if (t - lastMirror > 100) { lastMirror = t; ch?.send("paddle", pp); }
          } else {
            ch?.send("paddle", pp);
            if (useP2P.current && t - lastMirror > 100) { lastMirror = t; p2pRef.current?.sendFast({ event: "paddle", payload: pp }); }
          }
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
  const mine = role === "host" ? score[0] : score[1];
  const theirs = role === "host" ? score[1] : score[0];
  const iWon = winner === (role === "host" ? 0 : 1);

  useEffect(() => {
    if (phase === "over" && iWon) {
      confetti({
        particleCount: 130, spread: 100, startVelocity: 42, origin: { y: 0.6 },
        colors: ["#A6FF00", "#D9FF66", "#FFFFFF"], disableForReducedMotion: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, winner]);

  useEffect(() => {
    if (phase === "over") {
      overCountRef.current += 1;
      if (overCountRef.current >= 2) setFollowOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function sendFollow() {
    if (fbSending || fbDone || (!fbTg.trim() && !fbText.trim())) return;
    setFbSending(true);
    const ok = await submitFeedback(myNameRef.current || pick("Гость", "Guest", locale), {
      telegram: fbTg.trim(), feedback: fbText.trim(), published: true,
    });
    setFbSending(false);
    if (ok) setFbDone(true);
  }

  return (
    <main className="pong-page relative bg-black text-white overflow-hidden flex flex-col items-center px-4 pt-[52px] sm:pt-[60px] pb-4" style={{ minHeight: "100dvh" }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 55% 45% at 50% 38%, rgba(166,255,0,0.05), transparent 62%)",
      }} />
      <div className="relative z-[1] w-full max-w-[440px] mx-auto flex flex-col items-center text-center">
        <p className="text-white/40 mb-1.5 whitespace-nowrap">
          <span className="sr-only">{pick("Дуэль · сквош", "Duel · squash", locale)}</span>
          <LedText text={pick("Дуэль · сквош", "Duel · squash", locale)} className="h-[8px] w-auto" />
          <span className="ml-2 normal-case tracking-normal" style={{ color: transport === "p2p" ? "rgba(166,255,0,0.65)" : "rgba(255,255,255,0.25)" }}>
            <span className={transport === "p2p" ? "animate-pulse" : ""}>●</span> {transport === "p2p" ? "p2p" : pick("сервер", "server", locale)}
          </span>
          {ping != null ? (
            <span className="ml-1.5 normal-case tracking-normal"
              style={{ color: ping <= 120 ? "rgba(166,255,0,0.7)" : ping <= 200 ? "#FFD60A" : "#FF6B6B" }}>
              {ping} {pick("мс", "ms", locale)}
            </span>
          ) : null}
        </p>
        <div className="flex items-center justify-center gap-2.5 sm:gap-5 mb-2">
          <span className="text-white/40">
            <LedText text={oppName || pick("соперник", "rival", locale)} className="h-[7px] sm:h-[8px] w-auto" />
          </span>
          <span key={`t${theirs}`} className="text-white/80 score-pop inline-flex">
            <LedText text={String(theirs)} scale={2} dot={1.45} className="h-[16px] sm:h-[20px] w-auto" />
          </span>
          <span className="text-white/20"><LedText text=":" className="h-[12px] w-auto" /></span>
          <span key={`m${mine}`} className="text-[#A6FF00] score-pop inline-flex">
            <LedText text={String(mine)} scale={2} dot={1.45} className="h-[16px] sm:h-[20px] w-auto" />
          </span>
          <span className="text-white/40">
            <LedText text={myName || pick("ты", "you", locale)} className="h-[7px] sm:h-[8px] w-auto" />
          </span>
        </div>

        <div className="relative mx-auto" style={{ height: "min(62dvh, 600px)", aspectRatio: `${FW}/${FH}` }}>
          <canvas ref={canvasRef} width={FW} height={FH}
            className="block w-full h-full rounded-lg border border-white/10 touch-none select-none"
            style={{ background: "#000" }} />

          {/* предупреждение о пинге — оверлеем над полем, не двигает раскладку */}
          {ping != null && ping > 200 ? (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[2] pointer-events-none px-3 py-1.5 rounded-md bg-black/70 backdrop-blur-sm border border-[#FF6B6B]/30">
              <p className="text-[12px] text-[#FF6B6B] leading-snug text-center max-w-[240px]">
                {pick(`Высокий пинг (${ping} мс) — мяч будет дёргаться.`, `High ping (${ping} ms) — the ball will stutter.`, locale)}
              </p>
            </div>
          ) : null}

          {count > 0 && phase === "count" ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span key={count} className="text-[#A6FF00] count-in inline-flex">
                <LedText text={String(count)} scale={2} dot={1.45} className="h-[56px] sm:h-[80px] w-auto" />
              </span>
            </div>
          ) : null}

          {phase !== "playing" && phase !== "count" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md rounded-lg px-6 text-center">
              {phase === "connecting" ? <p className="text-white/60 text-sm">{pick("Подключаюсь…", "Connecting…", locale)}</p> : null}

              {phase === "waiting" ? (
                role === "host" ? (
                  shareUrl ? (
                    <>
                      <p className="text-[16px] text-white/80 mb-1">{pick("Жду соперника", "Waiting for a rival", locale)}</p>
                      <p className="text-[14px] text-white/45 mb-5 max-w-xs">{pick("Кинь ссылку другу — игра начнётся, когда он откроет.", "Send the link to a friend — the game starts when they open it.", locale)}</p>
                      <QuestButton onClick={copy}>{copied ? pick("скопировано", "copied", locale) : pick("копировать ссылку", "copy link", locale)}</QuestButton>
                      <QuestButton href="/secret/duel?solo=1" variant="tertiary" className="mt-4">{pick("тренировка одному", "solo practice", locale)}</QuestButton>
                    </>
                  ) : (
                    <p className="text-white/70 text-sm">{pick("Жду, пока напарник откроет дуэль…", "Waiting for your partner to open the duel…", locale)}</p>
                  )
                ) : (
                  <p className="text-white/70 text-sm">{pick("Готов. Начинаем…", "Ready. Starting…", locale)}</p>
                )
              ) : null}

              {phase === "over" ? (
                <>
                  <p className="text-[#A6FF00] mb-3 flex justify-center">
                    <span className="sr-only">{iWon ? pick("Ты выиграл", "You won", locale) : pick("Ты проиграл", "You lost", locale)}</span>
                    <LedText text={iWon ? pick("Ты выиграл", "You won", locale) : pick("Ты проиграл", "You lost", locale)} scale={2} dot={1.45} className="h-[20px] sm:h-[26px] w-auto" />
                  </p>
                  <QuestButton onClick={rematch}>{role === "host" ? pick("Реванш", "Rematch", locale) : pick("Запросить реванш", "Request rematch", locale)}</QuestButton>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        {followOpen && phase === "over" ? (
          <div className="relative z-[1] w-full max-w-[360px] mx-auto mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-center">
            {fbDone ? (
              <p className="text-[14px] text-[#A6FF00]">{pick("Спасибо! Если оставил телеграм — позову на новые игры.", "Thanks! If you left your Telegram — I'll ping you for new games.", locale)}</p>
            ) : (
              <>
                <p className="text-[14px] text-white/75 mb-3">{pick("Понравилось? Оставь телеграм — позову на новые игры и расскажу о проектах.", "Enjoyed it? Drop your Telegram — I'll ping you for new games and share my projects.", locale)}</p>
                <input value={fbTg} onChange={(e) => setFbTg(e.target.value)} maxLength={80} placeholder={pick("Телеграм / ник", "Telegram / handle", locale)} aria-label={pick("Телеграм", "Telegram", locale)}
                  className="w-full mb-2 bg-white/[0.06] border border-white/15 rounded-full px-4 py-2.5 text-[14px] text-white text-center placeholder:text-white/35 outline-none focus:border-[#A6FF00]/60 transition-colors" />
                <textarea value={fbText} onChange={(e) => setFbText(e.target.value)} maxLength={500} rows={2} placeholder={pick("Отзыв (необязательно)", "Feedback (optional)", locale)} aria-label={pick("Отзыв", "Feedback", locale)}
                  className="w-full mb-3 bg-white/[0.06] border border-white/15 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder:text-white/35 outline-none focus:border-[#A6FF00]/60 transition-colors resize-none" />
                <div className="flex items-center justify-center gap-3">
                  <QuestButton onClick={sendFollow} disabled={fbSending || (!fbTg.trim() && !fbText.trim())}>{fbSending ? "..." : pick("Оставить", "Submit", locale)}</QuestButton>
                  <QuestButton href={TG_CHANNEL} external variant="secondary">{pick("Канал", "Channel", locale)}</QuestButton>
                </div>
              </>
            )}
          </div>
        ) : null}

        <p className="hidden sm:block mt-3 text-[12px] text-white/40 max-w-xs">
          {pick(
            `Твоя половина — снизу. Отбивай мячи в своей зоне (←→ или палец). Лови бонусы: мультибол и широкая ракетка. До ${WIN_SCORE}.`,
            `Your half is at the bottom. Return the balls in your zone (←→ or finger). Grab boosts: multiball and a wider paddle. First to ${WIN_SCORE}.`,
            locale,
          )}
        </p>
      </div>
    </main>
  );
}

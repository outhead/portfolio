"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

  const px1 = useRef((FW - PW) / 2); // нижняя ракетка (host)
  const px2 = useRef((FW - PW) / 2); // верхняя ракетка (guest)
  const ball = useRef({ x: FW / 2, y: FH / 2, vx: 0, vy: 0 });
  const sc = useRef<[number, number]>([0, 0]);
  const phaseRef = useRef<Phase>("connecting");
  const countRef = useRef(0);
  const myX = useRef((FW - PW) / 2);
  const winnerRef = useRef<0 | 1 | null>(null);
  const serveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const setPhaseBoth = (p: Phase) => { phaseRef.current = p; setPhase(p); };
  const setCountBoth = (c: number) => { countRef.current = c; setCount(c); };

  function serve(dir: number) {
    ball.current = { x: FW / 2, y: FH / 2, vx: (Math.random() * 2 - 1) * 2.2, vy: dir * BASE };
  }

  // на мобиле прячем глобальный подвал/шапку, чтобы понг влезал и был выше
  useEffect(() => {
    document.body.classList.add("pong-immersive");
    return () => document.body.classList.remove("pong-immersive");
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
      ball.current.x = payload.bx; ball.current.y = payload.by;
      px1.current = payload.px1;
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
    ball.current = { x: FW / 2, y: FH / 2, vx: 0, vy: 0 };
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

    const pointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * FW;
      myX.current = clamp(x - PW / 2, 0, FW - PW);
    };
    canvas.addEventListener("pointermove", pointer);
    canvas.addEventListener("pointerdown", pointer);

    const draw = () => {
      const mirror = roleRef.current === "guest";
      const yv = (cy: number) => (mirror ? FH - cy : cy);
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, FW, FH);
      // центральная пунктирная линия
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      for (let x = 8; x < FW; x += 30) ctx.fillRect(x, FH / 2 - 2, 18, 4);
      // ракетки: моя — лайм, соперника — белёсая
      const myIsP1 = !mirror; // host рисует себя внизу (p1); guest зеркалит, его p2 уходит вниз
      // нижняя ракетка на экране = «моя»
      const meX = mirror ? px2.current : px1.current;
      const oppX = mirror ? px1.current : px2.current;
      // моя (низ экрана)
      ctx.fillStyle = "#A6FF00";
      ctx.fillRect(meX, FH - MARGIN - PH, PW, PH);
      // соперник (верх экрана)
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillRect(oppX, MARGIN, PW, PH);
      void myIsP1;
      // круглый мяч
      ctx.beginPath();
      ctx.arc(ball.current.x, yv(ball.current.y), R, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const host = roleRef.current === "host";

      // ввод — двигаем СВОЮ ракетку по X
      const speed = 8;
      const ownRef = host ? px1 : px2;
      let me = ownRef.current;
      if (keys["arrowleft"] || keys["a"]) me -= speed;
      if (keys["arrowright"] || keys["d"]) me += speed;
      if (Math.abs(myX.current - ownRef.current) > 0.5) me = myX.current;
      me = clamp(me, 0, FW - PW);
      ownRef.current = me; myX.current = me;

      if (host && phaseRef.current === "playing") {
        const b = ball.current;
        b.x += b.vx; b.y += b.vy;
        // боковые стены
        if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); }
        if (b.x > FW - R) { b.x = FW - R; b.vx = -Math.abs(b.vx); }
        // нижняя ракетка (host, p1)
        if (b.vy > 0 && b.y + R >= BOTTOM_Y && b.y + R <= BOTTOM_Y + PH + 10 &&
            b.x >= px1.current - R && b.x <= px1.current + PW + R) {
          b.y = BOTTOM_Y - R; b.vy = -Math.abs(b.vy) * ACC;
          b.vx += ((b.x - (px1.current + PW / 2)) / (PW / 2)) * 2.4;
        }
        // верхняя ракетка (guest, p2)
        if (b.vy < 0 && b.y - R <= TOP_Y + PH && b.y - R >= TOP_Y - 10 &&
            b.x >= px2.current - R && b.x <= px2.current + PW + R) {
          b.y = TOP_Y + PH + R; b.vy = Math.abs(b.vy) * ACC;
          b.vx += ((b.x - (px2.current + PW / 2)) / (PW / 2)) * 2.4;
        }
        b.vy = clamp(b.vy, -MAXV, MAXV); b.vx = clamp(b.vx, -MAXV, MAXV);
        // голы
        if (b.y > FH + R) { sc.current[1]++; setScore([sc.current[0], sc.current[1]]); afterPoint(1); }
        else if (b.y < -R) { sc.current[0]++; setScore([sc.current[0], sc.current[1]]); afterPoint(-1); }
      }

      // сеть ~30 Гц
      const ch = chRef.current;
      if (ch && t - lastSend > 33) {
        lastSend = t;
        if (host) {
          ch.send({ type: "broadcast", event: "state", payload: {
            bx: ball.current.x, by: ball.current.y, px1: px1.current,
            s1: sc.current[0], s2: sc.current[1], phase: phaseRef.current,
            count: countRef.current,
            winner: phaseRef.current === "over" ? (sc.current[0] > sc.current[1] ? 0 : 1) : null,
          }});
        } else {
          ch.send({ type: "broadcast", event: "paddle", payload: { x: px2.current } });
        }
      }
      draw();
    };

    function afterPoint(dir: number) {
      if (sc.current[0] >= WIN_SCORE || sc.current[1] >= WIN_SCORE) {
        const w = sc.current[0] > sc.current[1] ? 0 : 1;
        winnerRef.current = w; setWinner(w); setPhaseBoth("over");
        ball.current = { x: FW / 2, y: FH / 2, vx: 0, vy: 0 };
        return;
      }
      // пауза-перезапуск с коротким отсчётом в сторону проигравшего очко
      startCountdown(dir);
    }

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku);
      canvas.removeEventListener("pointermove", pointer);
      canvas.removeEventListener("pointerdown", pointer);
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
    <main className="pong-page relative bg-black text-white overflow-hidden flex flex-col items-center justify-center px-4 pt-[44px] sm:pt-[56px] pb-4 sm:pb-8" style={{ minHeight: "100dvh" }}>
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

        <Link href="/" className="mt-3 sm:mt-5 inline-flex items-center gap-1.5 text-[12px] text-white/30 hover:text-white/60 transition-colors no-underline">
          <ArrowLeft className="w-3 h-3" strokeWidth={2.2} /> На главную
        </Link>
      </div>
    </main>
  );
}

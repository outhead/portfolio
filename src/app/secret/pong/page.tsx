"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";

/**
 * Сетевой ретро-пинг-понг (двое, по ссылке).
 * Хост авторитетно считает физику мяча и шлёт состояние через Supabase Realtime
 * broadcast (~30 Гц). Гость шлёт только свою ракетку. Без таблиц — чистый канал по коду.
 */
const SB_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hvkygaghhxgaolxemndr.supabase.co";
const SB_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a3lnYWdoaHhnYW9seGVtbmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDYwNjAsImV4cCI6MjA5NDg4MjA2MH0.IoRNKO3Jb51k1XA2y7-Q-PSaxpPhBj56G1SZJaKKau4";

const W = 800, H = 480;
const PADDLE_H = 88, PADDLE_W = 12, BALL = 12, MARGIN = 24;
const WIN_SCORE = 7;

type Phase = "connecting" | "waiting" | "playing" | "over";

const rndCode = () =>
  Array.from({ length: 5 }, () => "abcdefghijkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 32)]).join("");

export default function PongPage() {
  const [phase, setPhase] = useState<Phase>("connecting");
  const [role, setRole] = useState<"host" | "guest">("host");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [winner, setWinner] = useState<0 | 1 | null>(null);

  const roleRef = useRef<"host" | "guest">("host");
  const chRef = useRef<RealtimeChannel | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // игровое состояние в ref'ах (без ре-рендера на кадр)
  const p1y = useRef(H / 2 - PADDLE_H / 2); // левая (хост)
  const p2y = useRef(H / 2 - PADDLE_H / 2); // правая (гость)
  const ball = useRef({ x: W / 2, y: H / 2, vx: 0, vy: 0 });
  const sc = useRef<[number, number]>([0, 0]);
  const phaseRef = useRef<Phase>("connecting");
  const myY = useRef(H / 2 - PADDLE_H / 2);
  const bothRef = useRef(false);

  const setPhaseBoth = (p: Phase) => { phaseRef.current = p; setPhase(p); };

  function serve(dir: number) {
    ball.current = { x: W / 2, y: H / 2, vx: dir * 5, vy: (Math.random() * 2 - 1) * 3.2 };
  }

  // подключение
  useEffect(() => {
    const sb = createClient(SB_URL, SB_KEY, { realtime: { params: { eventsPerSecond: 40 } } });
    const params = new URLSearchParams(window.location.search);
    let code = params.get("s") || "";
    const r: "host" | "guest" = code ? "guest" : "host";
    roleRef.current = r; setRole(r);
    if (!code) { code = rndCode(); setShareUrl(`${window.location.origin}/secret/pong?s=${code}`); }

    const ch = sb.channel(`pong-${code}`, {
      config: { broadcast: { self: false }, presence: { key: r } },
    });
    chRef.current = ch;

    ch.on("broadcast", { event: "state" }, ({ payload }) => {
      // гость принимает авторитетное состояние
      if (roleRef.current !== "guest") return;
      ball.current.x = payload.bx; ball.current.y = payload.by;
      p1y.current = payload.p1y;
      sc.current = [payload.s1, payload.s2];
      setScore([payload.s1, payload.s2]);
      if (payload.phase) setPhaseBoth(payload.phase);
      if (payload.winner === 0 || payload.winner === 1) setWinner(payload.winner);
    });
    ch.on("broadcast", { event: "paddle" }, ({ payload }) => {
      if (roleRef.current !== "host") return;
      p2y.current = payload.y;
    });
    ch.on("broadcast", { event: "rematch" }, () => {
      if (roleRef.current === "host") startMatch();
    });
    ch.on("presence", { event: "sync" }, () => {
      const n = Object.keys(ch.presenceState()).length;
      const both = n >= 2;
      bothRef.current = both;
      if (!both && phaseRef.current === "playing") setPhaseBoth("waiting");
      if (both && roleRef.current === "host" && (phaseRef.current === "waiting" || phaseRef.current === "connecting")) {
        startMatch();
      }
      if (both && roleRef.current === "guest" && phaseRef.current === "connecting") setPhaseBoth("waiting");
    });

    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        ch.track({ at: Date.now() });
        setPhaseBoth("waiting");
      }
    });

    return () => { ch.unsubscribe(); sb.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startMatch() {
    sc.current = [0, 0]; setScore([0, 0]); setWinner(null);
    p1y.current = H / 2 - PADDLE_H / 2; p2y.current = H / 2 - PADDLE_H / 2;
    serve(Math.random() < 0.5 ? 1 : -1);
    setPhaseBoth("playing");
  }

  // игровой цикл + ввод + отрисовка
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0, lastSend = 0;
    const keys: Record<string, boolean> = {};

    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (["ArrowUp", "ArrowDown", "w", "s", "W", "S"].includes(e.key)) { keys[e.key.toLowerCase()] = down; e.preventDefault(); }
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);

    const pointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const y = ((e.clientY - rect.top) / rect.height) * H;
      myY.current = Math.max(0, Math.min(H - PADDLE_H, y - PADDLE_H / 2));
    };
    canvas.addEventListener("pointermove", pointer);
    canvas.addEventListener("pointerdown", pointer);

    const draw = () => {
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      // центральная пунктирная линия
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      for (let y = 8; y < H; y += 32) ctx.fillRect(W / 2 - 2, y, 4, 18);
      // ракетки
      ctx.fillStyle = "#A6FF00";
      ctx.fillRect(MARGIN, p1y.current, PADDLE_W, PADDLE_H);
      ctx.fillRect(W - MARGIN - PADDLE_W, p2y.current, PADDLE_W, PADDLE_H);
      // мяч
      ctx.fillStyle = "#fff";
      ctx.fillRect(ball.current.x - BALL / 2, ball.current.y - BALL / 2, BALL, BALL);
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const host = roleRef.current === "host";

      // мой ввод (клавиши)
      const speed = 7;
      let me = host ? p1y.current : p2y.current;
      if (keys["arrowup"] || keys["w"]) me -= speed;
      if (keys["arrowdown"] || keys["s"]) me += speed;
      // указатель имеет приоритет, если двигали
      if (Math.abs(myY.current - (host ? p1y.current : p2y.current)) > 0.5) me = myY.current;
      me = Math.max(0, Math.min(H - PADDLE_H, me));
      if (host) { p1y.current = me; myY.current = me; } else { p2y.current = me; myY.current = me; }

      if (host && phaseRef.current === "playing") {
        const b = ball.current;
        b.x += b.vx; b.y += b.vy;
        if (b.y < BALL / 2) { b.y = BALL / 2; b.vy *= -1; }
        if (b.y > H - BALL / 2) { b.y = H - BALL / 2; b.vy *= -1; }
        // левая ракетка
        if (b.vx < 0 && b.x - BALL / 2 < MARGIN + PADDLE_W && b.x > MARGIN &&
            b.y > p1y.current && b.y < p1y.current + PADDLE_H) {
          b.x = MARGIN + PADDLE_W + BALL / 2; b.vx = Math.abs(b.vx) * 1.06;
          b.vy += ((b.y - (p1y.current + PADDLE_H / 2)) / (PADDLE_H / 2)) * 2.2;
        }
        // правая ракетка
        if (b.vx > 0 && b.x + BALL / 2 > W - MARGIN - PADDLE_W && b.x < W - MARGIN &&
            b.y > p2y.current && b.y < p2y.current + PADDLE_H) {
          b.x = W - MARGIN - PADDLE_W - BALL / 2; b.vx = -Math.abs(b.vx) * 1.06;
          b.vy += ((b.y - (p2y.current + PADDLE_H / 2)) / (PADDLE_H / 2)) * 2.2;
        }
        // голы
        if (b.x < -BALL) { sc.current[1]++; setScore([sc.current[0], sc.current[1]]); goalReset(-1); }
        else if (b.x > W + BALL) { sc.current[0]++; setScore([sc.current[0], sc.current[1]]); goalReset(1); }
      }

      // отправка по сети ~30 Гц
      const ch = chRef.current;
      if (ch && t - lastSend > 33) {
        lastSend = t;
        if (host) {
          ch.send({ type: "broadcast", event: "state", payload: {
            bx: ball.current.x, by: ball.current.y, p1y: p1y.current,
            s1: sc.current[0], s2: sc.current[1], phase: phaseRef.current,
            winner: phaseRef.current === "over" ? (sc.current[0] > sc.current[1] ? 0 : 1) : null,
          }});
        } else {
          ch.send({ type: "broadcast", event: "paddle", payload: { y: p2y.current } });
        }
      }
      draw();
    };

    function goalReset(lastDir: number) {
      if (sc.current[0] >= WIN_SCORE || sc.current[1] >= WIN_SCORE) {
        const w = sc.current[0] > sc.current[1] ? 0 : 1;
        setWinner(w); setPhaseBoth("over");
        ball.current.vx = 0; ball.current.vy = 0;
        return;
      }
      serve(-lastDir);
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

  const youLabel = role === "host" ? "ты слева (зелёная)" : "ты справа (зелёная справа)";

  return (
    <main className="relative bg-black text-white overflow-y-auto flex flex-col items-center px-4 pt-[72px] pb-12" style={{ minHeight: "100dvh" }}>
      <div className="relative z-[1] w-full max-w-[840px] mx-auto flex flex-col items-center text-center">
        <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-3">Пинг-понг · вдвоём</p>

        <div className="flex items-center justify-center gap-10 mb-3 font-p95 tabular-nums" style={{ fontSize: "clamp(28px,6vw,44px)" }}>
          <span className={winner === 0 ? "text-[#A6FF00]" : "text-white"}>{score[0]}</span>
          <span className="text-white/20 text-2xl">:</span>
          <span className={winner === 1 ? "text-[#A6FF00]" : "text-white"}>{score[1]}</span>
        </div>

        <div className="relative w-full" style={{ maxWidth: W }}>
          <canvas ref={canvasRef} width={W} height={H}
            className="w-full h-auto rounded-lg border border-white/10 touch-none select-none"
            style={{ aspectRatio: `${W}/${H}`, background: "#000" }} />

          {phase !== "playing" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg px-6 text-center">
              {phase === "connecting" ? <p className="text-white/60 text-sm">Подключаюсь…</p> : null}

              {phase === "waiting" ? (
                role === "host" ? (
                  <>
                    <p className="text-[15px] text-white/80 mb-1">Жду соперника</p>
                    <p className="text-[13px] text-white/45 mb-5 max-w-xs">Кинь ссылку другу — игра начнётся, когда он откроет.</p>
                    <button type="button" onClick={copy}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[13px] tracking-[0.1em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors">
                      <span className="leading-none translate-y-[1px]">{copied ? "скопировано" : "копировать ссылку"}</span>
                    </button>
                    {shareUrl ? <p className="mt-3 text-[11px] text-white/30 break-all max-w-xs">{shareUrl}</p> : null}
                  </>
                ) : (
                  <p className="text-white/70 text-sm">Готов. Ждём, пока хост начнёт…</p>
                )
              ) : null}

              {phase === "over" ? (
                <>
                  <p className="font-p95 uppercase tracking-tight text-[#A6FF00] mb-3" style={{ fontSize: "clamp(28px,7vw,48px)" }}>
                    {winner === (role === "host" ? 0 : 1) ? "Ты выиграл" : "Ты проиграл"}
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

        <p className="mt-4 text-[12px] text-white/40">{youLabel} · двигай мышью/пальцем или ↑↓ (W/S). До {WIN_SCORE}.</p>

        <Link href="/" className="mt-8 inline-flex items-center gap-1.5 text-[13px] text-white/30 hover:text-white/60 transition-colors no-underline">
          <ArrowLeft className="w-3 h-3" strokeWidth={2.2} /> На главную
        </Link>
      </div>
    </main>
  );
}

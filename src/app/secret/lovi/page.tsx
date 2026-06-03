"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";
import type Matter from "matter-js";

/**
 * Загадка №3 — «Откопай» (на время).
 *
 * Честная цель: под пилюлями слабо светится выход — доберись до него.
 * Подвох (жёсткий гейт, в духе серии — как «выиграй за рамкой» в крестиках):
 * руками не выкопать — пилюли сыплются быстрее, чем расчищаешь. Сработает только
 * «перевернуть всё»:
 *   - десктоп: Пробел / ↑ — переворачивает гравитацию (пилюли улетают вверх);
 *   - мобайл: наклонить/перевернуть телефон (гироскоп).
 * Как только центр снизу расчищен — экран «Откопал», время → лидерборд.
 *
 * Резайз: сцена Matter корректно пересобирается на изменение размера (дебаунс).
 */

type LbEntry = { name: string; timeMs: number; at: number };

const SB_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hvkygaghhxgaolxemndr.supabase.co";
const SB_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a3lnYWdoaHhnYW9seGVtbmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDYwNjAsImV4cCI6MjA5NDg4MjA2MH0.IoRNKO3Jb51k1XA2y7-Q-PSaxpPhBj56G1SZJaKKau4";
const hasSupabase = Boolean(SB_URL && SB_KEY);
const SB_TABLE = "leaderboard_catch";
const LB_KEY = "secret_lovi_leaderboard_v1";

type SbRow = { name: string; time_ms: number; created_at: string };
const rowToEntry = (r: SbRow): LbEntry => ({
  name: r.name,
  timeMs: r.time_ms,
  at: Date.parse(r.created_at) || 0,
});

function loadLocal(): LbEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LB_KEY);
    const arr = raw ? (JSON.parse(raw) as LbEntry[]) : [];
    if (!Array.isArray(arr)) return [];
    return [...arr].sort((a, b) => a.timeMs - b.timeMs).slice(0, 10);
  } catch {
    return [];
  }
}

function saveLocal(entry: LbEntry): LbEntry[] {
  if (typeof window === "undefined") return [entry];
  try {
    const raw = window.localStorage.getItem(LB_KEY);
    const arr = raw ? (JSON.parse(raw) as LbEntry[]) : [];
    const next = [...(Array.isArray(arr) ? arr : []), entry]
      .sort((a, b) => a.timeMs - b.timeMs)
      .slice(0, 50);
    window.localStorage.setItem(LB_KEY, JSON.stringify(next));
    return next.slice(0, 10);
  } catch {
    return [entry];
  }
}

async function loadBoard(): Promise<LbEntry[]> {
  if (!hasSupabase) return loadLocal();
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/${SB_TABLE}?select=name,time_ms,created_at&order=time_ms.asc&limit=10`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: "no-store" }
    );
    if (!res.ok) throw new Error("sb");
    const rows = (await res.json()) as SbRow[];
    return rows.map(rowToEntry);
  } catch {
    return loadLocal();
  }
}

async function saveScore(
  entry: LbEntry
): Promise<{ entries: LbEntry[]; atKey: number }> {
  if (!hasSupabase) return { entries: saveLocal(entry), atKey: entry.at };
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${SB_TABLE}`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ name: entry.name, time_ms: entry.timeMs }),
    });
    if (!res.ok) throw new Error("sb");
    const inserted = (await res.json()) as SbRow[];
    const atKey = inserted[0]?.created_at ? Date.parse(inserted[0].created_at) : entry.at;
    return { entries: await loadBoard(), atKey };
  } catch {
    return { entries: saveLocal(entry), atKey: entry.at };
  }
}

function fmtTime(ms: number): string {
  return `${(ms / 1000).toFixed(1)} с`;
}

function celebrate() {
  const colors = ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"];
  confetti({ particleCount: 120, spread: 100, startVelocity: 45, origin: { y: 0.62 }, colors, disableForReducedMotion: true });
  setTimeout(() => confetti({ particleCount: 70, spread: 120, origin: { x: 0.25, y: 0.5 }, colors, disableForReducedMotion: true }), 200);
  setTimeout(() => confetti({ particleCount: 70, spread: 120, origin: { x: 0.75, y: 0.5 }, colors, disableForReducedMotion: true }), 360);
}

export default function SecretLoviPage() {
  const hostRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<"play" | "done">("play");
  const [elapsed, setElapsed] = useState(0);
  const [winMs, setWinMs] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [tiltReady, setTiltReady] = useState(false);

  const [entries, setEntries] = useState<LbEntry[]>([]);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [youAt, setYouAt] = useState<number | null>(null);

  const startRef = useRef<number | null>(null);
  const revealedRef = useRef(false);
  const buriedRef = useRef(false);
  const requestTiltRef = useRef<null | (() => void)>(null);
  const finishRef = useRef<() => void>(() => {});

  finishRef.current = () => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    const ms = Date.now() - (startRef.current ?? Date.now());
    setWinMs(ms);
    setElapsed(ms);
    setPhase("done");
    celebrate();
    loadBoard().then(setEntries);
  };

  // Живой таймер
  useEffect(() => {
    if (phase !== "play") return;
    const id = window.setInterval(() => {
      if (startRef.current != null && !revealedRef.current) setElapsed(Date.now() - startRef.current);
    }, 100);
    return () => window.clearInterval(id);
  }, [phase]);

  // Подсказка, если буря давно, а игрок не догадался
  useEffect(() => {
    if (phase !== "play") return;
    const id = window.setInterval(() => {
      if (buriedRef.current && !revealedRef.current && startRef.current && Date.now() - startRef.current > 11000) {
        setHint(true);
      }
    }, 800);
    return () => window.clearInterval(id);
  }, [phase]);

  // === Matter.js сцена (с корректной пересборкой на резайз) ===
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setIsTouch(window.matchMedia("(hover: none)").matches);

    let cancelled = false;
    let teardownAll: (() => void) | null = null;

    import("matter-js").then((mod) => {
      if (cancelled || !host) return;
      const M = (mod.default ?? mod) as typeof import("matter-js");

      let sceneTeardown: (() => void) | null = null;
      let resizeTimer: ReturnType<typeof setTimeout> | null = null;
      let lastW = 0;
      let lastH = 0;

      // ---- одна постройка сцены под текущий размер ----
      const buildScene = (w: number, h: number): (() => void) => {
        const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events, Query, Body } = M;

        const engine = Engine.create();
        const G = 1.1;
        engine.gravity.y = G;

        const render = Render.create({
          element: host,
          engine,
          options: { width: w, height: h, wireframes: false, background: "transparent", pixelRatio: window.devicePixelRatio || 1 },
        });
        Render.run(render);
        const runner = Runner.create();
        Runner.run(runner, engine);

        const wallOpts = { isStatic: true, render: { visible: false } };
        const left = Bodies.rectangle(-40, h / 2, 80, h * 4, wallOpts);
        const right = Bodies.rectangle(w + 40, h / 2, 80, h * 4, wallOpts);
        const floor = Bodies.rectangle(w / 2, h + 40, w + 160, 80, wallOpts);
        Composite.add(engine.world, [left, right, floor]);

        const mobile = w < 768;
        const pillW = Math.min(58, Math.max(38, Math.round(w * 0.1)));
        const pillH = Math.max(16, Math.round(pillW * 0.4));
        const CAP = mobile ? 56 : 82;

        const pills: Matter.Body[] = [];
        const spawnPill = () => {
          const x = pillW + Math.random() * (w - 2 * pillW);
          const p = Bodies.rectangle(x, -pillH - Math.random() * 60, pillW, pillH, {
            chamfer: { radius: pillH / 2 },
            density: 0.0016,
            restitution: 0.2,
            friction: 0.18,
            frictionAir: 0.006,
            angle: Math.random() * Math.PI,
            render: { fillStyle: "#A6FF00", strokeStyle: "rgba(0,0,0,0.35)", lineWidth: 1 },
          });
          pills.push(p);
          Composite.add(engine.world, p);
          if (startRef.current === null) startRef.current = Date.now();
        };

        // непрерывный дождь: держим ~CAP пилюль (руками не выкопать)
        const spawnId = window.setInterval(() => {
          if (revealedRef.current) return;
          if (pills.length < CAP) spawnPill();
        }, 95);

        // зона «под завалом» — центр снизу
        const zoneHalf = Math.max(90, Math.round(w * 0.16));
        const zoneTop = h - Math.max(120, Math.round(h * 0.16));
        const inZone = (b: Matter.Body) =>
          b.position.x > w / 2 - zoneHalf && b.position.x < w / 2 + zoneHalf && b.position.y > zoneTop;

        const checkId = window.setInterval(() => {
          if (revealedRef.current) return;
          // убрать улетевшие за пределы
          for (let i = pills.length - 1; i >= 0; i--) {
            const p = pills[i];
            if (p.position.y > h + 500 || p.position.y < -1000 || p.position.x < -500 || p.position.x > w + 500) {
              Composite.remove(engine.world, p);
              pills.splice(i, 1);
            }
          }
          const inZ = pills.reduce((n, b) => n + (inZone(b) ? 1 : 0), 0);
          if (inZ >= 5) buriedRef.current = true;
          if (buriedRef.current && inZ === 0) finishRef.current();
        }, 200);

        // мышь: тащить и швырять; тап без движения — лёгкий толчок (не «ловится»)
        const mouse = Mouse.create(render.canvas);
        const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
        Composite.add(engine.world, mc);
        let downPos = { x: 0, y: 0 };
        Events.on(mc, "mousedown", () => { downPos = { x: mouse.position.x, y: mouse.position.y }; });
        Events.on(mc, "mouseup", () => {
          if (Math.hypot(mouse.position.x - downPos.x, mouse.position.y - downPos.y) < 6) {
            const hit = Query.point(pills, mouse.position)[0];
            if (hit) Body.applyForce(hit, hit.position, { x: (Math.random() - 0.5) * 0.04, y: -0.05 });
          }
        });

        // десктоп: ↑ / Пробел — перевернуть гравитацию (пока зажато)
        const onKeyDown = (e: KeyboardEvent) => {
          if (e.code === "ArrowUp" || e.code === "Space") { e.preventDefault(); engine.gravity.y = -G; }
        };
        const onKeyUp = (e: KeyboardEvent) => {
          if (e.code === "ArrowUp" || e.code === "Space") engine.gravity.y = G;
        };
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);

        // мобайл: гироскоп → вектор гравитации
        const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
        const onOrient = (e: DeviceOrientationEvent) => {
          const gamma = e.gamma ?? 0;
          const beta = e.beta ?? 0;
          engine.gravity.x = clamp(Math.sin((gamma * Math.PI) / 180), -1, 1) * G;
          engine.gravity.y = clamp(Math.cos((beta * Math.PI) / 180), -1, 1) * G;
        };
        const DOE = (typeof window !== "undefined" ? window.DeviceOrientationEvent : undefined) as unknown as {
          requestPermission?: () => Promise<string>;
        } | undefined;
        const touch = window.matchMedia("(hover: none)").matches;
        const enableTilt = () => {
          if (DOE && typeof DOE.requestPermission === "function") {
            DOE.requestPermission().then((res) => {
              if (res === "granted") window.addEventListener("deviceorientation", onOrient);
            }).catch(() => {});
          } else {
            window.addEventListener("deviceorientation", onOrient);
          }
          setTiltReady(false);
        };
        if (touch) {
          if (DOE && typeof DOE.requestPermission === "function") {
            requestTiltRef.current = enableTilt;
            setTiltReady(true);
          } else {
            window.addEventListener("deviceorientation", onOrient);
          }
        }

        return () => {
          window.clearInterval(spawnId);
          window.clearInterval(checkId);
          window.removeEventListener("keydown", onKeyDown);
          window.removeEventListener("keyup", onKeyUp);
          window.removeEventListener("deviceorientation", onOrient);
          Render.stop(render);
          Runner.stop(runner);
          render.canvas.remove();
          Engine.clear(engine);
        };
      };

      // ждём, пока контейнер получит размеры
      const startScene = () => {
        if (cancelled || !host) return;
        const w = host.clientWidth;
        const h = host.clientHeight;
        if (w < 10 || h < 10) { requestAnimationFrame(startScene); return; }
        lastW = w; lastH = h;
        sceneTeardown = buildScene(w, h);
      };
      startScene();

      const onResize = () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (cancelled || !host || revealedRef.current) return;
          const w = host.clientWidth;
          const h = host.clientHeight;
          if (Math.abs(w - lastW) < 48 && Math.abs(h - lastH) < 48) return;
          // корректная пересборка под новый размер; прогресс бури сбрасываем
          sceneTeardown?.();
          buriedRef.current = false;
          startRef.current = null;
          setHint(false);
          lastW = w; lastH = h;
          sceneTeardown = buildScene(w, h);
        }, 250);
      };
      window.addEventListener("resize", onResize);

      teardownAll = () => {
        window.removeEventListener("resize", onResize);
        if (resizeTimer) clearTimeout(resizeTimer);
        sceneTeardown?.();
      };
    });

    return () => {
      cancelled = true;
      teardownAll?.();
    };
  }, []);

  async function submitScore() {
    if (submitting || submitted || winMs == null) return;
    setSubmitting(true);
    const entry: LbEntry = { name: (name.trim() || "Гость").slice(0, 20), timeMs: winMs, at: Date.now() };
    const { entries: top, atKey } = await saveScore(entry);
    setEntries(top);
    setYouAt(atKey);
    setSubmitted(true);
    setSubmitting(false);
  }

  return (
    <main className="relative bg-black text-white overflow-hidden flex flex-col" style={{ minHeight: "100dvh" }}>
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(166,255,0,0.08), transparent 60%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(201,166,107,0.08), transparent 70%)",
        }}
      />

      {/* Слабое свечение «выхода» под завалом — z-0, пилюли (канва z-1) перекрывают его */}
      {phase === "play" && (
        <div aria-hidden className="absolute left-1/2 bottom-[6%] z-0 -translate-x-1/2 pointer-events-none">
          <div className="w-40 h-40 rounded-full bg-[#A6FF00]/25 blur-2xl animate-pulse" />
        </div>
      )}

      {/* HUD */}
      <div className="relative z-[2] pt-[88px] px-5 text-center pointer-events-none">
        <p className="font-p95 text-[12px] md:text-[13px] tracking-[0.25em] uppercase text-white/40 mb-3">
          Загадка №3
        </p>
        {phase === "play" && (
          <>
            <h1 className="font-p95 leading-[0.95] uppercase tracking-tight mb-3" style={{ fontSize: "clamp(28px, 5vw, 48px)" }}>
              Откопай выход
            </h1>
            <p className="text-[13px] md:text-sm text-white/55 leading-relaxed max-w-md mx-auto">
              Под пилюлями что-то светится. Доберись до него — на время.
            </p>
            <div className="mt-3 text-[#A6FF00] tabular-nums text-sm md:text-[15px]">{fmtTime(elapsed)}</div>
            <p className="mt-4 text-[13px] text-[#C9A66B]/85 transition-opacity duration-700" style={{ opacity: hint ? 1 : 0 }}>
              {isTouch ? "Руками не успеваешь. Переверни телефон." : "Руками не успеваешь. Переверни всё — Пробел или ↑."}
            </p>
          </>
        )}
      </div>

      {/* Поле Matter */}
      <div ref={hostRef} className="absolute inset-0 z-[1] select-none touch-none" aria-hidden />

      {/* iOS: жест для гироскопа */}
      {tiltReady && phase === "play" && (
        <button
          type="button"
          onClick={() => requestTiltRef.current?.()}
          className="absolute z-[3] left-1/2 -translate-x-1/2 bottom-6 px-5 py-2.5 rounded-full border border-white/20 bg-black/60 text-white/70 text-[13px] tracking-[0.1em] uppercase backdrop-blur-sm"
        >
          Разрешить наклон
        </button>
      )}

      {/* Победа */}
      {phase === "done" && (
        <div className="absolute inset-0 z-[5] flex items-start justify-center px-5 pt-[96px] pb-12 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-[420px] mx-auto flex flex-col items-center text-center">
            <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-4">Под завалом был выход</p>
            <h1 className="font-p95 leading-none uppercase tracking-tight text-[#A6FF00] mb-4" style={{ fontSize: "clamp(40px, 11vw, 76px)" }}>
              Откопал
            </h1>
            <p className="text-sm text-white/55 mb-1">Ловить было незачем — надо было перевернуть.</p>
            <p className="text-[15px] text-white/80 mb-8">
              Время: <span className="text-[#A6FF00] tabular-nums">{winMs != null ? fmtTime(winMs) : ""}</span>
            </p>

            {!submitted ? (
              <div className="w-full flex flex-col sm:flex-row items-stretch gap-2.5 mb-8">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitScore(); }}
                  maxLength={20}
                  placeholder="Твоё имя"
                  aria-label="Имя для таблицы лидеров"
                  className="flex-1 bg-white/[0.06] border border-white/15 rounded-full px-5 py-3 text-[15px] text-white text-center sm:text-left placeholder:text-white/35 outline-none focus:border-[#A6FF00]/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={submitScore}
                  disabled={submitting}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[14px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors disabled:opacity-50"
                >
                  <span className="leading-none translate-y-[1px]">{submitting ? "..." : "Отправить"}</span>
                </button>
              </div>
            ) : null}

            {entries.length > 0 ? (
              <div className="w-full max-w-[360px] mx-auto mb-8">
                <p className="font-p95 text-[11px] tracking-[0.25em] uppercase text-white/35 mb-3">Быстрее всех</p>
                <ol className="text-left">
                  {entries.map((e, i) => {
                    const mine = youAt != null && e.at === youAt;
                    return (
                      <li key={`${e.at}-${i}`} className={`flex items-center gap-3 py-2 border-b border-white/[0.05] ${mine ? "text-[#A6FF00]" : "text-white/80"}`}>
                        <span className="font-p95 tabular-nums text-[13px] w-5 text-white/35">{i + 1}</span>
                        <span className="flex-1 text-[15px] truncate">{e.name}</span>
                        <span className="text-[12px] text-white/45 whitespace-nowrap tabular-nums">{fmtTime(e.timeMs)}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : !submitted ? (
              <p className="text-sm text-white/40 mb-8">Разгадай первым.</p>
            ) : null}

            <Link
              href="/"
              data-ym-goal="quest3_solved"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[14px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors no-underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
              <span className="leading-none translate-y-[1px]">На главную</span>
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import LedText from "@/components/LedText";
import { LedLines } from "@/components/LedBoard";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";
import { useLocale } from "@/lib/useLocale";
import { pick, localizedHref } from "@/lib/i18n";

/**
 * Загадка №3 — «Найди выход» (за краем экрана).
 *
 * Та же ДНК серии («выйди за пределы», как сдвиг шифра за диапазон и крестики за
 * рамкой): цель ясна — найти выход, спрятан только СПОСОБ. Экран кажется почти
 * пустым; на самом деле мир больше кадра. Решение — ТЯНУТЬ экран (drag / колесо /
 * стрелки / свайп) далеко за видимую границу: там светится «ВЫХОД». Дошёл, нажал —
 * время идёт в лидерборд. Никакой физики и ловкости.
 */

type LbEntry = { name: string; timeMs: number; at: number };

const SB_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hvkygaghhxgaolxemndr.supabase.co";
const SB_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a3lnYWdoaHhnYW9seGVtbmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDYwNjAsImV4cCI6MjA5NDg4MjA2MH0.IoRNKO3Jb51k1XA2y7-Q-PSaxpPhBj56G1SZJaKKau4";
const hasSupabase = Boolean(SB_URL && SB_KEY);
const SB_TABLE = "leaderboard_catch";
const LB_KEY = "secret_lovi_leaderboard_v1";

type SbRow = { name: string; time_ms: number; created_at: string };
const rowToEntry = (r: SbRow): LbEntry => ({ name: r.name, timeMs: r.time_ms, at: Date.parse(r.created_at) || 0 });

function loadLocal(): LbEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(window.localStorage.getItem(LB_KEY) || "[]") as LbEntry[];
    return Array.isArray(arr) ? [...arr].sort((a, b) => a.timeMs - b.timeMs).slice(0, 10) : [];
  } catch { return []; }
}
function saveLocal(entry: LbEntry): LbEntry[] {
  if (typeof window === "undefined") return [entry];
  try {
    const arr = JSON.parse(window.localStorage.getItem(LB_KEY) || "[]") as LbEntry[];
    const next = [...(Array.isArray(arr) ? arr : []), entry].sort((a, b) => a.timeMs - b.timeMs).slice(0, 50);
    window.localStorage.setItem(LB_KEY, JSON.stringify(next));
    return next.slice(0, 10);
  } catch { return [entry]; }
}
async function loadBoard(): Promise<LbEntry[]> {
  if (!hasSupabase) return loadLocal();
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${SB_TABLE}?select=name,time_ms,created_at&order=time_ms.asc&limit=10`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: "no-store",
    });
    if (!res.ok) throw new Error("sb");
    return ((await res.json()) as SbRow[]).map(rowToEntry);
  } catch { return loadLocal(); }
}
async function saveScore(entry: LbEntry): Promise<{ entries: LbEntry[]; atKey: number }> {
  if (!hasSupabase) return { entries: saveLocal(entry), atKey: entry.at };
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${SB_TABLE}`, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ name: entry.name, time_ms: entry.timeMs }),
    });
    if (!res.ok) throw new Error("sb");
    const ins = (await res.json()) as SbRow[];
    const atKey = ins[0]?.created_at ? Date.parse(ins[0].created_at) : entry.at;
    return { entries: await loadBoard(), atKey };
  } catch { return { entries: saveLocal(entry), atKey: entry.at }; }
}

const fmtTime = (ms: number, locale: "ru" | "en" = "ru") => `${(ms / 1000).toFixed(1)} ${locale === "en" ? "s" : "с"}`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function celebrate() {
  const colors = ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"];
  confetti({ particleCount: 120, spread: 100, startVelocity: 45, origin: { y: 0.62 }, colors, disableForReducedMotion: true });
  setTimeout(() => confetti({ particleCount: 70, spread: 120, origin: { x: 0.25, y: 0.5 }, colors, disableForReducedMotion: true }), 200);
  setTimeout(() => confetti({ particleCount: 70, spread: 120, origin: { x: 0.75, y: 0.5 }, colors, disableForReducedMotion: true }), 360);
}

type Star = { x: number; y: number; r: number; o: number };

export default function SecretLoviPage() {
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<"play" | "done">("play");
  const [elapsed, setElapsed] = useState(0);
  const [winMs, setWinMs] = useState<number | null>(null);
  const [hintMove, setHintMove] = useState(false);
  const [ui, setUi] = useState({ angle: 0, dist: 1, moved: false, near: false });

  const [entries, setEntries] = useState<LbEntry[]>([]);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [youAt, setYouAt] = useState<number | null>(null);

  // Геометрия мира (px от центра). Вычисляется на маунте под размер экрана.
  const exitRef = useRef({ x: 0, y: 0 });
  const sizeRef = useRef({ w: 0, h: 0 });
  const camRef = useRef({ x: 0, y: 0 });
  const startRef = useRef<number | null>(null);
  const solvedRef = useRef(false);
  const movedRef = useRef(false);
  const [stars, setStars] = useState<Star[]>([]);

  const applyCam = () => {
    if (worldRef.current) worldRef.current.style.transform = `translate3d(${camRef.current.x}px, ${camRef.current.y}px, 0)`;
  };

  const uiRaf = useRef<number | null>(null);
  const syncUi = () => {
    if (uiRaf.current != null) return;
    uiRaf.current = requestAnimationFrame(() => {
      uiRaf.current = null;
      const ex = exitRef.current;
      const cx = ex.x + camRef.current.x; // вектор от центра экрана к выходу
      const cy = ex.y + camRef.current.y;
      const dist = Math.hypot(cx, cy);
      const { w, h } = sizeRef.current;
      const near = dist < Math.min(w, h) * 0.5;
      setUi({ angle: Math.atan2(cy, cx), dist, moved: movedRef.current, near });
    });
  };

  const pan = (dx: number, dy: number) => {
    if (solvedRef.current) return;
    const ex = exitRef.current;
    const { w, h } = sizeRef.current;
    const mx = Math.max(0.7 * w, 200);
    const my = Math.max(0.7 * h, 200);
    // чтобы выход (ex) можно было вывести в центр, нужно camX=-ex.x, camY=-ex.y.
    // границы строим вокруг диапазона [0 .. target] с запасом — под любое направление.
    const tx = -ex.x, ty = -ex.y;
    camRef.current.x = clamp(camRef.current.x + dx, Math.min(0, tx) - mx, Math.max(0, tx) + mx);
    camRef.current.y = clamp(camRef.current.y + dy, Math.min(0, ty) - my, Math.max(0, ty) + my);
    applyCam();
    if (startRef.current === null) startRef.current = Date.now();
    if (!movedRef.current) { movedRef.current = true; setHintMove(false); }
    syncUi();
  };

  function solve() {
    if (solvedRef.current) return;
    solvedRef.current = true;
    const ms = Date.now() - (startRef.current ?? Date.now());
    setWinMs(ms);
    setElapsed(ms);
    setPhase("done");
    celebrate();
    loadBoard().then(setEntries);
  }

  // Инициализация геометрии + слушатели ввода
  useEffect(() => {
    const measure = () => ({ w: window.innerWidth, h: window.innerHeight });
    const { w, h } = measure();
    sizeRef.current = { w, h };
    // выход — далеко вверх-вправо (~2.4 экрана вправо, ~1.7 вверх)
    exitRef.current = { x: Math.round(w * 2.4), y: -Math.round(h * 1.7) };

    // звёздное поле — покрывает область от центра до выхода с запасом
    const ex = exitRef.current;
    const spanX = Math.abs(ex.x) + w * 1.2;
    const spanY = Math.abs(ex.y) + h * 1.2;
    const count = 150;
    const arr: Star[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.round((Math.random() * 2 - 0.4) * spanX), // смещено к + (в сторону выхода)
        y: Math.round((Math.random() * 2 - 1.6) * spanY * 0.5),
        r: Math.random() < 0.85 ? 1 : 2,
        o: 0.12 + Math.random() * 0.4,
      });
    }
    setStars(arr);
    setReady(true);
    applyCam();
    syncUi();

    const onResize = () => {
      sizeRef.current = measure();
      // переклампим камеру под новый размер (геометрию выхода не трогаем)
      pan(0, 0);
    };
    window.addEventListener("resize", onResize);

    const onKey = (e: KeyboardEvent) => {
      const step = 90;
      if (e.key === "ArrowRight") { e.preventDefault(); pan(-step, 0); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); pan(step, 0); }
      else if (e.key === "ArrowUp") { e.preventDefault(); pan(0, step); }
      else if (e.key === "ArrowDown") { e.preventDefault(); pan(0, -step); }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      if (uiRaf.current != null) cancelAnimationFrame(uiRaf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drag + wheel на контейнере
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !ready) return;

    let dragging = false;
    let last = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement)?.closest?.("[data-exit]")) return; // клик по выходу
      dragging = true;
      last = { x: e.clientX, y: e.clientY };
      el.setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      pan(e.clientX - last.x, e.clientY - last.y);
      last = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging = false;
      el.releasePointerCapture?.(e.pointerId);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      pan(-e.deltaX, -e.deltaY);
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Живой таймер
  useEffect(() => {
    if (phase !== "play") return;
    const id = window.setInterval(() => {
      if (startRef.current != null && !solvedRef.current) setElapsed(Date.now() - startRef.current);
    }, 100);
    return () => window.clearInterval(id);
  }, [phase]);

  // Подсказка «подвигай», если не двигались
  useEffect(() => {
    const id = window.setTimeout(() => { if (!movedRef.current) setHintMove(true); }, 6500);
    return () => window.clearTimeout(id);
  }, []);

  async function submitScore() {
    if (submitting || submitted || winMs == null) return;
    setSubmitting(true);
    const entry: LbEntry = { name: (name.trim() || pick("Гость", "Guest", locale)).slice(0, 20), timeMs: winMs, at: Date.now() };
    const { entries: top, atKey } = await saveScore(entry);
    setEntries(top);
    setYouAt(atKey);
    setSubmitted(true);
    setSubmitting(false);
  }

  const ex = exitRef.current;
  // Пунктирный след от центра к выходу (намёк направления)
  const trail = useMemo(() => {
    if (!ready) return [];
    const dots: { x: number; y: number; o: number }[] = [];
    const steps = 7;
    for (let i = 1; i <= steps; i++) {
      const t = i / (steps + 3);
      dots.push({ x: ex.x * t, y: ex.y * t, o: 0.5 - i * 0.05 });
    }
    return dots;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <main className="relative bg-black text-white overflow-hidden" style={{ height: "100dvh" }}>
      {/* Подсветка фона (фикс, не двигается) */}
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(166,255,0,0.06), transparent 60%)",
      }} />

      {/* Пан-контейнер */}
      <div ref={containerRef} className="absolute inset-0 z-[1] touch-none select-none" style={{ cursor: "grab" }}>
        <div ref={worldRef} className="absolute inset-0 will-change-transform">
          {/* центр-группа: начало координат в центре экрана при cam=0 */}
          <div className="absolute" style={{ left: "50%", top: "50%" }}>
            {ready && (
            <>
            {/* звёзды */}
            {stars.map((s, i) => (
              <span key={i} aria-hidden className="absolute rounded-full bg-white" style={{
                left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, opacity: s.o, transform: "translate(-50%,-50%)",
              }} />
            ))}

            {/* пунктирный след к выходу */}
            {trail.map((d, i) => (
              <span key={`t${i}`} aria-hidden className="absolute rounded-full bg-[#A6FF00]" style={{
                left: d.x, top: d.y, width: 6, height: 6, opacity: d.o, transform: "translate(-50%,-50%)",
                boxShadow: "0 0 8px rgba(166,255,0,0.6)",
              }} />
            ))}

            {/* старт «ты здесь» */}
            <div className="absolute" style={{ left: 0, top: 0, transform: "translate(-50%,-50%)" }}>
              <div className="w-3 h-3 rounded-full bg-white/80" />
              <div className="mt-3 text-white/40 whitespace-nowrap -translate-x-1/2 ml-1.5">
                <span className="sr-only">{pick("ты здесь", "you are here", locale)}</span>
                <LedText text={pick("ты здесь", "you are here", locale)} className="h-[8px] w-auto" />
              </div>
            </div>

            {/* ВЫХОД — далеко за краем */}
            <button
              type="button"
              data-exit
              onClick={solve}
              className="absolute group"
              style={{ left: ex.x, top: ex.y, transform: "translate(-50%,-50%)" }}
              aria-label={pick("Выход", "Exit", locale)}
            >
              <div className="relative flex flex-col items-center">
                <div className="w-28 h-28 rounded-2xl border-2 border-[#A6FF00] bg-[#A6FF00]/10 flex items-center justify-center animate-pulse"
                  style={{ boxShadow: "0 0 60px -8px rgba(166,255,0,0.7)" }}>
                  <span className="text-[#A6FF00]">
                    <span className="sr-only">{pick("Выход", "Exit", locale)}</span>
                    <LedText text={pick("Выход", "Exit", locale)} className="h-[11px] w-auto" />
                  </span>
                </div>
              </div>
            </button>
            </>
            )}
          </div>
        </div>
      </div>

      {/* HUD сверху (фикс) */}
      <div className="absolute top-0 left-0 right-0 z-[2] pt-[88px] px-5 text-center pointer-events-none">
        <p className="text-white/40 mb-3 flex justify-center">
          <span className="sr-only">{pick("Загадка №3", "Riddle #3", locale)}</span>
          <LedText text={pick("Загадка №3", "Riddle #3", locale)} className="h-[9px] w-auto" />
        </p>
        {phase === "play" && (
          <>
            <h1 className="mb-3">
              <LedLines text={pick("Найди выход", "Find the exit", locale)} center maxChars={20} lineClass="h-[17px] md:h-[24px]" />
            </h1>
            {startRef.current != null && <div className="text-[#A6FF00] flex justify-center"><LedText text={fmtTime(elapsed, locale)} className="h-[11px] md:h-[12px] w-auto" /></div>}
            <p className="mt-4 text-[14px] text-[#C9A66B]/85 transition-opacity duration-700" style={{ opacity: hintMove ? 1 : 0 }}>
              {pick("Тут тесно. Потяни экран — мир больше, чем кажется.", "It's cramped here. Drag the screen — the world is bigger than it looks.", locale)}
            </p>
          </>
        )}
      </div>

      {/* Компас к выходу — появляется после первого движения */}
      {phase === "play" && ui.moved && !ui.near && (
        <div className="absolute z-[2] left-1/2 -translate-x-1/2 bottom-10 flex flex-col items-center gap-2 pointer-events-none">
          <div style={{ transform: `rotate(${ui.angle}rad)` }} className="text-[#A6FF00]">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M6 20 H30 M22 12 L32 20 L22 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-white/40">
            <LedText text={ui.dist > Math.max(sizeRef.current.w, sizeRef.current.h) * 1.2 ? pick("далеко", "far", locale) : pick("ближе", "closer", locale)} className="h-[8px] w-auto" />
          </span>
        </div>
      )}

      {/* Победа */}
      {phase === "done" && (
        <div className="absolute inset-0 z-[5] flex items-start justify-center px-5 pt-[96px] pb-12 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-[420px] mx-auto flex flex-col items-center text-center">
            <p className="text-white/40 mb-4">
              <span className="sr-only">{pick("Выход был за краем", "The exit was past the edge", locale)}</span>
              <LedText text={pick("Выход был за краем", "The exit was past the edge", locale)} className="h-[9px] w-auto" />
            </p>
            <h1 className="text-[#A6FF00] mb-4">
              <LedLines text={pick("Нашёл", "Found it", locale)} center maxChars={20} lineClass="h-[26px] md:h-[38px]" />
            </h1>
            <p className="text-[16px] text-white/80 mb-8">
              {pick("Время:", "Time:", locale)} <span className="text-[#A6FF00] tabular-nums">{winMs != null ? fmtTime(winMs, locale) : ""}</span>
            </p>

            {!submitted ? (
              <div className="w-full flex flex-col sm:flex-row items-stretch gap-2.5 mb-8">
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitScore(); }}
                  maxLength={20} placeholder={pick("Твоё имя", "Your name", locale)} aria-label={pick("Имя для таблицы лидеров", "Name for the leaderboard", locale)}
                  className="flex-1 bg-white/[0.06] border border-white/15 rounded-full px-5 py-3 text-[16px] text-white text-center sm:text-left placeholder:text-white/35 outline-none focus:border-[#A6FF00]/60 transition-colors"
                />
                <button type="button" onClick={submitScore} disabled={submitting}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] hover:bg-[#A6FF00] hover:text-black transition-colors disabled:opacity-50">
                  <span className="leading-none translate-y-[1px]">{submitting ? "..." : pick("Отправить", "Submit", locale)}</span>
                </button>
              </div>
            ) : null}

            {entries.length > 0 ? (
              <div className="w-full max-w-[360px] mx-auto mb-8">
                <p className="text-white/35 mb-3">
                  <span className="sr-only">{pick("Быстрее всех", "Fastest", locale)}</span>
                  <LedText text={pick("Быстрее всех", "Fastest", locale)} className="h-[8px] w-auto" />
                </p>
                <ol className="text-left">
                  {entries.map((e, i) => {
                    const mine = youAt != null && e.at === youAt;
                    return (
                      <li key={`${e.at}-${i}`} className={`flex items-center gap-3 py-2 border-b border-white/[0.05] ${mine ? "text-[#A6FF00]" : "text-white/80"}`}>
                        <span className="w-5 text-white/35">
                          <LedText text={String(i + 1)} className="h-[9px] w-auto" />
                        </span>
                        <span className="flex-1 text-[16px] truncate">{e.name}</span>
                        <span className="text-[12px] text-white/45 whitespace-nowrap tabular-nums">{fmtTime(e.timeMs, locale)}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : !submitted ? (<p className="text-sm text-white/40 mb-8">{pick("Разгадай первым.", "Be the first to solve it.", locale)}</p>) : null}

            <Link href={localizedHref("/", locale)} data-ym-goal="quest3_solved"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] hover:bg-[#A6FF00] hover:text-black transition-colors no-underline">
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
              <span className="sr-only">{pick("На главную", "Home", locale)}</span><LedText text={pick("На главную", "Home", locale)} className="h-[10px] w-auto" />
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import confetti from "canvas-confetti";
import Link from "next/link";
import { Send } from "lucide-react";
import SmileFireworksButton from "./SmileFireworksButton";
import LedText from "@/components/LedText";
import { ymGoal } from "@/lib/yandex-metrika";

/* Пиксельный многострочный заголовок: грубый перенос ~22 символа,
   акцент (последний символ) — лаймом, отдельным глифом в конце строки. */
function LedHeadline({ text, accent }: { text: string; accent?: string }) {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > 18 && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? `${cur} ${w}` : w;
    }
  }
  if (cur) lines.push(cur);
  return (
    <span className="flex flex-col gap-[10px] md:gap-[14px]">
      {lines.map((l, i) =>
        i === lines.length - 1 && accent ? (
          <span key={i} className="flex items-end gap-[6px]">
            <LedText text={l} scale={2} dot={1.45} preserve="xMinYMid meet" className="h-[24px] md:h-[42px] w-auto max-w-full min-w-0" />
            <LedText text={accent} scale={2} dot={1.45} className="h-[24px] md:h-[42px] w-auto text-[#A6FF00]" />
          </span>
        ) : (
          <LedText key={i} text={l} scale={2} dot={1.45} preserve="xMinYMid meet" className="h-[24px] md:h-[42px] w-auto max-w-full self-start" />
        ),
      )}
    </span>
  );
}

// ───────────────────────────────────────────────────────────
// Счётчик-табло: форматирование больших чисел (1 234 → 12K → 1,2M).
// ───────────────────────────────────────────────────────────
function formatCount(n: number): string {
  if (n < 100_000) return n.toLocaleString("ru-RU");
  if (n < 1_000_000) return `${Math.floor(n / 1000)}K`;
  const m = n / 1_000_000;
  return m >= 10 ? `${Math.floor(m)}M` : `${m.toFixed(1).replace(".", ",")}M`;
}

// ───────────────────────────────────────────────────────────
// Глобальный счётчик через свой Supabase (проект hvkygaghhxgaolxemndr).
// RPC increment_counter атомарно делает upsert+1 и возвращает новое значение.
// RPC get_counter — стабильное чтение. Никаких потерь и rate-limit, как у abacus.
// На каждый клик: ждём ответ RPC и записываем серверное значение (без оптимистики).
// Чтение раз в 5 сек — на случай если кто-то другой жмёт параллельно.
// ───────────────────────────────────────────────────────────
const KEY = "scroll-thanks-v2";
const SB_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hvkygaghhxgaolxemndr.supabase.co";
const SB_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a3lnYWdoaHhnYW9seGVtbmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDYwNjAsImV4cCI6MjA5NDg4MjA2MH0.IoRNKO3Jb51k1XA2y7-Q-PSaxpPhBj56G1SZJaKKau4";
const RPC_GET_URL = `${SB_URL}/rest/v1/rpc/get_counter`;
const RPC_HIT_URL = `${SB_URL}/rest/v1/rpc/increment_counter`;
const SB_HEADERS = {
  "Content-Type": "application/json",
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
} as const;

// ───────────────────────────────────────────────────────────
// Easter-egg тексты на разных порогах сессии
// ───────────────────────────────────────────────────────────
type Stage = {
  id: string;
  threshold: number;
  // Заголовок может быть строкой (рендерим в одну/несколько строк) либо JSX
  headline: string;
  // accent — кусок, который красится в лайм
  accent?: string;
  // Дополнительная пасхалка (показываем под кнопкой) — на финале
  bonus?: { label: string; href: string };
};

// Порог = число нажатий до фразы. Сколько фраз — столько и кликов до секрета:
// секрет открывается на 5-м нажатии (последняя фраза).
const STAGES: Stage[] = [
  {
    id: "0",
    threshold: 0,
    headline: "Спасибо, что долистали, вот вам ещё кнопка",
    accent: ".",
  },
  {
    id: "1",
    threshold: 1,
    headline: "хехе, ладно, но больше не нажимай",
    accent: ".",
  },
  {
    id: "2",
    threshold: 2,
    headline: "я знал, что ты это сделаешь",
    accent: ".",
  },
  {
    id: "3",
    threshold: 3,
    headline: "Привет, СДВГ. Помни: слабости всегда можно обратить в силу",
    accent: ".",
  },
  {
    id: "4",
    threshold: 4,
    headline: "Можно остановиться. Но зачем",
    accent: ".",
  },
  {
    id: "5",
    threshold: 5,
    headline: "Я рад, что тебе нравится эта кнопка. Возможно тебе понравится и это",
    accent: ".",
    bonus: {
      label: "Открыть",
      href: "/secret",
    },
  },
];

function pickStage(n: number): Stage {
  // Берём максимальный порог, который преодолён
  let active = STAGES[0];
  for (const s of STAGES) {
    if (n >= s.threshold) active = s;
  }
  return active;
}

function pluralize(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "раз";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "раза";
  return "раз";
}

// ───────────────────────────────────────────────────────────
// Фейерверки — несколько случайных паттернов из разных мест экрана
// ───────────────────────────────────────────────────────────
const COLORS = ["#A6FF00", "#C9A66B", "#ffffff", "#A6FF00", "#FFD60A"];

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function fireRandom() {
  // Выбираем один из 6 паттернов случайно
  const pattern = Math.floor(Math.random() * 6);
  const colors = COLORS;

  switch (pattern) {
    case 0: {
      // Снизу слева ↗
      confetti({
        particleCount: 50,
        angle: rand(50, 70),
        spread: 60,
        origin: { x: rand(0, 0.2), y: rand(0.85, 1) },
        colors,
        startVelocity: 60,
        scalar: 0.95,
      });
      return;
    }
    case 1: {
      // Снизу справа ↖
      confetti({
        particleCount: 50,
        angle: rand(110, 130),
        spread: 60,
        origin: { x: rand(0.8, 1), y: rand(0.85, 1) },
        colors,
        startVelocity: 60,
        scalar: 0.95,
      });
      return;
    }
    case 2: {
      // Из случайной точки в центральной зоне — широкий взрыв
      confetti({
        particleCount: 80,
        spread: 360,
        origin: { x: rand(0.25, 0.75), y: rand(0.3, 0.7) },
        colors,
        startVelocity: 35,
        scalar: 1,
      });
      return;
    }
    case 3: {
      // Сверху падает дождь — 3 быстрых залпа
      const xs = [rand(0.1, 0.4), rand(0.4, 0.7), rand(0.6, 0.9)];
      xs.forEach((x, i) =>
        setTimeout(
          () =>
            confetti({
              particleCount: 30,
              angle: 270,
              spread: 40,
              origin: { x, y: -0.05 },
              colors,
              startVelocity: 25,
              gravity: 1.2,
              scalar: 0.9,
            }),
          i * 80,
        ),
      );
      return;
    }
    case 4: {
      // Двойной залп с краёв одновременно
      confetti({
        particleCount: 35,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
        startVelocity: 55,
      });
      confetti({
        particleCount: 35,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
        startVelocity: 55,
      });
      return;
    }
    default: {
      // Точечный «звёздный» взрыв около курсора (центр экрана как fallback)
      confetti({
        particleCount: 60,
        spread: 100,
        origin: { x: rand(0.2, 0.8), y: rand(0.2, 0.8) },
        colors,
        startVelocity: 30,
        scalar: 1.1,
        ticks: 80,
      });
    }
  }
}

function fireMilestone() {
  // Особый «вау-залп» при достижении порога — 3 одновременных взрыва
  const colors = COLORS;
  confetti({
    particleCount: 100,
    angle: 60,
    spread: 80,
    origin: { x: 0, y: 0.8 },
    colors,
    startVelocity: 70,
  });
  confetti({
    particleCount: 100,
    angle: 120,
    spread: 80,
    origin: { x: 1, y: 0.8 },
    colors,
    startVelocity: 70,
  });
  confetti({
    particleCount: 150,
    spread: 360,
    origin: { x: 0.5, y: 0.5 },
    colors,
    startVelocity: 45,
    scalar: 1.2,
  });
}

// ───────────────────────────────────────────────────────────
// Variants для motion
// ───────────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const viewport = { once: true, amount: 0.2 };

// ───────────────────────────────────────────────────────────

export default function FinalCTA() {
  const [globalCount, setGlobalCount] = useState<number | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [pressing, setPressing] = useState(false);
  const lastStageRef = useRef<string>("0");
  const reduced = useReducedMotion();
  // Ref + Observer для цели final_cta_view: фиксируем, что блок попал
  // в viewport ≥ на 20%. Шлём ровно один раз за сессию — чтобы можно было
  // считать конверсию «увидел блок → нажал ≥1» в Метрике.
  const sectionRef = useRef<HTMLElement>(null);
  const viewFiredRef = useRef(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || viewFiredRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !viewFiredRef.current) {
            viewFiredRef.current = true;
            ymGoal("final_cta_view");
            io.disconnect();
          }
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Подгружаем глобальный счётчик при маунте + ресинк раз в 5 сек.
  // Supabase RPC get_counter возвращает чистое bigint (PostgREST: JSON-число).
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(RPC_GET_URL, {
        method: "POST",
        cache: "no-store",
        headers: SB_HEADERS,
        body: JSON.stringify({ p_key: KEY }),
      })
        .then((r) => r.json())
        .then((value: unknown) => {
          if (!cancelled && typeof value === "number") {
            setGlobalCount((prev) =>
              prev == null ? value : Math.max(prev, value),
            );
          }
        })
        .catch(() => {
          if (!cancelled) setGlobalCount((prev) => prev ?? 0);
        });
    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const stage = useMemo(() => pickStage(sessionCount), [sessionCount]);

  // Спецзалп при переходе на новый stage
  useEffect(() => {
    if (stage.id !== lastStageRef.current) {
      // первая инициализация (id "0") — пропускаем
      if (lastStageRef.current !== "0" || stage.id !== "0") {
        if (stage.id !== "0" && !reduced) fireMilestone();
        // Я.Метрика — фиксируем достижение нового stage один раз за сессию.
        // Цели: smile_stage_1 / _15 / _30 / _46. Stage "0" — стартовый,
        // его не считаем достижением.
        if (stage.id !== "0") {
          ymGoal(`smile_stage_${stage.id}`, { count: sessionCount });
        }
      }
      lastStageRef.current = stage.id;
    }
  }, [stage.id, reduced, sessionCount]);

  const onClick = useCallback(() => {
    setPressing(true);
    setTimeout(() => setPressing(false), 120);

    // Локальные счётчики — мгновенно
    setSessionCount((c) => {
      const next = c + 1;
      // Я.Метрика — отдельная цель на самый первый клик в сессии. Удобна как
      // знаменатель конверсии (final_cta_view → smile_first_click) и не путается
      // с интервальным smile_click.
      if (next === 1) {
        ymGoal("smile_first_click");
      }
      // smile_click — только на значимых отметках, чтобы не плодить тысячи
      // событий: 1-й клик, потом каждое 10-е, плюс отдельный на 100-м.
      if (next === 1 || next % 10 === 0 || next === 100) {
        ymGoal("smile_click", { count: next });
      }
      return next;
    });
    setGlobalCount((c) => (c == null ? 1 : c + 1));

    // Фейерверк
    if (!reduced) fireRandom();

    // Серверный инкремент через Supabase RPC. Ждём ответ и подменяем
    // оптимистичную цифру реальным серверным значением: если в это же время
    // кто-то ещё кликал — увидим корректную сумму, без потери.
    fetch(RPC_HIT_URL, {
      method: "POST",
      cache: "no-store",
      headers: SB_HEADERS,
      body: JSON.stringify({ p_key: KEY }),
    })
      .then((r) => r.json())
      .then((value: unknown) => {
        if (typeof value === "number") {
          setGlobalCount((prev) => (prev == null ? value : Math.max(prev, value)));
        }
      })
      .catch(() => {
        /* при сетевой ошибке оптимистическая +1 остаётся, ресинк раз в 5 сек подровняет */
      });
  }, [reduced]);

  return (
    <section ref={sectionRef} className="relative z-[1] bg-black border-t border-white/[0.06]">
      <div className="px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] py-10 md:py-14">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
          className="relative rounded-3xl border border-white/[0.1] bg-gradient-to-br from-[#0c0c0c] via-[#0a0a0a] to-[#080808] overflow-hidden p-7 md:p-10 lg:p-14"
        >
          {/* Точечная сетка — еле заметная, циклично повторяется */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0",
            }}
          />

          {/* Мягкое свечение внутри карточки — поверх сетки */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-80"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 65%, rgba(166,255,0,0.12), transparent 65%), radial-gradient(ellipse 40% 30% at 85% 15%, rgba(201,166,107,0.14), transparent 70%)",
            }}
          />

          <motion.div variants={fadeUp} className="relative mb-5 md:mb-7 flex items-center gap-3">
            <span className="text-[#A6FF00]">
              <span className="sr-only">Поздравляю</span>
              <LedText text="[ Поздравляю ]" className="h-[10px] w-auto" />
            </span>
            {sessionCount > 0 && (
              <span className="text-white/30">
                <span className="sr-only">{`запустили фейерверк ${sessionCount} ${pluralize(sessionCount)}`}</span>
                <LedText
                  text={`· запустили фейерверк ${sessionCount} ${pluralize(sessionCount)}`}
                  className="h-[9px] md:h-[10px] w-auto"
                />
              </span>
            )}
          </motion.div>

          <div className="relative grid md:grid-cols-[1fr_auto] gap-8 md:gap-8 lg:gap-10 md:items-center">
            {/* Левая колонка — заголовок + Telegram-кнопки */}
            <div className="min-w-0">
              {/* Заголовок — меняется по достижении порогов.
                  Grid-стек (оба состояния в одной ячейке): контейнер сам тянется
                  под текущий заголовок. Без фиксированной min-h — иначе длинные
                  заголовки на узких экранах вылезали и перекрывали кнопки. */}
              <div className="grid" style={{ minHeight: "clamp(120px, 15vw, 215px)" }}>
                <AnimatePresence>
                  <motion.h2
                    key={stage.id}
                    initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="[grid-area:1/1] text-white max-w-3xl"
                  >
                    <span className="sr-only">
                      {stage.headline}
                      {stage.accent ?? ""}
                    </span>
                    <LedHeadline text={stage.headline} accent={stage.accent} />
                  </motion.h2>
                </AnimatePresence>
              </div>

              {/* Бонус-кнопка (на финальном пороге) — отдельной строкой в потоке,
                  чтобы не вставать внутрь заголовка и не съезжать на узких. */}
              {stage.bonus ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-4"
                >
                  <Link
                    href={stage.bonus.href}
                    data-ym-goal="secret_open"
                    className="inline-flex items-center gap-1.5 px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] hover:bg-[#A6FF00] hover:text-black transition-colors no-underline"
                  >
                    <span className="sr-only">{stage.bonus.label}</span>
                    <LedText text={stage.bonus.label} className="h-[11px] w-auto" />
                  </Link>
                </motion.div>
              ) : null}

              {/* Telegram + все каналы */}
              <motion.div
                variants={fadeUp}
                className="mt-6 md:mt-8 flex flex-wrap items-center gap-3"
              >
                <SmileFireworksButton
                  onClick={onClick}
                  pressing={pressing}
                  compact
                />
                {sessionCount >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href="https://t.me/aiegorka"
                      target="_blank"
                      data-ym-goal="telegram_channel"
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/20 text-white/85 hover:border-white/50 hover:text-white transition-colors no-underline"
                    >
                      <Send className="w-4 h-4" strokeWidth={2.2} />
                      <span className="sr-only">Подписаться на канал</span>
                      <LedText text="Подписаться на канал" className="h-[11px] w-auto" />
                    </Link>
                  </motion.div>
                )}
              </motion.div>

              {sessionCount >= 2 && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-3 md:mt-4 text-[13px] md:text-[14px] text-white/45 leading-relaxed max-w-md"
                >
                  А ещё, если вам стало интересно — я веду телеграм-канал.
                </motion.p>
              )}
            </div>

            {/* Правая колонка — счётчик: только число, без обвеса */}
            {(() => {
              // Полный номер с разрядами, без сокращений K/M — точное число.
              const display =
                globalCount != null ? globalCount.toLocaleString("ru-RU") : "—";
              // Размер шрифта числа даунгрейдится по длине строки, чтобы
              // длинные числа (1 234 567 / 12 345 678) не вылезали за колонку.
              const len = display.length;
              const numClass =
                len <= 4
                  ? "text-[clamp(80px,11vw,170px)]"
                  : len <= 7
                    ? "text-[clamp(60px,8vw,124px)]"
                    : len <= 10
                      ? "text-[clamp(48px,6vw,92px)]"
                      : "text-[clamp(36px,5vw,68px)]";
              return (
                <motion.div
                  variants={fadeUp}
                  className="flex items-center justify-start md:justify-end w-full md:w-auto shrink-0"
                >
                  <motion.div
                    animate={{ scale: pressing ? 1.05 : 1 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className={`led-counter-num text-[#A6FF00] ${
                      numClass.includes("170")
                        ? "h-[52px] md:h-[84px]"
                        : numClass.includes("124")
                          ? "h-[40px] md:h-[62px]"
                          : "h-[30px] md:h-[46px]"
                    }`}
                    aria-live="polite"
                    aria-label={
                      globalCount != null
                        ? `${globalCount}`
                        : "счётчик загружается"
                    }
                  >
                    {globalCount != null ? (
                      <LedText text={display} scale={2} dot={1.45} className="h-full w-auto" />
                    ) : (
                      <LedText text="—" scale={2} dot={1.45} className="h-full w-auto opacity-20" />
                    )}
                  </motion.div>
                </motion.div>
              );
            })()}
          </div>

        </motion.div>
      </div>
    </section>
  );
}

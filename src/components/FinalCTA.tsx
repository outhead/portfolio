"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import confetti from "canvas-confetti";
import Link from "next/link";
import { Send } from "lucide-react";
import { ymGoal } from "@/lib/yandex-metrika";

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
// Глобальный счётчик через abacus.jasoncameron.dev (без своего бэка).
// На каждый клик — fire-and-forget /hit, локально считаем оптимистично,
// раз в 3 секунды синхронизируемся с сервером (берём max).
// ───────────────────────────────────────────────────────────
const NS = "shugaev-portfolio";
const KEY = "scroll-thanks-v2";
const GET_URL = `https://abacus.jasoncameron.dev/get/${NS}/${KEY}`;
const HIT_URL = `https://abacus.jasoncameron.dev/hit/${NS}/${KEY}`;

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

const STAGES: Stage[] = [
  {
    id: "0",
    threshold: 0,
    headline: "Спасибо, что долистали, вот вам ещё кнопочки",
    accent: ".",
  },
  {
    id: "1",
    threshold: 1,
    headline: "Вы всё ещё можете написать мне в Telegram",
    accent: ".",
  },
  {
    id: "15",
    threshold: 15,
    headline: "Привет, СДВГ. Помни: слабости всегда можно обратить в силу",
    accent: ".",
  },
  {
    id: "30",
    threshold: 30,
    headline: "Можно остановиться. Но зачем",
    accent: ".",
  },
  {
    id: "46",
    threshold: 46,
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

  // Подгружаем глобальный счётчик при маунте + ресинк раз в 5 сек
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(GET_URL, { cache: "no-store" })
        .then((r) => r.json())
        .then((data: { value?: number }) => {
          if (!cancelled && typeof data.value === "number") {
            setGlobalCount((prev) =>
              prev == null ? data.value! : Math.max(prev, data.value!),
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
      // Я.Метрика — шлём smile_click только на значимых отметках, чтобы
      // не плодить тысячи событий: 1-й клик, потом каждое 10-е, плюс
      // разовый «совсем-долго-кликает» на 100. count в параметрах —
      // полезен для отчёта по распределению.
      if (next === 1 || next % 10 === 0 || next === 100) {
        ymGoal("smile_click", { count: next });
      }
      return next;
    });
    setGlobalCount((c) => (c == null ? 1 : c + 1));

    // Фейерверк
    if (!reduced) fireRandom();

    // Серверный hit fire-and-forget
    fetch(HIT_URL, { cache: "no-store" }).catch(() => {
      /* ignore network errors — оптимистичный счётчик уже сработал */
    });
  }, [reduced]);

  return (
    <section className="relative z-[1] bg-black border-t border-white/[0.06]">
      <div className="px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-10 md:py-14">
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
            <span className="font-p95 text-[15px] md:text-[16px] tracking-[0.2em] uppercase text-[#A6FF00]">
              [ Поздравляю ]
            </span>
            {sessionCount > 0 && (
              <span className="font-p95 text-[12px] md:text-[15px] tracking-[0.18em] uppercase text-white/30 tabular-nums">
                · сессия: {sessionCount}
              </span>
            )}
          </motion.div>

          <div className="relative grid md:grid-cols-[1fr_auto] gap-8 md:gap-8 lg:gap-10 md:items-center">
            {/* Левая колонка — заголовок + Telegram-кнопки */}
            <div className="min-w-0">
              {/* Заголовок — меняется по достижении порогов */}
              <div className="relative min-h-[clamp(120px,16vw,240px)]">
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={stage.id}
                    initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 font-p95 text-[clamp(32px,5.5vw,76px)] leading-[0.98] uppercase tracking-tight text-white max-w-3xl"
                  >
                    {stage.headline}
                    {stage.accent ? (
                      <span className="text-[#A6FF00]">{stage.accent}</span>
                    ) : null}
                    {stage.bonus ? (
                      <Link
                        href={stage.bonus.href}
                        data-ym-goal="secret_open"
                        className="inline-flex align-middle items-center gap-1.5 ml-3 md:ml-5 px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[15px] md:text-[15px] tracking-[0.2em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors no-underline"
                      >
                        {stage.bonus.label}
                      </Link>
                    ) : null}
                  </motion.h2>
                </AnimatePresence>
              </div>

              {/* Telegram + все каналы */}
              <motion.div
                variants={fadeUp}
                className="mt-6 md:mt-8 flex flex-wrap items-center gap-3"
              >
                <button
                  type="button"
                  onClick={onClick}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-[#A6FF00]/40 bg-transparent text-[#A6FF00] font-p95 text-[15px] md:text-[16px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors cursor-pointer select-none"
                >
                  Не нажимать
                </button>
                <Link
                  href="https://t.me/aiegorka"
                  target="_blank"
                  data-ym-goal="telegram_channel"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/20 text-white/85 font-p95 text-[15px] md:text-[16px] tracking-[0.12em] uppercase hover:border-white/50 hover:text-white transition-colors no-underline"
                >
                  <Send className="w-4 h-4" strokeWidth={2.2} />
                  Подписаться на канал
                </Link>
              </motion.div>

              <motion.p
                variants={fadeUp}
                className="mt-3 md:mt-4 text-[13px] md:text-[14px] text-white/45 leading-relaxed max-w-md"
              >
                А ещё, если вам стало интересно — я веду телеграм-канал.
              </motion.p>
            </div>

            {/* Правая колонка — крупный счётчик (focal), центрирован по вертикали */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col items-start md:items-center gap-2 md:gap-3 w-full md:w-auto md:min-w-[280px]"
            >
              <motion.div
                animate={{ scale: pressing ? 1.05 : 1 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="relative font-p95 text-[clamp(80px,12vw,180px)] leading-[0.9] uppercase tracking-tight text-white tabular-nums"
                aria-live="polite"
              >
                {globalCount != null ? (
                  formatCount(globalCount)
                ) : (
                  <span className="text-white/15">—</span>
                )}
              </motion.div>
              <div className="font-p95 text-[12px] md:text-[14px] tracking-[0.22em] uppercase text-white/45 leading-none">
                {globalCount != null
                  ? `${pluralize(globalCount)} нажали`
                  : "счётчик…"}
              </div>
            </motion.div>
          </div>

        </motion.div>
      </div>
    </section>
  );
}

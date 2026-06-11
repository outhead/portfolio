"use client";

/* ─────────────────────────────────────────────────────────────────
 * HeroLab — тестовый полигон композиций хиро (/hero/1..4).
 * Не линкуется с сайта, noindex. После выбора варианта — выпилить.
 *
 * 1 — Сфера за текстом: всё по центру, текст поверх частиц
 * 2 — Постер edge-to-edge: без карточки, кегль до упора
 * 3 — Сплит + лента метрик внутри хиро
 * 4 — Заголовок одной строкой + сцена со сферой
 * ──────────────────────────────────────────────────────────────── */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import ParticleSphere from "@/components/ParticleSphere";
import FlippingWord from "@/components/FlippingWord";
import { layoutLedText, LED_ROWS } from "@/components/ledFont";

const WORDS = ["ЛЮДЕЙ", "КОМАНДЫ", "ВИЗУАЛ", "СЕРВИСЫ", "ИНТЕРЕС"] as const;

function Ctas({ center = false }: { center?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${center ? "justify-center" : ""}`}>
      <Link
        href="https://t.me/egoradi"
        target="_blank"
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#A6FF00] text-black font-p95 text-[15px] md:text-[16px] tracking-[0.12em] uppercase hover:bg-white transition-colors no-underline"
      >
        <span className="leading-none translate-y-[1px]">Обсудить проект</span>
        <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
      </Link>
      <Link
        href="/#portfolio"
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/20 text-white/85 font-p95 text-[15px] md:text-[16px] tracking-[0.12em] uppercase hover:border-white/50 hover:text-white transition-colors no-underline"
      >
        <span className="leading-none translate-y-[1px]">Смотреть кейсы</span>
        <ArrowRight className="w-4 h-4" strokeWidth={2} />
      </Link>
    </div>
  );
}

function Logos({ center = false }: { center?: boolean }) {
  return (
    <div className={`flex items-center gap-6 md:gap-10 flex-wrap ${center ? "justify-center" : ""}`}>
      <img src="/images/logos/ozon.svg" alt="Ozon" className="h-4 md:h-5 w-auto self-center brightness-0 invert opacity-55" />
      <img src="/images/logos/mts.svg" alt="МТС" className="h-6 md:h-8 w-auto brightness-0 invert opacity-55" />
      <img src="/images/logos/gazpromneft.svg" alt="Газпром нефть" className="h-6 md:h-8 w-auto brightness-0 invert opacity-55" />
      <img src="/images/logos/hse.svg" alt="ВШЭ" className="h-6 md:h-8 w-auto brightness-0 invert opacity-55" />
    </div>
  );
}

function RoleTag({ className = "" }: { className?: string }) {
  return (
    <div className={`font-p95 text-[13px] md:text-[14px] tracking-[0.2em] uppercase text-white/70 whitespace-nowrap ${className}`}>
      <span className="text-[#A6FF00]/80">[</span>
      <span className="mx-2">Дизайн-директор</span>
      <span className="text-[#A6FF00]/80">]</span>
    </div>
  );
}

/* ═══════ LED BOARD — табло из крупных кружков ═══════
   Всё поле — тёмно-серые диоды; нужные загораются. Смена слова —
   волна перерисовки слева направо, как на вокзальном табло. */

type LedLine = { text?: string; words?: readonly string[]; color: string };

const LED_DIM = "rgba(255,255,255,0.09)";

function LedBoard({
  lines,
  className = "",
  intervalMs = 2400,
}: {
  lines: LedLine[];
  className?: string;
  intervalMs?: number;
}) {
  const [idx, setIdx] = useState(0);
  const hasFlip = lines.some((l) => l.words && l.words.length > 1);

  useEffect(() => {
    if (!hasFlip) return;
    const id = setInterval(() => setIdx((v) => v + 1), intervalMs);
    return () => clearInterval(id);
  }, [hasFlip, intervalMs]);

  const PITCH = 4;
  const R = 1.72;
  const PAD = 1; // поля в "диодах" по краям
  const GAP = 2; // строки-промежутки между строками текста

  // Раскладка строк при текущем индексе сменного слова
  const layouts = lines.map((l) => {
    const t = l.words ? l.words[idx % l.words.length] : (l.text ?? "");
    return { ...layoutLedText(t), color: l.color };
  });

  // Поле фиксируем по самой широкой раскладке среди ВСЕХ слов (чтобы
  // сетка не дёргалась при смене слова).
  const fieldCols = useMemo(() => {
    let max = 0;
    for (const l of lines) {
      const variants = l.words ?? [l.text ?? ""];
      for (const v of variants) max = Math.max(max, layoutLedText(v).cols);
    }
    return max + PAD * 2;
  }, [lines]);

  const fieldRows = PAD * 2 + lines.length * LED_ROWS + (lines.length - 1) * GAP;

  // Карта зажжённых диодов: "col,row" → цвет
  const lit = new Map<string, string>();
  layouts.forEach((lay, li) => {
    const colOff = PAD + Math.floor((fieldCols - PAD * 2 - lay.cols) / 2);
    const rowOff = PAD + li * (LED_ROWS + GAP);
    for (const d of lay.dots) {
      if (d.lit) lit.set(`${d.col + colOff},${d.row + rowOff}`, lay.color);
    }
  });

  const cells = [];
  for (let c = 0; c < fieldCols; c++) {
    for (let r = 0; r < fieldRows; r++) {
      const color = lit.get(`${c},${r}`);
      cells.push(
        <circle
          key={`${c}-${r}`}
          cx={c * PITCH + PITCH / 2}
          cy={r * PITCH + PITCH / 2}
          r={R}
          fill={color ?? LED_DIM}
          style={{
            transition: "fill 150ms linear",
            transitionDelay: `${c * 6 + ((c * 5 + r * 11) % 4) * 14}ms`,
          }}
        />,
      );
    }
  }

  return (
    <svg
      viewBox={`0 0 ${fieldCols * PITCH} ${fieldRows * PITCH}`}
      className={className}
      aria-hidden
      focusable="false"
    >
      {cells}
    </svg>
  );
}

/* ═══════ 1 · СФЕРА ЗА ТЕКСТОМ ═══════ */
function V1() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <section className="relative min-h-[100vh] bg-black px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] pt-24 md:pt-28 pb-10">
      <div ref={ref} className="relative rounded-3xl border border-white/[0.1] bg-black overflow-hidden min-h-[78vh] flex flex-col">
        {/* Сфера — весь тайл, задний план */}
        <div aria-hidden className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1.2px) 0 0/22px 22px",
            }}
          />
          <ParticleSphere className="absolute inset-0 w-full h-full" trackingRef={ref} />
          {/* Затемнение за текстом для читаемости */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 58% 48% at 50% 54%, rgba(0,0,0,0.66) 0%, rgba(0,0,0,0.32) 55%, transparent 78%)",
            }}
          />
        </div>

        <RoleTag className="absolute top-6 right-6 md:top-10 md:right-10 z-[2]" />
        <div className="hidden md:block absolute bottom-6 right-6 md:bottom-10 md:right-10 z-[2] font-p95 text-[13px] md:text-[14px] tracking-[0.2em] uppercase text-white/70">
          Москва
        </div>

        {/* Центр */}
        <div className="relative z-[1] flex-1 flex flex-col items-center justify-center text-center gap-6 md:gap-8 p-7 md:p-12 pointer-events-none">
          <h1 className="font-p95 text-[clamp(52px,8.4vw,124px)] leading-[0.92] uppercase tracking-tight text-white">
            <span className="block">7 лет развиваю</span>
            <span className="block">
              <FlippingWord words={WORDS} className="text-[#A6FF00]" />
            </span>
          </h1>
          <p className="max-w-[560px] text-lg md:text-[20px] leading-snug text-white/70 font-light">
            От стратегии и культуры до AI и цифровых продуктов.
          </p>
          <div className="pointer-events-auto">
            <Ctas center />
          </div>
        </div>

        <div className="relative z-[1] flex justify-center pb-8 md:pb-10">
          <Logos center />
        </div>
      </div>
    </section>
  );
}

/* ═══════ 2 · ПОСТЕР EDGE-TO-EDGE ═══════ */
function V2() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <section ref={ref} className="relative min-h-[100vh] bg-black overflow-hidden px-5 md:px-[4%] pt-24 md:pt-28 pb-8 flex flex-col">
      {/* Сфера — справа, пересекается с заголовком, уходит за край */}
      <div aria-hidden className="absolute top-[6%] right-[-14%] md:right-[-8%] w-[80%] md:w-[48%] h-[70%] pointer-events-none md:pointer-events-auto">
        <ParticleSphere className="absolute inset-0 w-full h-full" trackingRef={ref} />
      </div>

      <RoleTag className="absolute top-24 right-5 md:top-28 md:right-[4%] z-[2]" />

      <div className="relative z-[1] flex-1 flex flex-col justify-center">
        <h1 className="font-p95 text-[clamp(56px,12vw,184px)] leading-[0.88] uppercase tracking-tight text-white">
          <span className="block">7 лет</span>
          <span className="block">Развиваю</span>
          <span className="block">
            <FlippingWord words={WORDS} className="text-[#A6FF00]" />
          </span>
        </h1>
      </div>

      {/* Низ: лого слева, сабтайтл + кнопки справа */}
      <div className="relative z-[1] mt-10 md:mt-0 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
        <div className="order-2 md:order-1">
          <Logos />
        </div>
        <div className="order-1 md:order-2 flex flex-col items-start md:items-end gap-5 md:text-right">
          <p className="max-w-[420px] text-lg md:text-[20px] leading-snug text-white/70 font-light">
            От стратегии и культуры до AI и цифровых продуктов.
          </p>
          <Ctas />
        </div>
      </div>
    </section>
  );
}

/* ═══════ 3 · СПЛИТ + ЛЕНТА МЕТРИК ═══════ */
function V3() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <section className="relative min-h-[100vh] bg-black px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] pt-24 md:pt-28 pb-10">
      <div ref={ref} className="relative rounded-3xl border border-white/[0.1] bg-black overflow-hidden min-h-[78vh] flex flex-col">
        <div aria-hidden className="absolute inset-x-0 top-0 h-[208px] md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-[44%]">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1.2px) 0 0/22px 22px",
            }}
          />
          <ParticleSphere className="absolute inset-0 w-full h-full" trackingRef={ref} />
        </div>

        <RoleTag className="hidden md:block absolute top-10 right-10 z-[2]" />

        <div className="relative z-[1] flex-1 flex flex-col justify-center p-7 md:p-10 lg:p-12 pt-[216px] md:pt-10 md:max-w-[56%]">
          <div className="flex flex-col gap-6 md:gap-8 max-md:items-center max-md:text-center">
            <h1 className="font-p95 text-[clamp(44px,calc(20vw_-_21px),110px)] md:text-[clamp(56px,7.6vw,110px)] leading-[0.92] uppercase tracking-tight text-white">
              <span className="inline md:block">7 лет </span>
              <span className="inline md:block">РАЗВИВАЮ</span>
              <span className="block">
                <FlippingWord words={WORDS} className="text-white" />
              </span>
            </h1>
            <p className="max-w-[560px] text-lg md:text-[20px] leading-snug text-white/70 font-light">
              От стратегии и культуры до AI и цифровых продуктов.
            </p>
            <Ctas />
          </div>
        </div>

        {/* Лента метрик — нижняя кромка тайла */}
        <div className="relative z-[1] border-t border-white/10 grid grid-cols-3 divide-x divide-white/10">
          {[
            { value: "30", label: "запусков продуктов" },
            { value: "7", label: "лет в дизайне" },
            { value: "27", label: "команд под управлением" },
          ].map((m) => (
            <div key={m.value} className="flex flex-col items-start gap-1.5 px-5 md:px-10 py-5 md:py-7">
              <span className="font-p95 text-[28px] md:text-[40px] leading-none text-white tracking-tight">
                {m.value}
              </span>
              <span className="text-[12px] md:text-[13px] tracking-[0.06em] uppercase text-white/55 font-light leading-snug">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════ 4 · СТРОКА-ЗАГОЛОВОК + СЦЕНА ═══════ */
function V4() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <section className="relative min-h-[100vh] bg-black px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] pt-24 md:pt-28 pb-10 flex flex-col">
      <RoleTag className="self-end mb-5 md:mb-7" />

      {/* Заголовок одной строкой во всю ширину */}
      <h1 className="relative z-[1] font-p95 text-[clamp(30px,8vw,150px)] xl:text-[clamp(30px,7.6vw,150px)] leading-[0.92] uppercase tracking-tight text-white whitespace-nowrap max-md:text-center">
        7 лет развиваю{" "}
        <FlippingWord words={WORDS} className="text-[#A6FF00]" />
      </h1>

      {/* Сцена: сфера в центре */}
      <div ref={ref} className="relative flex-1 min-h-[380px] md:min-h-[440px] mt-2 md:mt-4 rounded-3xl border border-white/[0.08] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1.2px) 0 0/22px 22px",
          }}
        />
        <ParticleSphere className="absolute inset-0 w-full h-full" trackingRef={ref} />
        <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-[2] font-p95 text-[13px] md:text-[14px] tracking-[0.2em] uppercase text-white/70">
          Москва
        </div>
      </div>

      {/* Низ: сабтайтл + кнопки слева, лого справа */}
      <div className="relative z-[1] mt-8 md:mt-10 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
        <div className="flex flex-col gap-5 max-md:items-center max-md:text-center">
          <p className="max-w-[480px] text-lg md:text-[20px] leading-snug text-white/70 font-light">
            От стратегии и культуры до AI и цифровых продуктов.
          </p>
          <Ctas />
        </div>
        <Logos />
      </div>
    </section>
  );
}

/* ═══════ 5 · ГИБРИД: ТАБЛО ПО ЦЕНТРУ + СФЕРА ЗА ТЕКСТОМ + МЕТРИКИ ═══════ */
function V5() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <section className="relative min-h-[100vh] bg-black px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] pt-24 md:pt-28 pb-10">
      <div ref={ref} className="relative rounded-3xl border border-white/[0.1] bg-black overflow-hidden min-h-[78vh] flex flex-col">
        {/* Сфера — задний план всего тайла */}
        <div aria-hidden className="absolute inset-0">
          <ParticleSphere className="absolute inset-0 w-full h-full" trackingRef={ref} />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 48%, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.3) 55%, transparent 78%)",
            }}
          />
        </div>

        <RoleTag className="absolute top-6 right-6 md:top-10 md:right-10 z-[2]" />

        {/* Центр: табло + сабтайтл + CTA */}
        <div className="relative z-[1] flex-1 flex flex-col items-center justify-center text-center gap-7 md:gap-9 p-7 md:p-12 pointer-events-none">
          <h1 className="sr-only">7 лет развиваю людей, команды, визуал, сервисы</h1>
          {/* Десктоп: 2 строки табло */}
          <LedBoard
            className="hidden md:block w-full max-w-[920px] h-auto"
            lines={[
              { text: "7 ЛЕТ РАЗВИВАЮ", color: "#ffffff" },
              { words: WORDS, color: "#A6FF00" },
            ]}
          />
          {/* Мобайл: 3 строки табло */}
          <LedBoard
            className="md:hidden w-full max-w-[420px] h-auto"
            lines={[
              { text: "7 ЛЕТ", color: "#ffffff" },
              { text: "РАЗВИВАЮ", color: "#ffffff" },
              { words: WORDS, color: "#A6FF00" },
            ]}
          />
          <p className="max-w-[560px] text-lg md:text-[20px] leading-snug text-white/70 font-light">
            От стратегии и культуры до AI и цифровых продуктов.
          </p>
          <div className="pointer-events-auto">
            <Ctas center />
          </div>
        </div>

        {/* Лента метрик — нижняя кромка тайла (из V3) */}
        <div className="relative z-[1] border-t border-white/10 grid grid-cols-3 divide-x divide-white/10 bg-black/40 backdrop-blur-[2px]">
          {[
            { value: "30", label: "запусков продуктов" },
            { value: "7", label: "лет в дизайне" },
            { value: "27", label: "команд под управлением" },
          ].map((m) => (
            <div key={m.value} className="flex flex-col items-center md:items-start gap-1.5 px-3 md:px-10 py-5 md:py-7">
              <span className="font-p95 text-[26px] md:text-[40px] leading-none text-white tracking-tight">
                {m.value}
              </span>
              <span className="text-[11px] md:text-[13px] tracking-[0.06em] uppercase text-white/55 font-light leading-snug text-center md:text-left">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HeroLab({ v }: { v: string }) {
  const variants: Record<string, React.ReactNode> = {
    "1": <V1 />,
    "2": <V2 />,
    "3": <V3 />,
    "4": <V4 />,
    "5": <V5 />,
  };
  const names: Record<string, string> = {
    "1": "Сфера за текстом",
    "2": "Постер",
    "3": "Сплит + метрики",
    "4": "Строка + сцена",
    "5": "Гибрид: табло",
  };
  return (
    <>
      {variants[v] ?? <V1 />}
      {/* Переключатель вариантов */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-1.5 rounded-full border border-white/15 bg-black/80 backdrop-blur-md px-2.5 py-2">
        {["1", "2", "3", "4", "5"].map((n) => (
          <Link
            key={n}
            href={`/hero/${n}`}
            className={`w-8 h-8 rounded-full flex items-center justify-center font-p95 text-[14px] no-underline transition-colors ${
              n === v
                ? "bg-[#A6FF00] text-black"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            {n}
          </Link>
        ))}
        <span className="hidden md:inline font-p95 text-[12px] tracking-[0.14em] uppercase text-white/50 px-2">
          {names[v] ?? names["1"]}
        </span>
      </div>
    </>
  );
}

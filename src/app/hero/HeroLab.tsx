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
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import ParticleSphere from "@/components/ParticleSphere";
import FlippingWord from "@/components/FlippingWord";
import { layoutLedText, LED_ROWS } from "@/components/ledFont";
import LedText from "@/components/LedText";

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
  scale = 1,
  dotR,
  pad = 1,
  gapRows,
  minCols = 0,
  minRows = 0,
  align = "center",
}: {
  lines: LedLine[];
  className?: string;
  intervalMs?: number;
  /** Апскейл битмапы (толщина штриха в диодах) */
  scale?: number;
  /** Радиус диода (юниты сетки, шаг 4) */
  dotR?: number;
  /** Поля вокруг текста, в диодах */
  pad?: number;
  /** Промежуток между строками, в диодах */
  gapRows?: number;
  /** Минимальная ширина/высота поля, в диодах — чтобы растянуть табло */
  minCols?: number;
  minRows?: number;
  align?: "center" | "left";
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [idx, setIdx] = useState(0);
  const hasFlip = lines.some((l) => l.words && l.words.length > 1);

  useEffect(() => {
    if (!hasFlip) return;
    const id = setInterval(() => setIdx((v) => v + 1), intervalMs);
    return () => clearInterval(id);
  }, [hasFlip, intervalMs]);

  const PITCH = 4;
  const R = dotR ?? (scale > 1 ? 1.5 : 1.72);
  const GAP = gapRows ?? 2 * scale;
  const ROWS_LINE = LED_ROWS * scale;

  // Раскладки текущего кадра + предыдущего слова (для волны-гашения)
  const cur = lines.map((l) => {
    const t = l.words ? l.words[idx % l.words.length] : (l.text ?? "");
    return { ...layoutLedText(t, scale), color: l.color, flip: !!l.words };
  });
  const prev = lines.map((l) => {
    if (!l.words || idx === 0) return null;
    const t = l.words[(idx - 1) % l.words.length];
    return { ...layoutLedText(t, scale), color: l.color };
  });

  // Поле фиксируем по самой широкой раскладке среди всех слов
  const fieldCols = useMemo(() => {
    let max = 0;
    for (const l of lines) {
      const variants = l.words ?? [l.text ?? ""];
      for (const v of variants) max = Math.max(max, layoutLedText(v, scale).cols);
    }
    return Math.max(minCols, max + pad * 2);
  }, [lines, scale, pad, minCols]);

  const textRows = pad * 2 + lines.length * ROWS_LINE + (lines.length - 1) * GAP;
  const fieldRows = Math.max(minRows, textRows);

  const colOff = (cols: number) =>
    align === "center" ? pad + Math.floor((fieldCols - pad * 2 - cols) / 2) : pad;
  const rowOff = (li: number) => pad + li * (ROWS_LINE + GAP);

  return (
    <svg
      viewBox={`0 0 ${fieldCols * PITCH} ${fieldRows * PITCH}`}
      className={className}
      aria-hidden
      focusable="false"
    >
      <style>{`
        @keyframes ledIn${uid} { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ledOut${uid} { from { opacity: 1; } to { opacity: 0; } }
      `}</style>
      <defs>
        <pattern id={`f${uid}`} width={PITCH} height={PITCH} patternUnits="userSpaceOnUse">
          <circle cx={PITCH / 2} cy={PITCH / 2} r={R} fill={LED_DIM} />
        </pattern>
      </defs>
      {/* Поле незажжённых диодов */}
      <rect width={fieldCols * PITCH} height={fieldRows * PITCH} fill={`url(#f${uid})`} />
      {/* Гаснущее предыдущее слово */}
      {prev.map((lay, li) =>
        lay ? (
          <g key={`p-${li}-${idx}`}>
            {lay.dots
              .filter((d) => d.lit)
              .map((d, i) => (
                <circle
                  key={i}
                  cx={(d.col + colOff(lay.cols)) * PITCH + PITCH / 2}
                  cy={(d.row + rowOff(li)) * PITCH + PITCH / 2}
                  r={R}
                  fill={lay.color}
                  style={{
                    animation: `ledOut${uid} 130ms linear forwards`,
                    animationDelay: `${d.col * 3}ms`,
                  }}
                />
              ))}
          </g>
        ) : null,
      )}
      {/* Текущие строки; сменное слово загорается волной слева направо */}
      {cur.map((lay, li) => (
        <g key={lay.flip ? `c-${li}-${idx}` : `s-${li}`}>
          {lay.dots
            .filter((d) => d.lit)
            .map((d, i) => (
              <circle
                key={i}
                cx={(d.col + colOff(lay.cols)) * PITCH + PITCH / 2}
                cy={(d.row + rowOff(li)) * PITCH + PITCH / 2}
                r={R}
                fill={lay.color}
                style={
                  lay.flip && idx > 0
                    ? {
                        animation: `ledIn${uid} 150ms linear both`,
                        animationDelay: `${120 + d.col * 4 + ((d.col * 5 + d.row * 11) % 4) * 10}ms`,
                      }
                    : undefined
                }
              />
            ))}
        </g>
      ))}
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

/* ═══════ 6 · «ПРИБОР» — CSS/DOM-скелет приборной панели ═══════ */

function Screw({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`absolute w-[7px] h-[7px] rounded-full border border-black/70 bg-[radial-gradient(circle_at_35%_30%,#41413e,#1a1a19)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)] ${className}`}
    >
      <span className="absolute left-1/2 top-1/2 w-[5px] h-px -translate-x-1/2 -translate-y-1/2 rotate-45 bg-black/70" />
    </span>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-[18px] border border-[#2d2d2b] bg-[linear-gradient(180deg,#201f1d_0%,#181816_60%,#141413_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-1px_0_rgba(0,0,0,0.6),0_18px_50px_rgba(0,0,0,0.5)] ${className}`}
    >
      <Screw className="top-2.5 left-2.5" />
      <Screw className="top-2.5 right-2.5" />
      <Screw className="bottom-2.5 left-2.5" />
      <Screw className="bottom-2.5 right-2.5" />
      {children}
    </div>
  );
}

function Screen({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-[10px] border border-black bg-[#0a0c09] shadow-[inset_0_2px_16px_rgba(0,0,0,0.9),inset_0_0_70px_rgba(166,255,0,0.05)] overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

function Dlabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] md:text-[12px] tracking-[0.18em] uppercase text-white/50">
      {children}
    </span>
  );
}

function Lamp({ on = false, color = "#A6FF00" }: { on?: boolean; color?: string }) {
  return (
    <span
      aria-hidden
      className="inline-block w-[7px] h-[7px] rounded-full border border-black/60 shrink-0"
      style={{
        background: on ? color : "rgba(255,255,255,0.12)",
        boxShadow: on ? `0 0 8px ${color}` : "inset 0 1px 1px rgba(0,0,0,0.6)",
      }}
    />
  );
}

function Knob({ angle, onTurn, label }: { angle: number; onTurn: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onTurn}
      aria-label={label}
      className="relative w-10 h-10 rounded-full border border-black/80 bg-[radial-gradient(circle_at_35%_30%,#34342f,#161614)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.14),0_4px_10px_rgba(0,0,0,0.6)] transition-transform duration-300"
      style={{ transform: `rotate(${angle}deg)` }}
    >
      <span className="absolute left-1/2 top-[3px] w-[2px] h-[10px] -translate-x-1/2 rounded bg-[#A6FF00] shadow-[0_0_6px_rgba(166,255,0,0.8)]" />
    </button>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      className="relative w-[26px] h-[44px] rounded-full border border-black/80 bg-[linear-gradient(180deg,#0e0e0d,#1c1c1a)] shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]"
    >
      <span
        className="absolute left-1/2 -translate-x-1/2 w-[18px] h-[18px] rounded-full border border-black/60 bg-[radial-gradient(circle_at_35%_30%,#3c3c38,#1f1f1d)] shadow-[0_2px_5px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all duration-200"
        style={{ top: on ? 3 : 21 }}
      />
    </button>
  );
}

const SPHERE_PRESETS = [
  { r: 166, g: 255, b: 0 },
  { r: 201, g: 166, b: 107 },
  { r: 235, g: 235, b: 235 },
  { r: 79, g: 195, b: 247 },
];

function V6() {
  const sphereRef = useRef<HTMLDivElement>(null);
  const [preset, setPreset] = useState(0);
  const [amber, setAmber] = useState(false);
  const wordColor = amber ? "#FFB454" : "#A6FF00";
  const p = SPHERE_PRESETS[preset];

  const heroLines: LedLine[] = [
    { text: "7 ЛЕТ", color: "#F2F4EF" },
    { text: "РАЗВИВАЮ", color: "#F2F4EF" },
    { words: WORDS, color: wordColor },
  ];

  return (
    <section className="relative min-h-[100vh] bg-[#111110] pt-20 md:pt-24 pb-10 px-4 md:px-[4%] xl:px-[7%] 2xl:px-[max(7%,calc((100%_-_1760px)/2))]">
      {/* Свет на «приборной доске» */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 75% 55% at 50% 0%, rgba(255,255,255,0.045), transparent 60%), radial-gradient(ellipse 60% 45% at 85% 80%, rgba(166,255,0,0.03), transparent 70%)",
        }}
      />

      <div className="relative grid grid-cols-12 gap-3 md:gap-4 items-stretch">
        {/* ── A · Главный экран-табло ── */}
        <Panel className="col-span-12 lg:col-span-7 lg:row-span-2 p-4 md:p-6 flex flex-col">
          <Screen className="relative">
            <LedBoard
              className="hidden md:block w-full h-auto"
              align="left"
              scale={2}
              dotR={1.45}
              pad={3}
              minCols={118}
              minRows={86}
              lines={heroLines}
            />
            <LedBoard
              className="md:hidden w-full h-auto"
              align="left"
              scale={1}
              pad={2}
              minCols={53}
              minRows={41}
              lines={heroLines}
            />
            <p className="absolute left-4 bottom-3 md:left-6 md:bottom-5 max-w-[440px] text-left text-[13px] md:text-[17px] leading-snug text-white/65 font-light">
              От стратегии и культуры до AI и цифровых продуктов.
            </p>
            <h1 className="sr-only">7 лет развиваю людей, команды, визуал, сервисы</h1>
          </Screen>

          {/* Панель управления под экраном */}
          <div className="mt-4 md:mt-5 flex flex-wrap items-center gap-3">
            <Ctas />
            <div className="ml-auto hidden sm:flex items-center gap-3">
              <Dlabel>Режим</Dlabel>
              <Toggle on={amber} onClick={() => setAmber(!amber)} label="Цвет табло" />
            </div>
          </div>
          <div className="mt-5 md:mt-6">
            <Logos />
          </div>
        </Panel>

        {/* ── B · Монитор сферы ── */}
        <Panel className="col-span-12 lg:col-span-5 p-4 md:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="inline-flex items-center gap-2">
              <span className="text-[#A6FF00]/80 font-p95 text-[13px]">[</span>
              <Dlabel>Дизайн-директор</Dlabel>
              <span className="text-[#A6FF00]/80 font-p95 text-[13px]">]</span>
            </span>
            <Lamp on color={`rgb(${p.r},${p.g},${p.b})`} />
          </div>
          <Screen className="flex-1 min-h-[260px] md:min-h-[300px]">
            <div ref={sphereRef} className="absolute inset-0">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1.2px) 0 0/18px 18px",
                }}
              />
              <ParticleSphere
                key={preset}
                className="absolute inset-0 w-full h-full"
                trackingRef={sphereRef}
                r={p.r}
                g={p.g}
                b={p.b}
              />
            </div>
          </Screen>
          <div className="flex items-center justify-between px-1">
            <Dlabel>Москва</Dlabel>
            <div className="flex items-center gap-2.5">
              {SPHERE_PRESETS.map((sp, i) => (
                <Lamp key={i} on={i === preset} color={`rgb(${sp.r},${sp.g},${sp.b})`} />
              ))}
              <Knob angle={preset * 90} onTurn={() => setPreset((preset + 1) % SPHERE_PRESETS.length)} label="Цвет частиц сферы" />
            </div>
          </div>
        </Panel>

        {/* ── C · В цифрах ── */}
        <Panel className="col-span-12 lg:col-span-5 p-4 md:p-5 flex flex-col gap-3">
          <div className="px-1">
            <Dlabel>В цифрах</Dlabel>
          </div>
          <Screen className="px-4 md:px-6 py-4 md:py-5 flex-1">
            <div className="grid grid-cols-3 gap-4 h-full content-center">
              {[
                { v: "30", l: "запусков" },
                { v: "7", l: "лет опыта" },
                { v: "27", l: "команд" },
              ].map((m) => (
                <div key={m.l} className="flex flex-col gap-2">
                  <LedText text={m.v} scale={2} dot={1.45} className="h-[32px] md:h-[40px] w-auto self-start text-[#F2F4EF]" />
                  <span className="text-[11px] md:text-[12px] tracking-[0.14em] uppercase text-white/45">
                    {m.l}
                  </span>
                </div>
              ))}
            </div>
          </Screen>
        </Panel>

        {/* ── D · Награда ── */}
        <Panel className="col-span-12 md:col-span-6 lg:col-span-4 p-4 md:p-5 flex flex-col gap-3">
          <div className="px-1 flex items-center gap-2">
            <Lamp on color="#C9A66B" />
            <Dlabel>Награда · 2024</Dlabel>
          </div>
          <Screen className="flex-1 p-5 md:p-6 flex flex-col justify-between gap-4">
            <LedText text="СХ·24" scale={2} dot={1.45} className="h-[38px] md:h-[46px] w-auto self-start text-[#C9A66B]" />
            <div>
              <div className="text-[12px] md:text-[13px] tracking-[0.16em] uppercase text-white/55">
                Customer Experience Awards
              </div>
              <div className="mt-2 pt-2 border-t border-white/[0.07] text-[11px] md:text-[12px] tracking-[0.16em] uppercase text-[#C9A66B]/80">
                Победитель в сегменте B2E
              </div>
            </div>
          </Screen>
        </Panel>

        {/* ── E · Экспертиза ── */}
        <Panel className="col-span-12 md:col-span-6 lg:col-span-5 p-4 md:p-5 flex flex-col gap-3">
          <div className="px-1 flex items-center gap-2">
            <Lamp on />
            <Dlabel>Экспертиза</Dlabel>
          </div>
          <Screen className="flex-1 px-4 md:px-5 py-3 md:py-4">
            <ul className="flex flex-col justify-center gap-3 md:gap-4 h-full">
              {[
                { num: "01", label: "Управление", note: "дизайн-функции и команды" },
                { num: "02", label: "Направления", note: "B2C / B2E / EdTech / E-COM" },
                { num: "03", label: "Ремесло", note: "процессы и применение AI" },
              ].map((item) => (
                <li key={item.num} className="flex items-center gap-3">
                  <span className="font-p95 text-[12px] tabular-nums text-white/40 w-5 shrink-0">
                    {item.num}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="font-p95 text-[15px] md:text-[16px] tracking-[0.16em] uppercase text-white block">
                      {item.label}
                    </span>
                    <span className="block text-[11px] md:text-[12px] tracking-[0.06em] uppercase text-white/50 truncate">
                      {item.note}
                    </span>
                  </span>
                  <Lamp on />
                </li>
              ))}
            </ul>
          </Screen>
        </Panel>

        {/* ── F · Кнопочный блок (декор + одна загадка) ── */}
        <Panel className="col-span-12 lg:col-span-3 p-4 md:p-5 flex flex-col justify-between gap-4">
          <div className="grid grid-cols-3 gap-2">
            {["01", "02", "03", "04", "05"].map((n) => (
              <button
                key={n}
                type="button"
                className="rounded-[6px] border border-black/70 bg-[linear-gradient(180deg,#262624,#191917)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_4px_rgba(0,0,0,0.5)] py-2 text-center text-[11px] tracking-[0.12em] text-white/45"
              >
                {n}
              </button>
            ))}
            <Link
              href="/secret"
              aria-label="Кнопка 06 — секрет"
              className="rounded-[6px] border border-[#A6FF00]/30 bg-[linear-gradient(180deg,#262624,#191917)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_4px_rgba(0,0,0,0.5),0_0_10px_rgba(166,255,0,0.12)] py-2 text-center text-[11px] tracking-[0.12em] text-[#A6FF00] no-underline"
            >
              06
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-1.5 opacity-70" aria-hidden>
            {Array.from({ length: 7 }).map((_, i) => (
              <span
                key={i}
                className="h-[3px] rounded bg-black/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              />
            ))}
          </div>
        </Panel>
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
    "6": <V6 />,
  };
  const names: Record<string, string> = {
    "1": "Сфера за текстом",
    "2": "Постер",
    "3": "Сплит + метрики",
    "4": "Строка + сцена",
    "5": "Гибрид: табло",
    "6": "Прибор",
  };
  return (
    <>
      {variants[v] ?? <V1 />}
      {/* Переключатель вариантов */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-1.5 rounded-full border border-white/15 bg-black/80 backdrop-blur-md px-2.5 py-2">
        {["1", "2", "3", "4", "5", "6"].map((n) => (
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

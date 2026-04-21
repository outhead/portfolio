"use client";

import ProjectCard from "@/components/ProjectCard";
import { workProjects } from "@/data/projects";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useState } from "react";
import {
  Code2,
  Send,
  Mail,
  FileDown,
  MapPin,
  Quote,
  ArrowRight,
  Users,
  Sparkles,
} from "lucide-react";

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
  </svg>
);

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.58v-2.1c-3.34.72-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.08-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.82 1.31 3.5 1 .1-.78.42-1.32.76-1.62-2.67-.3-5.48-1.34-5.48-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.52 11.52 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .3" />
  </svg>
);

// === Motion ===
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const viewport = { once: true, margin: "-10% 0px -10% 0px" };

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 font-p95 text-[13px] md:text-[14px] tracking-[0.2em] uppercase text-white/75">
      <span className="text-[#A6FF00]/80">[</span>
      <span>{children}</span>
      <span className="text-[#A6FF00]/80">]</span>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// SKILLS — accordion-бенто (stokt-style)
// ───────────────────────────────────────────────────────────────────
interface SkillPanel {
  key: string;
  label: string;
  title: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  accent: string;
  body: string;
  items: string[];
}

function SkillsAccordion({ panels }: { panels: SkillPanel[] }) {
  const [active, setActive] = useState<string>(panels[0].key);
  const CONTENT_WIDTH = 560;
  const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
  return (
    <div className="flex flex-col md:flex-row gap-2 md:gap-3 w-full md:h-[440px]">
      {panels.map((p) => {
        const isActive = active === p.key;
        const PanelContent = (
          <div
            className="relative p-6 md:p-8 md:h-full md:flex md:flex-col"
            style={{ width: `min(100%, ${CONTENT_WIDTH}px)` }}
          >
            <div
              className="absolute top-6 right-6 md:top-8 md:right-8 h-2 w-2 rounded-full"
              style={{ backgroundColor: p.accent }}
            />
            <div className="inline-flex items-center gap-2 font-p95 text-[13px] md:text-[14px] tracking-[0.2em] uppercase text-white/75 mb-4">
              <p.Icon className="w-4 h-4" strokeWidth={1.75} style={{ color: p.accent }} />
              <span>{p.label}</span>
            </div>
            <h3 className="font-p95 text-[clamp(22px,2.6vw,36px)] leading-[0.98] uppercase text-white mb-4">
              {p.title}
            </h3>
            <p className="text-sm md:text-[15px] text-white/60 leading-relaxed mb-6">{p.body}</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-auto">
              {p.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-white/70 leading-snug"
                >
                  <span
                    className="mt-[7px] h-px w-2 shrink-0"
                    style={{ backgroundColor: p.accent, opacity: 0.7 }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );

        return (
          <button
            key={p.key}
            type="button"
            onClick={() => setActive(p.key)}
            className={`group relative text-left rounded-2xl border overflow-hidden transition-[flex,border-color,background-color] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] md:h-full ${
              isActive
                ? "border-white/15 bg-[#0a0a0a] md:flex-[6]"
                : "border-white/[0.06] bg-[#080808] hover:border-white/15 md:flex-[1] md:min-w-[72px]"
            }`}
            aria-expanded={isActive}
          >
            {/* Desktop: вертикальная рейка (свёрнутое состояние) */}
            <div
              className="hidden md:flex flex-col items-center justify-between absolute inset-0 py-6 px-3 transition-opacity duration-300 ease-out"
              style={{
                opacity: isActive ? 0 : 1,
                pointerEvents: isActive ? "none" : "auto",
              }}
              aria-hidden={isActive}
            >
              <p.Icon className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors" strokeWidth={1.5} />
              <div
                className="font-p95 text-[13px] tracking-[0.2em] uppercase text-white/55 group-hover:text-white/85 transition-colors whitespace-nowrap"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                {p.label}
              </div>
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: "transparent", boxShadow: `inset 0 0 0 1px ${p.accent}` }}
              />
            </div>

            {/* Mobile свёрнутый */}
            <div className={`md:hidden ${isActive ? "hidden" : "flex"} items-center justify-between px-5 py-4`}>
              <div className="flex items-center gap-3">
                <p.Icon className="w-4 h-4 text-white/50" strokeWidth={1.5} />
                <div className="font-p95 text-[13px] tracking-[0.2em] uppercase text-white/75">
                  {p.label}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40" strokeWidth={1.75} />
            </div>

            {/* Desktop overlay */}
            <div
              className="hidden md:block md:absolute md:inset-0 md:overflow-hidden transition-opacity duration-[350ms] ease-out"
              style={{
                opacity: isActive ? 1 : 0,
                pointerEvents: isActive ? "auto" : "none",
              }}
              aria-hidden={!isActive}
            >
              <div className="md:flex md:items-start h-full">{PanelContent}</div>
            </div>

            {/* Mobile expand */}
            <AnimatePresence initial={false}>
              {isActive && (
                <motion.div
                  key="mobile-expand"
                  className="md:hidden overflow-hidden"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  aria-hidden={!isActive}
                >
                  {PanelContent}
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// CAREER — hover-reveal list (без состояния, CSS grid-rows [0fr]→[1fr])
// ───────────────────────────────────────────────────────────────────
const careerJobs: Array<{
  year: string;
  company: string;
  role: string;
  scope: string;
  details?: string[];
  current?: boolean;
}> = [
  {
    year: "Сейчас",
    company: "Свободный график",
    role: "Ментор · Консультант · AI Visioner",
    scope: "Менторинг, консалтинг, эксперименты в AI",
    details: [
      "40+ менторинг-сессий с дизайнерами и лидами",
      "Консалтинг: аудит дизайн-функций, найм, постановка процессов",
      "Преподаю прикладной ИИ в ВШЭ",
    ],
    current: true,
  },
  {
    year: "2025–2026",
    company: "MWS AI",
    role: "AI Visioner",
    scope: "AI-дивизион МТС Web Services, 2 продукта",
    details: [
      "Задавал AI-направление двум флагманским продуктам дивизиона",
      "Определял UX-принципы для AI-агентов и чат-интерфейсов",
      "Собрал UI Kit для внутренних AI-продуктов",
    ],
  },
  {
    year: "2024–2025",
    company: "МТС",
    role: "Design Director",
    scope: "Экосистемные продукты и спецпроекты",
    details: [
      "Руководство дизайном экосистемных B2C-продуктов",
      "Спецпроекты на стыке AI и B2C",
    ],
  },
  {
    year: "2022–2024",
    company: "Газпром Нефть",
    role: "Head of Design",
    scope: "76 команд, 42 лида, 100+ дизайнеров, CX Award'24",
    details: [
      "Собрал единую дизайн-функцию из разрозненных команд",
      "Запустил дизайн-систему для 76 продуктов",
      "CX Awards'24 за Unified Service Portal (ESO)",
    ],
  },
  {
    year: "2021–2022",
    company: "Ozon",
    role: "Community Lead",
    scope: "Канал с 0 до 17К подписчиков, −60% к оттоку на найме",
    details: [
      "Построил дизайн-комьюнити с нуля",
      "Вырастил канал с 0 до 17К подписчиков",
      "Сократил отток на найме дизайнеров на 60%",
    ],
  },
  {
    year: "2017–2021",
    company: "МТС",
    role: "Art Director B2C",
    scope: "16 команд, 60+ дизайнеров, 11М+ пользователей",
    details: [
      "Арт-дирекшн B2C-экосистемы МТС",
      "×10 рост транзакций в МТС Cashback",
      "Унификация визуального языка по 16 командам",
    ],
  },
];

function CareerHoverList() {
  return (
    <div className="rounded-2xl border border-white/[0.06] overflow-hidden bg-white/[0.015]">
      {careerJobs.map((job, i) => (
        <div
          key={job.year + job.company}
          className={`group relative ${i > 0 ? "border-t border-white/[0.06]" : ""} hover:bg-white/[0.025] transition-colors`}
        >
          {/* Row — всегда видна */}
          <div className="flex items-center gap-4 md:gap-6 px-5 md:px-7 py-4 md:py-5">
            <span
              className={`shrink-0 w-2 h-2 rounded-full ${
                job.current ? "bg-[#A6FF00]" : "bg-white/25"
              }`}
              aria-hidden
            />
            <span className="shrink-0 font-p95 text-[11px] md:text-[12px] tracking-[0.2em] uppercase text-white/50 w-[88px] md:w-[110px]">
              {job.year}
            </span>
            <span className="flex-1 min-w-0 flex flex-col md:flex-row md:items-baseline md:gap-3">
              <span className="font-p95 text-[15px] md:text-[17px] text-white uppercase leading-tight truncate">
                {job.company}
                {job.current && (
                  <span className="ml-2 text-[10px] tracking-[0.12em] uppercase text-[#A6FF00]/85">
                    now
                  </span>
                )}
              </span>
              <span className="text-[12px] md:text-[13px] text-white/55 leading-tight truncate">
                {job.role}
              </span>
            </span>
          </div>

          {/* Desktop hover-reveal — CSS grid-rows trick (без JS) */}
          {job.details && (
            <div
              className="hidden md:grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              aria-hidden="true"
            >
              <div className="overflow-hidden">
                <div className="px-5 md:px-7 pb-5 md:pb-6 pl-[calc(28px+8px+24px+110px)]">
                  <p className="text-[13px] md:text-[14px] text-white/65 leading-relaxed mb-3">
                    {job.scope}
                  </p>
                  <ul className="space-y-1.5">
                    {job.details.map((d) => (
                      <li
                        key={d}
                        className="flex items-start gap-2 text-[12px] md:text-[13px] text-white/55 leading-snug"
                      >
                        <span className="mt-[7px] h-px w-2 shrink-0 bg-white/30" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Mobile — короткий scope всегда виден под строкой */}
          {job.details && (
            <div className="md:hidden px-5 pb-4 pl-[calc(20px+8px+16px+88px)]">
              <p className="text-[12px] text-white/55 leading-snug">{job.scope}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// SplitSection — лейбл + большой заголовок + контент
// ───────────────────────────────────────────────────────────────────
function SplitSection({
  id,
  label,
  heading,
  children,
  className = "",
  borderTop = true,
  wideRight = false,
}: {
  id?: string;
  label: string;
  heading: string;
  children: React.ReactNode;
  className?: string;
  borderTop?: boolean;
  wideRight?: boolean;
}) {
  return (
    <section
      id={id}
      className={`relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-14 md:py-24 bg-black ${
        borderTop ? "border-t border-white/[0.06]" : ""
      } ${className}`}
    >
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={stagger}
        className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr] gap-8 md:gap-10 lg:gap-16"
      >
        <motion.div variants={fadeUp} className="md:sticky md:top-24 self-start">
          <SectionLabel>{label}</SectionLabel>
          <h2 className="font-p95 text-[clamp(28px,3.5vw,48px)] uppercase mt-2 leading-[0.95]">
            {heading}
          </h2>
        </motion.div>
        <motion.div variants={fadeUp} className={wideRight ? "" : "max-w-[620px]"}>
          {children}
        </motion.div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════
export default function Home() {
  return (
    <>
      {/* ═══════ HERO — stokt-style asymmetric 2-col, large & sparse ═══════ */}
      <section className="relative min-h-[92vh] md:min-h-[94vh] overflow-hidden bg-black">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="relative z-[2] grid grid-cols-1 md:grid-cols-12 min-h-[92vh] md:min-h-[94vh] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] pt-24 md:pt-28 pb-8 md:pb-10"
        >
          {/* === LEFT COLUMN — content === */}
          <div className="md:col-span-7 flex flex-col justify-between gap-10 md:gap-12">
            <div className="flex flex-col gap-7 md:gap-9">
              {/* name + role — подпись сверху */}
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 font-p95 text-[12px] md:text-[13px] tracking-[0.22em] uppercase text-white/65"
              >
                <span className="text-[#A6FF00]/80">[</span>
                <span>Егор Шугаев · Дизайн-директор</span>
                <span className="text-[#A6FF00]/80">]</span>
              </motion.div>

              {/* manifest headline — 2 lines, main hero */}
              <motion.h1
                variants={fadeUp}
                className="font-p95 text-[clamp(38px,5.4vw,82px)] leading-[0.96] uppercase tracking-tight text-white max-w-[780px]"
              >
                Строю дизайн-команды,<br />которые двигают продукт<span className="text-[#A6FF00]">.</span>
              </motion.h1>

              {/* short subtitle */}
              <motion.p
                variants={fadeUp}
                className="max-w-[560px] text-lg md:text-[20px] leading-snug text-white/70 font-light"
              >
                От процессов и культуры — до AI.
              </motion.p>

              {/* 2 CTAs — primary green, secondary outline */}
              <motion.div
                variants={fadeUp}
                className="flex flex-wrap items-center gap-3 mt-2"
              >
                <Link
                  href="https://t.me/egoradi"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#A6FF00] text-black font-p95 text-[13px] md:text-sm tracking-[0.12em] uppercase hover:bg-white transition-colors no-underline"
                >
                  <Send className="w-4 h-4" strokeWidth={2.2} />
                  Написать в Telegram
                </Link>
                <Link
                  href="#portfolio"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/20 text-white/85 font-p95 text-[13px] md:text-sm tracking-[0.12em] uppercase hover:border-white/50 hover:text-white transition-colors no-underline"
                >
                  Смотреть проекты
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Link>
              </motion.div>
            </div>

            {/* minimal status-line at bottom */}
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 font-p95 text-[11px] md:text-[12px] tracking-[0.22em] uppercase text-white/55"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A6FF00]/60 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A6FF00]" />
              </span>
              Сейчас — открыт к найму и консалтингу
            </motion.div>
          </div>

          {/* === RIGHT COLUMN — full-bleed photo === */}
          <motion.div
            variants={fadeUp}
            className="md:col-span-5 relative mt-8 md:mt-0 md:ml-6 lg:ml-10 rounded-2xl overflow-hidden border border-white/[0.06] min-h-[320px] md:min-h-0"
          >
            <Image
              src="/images/photos/photo-4.jpg"
              alt="Егор Шугаев"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/35 via-transparent to-transparent pointer-events-none" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════ METRICS + COMPANIES — одна плотная секция ═══════ */}
      <section className="relative z-[1] bg-black border-t border-white/[0.06] overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
          className="px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] pt-14 md:pt-20 pb-8 md:pb-12"
        >
          <motion.div variants={fadeUp} className="mb-8 md:mb-12">
            <SectionLabel>ЦИФРЫ</SectionLabel>
            <h2 className="font-p95 text-[clamp(26px,3.8vw,52px)] uppercase mt-2 leading-[0.95] max-w-3xl">
              9 лет в крупнейших бигтех-компаниях России<span className="text-[#A6FF00]">.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-white/[0.08]">
            {[
              { value: "11М+", label: "пользователей", ctx: "МТС B2C-экосистема" },
              { value: "100+", label: "дизайнеров", ctx: "Газпром Нефть, 76 команд" },
              { value: "×10", label: "рост транзакций", ctx: "МТС Cashback" },
              { value: "CX'24", label: "CX Awards", ctx: "Газпром Нефть" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                className={`py-6 md:py-10 ${
                  i > 0 ? "md:border-l border-white/[0.08]" : ""
                } ${i === 1 ? "border-l md:border-l" : ""} ${
                  i === 2 ? "border-t md:border-t-0" : ""
                } ${i === 3 ? "border-t md:border-t-0 border-l" : ""} px-3 md:px-5`}
              >
                <div className="font-p95 text-[clamp(40px,6.5vw,88px)] leading-none text-white tracking-tight">
                  {s.value}
                </div>
                <div className="mt-2 md:mt-3 text-[12px] md:text-sm tracking-[0.08em] uppercase text-white/65">
                  {s.label}
                </div>
                <div className="text-[10px] md:text-[12px] tracking-[0.1em] uppercase text-white/40 mt-1">
                  {s.ctx}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Marquee — пришит к метрикам без отдельной секции */}
        <div
          aria-label="Компании, в которых я работал"
          className="relative z-[1] border-t border-white/[0.06] py-8 md:py-10 overflow-hidden"
        >
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex-shrink-0 pl-5 md:pl-[6%] lg:pl-[10%] xl:pl-[14%] pr-4 md:pr-6">
              <div className="inline-flex items-center gap-2 font-p95 text-[11px] md:text-[12px] tracking-[0.24em] uppercase text-white/45 whitespace-nowrap">
                <span className="inline-block w-6 md:w-10 h-px bg-white/25" />
                <span>Работал в</span>
              </div>
            </div>
            <div className="relative flex-1 overflow-hidden">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-24 z-10"
                style={{ background: "linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,0))" }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-24 z-10"
                style={{ background: "linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0))" }}
              />
              <div className="flex items-center whitespace-nowrap marquee">
                {[0, 1].map((loopIdx) => (
                  <div key={loopIdx} className="flex items-center shrink-0" aria-hidden={loopIdx === 1}>
                    {["МТС", "Ozon", "Газпром Нефть", "MWS AI", "ВШЭ"].map((name) => (
                      <span key={name + loopIdx} className="flex items-center">
                        <span className="font-p95 text-[22px] md:text-[32px] lg:text-[40px] tracking-[0.04em] uppercase text-white/80 leading-none px-6 md:px-10">
                          {name}
                        </span>
                        <span aria-hidden className="text-white/20 text-2xl md:text-3xl select-none leading-none">·</span>
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ PROJECTS — полноширинный асимметричный бенто ═══════ */}
      <section
        id="portfolio"
        className="relative z-[1] bg-black border-t border-white/[0.06] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-14 md:py-20"
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          <motion.div
            variants={fadeUp}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 md:mb-10"
          >
            <div>
              <SectionLabel>ИЗБРАННЫЕ РАБОТЫ</SectionLabel>
              <h2 className="font-p95 text-[clamp(32px,5vw,64px)] uppercase mt-2 leading-[0.92]">
                ПРОЕКТЫ<span className="text-[#A6FF00]">.</span>
              </h2>
            </div>
            <Link
              href="/experiments"
              className="inline-flex items-center gap-2 text-[12px] md:text-[13px] tracking-[0.1em] uppercase text-white/55 hover:text-white transition-colors no-underline group self-start md:self-end"
            >
              Эксперименты · код · шейдеры
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
            </Link>
          </motion.div>

          {/* Асимметричная бенто-сетка — 3 колонки, 3 ряда.
              Row 1: [ FEATURED (2 cols, 2 rows tall) ] [ compact ]
                                                        [ compact ]
              Row 2: [ WIDE 2×1                             ]
              Row 3: [ compact ] [ compact ] [ CTA tile ] */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-5">
            {/* Featured — занимает 2 колонки и 2 ряда на десктопе */}
            <motion.div variants={fadeUp} className="md:col-span-2 md:row-span-2">
              <ProjectCard project={workProjects[0]} index={0} featured />
            </motion.div>

            {/* 2 вертикальных 1×1 справа от featured */}
            {workProjects[1] && (
              <motion.div variants={fadeUp}>
                <ProjectCard project={workProjects[1]} index={1} />
              </motion.div>
            )}
            {workProjects[2] && (
              <motion.div variants={fadeUp}>
                <ProjectCard project={workProjects[2]} index={2} />
              </motion.div>
            )}

            {/* Широкая 2×1 карта — разбивает ритм (colorblind.cc-style) */}
            {workProjects[3] && (
              <motion.div variants={fadeUp} className="md:col-span-3">
                <ProjectCard project={workProjects[3]} index={3} wide />
              </motion.div>
            )}

            {/* Финальный ряд: 1 проект + CTA-плитка */}
            {workProjects[4] && (
              <motion.div variants={fadeUp} className="md:col-span-2">
                <ProjectCard project={workProjects[4]} index={4} wide />
              </motion.div>
            )}
            <motion.div variants={fadeUp}>
              <Link href="/experiments" className="no-underline group block h-full">
                <div className="relative h-full min-h-[280px] md:min-h-[340px] rounded-2xl overflow-hidden border border-white/[0.06] group-hover:border-[#A6FF00]/40 bg-[#0a0a0a] transition-colors duration-300 p-6 md:p-7 flex flex-col justify-between">
                  <div>
                    <div className="font-p95 text-[12px] md:text-[13px] tracking-[0.2em] uppercase text-white/50 mb-3">
                      ЭКСПЕРИМЕНТЫ
                    </div>
                    <h3 className="font-p95 text-[clamp(22px,3vw,36px)] uppercase leading-[0.95] text-white">
                      Код,<br />WebGL,<br />шейдеры.
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm tracking-[0.1em] uppercase text-white/60 group-hover:text-[#A6FF00] transition-colors mt-6">
                    Смотреть
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
                  </span>
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══════ SKILLS — stokt accordion-бенто ═══════ */}
      <section
        id="skills"
        className="relative z-[1] bg-black border-t border-white/[0.06] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-14 md:py-20"
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-8 md:mb-10">
            <SectionLabel>ЧТО УМЕЮ</SectionLabel>
            <h2 className="font-p95 text-[clamp(28px,4.5vw,56px)] uppercase mt-2 leading-[0.95]">
              Управление <span className="text-white/35">·</span> Продукт <span className="text-white/35">·</span> Ремесло<span className="text-[#A6FF00]">.</span>
            </h2>
          </motion.div>
          <SkillsAccordion
            panels={[
              {
                key: "management",
                label: "УПРАВЛЕНИЕ",
                title: "Строю и масштабирую дизайн-функции",
                Icon: Users,
                accent: "#A6FF00",
                body:
                  "В МТС — 16 команд и 60+ дизайнеров в B2C-экосистеме. В Газпром Нефти — 76 команд, 42 лида, 100+ дизайнеров на единой дизайн-системе. Умею нанимать, выстраивать процессы и защищать бюджет перед топ-менеджментом.",
                items: [
                  "Design Management",
                  "Org Design · Hiring",
                  "Дизайн-процессы",
                  "OKR · Roadmap",
                  "Работа с топ-менеджментом",
                  "Community · Employer Brand",
                ],
              },
              {
                key: "product",
                label: "ПРОДУКТ",
                title: "Делаю AI и B2C-продукты с фокусом на метриках",
                Icon: Sparkles,
                accent: "#C9A66B",
                body:
                  "AI Visioner в MWS AI — задавал AI-направление двум продуктам. До этого — 11М+ пользователей МТС B2C-экосистемы, ×10 рост транзакций в МТС Cashback, CX Award в Газпром Нефти. Понимаю что такое discovery, метрики и как измерить дизайн.",
                items: [
                  "AI/ML продукты",
                  "B2C-экосистемы",
                  "Discovery · Research",
                  "CJM · JTBD · Job Stories",
                  "A/B-тесты · метрики",
                  "Product Strategy",
                ],
              },
              {
                key: "craft",
                label: "РЕМЕСЛО",
                title: "Сам пишу код и дизайн-системы",
                Icon: Code2,
                accent: "#4FC3F7",
                body:
                  "Запустил open-source Consta (150 Figma WAU, 10K+ NPM), MWS AI UI Kit. Пишу на React/TypeScript/Python, делаю WebGL-эксперименты. Верю что дизайн-лид должен уметь в инженерию.",
                items: [
                  "Figma · Design Systems",
                  "Art Direction · Визуальный язык",
                  "React · TypeScript",
                  "Python · Node.js",
                  "Three.js · WebGL · Shaders",
                  "Claude · Cursor · v0",
                ],
              },
            ]}
          />
        </motion.div>
      </section>

      {/* ═══════ PRINCIPLES — 4-up манифест ═══════ */}
      <section className="relative z-[1] bg-black border-t border-white/[0.06] overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
          className="px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-14 md:py-20"
        >
          <motion.div variants={fadeUp} className="mb-8 md:mb-12">
            <SectionLabel>ПРИНЦИПЫ</SectionLabel>
            <h2 className="font-p95 text-[clamp(28px,5vw,64px)] uppercase mt-2 leading-[0.92] tracking-tight max-w-3xl">
              <span className="text-white/40">как я</span>{" "}
              <span className="text-white">работаю<span className="text-[#A6FF00]">.</span></span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-px bg-white/[0.06]">
            {[
              {
                n: "01",
                title: "Дизайн должен считаться.",
                body:
                  "Если после релиза метрика не двинулась — я не считаю работу сделанной. Discovery, гипотезы, A/B, обратная связь с продуктом. CX Awards'24 получили за измеримое сокращение времени задач — не за визуал.",
              },
              {
                n: "02",
                title: "Инженерия важнее слайдов.",
                body:
                  "Лид, который не открывает DevTools, быстро теряет контакт с продуктом — и команда за ним. Сам пишу на React/TS/Python, делаю WebGL-эксперименты, дружу с AI-инструментами. Это ускоряет всех вокруг.",
              },
              {
                n: "03",
                title: "Команда сильнее героя.",
                body:
                  "За 8+ лет управления усвоил: лучше 10 сильных людей без меня, чем один я на износе. Нанимаю на рост, даю зоны ответственности, не микроменеджу — и это правда работает.",
              },
              {
                n: "04",
                title: "AI — не фича, это новая ось.",
                body:
                  "AI меняет не «один экран», а всю ось: как пользователь формулирует намерение, как мы проектируем failure-моды, что считается интерфейсом. В MWS AI задавал направление двум продуктам именно с этим в голове.",
              },
            ].map((p) => (
              <motion.div
                key={p.n}
                variants={fadeUp}
                className="bg-black p-7 md:p-9 flex flex-col justify-between min-h-[220px] md:min-h-[260px]"
              >
                <div>
                  <div className="font-p95 text-[13px] md:text-[14px] tracking-[0.2em] uppercase text-[#A6FF00]/85 mb-3">
                    {p.n} /
                  </div>
                  <h3 className="font-p95 text-[clamp(20px,2.4vw,32px)] uppercase leading-[1.02] text-white mb-4">
                    {p.title}
                  </h3>
                </div>
                <p className="text-sm md:text-[15px] text-white/60 leading-relaxed max-w-md">
                  {p.body}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════ ABOUT + CAREER — founder card + hover-list side-by-side ═══════ */}
      <section
        id="about"
        className="relative z-[1] bg-black border-t border-white/[0.06] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-14 md:py-20"
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-8 md:mb-12">
            <SectionLabel>КТО Я</SectionLabel>
            <h2 className="font-p95 text-[clamp(32px,5vw,64px)] uppercase mt-2 leading-[0.92]">
              ПРИВЕТ<span className="text-[#A6FF00]">.</span>
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-[minmax(260px,340px)_1fr] gap-6 md:gap-10">
            {/* Founder card — monochrome (без зелёного дуотона) */}
            <motion.div variants={fadeUp} className="lg:sticky lg:top-24 self-start">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/[0.06]">
                <Image
                  src="/images/photos/photo-3.jpg"
                  alt="Егор Шугаев — дизайн-директор, ментор и независимый консультант"
                  fill
                  className="object-cover grayscale contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div className="font-p95 text-[10px] tracking-[0.22em] uppercase text-white/70">
                    <span className="text-[#A6FF00]/70">[</span> FOUNDER <span className="text-[#A6FF00]/70">]</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] tracking-[0.2em] uppercase text-white/60">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A6FF00]/60 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#A6FF00]" />
                    </span>
                    Сейчас · МСК
                  </div>
                </div>
              </div>

              {/* Короткий bio под фото */}
              <p className="mt-5 md:mt-6 text-sm md:text-[15px] text-white/70 leading-relaxed max-w-sm">
                11 лет в дизайне, 9 — в бигтехе. Сейчас на свободном графике: менторю,
                консультирую, преподаю прикладной ИИ в ВШЭ. Код пишу с ИИ — React,
                Python, WebGL.
              </p>

              {/* Chips: «помимо основного» */}
              <div className="mt-5 flex flex-wrap gap-1.5">
                {[
                  "ВШЭ · преподаватель ИИ",
                  "CX Awards'24",
                  "English fluent",
                  "40+ менторинг-сессий",
                ].map((c) => (
                  <span
                    key={c}
                    className="text-[10px] md:text-[11px] tracking-[0.08em] uppercase px-2.5 py-1 rounded border border-white/[0.12] text-white/60"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Career hover-list */}
            <motion.div variants={fadeUp}>
              <div className="mb-4 flex items-center justify-between">
                <SectionLabel>КАРЬЕРА</SectionLabel>
                <span className="text-[10px] md:text-[11px] tracking-[0.15em] uppercase text-white/35 hidden md:inline">
                  Наведи, чтобы раскрыть
                </span>
              </div>
              <CareerHoverList />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══════ TESTIMONIALS — 2-up типографический заголовок ═══════ */}
      <section className="relative z-[1] bg-black border-t border-white/[0.06] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-14 md:py-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-8 md:mb-10">
            <SectionLabel>ОТЗЫВЫ</SectionLabel>
          </motion.div>

          <motion.h3
            variants={fadeUp}
            className="font-p95 text-[clamp(28px,5vw,64px)] leading-[0.92] uppercase tracking-tight mb-8 md:mb-12 max-w-4xl"
          >
            <span className="text-white/35">не верьте мне.</span>
            <br />
            <span className="text-white/35">читайте тех,</span>
            <br />
            <span className="text-white">
              кто со мной работал<span className="text-[#A6FF00]">.</span>
            </span>
          </motion.h3>

          <motion.div variants={stagger} className="grid md:grid-cols-2 gap-4 md:gap-5">
            {[
              {
                quote:
                  "Инноватор, шарит за ИИ. Уравновешенный — принимает только хорошо обдуманные решения. Собирает сильные команды, строит отлаженные процессы. И при этом очень приятный человек.",
                name: "Никита Вишневский",
                role: "Управляющий директор, Райффайзен (ранее — МТС)",
              },
              {
                quote:
                  "Работал с Егором и в Газпром нефти и когда он был в МТС. Лучше чем Егора найти трудно. Он легенда дизайна, ИИ и менеджмента.",
                name: "Егор Гончарук",
                role: "Руководитель проектного офиса, Газпром Нефть",
              },
            ].map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                className="relative p-6 md:p-7 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:border-[#A6FF00]/20 transition-colors duration-300"
              >
                <Quote className="w-5 h-5 text-[#A6FF00]/40 mb-4" strokeWidth={1.5} />
                <p className="text-white/75 text-base md:text-[17px] leading-relaxed mb-5">
                  {t.quote}
                </p>
                <div className="pt-4 border-t border-white/[0.06]">
                  <div className="text-sm text-white font-medium leading-tight">{t.name}</div>
                  <div className="text-[11px] text-white/40 mt-1 leading-snug">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════ MENTORING + SPEAKING — 2-up offer-карты ═══════ */}
      <section className="relative z-[1] bg-black border-t border-white/[0.06]">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
          className="px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-14 md:py-20"
        >
          <div className="grid md:grid-cols-2 gap-4 md:gap-5">
            {[
              {
                href: "/mentoring",
                label: "МЕНТОРИНГ",
                title: "Веду дизайнеров на переходе в сеньор-лиды",
                body:
                  "Провёл 40+ менторинг-сессий. Помогаю пройти развилки: как вырасти до лида, как построить команду, как защитить проект перед топ-менеджментом.",
                cta: "Записаться на сессию",
                accent: "#A6FF00",
              },
              {
                href: "/speaking",
                label: "ВЫСТУПЛЕНИЯ",
                title: "Читаю лекции и модерирую секции про AI и дизайн",
                body:
                  "ВШЭ (прикладной ИИ), Дизайн-Просмотр, внутренние конференции МТС и Ozon. Темы: AI в продукте, масштабирование дизайна, дизайн-системы.",
                cta: "Смотреть выступления",
                accent: "#C9A66B",
              },
            ].map((t) => (
              <motion.div key={t.href} variants={fadeUp}>
                <Link href={t.href} className="no-underline group block h-full">
                  <div className="relative h-full rounded-2xl overflow-hidden border border-white/[0.06] group-hover:border-white/20 bg-[#0a0a0a] transition-colors duration-300 p-7 md:p-9 flex flex-col justify-between min-h-[260px]">
                    <div
                      className="absolute top-7 right-7 md:top-9 md:right-9 h-2 w-2 rounded-full"
                      style={{ backgroundColor: t.accent }}
                    />
                    <div>
                      <div className="inline-flex items-center gap-1.5 font-p95 text-[13px] md:text-[14px] tracking-[0.2em] uppercase text-white/75 mb-4">
                        <span className="text-[#A6FF00]/80">[</span>
                        <span>{t.label}</span>
                        <span className="text-[#A6FF00]/80">]</span>
                      </div>
                      <h3 className="font-p95 text-[clamp(20px,2.6vw,32px)] uppercase leading-[1] text-white mb-4 max-w-sm">
                        {t.title}
                      </h3>
                      <p className="text-sm md:text-[15px] text-white/55 leading-relaxed max-w-md">
                        {t.body}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-white/55 group-hover:text-white transition-colors mt-6 pt-5 border-t border-white/[0.06]">
                      {t.cta}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════ TRANSITION «Если вы дочитали…» ═══════ */}
      <section className="relative z-[1] bg-black border-t border-white/[0.06] overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
          className="relative px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-20 md:py-32"
        >
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(166,255,0,0.08), transparent 70%)",
            }}
          />

          <motion.div variants={fadeUp} className="relative">
            <SectionLabel>ПОГОВОРИМ</SectionLabel>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="relative font-p95 text-[clamp(44px,9vw,128px)] leading-[0.9] uppercase tracking-tight max-w-5xl mt-8 md:mt-10"
          >
            <span className="text-white/30">Если вы</span>
            <br />
            <span className="text-white/30">дочитали, то нам</span>
            <br />
            <span className="text-white">
              пора поговорить<span className="text-[#A6FF00]">.</span>
            </span>
          </motion.h2>

          <motion.div variants={fadeUp} className="relative mt-10 md:mt-14">
            <Link
              href="#contacts"
              className="inline-flex items-center gap-2 text-sm md:text-base tracking-[0.1em] uppercase text-white/60 hover:text-white transition-colors no-underline group"
            >
              Все мои каналы ниже
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════ CONTACTS ═══════ */}
      <SplitSection id="contacts" label="КОНТАКТЫ" heading="НАПИСАТЬ">
        <div className="max-w-3xl">
          {/* Primary CTA */}
          <div className="mb-8 md:mb-10">
            <Link
              href="https://t.me/egoradi"
              target="_blank"
              className="group inline-flex items-center gap-3 bg-[#A6FF00] text-black hover:bg-[#B8FF33] rounded-lg px-6 py-4 md:py-5 text-base md:text-[17px] font-semibold transition-colors no-underline mb-5 md:mb-6"
            >
              <Send className="w-5 h-5" strokeWidth={2} />
              <span>Написать в Telegram</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
            </Link>

            <div className="flex flex-wrap gap-2.5">
              {[
                { label: "Email", href: "mailto:egor.outhead@gmail.com", Icon: Mail },
                { label: "LinkedIn", href: "https://www.linkedin.com/in/egorshugaev/", Icon: LinkedinIcon },
                { label: "GitHub", href: "https://github.com/outhead", Icon: GithubIcon },
                { label: "CV", href: "/Egor_Shugaev_CV.pdf", Icon: FileDown },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  className="inline-flex items-center gap-2 border border-white/10 hover:border-white/30 rounded-lg px-4 py-2.5 text-sm text-white/65 hover:text-white transition-colors no-underline"
                >
                  <link.Icon className="w-4 h-4" strokeWidth={1.75} />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="pt-6 md:pt-8 border-t border-white/[0.06] space-y-1.5 mb-8 md:mb-10">
            <p className="text-white/60 text-[15px] md:text-base">
              <MapPin className="w-4 h-4 text-white/30 inline mr-2 align-text-top" strokeWidth={1.5} />
              Москва · гибрид / удалёнка
            </p>
            <p className="text-[11px] tracking-[0.1em] uppercase text-white/35">
              Обычно отвечаю в течение нескольких часов
            </p>
          </div>

          {/* Engagement models */}
          <div className="pt-6 md:pt-8 border-t border-white/[0.06]">
            <div className="font-p95 text-[11px] md:text-[12px] tracking-[0.2em] uppercase text-white/45 mb-4">
              Беру на
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "Advisory-борды",
                "Part-time дизайн-директор · 2–4 мес",
                "Консалтинг-проекты",
                "Менторинг 1:1",
              ].map((c) => (
                <span
                  key={c}
                  className="text-[11px] md:text-[12px] tracking-[0.08em] uppercase px-3 py-1.5 rounded border border-white/[0.08] text-white/65"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </SplitSection>
    </>
  );
}

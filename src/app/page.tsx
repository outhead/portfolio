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
  ChevronDown,
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
const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" } },
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

// === Accordion-бенто для Skills (главный структурный ход из Stokt) ===
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
  // Фиксированная ширина контентной области: текст не перекомпонуется при росте flex-а,
  // потому что его ширина константна вне зависимости от того, какой flex у родителя.
  const CONTENT_WIDTH = 560;
  return (
    <div className="flex flex-col md:flex-row gap-2 md:gap-3 w-full md:h-[440px]">
      {panels.map((p) => {
        const isActive = active === p.key;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => setActive(p.key)}
            onMouseEnter={() => setActive(p.key)}
            className={`group relative text-left rounded-2xl border overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:h-full ${
              isActive
                ? "border-white/15 bg-[#0a0a0a] md:flex-[6]"
                : "border-white/[0.06] bg-[#080808] hover:border-white/15 md:flex-[1] md:min-w-[72px]"
            }`}
            aria-expanded={isActive}
          >
            {/* === Десктоп: вертикальная рейка (свёрнутое состояние) === */}
            <div
              className="hidden md:flex flex-col items-center justify-between absolute inset-0 py-6 px-3 transition-opacity duration-300"
              style={{
                opacity: isActive ? 0 : 1,
                transitionDelay: isActive ? "0ms" : "300ms",
                pointerEvents: isActive ? "none" : "auto",
              }}
              aria-hidden={isActive}
            >
              <p.Icon className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors" strokeWidth={1.5} />
              <div
                className="font-p95 text-[13px] tracking-[0.2em] uppercase text-white/55 group-hover:text-white/85 transition-colors whitespace-nowrap"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                [ {p.label} ]
              </div>
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: "transparent", boxShadow: `inset 0 0 0 1px ${p.accent}` }}
              />
            </div>

            {/* === Мобильный свёрнутый вид === */}
            <div className={`md:hidden ${isActive ? "hidden" : "flex"} items-center justify-between px-5 py-4`}>
              <div className="flex items-center gap-3">
                <p.Icon className="w-4 h-4 text-white/50" strokeWidth={1.5} />
                <div className="font-p95 text-[13px] tracking-[0.2em] uppercase text-white/75">
                  [ {p.label} ]
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40" strokeWidth={1.75} />
            </div>

            {/* === Контент раскрытой панели ===
                 Десктоп: абсолют с фиксированной шириной — при изменении flex ширины контент
                 не перекомпонуется. Появляется после того как flex успел раскрыться (delay ~300ms).
                 Мобайл: обычный поток, fade-in при клике. */}
            <div
              className={`transition-opacity duration-300 ease-out md:absolute md:inset-0 md:overflow-hidden ${
                isActive ? "block md:flex md:items-start" : "hidden md:block"
              }`}
              style={{
                opacity: isActive ? 1 : 0,
                transitionDelay: isActive ? "300ms" : "0ms",
                pointerEvents: isActive ? "auto" : "none",
              }}
              aria-hidden={!isActive}
            >
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
                  <span className="text-[#A6FF00]/80">[</span>
                  <span>{p.label}</span>
                  <span className="text-[#A6FF00]/80">]</span>
                </div>

                <h3 className="font-p95 text-[clamp(22px,2.6vw,36px)] leading-[0.98] uppercase text-white mb-4">
                  {p.title}
                </h3>

                <p className="text-sm md:text-[15px] text-white/60 leading-relaxed mb-6">
                  {p.body}
                </p>

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
            </div>
          </button>
        );
      })}
    </div>
  );
}

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

function CareerAccordion() {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <div className="rounded-2xl border border-white/[0.06] overflow-hidden bg-white/[0.015]">
      {careerJobs.map((job, i) => {
        const isOpen = openIdx === i;
        return (
          <div
            key={job.year + job.company}
            className={i > 0 ? "border-t border-white/[0.06]" : ""}
          >
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="group w-full flex items-center gap-4 md:gap-6 px-5 md:px-7 py-4 md:py-5 text-left hover:bg-white/[0.02] transition-colors"
            >
              {/* Dot */}
              <span
                className={`shrink-0 w-2 h-2 rounded-full ${
                  job.current ? "bg-[#A6FF00]" : "bg-white/25"
                }`}
                aria-hidden
              />
              {/* Year */}
              <span className="shrink-0 font-p95 text-[11px] md:text-[12px] tracking-[0.2em] uppercase text-white/50 w-[90px] md:w-[110px]">
                {job.year}
              </span>
              {/* Company + role */}
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
              {/* Chevron */}
              <ChevronDown
                className={`shrink-0 w-4 h-4 text-white/40 transition-transform duration-300 ${
                  isOpen ? "rotate-180 text-white/80" : "group-hover:text-white/70"
                }`}
                strokeWidth={2}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 md:px-7 pb-5 md:pb-7 pl-[calc(20px+8px+16px+90px)] md:pl-[calc(28px+8px+24px+110px)]">
                    <p className="text-[13px] md:text-[14px] text-white/65 leading-relaxed mb-3">
                      {job.scope}
                    </p>
                    {job.details && (
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
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative min-h-[85vh] flex flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/photos/photo-4.jpg"
            alt="Егор Шугаев выступает на конференции"
            fill
            className="object-cover opacity-40"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black z-[1]" />

        <div className="relative z-[5] h-24 md:h-32" />

        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="relative z-[5] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] w-full"
        >
          <motion.h1
            variants={fadeUp}
            className="font-p95 text-[clamp(56px,11vw,160px)] leading-[0.92] uppercase tracking-tight"
          >
            <span className="text-white">ЕГОР</span>
            <br />
            <span className="text-white">ШУГАЕВ</span>
            <span className="text-[#A6FF00]">.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 md:mt-7 max-w-2xl text-lg md:text-2xl leading-snug text-white/85 font-light"
          >
            В МТС и Газпром Нефти строил дизайн-функции, в Ozon — дизайн-комьюнити, в MWS AI — AI-направление. Сейчас — менторинг, консалтинг и независимые проекты.
          </motion.p>

          {/* Статус «сейчас» — одна строка вместо многоярусного стека */}
          <motion.div
            variants={fadeUp}
            className="mt-7 md:mt-9 inline-flex flex-wrap items-center gap-x-3 gap-y-2"
          >
            <span className="inline-flex items-center gap-2 font-p95 text-[13px] md:text-[14px] tracking-[0.2em] uppercase text-white/65">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A6FF00]/60 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A6FF00]" />
              </span>
              Сейчас
            </span>
            <span className="text-base md:text-xl text-white/85 font-medium leading-tight">
              Свободный график · Консультирую · Менторю
            </span>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-5 flex flex-wrap items-center gap-3"
          >
            <span className="text-[12px] md:text-[13px] tracking-[0.12em] uppercase text-white/50">
              Москва · гибрид / удалёнка
            </span>
            <span className="hidden md:inline-block h-4 w-px bg-white/15" />
            <Link
              href="https://t.me/egoradi"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-[12px] md:text-[13px] tracking-[0.1em] uppercase text-[#A6FF00]/90 hover:text-[#A6FF00] transition-colors no-underline"
            >
              <Send className="w-3.5 h-3.5" strokeWidth={2} />
              Написать в Telegram
            </Link>
          </motion.div>
        </motion.div>

        <div className="pb-10 md:pb-14" />
      </section>

      {/* ===== METRICS — отдельная крупная секция с гигантскими числами ===== */}
      <section className="relative z-[1] bg-black border-t border-white/[0.06] overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
          className="px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-20 md:py-28"
        >
          <motion.div variants={fadeUp} className="mb-10 md:mb-14">
            <div className="inline-flex items-center gap-1.5 font-p95 text-[13px] md:text-[14px] tracking-[0.2em] uppercase text-white/75">
              <span className="text-[#A6FF00]/80">[</span>
              <span>ЦИФРЫ</span>
              <span className="text-[#A6FF00]/80">]</span>
            </div>
            <h2 className="font-p95 text-[clamp(32px,5vw,64px)] uppercase mt-3 leading-[0.95] max-w-3xl">
              9 лет опыта в крупнейших бигтех-компаниях России<span className="text-[#A6FF00]">.</span>
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
                className={`py-8 md:py-12 ${
                  i > 0 ? "md:border-l border-white/[0.08]" : ""
                } ${i === 1 ? "border-l md:border-l" : ""} ${
                  i === 2 ? "border-t md:border-t-0" : ""
                } ${i === 3 ? "border-t md:border-t-0 border-l" : ""} px-4 md:px-6`}
              >
                <div className="font-p95 text-[clamp(48px,8vw,112px)] leading-none text-white tracking-tight">
                  {s.value}
                </div>
                <div className="mt-3 md:mt-4 text-sm md:text-base tracking-[0.08em] uppercase text-white/65">
                  {s.label}
                </div>
                <div className="text-[12px] md:text-[13px] tracking-[0.1em] uppercase text-white/40 mt-1.5">
                  {s.ctx}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== COMPANY MARQUEE — бесконечная бегущая лента как у Stokt ===== */}
      <section
        aria-label="Компании, в которых я работал"
        className="relative z-[1] bg-black border-t border-b border-white/[0.06] py-10 md:py-14 overflow-hidden"
      >
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex-shrink-0 pl-5 md:pl-[6%] lg:pl-[10%] xl:pl-[14%] pr-4 md:pr-6">
            <div className="inline-flex items-center gap-2 font-p95 text-[11px] md:text-[12px] tracking-[0.24em] uppercase text-white/45 whitespace-nowrap">
              <span className="inline-block w-6 md:w-10 h-px bg-white/25" />
              <span>Работал в</span>
            </div>
          </div>
          <div className="relative flex-1 overflow-hidden">
            {/* Edge fades */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-24 z-10"
              style={{
                background: "linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,0))",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-24 z-10"
              style={{
                background: "linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0))",
              }}
            />
            <div className="flex items-center whitespace-nowrap marquee">
              {/* Два одинаковых блока → translateX(-50%) даёт бесшовный цикл */}
              {[0, 1].map((loopIdx) => (
                <div key={loopIdx} className="flex items-center shrink-0" aria-hidden={loopIdx === 1}>
                  {[
                    "МТС",
                    "Ozon",
                    "Газпром Нефть",
                    "MWS AI",
                    "ВШЭ",
                  ].map((name) => (
                    <span key={name + loopIdx} className="flex items-center">
                      <span className="font-p95 text-[28px] md:text-[40px] lg:text-[48px] tracking-[0.04em] uppercase text-white/80 leading-none px-8 md:px-12">
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
      </section>

      {/* ===== PORTFOLIO ===== */}
      <SplitSection id="portfolio" label="ИЗБРАННЫЕ РАБОТЫ" heading="ПРОЕКТЫ" wideRight>
        <div className="space-y-5">
          {/* Featured first project — full width, 2-col internal */}
          <motion.div variants={fadeUp}>
            <ProjectCard project={workProjects[0]} index={0} featured />
          </motion.div>

          {/* Row 1: two 1x1 cards */}
          {workProjects[1] && workProjects[2] && (
            <div className="grid sm:grid-cols-2 gap-5">
              <motion.div variants={fadeUp}>
                <ProjectCard project={workProjects[1]} index={1} />
              </motion.div>
              <motion.div variants={fadeUp}>
                <ProjectCard project={workProjects[2]} index={2} />
              </motion.div>
            </div>
          )}

          {/* Row 2: widescreen accent card — 2x1 bento break */}
          {workProjects[3] && (
            <motion.div variants={fadeUp}>
              <ProjectCard project={workProjects[3]} index={3} featured />
            </motion.div>
          )}

          {/* Row 3: last 1x1 + CTA-card in the empty slot */}
          <div className="grid sm:grid-cols-2 gap-5">
            {workProjects[4] && (
              <motion.div variants={fadeUp}>
                <ProjectCard project={workProjects[4]} index={4} />
              </motion.div>
            )}
            <motion.div variants={fadeUp}>
              <Link
                href="/experiments"
                className="no-underline group block h-full"
              >
                <div className="relative h-full min-h-[240px] md:min-h-[280px] rounded-2xl overflow-hidden border border-white/[0.06] group-hover:border-[#A6FF00]/40 bg-[#0a0a0a] transition-colors duration-300 p-6 md:p-8 flex flex-col justify-between">
                  <div>
                    <div className="font-p95 text-[12px] md:text-[13px] tracking-[0.2em] uppercase text-white/50 mb-3">
                      ЭКСПЕРИМЕНТЫ
                    </div>
                    <h3 className="font-p95 text-[clamp(24px,3.5vw,40px)] uppercase leading-[0.95] text-white">
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
        </div>
      </SplitSection>

      {/* Divider */}
      <div className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] bg-black">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </div>

      {/* ===== ABOUT ===== */}
      <SplitSection id="about" label="ОБО МНЕ" heading="ПРИВЕТ!" wideRight>
        <div>
          {/* ===== FOUNDER CARD — фото + крупный манифест (stokt-style) ===== */}
          <div className="relative mb-14 md:mb-20 grid md:grid-cols-[minmax(220px,300px)_1fr] gap-6 md:gap-10 items-start">
            {/* Photo — вертикальный кроп с зелёным дуотоном-тинтом */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/[0.06]">
              <Image
                src="/images/photos/photo-3.jpg"
                alt="Егор Шугаев — дизайн-директор, ментор и независимый консультант"
                fill
                className="object-cover"
              />
              {/* Duotone-like tint */}
              <div
                className="absolute inset-0 mix-blend-multiply"
                style={{ background: "linear-gradient(180deg, rgba(166,255,0,0.12) 0%, rgba(0,0,0,0.25) 100%)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              {/* Photo caption */}
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

            {/* Right column — bio split into 2 columns on wide screens to shorten vertical */}
            <div className="pt-2">
              <div className="grid lg:grid-cols-2 gap-x-10 gap-y-4 md:gap-y-5 text-white/75 leading-relaxed text-base md:text-lg mb-6 md:mb-8">
                <p className="lg:col-span-2 max-w-[68ch]">
                  11 лет в дизайне, 9 — в бигтехе. В МТС — Art Director B2C-экосистемы: 16 команд, 60+ дизайнеров, 11М+ пользователей. В Ozon — Community Lead: канал с 0 до 17К подписчиков, −60% к оттоку на найме.
                </p>
                <p>
                  В Газпром Нефти — Head of Design: 76 команд, 42 лида, 100+ дизайнеров, CX Award&rsquo;24. В MWS AI — AI Visioner: задавал AI-направление двум продуктам дивизиона.
                </p>
                <p>
                  Сейчас на свободном графике: менторю, консультирую, преподаю прикладной ИИ в ВШЭ. Код пишу с ИИ — React, Python, WebGL.
                </p>
              </div>
            </div>
          </div>

          {/* Stats row + credentials — full width under founder grid */}
          <div className="mb-14 md:mb-20">
            <div className="border-t border-white/[0.08] pt-6">
              <div className="font-p95 text-[11px] md:text-[12px] tracking-[0.2em] uppercase text-white/45 mb-4">
                Помимо основного
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  "ВШЭ — преподаватель ИИ",
                  "CX Awards'24",
                  "English fluent",
                  "40+ менторинг-сессий",
                ].map((c) => (
                  <span
                    key={c}
                    className="text-[11px] md:text-[12px] tracking-[0.08em] uppercase px-3 py-1.5 rounded border border-white/[0.12] text-white/70"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ===== TESTIMONIALS — типографический заголовок с астериксом (stokt-style) ===== */}
          <div className="mb-14 md:mb-20">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              variants={stagger}
            >
              <motion.div
                variants={fadeUp}
                className="font-p95 text-[13px] md:text-[14px] tracking-[0.2em] uppercase text-white/75 mb-5"
              >
                <span className="text-[#A6FF00]/80">[</span> ОТЗЫВЫ <span className="text-[#A6FF00]/80">]</span>
              </motion.div>

              <motion.h3
                variants={fadeUp}
                className="font-p95 text-[clamp(32px,6vw,80px)] leading-[0.92] uppercase tracking-tight mb-10 md:mb-14 max-w-4xl"
              >
                <span className="text-white/35">не верьте мне.</span>
                <br />
                <span className="text-white/35">читайте тех,</span>
                <br />
                <span className="text-white">
                  кто со мной работал<span className="text-[#A6FF00]">.</span>
                </span>
              </motion.h3>

              <motion.div
                variants={stagger}
                className="grid md:grid-cols-2 gap-4 md:gap-5"
              >
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
                      <div className="text-sm text-white font-medium leading-tight">
                        {t.name}
                      </div>
                      <div className="text-[11px] text-white/40 mt-1 leading-snug">
                        {t.role}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* ===== SKILLS LABEL ===== */}
          <div className="font-p95 text-[13px] md:text-[14px] tracking-[0.2em] uppercase text-white/75 mb-5">
            <span className="text-[#A6FF00]/80">[</span> ЧТО УМЕЮ <span className="text-[#A6FF00]/80">]</span>
          </div>

          {/* Skills — accordion-бенто: одна раскрытая + две вертикальных рейки */}
          <div className="mb-8">
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
          </div>

          {/* Career — vertical accordion timeline */}
          <div className="mt-14 md:mt-20">
            <div className="font-p95 text-[13px] md:text-[14px] tracking-[0.2em] uppercase text-white/75 mb-5">
              Карьера
            </div>
            <CareerAccordion />
          </div>
        </div>
      </SplitSection>

      {/* ===== PRINCIPLES — манифест в стиле «digital design powerhouse» ===== */}
      <section className="relative z-[1] bg-black border-t border-white/[0.06] overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
          className="px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-20 md:py-28"
        >
          <motion.div variants={fadeUp} className="mb-12 md:mb-16">
            <div className="inline-flex items-center gap-1.5 font-p95 text-[13px] md:text-[14px] tracking-[0.2em] uppercase text-white/75 mb-4">
              <span className="text-[#A6FF00]/80">[</span>
              <span>ПРИНЦИПЫ</span>
              <span className="text-[#A6FF00]/80">]</span>
            </div>
            <h2 className="font-p95 text-[clamp(32px,6vw,80px)] uppercase leading-[0.92] tracking-tight max-w-3xl">
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
            ].map((p, i) => (
              <motion.div
                key={p.n}
                variants={fadeUp}
                className="bg-black p-8 md:p-10 lg:p-12 flex flex-col justify-between min-h-[240px] md:min-h-[300px]"
              >
                <div>
                  <div className="font-p95 text-[13px] md:text-[14px] tracking-[0.2em] uppercase text-[#A6FF00]/85 mb-4">
                    {p.n} /
                  </div>
                  <h3 className="font-p95 text-[clamp(22px,2.6vw,36px)] uppercase leading-[1.02] text-white mb-5">
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

      {/* ===== MENTORING + SPEAKING TEASERS — двумя крупными картами ===== */}
      <section className="relative z-[1] bg-black border-t border-white/[0.06]">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
          className="px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-16 md:py-24"
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
                <Link
                  href={t.href}
                  className="no-underline group block h-full"
                >
                  <div className="relative h-full rounded-2xl overflow-hidden border border-white/[0.06] group-hover:border-white/20 bg-[#0a0a0a] transition-colors duration-300 p-7 md:p-9 flex flex-col justify-between min-h-[280px]">
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
                      <h3 className="font-p95 text-[clamp(22px,3vw,36px)] uppercase leading-[1] text-white mb-4 max-w-sm">
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

      {/* ===== FINAL CTA — большой typographic punchline перед контактами ===== */}
      <section className="relative z-[1] bg-black border-t border-white/[0.06] overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
          className="relative px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-24 md:py-40"
        >
          {/* Ambient glow */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(166,255,0,0.08), transparent 70%)",
            }}
          />

          <motion.div variants={fadeUp} className="relative">
            <div className="inline-flex items-center gap-1.5 font-p95 text-[13px] md:text-[14px] tracking-[0.2em] uppercase text-white/75 mb-8 md:mb-10">
              <span className="text-[#A6FF00]/80">[</span>
              <span>ПОГОВОРИМ</span>
              <span className="text-[#A6FF00]/80">]</span>
            </div>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="relative font-p95 text-[clamp(48px,10vw,144px)] leading-[0.9] uppercase tracking-tight max-w-5xl"
          >
            <span className="text-white/30">Если вы</span>
            <br />
            <span className="text-white/30">дочитали, то нам</span>
            <br />
            <span className="text-white">пора поговорить<span className="text-[#A6FF00]">.</span></span>
          </motion.h2>

          <motion.div
            variants={fadeUp}
            className="relative mt-10 md:mt-14"
          >
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

      {/* ===== CONTACTS ===== */}
      <SplitSection id="contacts" label="КОНТАКТЫ" heading="НАПИСАТЬ">
        <div>
          <p className="text-white/50 leading-relaxed text-base md:text-lg mb-3">
            <MapPin className="w-4 h-4 text-white/25 inline mr-2 align-text-top" strokeWidth={1.5} />
            Москва · гибрид / удалёнка. Самый быстрый канал — Telegram.
          </p>
          <p className="text-[10px] tracking-[0.1em] uppercase text-white/25 mb-8">
            Обычно отвечаю в течение нескольких часов.
          </p>

          {/* Engagement model */}
          <div className="mb-8 pt-5 border-t border-white/[0.06]">
            <div className="font-p95 text-[11px] md:text-[12px] tracking-[0.2em] uppercase text-white/45 mb-3">
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

          <div className="flex flex-wrap gap-3">
            {[
              { label: "Telegram", href: "https://t.me/egoradi", primary: true, Icon: Send },
              { label: "Email", href: "mailto:egor.outhead@gmail.com", Icon: Mail },
              { label: "LinkedIn", href: "https://www.linkedin.com/in/egorshugaev/", Icon: LinkedinIcon },
              { label: "GitHub", href: "https://github.com/outhead", Icon: GithubIcon },
              { label: "CV", href: "/Egor_Shugaev_CV.pdf", Icon: FileDown },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target="_blank"
                className={
                  link.primary
                    ? "inline-flex items-center gap-2 bg-[#A6FF00] text-black hover:bg-[#B8FF33] rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors no-underline"
                    : "inline-flex items-center gap-2 border border-white/10 hover:border-white/30 rounded-lg px-5 py-2.5 text-sm text-white/60 hover:text-white transition-colors no-underline"
                }
              >
                <link.Icon className="w-4 h-4" strokeWidth={1.75} />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </SplitSection>

    </>
  );
}

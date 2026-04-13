"use client";

import ProjectCard from "@/components/ProjectCard";
import { workProjects, experimentProjects } from "@/data/projects";
import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import {
  Briefcase,
  Sparkles,
  GraduationCap,
  LayoutGrid,
  Code2,
  Wand2,
  Mic2,
  Send,
  Mail,
  FileDown,
  CalendarDays,
  Clock,
  Users,
  ArrowUpRight,
  MapPin,
} from "lucide-react";

// Brand icons (lucide removed them; use inline SVGs)
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

// === Motion variants ===
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const cardHover = {
  rest: { y: 0, borderColor: "rgba(255,255,255,0.08)" },
  hover: {
    y: -4,
    borderColor: "rgba(166,255,0,0.35)",
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

// Viewport trigger shorthand
const viewport = { once: true, margin: "-10% 0px -10% 0px" };

// Section label with accent dot
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-[10px] md:text-[11px] tracking-[0.22em] uppercase text-white/50 font-medium">
      <span className="h-1 w-1 rounded-full bg-[#A6FF00]" />
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/photos/photo-4.jpg"
            alt="Егор Шугаев выступает на конференции"
            fill
            className="object-cover opacity-30"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black z-[1]" />
        {/* soft accent glow */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#A6FF00]/[0.04] blur-[120px] z-[1]" />

        <div className="relative z-[5] h-24 md:h-32" />

        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="relative z-[5] px-5 md:px-10 w-full"
        >
          <motion.h1
            variants={fadeUp}
            className="font-p95 text-[clamp(56px,11vw,160px)] leading-[0.92] uppercase tracking-tight text-white"
          >
            ЕГОР
            <br />
            ШУГАЕВ
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 md:mt-7 max-w-3xl text-lg md:text-2xl leading-snug text-white/80 font-light"
          >
            Арт-директор B2C-экосистемы и Head of Design AI-дивизиона&nbsp;МТС.
            За 7 лет построил дизайн-функции в МТС, Ozon и Газпром&nbsp;Нефти —
            от процессов и найма до production-продуктов на 8.8М+ пользователей.
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="mt-3 text-[11px] md:text-xs tracking-[0.15em] uppercase text-white/30"
          >
            Арт-директор · Head of Design · AI · Ментор · Москва
          </motion.p>
        </motion.div>

        {/* Metrics strip */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
          className="relative z-[5] px-5 md:px-10 mt-10 md:mt-16"
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-white/[0.06] border border-white/[0.06] rounded-lg overflow-hidden backdrop-blur-sm">
            {[
              { value: "8.8М+", label: "пользователей", ctx: "МТС Cashback, 2018–21" },
              { value: "100+", label: "дизайнеров в команде", ctx: "Газпром Нефть, 2022–24" },
              { value: "−60%", label: "TTM", ctx: "МТС AI, 2024" },
              { value: "+40% / −60%", label: "найм · текучка", ctx: "Ozon, 2021–22" },
              { value: "CX 2024", label: "награда за сервис", ctx: "МТС, сервисное окно" },
            ].map((s) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                className="bg-black/80 p-4 md:p-5 relative group overflow-hidden"
              >
                <div className="text-xl md:text-2xl font-semibold text-white leading-none mb-2 group-hover:text-[#A6FF00] transition-colors">
                  {s.value}
                </div>
                <div className="text-[9px] md:text-[10px] tracking-[0.12em] uppercase text-white/40">
                  {s.label}
                </div>
                <div className="mt-2 text-[9px] text-white/25 leading-snug">
                  {s.ctx}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Worked at */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewport}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-[5] px-5 md:px-10 mt-8 mb-10 md:mb-12"
        >
          <div className="text-[9px] tracking-[0.2em] uppercase text-white/25 mb-3">
            Работал в
          </div>
          <div className="flex flex-wrap items-center gap-x-8 md:gap-x-12 gap-y-3 text-sm md:text-base font-medium text-white/55">
            <span>МТС</span>
            <span className="text-white/15">/</span>
            <span>Ozon</span>
            <span className="text-white/15">/</span>
            <span>Газпром&nbsp;Нефть</span>
            <span className="text-white/15">/</span>
            <span>ВШЭ</span>
          </div>
        </motion.div>
      </section>

      {/* ===== OPEN TO ===== */}
      <section
        id="open-to"
        className="relative z-[1] px-5 md:px-10 py-16 md:py-24 border-t border-white/[0.06] bg-black"
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-4">
            <SectionLabel>Сейчас открыт к</SectionLabel>
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="max-w-3xl text-lg md:text-2xl leading-snug text-white/80 font-light mb-10 md:mb-14"
          >
            7 лет строил дизайн-функции в МТС, Ozon и Газпром Нефти. Сейчас веду
            AI-дивизион МТС. Ищу{" "}
            <span className="text-[#A6FF00]">C-level роль</span> или{" "}
            <span className="text-[#A6FF00]">консалтинг по AI в дизайне</span>.
          </motion.p>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-6xl">
            {[
              {
                icon: Briefcase,
                title: "C-level роли",
                desc: "VP / Head of Design в продуктовых компаниях. Управление 50+ дизайнеров, трансформация, AI-интеграция.",
                cta: "Обсудить роль",
                href: "mailto:egor.outhead@gmail.com?subject=Вакансия",
              },
              {
                icon: Sparkles,
                title: "Консалтинг",
                desc: "Внедрение AI в дизайн-процесс, аудит дизайн-функции, разработка стратегии. От 2 недель до 3 месяцев.",
                cta: "Запросить консалтинг",
                href: "mailto:egor.outhead@gmail.com?subject=Консалтинг",
              },
              {
                icon: GraduationCap,
                title: "Менторинг",
                desc: "1:1 для дизайнеров и лидов. Разовая встреча — 8 000 ₽. Регулярный менторинг — от 25 000 ₽ / месяц.",
                cta: "Записаться",
                href: "#mentoring",
              },
            ].map((o) => {
              const Icon = o.icon;
              return (
                <motion.div
                  key={o.title}
                  variants={fadeUp}
                  initial="rest"
                  whileHover="hover"
                  animate="rest"
                >
                  <motion.div variants={cardHover}>
                    <Link
                      href={o.href}
                      className="block border border-white/[0.08] rounded-xl p-5 md:p-6 no-underline group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#A6FF00]/[0.06] blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <Icon
                        className="w-6 h-6 text-white/60 group-hover:text-[#A6FF00] transition-colors mb-5"
                        strokeWidth={1.5}
                      />
                      <h3 className="text-base md:text-lg font-medium text-white mb-2">
                        {o.title}
                      </h3>
                      <p className="text-sm text-white/50 leading-relaxed mb-6">
                        {o.desc}
                      </p>
                      <span className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-white/60 group-hover:text-[#A6FF00] transition-colors">
                        {o.cta}{" "}
                        <ArrowUpRight
                          className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          strokeWidth={2}
                        />
                      </span>
                    </Link>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            variants={fadeUp}
            className="mt-10 md:mt-14 max-w-4xl border-t border-white/[0.06] pt-8"
          >
            <div className="mb-3">
              <SectionLabel>Не беру</SectionLabel>
            </div>
            <p className="text-sm md:text-base text-white/45 leading-relaxed">
              Операционку без продуктового мандата · брендинг и маркетинговый
              дизайн · проекты короче 3&nbsp;месяцев · роли без доступа к стратегии.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ===== ABOUT ===== */}
      <section
        id="about"
        className="relative z-[1] px-5 md:px-10 py-20 md:py-28 border-t border-white/[0.06] bg-black"
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-3">
            <SectionLabel>01 — Обо мне</SectionLabel>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="font-p95 text-[clamp(28px,4vw,56px)] uppercase mb-8 md:mb-12"
          >
            ПРИВЕТ!
          </motion.h2>

          <motion.div
            variants={fadeUp}
            className="grid md:grid-cols-[1fr_auto] gap-8 md:gap-16 max-w-5xl"
          >
            <div>
              <p className="text-white/70 leading-relaxed text-base md:text-lg mb-6">
                За последние 7 лет руководил дизайн-направлениями в МТС, Ozon и
                Газпром Нефти. Сейчас совмещаю арт-директора B2C-экосистемы МТС
                (40+ дизайнеров, 8 команд) и Head of Design AI-дивизиона.
              </p>
              <p className="text-white/45 leading-relaxed text-sm md:text-base mb-6">
                Формировал дизайн-стратегию МТС в период трансформации в
                экосистему. Заложил основы дизайн-комьюнити в Ozon — найм +40%,
                текучка −60%. Развивал open-source дизайн-систему Consta в
                Газпром Нефти (10K+ NPM-скачиваний). Получил CX Awards 2024 за
                единое сервисное окно.
              </p>
              <p className="text-white/45 leading-relaxed text-sm md:text-base">
                Преподаю прикладное использование ИИ в ВШЭ. Веду менторинг,
                выступаю на конференциях, пишу код на React и Python,
                экспериментирую с WebGL и AI-автоматизацией.
              </p>
            </div>

            <div className="hidden md:block w-56 shrink-0">
              <div className="relative w-56 h-72 rounded-xl overflow-hidden border border-white/[0.08]">
                <Image
                  src="/images/photos/photo-3.jpg"
                  alt="Егор Шугаев"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Skills — grouped, with icons */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
          className="mt-14 md:mt-20 grid md:grid-cols-3 gap-8 md:gap-10 max-w-5xl"
        >
          {[
            {
              icon: LayoutGrid,
              title: "Core",
              items: [
                "Design Management",
                "Art Direction",
                "Design Strategy",
                "Product Design",
                "Design Systems",
                "UX Research",
              ],
            },
            {
              icon: Code2,
              title: "Stack",
              items: [
                "Figma",
                "AI/ML Products",
                "Claude · Cursor · v0",
                "React · TypeScript",
                "Python",
                "Three.js · WebGL",
              ],
            },
            {
              icon: Wand2,
              title: "Experiments",
              items: [
                "AI-автоматизация",
                "Generative design",
                "Creative coding",
                "Shader-эксперименты",
                "LLM-агенты",
              ],
            },
          ].map((g) => {
            const Icon = g.icon;
            return (
              <motion.div
                key={g.title}
                variants={fadeUp}
                className="border border-white/[0.06] rounded-xl p-5 md:p-6 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="w-4 h-4 text-[#A6FF00]" strokeWidth={1.75} />
                  <div className="text-[10px] tracking-[0.18em] uppercase text-white/60 font-medium">
                    {g.title}
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {g.items.map((item) => (
                    <li key={item} className="text-sm text-white/65 leading-snug">
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Career timeline */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
          className="mt-14 md:mt-20"
        >
          <motion.div variants={fadeUp} className="mb-6">
            <SectionLabel>Карьера</SectionLabel>
          </motion.div>
          <div className="space-y-0">
            {[
              {
                year: "2024",
                company: "МТС",
                role: "Арт-директор B2C · Head of Design AI Division",
                current: true,
              },
              {
                year: "2022",
                company: "Газпром Нефть",
                role: "Lead Product Designer → Design Manager",
              },
              {
                year: "2021",
                company: "OZON",
                role: "Senior Product Designer → Design Lead",
              },
              {
                year: "2018",
                company: "МТС",
                role: "Product Designer → Head of Design Direction",
              },
            ].map((job) => (
              <motion.div
                key={job.year + job.company}
                variants={fadeUp}
                className="flex items-baseline gap-4 md:gap-8 py-3 border-b border-white/[0.06] hover:border-[#A6FF00]/30 transition-colors"
              >
                <span className="text-[10px] tracking-[0.15em] uppercase text-white/25 w-12 shrink-0 font-mono">
                  {job.year}
                </span>
                <span className="text-sm text-white/80 w-32 md:w-40 shrink-0">
                  {job.company}
                </span>
                <span className="text-sm text-white/45">
                  {job.role}
                  {job.current && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[9px] tracking-[0.1em] uppercase text-[#A6FF00]/80">
                      <span className="h-1 w-1 rounded-full bg-[#A6FF00] animate-pulse" />
                      now
                    </span>
                  )}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== PORTFOLIO ===== */}
      <section
        id="portfolio"
        className="relative z-[1] px-5 md:px-10 py-20 md:py-28 border-t border-white/[0.06] bg-black"
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-3">
            <SectionLabel>02 — Портфолио</SectionLabel>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="font-p95 text-[clamp(28px,4vw,56px)] uppercase mb-10 md:mb-14"
          >
            ПРОЕКТЫ
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-5 md:gap-6">
            {workProjects.map((project, i) => (
              <motion.div key={project.slug} variants={fadeUp}>
                <ProjectCard project={project} index={i} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== PUBLIC ===== */}
      <section
        id="public"
        className="relative z-[1] px-5 md:px-10 py-20 md:py-28 border-t border-white/[0.06] bg-black"
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-3">
            <SectionLabel>03 — Публично</SectionLabel>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="font-p95 text-[clamp(28px,4vw,56px)] uppercase mb-10 md:mb-14"
          >
            ГОВОРЮ И ПИШУ
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl">
            {[
              {
                icon: Mic2,
                title: "Выступления",
                items: [
                  "Форум «Смарт Дизайн» — AI в дизайне",
                  "Стендап «Мультибрендинг» — МТС",
                  "Конференции по дизайн-системам и ML",
                  "Мастер-классы для продуктовых команд",
                ],
                foot: "Пригласить выступить — egor.outhead@gmail.com",
              },
              {
                icon: GraduationCap,
                title: "Преподавание",
                items: [
                  "ВШЭ — прикладное использование ИИ",
                  "Регулярные воркшопы внутри МТС",
                  "Закрытые воркшопы для продуктовых команд",
                ],
              },
              {
                icon: Send,
                title: "Канал «Vigrom»",
                body: "Авторский Telegram-канал про AI и инструменты дизайнера. Практика без хайпа — разборы Claude, Cursor, v0 и того, как встраивать их в продуктовую работу.",
                link: { href: "https://t.me/vigrom", label: "Читать канал" },
              },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <motion.div
                  key={c.title}
                  variants={fadeUp}
                  className="border border-white/[0.06] rounded-xl p-5 md:p-6 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className="w-4 h-4 text-[#A6FF00]" strokeWidth={1.75} />
                    <div className="text-[10px] tracking-[0.18em] uppercase text-white/60 font-medium">
                      {c.title}
                    </div>
                  </div>
                  {c.items && (
                    <ul className="space-y-2.5 text-sm text-white/65 leading-relaxed">
                      {c.items.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  )}
                  {c.body && (
                    <p className="text-sm text-white/65 leading-relaxed mb-4">
                      {c.body}
                    </p>
                  )}
                  {c.foot && (
                    <p className="text-[11px] tracking-[0.08em] uppercase text-white/30 mt-5">
                      {c.foot}
                    </p>
                  )}
                  {c.link && (
                    <Link
                      href={c.link.href}
                      target="_blank"
                      className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-white/70 hover:text-[#A6FF00] transition-colors no-underline"
                    >
                      {c.link.label}
                      <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>

          <motion.div
            variants={fadeUp}
            className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {[
              "/images/photos/photo-5.jpg",
              "/images/photos/photo-4.jpg",
              "/images/photos/photo-6.jpg",
              "/images/photos/photo-1.jpg",
            ].map((src, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="relative aspect-[4/3] rounded-lg overflow-hidden border border-white/[0.06]"
              >
                <Image
                  src={src}
                  alt="Выступление"
                  fill
                  className="object-cover opacity-80 hover:opacity-100 transition-opacity"
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ===== EXPERIMENTS ===== */}
      <section
        id="experiments"
        className="relative z-[1] px-5 md:px-10 py-20 md:py-28 border-t border-white/[0.06] bg-black"
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-3">
            <SectionLabel>04 — Эксперименты</SectionLabel>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="font-p95 text-[clamp(28px,4vw,56px)] uppercase mb-10 md:mb-14"
          >
            PET PROJECTS
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {experimentProjects.map((project, i) => (
              <motion.div key={project.slug} variants={fadeUp}>
                <ProjectCard project={project} index={i + workProjects.length} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== MENTORING ===== */}
      <section
        id="mentoring"
        className="relative z-[1] px-5 md:px-10 py-20 md:py-28 border-t border-white/[0.06] bg-black"
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-3">
            <SectionLabel>05 — Менторинг</SectionLabel>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="font-p95 text-[clamp(28px,4vw,56px)] uppercase mb-8 md:mb-12"
          >
            МЕНТОРИНГ
          </motion.h2>

          <div className="grid md:grid-cols-[1.2fr_1fr] gap-10 md:gap-16 max-w-6xl">
            <motion.div variants={fadeUp}>
              <p className="text-white/70 leading-relaxed text-base md:text-lg mb-6">
                Помогаю дизайнерам расти в сеньоров и лидов. Фокус — продуктовый
                дизайн и AI-практики. Делюсь конкретными инструментами, а не
                общими советами.
              </p>
              <p className="text-white/45 leading-relaxed text-sm md:text-base mb-10">
                8+ лет опыта в крупных продуктах, управление командами,
                выстраивание процессов. Знаю, как расти в корпорации и не терять
                мотивацию.
              </p>

              <div className="space-y-3">
                {[
                  {
                    icon: Clock,
                    format: "Разовая встреча",
                    desc: "Разбор портфолио, карьерная консультация, конкретный вопрос",
                    time: "60 мин",
                    price: "8 000 ₽",
                  },
                  {
                    icon: CalendarDays,
                    format: "Регулярный менторинг",
                    desc: "Еженедельные сессии, трекинг прогресса, домашние задания",
                    time: "4–8 недель",
                    price: "от 25 000 ₽ / мес",
                  },
                  {
                    icon: Users,
                    format: "AI для дизайнеров",
                    desc: "Как встроить Claude, Cursor, v0 в продуктовую работу",
                    time: "Мастер-класс",
                    price: "от 50 000 ₽ / группа",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.format}
                      whileHover={{ borderColor: "rgba(166,255,0,0.3)" }}
                      className="border border-white/[0.08] rounded-xl p-5"
                    >
                      <div className="flex flex-wrap justify-between items-baseline gap-2 mb-2">
                        <h3 className="inline-flex items-center gap-2.5 text-sm md:text-base font-medium text-white/90">
                          <Icon className="w-4 h-4 text-[#A6FF00]" strokeWidth={1.75} />
                          {item.format}
                        </h3>
                        <span className="text-xs font-semibold text-[#A6FF00]">
                          {item.price}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-3 pl-6">
                        <p className="text-xs md:text-sm text-white/45 flex-1">
                          {item.desc}
                        </p>
                        <span className="text-[9px] tracking-[0.12em] uppercase text-white/25 shrink-0">
                          {item.time}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Booking */}
            <motion.div variants={fadeUp} className="md:sticky md:top-24 self-start">
              <div className="border border-white/[0.08] rounded-xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#A6FF00]/[0.06] blur-3xl rounded-full" />
                <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-[0.1em]">
                  Записаться
                </h3>
                <p className="text-sm text-white/50 leading-relaxed mb-6">
                  Выберите удобный слот в календаре. Если не нашли время —
                  напишите в Telegram, подберём вручную.
                </p>
                <Link
                  href="https://cal.com/egorshugaev"
                  target="_blank"
                  className="block w-full text-center bg-[#A6FF00] text-black hover:bg-[#B8FF33] rounded-lg px-6 py-3 text-sm font-semibold transition-colors no-underline mb-3"
                >
                  Открыть календарь
                </Link>
                <Link
                  href="https://t.me/egoradi"
                  target="_blank"
                  className="block w-full text-center bg-transparent border border-white/15 hover:border-white/40 rounded-lg px-6 py-3 text-sm text-white/70 hover:text-white transition-colors no-underline"
                >
                  Написать в Telegram
                </Link>
              </div>

              <div className="mt-6 text-xs text-white/30 leading-relaxed">
                Я отвечаю в течение 1 рабочего дня. Если срочно — сразу в
                Telegram.
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ===== CONTACTS ===== */}
      <section
        id="contacts"
        className="relative z-[1] px-5 md:px-10 py-20 md:py-24 border-t border-white/[0.06] bg-black"
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-3">
            <SectionLabel>06 — Контакты</SectionLabel>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="font-p95 text-[clamp(28px,4vw,56px)] uppercase mb-6"
          >
            НАПИСАТЬ
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="inline-flex items-center gap-2 text-white/50 leading-relaxed text-base md:text-lg max-w-2xl mb-10"
          >
            <MapPin className="w-4 h-4 text-[#A6FF00] shrink-0" strokeWidth={1.75} />
            Москва · готов к гибриду и удалёнке · обсуждаю релокацию под сильный оффер. Самый быстрый канал — Telegram.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3 md:gap-4">
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
                    ? "inline-flex items-center gap-2 bg-[#A6FF00] text-black hover:bg-[#B8FF33] rounded-lg px-6 py-3 text-sm font-semibold transition-colors no-underline"
                    : "inline-flex items-center gap-2 bg-transparent border border-white/15 hover:border-white/40 rounded-lg px-6 py-3 text-sm text-white/70 hover:text-white transition-colors no-underline"
                }
              >
                <link.Icon className="w-4 h-4" strokeWidth={1.75} />
                {link.label}
              </Link>
            ))}
          </motion.div>
        </motion.div>
      </section>
    </>
  );
}

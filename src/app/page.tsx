"use client";

import ProjectCard from "@/components/ProjectCard";
import { workProjects, experimentProjects } from "@/data/projects";
import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import {
  LayoutGrid,
  Code2,
  Wand2,
  Mic2,
  Send,
  Mail,
  FileDown,
  ArrowUpRight,
  MapPin,
  GraduationCap,
  Quote,
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
    <div className="inline-flex items-center gap-2 text-[10px] md:text-[11px] tracking-[0.22em] uppercase text-white/50 font-medium">
      <span className="h-1 w-1 rounded-full bg-[#A6FF00]" />
      {children}
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
            className="font-p95 text-[clamp(56px,11vw,160px)] leading-[0.92] uppercase tracking-tight text-white"
          >
            ЕГОР
            <br />
            ШУГАЕВ
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 md:mt-7 max-w-2xl text-lg md:text-2xl leading-snug text-white/85 font-light"
          >
            Строю дизайн-функции и AI-продукты в МТС, Ozon, Газпром Нефти.
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="mt-3 text-[11px] md:text-xs tracking-[0.15em] uppercase text-white/50"
          >
            Head of Design · AI Division · МТС · Москва
          </motion.p>
        </motion.div>

        {/* Metrics strip — with context */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
          className="relative z-[5] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] mt-10 md:mt-16"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] rounded-lg overflow-hidden backdrop-blur-sm">
            {[
              { value: "8.8М+", label: "пользователей B2C-продуктов", ctx: "МТС, 2024" },
              { value: "100+", label: "дизайнеров под управлением", ctx: "за карьеру" },
              { value: "−60%", label: "time-to-market запуска", ctx: "МТС AI, 2024" },
              { value: "CX 2024", label: "награда за сервис-дизайн", ctx: "Газпром Нефть" },
            ].map((s) => (
              <motion.div
                key={s.label}
                variants={fadeIn}
                className="bg-black/80 p-4 md:p-5"
              >
                <div className="text-xl md:text-2xl font-semibold text-white leading-none mb-1">
                  {s.value}
                </div>
                <div className="text-[9px] md:text-[10px] tracking-[0.12em] uppercase text-white/40">
                  {s.label}
                </div>
                <div className="text-[8px] tracking-[0.1em] uppercase text-white/20 mt-1">
                  {s.ctx}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="relative z-[5] h-10 md:h-12" />
      </section>

      {/* ===== COMPANY LOGOS ===== */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={fadeIn}
        className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-8 md:py-10 bg-black border-t border-white/[0.06]"
      >
        <div className="flex items-center justify-between gap-8 md:gap-12 opacity-30">
          {["МТС", "OZON", "Газпром Нефть", "ВШЭ"].map((name) => (
            <span key={name} className="text-sm md:text-base tracking-[0.1em] uppercase text-white font-medium whitespace-nowrap">
              {name}
            </span>
          ))}
        </div>
      </motion.section>

      {/* ===== PORTFOLIO ===== */}
      <SplitSection id="portfolio" label="01 — Портфолио" heading="ПРОЕКТЫ" wideRight>
        <div className="grid sm:grid-cols-2 gap-5">
          {workProjects.map((project, i) => (
            <motion.div key={project.slug} variants={fadeUp}>
              <ProjectCard project={project} index={i} />
            </motion.div>
          ))}
        </div>
      </SplitSection>

      {/* ===== EXPERIMENTS ===== */}
      <SplitSection id="experiments" label="02 — Эксперименты" heading="ЛАБОРАТОРИЯ" wideRight>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {experimentProjects.map((project, i) => (
            <motion.div key={project.slug} variants={fadeUp}>
              <ProjectCard project={project} index={i + workProjects.length} />
            </motion.div>
          ))}
        </div>
      </SplitSection>

      {/* ===== ABOUT ===== */}
      <SplitSection id="about" label="03 — Обо мне" heading="ПРИВЕТ!">
        <div>
          <div className="grid lg:grid-cols-[1fr_180px] gap-8 items-start mb-10">
            <div>
              <p className="text-white/70 leading-relaxed text-base md:text-lg mb-4">
                Руковожу дизайном B2C-экосистемы МТС и строю AI-дивизион с нуля. До этого — Ozon (дизайн-функция с 0 до 17 человек) и Газпром Нефть (дизайн-система на 76 команд, CX Award).
              </p>
              <p className="text-white/45 leading-relaxed text-sm md:text-base mb-6">
                Преподаю прикладной ИИ в ВШЭ. Пишу код — React, Python, WebGL. Верю, что лучший дизайн-лид понимает инженерию, а не только Figma.
              </p>

              {/* Education + Languages */}
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-white/30">
                <span>ВШЭ — преподаватель ИИ</span>
                <span>English — fluent</span>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden">
                <Image src="/images/photos/photo-3.jpg" alt="Егор Шугаев" fill className="object-cover" />
              </div>
            </div>
          </div>

          {/* Pull quote */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={fadeIn}
            className="mb-10 pl-5 border-l-2 border-[#A6FF00]/30"
          >
            <Quote className="w-4 h-4 text-white/15 mb-2" strokeWidth={1.5} />
            <p className="text-white/50 text-sm md:text-base leading-relaxed italic">
              «Егор за полгода перестроил дизайн-процессы и вырастил команду вдвое. Редкое сочетание системного мышления и дизайн-чутья.»
            </p>
            <p className="text-[10px] tracking-[0.12em] uppercase text-white/25 mt-3">
              — Руководитель продукта, МТС
            </p>
          </motion.div>

          {/* Skills — 3 columns, no borders */}
          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            {[
              { icon: LayoutGrid, title: "Управление", items: ["Design Management", "Art Direction", "Design Strategy", "Product Design", "Design Systems"] },
              { icon: Code2, title: "Инструменты", items: ["Figma · FigJam", "AI/ML Products", "Claude · Cursor · v0", "React · TypeScript · Python", "Three.js · WebGL"] },
              { icon: Wand2, title: "Процессы", items: ["CJM · JTBD · Discovery", "Design Sprint · A/B-тесты", "Юзабилити-исследования", "OKR · Roadmap", "Кросс-функциональные команды"] },
            ].map((g) => {
              const Icon = g.icon;
              return (
                <div key={g.title}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-white/30" strokeWidth={1.5} />
                    <div className="text-[10px] tracking-[0.18em] uppercase text-white/40 font-medium">{g.title}</div>
                  </div>
                  <ul className="space-y-1.5">
                    {g.items.map((item) => (
                      <li key={item} className="text-sm text-white/55 leading-snug">{item}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Career — horizontal timeline */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.04] rounded-lg overflow-hidden">
            {[
              { year: "2018", company: "МТС", role: "Head of Direction", scope: "16 команд, 60+ дизайнеров" },
              { year: "2021", company: "OZON", role: "Design Lead", scope: "Функция с 0 до 17 чел" },
              { year: "2022", company: "Газпром Нефть", role: "Design Manager", scope: "76 команд, дизайн-система" },
              { year: "2024", company: "МТС", role: "Head of Design AI", scope: "8 команд, B2C + AI-дивизион", current: true },
            ].map((job) => (
              <div key={job.year + job.company} className="bg-black p-4 md:p-5">
                <div className="text-[10px] text-white/20 font-mono mb-1">{job.year}</div>
                <div className="text-sm text-white/80 font-medium leading-tight">
                  {job.company}
                  {job.current && (
                    <span className="ml-1.5 text-[9px] tracking-[0.1em] uppercase text-[#A6FF00]/70">
                      <span className="inline-block h-1 w-1 rounded-full bg-[#A6FF00] animate-pulse mr-1 align-middle" />
                      now
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/35 mt-0.5">{job.role}</div>
                <div className="text-[10px] text-white/20 mt-0.5">{job.scope}</div>
              </div>
            ))}
          </div>
        </div>
      </SplitSection>

      {/* ===== PUBLIC ===== */}
      <SplitSection id="public" label="04 — Публично" heading="ГОВОРЮ И&#10;ПИШУ">
        <div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mic2 className="w-4 h-4 text-white/30" strokeWidth={1.5} />
                <div className="text-[10px] tracking-[0.18em] uppercase text-white/40 font-medium">Выступления</div>
              </div>
              <ul className="space-y-2 text-sm text-white/55 leading-relaxed">
                <li>Форум «Смарт Дизайн» — AI в дизайне</li>
                <li>Стендап «Мультибрендинг» — МТС</li>
              </ul>
              <Link href="mailto:egor.outhead@gmail.com?subject=Выступление" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors no-underline mt-3">
                Пригласить <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
              </Link>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-4 h-4 text-white/30" strokeWidth={1.5} />
                <div className="text-[10px] tracking-[0.18em] uppercase text-white/40 font-medium">Преподавание</div>
              </div>
              <ul className="space-y-2 text-sm text-white/55 leading-relaxed">
                <li>ВШЭ — прикладное использование ИИ</li>
                <li>Воркшопы для продуктовых команд</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Send className="w-4 h-4 text-white/30" strokeWidth={1.5} />
                <div className="text-[10px] tracking-[0.18em] uppercase text-white/40 font-medium">Telegram-канал</div>
              </div>
              <p className="text-sm text-white/55 leading-relaxed mb-2">
                «Vigrom» — AI-инструменты для дизайнеров. Разборы Claude, Cursor, v0.
              </p>
              <Link href="https://t.me/vigrom" target="_blank" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors no-underline">
                Читать канал <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
              </Link>
            </div>
          </div>

          {/* Photos — 3 instead of 4 */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            {["/images/photos/photo-5.jpg", "/images/photos/photo-4.jpg", "/images/photos/photo-6.jpg"].map((src, i) => (
              <div
                key={i}
                className="relative aspect-[4/3] rounded-lg overflow-hidden"
              >
                <Image src={src} alt="Выступление" fill className="object-cover opacity-60 hover:opacity-90 transition-opacity duration-500" />
              </div>
            ))}
          </div>
        </div>
      </SplitSection>

      {/* ===== CONTACTS ===== */}
      <SplitSection id="contacts" label="05 — Контакты" heading="НАПИСАТЬ">
        <div>
          <p className="text-white/50 leading-relaxed text-base md:text-lg mb-8">
            <MapPin className="w-4 h-4 text-white/25 inline mr-2 align-text-top" strokeWidth={1.5} />
            Москва · гибрид или удалёнка. Самый быстрый канал — Telegram.
          </p>

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

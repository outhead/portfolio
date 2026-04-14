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
    <div className="inline-flex items-center gap-2 text-[10px] md:text-[11px] tracking-[0.22em] uppercase text-white/50 font-medium">
      <span className="h-1 w-1 rounded-full bg-[#A6FF00]" />
      {children}
    </div>
  );
}

// Reusable 2-col section wrapper: sticky left label + right content
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
        {/* Left: label + heading, sticky */}
        <motion.div variants={fadeUp} className="md:sticky md:top-24 self-start">
          <SectionLabel>{label}</SectionLabel>
          <h2 className="font-p95 text-[clamp(28px,3.5vw,48px)] uppercase mt-2 leading-[0.95]">
            {heading}
          </h2>
        </motion.div>

        {/* Right: content, capped width */}
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
        <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#A6FF00]/[0.04] blur-[120px] z-[1]" />

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
            Строю дизайн-функции и AI-продукты в крупных продуктовых компаниях.
            8.8М+ пользователей, 100+ дизайнеров, CX Award 2024.
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="mt-3 text-[11px] md:text-xs tracking-[0.15em] uppercase text-white/50"
          >
            Head of Design · AI Division · МТС · Москва
          </motion.p>
        </motion.div>

        {/* Metrics strip */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
          className="relative z-[5] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] mt-10 md:mt-16"
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-white/[0.06] border border-white/[0.06] rounded-lg overflow-hidden backdrop-blur-sm">
            {[
              { value: "8.8М+", label: "пользователей продуктов" },
              { value: "100+", label: "дизайнеров под управлением" },
              { value: "−60%", label: "скорость запуска" },
              { value: "+40% / −60%", label: "найм · текучка" },
              { value: "CX 2024", label: "награда за сервис-дизайн" },
            ].map((s) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                className="bg-black/80 p-4 md:p-5 relative group overflow-hidden"
              >
                <div className="text-xl md:text-2xl font-semibold text-white leading-none mb-2 group-hover:text-[#A6FF00] transition-colors">
                  {s.value}
                </div>
                <div className="text-[9px] md:text-[10px] tracking-[0.12em] uppercase text-white/55">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="relative z-[5] h-10 md:h-12" />
      </section>

      {/* ===== OPEN TO ===== */}
      <SplitSection label="Сейчас открыт к" heading="ОТКРЫТ К">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: Briefcase,
              title: "C-level роли",
              desc: "VP / Head of Design. Трансформация дизайн-функции, AI-интеграция.",
              cta: "Написать",
              href: "mailto:egor.outhead@gmail.com?subject=Вакансия",
            },
            {
              icon: Sparkles,
              title: "Консалтинг",
              desc: "Аудит дизайн-процессов, внедрение AI. От 2 недель.",
              cta: "Написать",
              href: "mailto:egor.outhead@gmail.com?subject=Консалтинг",
            },
            {
              icon: GraduationCap,
              title: "Менторинг",
              desc: "1:1 и групповые форматы для дизайнеров и лидов.",
              cta: "Подробнее",
              href: "#mentoring",
            },
          ].map((o) => {
            const Icon = o.icon;
            return (
              <Link
                key={o.title}
                href={o.href}
                className="block border border-white/[0.08] rounded-xl p-5 no-underline group relative overflow-hidden hover:border-[#A6FF00]/30 transition-colors"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#A6FF00]/[0.06] blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Icon
                  className="w-5 h-5 text-white/50 group-hover:text-[#A6FF00] transition-colors mb-4"
                  strokeWidth={1.5}
                />
                <h3 className="text-base font-medium text-white mb-2">
                  {o.title}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed mb-5">
                  {o.desc}
                </p>
                <span className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-white/55 group-hover:text-[#A6FF00] transition-colors">
                  {o.cta}
                  <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
                </span>
              </Link>
            );
          })}
        </div>
      </SplitSection>

      {/* ===== ABOUT ===== */}
      <SplitSection id="about" label="01 — Обо мне" heading="ПРИВЕТ!">
        <div>
          <div className="grid lg:grid-cols-[1fr_180px] gap-8 items-start mb-10">
            <div>
              <p className="text-white/70 leading-relaxed text-base md:text-lg mb-4">
                Совмещаю арт-директора B2C-экосистемы МТС и Head of Design AI-дивизиона. До этого строил дизайн-функции в Ozon и Газпром Нефти.
              </p>
              <p className="text-white/45 leading-relaxed text-sm md:text-base">
                Преподаю ИИ в ВШЭ, пишу код на React и Python, экспериментирую с WebGL и LLM-агентами.
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-white/[0.08]">
                <Image src="/images/photos/photo-3.jpg" alt="Егор Шугаев" fill className="object-cover" />
              </div>
            </div>
          </div>

          {/* Principles tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {["Data-driven", "AI-first", "Кросс-функционально", "Растим людей", "Design Strategy", "CJM · A/B", "OKR · Roadmap"].map((tag) => (
              <span key={tag} className="text-[10px] tracking-[0.14em] uppercase text-[#A6FF00]/60 border border-[#A6FF00]/15 rounded-full px-3 py-1">
                {tag}
              </span>
            ))}
          </div>

          {/* Skills + career */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: LayoutGrid, title: "Core", items: ["Design Management", "Art Direction", "Design Strategy", "Product Design", "Design Systems", "UX Research"] },
              { icon: Code2, title: "Stack", items: ["Figma", "AI/ML Products", "Claude · Cursor · v0", "React · TypeScript", "Python", "Three.js · WebGL"] },
              { icon: Wand2, title: "Process", items: ["CJM · JTBD", "Discovery · Design Sprint", "A/B · юзабилити-тесты", "OKR · roadmap", "Кросс-функциональные команды"] },
            ].map((g) => {
              const Icon = g.icon;
              return (
                <div key={g.title} className="border border-white/[0.06] rounded-xl p-5 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-[#A6FF00]" strokeWidth={1.75} />
                    <div className="text-[10px] tracking-[0.18em] uppercase text-white/60 font-medium">{g.title}</div>
                  </div>
                  <ul className="space-y-1.5">
                    {g.items.map((item) => (
                      <li key={item} className="text-sm text-white/60 leading-snug">{item}</li>
                    ))}
                  </ul>
                </div>
              );
            })}

            {/* Career */}
            <div className="border border-white/[0.06] rounded-xl p-5 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-[#A6FF00]" strokeWidth={1.75} />
                <div className="text-[10px] tracking-[0.18em] uppercase text-white/60 font-medium">Карьера</div>
              </div>
              {[
                { year: "2024", company: "МТС", role: "Head of Design AI", scope: "8 команд, 40+ чел, B2C + AI", current: true },
                { year: "2022", company: "Газпром Нефть", role: "Design Manager", scope: "76 команд, дизайн-система" },
                { year: "2021", company: "OZON", role: "Design Lead", scope: "найм, комьюнити, процессы" },
                { year: "2018", company: "МТС", role: "Head of Direction", scope: "16 команд, 60+ дизайнеров" },
              ].map((job) => (
                <div key={job.year + job.company} className="py-2 border-b border-white/[0.06] last:border-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] text-white/25 font-mono w-8 shrink-0">{job.year}</span>
                    <span className="text-sm text-white/80 font-medium">
                      {job.company}
                      {job.current && (
                        <span className="ml-1.5 text-[9px] tracking-[0.1em] uppercase text-[#A6FF00]/80">
                          <span className="inline-block h-1 w-1 rounded-full bg-[#A6FF00] animate-pulse mr-1 align-middle" />
                          now
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-white/35 pl-10">{job.role}</div>
                  <div className="text-[10px] text-white/20 pl-10">{job.scope}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SplitSection>

      {/* ===== PORTFOLIO ===== */}
      <SplitSection id="portfolio" label="02 — Портфолио" heading="ПРОЕКТЫ" wideRight>
        <div className="grid sm:grid-cols-2 gap-5">
          {workProjects.map((project, i) => (
            <motion.div key={project.slug} variants={fadeUp}>
              <ProjectCard project={project} index={i} />
            </motion.div>
          ))}
        </div>
      </SplitSection>

      {/* ===== PUBLIC ===== */}
      <SplitSection id="public" label="03 — Публично" heading="ГОВОРЮ И&#10;ПИШУ" wideRight>
        <div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[
              {
                icon: Mic2,
                title: "Выступления",
                items: [
                  "Форум «Смарт Дизайн» — AI в дизайне",
                  "Стендап «Мультибрендинг» — МТС",
                ],
                foot: "Пригласить — egor.outhead@gmail.com",
              },
              {
                icon: GraduationCap,
                title: "Преподавание",
                items: [
                  "ВШЭ — прикладное использование ИИ",
                  "Воркшопы для продуктовых команд",
                ],
              },
              {
                icon: Send,
                title: "Канал «Vigrom»",
                body: "AI и инструменты дизайнера. Разборы Claude, Cursor, v0 — без хайпа.",
                link: { href: "https://t.me/vigrom", label: "Читать канал" },
              },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="border border-white/[0.06] rounded-xl p-5 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-[#A6FF00]" strokeWidth={1.75} />
                    <div className="text-[10px] tracking-[0.18em] uppercase text-white/60 font-medium">{c.title}</div>
                  </div>
                  {c.items && (
                    <ul className="space-y-2 text-sm text-white/60 leading-relaxed">
                      {c.items.map((i) => (<li key={i}>{i}</li>))}
                    </ul>
                  )}
                  {c.body && <p className="text-sm text-white/60 leading-relaxed mb-3">{c.body}</p>}
                  {c.foot && <p className="text-[11px] tracking-[0.08em] uppercase text-white/40 mt-4">{c.foot}</p>}
                  {c.link && (
                    <Link href={c.link.href} target="_blank" className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-white/60 hover:text-[#A6FF00] transition-colors no-underline">
                      {c.link.label} <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {/* Photo grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {["/images/photos/photo-5.jpg", "/images/photos/photo-4.jpg", "/images/photos/photo-6.jpg", "/images/photos/photo-1.jpg"].map((src, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="relative aspect-[4/3] rounded-lg overflow-hidden border border-white/[0.06]"
              >
                <Image src={src} alt="Выступление" fill className="object-cover opacity-70 hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </div>
      </SplitSection>

      {/* ===== EXPERIMENTS ===== */}
      <SplitSection id="experiments" label="04 — Эксперименты" heading="ЭКСПЕРИМЕНТЫ" wideRight>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {experimentProjects.map((project, i) => (
            <motion.div key={project.slug} variants={fadeUp}>
              <ProjectCard project={project} index={i + workProjects.length} />
            </motion.div>
          ))}
        </div>
      </SplitSection>

      {/* ===== MENTORING ===== */}
      <SplitSection id="mentoring" label="05 — Менторинг" heading="МЕНТОРИНГ">
        <div>
          <p className="text-white/70 leading-relaxed text-base md:text-lg mb-8">
            Помогаю дизайнерам расти в сеньоров и лидов. Продуктовый дизайн, AI-практики, управление.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              {
                icon: Clock,
                format: "Разовая консультация",
                desc: "1 сессия · 60 минут. Разбор портфолио, карьерный совет, конкретный вопрос",
                time: "60 мин",
                price: "8 000 ₽",
              },
              {
                icon: CalendarDays,
                format: "Менторинг (4 недели)",
                desc: "4 сессии по 60 минут · еженедельно. Трекинг прогресса, домашние задания, feedback",
                time: "4 недели",
                price: "25 000 ₽",
              },
              {
                icon: Users,
                format: "AI-мастер-класс",
                desc: "1 встреча · 2–3 часа · группа до 10 человек. Claude, Cursor, v0 в продуктовой работе",
                time: "2–3 часа",
                price: "от 50 000 ₽",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.format}
                  whileHover={{ borderColor: "rgba(166,255,0,0.3)" }}
                  className="border border-white/[0.08] rounded-xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-[#A6FF00]" strokeWidth={1.75} />
                    <h3 className="text-sm font-medium text-white/90">{item.format}</h3>
                  </div>
                  <p className="text-xs text-white/45 leading-relaxed mb-4">{item.desc}</p>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-[#A6FF00]">{item.price}</span>
                    <span className="text-[9px] tracking-[0.12em] uppercase text-white/25">{item.time}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="https://cal.com/egorshugaev"
              target="_blank"
              className="text-center bg-[#A6FF00] text-black hover:bg-[#B8FF33] rounded-lg px-6 py-3 text-sm font-semibold transition-colors no-underline"
            >
              Открыть календарь
            </Link>
            <Link
              href="https://t.me/egoradi"
              target="_blank"
              className="text-center border border-white/15 hover:border-white/40 rounded-lg px-6 py-3 text-sm text-white/70 hover:text-white transition-colors no-underline"
            >
              Написать в Telegram
            </Link>
          </div>
        </div>
      </SplitSection>

      {/* ===== CONTACTS ===== */}
      <SplitSection id="contacts" label="06 — Контакты" heading="НАПИСАТЬ">
        <div>
          <p className="inline-flex items-start gap-2 text-white/50 leading-relaxed text-base md:text-lg mb-8">
            <MapPin className="w-4 h-4 text-[#A6FF00] shrink-0 mt-1" strokeWidth={1.75} />
            Москва · готов к гибриду и удалёнке · обсуждаю релокацию под сильный оффер. Самый быстрый канал — Telegram.
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
                    : "inline-flex items-center gap-2 border border-white/15 hover:border-white/40 rounded-lg px-5 py-2.5 text-sm text-white/70 hover:text-white transition-colors no-underline"
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

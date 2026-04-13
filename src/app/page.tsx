import ProjectCard from "@/components/ProjectCard";
import ScrollReveal from "@/components/ScrollReveal";
import { workProjects, experimentProjects } from "@/data/projects";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-end overflow-hidden">
        {/* Background photo */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/photos/photo-4.jpg"
            alt="Егор Шугаев выступает на конференции"
            fill
            className="object-cover opacity-20"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black z-[1]" />

        <div className="relative z-[5] px-5 md:px-10 pb-10 md:pb-16 w-full">
          <div className="animate-fade-in-up">
            <h1 className="font-p95 text-[clamp(48px,10vw,140px)] leading-[0.92] uppercase tracking-tight">
              <span className="gradient-text">ЕГОР</span>
              <br />
              <span className="text-white">ШУГАЕВ</span>
            </h1>
          </div>
          <p className="animate-fade-in-up animation-delay-200 text-sm tracking-[0.12em] uppercase text-white/30 font-light mt-4 md:mt-6">
            Арт-директор · Head of Design · AI · Ментор
          </p>
        </div>

        {/* Technical annotations */}
        <div className="absolute bottom-4 right-5 md:right-10 z-[5] hidden md:flex gap-6 text-[9px] tracking-[0.12em] uppercase text-white/[0.08]">
          <span>55.7558°N</span>
          <span>37.6173°E</span>
          <span>BUILD 0.2.0</span>
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section
        id="about"
        className="relative z-[1] px-5 md:px-10 py-20 md:py-32 border-t border-white/[0.04] bg-black/75"
      >
        <ScrollReveal>
          <div className="section-label mb-3">01 — Обо мне</div>
          <h2 className="font-p95 text-[clamp(28px,4vw,56px)] uppercase mb-8 md:mb-12">
            ПРИВЕТ!
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={100}>
        <div className="grid md:grid-cols-[1fr_auto] gap-8 md:gap-16 max-w-5xl">
          <div>
            <p className="text-white/60 leading-relaxed text-base md:text-lg mb-6">
              За последние 7 лет я был руководителем дизайн-направлений в МТС, Ozon
              и Газпром Нефти. Сейчас совмещаю роль арт-директора B2C-экосистемы МТС
              (40+ дизайнеров) и Head of Design AI-дивизиона.
            </p>
            <p className="text-white/40 leading-relaxed text-sm md:text-base mb-6">
              Формировал дизайн-стратегию МТС. Заложил основы дизайн-комьюнити в Ozon.
              Развивал open-source дизайн-систему Consta в Газпром Нефти. Получил
              награду CX Awards 2024 за улучшение HR-сервиса. Преподаю прикладное
              использование ИИ, в том числе в ВШЭ.
            </p>
            <p className="text-white/40 leading-relaxed text-sm md:text-base">
              Помимо основной работы — веду менторинг для дизайнеров, выступаю на конференциях,
              пишу код на React и Python, экспериментирую с WebGL и AI-автоматизацией.
            </p>
          </div>

          {/* Portrait photo */}
          <div className="hidden md:block w-56 shrink-0">
            <div className="relative w-56 h-72 rounded-lg overflow-hidden border border-white/[0.06]">
              <Image
                src="/images/photos/photo-3.jpg"
                alt="Егор Шугаев"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay={150}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 max-w-5xl">
          {[
            { value: "7+", label: "лет в управлении" },
            { value: "100+", label: "дизайнеров в командах" },
            { value: "8.8М+", label: "пользователей продуктов" },
            { value: "CX 2024", label: "награда за сервис" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="border border-white/[0.06] rounded-lg p-4 md:p-5"
            >
              <div className="text-2xl md:text-3xl font-semibold gradient-text mb-1">
                {stat.value}
              </div>
              <div className="text-[10px] tracking-[0.1em] uppercase text-white/20">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        </ScrollReveal>

        {/* Skills */}
        <ScrollReveal delay={100}>
        <div className="mt-12 md:mt-16">
          <div className="section-label mb-4">Навыки</div>
          <div className="flex flex-wrap gap-2">
            {[
              "Product Design",
              "Design Management",
              "Design Systems",
              "AI/ML Products",
              "UX Research",
              "Prototyping",
              "React",
              "TypeScript",
              "Three.js",
              "Figma",
              "Python",
              "Claude API",
            ].map((skill) => (
              <span
                key={skill}
                className="text-[10px] tracking-[0.08em] uppercase px-3 py-1.5 rounded-full border border-white/[0.06] text-white/25 hover:text-white/50 hover:border-white/10 transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        </ScrollReveal>

        {/* Career timeline */}
        <ScrollReveal delay={100}>
        <div className="mt-12 md:mt-16">
          <div className="section-label mb-6">Карьера</div>
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
            ].map((job, i) => (
              <div
                key={i}
                className="flex items-baseline gap-4 md:gap-8 py-3 border-b border-white/[0.04]"
              >
                <span className="text-[10px] tracking-[0.15em] uppercase text-white/15 w-12 shrink-0 font-mono">
                  {job.year}
                </span>
                <span className="text-sm text-white/70 w-32 md:w-40 shrink-0">
                  {job.company}
                </span>
                <span className="text-sm text-white/30">
                  {job.role}
                  {job.current && (
                    <span className="ml-2 text-[9px] tracking-[0.1em] uppercase text-green-500/60">
                      now
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        </ScrollReveal>

        {/* Speaking & Events */}
        <ScrollReveal delay={100}>
        <div className="mt-12 md:mt-16">
          <div className="section-label mb-6">Выступления</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { src: "/images/photos/photo-5.jpg", caption: "Форум «Смарт Дизайн» — AI в дизайне" },
              { src: "/images/photos/photo-4.jpg", caption: "Конференция — Нейросети и ML" },
              { src: "/images/photos/photo-6.jpg", caption: "Мастер-класс для дизайнеров" },
              { src: "/images/photos/photo-1.jpg", caption: "Стендап «Мультибрендинг»" },
              { src: "/images/photos/photo-2.jpg", caption: "Стендап — на сцене" },
              { src: "/images/photos/photo-3.jpg", caption: "Выступление на митапе" },
            ].map((photo, i) => (
              <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden border border-white/[0.06] group">
                <Image
                  src={photo.src}
                  alt={photo.caption}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] tracking-[0.05em] text-white/70">{photo.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* ===== PORTFOLIO ===== */}
      <section
        id="portfolio"
        className="relative z-[1] px-5 md:px-10 py-20 md:py-32 border-t border-white/[0.04] bg-black/75"
      >
        <ScrollReveal>
          <div className="section-label mb-3">02 — Портфолио</div>
          <h2 className="font-p95 text-[clamp(28px,4vw,56px)] uppercase mb-10 md:mb-14">
            ПРОЕКТЫ
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={150}>
        <div className="grid md:grid-cols-2 gap-5 md:gap-6">
          {workProjects.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} />
          ))}
        </div>
        </ScrollReveal>
      </section>

      {/* ===== EXPERIMENTS ===== */}
      <section
        id="experiments"
        className="relative z-[1] px-5 md:px-10 py-20 md:py-32 border-t border-white/[0.04] bg-black/75"
      >
        <ScrollReveal>
          <div className="section-label mb-3">03 — Эксперименты</div>
          <h2 className="font-p95 text-[clamp(28px,4vw,56px)] uppercase mb-10 md:mb-14">
            PET PROJECTS
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={150}>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {experimentProjects.map((project, i) => (
            <ProjectCard
              key={project.slug}
              project={project}
              index={i + workProjects.length}
            />
          ))}
        </div>
        </ScrollReveal>
      </section>

      {/* ===== MENTORING ===== */}
      <section
        id="mentoring"
        className="relative z-[1] px-5 md:px-10 py-20 md:py-32 border-t border-white/[0.04] bg-black/75"
      >
        <ScrollReveal>
          <div className="section-label mb-3">04 — Менторинг</div>
          <h2 className="font-p95 text-[clamp(28px,4vw,56px)] uppercase mb-8 md:mb-12">
            МЕНТОРИНГ
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={150}>
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 max-w-5xl">
          <div>
            <p className="text-white/60 leading-relaxed text-base md:text-lg mb-6">
              Помогаю дизайнерам вырасти в сеньоров и лидов. Фокус на
              продуктовый дизайн и AI-практики — то, что актуально прямо сейчас.
            </p>
            <p className="text-white/40 leading-relaxed text-sm md:text-base mb-8">
              8+ лет опыта в крупных продуктах, управление командами, выстраивание
              процессов. Знаю, как расти в корпорации и не терять мотивацию. Делюсь
              конкретными инструментами, а не общими советами.
            </p>

            <div className="space-y-4">
              {[
                {
                  format: "Разовая встреча",
                  desc: "Разбор портфолио, карьерная консультация, конкретный вопрос",
                  time: "60 мин",
                },
                {
                  format: "Регулярный менторинг",
                  desc: "Еженедельные сессии, трекинг прогресса, домашние задания",
                  time: "4-8 недель",
                },
                {
                  format: "AI для дизайнеров",
                  desc: "Как использовать Claude, Cursor, v0 и другие AI-инструменты в работе",
                  time: "мастер-класс",
                },
              ].map((item) => (
                <div
                  key={item.format}
                  className="border border-white/[0.06] rounded-lg p-4 md:p-5"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-medium text-white/80">
                      {item.format}
                    </h3>
                    <span className="text-[9px] tracking-[0.1em] uppercase text-white/20">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-xs text-white/30">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/mentoring"
                className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors no-underline"
              >
                <span>Подробнее о менторинге</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          <div>
            {/* Contact form placeholder */}
            <div className="border border-white/[0.06] rounded-lg p-6 md:p-8 mb-6">
              <h3 className="text-sm font-medium text-white/60 mb-6 uppercase tracking-[0.1em]">
                Оставить заявку
              </h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-[10px] tracking-[0.1em] uppercase text-white/20 mb-2">
                    Имя
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white/70 outline-none focus:border-white/20 transition-colors"
                    placeholder="Как вас зовут"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.1em] uppercase text-white/20 mb-2">
                    Контакт
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white/70 outline-none focus:border-white/20 transition-colors"
                    placeholder="Telegram, email или телефон"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.1em] uppercase text-white/20 mb-2">
                    Запрос
                  </label>
                  <textarea
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white/70 outline-none focus:border-white/20 transition-colors resize-none h-24"
                    placeholder="Опишите, с чем нужна помощь"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded py-2.5 text-sm text-white/60 hover:text-white/80 transition-all uppercase tracking-[0.1em]"
                >
                  Отправить
                </button>
              </form>
            </div>

            <div className="border border-white/[0.06] rounded-lg p-6 md:p-8 text-center">
              <div className="text-[10px] tracking-[0.1em] uppercase text-white/20 mb-3">
                или запишитесь на удобное время
              </div>
              <Link
                href="https://cal.com"
                target="_blank"
                className="inline-block bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded px-6 py-2.5 text-sm text-white/60 hover:text-white/80 transition-all uppercase tracking-[0.1em] no-underline"
              >
                Открыть календарь
              </Link>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* ===== CONTACTS ===== */}
      <section className="relative z-[1] px-5 md:px-10 py-16 md:py-24 border-t border-white/[0.04] bg-black/75">
        <ScrollReveal>
          <div className="section-label mb-3">05 — Контакты</div>
          <h2 className="font-p95 text-[clamp(28px,4vw,56px)] uppercase mb-8">
            НАПИСАТЬ
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={100}>
        <div className="flex flex-wrap gap-4 md:gap-6">
          {[
            { label: "Telegram", href: "https://t.me/egoradi" },
            { label: "Email", href: "mailto:egor.outhead@gmail.com" },
            { label: "GitHub", href: "https://github.com/outhead" },
            {
              label: "LinkedIn",
              href: "https://www.linkedin.com/in/egorshugaev/",
            },
            {
              label: "HeadHunter",
              href: "https://hh.ru/resume/",
            },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              target="_blank"
              className="bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] rounded-lg px-5 py-3 text-sm text-white/40 hover:text-white/70 transition-all duration-200 no-underline"
            >
              {link.label}
            </Link>
          ))}
        </div>
        </ScrollReveal>
      </section>
    </>
  );
}

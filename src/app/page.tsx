import ProjectCard from "@/components/ProjectCard";
import ScrollReveal from "@/components/ScrollReveal";
import { workProjects, experimentProjects } from "@/data/projects";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex flex-col justify-between overflow-hidden">
        {/* Background photo — lifted brightness so it reads */}
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

        {/* spacer for header */}
        <div className="relative z-[5] h-24 md:h-32" />

        {/* Centerpiece: name + one-line positioning + metrics */}
        <div className="relative z-[5] px-5 md:px-10 w-full">
          <div className="animate-fade-in-up">
            <h1 className="font-p95 text-[clamp(56px,11vw,160px)] leading-[0.92] uppercase tracking-tight text-white">
              ЕГОР
              <br />
              ШУГАЕВ
            </h1>
          </div>

          <p className="animate-fade-in-up animation-delay-200 mt-5 md:mt-7 max-w-3xl text-lg md:text-2xl leading-snug text-white/80 font-light">
            Арт-директор B2C-экосистемы и Head of Design AI-дивизиона&nbsp;МТС.
            За 7 лет построил дизайн-функции в МТС, Ozon и Газпром&nbsp;Нефти —
            от процессов и найма до production-продуктов на 8.8М+ пользователей.
          </p>

          <p className="animate-fade-in-up animation-delay-300 mt-3 text-[11px] md:text-xs tracking-[0.15em] uppercase text-white/30">
            Арт-директор · Head of Design · AI · Ментор · Москва
          </p>
        </div>

        {/* Key metrics strip */}
        <div className="relative z-[5] px-5 md:px-10 mt-10 md:mt-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-white/[0.06] border border-white/[0.06] rounded-lg overflow-hidden backdrop-blur-sm">
            {[
              { value: "8.8М+", label: "пользователей" },
              { value: "100+", label: "дизайнеров в команде" },
              { value: "−60%", label: "TTM" },
              { value: "+40%", label: "найм · −60% текучка" },
              { value: "CX 2024", label: "награда за сервис" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-black/80 p-4 md:p-5"
              >
                <div className="text-xl md:text-2xl font-semibold text-white leading-none mb-2">
                  {s.value}
                </div>
                <div className="text-[9px] md:text-[10px] tracking-[0.12em] uppercase text-white/40">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clients / trusted by */}
        <div className="relative z-[5] px-5 md:px-10 mt-8 mb-10 md:mb-12">
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
            <span className="text-white/15">/</span>
            <span>Skillbox</span>
          </div>
        </div>
      </section>

      {/* ===== OPEN TO ===== */}
      <section className="relative z-[1] px-5 md:px-10 py-16 md:py-20 border-t border-white/[0.06] bg-black">
        <ScrollReveal>
          <div className="section-label mb-4">Сейчас открыт к</div>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-6xl">
            {[
              {
                title: "C-level роли",
                desc: "VP / Head of Design в продуктовых компаниях. Управление 50+ дизайнеров, трансформация, AI-интеграция.",
                cta: "Обсудить роль",
                href: "mailto:egor.outhead@gmail.com?subject=Вакансия",
              },
              {
                title: "Консалтинг",
                desc: "Внедрение AI в дизайн-процесс, аудит дизайн-функции, разработка стратегии. От 2 недель до 3 месяцев.",
                cta: "Запросить консалтинг",
                href: "mailto:egor.outhead@gmail.com?subject=Консалтинг",
              },
              {
                title: "Менторинг",
                desc: "1:1 для дизайнеров и лидов. Разовая встреча — 8 000 ₽. Регулярный менторинг — от 25 000 ₽ / месяц.",
                cta: "Записаться",
                href: "#mentoring",
              },
            ].map((o) => (
              <Link
                key={o.title}
                href={o.href}
                className="block border border-white/[0.08] hover:border-white/20 rounded-lg p-5 md:p-6 transition-colors no-underline group"
              >
                <h3 className="text-base md:text-lg font-medium text-white mb-2">
                  {o.title}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed mb-5">
                  {o.desc}
                </p>
                <span className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-white/60 group-hover:text-white transition-colors">
                  {o.cta} <span>→</span>
                </span>
              </Link>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ===== ABOUT ===== */}
      <section
        id="about"
        className="relative z-[1] px-5 md:px-10 py-20 md:py-32 border-t border-white/[0.06] bg-black"
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
                Преподаю прикладное использование ИИ в ВШЭ и Skillbox. Веду
                менторинг, выступаю на конференциях, пишу код на React и
                Python, экспериментирую с WebGL и AI-автоматизацией.
              </p>
            </div>

            <div className="hidden md:block w-56 shrink-0">
              <div className="relative w-56 h-72 rounded-lg overflow-hidden border border-white/[0.08]">
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

        {/* Skills — grouped */}
        <ScrollReveal delay={100}>
          <div className="mt-14 md:mt-20 grid md:grid-cols-3 gap-8 md:gap-12 max-w-5xl">
            {[
              {
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
                title: "Experiments",
                items: [
                  "AI-автоматизация",
                  "Generative design",
                  "Creative coding",
                  "Shader-эксперименты",
                  "LLM-агенты",
                ],
              },
            ].map((g) => (
              <div key={g.title}>
                <div className="section-label mb-4">{g.title}</div>
                <ul className="space-y-1.5">
                  {g.items.map((item) => (
                    <li
                      key={item}
                      className="text-sm text-white/60 leading-snug"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Career timeline */}
        <ScrollReveal delay={100}>
          <div className="mt-14 md:mt-20">
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
                  className="flex items-baseline gap-4 md:gap-8 py-3 border-b border-white/[0.06]"
                >
                  <span className="text-[10px] tracking-[0.15em] uppercase text-white/20 w-12 shrink-0 font-mono">
                    {job.year}
                  </span>
                  <span className="text-sm text-white/75 w-32 md:w-40 shrink-0">
                    {job.company}
                  </span>
                  <span className="text-sm text-white/35">
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
      </section>

      {/* ===== PORTFOLIO ===== */}
      <section
        id="portfolio"
        className="relative z-[1] px-5 md:px-10 py-20 md:py-32 border-t border-white/[0.06] bg-black"
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

      {/* ===== PUBLIC — talks, teaching, writing ===== */}
      <section
        id="public"
        className="relative z-[1] px-5 md:px-10 py-20 md:py-32 border-t border-white/[0.06] bg-black"
      >
        <ScrollReveal>
          <div className="section-label mb-3">03 — Публично</div>
          <h2 className="font-p95 text-[clamp(28px,4vw,56px)] uppercase mb-10 md:mb-14">
            ГОВОРЮ И ПИШУ
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-6xl">
            <div>
              <div className="section-label mb-4">Выступления</div>
              <ul className="space-y-3 text-sm text-white/60 leading-relaxed">
                <li>Форум «Смарт Дизайн» — AI в дизайне</li>
                <li>Стендап «Мультибрендинг» — МТС</li>
                <li>Конференции по дизайн-системам и ML</li>
                <li>Мастер-классы для продуктовых команд</li>
              </ul>
              <p className="text-[11px] tracking-[0.1em] uppercase text-white/25 mt-4">
                Пригласить выступить — egor.outhead@gmail.com
              </p>
            </div>

            <div>
              <div className="section-label mb-4">Преподавание</div>
              <ul className="space-y-3 text-sm text-white/60 leading-relaxed">
                <li>ВШЭ — прикладное использование ИИ</li>
                <li>Skillbox — курс по AI для дизайнеров</li>
                <li>Регулярные воркшопы внутри МТС</li>
              </ul>
            </div>

            <div>
              <div className="section-label mb-4">Канал «Vigrom»</div>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                Авторский Telegram-канал про AI и инструменты дизайнера.
                Практика без хайпа — разборы Claude, Cursor, v0 и того, как
                встраивать их в продуктовую работу.
              </p>
              <Link
                href="https://t.me/vigrom"
                target="_blank"
                className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-white/60 hover:text-white transition-colors no-underline"
              >
                Читать канал <span>→</span>
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* Photo strip */}
        <ScrollReveal delay={150}>
          <div className="mt-14 md:mt-20 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              "/images/photos/photo-5.jpg",
              "/images/photos/photo-4.jpg",
              "/images/photos/photo-6.jpg",
              "/images/photos/photo-1.jpg",
            ].map((src, i) => (
              <div
                key={i}
                className="relative aspect-[4/3] rounded-lg overflow-hidden border border-white/[0.06]"
              >
                <Image
                  src={src}
                  alt="Выступление"
                  fill
                  className="object-cover opacity-80 hover:opacity-100 transition-opacity"
                />
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ===== EXPERIMENTS ===== */}
      <section
        id="experiments"
        className="relative z-[1] px-5 md:px-10 py-20 md:py-32 border-t border-white/[0.06] bg-black"
      >
        <ScrollReveal>
          <div className="section-label mb-3">04 — Эксперименты</div>
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
        className="relative z-[1] px-5 md:px-10 py-20 md:py-32 border-t border-white/[0.06] bg-black"
      >
        <ScrollReveal>
          <div className="section-label mb-3">05 — Менторинг</div>
          <h2 className="font-p95 text-[clamp(28px,4vw,56px)] uppercase mb-8 md:mb-12">
            МЕНТОРИНГ
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <div className="grid md:grid-cols-[1.2fr_1fr] gap-10 md:gap-16 max-w-6xl">
            <div>
              <p className="text-white/70 leading-relaxed text-base md:text-lg mb-6">
                Помогаю дизайнерам расти в сеньоров и лидов. Фокус — продуктовый
                дизайн и AI-практики. Делюсь конкретными инструментами, а не
                общими советами.
              </p>
              <p className="text-white/45 leading-relaxed text-sm md:text-base mb-10">
                8+ лет опыта в крупных продуктах, управление командами,
                выстраивание процессов. Знаю, как расти в корпорации и не
                терять мотивацию.
              </p>

              <div className="space-y-3">
                {[
                  {
                    format: "Разовая встреча",
                    desc: "Разбор портфолио, карьерная консультация, конкретный вопрос",
                    time: "60 мин",
                    price: "8 000 ₽",
                  },
                  {
                    format: "Регулярный менторинг",
                    desc: "Еженедельные сессии, трекинг прогресса, домашние задания",
                    time: "4–8 недель",
                    price: "от 25 000 ₽ / мес",
                  },
                  {
                    format: "AI для дизайнеров",
                    desc: "Как встроить Claude, Cursor, v0 в продуктовую работу",
                    time: "Мастер-класс",
                    price: "по запросу",
                  },
                ].map((item) => (
                  <div
                    key={item.format}
                    className="border border-white/[0.08] rounded-lg p-5"
                  >
                    <div className="flex flex-wrap justify-between items-baseline gap-2 mb-2">
                      <h3 className="text-sm md:text-base font-medium text-white/85">
                        {item.format}
                      </h3>
                      <span className="text-xs font-medium text-white/70">
                        {item.price}
                      </span>
                    </div>
                    <div className="flex justify-between items-start gap-3">
                      <p className="text-xs md:text-sm text-white/40 flex-1">
                        {item.desc}
                      </p>
                      <span className="text-[9px] tracking-[0.12em] uppercase text-white/25 shrink-0">
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Simplified booking — Cal.com primary, Telegram fallback */}
            <div className="md:sticky md:top-24 self-start">
              <div className="border border-white/[0.08] rounded-lg p-6 md:p-8">
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
                  className="block w-full text-center bg-white text-black hover:bg-white/90 rounded-lg px-6 py-3 text-sm font-medium transition-colors no-underline mb-3"
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
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ===== CONTACTS ===== */}
      <section className="relative z-[1] px-5 md:px-10 py-20 md:py-24 border-t border-white/[0.06] bg-black">
        <ScrollReveal>
          <div className="section-label mb-3">06 — Контакты</div>
          <h2 className="font-p95 text-[clamp(28px,4vw,56px)] uppercase mb-6">
            НАПИСАТЬ
          </h2>
          <p className="text-white/50 leading-relaxed text-base md:text-lg max-w-2xl mb-10">
            Москва · готов к гибриду и удалёнке · обсуждаю релокацию под сильный
            оффер. Самый быстрый канал — Telegram.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="flex flex-wrap gap-3 md:gap-4">
            {[
              { label: "Telegram", href: "https://t.me/egoradi", primary: true },
              { label: "Email", href: "mailto:egor.outhead@gmail.com" },
              { label: "LinkedIn", href: "https://www.linkedin.com/in/egorshugaev/" },
              { label: "GitHub", href: "https://github.com/outhead" },
              { label: "CV ↓", href: "/Egor_Shugaev_CV.pdf" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target="_blank"
                className={
                  link.primary
                    ? "bg-white text-black hover:bg-white/90 rounded-lg px-6 py-3 text-sm font-medium transition-colors no-underline"
                    : "bg-transparent border border-white/15 hover:border-white/40 rounded-lg px-6 py-3 text-sm text-white/70 hover:text-white transition-colors no-underline"
                }
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

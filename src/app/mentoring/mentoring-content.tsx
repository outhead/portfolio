"use client";

import LedText from "@/components/LedText";
import { LedLines } from "@/components/LedBoard";
import MentoringBooking from "@/components/MentoringBooking";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import { useLocale } from "@/lib/useLocale";
import { pick, localizedHref } from "@/lib/i18n";

const CONTAINER =
  "px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))]";

/** Лейбл секции — как на главной: золотые скобки + LED-текст */
function Label({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-white/55">
      <LedText text="[" className="h-[12px] md:h-[13px] w-auto text-[#C9A66B]" />
      <span className="sr-only">{children}</span>
      <LedText text={children} className="h-[10px] md:h-[11px] w-auto" />
      <LedText text="]" className="h-[12px] md:h-[13px] w-auto text-[#C9A66B]" />
    </span>
  );
}

export default function MentoringContent() {
  const locale = useLocale();

  const FORMATS = [
    {
      num: "01",
      title: pick("1-на-1 сессии", "1-on-1 sessions", locale),
      description: pick(
        "Индивидуальные консультации по дизайну, карьере и процессам. Разбор конкретных задач и ситуаций, поиск решений вместе.",
        "Individual consultations on design, career and processes. We work through specific tasks and situations and find solutions together.",
        locale,
      ),
      duration: pick("~60 минут", "~60 minutes", locale),
    },
    {
      num: "02",
      title: pick("Карьерный трекинг", "Career tracking", locale),
      description: pick(
        "Долгосрочное менторство с регулярными встречами 2–4 раза в месяц. Постановка целей, отслеживание прогресса, поддержка на каждом этапе роста.",
        "Long-term mentorship with regular meetings 2–4 times a month. Setting goals, tracking progress and support at every stage of growth.",
        locale,
      ),
      duration: pick("4–12 недель", "4–12 weeks", locale),
    },
    {
      num: "03",
      title: pick("Мастерклассы", "Masterclasses", locale),
      description: pick(
        "Практические воркшопы: как решать задачи с помощью нейросетей, AI-инструменты для дизайна, как управлять собой и командой в роли лида.",
        "Hands-on workshops: how to solve tasks with neural networks, AI tools for design, and how to manage yourself and your team as a lead.",
        locale,
      ),
      duration: pick("2–4 часа", "2–4 hours", locale),
    },
  ];

  const AUDIENCE = [
    {
      title: pick("Дизайнеры", "Designers", locale),
      text: pick(
        "От junior до senior, которые хотят расти в профессионализме, разобраться со сложными проектами, выстроить карьерную стратегию или перейти в management.",
        "From junior to senior, those who want to grow professionally, work through complex projects, build a career strategy or move into management.",
        locale,
      ),
    },
    {
      title: pick("Design Leaders", "Design Leaders", locale),
      text: pick(
        "Те, кто руководит командой или готовится к этой роли. Разбираем процессы, управление людьми, стратегию, мотивацию и как не выгореть.",
        "Those who lead a team or are preparing for the role. We work through processes, people management, strategy, motivation and how to avoid burnout.",
        locale,
      ),
    },
    {
      title: pick("Product Designers", "Product Designers", locale),
      text: pick(
        "Которые хотят углубиться в AI-инструменты, улучшить процесс работы с данными, научиться быстрее продумывать решения.",
        "Those who want to go deeper into AI tools, improve how they work with data and learn to reason through solutions faster.",
        locale,
      ),
    },
    {
      title: pick("Стартапёры", "Founders", locale),
      text: pick(
        "Которые строят дизайн-функцию с нуля или масштабируют её. Поделюсь опытом, как это делал в крупных компаниях.",
        "Those building a design function from scratch or scaling one. I share how I did it at large companies.",
        locale,
      ),
    },
  ];

  const PRINCIPLES = [
    {
      n: "01",
      title: pick("Дизайн должен считаться", "Design has to add up", locale),
      body: pick(
        "Если после релиза метрика не двинулась, работу я не считаю сделанной. Discovery, гипотезы, A/B и обратная связь с продуктом — для меня обязательные этапы, не опциональные.",
        "If a metric doesn't move after release, I don't consider the work done. Discovery, hypotheses, A/B tests and product feedback are mandatory stages for me, not optional ones.",
        locale,
      ),
      wide: true,
    },
    {
      n: "02",
      title: pick("Промолчал на ревью — значит согласился", "Stay quiet at review, and you've agreed", locale),
      body: pick(
        "Я не верю в позицию «наблюдателя». За то, что уехало в прод, отвечают все, кто видел макет: лид, продакт, ревьюеры, автор. Защитить красивое в фигме — лёгкая часть; разобраться, что в релизе работает не так, и поправить — сложная. Лид, который перестал открывать свой продукт, первым теряет контакт с реальностью.",
        "I don't buy the \"I was just observing\" stance. Everyone who saw the mockup owns what ships: the lead, the PM, the reviewers, the author. Defending something pretty in Figma is the easy part; figuring out what's actually broken in the release and fixing it is the hard part. A lead who stops opening their own product is the first to lose touch with reality.",
        locale,
      ),
    },
    {
      n: "03",
      title: pick("Команда сильнее героя", "A team beats a hero", locale),
      body: pick(
        "Десять сильных людей без меня делают больше, чем я один на износе. Нанимаю на рост, даю зоны, поддерживаю мотивацию, помогаю с инструментами развития.",
        "Ten strong people without me get more done than I ever could alone, running on empty. I hire for growth, hand over real ownership, keep motivation up, and give people the tools to grow.",
        locale,
      ),
    },
    {
      n: "04",
      title: pick("Дизайн делается по любви", "Design is done out of love", locale),
      body: pick(
        "Чтобы найти новое — надо копать вглубь, а без огня к делу это не получается. Я горю учиться, учить и делиться, поэтому везде собираю комьюнити заинтересованных и разжигаю их интерес ещё больше.",
        "To find something new you have to dig deep, and that doesn't happen without a fire for the work. I love learning, teaching and sharing, so everywhere I go I build a community of people who care and fuel their interest even more.",
        locale,
      ),
      wide: true,
    },
  ];

  const PRICING = [
    {
      k: pick("1-на-1 сессия", "1-on-1 session", locale),
      v: pick("Обсудите при запросе", "Discussed on request", locale),
    },
    {
      k: pick("Карьерный трекинг", "Career tracking", locale),
      v: pick("Договариваемся индивидуально", "Agreed individually", locale),
    },
    {
      k: pick("Мастерклассы", "Masterclasses", locale),
      v: pick("Для команд — свяжитесь", "For teams — get in touch", locale),
    },
  ];

  return (
    <>
      {/* ===== HERO ===== */}
      <section className={`relative ${CONTAINER} pt-28 md:pt-36 pb-12 md:pb-16 bg-black border-t border-white/[0.04]`}>
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2.5 text-white/50 mb-4">
            <span className="h-1 w-1 rounded-full bg-[#A6FF00]" />
            <span className="sr-only">{pick("Менторинг", "Mentoring", locale)}</span>
            <LedText text={pick("Менторинг", "Mentoring", locale)} className="h-[10px] w-auto" />
          </div>
          <h1 className="mb-6 md:mb-8 text-white flex flex-col gap-[8px] md:gap-[11px]">
            <span className="sr-only">{pick("Веду к росту", "Guiding growth", locale)}</span>
            <LedText text={pick("Веду", "Guiding", locale)} scale={2} dot={1.45} className="h-[28px] md:h-[48px] w-auto self-start" />
            <LedText text={pick("К росту", "Growth", locale)} scale={2} dot={1.45} className="h-[28px] md:h-[48px] w-auto self-start" />
          </h1>
          <p className="text-base md:text-lg text-white/60 leading-relaxed max-w-2xl">
            {pick(
              "Помогаю дизайнерам и лидам расти, решать задачи и строить карьеру. За плечами 7 лет управления в крупных компаниях, делюсь конкретными инструментами, а не общими советами.",
              "I help designers and leads grow, solve problems and build careers. With 7 years of management at large companies behind me, I share concrete tools rather than generic advice.",
              locale,
            )}
          </p>
        </div>
      </section>

      {/* ===== FORMATS ===== */}
      <section className={`relative z-[1] ${CONTAINER} py-14 md:py-20 border-t border-white/[0.06] bg-black`}>
        <ScrollReveal>
          <div className="mb-8 md:mb-12">
            <Label>{pick("Форматы", "Formats", locale)}</Label>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
          {FORMATS.map((format, i) => (
            <ScrollReveal key={format.title} delay={i * 100} className="h-full">
              <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f0e] hover:border-white/[0.2] transition-colors p-6 md:p-8 h-full flex flex-col">
                <div className="text-[#C9A66B]/70 mb-4">
                  <LedText text={format.num} className="h-[9px] w-auto" />
                </div>
                <h3 className="mb-4 text-white">
                  <LedLines text={format.title} maxChars={18} lineClass="h-[13px] md:h-[15px]" />
                </h3>
                <p className="text-[14px] md:text-[16px] text-white/60 leading-relaxed mb-6">
                  {format.description}
                </p>
                <div className="mt-auto pt-4 border-t border-white/[0.06] text-[#C9A66B]/80">
                  <span className="sr-only">{format.duration}</span>
                  <LedText text={format.duration} className="h-[9px] w-auto" />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ===== FOR WHOM ===== */}
      <section className={`relative z-[1] ${CONTAINER} py-14 md:py-20 border-t border-white/[0.06] bg-black`}>
        <ScrollReveal>
          <div className="mb-8 md:mb-12">
            <Label>{pick("Для кого", "Who it's for", locale)}</Label>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-4 md:gap-5">
          {AUDIENCE.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 80} className="h-full">
              <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f0e] hover:border-white/[0.2] transition-colors p-6 md:p-8 h-full">
                <h3 className="text-white mb-4">
                  <span className="sr-only">{item.title}</span>
                  <LedText text={item.title} className="h-[11px] md:h-[12px] w-auto" />
                </h3>
                <p className="text-[14px] md:text-[16px] text-white/60 leading-relaxed">
                  {item.text}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ===== BOOKING ===== */}
      <section className={`relative z-[1] ${CONTAINER} py-14 md:py-20 border-t border-white/[0.06] bg-black`}>
        <ScrollReveal>
          <div className="mb-8 md:mb-12">
            <Label>{pick("Запись", "Booking", locale)}</Label>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <div className="space-y-4 md:space-y-5">
            {/* Слот-пикер + форма заявки */}
            <MentoringBooking />

            <div className="grid md:grid-cols-2 gap-4 md:gap-5 items-stretch">
              {/* Или просто напишите */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f0e] p-6 md:p-8 flex flex-col">
                <h3 className="text-white mb-4">
                  <LedLines text={pick("Или просто напишите", "Or just message me", locale)} maxChars={20} lineClass="h-[13px] md:h-[15px]" />
                </h3>
                <p className="text-[14px] md:text-[16px] text-white/60 leading-relaxed mb-7 max-w-md">
                  {pick(
                    "Не нашлось удобного слота или хочешь обсудить формат заранее — напиши напрямую. Отвечу в течение дня.",
                    "No convenient slot, or want to discuss the format in advance — message me directly. I'll reply within a day.",
                    locale,
                  )}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-3">
                  <Link
                    href="https://t.me/egoradi"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ym-goal="cta_telegram"
                    data-ym-goal-params='{"placement":"mentoring_booking"}'
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#A6FF00] text-black hover:bg-white transition-colors no-underline"
                  >
                    <span className="sr-only">{pick("Написать в Telegram", "Message on Telegram", locale)}</span>
                    <LedText text={pick("Написать в Telegram", "Message on Telegram", locale)} className="h-[10px] w-auto" />
                    <LedText text="→" className="h-[12px] w-auto" />
                  </Link>
                  <Link
                    href="mailto:egor.outhead@gmail.com?subject=Менторинг"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/20 text-white/85 hover:border-[#A6FF00]/60 hover:text-[#A6FF00] transition-colors no-underline"
                  >
                    <span className="sr-only">{pick("Написать на Email", "Send an email", locale)}</span>
                    <LedText text="Email" className="h-[10px] w-auto" />
                  </Link>
                </div>
              </div>

              {/* Стоимость */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f0e] p-6 md:p-8">
                <h3 className="text-white mb-5">
                  <span className="sr-only">{pick("Стоимость", "Pricing", locale)}</span>
                  <LedText text={pick("Стоимость", "Pricing", locale)} className="h-[11px] md:h-[12px] w-auto" />
                </h3>
                <div className="space-y-3">
                  {PRICING.map((row, i) => (
                    <div key={row.k} className={i > 0 ? "border-t border-white/[0.06] pt-3" : ""}>
                      <div className="text-[#C9A66B]/70 mb-1.5">
                        <span className="sr-only">{row.k}</span>
                        <LedText text={row.k} className="h-[8px] w-auto" />
                      </div>
                      <div className="text-[16px] text-white/70">{row.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ===== PRINCIPLES ===== */}
      <section className={`relative z-[1] ${CONTAINER} py-14 md:py-20 border-t border-white/[0.06] bg-black`}>
        <ScrollReveal>
          <div className="mb-8 md:mb-12">
            <Label>{pick("Принципы", "Principles", locale)}</Label>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-4 md:gap-5">
          {PRINCIPLES.map((p, i) => (
            <ScrollReveal
              key={p.n}
              delay={i * 80}
              className={p.wide ? "md:col-span-2 h-full" : "h-full"}
            >
              <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f0e] hover:border-white/[0.2] transition-colors p-7 md:p-10 flex flex-col justify-between min-h-[240px] md:min-h-[280px] h-full">
                <div>
                  <div className="text-[#C9A66B]/70 mb-3">
                    <LedText text={`${p.n} /`} className="h-[9px] w-auto" />
                  </div>
                  <h3 className="text-white mb-4 max-w-2xl">
                    <LedLines text={p.title} maxChars={26} lineClass="h-[16px] md:h-[22px]" />
                  </h3>
                </div>
                <p className="text-sm md:text-[16px] text-white/60 leading-relaxed max-w-2xl">
                  {p.body}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ===== BACK LINK ===== */}
      <section className={`relative z-[1] ${CONTAINER} py-12 md:py-16 border-t border-white/[0.06] bg-black`}>
        <Link
          href={localizedHref("/", locale)}
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 hover:gap-3 transition-all duration-200 no-underline"
        >
          <LedText text="←" className="h-[11px] w-auto" />
          <span className="sr-only">{pick("На главную", "Home", locale)}</span>
          <LedText text={pick("На главную", "Home", locale)} className="h-[10px] w-auto" />
        </Link>
      </section>
    </>
  );
}

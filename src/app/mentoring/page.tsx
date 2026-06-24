import LedText from "@/components/LedText";
import { LedLines } from "@/components/LedBoard";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Менторинг — Егор Шугаев",
  description:
    "Менторинг для дизайнеров и лидов: 1-on-1 сессии, карьерный трекинг, мастерклассы. 7 лет опыта управления в МТС, Ozon, Газпром Нефти.",
  openGraph: {
    title: "Менторинг — Егор Шугаев",
    description:
      "Помогаю дизайнерам и лидам расти. Индивидуальные консультации, карьерный трекинг, воркшопы по AI-инструментам.",
    type: "website",
  },
};

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

const FORMATS = [
  {
    num: "01",
    title: "1-на-1 сессии",
    description:
      "Индивидуальные консультации по дизайну, карьере и процессам. Разбор конкретных задач и ситуаций, поиск решений вместе.",
    duration: "~60 минут",
  },
  {
    num: "02",
    title: "Карьерный трекинг",
    description:
      "Долгосрочное менторство с регулярными встречами 2–4 раза в месяц. Постановка целей, отслеживание прогресса, поддержка на каждом этапе роста.",
    duration: "4–12 недель",
  },
  {
    num: "03",
    title: "Мастерклассы",
    description:
      "Практические воркшопы: как решать задачи с помощью нейросетей, AI-инструменты для дизайна, как управлять собой и командой в роли лида.",
    duration: "2–4 часа",
  },
];

const AUDIENCE = [
  {
    title: "Дизайнеры",
    text: "От junior до senior, которые хотят расти в профессионализме, разобраться со сложными проектами, выстроить карьерную стратегию или перейти в management.",
  },
  {
    title: "Design Leaders",
    text: "Те, кто руководит командой или готовится к этой роли. Разбираем процессы, управление людьми, стратегию, мотивацию и как не выгореть.",
  },
  {
    title: "Product Designers",
    text: "Которые хотят углубиться в AI-инструменты, улучшить процесс работы с данными, научиться быстрее продумывать решения.",
  },
  {
    title: "Стартапёры",
    text: "Которые строят дизайн-функцию с нуля или масштабируют её. Поделюсь опытом, как это делал в крупных компаниях.",
  },
];

const PRINCIPLES = [
  {
    n: "01",
    title: "Дизайн должен считаться",
    body: "Если после релиза метрика не двинулась, работу я не считаю сделанной. Discovery, гипотезы, A/B и обратная связь с продуктом — для меня обязательные этапы, не опциональные.",
    wide: true,
  },
  {
    n: "02",
    title: "Промолчал на ревью — значит согласился",
    body: "Я не верю в позицию «наблюдателя». За то, что уехало в прод, отвечают все, кто видел макет: лид, продакт, ревьюеры, автор. Защитить красивое в фигме — лёгкая часть; разобраться, что в релизе работает не так, и поправить — сложная. Лид, который перестал открывать свой продукт, первым теряет контакт с реальностью.",
  },
  {
    n: "03",
    title: "Команда сильнее героя",
    body: "Десять сильных людей без меня делают больше, чем я один на износе. Нанимаю на рост, даю зоны, поддерживаю мотивацию, помогаю с инструментами развития.",
  },
  {
    n: "04",
    title: "Дизайн делается по любви",
    body: "Чтобы найти новое — надо копать вглубь, а без огня к делу это не получается. Я горю учиться, учить и делиться, поэтому везде собираю комьюнити заинтересованных и разжигаю их интерес ещё больше.",
    wide: true,
  },
];

export default function MentoringPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className={`relative ${CONTAINER} pt-28 md:pt-36 pb-12 md:pb-16 bg-black border-t border-white/[0.04]`}>
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2.5 text-white/50 mb-4">
            <span className="h-1 w-1 rounded-full bg-[#A6FF00]" />
            <span className="sr-only">Менторинг</span>
            <LedText text="Менторинг" className="h-[10px] w-auto" />
          </div>
          <h1 className="mb-6 md:mb-8 text-white flex flex-col gap-[8px] md:gap-[11px]">
            <span className="sr-only">Веду к росту</span>
            <LedText text="Веду" scale={2} dot={1.45} className="h-[28px] md:h-[48px] w-auto self-start" />
            <LedText text="К росту" scale={2} dot={1.45} className="h-[28px] md:h-[48px] w-auto self-start" />
          </h1>
          <p className="text-base md:text-lg text-white/60 leading-relaxed max-w-2xl">
            Помогаю дизайнерам и лидам расти, решать задачи и строить карьеру.
            За плечами 7 лет управления в крупных компаниях, делюсь конкретными
            инструментами, а не общими советами.
          </p>
        </div>
      </section>

      {/* ===== FORMATS ===== */}
      <section className={`relative z-[1] ${CONTAINER} py-14 md:py-20 border-t border-white/[0.06] bg-black`}>
        <ScrollReveal>
          <div className="mb-8 md:mb-12">
            <Label>Форматы</Label>
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
            <Label>Для кого</Label>
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
            <Label>Запись</Label>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <div className="grid md:grid-cols-2 gap-4 md:gap-5 items-stretch">
            {/* Напишите мне */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f0e] p-6 md:p-8 flex flex-col">
              <h3 className="text-white mb-4">
                <LedLines text="Напишите мне" maxChars={20} lineClass="h-[13px] md:h-[15px]" />
              </h3>
              <p className="text-[14px] md:text-[16px] text-white/60 leading-relaxed mb-7 max-w-md">
                Расскажите коротко о себе, что хотите обсудить и какой формат
                интересен. Я отвечу в течение дня.
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
                  <span className="sr-only">Написать в Telegram</span>
                  <LedText text="Написать в Telegram" className="h-[10px] w-auto" />
                  <LedText text="→" className="h-[12px] w-auto" />
                </Link>
                <Link
                  href="mailto:egor.outhead@gmail.com?subject=Менторинг"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/20 text-white/85 hover:border-[#A6FF00]/60 hover:text-[#A6FF00] transition-colors no-underline"
                >
                  <span className="sr-only">Написать на Email</span>
                  <LedText text="Email" className="h-[10px] w-auto" />
                </Link>
              </div>
            </div>

            {/* Календарь + стоимость */}
            <div className="flex flex-col gap-4 md:gap-5">
              <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f0e] p-6 md:p-8">
                <h3 className="text-white mb-4">
                  <LedLines text="Или время в календаре" maxChars={22} lineClass="h-[13px] md:h-[15px]" />
                </h3>
                <p className="text-[14px] md:text-[16px] text-white/60 leading-relaxed mb-6 max-w-md">
                  Ссылка откроется в Cal.com — выберите удобный слот для встречи.
                </p>
                <Link
                  href="https://cal.com/egor-shugaev"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ym-goal="mentoring_calcom"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/20 text-white/85 hover:border-[#A6FF00]/60 hover:text-[#A6FF00] transition-colors no-underline"
                >
                  <span className="sr-only">Записаться через Cal.com</span>
                  <LedText text="Записаться · Cal.com" className="h-[10px] w-auto" />
                  <LedText text="→" className="h-[12px] w-auto" />
                </Link>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f0e] p-6 md:p-8 flex-1">
                <h3 className="text-white mb-5">
                  <span className="sr-only">Стоимость</span>
                  <LedText text="Стоимость" className="h-[11px] md:h-[12px] w-auto" />
                </h3>
                <div className="space-y-3">
                  {[
                    { k: "1-на-1 сессия", v: "Обсудите при запросе" },
                    { k: "Карьерный трекинг", v: "Договариваемся индивидуально" },
                    { k: "Мастерклассы", v: "Для команд — свяжитесь" },
                  ].map((row, i) => (
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
            <Label>Принципы</Label>
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
          href="/"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 hover:gap-3 transition-all duration-200 no-underline"
        >
          <LedText text="←" className="h-[11px] w-auto" />
          <span className="sr-only">На главную</span>
          <LedText text="На главную" className="h-[10px] w-auto" />
        </Link>
      </section>
    </>
  );
}

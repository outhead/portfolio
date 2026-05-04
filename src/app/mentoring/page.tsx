import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import WIPOverlay from "@/components/WIPOverlay";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Менторинг — Егор Шугаев",
  description:
    "Менторинг для дизайнеров и лидов: 1-on-1 сессии, карьерный трекинг, мастерклассы. 8+ лет опыта управления в МТС, Ozon, Газпром Нефти.",
  openGraph: {
    title: "Менторинг — Егор Шугаев",
    description:
      "Помогаю дизайнерам и лидам расти. Индивидуальные консультации, карьерный трекинг, воркшопы по AI-инструментам.",
    type: "website",
  },
};

export default function MentoringPage() {
  return (
    <>
      <WIPOverlay
        title="Раздел дорабатывается"
        description="Страница про менторинг ещё в работе: дописываю описание форматов, цены и формы записи. Заходите чуть позже или посмотрите кейсы рядом."
      />
      <div className="blur-md select-none pointer-events-none" aria-hidden>

      {/* ===== HERO ===== */}
      <section className="relative px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-20 md:py-32 border-t border-white/[0.04] bg-black/75">
        <div className="max-w-5xl">
          <div className="animate-fade-in-up">
            <h1 className="font-p95 text-[clamp(48px,10vw,100px)] leading-[0.92] uppercase tracking-tight mb-4 md:mb-6">
              МЕНТОРИНГ
            </h1>
          </div>
          <p className="animate-fade-in-up animation-delay-200 text-base md:text-lg text-white/60 leading-relaxed max-w-2xl">
            Помогаю дизайнерам и лидам расти, решать задачи и строить карьеру.
            За плечами 8+ лет управления в крупных компаниях, делюсь конкретными инструментами,
            а не общими советами.
          </p>
        </div>
      </section>

      {/* ===== FORMATS ===== */}
      <section className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-20 md:py-32 border-t border-white/[0.04] bg-black/75">
        <div className="max-w-5xl">
          <ScrollReveal>
            <div className="section-label mb-6">Форматы</div>
            <h2 className="font-p95 text-[clamp(28px,4vw,56px)] uppercase mb-10 md:mb-14">
              КАК МЫ РАБОТАЕМ
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "1-on-1 сессии",
                description:
                  "Индивидуальные консультации по дизайну, карьере и процессам. Разбор конкретных задач и ситуаций, поиск решений вместе.",
                duration: "~60 минут",
              },
              {
                title: "Карьерный трекинг",
                description:
                  "Долгосрочное менторство с регулярными встречами 2–4 раза в месяц. Постановка целей, отслеживание прогресса, поддержка на каждом этапе роста.",
                duration: "4–12 недель",
              },
              {
                title: "Мастерклассы",
                description:
                  "Практические воркшопы: как решать задачи с помощью нейросетей, AI-инструменты для дизайна, как управлять собой и командой в роли лида.",
                duration: "2–4 часа",
              },
            ].map((format, i) => (
              <ScrollReveal key={format.title} delay={i * 100}>
                <div className="border border-white/[0.06] rounded-lg p-6 md:p-7 hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1 h-full">
                  <h3 className="font-p95 text-base md:text-lg uppercase tracking-tight mb-3 text-white/90">
                    {format.title}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed mb-6">
                    {format.description}
                  </p>
                  <div className="text-[12px] tracking-[0.12em] uppercase text-white/25">
                    {format.duration}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOR WHOM ===== */}
      <section className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-20 md:py-32 border-t border-white/[0.04] bg-black/75">
        <div className="max-w-5xl">
          <ScrollReveal>
            <div className="section-label mb-6">Для кого</div>
            <h2 className="font-p95 text-[clamp(28px,4vw,56px)] uppercase mb-10 md:mb-14">
              ПОДОЙДЁТ ВАМ?
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8 md:gap-16">
            {[
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
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 80}>
                <div>
                  <h3 className="text-sm font-medium text-white/80 mb-4 uppercase tracking-[0.1em]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BOOKING ===== */}
      <section className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-20 md:py-32 border-t border-white/[0.04] bg-black/75">
        <div className="max-w-5xl">
          <ScrollReveal>
            <div className="section-label mb-6">Запись</div>
            <h2 className="font-p95 text-[clamp(28px,4vw,56px)] uppercase mb-10 md:mb-14">
              ЗАПИСАТЬСЯ
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={150}>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Direct contact */}
            <div className="border border-white/[0.06] rounded-lg p-6 md:p-8 hover:border-white/[0.08] transition-colors duration-300">
              <h3 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-[0.1em]">
                Напишите мне
              </h3>
              <p className="text-sm text-white/40 leading-relaxed mb-6">
                Расскажите коротко о себе, что хотите обсудить и какой формат интересен. Я отвечу в течение дня.
              </p>
              <div className="space-y-3">
                <Link
                  href="https://t.me/egoradi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#A6FF00] hover:bg-[#B8FF33] rounded py-2.5 text-sm text-black font-semibold transition-colors no-underline uppercase tracking-[0.08em]"
                >
                  Написать в Telegram
                </Link>
                <Link
                  href="mailto:egor.outhead@gmail.com?subject=Менторинг"
                  className="flex items-center justify-center gap-2 w-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded py-2.5 text-sm text-white/60 hover:text-white/80 transition-all duration-200 no-underline uppercase tracking-[0.08em]"
                >
                  Написать на Email
                </Link>
              </div>
            </div>

            {/* Cal.com booking */}
            <div className="flex flex-col gap-8">
              <div className="border border-white/[0.06] rounded-lg p-6 md:p-8 text-center hover:border-white/[0.08] transition-colors duration-300">
                <div className="text-[12px] tracking-[0.1em] uppercase text-white/20 mb-4">
                  Или выберите время в календаре
                </div>
                <p className="text-xs text-white/40 mb-6 leading-relaxed">
                  Ссылка откроется в календаре Cal.com. Там вы сможете выбрать
                  удобное время для встречи.
                </p>
                <Link
                  href="https://cal.com/egor-shugaev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded px-6 py-2.5 text-sm text-white/60 hover:text-white/80 transition-all duration-200 uppercase tracking-[0.1em] no-underline"
                >
                  Записаться через Cal.com
                </Link>

                <div className="my-4 text-[12px] tracking-[0.1em] uppercase text-white/20">
                  или
                </div>

                <Link
                  href="https://t.me/vigrom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded px-6 py-2.5 text-sm text-white/60 hover:text-white/80 transition-all duration-200 uppercase tracking-[0.1em] no-underline"
                >
                  Написать в Telegram
                </Link>
              </div>

              {/* Info box */}
              <div className="border border-white/[0.06] rounded-lg p-6 md:p-8 hover:border-white/[0.08] transition-colors duration-300">
                <h3 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-[0.1em]">
                  Стоимость
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-white/30 mb-1">1-on-1 сессия</div>
                    <div className="text-base text-white/70">Обсудите при запросе</div>
                  </div>
                  <div className="border-t border-white/[0.06] pt-3">
                    <div className="text-xs text-white/30 mb-1">Карьерный трекинг</div>
                    <div className="text-base text-white/70">Договариваемся индивидуально</div>
                  </div>
                  <div className="border-t border-white/[0.06] pt-3">
                    <div className="text-xs text-white/30 mb-1">Мастерклассы</div>
                    <div className="text-base text-white/70">Для команд — свяжитесь</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== BACK LINK ===== */}
      <section className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-12 md:py-16 border-t border-white/[0.06] bg-black">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 hover:gap-3 transition-all duration-200 no-underline"
        >
          <span>←</span>
          <span>На главную</span>
        </Link>
      </section>

      </div>
    </>
  );
}

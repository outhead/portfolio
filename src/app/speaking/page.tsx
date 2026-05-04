"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { Mic2, GraduationCap, Send, ArrowUpRight, Play } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const viewport = { once: true, margin: "-10% 0px -10% 0px" };

// ───────────────────────────────────────────────────────────
// Speaking & interviews — собрано из кейсов МТС и Газпром Нефти
// ───────────────────────────────────────────────────────────
const TALKS: Array<{
  label: string;
  era: string;
  url: string;
  thumbnail: string;
}> = [
  // МТС
  {
    label: "Интервью со мной — Art-director МТС",
    era: "МТС · 2024–2025",
    url: "https://youtu.be/opoCmrnQUDI",
    thumbnail: "/images/mts/links/mts-interview.jpg",
  },
  {
    label: "«Чаптеры или как засинкать 150 дизайнеров»",
    era: "МТС · ранние годы",
    url: "https://youtu.be/2F6TrdrWYKc",
    thumbnail: "/images/mts/links/mts-first.jpg",
  },
  // ГПН
  {
    label: "Полное выступление со студией Pinkman",
    era: "ГПН · 2023",
    url: "https://youtu.be/lLxhnXgoCTQ",
    thumbnail: "/images/gpn/links/pinkman.jpg",
  },
  {
    label: "World Usability Day — кейс ГПН",
    era: "ГПН · 2022",
    url: "https://www.youtube.com/live/OjdF0lLFGv4?t=5003",
    thumbnail: "/images/gpn/links/wud-2022.jpg",
  },
  {
    label: "ЦЕХ News #13 — ИИ в дизайне",
    era: "Webflow Conf · 2023",
    url: "https://youtu.be/4s7j57G71fg",
    thumbnail: "/images/gpn/links/ai-edited.jpg",
  },
  {
    label: "«ИИ бесполезен» — подкаст про ИИ",
    era: "ГПН · 2023",
    url: "https://youtu.be/iGQzN9T4upA",
    thumbnail: "/images/gpn/links/ai-fun.jpg",
  },
  {
    label: "AI в дизайне — кафедра Skillbox",
    era: "Skillbox · 2023",
    url: "https://youtu.be/u1AQGiFpgMI",
    thumbnail: "/images/gpn/links/ai-skillbox.jpg",
  },
  {
    label: "Раннее интервью на ЦЕХ — нейросети",
    era: "ЦЕХ · 2022",
    url: "https://youtu.be/cEw5iTNTfZg",
    thumbnail: "/images/gpn/links/ai-old.jpg",
  },
];

export default function SpeakingPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] pt-28 md:pt-36 pb-12 md:pb-16 bg-black border-t border-white/[0.04]">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="max-w-4xl"
        >
          <motion.div variants={fadeUp}>
            <div className="inline-flex items-center gap-2 text-[12px] md:text-[13px] tracking-[0.22em] uppercase text-white/50 font-medium mb-4">
              <span className="h-1 w-1 rounded-full bg-[#A6FF00]" />
              Публично
            </div>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="font-p95 text-[clamp(48px,9vw,112px)] leading-[0.92] uppercase tracking-tight mb-5 md:mb-7"
          >
            ГОВОРЮ<br />И ПИШУ
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-base md:text-lg text-white/60 leading-relaxed max-w-2xl"
          >
            Выступаю на отраслевых конференциях, менторю дизайнеров и лидов, веду Telegram-канал
            Vigrom про AI-инструменты для дизайнеров. Не штатный спикер —
            к каждому большому залу готовлюсь долго и тщательно.
          </motion.p>
        </motion.div>
      </section>

      {/* ===== TALKS GRID — основной блок, собран из кейсов ===== */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={stagger}
        className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] pb-14 md:pb-20 bg-black"
      >
        <motion.div variants={fadeUp} className="mb-8 md:mb-10 flex items-center gap-3">
          <Mic2 className="w-4 h-4 text-white/40" strokeWidth={1.75} />
          <span className="font-p95 text-[15px] md:text-[16px] tracking-[0.22em] uppercase text-white/70">
            Видео и интервью
          </span>
          <span className="text-[13px] md:text-[14px] text-white/35 tabular-nums">
            {TALKS.length}
          </span>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {TALKS.map((talk) => (
            <motion.div key={talk.url} variants={fadeUp}>
              <Link
                href={talk.url}
                target="_blank"
                className="group block no-underline"
                aria-label={talk.label}
              >
                <div className="relative aspect-video rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.02] transition-all duration-300 group-hover:border-white/25">
                  <Image
                    src={talk.thumbnail}
                    alt={talk.label}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover opacity-70 transition-all duration-500 group-hover:opacity-100 group-hover:scale-[1.03]"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
                  />
                  {/* Play badge */}
                  <div className="absolute top-3 left-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 transition-all duration-300 group-hover:bg-[#A6FF00] group-hover:border-[#A6FF00]">
                    <Play className="w-3.5 h-3.5 text-white fill-white group-hover:text-black group-hover:fill-black ml-0.5" strokeWidth={2} />
                  </div>
                  {/* External arrow */}
                  <div className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-4 h-4 text-white/85" strokeWidth={2} />
                  </div>
                </div>
                <div className="mt-3 md:mt-4 flex flex-col gap-1.5">
                  <div className="text-[11px] md:text-[12px] tracking-[0.16em] uppercase text-white/40">
                    {talk.era}
                  </div>
                  <div className="text-[15px] md:text-[16px] text-white/85 leading-snug group-hover:text-white transition-colors">
                    {talk.label}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ===== MENTORSHIP + TELEGRAM — компактный блок ===== */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={stagger}
        className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-12 md:py-16 bg-black border-t border-white/[0.06]"
      >
        <div className="grid md:grid-cols-2 gap-6 md:gap-10">
          {/* Mentorship */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-4 h-4 text-white/40" strokeWidth={1.5} />
              <div className="font-p95 text-[15px] md:text-[16px] tracking-[0.2em] uppercase text-white/70">
                Менторство и&nbsp;курсы
              </div>
            </div>
            <ul className="space-y-2.5 text-[15px] md:text-[16px] text-white/65 leading-relaxed mb-5">
              <li>30+ менти за&nbsp;карьеру (включая АД-период)</li>
              <li>ВШЭ — читал курс по&nbsp;прикладному ИИ</li>
              <li>Воркшопы для&nbsp;продуктовых команд</li>
            </ul>
            <Link
              href="mailto:egor.outhead@gmail.com?subject=Менторство"
              className="inline-flex items-center gap-2 text-[14px] md:text-[15px] tracking-[0.04em] text-white/55 hover:text-[#A6FF00] transition-colors no-underline"
            >
              Записаться <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </motion.div>

          {/* Telegram channel */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2 mb-4">
              <Send className="w-4 h-4 text-white/40" strokeWidth={1.5} />
              <div className="font-p95 text-[15px] md:text-[16px] tracking-[0.2em] uppercase text-white/70">
                Telegram-канал
              </div>
            </div>
            <p className="text-[15px] md:text-[16px] text-white/65 leading-relaxed mb-5">
              «Vigrom» — AI-инструменты для&nbsp;дизайнеров. Разборы Claude, Cursor, vibe-coding.
            </p>
            <Link
              href="https://t.me/vigrom"
              target="_blank"
              className="inline-flex items-center gap-2 text-[14px] md:text-[15px] tracking-[0.04em] text-white/55 hover:text-[#A6FF00] transition-colors no-underline"
            >
              Читать канал <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* ===== PHOTOS ===== */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={stagger}
        className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] pb-24 md:pb-32 bg-black"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {[
            {
              src: "/images/photos/photo-4.jpg",
              alt: "Егор Шугаев выступает на конференции по AI в дизайне",
            },
            {
              src: "/images/photos/photo-5.jpg",
              alt: "Егор Шугаев — портрет дизайн-директора",
            },
            {
              src: "/images/photos/photo-6.jpg",
              alt: "Егор Шугаев на воркшопе по дизайн-менеджменту",
            },
          ].map((photo, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="relative aspect-[4/3] rounded-xl overflow-hidden"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover opacity-70 hover:opacity-100 transition-opacity duration-500"
              />
            </motion.div>
          ))}
        </div>
      </motion.section>
    </>
  );
}

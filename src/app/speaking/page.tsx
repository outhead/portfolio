"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { Mic2, GraduationCap, Send, ArrowUpRight } from "lucide-react";

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
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const viewport = { once: true, margin: "-10% 0px -10% 0px" };

export default function SpeakingPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] pt-28 md:pt-36 pb-12 md:pb-20 bg-black border-t border-white/[0.04]">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="max-w-4xl"
        >
          <motion.div variants={fadeUp}>
            <div className="inline-flex items-center gap-2 text-[10px] md:text-[11px] tracking-[0.22em] uppercase text-white/50 font-medium mb-4">
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
            Vigrom про AI-инструменты для дизайнеров. Не считаю себя профессиональным
            спикером: к большим залам каждый раз готовлюсь долго и нервно.
          </motion.p>
        </motion.div>
      </section>

      {/* ===== CONTENT ===== */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={stagger}
        className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] pb-14 md:pb-20 bg-black"
      >
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {/* Speaking */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2 mb-4">
              <Mic2 className="w-4 h-4 text-white/30" strokeWidth={1.5} />
              <div className="text-[10px] tracking-[0.18em] uppercase text-white/40 font-medium">
                Выступления
              </div>
            </div>
            <ul className="space-y-3 text-sm text-white/55 leading-relaxed mb-4">
              <li>Форум «Смарт Дизайн» — AI в дизайне</li>
              <li>Стендап «Мультибрендинг» — МТС</li>
            </ul>
            <Link
              href="mailto:egor.outhead@gmail.com?subject=Выступление"
              className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-[#A6FF00] transition-colors no-underline"
            >
              Пригласить <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
            </Link>
          </motion.div>

          {/* Teaching / mentorship */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-4 h-4 text-white/30" strokeWidth={1.5} />
              <div className="text-[10px] tracking-[0.18em] uppercase text-white/40 font-medium">
                Менторство и&nbsp;курсы
              </div>
            </div>
            <ul className="space-y-3 text-sm text-white/55 leading-relaxed mb-4">
              <li>30+ менти за&nbsp;карьеру (включая АД-период)</li>
              <li>ВШЭ — читал курс по прикладному ИИ</li>
              <li>Воркшопы для продуктовых команд</li>
            </ul>
            <Link
              href="mailto:egor.outhead@gmail.com?subject=Менторство"
              className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-[#A6FF00] transition-colors no-underline"
            >
              Записаться <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
            </Link>
          </motion.div>

          {/* Telegram channel */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2 mb-4">
              <Send className="w-4 h-4 text-white/30" strokeWidth={1.5} />
              <div className="text-[10px] tracking-[0.18em] uppercase text-white/40 font-medium">
                Telegram-канал
              </div>
            </div>
            <p className="text-sm text-white/55 leading-relaxed mb-4">
              «Vigrom» — AI-инструменты для дизайнеров. Разборы Claude, Cursor.
            </p>
            <Link
              href="https://t.me/vigrom"
              target="_blank"
              className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-[#A6FF00] transition-colors no-underline"
            >
              Читать канал <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
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

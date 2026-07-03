"use client";

import ProjectCard from "@/components/ProjectCard";
import LedText from "@/components/LedText";
import { experimentProjects } from "@/data/projects";
import { motion, type Variants } from "framer-motion";
import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";
import { localizeProject } from "@/lib/localizeProject";

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

export default function ExperimentsPage() {
  const locale = useLocale();
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] pt-28 md:pt-36 pb-12 md:pb-20 bg-black border-t border-white/[0.04]">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="max-w-4xl"
        >
          <motion.div variants={fadeUp}>
            <div className="inline-flex items-center gap-2 text-[12px] md:text-[14px] tracking-[0.22em] uppercase text-white/50 font-medium mb-4">
              <span className="h-1 w-1 rounded-full bg-[#A6FF00]" />
              {pick("Лаборатория", "Lab", locale)}
            </div>
          </motion.div>
          <motion.h1 variants={fadeUp} className="mb-6 md:mb-8 text-white">
            <span className="sr-only">{pick("Эксперименты", "Experiments", locale)}</span>
            <LedText text={pick("Эксперименты", "Experiments", locale)} scale={2} dot={1.45} className="h-[28px] md:h-[52px] w-auto max-w-full" />
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-base md:text-lg text-white/60 leading-relaxed max-w-2xl"
          >
            {pick(
              "Пет-проекты на стыке дизайна, кода и AI. Здесь я пробую идеи, которые не укладываются в рабочий контекст: WebGL-шейдеры, AI-агенты, creative coding. Часть из них так и не вышла за пределы наброска, и это тоже окей.",
              "Pet projects at the intersection of design, code and AI. This is where I try out ideas that don't fit into a work context: WebGL shaders, AI agents, creative coding. Some never got past a rough sketch — and that's fine too.",
              locale,
            )}
          </motion.p>
        </motion.div>
      </section>

      {/* ===== GRID ===== */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={stagger}
        className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] pb-24 md:pb-32 bg-black"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {experimentProjects.map((project, i) => (
            <motion.div key={project.slug} variants={fadeUp}>
              <ProjectCard project={localizeProject(project, locale)} index={i} />
            </motion.div>
          ))}
        </div>
      </motion.section>
    </>
  );
}

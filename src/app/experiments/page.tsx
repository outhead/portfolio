"use client";

import ProjectCard from "@/components/ProjectCard";
import { experimentProjects } from "@/data/projects";
import { motion, type Variants } from "framer-motion";

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
            <div className="inline-flex items-center gap-2 text-[12px] md:text-[13px] tracking-[0.22em] uppercase text-white/50 font-medium mb-4">
              <span className="h-1 w-1 rounded-full bg-[#A6FF00]" />
              Лаборатория
            </div>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="font-p95 text-[clamp(48px,9vw,112px)] leading-[0.92] uppercase tracking-tight mb-5 md:mb-7"
          >
            ЭКСПЕРИМЕНТЫ
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-base md:text-lg text-white/60 leading-relaxed max-w-2xl"
          >
            Пет-проекты на стыке дизайна, кода и AI. Здесь я пробую идеи, которые
            не укладываются в рабочий контекст: WebGL-шейдеры, AI-агенты,
            creative coding. Часть из них так и не вышла за пределы наброска, и
            это тоже окей.
          </motion.p>
        </motion.div>
      </section>

      {/* ===== GRID ===== */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={stagger}
        className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] pb-24 md:pb-32 bg-black"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {experimentProjects.map((project, i) => (
            <motion.div key={project.slug} variants={fadeUp}>
              <ProjectCard project={project} index={i} />
            </motion.div>
          ))}
        </div>
      </motion.section>
    </>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
  index: number;
  /** Крупная горизонтальная карточка (2-строчная высота в сетке). */
  featured?: boolean;
  /** Широкая 2×1-карточка, разбивающая ритм сетки (colorblind.cc-style). */
  wide?: boolean;
}

/**
 * Media — автоматически выбирает видео или картинку.
 * Видео играет автоплеем без звука, картинка затемнена, на hover — просветляется.
 */
function ProjectMedia({
  project,
  hoverScale = "group-hover:scale-[1.04]",
}: {
  project: Project;
  hoverScale?: string;
}) {
  if (project.coverVideo) {
    return (
      <video
        src={project.coverVideo}
        poster={project.coverImage}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className={`absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-all duration-700 ${hoverScale}`}
      />
    );
  }
  if (!project.coverImage) return null;
  if (project.coverImage.endsWith(".svg")) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={project.coverImage}
        alt=""
        aria-hidden
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${hoverScale}`}
      />
    );
  }
  return (
    <Image
      src={project.coverImage}
      alt=""
      aria-hidden
      fill
      className={`object-cover opacity-45 group-hover:opacity-70 transition-all duration-700 ${hoverScale}`}
    />
  );
}

export default function ProjectCard({
  project,
  index,
  featured = false,
  wide = false,
}: ProjectCardProps) {
  // === FEATURED — крупная hero-карточка ===
  if (featured) {
    return (
      <Link href={`/cases/${project.slug}`} className="no-underline group h-full block">
        <motion.article
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/[0.06] group-hover:border-white/20 transition-colors duration-300 h-full"
        >
          <div
            className="relative h-full min-h-[340px] md:min-h-[480px] overflow-hidden"
            style={{ background: project.coverColor }}
          >
            <ProjectMedia project={project} hoverScale="group-hover:scale-[1.03]" />

            {/* Gradient floor для читаемости */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/15" />

            {/* Index — top-left */}
            <div className="absolute top-5 left-5 md:top-6 md:left-6 font-p95 text-[12px] md:text-[13px] tracking-[0.2em] uppercase text-white/55">
              {String(index + 1).padStart(2, "0")}
            </div>

            {/* External arrow — top-right */}
            <div className="absolute top-5 right-5 md:top-6 md:right-6 w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/15 flex items-center justify-center bg-black/40 backdrop-blur-sm opacity-70 group-hover:opacity-100 group-hover:border-white/40 transition-all duration-300">
              <ArrowUpRight className="w-4 h-4 text-white/80" strokeWidth={2} />
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10 flex items-end justify-between gap-6">
              <div>
                <div className="font-p95 text-[12px] md:text-[13px] tracking-[0.2em] uppercase text-white/55 mb-2">
                  {project.company}
                </div>
                <h3 className="font-p95 text-[clamp(28px,4vw,56px)] uppercase leading-[0.95] text-white max-w-2xl">
                  {project.title}
                </h3>
              </div>
              {project.metric && (
                <div className="text-right shrink-0 hidden sm:block">
                  <div className="font-p95 text-[clamp(32px,4.5vw,64px)] leading-none text-white/95">
                    {project.metric}
                  </div>
                  <div className="text-[11px] md:text-[12px] tracking-[0.15em] uppercase text-white/45 mt-1.5">
                    {project.metricLabel}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.article>
      </Link>
    );
  }

  // === WIDE — 2×1 акцент-карта (разбивает ритм grid'а) ===
  if (wide) {
    return (
      <Link href={`/cases/${project.slug}`} className="no-underline group h-full block">
        <motion.article
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/[0.06] group-hover:border-white/20 transition-colors duration-300 h-full"
        >
          <div
            className="relative h-full min-h-[280px] md:min-h-[340px] overflow-hidden"
            style={{ background: project.coverColor }}
          >
            <ProjectMedia project={project} hoverScale="group-hover:scale-[1.04]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent md:via-black/30" />

            {/* Index */}
            <div className="absolute top-5 left-5 md:top-6 md:left-6 font-p95 text-[12px] md:text-[13px] tracking-[0.2em] uppercase text-white/55">
              {String(index + 1).padStart(2, "0")}
            </div>

            {/* Arrow */}
            <div className="absolute top-5 right-5 md:top-6 md:right-6 w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/15 flex items-center justify-center bg-black/40 backdrop-blur-sm opacity-70 group-hover:opacity-100 group-hover:border-white/40 transition-all duration-300">
              <ArrowUpRight className="w-4 h-4 text-white/80" strokeWidth={2} />
            </div>

            {/* Content — слева (как colorblind wide card) */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6">
              <div className="max-w-xl">
                <div className="font-p95 text-[12px] md:text-[13px] tracking-[0.2em] uppercase text-white/55 mb-2">
                  {project.company}
                </div>
                <h3 className="font-p95 text-[clamp(24px,3.2vw,44px)] uppercase leading-[0.95] text-white">
                  {project.title}
                </h3>
              </div>
              {project.metric && (
                <div className="text-right shrink-0">
                  <div className="font-p95 text-[clamp(24px,3.2vw,44px)] leading-none text-white/90">
                    {project.metric}
                  </div>
                  <div className="text-[11px] md:text-[12px] tracking-[0.15em] uppercase text-white/45 mt-1.5">
                    {project.metricLabel}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.article>
      </Link>
    );
  }

  // === REGULAR — компактная bento-карточка ===
  return (
    <Link href={`/cases/${project.slug}`} className="no-underline group h-full block">
      <motion.article
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/[0.06] group-hover:border-white/20 h-full transition-colors duration-300"
      >
        <div
          className="relative h-full min-h-[240px] md:min-h-[300px] overflow-hidden"
          style={{ background: project.coverColor }}
        >
          <ProjectMedia project={project} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/20" />

          {/* Index */}
          <div className="absolute top-4 left-4 font-p95 text-[11px] md:text-[12px] tracking-[0.2em] uppercase text-white/50">
            {String(index + 1).padStart(2, "0")}
          </div>

          {/* Metric — top-right, minimal */}
          {project.metric && (
            <div className="absolute top-4 right-4 text-right max-w-[130px]">
              <div className="font-p95 text-base md:text-lg text-white/55 leading-none">
                {project.metric}
              </div>
              {project.metricLabel && (
                <div className="text-[9px] md:text-[10px] tracking-[0.1em] uppercase text-white/35 mt-1 leading-tight">
                  {project.metricLabel}
                </div>
              )}
            </div>
          )}

          {/* Bottom — company + title */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
            <div className="font-p95 text-[11px] md:text-[12px] tracking-[0.2em] uppercase text-white/50 mb-2">
              {project.company}
            </div>
            <h3 className="font-p95 text-[clamp(22px,2.4vw,32px)] uppercase leading-[0.95] text-white max-w-[85%]">
              {project.title}
            </h3>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

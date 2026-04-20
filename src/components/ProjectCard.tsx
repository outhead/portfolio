"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
  index: number;
  featured?: boolean;
}

export default function ProjectCard({ project, index, featured = false }: ProjectCardProps) {
  // Common cover image renderer
  const Cover = ({ className }: { className?: string }) =>
    project.coverImage ? (
      project.coverImage.endsWith(".svg") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.coverImage}
          alt=""
          aria-hidden
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${className ?? ""}`}
        />
      ) : (
        <Image
          src={project.coverImage}
          alt=""
          aria-hidden
          fill
          className={`object-cover opacity-35 group-hover:opacity-60 transition-all duration-700 ${className ?? ""}`}
        />
      )
    ) : null;

  // === FEATURED — big hero card ===
  if (featured) {
    return (
      <Link href={`/cases/${project.slug}`} className="no-underline group">
        <motion.article
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/[0.06] group-hover:border-white/20 transition-colors duration-300"
        >
          <div
            className="relative h-[340px] md:h-[420px] lg:h-[460px] overflow-hidden"
            style={{ background: project.coverColor }}
          >
            <Cover className="group-hover:scale-[1.03]" />

            {/* Gradient floor for legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/20" />

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

  // === REGULAR — compact bento card ===
  return (
    <Link href={`/cases/${project.slug}`} className="no-underline group h-full">
      <motion.article
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/[0.06] group-hover:border-white/20 h-full transition-colors duration-300"
      >
        <div
          className="relative h-[240px] md:h-[280px] overflow-hidden"
          style={{ background: project.coverColor }}
        >
          <Cover className="group-hover:scale-[1.04]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/25" />

          {/* Index */}
          <div className="absolute top-4 left-4 font-p95 text-[11px] md:text-[12px] tracking-[0.2em] uppercase text-white/50">
            {String(index + 1).padStart(2, "0")}
          </div>

          {/* Metric — top-right, minimal */}
          {project.metric && (
            <div className="absolute top-4 right-4 font-p95 text-xl md:text-2xl text-white/80 leading-none">
              {project.metric}
            </div>
          )}

          {/* Bottom — company + title */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
            <div className="font-p95 text-[11px] md:text-[12px] tracking-[0.2em] uppercase text-white/50 mb-1.5">
              {project.company}
            </div>
            <h3 className="font-p95 text-[clamp(20px,2.2vw,30px)] uppercase leading-[0.98] text-white">
              {project.title}
            </h3>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

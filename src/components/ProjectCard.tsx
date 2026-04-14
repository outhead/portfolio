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
  if (featured) {
    return (
      <Link href={`/cases/${project.slug}`} className="no-underline group">
        <motion.article
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-xl overflow-hidden bg-[#0a0a0a] transition-colors duration-300 border border-white/[0.06] group-hover:border-white/15"
        >
          <div className="grid md:grid-cols-[1fr_1fr]">
            {/* Cover — left half */}
            <div
              className="h-56 md:h-80 relative overflow-hidden"
              style={{ background: project.coverColor }}
            >
              {project.coverImage && (
                project.coverImage.endsWith('.svg') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.coverImage}
                    alt={project.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <Image
                    src={project.coverImage}
                    alt={project.title}
                    fill
                    className="object-cover opacity-50 group-hover:opacity-65 group-hover:scale-105 transition-all duration-700"
                  />
                )
              )}
              {/* Metric */}
              {project.metric && (
                <div className="absolute bottom-6 right-6 text-right">
                  <div className="text-4xl md:text-5xl font-semibold text-white/80 leading-none">
                    {project.metric}
                  </div>
                  <div className="text-[9px] tracking-[0.1em] uppercase text-white/30 mt-1">
                    {project.metricLabel}
                  </div>
                </div>
              )}
              <div className="absolute top-5 left-5 text-[9px] tracking-[0.15em] uppercase text-white/30 font-mono">
                {String(index + 1).padStart(2, "0")}
              </div>
            </div>

            {/* Content — right half */}
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <div className="text-[10px] tracking-[0.12em] uppercase text-white/30 mb-2">
                {project.company}
              </div>
              <h3 className="text-xl md:text-2xl font-medium text-white mb-2 group-hover:text-white/90">
                {project.title}
              </h3>
              <p className="text-[11px] tracking-[0.05em] text-white/40 uppercase mb-4">
                {project.role} · {project.period}
              </p>
              <p className="text-sm text-white/50 leading-relaxed mb-5">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {project.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] tracking-[0.08em] uppercase px-2 py-1 rounded border border-white/[0.08] text-white/40"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-white/40 group-hover:text-white/70 transition-colors">
                Смотреть кейс
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
              </span>
            </div>
          </div>
        </motion.article>
      </Link>
    );
  }

  return (
    <Link href={`/cases/${project.slug}`} className="no-underline group h-full">
      <motion.article
        whileHover={{ y: -6 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative border border-white/[0.06] group-hover:border-white/15 rounded-xl overflow-hidden bg-[#0a0a0a] h-full transition-colors duration-300"
      >
        {/* Cover area */}
        <div
          className="h-40 md:h-48 relative overflow-hidden"
          style={{ background: project.coverColor }}
        >
          {project.coverImage && (
            project.coverImage.endsWith('.svg') ? (
              // SVG covers render at full opacity — they have their own bg
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.coverImage}
                alt={project.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <Image
                src={project.coverImage}
                alt={project.title}
                fill
                className="object-cover opacity-40 group-hover:opacity-55 group-hover:scale-105 transition-all duration-500"
              />
            )
          )}

          {/* Index badge */}
          <div className="absolute top-4 left-4 text-[9px] tracking-[0.15em] uppercase text-white/30 font-mono">
            {String(index + 1).padStart(2, "0")}
          </div>

          {/* Result badges — top-right row */}
          {project.results && project.results.length > 0 && (
            <div className="absolute top-4 right-14 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {project.results.slice(0, 2).map((r) => (
                <span
                  key={r.label}
                  className="text-[8px] tracking-[0.05em] uppercase px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-white/70 border border-white/[0.08] whitespace-nowrap"
                >
                  {r.value} {r.label}
                </span>
              ))}
            </div>
          )}

          {/* External arrow */}
          <div className="absolute top-4 right-4 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300">
            <ArrowUpRight className="w-3.5 h-3.5 text-white/70" strokeWidth={2} />
          </div>

          {/* Company */}
          <div className="absolute bottom-4 left-4 text-[10px] tracking-[0.1em] uppercase text-white/40">
            {project.company}
          </div>

          {/* Metric */}
          {project.metric && (
            <div className="absolute bottom-4 right-4 text-right">
              <div className="text-2xl md:text-3xl font-semibold text-white leading-none">
                {project.metric}
              </div>
              <div className="text-[8px] tracking-[0.1em] uppercase text-white/30 mt-1">
                {project.metricLabel}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 md:p-6">
          <h3 className="text-base md:text-lg font-medium text-white mb-1">
            {project.title}
          </h3>
          <p className="text-[11px] tracking-[0.05em] text-white/50 uppercase mb-3">
            {project.role} · {project.period}
          </p>
          <p className="text-sm text-white/50 leading-relaxed line-clamp-3">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {project.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[9px] tracking-[0.08em] uppercase px-2 py-1 rounded border border-white/[0.08] text-white/40"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

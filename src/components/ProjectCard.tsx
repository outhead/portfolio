"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  return (
    <Link href={`/cases/${project.slug}`} className="no-underline group h-full">
      <motion.article
        whileHover={{ y: -6 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative border border-white/[0.06] group-hover:border-[#A6FF00]/30 rounded-xl overflow-hidden bg-[#0a0a0a] h-full transition-colors duration-300"
      >
        {/* Cover area */}
        <div
          className="h-40 md:h-48 relative overflow-hidden"
          style={{ background: project.coverColor }}
        >
          {project.coverImage && (
            <Image
              src={project.coverImage}
              alt={project.title}
              fill
              className="object-cover opacity-40 group-hover:opacity-55 group-hover:scale-105 transition-all duration-500"
            />
          )}
          {/* accent glow on hover */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-[#A6FF00]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Index badge */}
          <div className="absolute top-4 left-4 text-[9px] tracking-[0.15em] uppercase text-white/30 font-mono">
            {String(index + 1).padStart(2, "0")}
          </div>

          {/* External arrow */}
          <div className="absolute top-4 right-4 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300">
            <ArrowUpRight className="w-3.5 h-3.5 text-[#A6FF00]" strokeWidth={2} />
          </div>

          {/* Company */}
          <div className="absolute bottom-4 left-4 text-[10px] tracking-[0.1em] uppercase text-white/40">
            {project.company}
          </div>

          {/* Metric */}
          {project.metric && (
            <div className="absolute bottom-4 right-4 text-right">
              <div className="text-2xl md:text-3xl font-semibold text-white leading-none group-hover:text-[#A6FF00] transition-colors">
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
          <p className="text-[11px] tracking-[0.05em] text-white/60 uppercase mb-3">
            {project.role} · {project.period}
          </p>
          <p className="text-sm text-white/55 leading-relaxed line-clamp-3">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {project.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[9px] tracking-[0.08em] uppercase px-2 py-1 rounded border border-white/[0.1] text-white/55"
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

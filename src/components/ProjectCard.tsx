"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Project } from "@/data/projects";

/** Фон карточки: видео-обложка > картинка-обложка > просто coverColor. */
function CoverMedia({ project }: { project: Project }) {
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
        className="absolute inset-0 w-full h-full object-cover opacity-60 z-0"
        aria-hidden="true"
      />
    );
  }
  if (project.coverImage) {
    return (
      <Image
        src={project.coverImage}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover opacity-50 z-0"
      />
    );
  }
  return null;
}

interface ProjectCardProps {
  project: Project;
  /** index больше не отображается — оставлен в пропсах для совместимости с page.tsx */
  index?: number;
  /** Крупная карточка (featured). */
  featured?: boolean;
  /** Широкая 2×1-карточка, разбивающая ритм сетки. */
  wide?: boolean;
}

/** Маленький chip — stokt-style pill под title. */
function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-white/15 bg-white/[0.04] text-[11px] md:text-[12px] tracking-[0.04em] text-white/80 leading-none backdrop-blur-sm">
      {children}
    </span>
  );
}

/** Metric chip — компактный акцент с цифрой (если есть). */
function MetricChip({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5 px-2.5 py-1 rounded-full bg-[#A6FF00]/10 border border-[#A6FF00]/25 text-[#A6FF00] leading-none">
      <span className="font-p95 text-[13px] md:text-[14px] tracking-tight">{value}</span>
      {label && (
        <span className="text-[10px] md:text-[11px] tracking-[0.08em] uppercase text-[#A6FF00]/75">
          {label}
        </span>
      )}
    </span>
  );
}

export default function ProjectCard({
  project,
  featured = false,
  wide = false,
}: ProjectCardProps) {
  // Hover-arrow в top-right (как у Stokt)
  const HoverArrow = (
    <div className="absolute top-4 right-4 md:top-5 md:right-5 w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/20 flex items-center justify-center bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 z-[2]">
      <ArrowUpRight className="w-4 h-4 text-white/90" strokeWidth={2} />
    </div>
  );

  // Bottom-content: company bracket-label, title, tag-chips + metric
  const BottomContent = (
    <div
      className={`absolute bottom-0 left-0 right-0 flex flex-col gap-3 md:gap-4 z-[2] ${
        featured ? "p-6 md:p-8 lg:p-10" : wide ? "p-6 md:p-8" : "p-5 md:p-6"
      }`}
    >
      <div className="font-p95 text-[11px] md:text-[12px] tracking-[0.2em] uppercase text-white/55">
        {project.company}
      </div>
      <h3
        className={`font-p95 uppercase leading-[0.95] text-white ${
          featured
            ? "text-[clamp(28px,3.4vw,48px)] max-w-2xl"
            : wide
              ? "text-[clamp(24px,2.8vw,40px)] max-w-xl"
              : "text-[clamp(22px,2.4vw,32px)] max-w-[90%]"
        }`}
      >
        {project.title}
      </h3>

      <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5">
        {project.metric && (
          <MetricChip value={project.metric} label={project.metricLabel} />
        )}
        {project.tags.slice(0, featured ? 4 : wide ? 3 : 2).map((t) => (
          <TagChip key={t}>{t}</TagChip>
        ))}
      </div>
    </div>
  );

  // Subtle bottom floor — достаточный для читаемости без пересвета
  const GradientFloor = (
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none z-[1]" />
  );

  // === FEATURED — крупная hero-карточка (2×2 в сетке) ===
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
            <CoverMedia project={project} />
            {GradientFloor}
            {HoverArrow}
            {BottomContent}
          </div>
        </motion.article>
      </Link>
    );
  }

  // === WIDE — 2×1 акцент-карта ===
  if (wide) {
    return (
      <Link href={`/cases/${project.slug}`} className="no-underline group h-full block">
        <motion.article
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/[0.06] group-hover:border-white/20 transition-colors duration-300 h-full"
        >
          <div
            className="relative h-full min-h-[280px] md:min-h-[360px] overflow-hidden"
            style={{ background: project.coverColor }}
          >
            <CoverMedia project={project} />
            {GradientFloor}
            {HoverArrow}
            {BottomContent}
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
          className="relative h-full min-h-[240px] md:min-h-[320px] overflow-hidden"
          style={{ background: project.coverColor }}
        >
          <CoverMedia project={project} />
          {GradientFloor}
          {HoverArrow}
          {BottomContent}
        </div>
      </motion.article>
    </Link>
  );
}

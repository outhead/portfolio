import Link from "next/link";
import Image from "next/image";
import { Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  return (
    <Link href={`/cases/${project.slug}`} className="no-underline group">
      <article
        className="case-card card-shine relative border border-white/[0.06] rounded-lg overflow-hidden bg-[#0a0a0a] h-full"
        style={{ animationDelay: `${index * 0.1}s` }}
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
              className="object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
            />
          )}
          {/* Index badge */}
          <div className="absolute top-4 left-4 text-[9px] tracking-[0.15em] uppercase text-white/20 font-mono">
            {String(index + 1).padStart(2, "0")}
          </div>

          {/* Company */}
          <div className="absolute bottom-4 left-4 text-[10px] tracking-[0.1em] uppercase text-white/30">
            {project.company}
          </div>

          {/* Metric */}
          {project.metric && (
            <div className="absolute bottom-4 right-4 text-right">
              <div className="text-2xl md:text-3xl font-semibold gradient-text leading-none">
                {project.metric}
              </div>
              <div className="text-[8px] tracking-[0.1em] uppercase text-white/20 mt-1">
                {project.metricLabel}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 md:p-6">
          <h3 className="text-base md:text-lg font-medium text-white mb-1 group-hover:text-white/90 transition-colors">
            {project.title}
          </h3>
          <p className="text-[11px] tracking-[0.05em] text-white/30 uppercase mb-3">
            {project.role} · {project.period}
          </p>
          <p className="text-sm text-white/50 leading-relaxed line-clamp-3">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {project.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[9px] tracking-[0.08em] uppercase px-2 py-1 rounded border border-white/[0.06] text-white/20"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </article>
    </Link>
  );
}

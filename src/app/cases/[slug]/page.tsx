import { projects, getProjectBySlug } from "@/data/projects";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};

  return {
    title: `${project.title} — Егор Шугаев`,
    description: project.description,
    openGraph: {
      title: `${project.title} — Егор Шугаев`,
      description: project.description,
      type: "article",
    },
  };
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      {/* Hero */}
      <section
        className="relative min-h-[60vh] flex items-end overflow-hidden"
        style={{ background: project.coverColor }}
      >
        {project.coverImage && (
          <div className="absolute inset-0 z-0">
            <Image
              src={project.coverImage}
              alt={project.title}
              fill
              className="object-cover opacity-30"
              priority
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        <div className="relative z-[5] px-5 md:px-10 pb-10 md:pb-16 w-full max-w-5xl">
          {/* Breadcrumb */}
          <Link
            href="/#portfolio"
            className="inline-flex items-center gap-2 text-[10px] tracking-[0.12em] uppercase text-white/20 no-underline hover:text-white/50 transition-colors mb-8"
          >
            <span>←</span>
            <span>Все проекты</span>
          </Link>

          <div className="section-label mb-2">{project.company}</div>
          <h1 className="font-p95 text-[clamp(32px,6vw,72px)] uppercase leading-[0.95] mb-4">
            {project.title}
          </h1>
          <p className="text-sm tracking-[0.05em] text-white/30 uppercase mb-6">
            {project.role} · {project.period}
          </p>

          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] tracking-[0.08em] uppercase px-2.5 py-1 rounded border border-white/[0.08] text-white/25"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Metric */}
          {project.metric && (
            <div className="absolute bottom-10 right-5 md:right-10 text-right">
              <div className="text-4xl md:text-6xl font-semibold gradient-text leading-none">
                {project.metric}
              </div>
              <div className="text-[9px] tracking-[0.1em] uppercase text-white/20 mt-1">
                {project.metricLabel}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="relative z-[1] px-5 md:px-10 py-16 md:py-24 bg-black/75 border-t border-white/[0.04]">
        <div className="max-w-3xl">
          <p className="text-white/60 leading-relaxed text-base md:text-lg mb-12">
            {project.longDescription}
          </p>

          {/* Sections */}
          {project.sections?.map((section, i) => (
            <div key={i} className="mb-10 md:mb-14">
              <div className="section-label mb-3">
                {String(i + 1).padStart(2, "0")} — {section.title}
              </div>
              <p className="text-white/50 leading-relaxed text-sm md:text-base">
                {section.content}
              </p>
            </div>
          ))}

          {/* Screenshots */}
          {project.screenshots && project.screenshots.length > 0 && (
            <div className="mt-16 mb-12">
              <div className="section-label mb-6">Скриншоты</div>
              <div className="grid md:grid-cols-2 gap-4">
                {project.screenshots.map((src, n) => (
                  <div
                    key={n}
                    className="relative aspect-video rounded-lg border border-white/[0.06] overflow-hidden group"
                  >
                    <Image
                      src={src}
                      alt={`${project.title} — скриншот ${n + 1}`}
                      fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Navigation */}
      <section className="relative z-[1] px-5 md:px-10 py-12 bg-black/75 border-t border-white/[0.04]">
        <div className="flex justify-between items-center max-w-3xl">
          <Link
            href="/#portfolio"
            className="text-[11px] tracking-[0.1em] uppercase text-white/30 no-underline hover:text-white/60 transition-colors"
          >
            ← Все проекты
          </Link>
          <Link
            href="/#mentoring"
            className="text-[11px] tracking-[0.1em] uppercase text-white/30 no-underline hover:text-white/60 transition-colors"
          >
            Менторинг →
          </Link>
        </div>
      </section>
    </>
  );
}

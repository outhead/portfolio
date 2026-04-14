import { projects, getProjectBySlug } from "@/data/projects";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";

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

function getAdjacentProjects(slug: string) {
  const idx = projects.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0 ? projects[idx - 1] : null,
    next: idx < projects.length - 1 ? projects[idx + 1] : null,
  };
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const { prev, next } = getAdjacentProjects(slug);

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

        <div className="relative z-[5] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] pb-10 md:pb-16 w-full">
          {/* Breadcrumb */}
          <Link
            href="/#portfolio"
            className="inline-flex items-center gap-2 text-[10px] tracking-[0.12em] uppercase text-white/30 no-underline hover:text-white/60 transition-colors mb-8"
          >
            <ArrowLeft className="w-3 h-3" strokeWidth={2} />
            <span>Все проекты</span>
          </Link>

          <div className="text-[10px] tracking-[0.12em] uppercase text-white/30 mb-2">{project.company}</div>
          <h1 className="font-p95 text-[clamp(32px,6vw,72px)] uppercase leading-[0.95] mb-4">
            {project.title}
          </h1>
          <p className="text-[11px] tracking-[0.05em] text-white/40 uppercase mb-6">
            {project.role} · {project.period}
          </p>

          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] tracking-[0.08em] uppercase px-2.5 py-1 rounded border border-white/[0.08] text-white/30"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Metric */}
          {project.metric && (
            <div className="absolute bottom-10 right-5 md:right-[6%] lg:right-[10%] xl:right-[14%] text-right">
              <div className="text-4xl md:text-6xl font-semibold text-white/80 leading-none">
                {project.metric}
              </div>
              <div className="text-[9px] tracking-[0.1em] uppercase text-white/25 mt-1">
                {project.metricLabel}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Results bar */}
      {project.results && project.results.length > 0 && (
        <section className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] bg-black border-t border-white/[0.06]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.04] rounded-lg overflow-hidden my-0">
            {project.results.map((r) => (
              <div key={r.label} className="bg-black p-5 md:p-6 text-center">
                <div className="text-xl md:text-2xl font-semibold text-white leading-none mb-1">
                  {r.value}
                </div>
                <div className="text-[9px] md:text-[10px] tracking-[0.1em] uppercase text-white/35">
                  {r.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Content */}
      <section className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-16 md:py-24 bg-black border-t border-white/[0.06]">
        <div className="max-w-3xl">
          <p className="text-white/60 leading-relaxed text-base md:text-lg mb-12">
            {project.longDescription}
          </p>

          {/* Sections */}
          {project.sections?.map((section, i) => (
            <div key={i} className="mb-10 md:mb-14">
              <div className="text-[10px] tracking-[0.12em] uppercase text-white/30 mb-3">
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
              <div className="text-[10px] tracking-[0.12em] uppercase text-white/30 mb-6">Скриншоты</div>
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

      {/* Next / Prev navigation */}
      <section className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] bg-black border-t border-white/[0.06]">
        <div className="grid grid-cols-2 gap-px">
          {prev ? (
            <Link
              href={`/cases/${prev.slug}`}
              className="group py-8 md:py-12 pr-4 no-underline"
            >
              <div className="text-[9px] tracking-[0.12em] uppercase text-white/25 mb-2 flex items-center gap-1.5">
                <ArrowLeft className="w-3 h-3" strokeWidth={2} />
                Предыдущий
              </div>
              <div className="text-sm md:text-base text-white/50 group-hover:text-white/80 transition-colors">
                {prev.title}
              </div>
              <div className="text-[10px] text-white/20 mt-0.5">{prev.company}</div>
            </Link>
          ) : (
            <Link
              href="/#portfolio"
              className="group py-8 md:py-12 pr-4 no-underline"
            >
              <div className="text-[9px] tracking-[0.12em] uppercase text-white/25 mb-2 flex items-center gap-1.5">
                <ArrowLeft className="w-3 h-3" strokeWidth={2} />
                Назад
              </div>
              <div className="text-sm md:text-base text-white/50 group-hover:text-white/80 transition-colors">
                Все проекты
              </div>
            </Link>
          )}

          {next ? (
            <Link
              href={`/cases/${next.slug}`}
              className="group py-8 md:py-12 pl-4 text-right border-l border-white/[0.06] no-underline"
            >
              <div className="text-[9px] tracking-[0.12em] uppercase text-white/25 mb-2 flex items-center gap-1.5 justify-end">
                Следующий
                <ArrowRight className="w-3 h-3" strokeWidth={2} />
              </div>
              <div className="text-sm md:text-base text-white/50 group-hover:text-white/80 transition-colors">
                {next.title}
              </div>
              <div className="text-[10px] text-white/20 mt-0.5">{next.company}</div>
            </Link>
          ) : (
            <Link
              href="/#portfolio"
              className="group py-8 md:py-12 pl-4 text-right border-l border-white/[0.06] no-underline"
            >
              <div className="text-[9px] tracking-[0.12em] uppercase text-white/25 mb-2 flex items-center gap-1.5 justify-end">
                Назад
                <ArrowRight className="w-3 h-3" strokeWidth={2} />
              </div>
              <div className="text-sm md:text-base text-white/50 group-hover:text-white/80 transition-colors">
                Все проекты
              </div>
            </Link>
          )}
        </div>
      </section>
    </>
  );
}

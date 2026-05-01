import { projects, getProjectBySlug } from "@/data/projects";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import ImageLightbox from "@/components/ImageLightbox";

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
        {(project.coverImage || project.coverVideo) && (
          <div className="absolute inset-0 z-0">
            {project.coverVideo ? (
              <video
                src={project.coverVideo}
                poster={project.coverImage}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
            ) : (
              <Image
                src={project.coverImage!}
                alt={project.title}
                fill
                className="object-cover opacity-30"
                priority
              />
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        <div className="relative z-[5] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] pb-10 md:pb-16 w-full animate-fade-in-up">
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
          <p className="text-[11px] tracking-[0.05em] text-white/40 uppercase">
            {project.role} · {project.period}
          </p>

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
          {(() => {
            const len = project.results.length;
            // 3 → 1 row of 3, 4 → 1 row of 4, 6 → 2 rows of 3, иначе → 4 в ряд
            const colsClass =
              len === 3
                ? "md:grid-cols-3"
                : len === 6
                ? "md:grid-cols-3"
                : "md:grid-cols-4";
            return (
              <div className={`grid grid-cols-2 ${colsClass} gap-px bg-white/[0.04] rounded-lg overflow-hidden my-0`}>
                {project.results!.map((r) => (
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
            );
          })()}
        </section>
      )}

      {/* Content */}
      <section className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-16 md:py-24 bg-black border-t border-white/[0.06]">
        <div className="max-w-4xl">
          {(() => {
            const longProseClass =
              "text-white/60 leading-relaxed text-base md:text-lg max-w-3xl";
            const renderInlineLong = (text: string) => {
              const parts = text.split(/(\*\*[^*]+\*\*)/g);
              return parts.map((part, idx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return (
                    <strong key={idx} className="text-white/85 font-semibold">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return <span key={idx}>{part}</span>;
              });
            };
            const paragraphs = project.longDescription
              .split(/\n\n+/)
              .map((p) => p.trim())
              .filter(Boolean);
            return (
              <div className="mb-12 space-y-4">
                {paragraphs.map((para, idx) => (
                  <p key={idx} className={longProseClass}>
                    {renderInlineLong(para)}
                  </p>
                ))}
              </div>
            );
          })()}

          {/* Sections — структурный формат (context/approach/result) с fallback на старый content */}
          {project.sections?.map((section, i) => {
            const hasSectionScreenshots = section.screenshots && section.screenshots.length > 0;
            const hasStructured =
              section.context || section.approach || section.helped || section.result;
            const labelClass =
              "text-[9px] tracking-[0.14em] uppercase text-white/40 mb-2";
            const proseClass =
              "text-white/65 leading-relaxed text-sm md:text-base";

            /** Inline-форматирование: **жирное** превращается в <strong>. */
            const renderInline = (text: string) => {
              const parts = text.split(/(\*\*[^*]+\*\*)/g);
              return parts.map((part, idx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return (
                    <strong key={idx} className="text-white/90 font-semibold">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return <span key={idx}>{part}</span>;
              });
            };

            /** Поддержка многоабзацного текста: '\n\n' → отдельные <p>. */
            const renderProse = (text: string) => {
              const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
              if (paragraphs.length <= 1) {
                return <p className={proseClass}>{renderInline(paragraphs[0] ?? text)}</p>;
              }
              return (
                <div className="space-y-3">
                  {paragraphs.map((para, idx) => (
                    <p key={idx} className={proseClass}>
                      {renderInline(para)}
                    </p>
                  ))}
                </div>
              );
            };

            return (
              <div key={i} className="mb-16 md:mb-24">
                {/* Section header: large number + title */}
                <div className="flex items-baseline gap-4 mb-6">
                  <span className="text-[11px] tracking-[0.14em] uppercase text-white/25 font-mono">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-xl md:text-2xl text-white/95 font-semibold leading-tight">
                    {section.title}
                  </h3>
                </div>

                {/* Structured blocks */}
                {hasStructured ? (
                  <div className="space-y-6 max-w-3xl">
                    {section.context && (
                      <div>
                        <div className={labelClass}>Задача</div>
                        {renderProse(section.context)}
                      </div>
                    )}
                    {section.approach && (
                      <div>
                        <div className={labelClass}>Подход</div>
                        {renderProse(section.approach)}
                      </div>
                    )}
                    {section.helped && (
                      <div className="border-l-2 border-[#A6FF00]/30 pl-4">
                        <div className={labelClass}>Что способствовало</div>
                        {renderProse(section.helped)}
                      </div>
                    )}
                    {section.result && (
                      <div>
                        <div className={labelClass}>Результат</div>
                        {renderProse(section.result)}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Legacy fallback */
                  section.content && (
                    <div className="max-w-3xl">{renderProse(section.content)}</div>
                  )
                )}

                {/* Callouts — мини-сетка цифр */}
                {section.callouts && section.callouts.length > 0 && (
                  <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.04] rounded-md overflow-hidden">
                    {section.callouts.map((c) => (
                      <div
                        key={c.label}
                        className="bg-black p-4 md:p-5 text-center"
                      >
                        <div className="text-base md:text-xl font-semibold text-white leading-none mb-1">
                          {c.value}
                        </div>
                        <div className="text-[8px] md:text-[9px] tracking-[0.12em] uppercase text-white/35 leading-tight">
                          {c.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline links — пруфы рядом с релевантным текстом */}
                {section.links && section.links.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {section.links.map((link) => {
                      let domain = "";
                      try {
                        domain = new URL(link.url).hostname.replace(/^www\./, "");
                      } catch {}
                      return (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-2 px-3 py-2 rounded-md border border-white/[0.08] hover:border-[#A6FF00]/40 hover:bg-white/[0.02] transition-colors no-underline max-w-full"
                        >
                          <ExternalLink
                            className="w-3 h-3 flex-shrink-0 text-white/30 group-hover:text-[#A6FF00] transition-colors"
                            strokeWidth={2}
                          />
                          <span className="text-[9px] tracking-[0.1em] uppercase text-white/40 group-hover:text-white/60 transition-colors">
                            {domain}
                          </span>
                          <span className="text-[12px] text-white/55 group-hover:text-white/85 transition-colors truncate">
                            {link.label}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                )}

                {/* Screenshots */}
                {hasSectionScreenshots && (
                  <div className="mt-7">
                    <ImageLightbox
                      images={section.screenshots!.map((src, n) => ({
                        src,
                        alt: `${project.title} — ${section.title} — ${n + 1}`,
                      }))}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Fallback: top-level screenshots for projects without section-level ones */}
          {project.screenshots && project.screenshots.length > 0 &&
            !project.sections?.some((s) => s.screenshots && s.screenshots.length > 0) && (
            <div className="mt-16 mb-12">
              <div className="text-[10px] tracking-[0.12em] uppercase text-white/30 mb-6">Скриншоты</div>
              <ImageLightbox
                images={project.screenshots.map((src, n) => ({
                  src,
                  alt: `${project.title} — скриншот ${n + 1}`,
                }))}
              />
            </div>
          )}

          {/* External Links — grouped by category, rendered as card grid */}
          {project.links && project.links.length > 0 && (() => {
            const groups = project.links.reduce<Record<string, NonNullable<typeof project.links>>>((acc, link) => {
              const cat = link.category || "Ссылки";
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(link);
              return acc;
            }, {});
            const order = [
              "Награда",
              "Дизайн-система Consta",
              "Пресса и интервью",
              "Партнёрства и артефакты",
              "Ссылки",
            ];
            const sortedGroups = Object.entries(groups).sort((a, b) => {
              const ai = order.indexOf(a[0]);
              const bi = order.indexOf(b[0]);
              return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
            });
            return (
              <div className="mt-16 mb-8">
                <div className="text-[10px] tracking-[0.12em] uppercase text-white/30 mb-6">Пруфы и ссылки</div>
                <div className="flex flex-col gap-8">
                  {sortedGroups.map(([cat, items]) => (
                    <div key={cat}>
                      <div className="text-[9px] tracking-[0.12em] uppercase text-white/40 mb-3">{cat}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {items.map((link) => {
                          let domain = "";
                          try {
                            domain = new URL(link.url).hostname.replace(/^www\./, "");
                          } catch {}
                          return (
                            <a
                              key={link.url}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-start gap-3 p-4 rounded-md border border-white/[0.08] hover:border-[#A6FF00]/40 hover:bg-white/[0.02] transition-colors no-underline"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-[9px] tracking-[0.05em] text-white/30 mb-1.5 truncate uppercase">
                                  {domain}
                                </div>
                                <div className="text-sm text-white/70 group-hover:text-white transition-colors leading-snug">
                                  {link.label}
                                </div>
                              </div>
                              <ExternalLink
                                className="w-3.5 h-3.5 flex-shrink-0 text-white/25 group-hover:text-[#A6FF00] transition-colors mt-0.5"
                                strokeWidth={2}
                              />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
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

import { projects, getProjectBySlug } from "@/data/projects";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import ImageLightbox from "@/components/ImageLightbox";
import { HeroCoverVideo } from "@/components/CoverVideo";
import CaseLinkCard from "@/components/CaseLinkCard";
import HeroLightbox from "@/components/HeroLightbox";
import PressCollapse from "@/components/PressCollapse";

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
        {(project.heroImage || project.coverImage || project.coverVideo) && (
          <div className="absolute inset-0 z-0">
            {project.heroImage ? (
              <Image
                src={project.heroImage}
                alt={project.title}
                fill
                className="object-cover opacity-55"
                priority
                sizes="100vw"
              />
            ) : project.coverVideo ? (
              <HeroCoverVideo
                src={project.coverVideo}
                poster={project.coverImage}
                pauseAt={project.coverVideoPauseAt}
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
            ) : (
              <Image
                src={project.coverImage!}
                alt={project.title}
                fill
                className="object-cover opacity-50"
                priority
              />
            )}
          </div>
        )}
        {/* Градиент уравновешивает контраст под текст hero, но не должен забивать обложку */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />

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
        <div className="lg:flex lg:gap-x-12 xl:gap-x-16">
        <div className="max-w-4xl flex-1 min-w-0">
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
              <div key={i} id={`section-${i + 1}`} className="mb-16 md:mb-24 scroll-mt-24">
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

                {/* Timeline — горизонтальная шкала событий.
                    Если ≤4 точек — равномерный grid на десктопе.
                    Если >4 — всегда flex со скроллом и фикс-шириной ячейки, чтобы текст не сжимался. */}
                {section.timeline && section.timeline.length > 0 && (
                  <div className="mt-7 -mx-5 md:mx-0 px-5 md:px-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                    {section.timeline.length > 4 ? (
                      <ol className="relative flex gap-0 min-w-max">
                        <div className="absolute left-0 right-0 top-[18px] h-px bg-white/[0.08]" aria-hidden />
                        {section.timeline.map((t, idx) => (
                          <li key={idx} className="relative flex flex-col gap-2 pr-8 w-[220px] md:w-[240px] shrink-0">
                            <div className="relative z-[1] w-[9px] h-[9px] rounded-full bg-[#A6FF00] ring-4 ring-black mt-[14px]" />
                            <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-white/45 mt-1">
                              {t.date}
                            </div>
                            <div className="text-sm md:text-[15px] text-white/90 font-medium leading-snug">
                              {t.title}
                            </div>
                            {t.note && (
                              <div className="text-[12px] text-white/50 leading-snug">{t.note}</div>
                            )}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <ol
                        className="relative flex gap-0 min-w-max md:min-w-0 md:grid"
                        style={{ gridTemplateColumns: `repeat(${section.timeline.length}, minmax(0, 1fr))` }}
                      >
                        <div className="absolute left-0 right-0 top-[18px] h-px bg-white/[0.08]" aria-hidden />
                        {section.timeline.map((t, idx) => (
                          <li key={idx} className="relative flex flex-col gap-2 pr-6 md:pr-4 w-[260px] md:w-auto">
                            <div className="relative z-[1] w-[9px] h-[9px] rounded-full bg-[#A6FF00] ring-4 ring-black mt-[14px]" />
                            <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-white/45 mt-1">
                              {t.date}
                            </div>
                            <div className="text-sm md:text-[15px] text-white/90 font-medium leading-snug">
                              {t.title}
                            </div>
                            {t.note && (
                              <div className="text-[12px] text-white/50 leading-snug">{t.note}</div>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                    {section.timeline.length > 4 && (
                      <div className="text-[10px] tracking-[0.14em] uppercase text-white/30 mt-3">
                        ← листайте, чтобы увидеть все запуски →
                      </div>
                    )}
                  </div>
                )}

                {/* Callouts — мини-сетка цифр.
                    Колонки подстраиваются под количество элементов, чтобы не было «пустой» 4-й плитки.
                    На мобилке всегда 2 колонки, на десктопе — ровно по числу callouts (max 4). */}
                {section.callouts && section.callouts.length > 0 && (
                  <div
                    className={`mt-7 grid grid-cols-2 gap-px bg-white/[0.04] rounded-md overflow-hidden ${
                      section.callouts.length === 1
                        ? "md:grid-cols-1"
                        : section.callouts.length === 2
                        ? "md:grid-cols-2"
                        : section.callouts.length === 3
                        ? "md:grid-cols-3"
                        : "md:grid-cols-4"
                    }`}
                  >
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

                {/* Heroes — широкие плакаты без рамки телефона. Кликабельные для увеличения. */}
                {section.heroes && section.heroes.length > 0 && (
                  <div className="mt-10 md:mt-14">
                    <HeroLightbox
                      heroes={section.heroes}
                      label={`Постеры · ${section.heroes.length}`}
                    />
                  </div>
                )}

                {/* Разделитель между постерами и скриншотами в рамке */}
                {section.heroes && section.heroes.length > 0 && hasSectionScreenshots && (
                  <div className="mt-10 md:mt-14 text-[10px] tracking-[0.18em] uppercase text-white/40">
                    Скриншоты в интерфейсе
                  </div>
                )}

                {/* Screenshots */}
                {hasSectionScreenshots && (
                  <div className="mt-7">
                    <ImageLightbox
                      mode={section.screenshotsMode ?? project.screenshotsMode ?? "web"}
                      images={section.screenshots!.map((shot, n) => {
                        const src = typeof shot === "string" ? shot : shot.src;
                        const label = typeof shot === "string" ? undefined : shot.label;
                        const caption = typeof shot === "string" ? undefined : shot.caption;
                        const isProtected = typeof shot === "string" ? false : !!shot.protected;
                        const kind = typeof shot === "string" ? undefined : shot.kind;
                        const poster = typeof shot === "string" ? undefined : shot.poster;
                        const alt =
                          (typeof shot === "string" ? undefined : shot.alt) ??
                          `${project.title} — ${section.title} — ${n + 1}`;
                        return { src, alt, label, caption, protected: isProtected, kind, poster };
                      })}
                    />
                  </div>
                )}

                {/* Inline links — В КОНЦЕ секции, свёрнуты в кликабельный таб
                    «Пресса и публикации · N» с иконкой газеты. */}
                {section.links && section.links.length > 0 && (
                  <PressCollapse links={section.links} />
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
                mode={project.screenshotsMode ?? "web"}
                images={project.screenshots.map((shot, n) => {
                  const src = typeof shot === "string" ? shot : shot.src;
                  const label = typeof shot === "string" ? undefined : shot.label;
                  const caption = typeof shot === "string" ? undefined : shot.caption;
                  const isProtected = typeof shot === "string" ? false : !!shot.protected;
                  const kind = typeof shot === "string" ? undefined : shot.kind;
                  const poster = typeof shot === "string" ? undefined : shot.poster;
                  const alt =
                    (typeof shot === "string" ? undefined : shot.alt) ??
                    `${project.title} — скриншот ${n + 1}`;
                  return { src, alt, label, caption, protected: isProtected, kind, poster };
                })}
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
              "Выступления и интервью",
              "Дизайн-система Consta",
              "Пресса",
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
                        {items.map((link) => (
                          <CaseLinkCard key={link.url} link={link} size="md" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Sticky TOC — навигация по секциям. Видна только на lg+. */}
        {project.sections && project.sections.length > 1 && (
          <aside className="hidden lg:block w-44 xl:w-48 flex-shrink-0">
            <div className="sticky top-24">
              <div className="text-[9px] tracking-[0.14em] uppercase text-white/30 mb-3">Содержание</div>
              <ul className="space-y-2.5">
                {project.sections.map((s, i) => (
                  <li key={i}>
                    <a
                      href={`#section-${i + 1}`}
                      className="group flex items-baseline gap-2 text-[11px] text-white/40 hover:text-white/85 transition-colors no-underline"
                    >
                      <span className="font-mono text-[10px] text-white/25 group-hover:text-white/60 flex-shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="leading-snug">{s.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
        </div>
      </section>

      {/* CTA — связаться */}
      <section className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-12 md:py-16 bg-black border-t border-white/[0.06]">
        <div className="max-w-3xl">
          <div className="text-[10px] tracking-[0.12em] uppercase text-white/30 mb-4">Открыт к офферам</div>
          <h3 className="font-p95 text-[clamp(24px,3vw,40px)] uppercase leading-[1] mb-6 text-white/90">
            Хочется поговорить про эту роль или просто познакомиться?
          </h3>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://t.me/egoradi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#A6FF00] text-black font-medium text-sm hover:bg-[#A6FF00]/85 transition-colors no-underline"
            >
              Написать в Telegram
            </a>
            <a
              href="mailto:egor.outhead@gmail.com"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-md border border-white/15 text-white/80 text-sm hover:border-white/40 hover:text-white transition-colors no-underline"
            >
              egor.outhead@gmail.com
            </a>
          </div>
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

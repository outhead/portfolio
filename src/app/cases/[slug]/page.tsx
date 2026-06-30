import { projects, getProjectBySlug } from "@/data/projects";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import ImageLightbox from "@/components/ImageLightbox";
import { HeroCoverVideo } from "@/components/CoverVideo";
import CaseLinkCard from "@/components/CaseLinkCard";
import HeroSlider from "@/components/HeroSlider";
import PressCollapse from "@/components/PressCollapse";
import WIPOverlay from "@/components/WIPOverlay";
import DecryptApproach from "@/components/DecryptApproach";
import LedText from "@/components/LedText";
import { LedLines } from "@/components/LedBoard";
import FontSpecimen from "@/components/FontSpecimen";
import ParticleStudio from "@/components/ParticleStudio";
import ParticlePortrait from "@/components/ParticlePortrait";
import PixelCube3D from "@/components/PixelCube3D";

/* Пиксельный лейбл секций кейса — единый язык с табло главной */
function CaseLabel({
  children,
  className = "mb-2",
  tone = "text-white/40",
}: {
  children: string;
  className?: string;
  tone?: string;
}) {
  return (
    <div className={`${tone} ${className}`}>
      <span className="sr-only">{children}</span>
      <LedText text={children} className="h-[9px] w-auto" />
    </div>
  );
}

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

  // Брендовый кейс → в hero вращается LED-куб со знаком вместо статичной обложки.
  const heroCube = !!(project.cubeColor && project.cubeLogo && !project.coverParticles);

  return (
    <>
      {/* WIP-оверлей: блюрит контент кейса и показывает плашку «дорабатывается» */}
      {project.wip ? <WIPOverlay /> : null}

      {/* Сам кейс. Если wip — блюрим и блокируем взаимодействие, чтобы оверлей был источник правды. */}
      <div className={project.wip ? "blur-md select-none pointer-events-none" : undefined} aria-hidden={project.wip ? true : undefined}>

      {/* Hero */}
      <section
        className="relative min-h-[60vh] flex items-end overflow-hidden"
        style={{ background: project.coverColor }}
      >
        {project.coverParticles && (
          <div className="absolute inset-0 z-0">
            <ParticlePortrait
              src={project.coverParticles.src}
              depthSrc={project.coverParticles.depth}
              count={7000}
              depthScale={project.coverParticles.depthScale ?? 0.6}
              pointScale={project.coverParticles.pointScale ?? 0.9}
              color={[255, 196, 84]}
              brightness={1.7}
              tilt={0.5}
              assembleOnHover={false}
              scatterOnHover
              className="absolute inset-0"
            />
          </div>
        )}
        {heroCube && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            <PixelCube3D
              color={project.cubeColor!}
              logoSrc={project.cubeLogo!}
              grid={34}
              mode="spin"
              idleGlow={0.82}
              panel
              cubeAlign="center"
              className="absolute inset-0 w-full h-full opacity-95 pointer-events-auto"
            />
          </div>
        )}
        {!heroCube && !project.coverParticles && (project.heroImage || project.coverImage || project.coverVideo) && (
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

        {/* Слоган LED-шрифтом по центру пустой зоны hero — для кейсов без куба/обложки */}
        {project.heroSlogan && !heroCube && !project.coverParticles && !project.heroImage && !project.coverImage && !project.coverVideo && (
          <div className="absolute inset-x-0 top-0 bottom-[34%] z-[4] flex items-center justify-center px-6 pointer-events-none animate-fade-in-up">
            <span className="sr-only">{project.heroSlogan}</span>
            <LedLines
              text={project.heroSlogan}
              center
              maxChars={28}
              lineClass="h-[12px] md:h-[16px]"
              className="text-[#A6FF00]/75 drop-shadow-[0_0_12px_rgba(166,255,0,0.45)]"
            />
          </div>
        )}

        <div className="relative z-[5] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] pb-10 md:pb-16 w-full animate-fade-in-up">
          {/* Breadcrumb */}
          <Link
            href="/#portfolio"
            className="inline-flex items-center gap-2 text-white/35 no-underline hover:text-white/65 transition-colors mb-8"
          >
            <LedText text="←" className="h-[11px] w-auto" />
            <span className="sr-only">Все проекты</span>
            <LedText text="Все проекты" className="h-[9px] w-auto" />
          </Link>

          <div className="text-white/35 mb-2">
            <span className="sr-only">{project.company}</span>
            <LedText text={project.company} className="h-[10px] w-auto" />
          </div>
          <h1 className="mb-5 text-white">
            <LedLines text={project.title} maxChars={32} lineClass="h-[18px] md:h-[30px]" />
          </h1>
          <p className="text-[16px] tracking-[0.05em] text-white/40 uppercase">
            {project.role} · {project.period}
          </p>

        </div>
      </section>

      {/* Results bar */}
      {project.results && project.results.length > 0 && (
        <section className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] bg-black border-t border-white/[0.06]">
          {(() => {
            const len = project.results.length;
            // 2 → 2 в ряд, 3 → 3, 4 → 4, 6 → 2 ряда по 3, иначе → 4 в ряд
            const colsClass =
              len === 2
                ? "grid-cols-2"
                : len === 3
                ? "grid-cols-1 md:grid-cols-3"
                : len === 6
                ? "grid-cols-2 md:grid-cols-3"
                : "grid-cols-2 md:grid-cols-4";
            return (
              <div className={`grid ${colsClass} gap-px bg-white/[0.04] rounded-lg overflow-hidden my-0`}>
                {project.results!.map((r) => (
                  <div key={r.label} className="bg-black p-5 md:p-6 flex flex-col items-center gap-2.5 min-w-0 w-full">
                    <span className="sr-only">{`${r.value} ${r.label}`}</span>
                    <LedText text={r.value} scale={2} dot={1.45} className="h-[28px] md:h-[40px] w-auto max-w-full text-white" />
                    <LedText text={r.label} className="h-[9px] md:h-[10px] w-auto max-w-full text-white/45" />
                  </div>
                ))}
              </div>
            );
          })()}
        </section>
      )}

      {/* Content */}
      <section className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] py-16 md:py-24 bg-black border-t border-white/[0.06]">
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
                  <span className="text-white/30">
                    <LedText text={String(i + 1).padStart(2, "0")} className="h-[10px] w-auto" />
                  </span>
                  <h3 className="text-xl md:text-2xl text-white/95 font-semibold leading-tight">
                    {section.title}
                  </h3>
                </div>

                {/* Heroes — слайдер с большим постером сразу под заголовком.
                    Соотношение сторон рамки совпадает с активным постером, object-contain — ничего не режется. */}
                {section.heroes && section.heroes.length > 0 && (
                  <div className="mb-8 md:mb-10">
                    <HeroSlider
                      heroes={section.heroes}
                      label={section.heroes.length > 1 ? `Постеры · ${section.heroes.length}` : undefined}
                    />
                  </div>
                )}

                {/* Текстовые блоки: задача + подход + что способствовало (без result — он переехал в конец) */}
                {hasStructured ? (
                  <div className="space-y-6 max-w-3xl">
                    {section.context && (
                      <div>
                        <CaseLabel>Задача</CaseLabel>
                        {renderProse(section.context)}
                      </div>
                    )}
                    {section.approach && (
                      <div>
                        <CaseLabel>Подход</CaseLabel>
                        {section.approachSimple ? (
                          <DecryptApproach
                            technical={section.approach}
                            simple={section.approachSimple}
                          />
                        ) : (
                          renderProse(section.approach)
                        )}
                      </div>
                    )}
                    {section.helped && (
                      <div className="border-l-2 border-[#A6FF00]/30 pl-4">
                        <CaseLabel>Что способствовало</CaseLabel>
                        {renderProse(section.helped)}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Legacy fallback */
                  section.content && (
                    <div className="max-w-3xl">{renderProse(section.content)}</div>
                  )
                )}

                {/* Интерактивный спесимен LED-шрифта (только led-font-engine) */}
                {section.specimen && <FontSpecimen />}
                {/* Встроенный конструктор частиц (particle-portrait) */}
                {section.studio && <div className="mt-8 md:mt-10"><ParticleStudio /></div>}

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
                            <div className="font-mono text-[12px] tracking-[0.1em] uppercase text-white/45 mt-1">
                              {t.date}
                            </div>
                            <div className="text-sm md:text-[16px] text-white/90 font-medium leading-snug">
                              {t.title}
                            </div>
                            {t.note && (
                              <div className="text-[16px] text-white/50 leading-snug">{t.note}</div>
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
                            <div className="font-mono text-[12px] tracking-[0.1em] uppercase text-white/45 mt-1">
                              {t.date}
                            </div>
                            <div className="text-sm md:text-[16px] text-white/90 font-medium leading-snug">
                              {t.title}
                            </div>
                            {t.note && (
                              <div className="text-[16px] text-white/50 leading-snug">{t.note}</div>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                    {section.timeline.length > 4 && (
                      <div className="text-[12px] tracking-[0.14em] uppercase text-white/30 mt-3">
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
                        className="bg-black p-5 md:p-7 text-center"
                      >
                        <span className="sr-only">{`${c.value} ${c.label}`}</span>
                        <div className="mb-2.5 flex justify-center">
                          <LedText text={c.value} scale={2} dot={1.45} className="h-[26px] md:h-[38px] w-auto text-white" />
                        </div>
                        <div className="flex justify-center text-white/45">
                          <LedText text={c.label} className="h-[9px] md:h-[10px] w-auto" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Video-блок во всю ширину + CTA «Попробовать самому» рядом */}
                {section.videoBlock && (
                  <div className={`mt-10 md:mt-12 ${section.videoBlock.narrow ? "max-w-2xl mx-auto" : ""}`}>
                    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-black">
                      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                      <video
                        src={section.videoBlock.src}
                        poster={section.videoBlock.poster}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="block w-full h-auto"
                        aria-label={section.videoBlock.alt ?? `${section.title} — видео`}
                      />
                    </div>
                    {section.videoBlock.cta && project.tryUrl && (
                      <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <a
                          href={project.tryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-md bg-[#A6FF00] text-black hover:bg-[#B8FF33] transition-colors no-underline shadow-[0_0_40px_-8px_rgba(166,255,0,0.5)]"
                        >
                          <span className="text-xl leading-none">▶</span>
                          <span className="sr-only">Попробовать</span>
                          <LedText text="Попробовать" className="h-[12px] w-auto" />
                        </a>
                        <p className="text-sm text-white/45 leading-relaxed max-w-sm">
                          Тот самый конструктор из видео — открой и покрути сам.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Screenshots — phone/web сетка интерфейсов после задачи и подхода */}
                {hasSectionScreenshots && (
                  <div className="mt-10 md:mt-12">
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

                {/* Результат — переехал из верхнего блока СЮДА: после скриншотов, перед прессой.
                    Идея: сначала задача и подход + визуал, потом — что получилось. */}
                {section.result && (
                  <div className="mt-10 md:mt-12 max-w-3xl">
                    <CaseLabel>Результат</CaseLabel>
                    {renderProse(section.result)}
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
              <CaseLabel className="mb-6" tone="text-white/35">Скриншоты</CaseLabel>
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
                <CaseLabel className="mb-6" tone="text-white/35">Пруфы и ссылки</CaseLabel>
                <div className="flex flex-col gap-8">
                  {sortedGroups.map(([cat, items]) => (
                    <div key={cat}>
                      <CaseLabel className="mb-3">{cat}</CaseLabel>
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
              <CaseLabel className="mb-3" tone="text-white/35">Содержание</CaseLabel>
              <ul className="space-y-2.5">
                {project.sections.map((s, i) => (
                  <li key={i}>
                    <a
                      href={`#section-${i + 1}`}
                      className="group flex items-baseline gap-2 text-[16px] text-white/40 hover:text-white/85 transition-colors no-underline"
                    >
                      <span className="font-mono text-[12px] text-white/25 group-hover:text-white/60 flex-shrink-0">
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
      <section className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] py-12 md:py-16 bg-black border-t border-white/[0.06]">
        <div className="max-w-3xl">
          <CaseLabel className="mb-4" tone="text-white/35">Открыт к офферам</CaseLabel>
          <h3 className="mb-7 text-white/90">
            <LedLines
              text="Хочется поговорить про эту роль или просто познакомиться?"
              maxChars={30}
              lineClass="h-[14px] md:h-[19px]"
            />
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
      <section className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] bg-black border-t border-white/[0.06]">
        <div className="grid grid-cols-2 gap-px">
          {prev ? (
            <Link
              href={`/cases/${prev.slug}`}
              className="group py-8 md:py-12 pr-4 no-underline"
            >
              <div className="text-white/30 mb-2 flex items-center gap-2">
                <LedText text="←" className="h-[10px] w-auto" />
                <span className="sr-only">Предыдущий</span>
                <LedText text="Предыдущий" className="h-[9px] w-auto" />
              </div>
              <div className="text-sm md:text-base text-white/50 group-hover:text-white/80 transition-colors">
                {prev.title}
              </div>
              <div className="text-[12px] text-white/20 mt-0.5">{prev.company}</div>
            </Link>
          ) : (
            <Link
              href="/#portfolio"
              className="group py-8 md:py-12 pr-4 no-underline"
            >
              <div className="text-white/30 mb-2 flex items-center gap-2">
                <LedText text="←" className="h-[10px] w-auto" />
                <span className="sr-only">Назад</span>
                <LedText text="Назад" className="h-[9px] w-auto" />
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
              <div className="text-white/30 mb-2 flex items-center gap-2 justify-end">
                <span className="sr-only">Следующий</span>
                <LedText text="Следующий" className="h-[9px] w-auto" />
                <LedText text="→" className="h-[10px] w-auto" />
              </div>
              <div className="text-sm md:text-base text-white/50 group-hover:text-white/80 transition-colors">
                {next.title}
              </div>
              <div className="text-[12px] text-white/20 mt-0.5">{next.company}</div>
            </Link>
          ) : (
            <Link
              href="/#portfolio"
              className="group py-8 md:py-12 pl-4 text-right border-l border-white/[0.06] no-underline"
            >
              <div className="text-white/30 mb-2 flex items-center gap-2 justify-end">
                <span className="sr-only">Назад</span>
                <LedText text="Назад" className="h-[9px] w-auto" />
                <LedText text="→" className="h-[10px] w-auto" />
              </div>
              <div className="text-sm md:text-base text-white/50 group-hover:text-white/80 transition-colors">
                Все проекты
              </div>
            </Link>
          )}
        </div>
      </section>

      </div>
    </>
  );
}

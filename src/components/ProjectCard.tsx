"use client";

import Link from "next/link";
import Image from "next/image";
import LedText from "@/components/LedText";
import { LedLines } from "@/components/LedBoard";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Project } from "@/data/projects";
import { CardCoverVideo } from "@/components/CoverVideo";
import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Фон карточки: видео-обложка > картинка-обложка > просто coverColor.
 * По умолчанию полностью скрыт (opacity-0), плавно появляется когда
 * `active` = true. `active` управляется родителем и учитывает hover,
 * мобильный «фокус» и фактическое проигрывание видео.
 */
function CoverMedia({
  project,
  hoverTarget,
  active,
  onVideoPlayingChange,
}: {
  project: Project;
  hoverTarget?: RefObject<HTMLElement | null>;
  /** Показать cover (hover/mobile-focus/идёт play-out). */
  active: boolean;
  /** Колбэк play/pause видео — родитель использует, чтобы держать cover
   *  видимым пока видео ещё доигрывается после ухода курсора. */
  onVideoPlayingChange?: (isPlaying: boolean) => void;
}) {
  const baseTransition = "transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";
  if (project.coverVideo) {
    return (
      <>
        {/* Постер-заглушка — всегда виден под видео, чтобы карточка не была
            пустой темнотой когда видео ещё не игралось или уже закончилось. */}
        {project.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.coverImage}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover object-top z-0"
          />
        )}
        <CardCoverVideo
          src={project.coverVideo}
          poster={project.coverImage}
          pauseAt={project.coverVideoPauseAt}
          hoverTarget={hoverTarget}
          onPlayingChange={onVideoPlayingChange}
          className={`absolute inset-0 w-full h-full object-cover object-top z-[1] ${baseTransition} ${
            active ? "opacity-100" : "opacity-0"
          }`}
        />
      </>
    );
  }
  if (project.coverImage) {
    return (
      <Image
        src={project.coverImage}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className={`object-cover object-top z-0 ${baseTransition} ${
          active ? "opacity-50" : "opacity-0"
        }`}
      />
    );
  }
  return null;
}

/**
 * Хук: возвращает true, когда элемент пересекает «полосу фокуса» в центре
 * viewport на мобильной ширине. На десктопе всегда false (там работает hover).
 */
function useMobileFocus(ref: RefObject<HTMLElement | null>): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 767px)");
    const el = ref.current;
    if (!el) return;

    let io: IntersectionObserver | null = null;

    const setup = () => {
      io?.disconnect();
      if (!mql.matches) {
        setActive(false);
        return;
      }
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            setActive(entry.isIntersecting);
          }
        },
        {
          // Полоса 50%—65% от верха viewport: карточка активна, когда её
          // bounding-box пересекает эту узкую зону чуть ниже середины.
          rootMargin: "-50% 0px -35% 0px",
          threshold: 0,
        }
      );
      io.observe(el);
    };

    setup();
    mql.addEventListener("change", setup);
    return () => {
      mql.removeEventListener("change", setup);
      io?.disconnect();
    };
  }, [ref]);

  return active;
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
    <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/15 bg-black/40 text-[12px] md:text-[13px] tracking-[0.08em] uppercase text-white/80 leading-[1.2] backdrop-blur-sm">
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
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C9A66B]/10 border border-[#C9A66B]/30 text-[#C9A66B] leading-[1.2]">
      <span className="sr-only">
        {value} {label ?? ""}
      </span>
      <LedText text={label ? `${value} ${label}` : value} className="h-[9px] w-auto" />
    </span>
  );
}

export default function ProjectCard({
  project,
  featured = false,
  wide = false,
}: ProjectCardProps) {
  // Hover-arrow в top-right медиа-окна
  const HoverArrow = (
    <div className="absolute top-3 right-3 md:top-4 md:right-4 w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/20 flex items-center justify-center bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 z-[3]">
      <ArrowUpRight className="w-4 h-4 text-white/90" strokeWidth={2} />
    </div>
  );

  // Ref для hover/IO. Hover отслеживаем сами в JS, потому что нужно
  // удерживать cover видимым пока видео доигрывается после mouseleave.
  const articleRef = useRef<HTMLElement>(null);
  const mobileActive = useMobileFocus(articleRef);
  const [hovering, setHovering] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  // mouseenter/mouseleave на контейнер карточки.
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    const onEnter = () => setHovering(true);
    const onLeave = () => setHovering(false);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Cover виден когда: 1) курсор над карточкой, 2) карточка в фокусе
  // мобильного viewport, 3) видео ещё проигрывается (play-out после ухода
  // курсора, чтобы пользователь увидел концовку до затухания).
  const coverActive = hovering || mobileActive || videoPlaying;

  /** Тёмная база — карточка по умолчанию чёрная. Бренд-цвет проявляется
   * вместе с cover. */
  const CoverTint = (
    <div
      aria-hidden
      className={`absolute inset-0 z-0 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        coverActive ? "opacity-100" : "opacity-0"
      }`}
      style={{ background: project.coverColor }}
    />
  );

  // Параметры цели — общие для всех вариантов карточки.
  const goalParams = JSON.stringify({ case_slug: project.slug, variant: featured ? "featured" : wide ? "wide" : "regular" });

  // Медиа-окно с аспектом исходника (1800×1169) — кадр видео помещается
  // целиком. Компания и теги — по углам окна, как лейблы у экспериментов.
  // Кадр исходника 1800×1169, но его нижняя треть пустая — окно ниже,
  // кроп от верха (object-top), кубик остаётся в кадре целиком.
  const MediaWindow = (
    <div className={`relative w-full ${wide ? "aspect-[21/9]" : "aspect-[16/9]"} rounded-xl border border-white/[0.08] overflow-hidden bg-black/40`}>
      {CoverTint}
      <CoverMedia project={project} active={coverActive} onVideoPlayingChange={setVideoPlaying} />
      {HoverArrow}
      {/* Компания — верхний левый угол окна */}
      <div className="absolute top-4 left-4 md:top-5 md:left-5 z-[2] text-white/65 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
        <span className="sr-only">{project.company}</span>
        <LedText text={project.company} className="h-[9px] md:h-[10px] w-auto" />
      </div>
      {/* Теги — нижний левый угол; метрика — нижний правый */}
      <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 z-[2] flex flex-wrap gap-1.5 md:gap-2 max-w-[70%]">
        {project.tags.slice(0, featured ? 4 : wide ? 3 : 2).map((t) => (
          <TagChip key={t}>{t}</TagChip>
        ))}
      </div>
      {project.metric && (
        <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 z-[2]">
          <MetricChip value={project.metric} label={project.metricLabel} />
        </div>
      )}
    </div>
  );

  // Заголовок — по центру карточки, как у плитки экспериментов.
  const Title = (
    <div className={`flex-1 flex items-center justify-center text-center ${
      featured ? "px-6 py-7 md:py-8" : "px-5 py-6 md:py-7"
    }`}>
      <h3 className="text-white">
        <LedLines
          text={project.title}
          center
          maxChars={featured ? 34 : wide ? 32 : 28}
          lineClass={
            featured
              ? "h-[18px] md:h-[24px]"
              : wide
                ? "h-[16px] md:h-[21px]"
                : "h-[15px] md:h-[18px]"
          }
        />
      </h3>
    </div>
  );

  return (
    <Link
      href={`/cases/${project.slug}`}
      data-ym-goal="case_open"
      data-ym-goal-params={goalParams}
      className="no-underline group h-full block"
    >
      <motion.article
        ref={articleRef}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl overflow-hidden bg-[#0f0f0e] border border-white/[0.06] group-hover:border-white/20 transition-colors duration-300 h-full"
      >
        <div className="h-full flex flex-col p-3 md:p-4 pb-0 md:pb-0">
          {MediaWindow}
          {Title}
        </div>
      </motion.article>
    </Link>
  );
}

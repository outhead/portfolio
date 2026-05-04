"use client";

import Link from "next/link";
import Image from "next/image";
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
      <CardCoverVideo
        src={project.coverVideo}
        poster={project.coverImage}
        pauseAt={project.coverVideoPauseAt}
        hoverTarget={hoverTarget}
        onPlayingChange={onVideoPlayingChange}
        className={`absolute inset-0 w-full h-full object-cover z-0 ${baseTransition} ${
          active ? "opacity-60" : "opacity-0"
        }`}
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
        className={`object-cover z-0 ${baseTransition} ${
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
    <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.04] text-[15px] md:text-[16px] tracking-[0.04em] text-white/80 leading-[1.2] backdrop-blur-sm">
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
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#A6FF00]/10 border border-[#A6FF00]/25 text-[#A6FF00] leading-[1.2]">
      <span className="font-p95 text-[15px] md:text-[16px] tracking-tight">{value}</span>
      {label && (
        <span className="text-[16px] md:text-[15px] tracking-[0.08em] uppercase text-[#A6FF00]/75">
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
      <div className="font-p95 text-[15px] md:text-[16px] tracking-[0.2em] uppercase text-white/55">
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

  // Bottom floor — градиент-поднос для читаемости текста поверх cover.
  // Появляется вместе с cover. До hover/фокуса карточка остаётся чисто чёрной
  // без каких-либо переходов снизу вверх.
  const GradientFloor = (
    <div
      className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none z-[1] transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        coverActive ? "opacity-100" : "opacity-0"
      }`}
    />
  );

  // Параметры цели — общие для всех вариантов карточки.
  const goalParams = JSON.stringify({ case_slug: project.slug, variant: featured ? "featured" : wide ? "wide" : "regular" });

  // === FEATURED — крупная hero-карточка (2×2 в сетке) ===
  if (featured) {
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
          className="relative rounded-2xl overflow-hidden bg-[#050506] border border-white/[0.06] group-hover:border-white/20 transition-colors duration-300 h-full"
        >
          <div className="relative h-full min-h-[360px] md:min-h-[480px] overflow-hidden">
            {CoverTint}
            <CoverMedia project={project} active={coverActive} onVideoPlayingChange={setVideoPlaying} />
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
          className="relative rounded-2xl overflow-hidden bg-[#050506] border border-white/[0.06] group-hover:border-white/20 transition-colors duration-300 h-full"
        >
          <div className="relative h-full min-h-[360px] md:min-h-[360px] overflow-hidden">
            {CoverTint}
            <CoverMedia project={project} active={coverActive} onVideoPlayingChange={setVideoPlaying} />
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
        className="relative rounded-2xl overflow-hidden bg-[#050506] border border-white/[0.06] group-hover:border-white/20 h-full transition-colors duration-300"
      >
        <div className="relative h-full min-h-[360px] md:min-h-[320px] overflow-hidden">
          {CoverTint}
          <CoverMedia project={project} active={coverActive} onVideoPlayingChange={setVideoPlaying} />
          {GradientFloor}
          {HoverArrow}
          {BottomContent}
        </div>
      </motion.article>
    </Link>
  );
}

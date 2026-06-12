"use client";

import Link from "next/link";
import Image from "next/image";
import LedText from "@/components/LedText";
import { LedLines } from "@/components/LedBoard";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Project } from "@/data/projects";
import { CardCoverVideo } from "@/components/CoverVideo";
import PixelCubePile from "@/components/PixelCubePile";
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
  /** Тег-строка в правом верхнем углу (LED). false — угол пустой. */
  showTags?: boolean;
}

export default function ProjectCard({
  project,
  featured = false,
  wide = false,
  showTags = true,
}: ProjectCardProps) {
  // Hover-arrow в нижнем правом углу — верхний правый занят тег-строкой
  const HoverArrow = (
    <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/20 flex items-center justify-center bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 z-[3] pointer-events-none">
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

  // Карточка — один цельный «экран»: дот-матрица (или обложка) на всю
  // площадь, без внешней рамки и внутреннего медиа-окна. Все подписи —
  // поверх матрицы: компания сверху слева, тайтл и чипы внизу по центру.
  // «Pet Project» — служебная подпись, на экране не показываем.
  const showCompany = !/pet\s*project/i.test(project.company);

  const hasCube = !!(project.cubeColor && project.cubeLogo);

  // Медиа-слой на весь экран. Idle-куб подвешен на ~40% высоты — оптический
  // центр свободной зоны над тайтлом.
  const MediaLayer = hasCube ? (
    <PixelCubePile
      color={project.cubeColor}
      logoSrc={project.cubeLogo}
      idleCenter
      centerFrac={0.4}
      pitch={5.2}
      maxCubes={featured || wide ? 45 : 32}
    />
  ) : (
    <>
      {CoverTint}
      <CoverMedia project={project} active={coverActive} onVideoPlayingChange={setVideoPlaying} />
    </>
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
        className={`relative rounded-2xl overflow-hidden bg-[#0b0b0a] h-full ${
          wide ? "aspect-[4/3] md:aspect-[16/9]" : "aspect-[4/3]"
        }`}
      >
        {/* Экран — медиа на всю карточку */}
        <div className="absolute inset-0">{MediaLayer}</div>
        {/* Затемнения для читаемости подписей поверх яркого медиа */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-16 md:h-20 bg-gradient-to-b from-black/60 to-transparent z-[1] pointer-events-none" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-28 md:h-36 bg-gradient-to-t from-black/85 via-black/45 to-transparent z-[1] pointer-events-none" />
        {HoverArrow}
        {/* Подписи экрана. pointer-events-none — чтобы ховер доходил до
            канваса с кубами (его mouseenter живёт на самом канвасе).
            Шапка: компания слева, тег-строка справа — одним LED-шрифтом.
            Низ: только тайтл, без чипов. */}
        <div className="relative z-[2] h-full flex flex-col p-4 md:p-5 pointer-events-none">
          <div className="flex items-start justify-between gap-4">
            <div className="text-white/75 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              {showCompany && (
                <>
                  <span className="sr-only">{project.company}</span>
                  <LedText text={project.company} className="h-[9px] md:h-[10px] w-auto" />
                </>
              )}
            </div>
            {showTags && project.tags.length > 0 && (
              <div className="text-white/55 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                <span className="sr-only">{project.tags.slice(0, 2).join(", ")}</span>
                <LedText text={project.tags.slice(0, 2).join(" · ")} className="h-[9px] md:h-[10px] w-auto" />
              </div>
            )}
          </div>
          <div className="mt-auto flex flex-col items-center text-center pb-1 md:pb-1.5">
            <h3 className="text-white max-w-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              <LedLines
                text={project.title}
                center
                maxChars={featured ? 28 : wide ? 26 : 22}
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
        </div>
      </motion.article>
    </Link>
  );
}

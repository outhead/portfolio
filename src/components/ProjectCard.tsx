"use client";

import Link from "next/link";
import Image from "next/image";
import LedText from "@/components/LedText";
import { LedLines } from "@/components/LedBoard";
import { Project } from "@/data/projects";
import { CardCoverVideo } from "@/components/CoverVideo";
import PixelCubePile from "@/components/PixelCubePile";
import ParticlePortrait from "@/components/ParticlePortrait";
import { layoutLedText, LED_ROWS } from "@/components/ledFont";

/**
 * LedCover — единый LED-экран карточки на ОДНОЙ решётке диодов.
 * Фоновые (тусклые) диоды, слово и матрица-дождь зажигаются на одних и тех
 * же ячейках — поэтому всё идеально совпадает (раньше было три разные сетки).
 * Слово перебирается с рассыпанием; по наведению (active) идёт дождь.
 */
function LedCover({ words, active }: { words: string[]; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const wordsKey = words.join("|");

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── битмапы слов на сетке шрифта (7 строк), отцентрованы по самому
    //    широкому слову, чтобы свапались на месте ──────────────────────
    const WR = LED_ROWS; // 7
    const layouts = words.map((w) => layoutLedText(w, 1));
    const maxCols = Math.max(1, ...layouts.map((l) => l.cols));
    const grids = layouts.map((l) => {
      const g = new Uint8Array(maxCols * WR);
      const off = Math.floor((maxCols - l.cols) / 2);
      for (const d of l.dots) if (d.lit) g[(off + d.col) * WR + d.row] = 1;
      return g;
    });
    const NW = maxCols * WR;
    const delays = new Float32Array(NW);
    for (let i = 0; i < NW; i++) delays[i] = Math.random();
    const aBuf = new Float32Array(NW); // текущая прозрачность ячеек слова
    grids[0].forEach((v, i) => (aBuf[i] = v));

    // ── решётка экрана: CELL подбираем так, чтобы слово влезло по ширине ─
    let W = 1, H = 1, CELL = 8, cols = 1, rows = 1, dimPath: Path2D | null = null;
    let wordStartCol = 0, wordTopRow = 0, dimR = 1, litR = 1, glowR = 2;
    let drops: Float32Array, speeds: Float32Array;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // слово занимает ~84% ширины → отсюда шаг решётки
      CELL = Math.max(4.5, Math.min(9, (W * 0.84) / maxCols));
      cols = Math.ceil(W / CELL) + 1;
      rows = Math.ceil(H / CELL) + 1;
      dimR = Math.max(0.9, CELL * 0.16);
      litR = Math.max(1.3, CELL * 0.3);
      glowR = CELL * 0.5;
      wordStartCol = Math.round((cols - maxCols) / 2);
      wordTopRow = Math.round((H * 0.5) / CELL - WR / 2);
      // статичная решётка тусклых диодов — один Path2D, заливаем раз/кадр
      dimPath = new Path2D();
      for (let c = 0; c < cols; c++) {
        for (let rr = 0; rr < rows; rr++) {
          const cxp = c * CELL + CELL / 2, cyp = rr * CELL + CELL / 2;
          dimPath.moveTo(cxp + dimR, cyp);
          dimPath.arc(cxp, cyp, dimR, 0, 6.283);
        }
      }
      drops = new Float32Array(cols);
      speeds = new Float32Array(cols);
      for (let c = 0; c < cols; c++) {
        drops[c] = -Math.floor(Math.random() * rows);
        speeds[c] = 0.25 + Math.random() * 0.5;
      }
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    // ── анимация слова: hold → out (рассыпать) → in (собрать) ──────────
    const HOLD = 2.4, OUT = 0.4, IN = 0.5;
    let word = 0, phase: "hold" | "out" | "in" = "hold", pStart = performance.now();
    let raf = 0, vis = 0, stopped = false, visible = true;
    // Кап ~40fps: морф слова time-based, дождь декоративный — на глаз не отличить от 120fps.
    const FRAME_MS = 1000 / 40;
    let lastDraw = 0;

    const loop = (now: number) => {
      if (stopped || !visible) return;
      raf = requestAnimationFrame(loop);
      if (!dimPath) return;
      if (now - lastDraw < FRAME_MS) return;
      lastDraw = now;

      // слово
      if (!reduce && words.length > 1) {
        const t = (now - pStart) / 1000;
        if (phase === "hold") {
          if (t > HOLD) { phase = "out"; pStart = now; for (let i = 0; i < NW; i++) delays[i] = Math.random(); }
        } else if (phase === "out") {
          const g = grids[word];
          for (let i = 0; i < NW; i++) if (g[i]) {
            const k = Math.min(Math.max((t - delays[i] * (OUT - 0.18)) / 0.18, 0), 1);
            aBuf[i] = 1 - k;
          }
          if (t > OUT) { word = (word + 1) % words.length; phase = "in"; pStart = now; for (let i = 0; i < NW; i++) delays[i] = Math.random(); }
        } else {
          const g = grids[word];
          for (let i = 0; i < NW; i++) {
            const k = Math.min(Math.max((t - delays[i] * (IN - 0.18)) / 0.18, 0), 1);
            aBuf[i] = g[i] ? k : 0;
          }
          if (t > IN) { phase = "hold"; pStart = now; }
        }
      }

      const tgt = activeRef.current && !reduce ? 1 : 0;
      vis += (tgt - vis) * 0.08;

      ctx.clearRect(0, 0, W, H);

      // 1) тусклая решётка экрана
      ctx.fillStyle = "rgba(150,190,110,0.10)";
      ctx.fill(dimPath);

      // 2) матрица-дождь (на той же решётке), позади слова
      if (vis > 0.01) {
        for (let c = 0; c < cols; c++) {
          drops[c] += speeds[c];
          if (drops[c] * CELL > H + rows * CELL) drops[c] = -Math.floor(Math.random() * rows);
          const head = Math.floor(drops[c]);
          const x = c * CELL + CELL / 2;
          for (let k = 0; k < 8; k++) {
            const rr = head - k;
            if (rr < 0 || rr > rows) continue;
            const a = (k === 0 ? 0.9 : Math.max(0, 0.6 - k * 0.09)) * vis;
            if (a < 0.02) continue;
            ctx.fillStyle = `rgba(166,255,0,${a.toFixed(3)})`;
            ctx.beginPath(); ctx.arc(x, rr * CELL + CELL / 2, litR * 0.85, 0, 6.283); ctx.fill();
          }
        }
      }

      // 3) слово — яркие диоды с лёгким свечением
      for (let mc = 0; mc < maxCols; mc++) {
        const c = wordStartCol + mc;
        if (c < 0 || c >= cols) continue;
        const x = c * CELL + CELL / 2;
        for (let r = 0; r < WR; r++) {
          const a = aBuf[mc * WR + r];
          if (a < 0.03) continue;
          const y = (wordTopRow + r) * CELL + CELL / 2;
          ctx.fillStyle = `rgba(166,255,0,${(a * 0.22).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(x, y, glowR, 0, 6.283); ctx.fill();
          ctx.fillStyle = `rgba(190,255,70,${a.toFixed(3)})`;
          ctx.beginPath(); ctx.arc(x, y, litR, 0, 6.283); ctx.fill();
        }
      }
    };
    raf = requestAnimationFrame(loop);

    // Пауза рисования, когда карточка ушла за пределы вьюпорта.
    const io = new IntersectionObserver(
      (entries) => {
        const vv = entries[0]?.isIntersecting ?? true;
        if (vv && !visible) { visible = true; lastDraw = 0; raf = requestAnimationFrame(loop); }
        else if (!vv && visible) { visible = false; cancelAnimationFrame(raf); }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    return () => { stopped = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordsKey]);

  return (
    <div className="absolute inset-0">
      <span className="sr-only">{words.join(", ")}</span>
      <canvas ref={ref} aria-hidden className="absolute inset-0 w-full h-full" style={{ display: "block" }} />
    </div>
  );
}
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
  /** Порядковый номер кейса в сетке (0-based). Рендерится LED-индексом
   *  «01», «02»… слева в шапке карточки; лаймовый на ховере. */
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
  index,
  featured = false,
  wide = false,
  showTags = true,
}: ProjectCardProps) {
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

  // ── Мета «год · роль» у нижней кромки экрана ────────────────────────
  // Диапазон лет достаём из period («май 2024 — июль 2025» → «2024–2025»),
  // открытые периоды сжимаем до «с 2025». Длину строки режем на уровне
  // ДАННЫХ (roleShort в projects.ts), а не CSS-скейлом — LED-строка должна
  // влезать в мобильную карточку ~390px как есть.
  const periodYears = project.period.match(/\d{4}/g) ?? [String(project.year)];
  const firstYear = periodYears[0];
  const lastYear = periodYears[periodYears.length - 1];
  const periodShort = /настоящ/i.test(project.period)
    ? `с ${firstYear}`
    : firstYear === lastYear
      ? firstYear
      : `${firstYear}–${lastYear}`;
  const metaText = `${periodShort} · ${project.roleShort ?? project.role}`;

  // Медиа-слой на весь экран. Idle-куб подвешен на ~40% высоты — оптический
  // центр свободной зоны над тайтлом.
  const MediaLayer = project.coverLed ? (
    <LedCover words={project.coverLed} active={coverActive} />
  ) : project.coverParticles ? (
    <>
      {CoverTint}
      <ParticlePortrait
        src={project.coverParticles.src}
        depthSrc={project.coverParticles.depth}
        count={project.coverParticles.count ?? 4200}
        depthScale={project.coverParticles.depthScale ?? 0.6}
        pointScale={project.coverParticles.pointScale ?? 0.7}
        tilt={0.5}
        assembleOnHover={false}
        scatterOnHover
        trackingRef={articleRef}
        className="absolute inset-0 z-[1]"
      />
    </>
  ) : hasCube ? (
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
      <article
        ref={articleRef}
        className={`relative rounded-2xl overflow-hidden bg-[#0b0b0a] h-full ${
          wide ? "aspect-[4/3] md:aspect-auto lg:aspect-[16/9]" : "aspect-[4/3]"
        }`}
      >
        {/* Экран — медиа на всю карточку */}
        <div className="absolute inset-0">{MediaLayer}</div>
        {/* Кроп-метки: плюсики по углам, как на печатном макете.
            На ховере белеют и чуть расходятся наружу — «макет оживает». */}
        <div aria-hidden className="absolute inset-0 z-[2] pointer-events-none">
          {[
            { pos: "top-2.5 left-2.5", out: "md:group-hover:-translate-x-0.5 md:group-hover:-translate-y-0.5" },
            { pos: "top-2.5 right-2.5", out: "md:group-hover:translate-x-0.5 md:group-hover:-translate-y-0.5" },
            { pos: "bottom-2.5 left-2.5", out: "md:group-hover:-translate-x-0.5 md:group-hover:translate-y-0.5" },
            { pos: "bottom-2.5 right-2.5", out: "md:group-hover:translate-x-0.5 md:group-hover:translate-y-0.5" },
          ].map(({ pos, out }) => (
            <span
              key={pos}
              className={`absolute ${pos} ${out} w-2 h-2 text-white/[0.14] md:group-hover:text-white/60 transition-all duration-500 ease-out`}
            >
              <svg viewBox="0 0 8 8" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M4 0v8M0 4h8" />
              </svg>
            </span>
          ))}
        </div>
        {/* Затемнения для читаемости подписей поверх яркого медиа */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-16 md:h-20 bg-gradient-to-b from-black/60 to-transparent z-[1] pointer-events-none" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-28 md:h-36 bg-gradient-to-t from-black/85 via-black/45 to-transparent z-[1] pointer-events-none" />
        {/* Подписи экрана. pointer-events-none — чтобы ховер доходил до
            канваса с кубами (его mouseenter живёт на самом канвасе).
            Шапка: компания слева, тег-строка справа — одним LED-шрифтом.
            Низ: только тайтл, без чипов. */}
        <div className="relative z-[2] h-full flex flex-col p-4 md:p-5 pointer-events-none">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 md:gap-2.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              {showCompany && (
                <span className="inline-flex text-white/75">
                  <span className="sr-only">{project.company}</span>
                  <LedText text={project.company} className="h-[9px] md:h-[10px] w-auto" />
                </span>
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
            {/* Ховер-сдвиг тайтла — только desktop (md:), на мобиле статично */}
            <h3 className="text-white max-w-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:group-hover:-translate-y-0.5">
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
            {/* Мета «год · роль». На мобиле видна сразу (opacity-100),
                на desktop дремлет на 60% и проявляется по ховеру. */}
            <div className="mt-1.5 md:mt-2 max-w-full text-white/50 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] transition-opacity duration-300 opacity-100 md:opacity-60 md:group-hover:opacity-100">
              <span className="sr-only">{metaText}</span>
              <LedText
                text={metaText}
                className="h-[8px] md:h-[9px] w-auto max-w-full"
                preserve="xMidYMid meet"
              />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

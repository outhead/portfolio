"use client";

import ProjectCard from "@/components/ProjectCard";
import ParticleSphere from "@/components/ParticleSphere";
import PulseAnimation, { type PulseVariant } from "@/components/PulseAnimation";
import FlippingWord from "@/components/FlippingWord";
import FinalCTA from "@/components/FinalCTA";
import CompanyMarquee from "@/components/CompanyMarquee";
import { TypographyFix } from "@/components/TypographyFix";
import { workProjects } from "@/data/projects";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Code2,
  Send,
  Mail,
  FileDown,
  MapPin,
  Quote,
  ArrowRight,
  Users,
  Sparkles,
  Trophy,
  Globe,
  Layers,
  ArrowUpRight,
  Compass,
  BarChart3,
} from "lucide-react";

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
  </svg>
);

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.58v-2.1c-3.34.72-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.08-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.82 1.31 3.5 1 .1-.78.42-1.32.76-1.62-2.67-.3-5.48-1.34-5.48-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.52 11.52 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .3" />
  </svg>
);

// === Motion ===
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const viewport = { once: true, margin: "-10% 0px -10% 0px" };

// ───────────────────────────────────────────────────────────────────
// SectionLabel (bracket mono)
// ───────────────────────────────────────────────────────────────────
function SectionLabel({
  children,
  tone = "dark",
}: {
  children: React.ReactNode;
  tone?: "dark" | "light";
}) {
  const isLight = tone === "light";
  return (
    <div
      className={`inline-flex items-center gap-1.5 font-p95 text-[15px] md:text-[16px] tracking-[0.2em] uppercase ${
        isLight ? "text-black/65" : "text-white/75"
      }`}
    >
      <span className="text-[#A6FF00]">[</span>
      <span>{children}</span>
      <span className="text-[#A6FF00]">]</span>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Asterisk — маленький зелёный `*` как типографический приём (stokt)
// ───────────────────────────────────────────────────────────────────
function Star() {
  return (
    <span className="text-[#A6FF00] font-p95 align-top inline-block translate-y-[-0.15em]">
      *
    </span>
  );
}

// ───────────────────────────────────────────────────────────────────
// DotGlobe — интерактивный дотовый глобус: точки только на суше
// (world-atlas 110m, 180×90 bitgrid), drag-to-rotate + автовращение,
// маркер Москвы с пульсацией. Рендер в canvas для плавности.
// ───────────────────────────────────────────────────────────────────
const LAND_GRID_B64 =
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf4AP/AAAAAAAAAAAAAAAAAAAAAAAAX/z///+AAAAAAAABAAAAAAAAAAAAAYd8P///wAA+AAAAAA8AAAAAAAAAAAwAnw////4AAIAAAAAAGAAAAAAAAAAADivwAf//wAAAAADAAf/wAHYAAAAAADoi3sAP//gAAAAAMAD///sAAAAgBgACfwz/AD/+gAAAwAEHf///////+AP//////////////4A//EgAAAAAAAgH///////////////gAFAAgAAAAAAAAz///////////////BhQAAAAAAAAAAAAP/////4A0B4AAAD5/////////////Af3////gHgA4AAAH5///////////LwAHgH///gHkAAAAAH4/////////+CIAABAB///4D+AAAAGCx/////////4A8AAIAAf///n/gAAAOCD/////////wA4AAAAAf///n/wAAAbP///////////AgAAAAAP/////wAAADf//////////9AAAAAAAF////0YAAAB///////////9AAAAAAAD////8EAAAB///////////5AAAAAAAD////2AAAAB/f5fP//////wAAAAAAAD////gAAAAfxnwPP//////jAAAAAAAD////AAAAAPCb3/n/////+CAAAAAAAD///8AAAAAfALf/n////+ECAAAAAAAB///8AAAAAGHQP/n/////mMAAAAAAAA///8AAAAAH+Ai///////E8AAAAAAAAf//wAAAAAP/AA///////BgAAAAAAAAP//gAAAAAf/73///////gAAAAAAAAAD/AQAAAAAf////f/////gAAAAAAAAAF+AQAAAAB///+/n/////AAAAAAAAAAC+AAAAAAB///+f0H////AAAAAAAAAAAeAwAAAAD////f/B///8gAAAAAAAAAAeGEAAAAH////v+B/z/AAAAAAAAAAAAPMAgAAAD////n+A/B+gAAAAAAAAAAAD8AAAAAD////n4AeB/AgAAAAAAAAAAAPAAAAAH////3gAcAfAgAAAAAAAAAAADAAAAAD////6AAcAfggAAAAAAAAAAABDwAAAD////8wAMATAIAAAAAAAAAAAAr/AAAB/////gAKASAAAAAAAAAAAAAAH/gAAA/////gACAAAIAAAAAAAAAAAAH/8AAAaH///AAAAsGAAAAAAAAAAAAAH/+AAAAB//+AAAAUOAAAAAAAAAAAAAP/+AAAAB//8AAAAYegAAAAAAAAAAAAP//gAAAD//4AAAAMeBgAAAAAAAAAAAP//8AAAB//wAAAAGdiuAAAAAAAAAAAf///AAAA//wAAAACAQHgAAAAAAAAAAP///gAAA//wAAAABwAHwgAAAAAAAAAH///AAAA//wAAAAACIDQIAAAAAAAAAH//+AAAAf/wAAAAAAAAAAAAAAAAAAAD//+AAAA//wgAAAAABxAAAAAAAAAAAD//+AAAA//wgAAAAAPxgBAAAAAAAAAA//8AAAA//jgAAAAAf5gAAAAAAAAAAAf/8AAAA//DgAAAAAf/gAAAAAAAAAAAf/8AAAAf/DAAAAAD//4CAAAAAAAAAAf/wAAAAf/DAAAAAH//4AAAAAAAAAAAf/AAAAAf+CAAAAAH//8AAAAAAAAAAAf/AAAAAP8AAAAAAH//+AAAAAAAAAAA/+AAAAAP8AAAAAAH//+AAAAAAAAAAA/+AAAAAH4AAAAAAD//+AAAAAAAAAAA/8AAAAAHwAAAAAADwf8AAAAAAAAAAA/gAAAAAAAAAAAAACAH4AIAAAAAAAAB/wAAAAAAAAAAAAAAAD4AEAAAAAAAAB+AAAAAAAAAAAAAAAAAAAGAAAAAAAAB6AAAAAAAAAAAAAAAAAwAMAAAAAAAAA8AAAAAAAAAAAAAAAAAQAYAAAAAAAAB4AAAAAAAAAAAAAAAAAAAwAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAACAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAeAAIP+f/gAAAAAAAAAAAMAAAAAAABP/+H//////AAAAAAAAAAA+AAAAAf////8////////AAAAAAAOEAPAAAB///////////////gAAAP//T//8AAAH//////////////+AAAH/////4AAAH///////////////8AAE//////4ABw////////////////8AAAD//////gCA////////////////wAAAf/////////////////////////+AAH/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

// Побережья — упрощённые полилинии из world-atlas land-110m.json
// Формат: uint16 numArcs, затем на каждую дугу: uint16 N, потом N × (int16 lon*100, int16 lat*100)
const COASTLINE_B64 =
  "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";

function DotGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Декод grid точек на суше ────────────────────────────────
    const LON_STEPS = 180;
    const LAT_STEPS = 90;
    const gridBin = atob(LAND_GRID_B64);
    const landDots: Array<{ lon: number; lat: number }> = [];
    for (let la = 0; la < LAT_STEPS; la++) {
      const lat = ((90 - (la + 0.5) * (180 / LAT_STEPS)) * Math.PI) / 180;
      for (let lo = 0; lo < LON_STEPS; lo++) {
        // шахматное прореживание — сбивает плотность в 2 раза и ломает
        // ровные ряды, визуально спокойнее
        if (((la + lo) & 1) === 0) continue;
        const idx = la * LON_STEPS + lo;
        const bit = (gridBin.charCodeAt(idx >> 3) >> (7 - (idx & 7))) & 1;
        if (bit) {
          const lon = ((-180 + (lo + 0.5) * (360 / LON_STEPS)) * Math.PI) / 180;
          landDots.push({ lon, lat });
        }
      }
    }

    // Побережья отключены — линии при 110m+DP упрощении корявые.
    // Константа COASTLINE_B64 оставлена в файле на случай будущего использования.

    // Без графикулы — чистый глобус в стиле референса
    const DEG = Math.PI / 180;

    // Москва
    const MOS_LAT = 55.75 * DEG;
    const MOS_LON = 37.62 * DEG;

    // Состояние анимации
    let rotLon = -0.4;
    let rotLat = 0.32;
    const autoSpeed = 0.08;
    let dragging = false;
    let lastPX = 0;
    let lastPY = 0;
    let lastMoveT = performance.now();
    // Инерция (рад/с) — задаётся в onMove, затухает после onUp
    let velLon = 0;
    let velLat = 0;
    let last = performance.now();
    let idleResumeAt = 0;
    let rafId = 0;

    const resize = () => {
      const DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * DPR);
      canvas.height = Math.round(rect.height * DPR);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!dragging) {
        const spd = Math.hypot(velLon, velLat);
        if (spd > 0.02) {
          // Инерционный выбег: экспоненциальное затухание (~12% за секунду)
          rotLon += velLon * dt;
          rotLat = Math.max(-1.1, Math.min(1.1, rotLat + velLat * dt));
          const decay = Math.pow(0.12, dt);
          velLon *= decay;
          velLat *= decay;
        } else if (now > idleResumeAt) {
          velLon = 0;
          velLat = 0;
          rotLon += autoSpeed * dt;
        }
      }

      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(W, H) * 0.46;

      ctx.clearRect(0, 0, W, H);

      const cosT = Math.cos(rotLat);
      const sinT = Math.sin(rotLat);

      // Проекция lon/lat → экран + z (глубина)
      // project inline — избегаем аллокаций
      const projCache = { sx: 0, sy: 0, z: 0 };
      const project = (lon: number, lat: number) => {
        const cLat = Math.cos(lat);
        const sLat = Math.sin(lat);
        const eLon = lon + rotLon;
        const x1 = cLat * Math.sin(eLon);
        const y1 = sLat;
        const z1 = cLat * Math.cos(eLon);
        const y2 = y1 * cosT - z1 * sinT;
        const z2 = y1 * sinT + z1 * cosT;
        projCache.sx = cx + x1 * R;
        projCache.sy = cy - y2 * R;
        projCache.z = z2;
        return projCache;
      };

      // Слой 1: точки внутренности континентов (без контуров — они корявые)
      for (let i = 0; i < landDots.length; i++) {
        const p = landDots[i];
        const { sx, sy, z } = project(p.lon, p.lat);
        if (z < 0.04) continue;
        const op = 0.28 + 0.5 * z;
        const rr = 0.55 + 0.75 * z;
        ctx.globalAlpha = op;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(sx, sy, rr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Слой 2: тонкий контур лимба (горизонт сферы)
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      // Слой 5: маркер Москвы с пульсацией
      const m = project(MOS_LON, MOS_LAT);
      if (m.z > -0.15) {
        const visible = m.z > 0.02;
        const alphaMul = visible ? 1 : Math.max(0, 1 + m.z / 0.15);
        const pulse = 0.5 + 0.5 * Math.sin(now * 0.003);
        ctx.fillStyle = `rgba(166,255,0,${0.05 * alphaMul})`;
        ctx.beginPath();
        ctx.arc(m.sx, m.sy, 22 + 10 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(166,255,0,${0.22 * alphaMul})`;
        ctx.beginPath();
        ctx.arc(m.sx, m.sy, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(166,255,0,${alphaMul})`;
        ctx.beginPath();
        ctx.arc(m.sx, m.sy, 4.2, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    // Pointer-интеракция
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastPX = e.clientX;
      lastPY = e.clientY;
      lastMoveT = performance.now();
      velLon = 0;
      velLat = 0;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const mdt = Math.max(0.008, (now - lastMoveT) / 1000);
      lastMoveT = now;
      const dx = e.clientX - lastPX;
      const dy = e.clientY - lastPY;
      lastPX = e.clientX;
      lastPY = e.clientY;
      const dLon = dx * 0.006;
      const dLat = dy * 0.006;
      rotLon += dLon;
      rotLat = Math.max(-1.1, Math.min(1.1, rotLat + dLat));
      // Сглаженная угловая скорость (рад/с) — ema с быстрым хвостом
      const vxNow = dLon / mdt;
      const vyNow = dLat / mdt;
      velLon = velLon * 0.5 + vxNow * 0.5;
      velLat = velLat * 0.5 + vyNow * 0.5;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
      canvas.style.cursor = "grab";
      // Ограничиваем максимальную инерцию, чтобы резкий «швырок» не улетал
      const maxV = 4.0;
      const sp = Math.hypot(velLon, velLat);
      if (sp > maxV) {
        velLon = (velLon / sp) * maxV;
        velLat = (velLat / sp) * maxV;
      }
      // Если пользователь не двигал шар вообще (клик) — не нужно идле-паузы
      idleResumeAt = performance.now() + (Math.hypot(velLon, velLat) > 0.02 ? 2400 : 600);
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onUp);
    canvas.style.cursor = "grab";

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full touch-none select-none"
      aria-hidden
    />
  );
}

// ───────────────────────────────────────────────────────────────────
// SKILLS — accordion-бенто (stokt-style) — УСТАРЕЛО, оставлено для референса
// ───────────────────────────────────────────────────────────────────
interface SkillPanel {
  key: string;
  label: string;
  title: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  accent: string;
  body: string;
  items: string[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SkillsAccordion({ panels }: { panels: SkillPanel[] }) {
  const [active, setActive] = useState<string>(panels[0].key);
  const CONTENT_WIDTH = 560;
  const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
  return (
    <div className="flex flex-col md:flex-row gap-2 md:gap-3 w-full md:h-[440px]">
      {panels.map((p) => {
        const isActive = active === p.key;
        const PanelContent = (
          <div
            className="relative p-6 md:p-8 md:h-full md:flex md:flex-col"
            style={{ width: `min(100%, ${CONTENT_WIDTH}px)` }}
          >
            <div
              className="absolute top-6 right-6 md:top-8 md:right-8 h-2 w-2 rounded-full"
              style={{ backgroundColor: p.accent }}
            />
            <div className="inline-flex items-center gap-2 font-p95 text-[15px] md:text-[16px] tracking-[0.2em] uppercase text-white/75 mb-4">
              <p.Icon className="w-4 h-4" strokeWidth={1.75} style={{ color: p.accent }} />
              <span>{p.label}</span>
            </div>
            <h3 className="font-p95 text-[clamp(22px,2.6vw,36px)] leading-[0.98] uppercase text-white mb-4">
              {p.title}
            </h3>
            <p className="text-sm md:text-[15px] text-white/60 leading-relaxed mb-6">{p.body}</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-auto">
              {p.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-white/70 leading-snug"
                >
                  <span
                    className="mt-[7px] h-px w-2 shrink-0"
                    style={{ backgroundColor: p.accent, opacity: 0.7 }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );

        return (
          <button
            key={p.key}
            type="button"
            onClick={() => setActive(p.key)}
            className={`group relative text-left rounded-2xl border overflow-hidden transition-[flex,border-color,background-color] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] md:h-full ${
              isActive
                ? "border-white/15 bg-[#0a0a0a] md:flex-[6]"
                : "border-white/[0.06] bg-[#080808] hover:border-white/15 md:flex-[1] md:min-w-[72px]"
            }`}
            aria-expanded={isActive}
          >
            {/* Desktop: вертикальная рейка (свёрнутое состояние) */}
            <div
              className="hidden md:flex flex-col items-center justify-between absolute inset-0 py-6 px-3 transition-opacity duration-300 ease-out"
              style={{
                opacity: isActive ? 0 : 1,
                pointerEvents: isActive ? "none" : "auto",
              }}
              aria-hidden={isActive}
            >
              <p.Icon className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors" strokeWidth={1.5} />
              <div
                className="font-p95 text-[15px] tracking-[0.2em] uppercase text-white/55 group-hover:text-white/85 transition-colors whitespace-nowrap"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                {p.label}
              </div>
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: "transparent", boxShadow: `inset 0 0 0 1px ${p.accent}` }}
              />
            </div>

            {/* Mobile свёрнутый */}
            <div className={`md:hidden ${isActive ? "hidden" : "flex"} items-center justify-between px-5 py-4`}>
              <div className="flex items-center gap-3">
                <p.Icon className="w-4 h-4 text-white/50" strokeWidth={1.5} />
                <div className="font-p95 text-[15px] tracking-[0.2em] uppercase text-white/75">
                  {p.label}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40" strokeWidth={1.75} />
            </div>

            {/* Desktop overlay */}
            <div
              className="hidden md:block md:absolute md:inset-0 md:overflow-hidden transition-opacity duration-[350ms] ease-out"
              style={{
                opacity: isActive ? 1 : 0,
                pointerEvents: isActive ? "auto" : "none",
              }}
              aria-hidden={!isActive}
            >
              <div className="md:flex md:items-start h-full">{PanelContent}</div>
            </div>

            {/* Mobile expand */}
            <AnimatePresence initial={false}>
              {isActive && (
                <motion.div
                  key="mobile-expand"
                  className="md:hidden overflow-hidden"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  aria-hidden={!isActive}
                >
                  {PanelContent}
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// CAREER — hover-reveal list
// ───────────────────────────────────────────────────────────────────
const careerJobs: Array<{
  year: string;
  company: string;
  role: string;
  scope: string;
  details?: string[];
  current?: boolean;
}> = [
  {
    year: "Сейчас",
    company: "Свободный график",
    role: "Ментор · Консультант · AI Visioner",
    scope: "Менторинг, консалтинг, эксперименты в AI",
    details: [
      "30+ менти за карьеру (включая АД-период)",
      "Консалтинг: аудит дизайн-функций, найм, постановка процессов",
      "Читал курс по прикладному ИИ в ВШЭ",
    ],
    current: true,
  },
  {
    year: "2025–2026",
    company: "MWS AI",
    role: "AI Visioner",
    scope: "AI-дивизион МТС Web Services, 2 продукта",
    details: [
      "Задавал AI-направление двум флагманским продуктам дивизиона",
      "Определял UX-принципы для AI-агентов и чат-интерфейсов",
      "Собрал UI Kit для внутренних AI-продуктов",
    ],
  },
  {
    year: "2024–2025",
    company: "МТС",
    role: "Design Director",
    scope: "8 команд, 6 лидов, 3 арт-дира, 40+ дизайнеров, 4 запуска голосовой",
    details: [
      "Голосовая экосистема: 4 публичных запуска за 2025 (вкл. AI-шумоподавление, впервые на рынке моб. связи)",
      "Кросс-продуктовая интеграция Мой МТС: 30+ экосистемных продуктов в одном flow поверх 5 параллельных бизнесов",
      "AI в рутине ДЦВ: Cursor, Claude, Figma-плагины — пошёл первым сам",
    ],
  },
  {
    year: "2022–2024",
    company: "Газпром Нефть",
    role: "Head of Design",
    scope: "76 команд, 42 лида, 100+ дизайнеров, CX Award'24",
    details: [
      "Собрал единую дизайн-функцию из разрозненных команд",
      "Запустил дизайн-систему для 76 продуктов",
      "CX Awards'24 за Unified Service Portal (ESO)",
    ],
  },
  {
    year: "2021–2022",
    company: "Ozon",
    role: "Community Lead",
    scope: "Канал с 0 до 17К подписчиков, −60% к оттоку на найме",
    details: [
      "Построил дизайн-комьюнити с нуля",
      "Вырастил канал с 0 до 17К подписчиков",
      "Сократил отток на найме дизайнеров на 60%",
    ],
  },
  {
    year: "2017–2021",
    company: "МТС",
    role: "Art Director B2C",
    scope: "16 команд, 60+ дизайнеров, 11М+ пользователей",
    details: [
      "Арт-дирекшн B2C-экосистемы МТС",
      "×10 рост транзакций в МТС Cashback",
      "Унификация визуального языка по 16 командам",
    ],
  },
];

function CareerHoverList() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="rounded-2xl border border-white/[0.06] overflow-hidden bg-white/[0.015]">
      {careerJobs.map((job, i) => {
        const isExpanded = expandedIdx === i;
        const toggle = () =>
          setExpandedIdx((prev) => (prev === i ? null : i));

        return (
          <div
            key={job.year + job.company}
            className={`group relative ${i > 0 ? "border-t border-white/[0.06]" : ""} hover:bg-white/[0.025] transition-colors`}
          >
            {/* Mobile: вся строка — кнопка toggle */}
            <button
              type="button"
              onClick={toggle}
              aria-expanded={isExpanded}
              className="md:hidden w-full flex items-center gap-4 px-5 py-4 text-left"
            >
              <span
                className={`shrink-0 w-2 h-2 rounded-full ${
                  job.current ? "bg-[#A6FF00]" : "bg-white/25"
                }`}
                aria-hidden
              />
              <span className="shrink-0 font-p95 text-[15px] tracking-[0.2em] uppercase text-white/50 w-[88px]">
                {job.year}
              </span>
              <span className="flex-1 min-w-0 flex flex-col">
                <span className="font-p95 text-[15px] text-white uppercase leading-tight">
                  {job.company}
                  {job.current && (
                    <span className="ml-2 text-[12px] tracking-[0.12em] uppercase text-[#A6FF00]/85">
                      now
                    </span>
                  )}
                </span>
                <span className="text-[16px] text-white/55 leading-tight">
                  {job.role}
                </span>
              </span>
              <ArrowRight
                className={`w-4 h-4 text-white/40 transition-transform shrink-0 ${
                  isExpanded ? "rotate-90" : ""
                }`}
                strokeWidth={1.75}
              />
            </button>

            {/* Desktop: статичная строка (hover-раскрытие ниже через group-hover) */}
            <div className="hidden md:flex items-center gap-6 px-7 py-5">
              <span
                className={`shrink-0 w-2 h-2 rounded-full ${
                  job.current ? "bg-[#A6FF00]" : "bg-white/25"
                }`}
                aria-hidden
              />
              <span className="shrink-0 font-p95 text-[16px] tracking-[0.2em] uppercase text-white/50 w-[110px]">
                {job.year}
              </span>
              <span className="flex-1 min-w-0 flex flex-row items-baseline gap-3">
                <span className="font-p95 text-[17px] text-white uppercase leading-tight truncate">
                  {job.company}
                  {job.current && (
                    <span className="ml-2 text-[12px] tracking-[0.12em] uppercase text-[#A6FF00]/85">
                      now
                    </span>
                  )}
                </span>
                <span className="text-[15px] text-white/55 leading-tight truncate">
                  {job.role}
                </span>
              </span>
            </div>

            {/* Desktop: hover-раскрытие */}
            {job.details && (
              <div
                className="hidden md:grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                aria-hidden="true"
              >
                <div className="overflow-hidden">
                  <div className="px-7 pb-6 pl-[calc(28px+8px+24px+110px)]">
                    <p className="text-[16px] text-white/65 leading-relaxed mb-3">
                      {job.scope}
                    </p>
                    <ul className="space-y-1.5">
                      {job.details.map((d) => (
                        <li
                          key={d}
                          className="flex items-start gap-2 text-[15px] text-white/55 leading-snug"
                        >
                          <span className="mt-[7px] h-px w-2 shrink-0 bg-white/30" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile: click-раскрытие */}
            <AnimatePresence initial={false}>
              {isExpanded && job.details && (
                <motion.div
                  key="career-mobile-expand"
                  className="md:hidden overflow-hidden"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="px-5 pb-4 pl-[calc(20px+8px+16px+88px)]">
                    <p className="text-[16px] text-white/65 leading-relaxed mb-3">
                      {job.scope}
                    </p>
                    <ul className="space-y-1.5">
                      {job.details.map((d) => (
                        <li
                          key={d}
                          className="flex items-start gap-2 text-[16px] text-white/55 leading-snug"
                        >
                          <span className="mt-[7px] h-px w-2 shrink-0 bg-white/30" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// ServiceTile — плитка «Услуги & экспертиза» с pulse-анимацией.
// Hover активирует анимацию на десктопе. На мобиле — IntersectionObserver:
// когда плитка попадает в центр viewport, анимация активируется (по очереди при скролле).
// ───────────────────────────────────────────────────────────────────
type ServiceTileData = {
  key: string;
  index: string;
  label: string;
  title: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>;
  accent: string;
  animation: PulseVariant;
  animationReverse?: boolean;
  body: string;
  items: string[];
};

function ServiceTile({ tile }: { tile: ServiceTileData }) {
  const { index, label, title, Icon, accent, animation, animationReverse, body, items } = tile;
  const tileRef = useRef<HTMLDivElement>(null);
  const [mobileActive, setMobileActive] = useState(false);

  // IntersectionObserver: активирует pulse на мобиле, когда плитка пересекает
  // тонкую полосу чуть ниже середины viewport (50%—65% от верха).
  // На md+ pulse работает через hover, и mobileActive остаётся false.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 767px)");
    const el = tileRef.current;
    if (!el) return;

    let io: IntersectionObserver | null = null;

    const setup = () => {
      io?.disconnect();
      if (!mql.matches) {
        setMobileActive(false);
        return;
      }
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            setMobileActive(entry.isIntersecting);
          }
        },
        {
          // Полоса 50%—65% от верха viewport: top=-50% поднимает верх корня
          // на середину, bottom=-35% оставляет 15% активной зоны чуть ниже середины.
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
  }, []);

  return (
    <motion.div
      ref={tileRef}
      variants={fadeUp}
      className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.015] hover:border-white/[0.2] transition-colors p-6 md:p-8 flex flex-col gap-5 md:gap-6 min-h-[420px] md:min-h-[520px] overflow-hidden"
    >
      {/* Верх: index / icon / label */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon
            className="w-5 h-5 md:w-6 md:h-6"
            style={{ color: accent }}
            strokeWidth={1.75}
          />
          <span
            className="font-p95 text-[12px] md:text-[15px] tracking-[0.22em] uppercase"
            style={{ color: `${accent}CC` }}
          >
            ( {label} )
          </span>
        </div>
        <span className="font-p95 text-[12px] md:text-[15px] tracking-[0.22em] uppercase text-white/30">
          {index} /
        </span>
      </div>

      {/* Заголовок — фиксируем под 2 строки на md+, чтобы круги ниже выровнялись по горизонтали даже при разной длине заголовка. */}
      <h3 className="font-p95 text-[clamp(22px,2.4vw,32px)] uppercase leading-[1.05] text-white md:min-h-[2.4em]">
        {title}
      </h3>

      {/* Pulse-анимация. Фиксированная высота (не flex-1!), чтобы круг
          стоял на одной y-координате во всех плитках. Default — статичный
          серый кадр; hover (десктоп) или scroll-into-view (мобила) — зелёная анимация. */}
      <div className="h-[200px] md:h-[220px] flex items-center justify-center">
        <div className="relative w-[180px] h-[180px]">
          <PulseAnimation
            variant={animation}
            reverse={animationReverse}
            active={mobileActive}
            className="absolute inset-0"
          />
        </div>
      </div>

      {/* Описание */}
      <p className="text-[15px] md:text-[16px] leading-relaxed text-white/60">
        {body}
      </p>

      {/* Низ: items — горизонтальный список через ·.
          mt-auto прижимает блок к низу карточки независимо от длины
          описания/items, чтобы низ всех 3 карточек выровнялся. */}
      <div className="mt-auto pt-4 md:pt-5 border-t border-white/[0.06] text-[15px] md:text-[16px] tracking-[0.04em] text-white/45 leading-relaxed">
        {items.join(" · ")}
      </div>
    </motion.div>
  );
}

// ───────────────────────────────────────────────────────────────────
// SplitSection — лейбл + большой заголовок + контент
// ───────────────────────────────────────────────────────────────────
function SplitSection({
  id,
  label,
  heading,
  children,
  className = "",
  borderTop = true,
  wideRight = false,
}: {
  id?: string;
  label: string;
  heading: string;
  children: React.ReactNode;
  className?: string;
  borderTop?: boolean;
  wideRight?: boolean;
}) {
  return (
    <section
      id={id}
      className={`relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-14 md:py-24 bg-black ${
        borderTop ? "border-t border-white/[0.06]" : ""
      } ${className}`}
    >
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={stagger}
        className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr] gap-8 md:gap-10 lg:gap-16"
      >
        <motion.div variants={fadeUp} className="md:sticky md:top-24 self-start">
          <SectionLabel>{label}</SectionLabel>
          <h2 className="font-p95 text-[clamp(28px,3.5vw,48px)] uppercase mt-2 leading-[0.95]">
            {heading}
          </h2>
        </motion.div>
        <motion.div variants={fadeUp} className={wideRight ? "" : "max-w-[620px]"}>
          {children}
        </motion.div>
      </motion.div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────
// TOOLBOX — ряд инструментов (stokt «Everyday's Toolbox»)
// ───────────────────────────────────────────────────────────────────
const tools: Array<{ name: string; icon: React.ReactNode }> = [
  {
    name: "Figma",
    icon: (
      // Серый по умолчанию (currentColor), на ховер группы — фирменные 5 цветов
      <svg viewBox="0 0 38 57" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"          className="fill-current group-hover:fill-[#1ABCFE] transition-colors" />
        <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"  className="fill-current group-hover:fill-[#0ACF83] transition-colors" />
        <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z"                     className="fill-current group-hover:fill-[#FF7262] transition-colors" />
        <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" className="fill-current group-hover:fill-[#F24E1E] transition-colors" />
        <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" className="fill-current group-hover:fill-[#A259FF] transition-colors" />
      </svg>
    ),
  },
  {
    name: "Photoshop",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <rect x="2" y="2" width="20" height="20" rx="3" strokeWidth="1.5" fill="none"
          className="stroke-current group-hover:stroke-[#31A8FF] transition-colors" />
        <text
          x="12"
          y="16.5"
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="700"
          fontSize="11"
          className="fill-current group-hover:fill-[#31A8FF] transition-colors"
        >
          Ps
        </text>
      </svg>
    ),
  },
  {
    name: "Illustrator",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <rect x="2" y="2" width="20" height="20" rx="3" strokeWidth="1.5" fill="none"
          className="stroke-current group-hover:stroke-[#FF9A00] transition-colors" />
        <text
          x="12"
          y="16.5"
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="700"
          fontSize="11"
          className="fill-current group-hover:fill-[#FF9A00] transition-colors"
        >
          Ai
        </text>
      </svg>
    ),
  },
  {
    name: "Claude",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path className="fill-current group-hover:fill-[#D97757] transition-colors" d="M4.709 15.955l4.72-2.647.079-.23-.079-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.061 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.729-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.929-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312z" />
      </svg>
    ),
  },
  {
    name: "Nano Banana",
    icon: (
      // Сплошной банан-силуэт: серый по умолчанию, жёлтый на ховер
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path
          className="fill-current group-hover:fill-[#FFD60A] transition-colors"
          d="M5.15 17.89c5.52-1.52 8.65-6.89 7-12C11.55 4 11.5 2 13 2c3.22 0 5 5.5 5 8 0 6.5-4.2 12-10.49 12C5.11 22 2 22 2 20c0-1.5 1.14-1.55 3.15-2.11Z"
        />
      </svg>
    ),
  },
  {
    name: "Cursor",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M11.925 24l10.425-6-10.425-6L1.5 18l10.425 6z M22.35 18L11.925 12V0L22.35 6v12z M1.5 18V6l10.425 6v12L1.5 18z" />
      </svg>
    ),
  },
  {
    name: "Seedance",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 15 Q 7.5 5, 12 15 T 21 15" />
        <circle cx="3" cy="15" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="21" cy="15" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "Three.js",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M.38 0a.27.27 0 0 0-.256.332l2.894 12.236a.27.27 0 0 0 .407.17l3.726-2.42 2.504 9.998a.27.27 0 0 0 .41.167L23.877 12.3a.27.27 0 0 0 .046-.416L.565.077A.27.27 0 0 0 .381 0zm.47.602L22.98 11.655l-11.832 7.59L8.614 9.12a.27.27 0 0 0-.408-.169L4.48 11.372z" />
      </svg>
    ),
  },
];

function Toolbox() {
  // 8-плиточный bento с иконками: каждая карточка — иконка тулзы + name.
  // Подзаголовок «без ритуалов и ярлыков» — лёгкая ирония к шаблонным «my stack» секциям.
  return (
    <section className="relative z-[1] bg-black border-t border-white/[0.06]">
      <div className="px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-14 md:py-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          <motion.div
            variants={fadeUp}
            className="mb-8 md:mb-10 flex items-baseline gap-3"
          >
            <SectionLabel>В РАБОТЕ</SectionLabel>
            <span className="text-[15px] md:text-[16px] text-white/40 tracking-[0.06em]">
              без ритуалов и ярлыков
            </span>
          </motion.div>

          <motion.div
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
          >
            {tools.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                title={t.name}
                className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-[#A6FF00]/30 hover:bg-white/[0.035] transition-colors p-5 md:p-6 flex flex-col items-start justify-between min-h-[130px] md:min-h-[150px] overflow-hidden"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 text-white/55 group-hover:text-white transition-colors">
                  {t.icon}
                </div>
                <span className="font-p95 text-[16px] md:text-[15px] tracking-[0.18em] uppercase text-white/70 group-hover:text-white transition-colors">
                  {t.name}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════
export default function PreviewHome() {
  return (
    <>
      <TypographyFix />
      {/* ═══════ HERO — bento-грид: 1 большая content-плитка + 1 photo-плитка + 3 метрики ═══════ */}
      <section className="relative min-h-[100vh] overflow-hidden bg-black">
        {/* Фоновая радиальная подсветка — вне карточек, как amber-lighting студии */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 55% 60% at 85% 55%, rgba(201,166,107,0.18), transparent 60%), radial-gradient(ellipse 45% 50% at 20% 80%, rgba(166,255,0,0.08), transparent 70%)",
          }}
        />

        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="relative z-[2] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] pt-6 md:pt-12 pb-10 md:pb-14"
        >
          {/* Bento: 12-колоночный грид с разными размерами */}
          <div className="grid grid-cols-12 gap-3 md:gap-4">
            {/* === TILE 1+2: ОБЪЕДИНЁННЫЙ ХИРО (col-span-12) — текст слева + сфера справа === */}
            <motion.div
              variants={fadeUp}
              className="col-span-12 order-1 md:order-none"
            >
              <div className="relative rounded-3xl border border-white/[0.1] bg-gradient-to-br from-white/[0.025] via-white/[0.01] to-transparent overflow-hidden md:min-h-[600px]">
                {/* Сфера — на десктопе абсолютно справа, на мобилке банером сверху */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[260px] md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-[40%] pointer-events-none"
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(166,255,0,0.10) 0%, rgba(201,166,107,0.07) 35%, rgba(0,0,0,0) 70%), radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1.2px) 0 0/22px 22px",
                    }}
                  />
                  <ParticleSphere className="absolute inset-0 w-full h-full" />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
                    }}
                  />
                </div>

                {/* Якорь — верхний левый угол всей плитки (над сферой на мобилке) */}
                <div className="absolute top-6 left-6 md:top-10 md:left-10 lg:top-12 lg:left-12 z-[2] font-p95 text-[15px] md:text-[16px] tracking-[0.2em] uppercase text-white/70">
                  <span className="text-[#A6FF00]/80">[</span>
                  <span className="mx-2">Портфолио 2026</span>
                  <span className="text-[#A6FF00]/80">]</span>
                </div>

                {/* Якорь — нижний левый угол */}
                <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 lg:bottom-12 lg:left-12 z-[2] font-p95 text-[16px] md:text-[15px] tracking-[0.2em] uppercase text-white/40 whitespace-nowrap">
                  Москва
                </div>

                {/* Якорь — нижний правый угол */}
                <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 lg:bottom-12 lg:right-12 z-[2] inline-flex items-center gap-2.5 font-p95 text-[16px] md:text-[15px] tracking-[0.2em] uppercase text-white/65 whitespace-nowrap">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A6FF00]/60 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A6FF00]" />
                  </span>
                  Доступен для проектов
                </div>

                {/* Центральный контент — ограничен слева, чтобы не наезжать на сферу.
                    На мобиле justify-start — содержимое сидит сразу под сферой, без огромного gap.
                    На десктопе justify-center — текст ровно центрирован внутри tile. */}
                <div className="relative z-[1] flex flex-col justify-start md:justify-center p-7 md:p-10 lg:p-12 pt-[280px] md:pt-24 pb-20 md:pb-24 md:min-h-[600px]">
                  <div className="flex flex-col gap-6 md:gap-8 md:max-w-[58%]">
                    <h1 className="font-p95 text-[clamp(64px,9vw,128px)] leading-[0.92] uppercase tracking-tight text-white">
                      <span className="block text-white">РАЗВИВАЮ</span>
                      <span className="block">
                        <FlippingWord
                          words={["ЛЮДЕЙ", "КОМАНДЫ", "ВИЗУАЛ", "СЕРВИСЫ", "ИНТЕРЕС"]}
                          className="text-white"
                        />
                      </span>
                    </h1>

                    <p className="max-w-[560px] text-lg md:text-[20px] leading-snug text-white/70 font-light">
                      От стратегии и культуры до AI и цифровых продуктов.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <Link
                        href="https://t.me/egoradi"
                        target="_blank"
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#A6FF00] text-black font-p95 text-[15px] md:text-[16px] tracking-[0.12em] uppercase hover:bg-white transition-colors no-underline"
                      >
                        Обсудить проект
                        <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
                      </Link>
                      <Link
                        href="#portfolio"
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/20 text-white/85 font-p95 text-[15px] md:text-[16px] tracking-[0.12em] uppercase hover:border-white/50 hover:text-white transition-colors no-underline"
                      >
                        Смотреть кейсы
                        <ArrowRight className="w-4 h-4" strokeWidth={2} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* === TILE 3: НАГРАДА · CX'24 (col-span-4) — линкуем на кейс Газпром Нефть ===
                На md (iPad-портрет / iPhone-лендскейп) тайл узкий, трофей требует pr-44
                и крупного клампа "CX'24" — налезает. Поэтому 3-в-ряд только с lg+. */}
            <motion.div
              variants={fadeUp}
              className="col-span-12 lg:col-span-4 order-3 lg:order-none"
            >
              <Link
                href="/cases/gazprom-neft"
                aria-label="Открыть кейс Газпром Нефть — CX Awards 2024"
                className="block h-full no-underline group"
              >
                <div className="relative h-full min-h-[260px] md:min-h-[280px] rounded-2xl border border-[#C9A66B]/30 bg-gradient-to-br from-[#C9A66B]/[0.10] via-[#C9A66B]/[0.04] to-transparent py-5 md:py-6 pl-5 md:pl-6 pr-36 md:pr-44 flex flex-col justify-between gap-4 overflow-hidden transition-all duration-300 group-hover:border-[#C9A66B]/60 group-hover:from-[#C9A66B]/[0.14] group-hover:shadow-[0_0_40px_-8px_rgba(201,166,107,0.28)]">
                  {/* мягкое золотое свечение справа — ambient под трофеем */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-12 top-1/2 -translate-y-1/2 w-[260px] h-[260px] rounded-full opacity-65"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(201,166,107,0.36) 0%, rgba(201,166,107,0.12) 35%, rgba(201,166,107,0) 70%)",
                    }}
                  />

                  {/* Иконка приза справа — крупная, главный визуальный акцент */}
                  <Image
                    src="/images/gpn/prize.png"
                    alt="CX Awards 2024 — приз"
                    width={462}
                    height={616}
                    aria-hidden
                    className="pointer-events-none absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-[130px] md:w-[160px] h-auto opacity-95 group-hover:opacity-100 group-hover:scale-[1.04] transition-all duration-500 drop-shadow-[0_10px_40px_rgba(201,166,107,0.45)]"
                  />

                  {/* Топ-метка */}
                  <div className="relative z-[1]">
                    <span className="inline-flex items-center gap-2 font-p95 text-[16px] md:text-[15px] tracking-[0.2em] uppercase text-[#C9A66B] leading-none">
                      <Trophy className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      Награда · 2024
                    </span>
                  </div>

                  {/* Тело */}
                  <div className="relative z-[1]">
                    <div className="font-p95 text-[clamp(40px,4.6vw,68px)] uppercase tracking-tight text-[#C9A66B] leading-[0.9]">
                      CX&apos;24
                    </div>
                    <div className="text-[16px] md:text-[15px] tracking-[0.14em] uppercase text-white/75 mt-3 font-light">
                      Customer Experience Awards
                    </div>
                  </div>

                  {/* Футер: победитель в сегменте, без стрелки */}
                  <div className="relative z-[1] font-p95 text-[16px] md:text-[15px] tracking-[0.2em] uppercase text-[#C9A66B]/85 leading-none pt-3.5 border-t border-[#C9A66B]/15">
                    Победитель в сегменте B2E
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* === TILE 4: ЭКСПЕРТИЗА (col-span-4) — 3 направления, ссылка на секцию #skills === */}
            <motion.div
              variants={fadeUp}
              className="col-span-12 lg:col-span-4 order-4 lg:order-none"
            >
              <Link
                href="#skills"
                aria-label="Перейти к экспертизе"
                className="block h-full no-underline group"
              >
                <div className="relative h-full min-h-[260px] md:min-h-[280px] rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 md:p-6 flex flex-col justify-between gap-5 overflow-hidden transition-all duration-300 group-hover:border-[#A6FF00]/40 group-hover:bg-white/[0.04]">
                  {/* Топ-метка */}
                  <div className="relative z-[1]">
                    <span className="inline-flex items-center gap-2 font-p95 text-[16px] md:text-[15px] tracking-[0.2em] uppercase text-[#A6FF00] leading-none">
                      <Compass className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      Экспертиза
                    </span>
                  </div>

                  {/* 3 направления — синхронно с секцией #skills */}
                  <ul className="space-y-4 md:space-y-5 relative z-[1]">
                    {[
                      { num: "01", label: "Управление", note: "дизайн-функции и команды" },
                      { num: "02", label: "Продукт", note: "B2C / B2E / EdTech на метрики" },
                      { num: "03", label: "Ремесло", note: "AI и код руками" },
                    ].map((item) => (
                      <li
                        key={item.num}
                        className="flex items-baseline gap-3"
                      >
                        <span className="font-p95 text-[14px] md:text-[15px] tabular-nums tracking-[0.1em] text-[#A6FF00]/60 leading-none w-6 shrink-0">
                          {item.num}
                        </span>
                        <span className="flex-1 leading-tight">
                          <span className="font-p95 text-[16px] md:text-[17px] tracking-[0.18em] uppercase text-white">
                            {item.label}
                          </span>
                          <span className="block text-[12px] md:text-[13px] tracking-[0.06em] uppercase text-white/55 font-light leading-snug mt-1">
                            {item.note}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            </motion.div>

            {/* === TILE 5: В ЦИФРАХ (col-span-4) — три метрики === */}
            <motion.div
              variants={fadeUp}
              className="col-span-12 lg:col-span-4 order-5 lg:order-none"
            >
              <div className="relative h-full min-h-[260px] md:min-h-[280px] rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 md:p-6 flex flex-col gap-8 md:gap-10 overflow-hidden">
                {/* Топ-метка */}
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 shrink-0 text-[#A6FF00]" strokeWidth={1.75} />
                  <span className="font-p95 text-[15px] md:text-[16px] tracking-[0.2em] uppercase text-[#A6FF00] leading-none">
                    В цифрах
                  </span>
                </div>

                {/* Три цифры в ряд */}
                <div className="grid grid-cols-3 gap-3 md:gap-4 flex-1 content-center">
                  {[
                    { value: "30+", label: "запусков" },
                    { value: "9+", label: "лет опыта" },
                    { value: "200+", label: "контактов" },
                  ].map((item, idx) => (
                    <div
                      key={item.value}
                      className={`flex flex-col gap-2 min-w-0 ${
                        idx > 0 ? "border-l border-white/10 pl-3 md:pl-4" : ""
                      }`}
                    >
                      <div className="font-p95 text-[clamp(32px,3.6vw,52px)] uppercase tracking-tight text-[#A6FF00] leading-none">
                        {item.value}
                      </div>
                      <div className="text-[11px] md:text-[12px] tracking-[0.04em] uppercase text-white/55 leading-[1.4] font-light">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

      </section>

      {/* ═══════ EXPERIENCE + COMPANIES ═══════ */}
      <section className="relative z-[1] bg-black border-t border-white/[0.06] overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
          className="px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] pt-14 md:pt-20 pb-6 md:pb-8"
        >
          <motion.div variants={fadeUp}>
            <SectionLabel>ОПЫТ</SectionLabel>
            <h2 className="font-p95 text-[clamp(26px,3.8vw,52px)] uppercase mt-2 leading-[0.95] max-w-3xl">
              9 лет в крупнейших бигтех-компаниях<span className="text-[#A6FF00]">.</span>
            </h2>
          </motion.div>
        </motion.div>

        {/* Marquee — bento-band card с drag-to-spin */}
        <div className="px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] pb-10 md:pb-14">
          <CompanyMarquee />
        </div>
      </section>

      {/* ═══════ PROJECTS — полноширинный асимметричный бенто ═══════ */}
      <section
        id="portfolio"
        className="relative z-[1] bg-black border-t border-white/[0.06] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-14 md:py-20"
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          {/* Топ-4 кейса — равные плитки 2×2 на десктопе */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-5">
            {workProjects.slice(0, 4).map((p, i) =>
              p ? (
                <motion.div key={p.slug ?? i} variants={fadeUp}>
                  <ProjectCard project={p} index={i} />
                </motion.div>
              ) : null,
            )}
          </div>

          {/* Хвост: ещё кейс + ссылка на эксперименты + широкий нижний кейс */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-5 mt-4 md:mt-5">
            {workProjects[4] && (
              <motion.div variants={fadeUp} className="md:col-span-2">
                <ProjectCard project={workProjects[4]} index={4} wide />
              </motion.div>
            )}
            {/* mentorship-agent (workProjects[5]) — кейс про менторскую практику и AI-агентов.
                Кладём его в широкий блок ниже experiments-link, чтобы свежий work-кейс
                закрывал блок проектов на главной. */}
            <motion.div variants={fadeUp}>
              <Link href="/experiments" className="no-underline group block h-full">
                <div className="relative h-full min-h-[280px] md:min-h-[340px] rounded-2xl overflow-hidden border border-white/[0.06] group-hover:border-[#A6FF00]/40 bg-[#0a0a0a] transition-colors duration-300 p-6 md:p-7 flex flex-col justify-between">
                  <div>
                    <div className="font-p95 text-[16px] md:text-[15px] tracking-[0.2em] uppercase text-white/50 mb-3">
                      ЭКСПЕРИМЕНТЫ
                    </div>
                    <h3 className="font-p95 text-[clamp(22px,3vw,36px)] uppercase leading-[0.95] text-white">
                      Код,<br />WebGL,<br />шейдеры.
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm tracking-[0.1em] uppercase text-white/60 group-hover:text-[#A6FF00] transition-colors mt-6">
                    Смотреть
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* workProjects[5] — широкий блок снизу (mentorship-agent) */}
            {workProjects[5] && (
              <motion.div variants={fadeUp} className="md:col-span-3">
                <ProjectCard project={workProjects[5]} index={5} wide />
              </motion.div>
            )}
          </div>
        </motion.div>
      </section>

      {/* ═══════ SERVICES / EXPERTISE — 3-колоночный бенто по мотивам Stokt ═══════ */}
      <section
        id="skills"
        className="relative z-[1] bg-black border-t border-white/[0.06] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-14 md:py-20"
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          {/* Заголовок — meta + мощный слоган */}
          <motion.div variants={fadeUp} className="mb-10 md:mb-14 max-w-4xl">
            <SectionLabel>ЭКСПЕРТИЗА</SectionLabel>
          </motion.div>

          {/* 3 плитки side-by-side — статичный бенто */}
          <div className="grid md:grid-cols-3 gap-3 md:gap-4">
            {[
              {
                key: "management",
                index: "01",
                label: "УПРАВЛЕНИЕ",
                title: "Строю и масштабирую дизайн-функции",
                Icon: Users,
                accent: "#A6FF00",
                animation: "shockwave" as PulseVariant,
                body:
                  "Собираю команды под задачу, выстраиваю процессы, культуру и дизайн-систему. Нанимаю на рост, развиваю лидов, защищаю бюджет. Когда ухожу, стараюсь оставить функцию, которая продолжает расти без меня.",
                items: [
                  "Design Management",
                  "Org Design · Hiring",
                  "Дизайн-процессы",
                  "OKR · Roadmap",
                  "Community · Employer Brand",
                ],
              },
              {
                key: "product",
                index: "02",
                label: "ПРОДУКТ",
                title: "B2C, B2E и EdTech, всегда на метрики",
                Icon: Sparkles,
                accent: "#C9A66B",
                animation: "spiral" as PulseVariant,
                animationReverse: true,
                body:
                  "Работаю на число. Discovery, гипотезы, CJM, A/B, research внутри процесса. Умею считать дизайн и доказывать его ценность продакт-менеджеру и C-левелу. Делаю это в B2C-экосистемах, B2E-инструментах и в EdTech.",
                items: [
                  "B2C-экосистемы",
                  "B2E · внутренние инструменты",
                  "EdTech",
                  "Discovery · Research · CJM · JTBD",
                  "A/B · Product Strategy",
                ],
              },
              {
                key: "craft",
                index: "03",
                label: "РЕМЕСЛО",
                title: "AI и код, руками",
                Icon: Code2,
                accent: "#4FC3F7",
                animation: "wave" as PulseVariant,
                body:
                  "Остаюсь в макетах и в IDE. React, TypeScript, WebGL, AI-инструменты и агенты. Понимаю, что реально сделать руками и сколько это стоит в человеко-часах. Знаю, когда применять AI, а когда позвать эксперта под задачу.",
                items: [
                  "AI-инструменты · агенты",
                  "Prompt engineering",
                  "Figma · Design Systems",
                  "React · TypeScript",
                  "Three.js · WebGL",
                ],
              },
            ].map((tile) => (
              <ServiceTile key={tile.key} tile={tile} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════ PRINCIPLES — тёмный блок ═══════ */}
      <section className="relative z-[1] bg-black border-t border-white/[0.06] overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
          className="px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-16 md:py-24"
        >
          <motion.div variants={fadeUp} className="mb-10 md:mb-14">
            <SectionLabel>ПРИНЦИПЫ</SectionLabel>
          </motion.div>

          {/* Bento-grid: 01 — широкая карточка (col-span-2), 02/03 — обычные, 04 — широкая */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-5">
            {[
              {
                n: "01",
                title: "Дизайн должен считаться",
                body:
                  "Если после релиза метрика не двинулась, работу я не считаю сделанной. Discovery, гипотезы, A/B и обратная связь с продуктом — для меня обязательные этапы, не опциональные.",
                wide: true,
              },
              {
                n: "02",
                title: "Реализация важнее защиты красивых решений",
                body:
                  "Лид, который не открывает свой продукт, быстро теряет контакт с реальностью, а за ним и команда. Я считаю, что все участники отвечают за ошибки в продакшне. Промолчал на ревью — значит согласился.",
              },
              {
                n: "03",
                title: "Команда сильнее героя",
                body:
                  "Десять сильных людей без меня делают больше, чем я один на износе. Нанимаю на рост, даю зоны, поддерживаю мотивацию, помогаю с инструментами развития.",
              },
              {
                n: "04",
                title: "Дизайн делается по любви",
                body:
                  "Чтобы найти новое — надо копать вглубь, а без огня к делу это не получается. Я горю учиться, учить и делиться, поэтому везде собираю комьюнити заинтересованных и разжигаю их интерес ещё больше.",
                wide: true,
              },
            ].map((p) => (
              <motion.div
                key={p.n}
                variants={fadeUp}
                className={`rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04] transition-colors p-7 md:p-10 flex flex-col justify-between min-h-[240px] md:min-h-[280px] ${
                  p.wide ? "md:col-span-2" : ""
                }`}
              >
                <div>
                  <div className="font-p95 text-[15px] md:text-[16px] tracking-[0.2em] uppercase text-white/45 mb-3">
                    {p.n} /
                  </div>
                  <h3 className="font-p95 text-[clamp(22px,3.2vw,44px)] uppercase leading-[0.98] text-white mb-4 max-w-2xl">
                    {p.title}
                  </h3>
                </div>
                <p className="text-sm md:text-[15px] text-white/60 leading-relaxed max-w-2xl">
                  {p.body}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════ ABOUT + CAREER — о себе + hover-list side-by-side ═══════ */}
      <section
        id="about"
        className="relative z-[1] bg-black border-t border-white/[0.06] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-14 md:py-20"
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-8 md:mb-12">
            <SectionLabel>О СЕБЕ</SectionLabel>
          </motion.div>

          {/* Верхний ряд: фото (узкая колонка) + bio + chips + CTA рядом */}
          <div className="grid lg:grid-cols-[minmax(260px,320px)_1fr] gap-6 md:gap-10 mb-12 md:mb-16">
            <motion.div variants={fadeUp}>
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/[0.06]">
                <Image
                  src="/images/photos/photo-3.jpg"
                  alt="Егор Шугаев — дизайн-директор, ментор и независимый консультант"
                  fill
                  className="object-cover grayscale contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-1.5 text-[11px] tracking-[0.2em] uppercase text-white/60">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A6FF00]/60 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#A6FF00]" />
                  </span>
                  Сейчас · МСК
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col">
              {/* 3 параграфа — bio */}
              <div className="space-y-4 md:space-y-5 max-w-2xl">
                <p className="text-sm md:text-[15px] text-white/70 leading-relaxed">
                  Пришёл в дизайн из&nbsp;полиграфии и&nbsp;остался в&nbsp;нём по простой причине: мне нравится узнавать первопричины, искать провалы, растить людей и&nbsp;цифры. В какой-то момент это оказалось не побочным интересом, а&nbsp;рабочей профессией.
                </p>
                <p className="text-sm md:text-[15px] text-white/70 leading-relaxed">
                  Сейчас мне интересна связка «дизайн и&nbsp;AI». Менторю дизайнеров и&nbsp;лидов, экспериментирую сам, пишу код. Иногда поделки получаются криво, но это часть процесса.
                </p>
                <p className="text-sm md:text-[15px] text-white/70 leading-relaxed">
                  Работаю от&nbsp;задачи: строю и&nbsp;автоматизирую процессы, влезаю глубоко — от&nbsp;стратегии до&nbsp;ревью макетов. Задача руководителя, как я&nbsp;её вижу, — дать команде ясность: кто чем занят и&nbsp;зачем. Тогда люди действуют увереннее, а&nbsp;не на&nbsp;ощупь.
                </p>
              </div>

            </motion.div>
          </div>

          {/* Карьера — отдельной строкой, на всю ширину */}
          <motion.div variants={fadeUp} className="pt-8 md:pt-10 border-t border-white/[0.06]">
            <div className="mb-4 flex items-center justify-between">
              <SectionLabel>КАРЬЕРА</SectionLabel>
              <span className="text-[12px] md:text-[15px] tracking-[0.15em] uppercase text-white/35 hidden md:inline">
                Наведи, чтобы раскрыть
              </span>
            </div>
            <CareerHoverList />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════ TESTIMONIALS — с астериксом * (stokt) ═══════ */}
      <section className="relative z-[1] bg-black border-t border-white/[0.06] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-14 md:py-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          {/* Центрированный заголовочный блок: ярлык → крупный хедлайн → астерикс-сноска */}
          <motion.div variants={fadeUp} className="mb-14 md:mb-20 text-center">
            <SectionLabel>ОТЗЫВЫ</SectionLabel>
            <h3 className="mt-5 md:mt-7 font-p95 text-[clamp(40px,8.5vw,128px)] leading-[0.9] uppercase tracking-tight text-white">
              Не&nbsp;верьте мне на&nbsp;слово<Star />
            </h3>
            <p className="mt-5 md:mt-7 font-p95 text-[clamp(18px,2vw,28px)] tracking-[0.22em] uppercase text-[#A6FF00]">
              *&nbsp;Спросите тех, кто со&nbsp;мной работал
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid md:grid-cols-2 gap-4 md:gap-5">
            {[
              {
                quote:
                  "Инноватор, шарит за ИИ. Уравновешенный — принимает только хорошо обдуманные решения. Собирает сильные команды, строит отлаженные процессы. И при этом очень приятный человек.",
                name: "Никита Вишневский",
                role: "Управляющий директор, Райффайзен (ранее — МТС)",
                avatar: "/images/testimonials/vishnevsky.jpeg",
              },
              {
                quote:
                  "Работал с Егором и в Газпром нефти и когда он был в МТС. Лучше чем Егора найти трудно. Он легенда дизайна, ИИ и менеджмента.",
                name: "Егор Гончарук",
                role: "Руководитель проектного офиса, Газпром Нефть",
                avatar: "/images/testimonials/goncharuk.png",
              },
            ].map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                className="relative h-full p-6 md:p-7 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:border-[#A6FF00]/20 transition-colors duration-300 flex flex-col"
              >
                <Quote className="w-5 h-5 text-[#A6FF00]/40 mb-4" strokeWidth={1.5} />
                <p className="text-white/75 text-base md:text-[17px] leading-relaxed">
                  {t.quote}
                </p>
                {/* mt-auto прижимает подпись к низу карточки — выравнивает подписи в обоих кейсах */}
                <div className="mt-auto pt-5 md:pt-6 border-t border-white/[0.06] flex items-center gap-4">
                  <div className="relative shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border border-white/[0.08] bg-white/[0.04]">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-white font-medium leading-tight">{t.name}</div>
                    <div className="text-[15px] text-white/40 mt-1 leading-snug">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════ MENTORING + SPEAKING — 2-up offer-карты ═══════ */}
      <section className="relative z-[1] bg-black border-t border-white/[0.06]">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
          className="px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-14 md:py-20"
        >
          <div className="grid md:grid-cols-2 gap-4 md:gap-5">
            {[
              {
                href: "/mentoring",
                label: "МЕНТОРИНГ",
                title: "Веду дизайнеров на переходе в сеньор-лиды",
                body:
                  "Провёл уже больше 40 менторинг-сессий. Помогаю пройти развилки: как вырасти до лида, как собрать команду, как защитить проект перед топ-менеджментом. Не на каждую развилку у меня есть готовый ответ, но обычно есть похожий опыт.",
                cta: "Записаться на сессию",
                accent: "#A6FF00",
              },
              {
                href: "/speaking",
                label: "ВЫСТУПЛЕНИЯ",
                title: "Выступаю и модерирую секции про AI и дизайн",
                body:
                  "Внутренние конференции МТС и Ozon, Дизайн-Просмотр, ВШЭ (читал курс по прикладному ИИ). Темы: AI в продукте, масштабирование дизайна, дизайн-системы.",
                cta: "Смотреть выступления",
                accent: "#C9A66B",
              },
            ].map((t) => (
              <motion.div key={t.href} variants={fadeUp}>
                <Link href={t.href} className="no-underline group block h-full">
                  <div className="relative h-full rounded-2xl overflow-hidden border border-white/[0.06] group-hover:border-white/20 bg-[#0a0a0a] transition-colors duration-300 p-7 md:p-9 flex flex-col justify-between min-h-[260px]">
                    <div
                      className="absolute top-7 right-7 md:top-9 md:right-9 h-2 w-2 rounded-full"
                      style={{ backgroundColor: t.accent }}
                    />
                    <div>
                      <div className="inline-flex items-center font-p95 text-[15px] md:text-[16px] tracking-[0.2em] uppercase text-white/75 mb-4">
                        {t.label}
                      </div>
                      <h3 className="font-p95 text-[clamp(20px,2.6vw,32px)] uppercase leading-[1] text-white mb-4 max-w-sm">
                        {t.title}
                      </h3>
                      <p className="text-sm md:text-[15px] text-white/55 leading-relaxed max-w-md">
                        {t.body}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-white/55 group-hover:text-white transition-colors mt-6 pt-5 border-t border-white/[0.06]">
                      {t.cta}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════ TOOLBOX — ряд инструментов ═══════ */}
      <Toolbox />

      {/* ═══════ FINAL CTA — счётчик + фейерверк, easter-egg на 15/30/46 кликах ═══════ */}
      <FinalCTA />

      {/* ═══════ CONTACTS — bento-грид из action-тайлов ═══════ */}
      <section
        id="contacts"
        className="relative z-[1] bg-black border-t border-white/[0.06] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-14 md:py-20"
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-8 md:mb-10">
            <SectionLabel>КОНТАКТЫ</SectionLabel>
          </motion.div>

          {/* Bento 4×N: Telegram — широкая (col-span-2), Email/LI/GH/CV — 4 одинарных, Location — col-span-2, Accepting — col-span-2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {/* 1. Telegram — главная широкая плитка */}
            <motion.div variants={fadeUp} className="col-span-2 md:col-span-2 md:row-span-2">
              <Link
                href="https://t.me/egoradi"
                target="_blank"
                className="group no-underline block h-full"
              >
                <div className="relative h-full min-h-[180px] md:min-h-[260px] rounded-2xl overflow-hidden border border-[#A6FF00]/30 bg-[#A6FF00] hover:bg-[#B8FF33] transition-colors p-6 md:p-8 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="font-p95 text-[15px] md:text-[16px] tracking-[0.2em] uppercase text-black/60">
                      TELEGRAM
                    </div>
                    <Send className="w-5 h-5 md:w-6 md:h-6 text-black" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="font-p95 text-[clamp(28px,4.5vw,56px)] uppercase leading-[0.95] text-black">
                      @egoradi
                    </div>
                    <div className="mt-3 inline-flex items-center gap-2 text-[16px] md:text-[15px] tracking-[0.12em] uppercase text-black/70 group-hover:text-black transition-colors">
                      Написать
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2.2} />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* 2-5. Email, LinkedIn, GitHub, CV — 4 равных мини-плитки */}
            {[
              { label: "Email", value: "egor.outhead@gmail.com", href: "mailto:egor.outhead@gmail.com", Icon: Mail },
              { label: "LinkedIn", value: "egorshugaev", href: "https://www.linkedin.com/in/egorshugaev/", Icon: LinkedinIcon },
              { label: "GitHub", value: "outhead", href: "https://github.com/outhead", Icon: GithubIcon },
              { label: "CV / PDF", value: "Скачать", href: "/Egor_Shugaev_CV.pdf", Icon: FileDown },
            ].map((link) => (
              <motion.div key={link.label} variants={fadeUp}>
                <Link
                  href={link.href}
                  target="_blank"
                  className="group no-underline block h-full"
                >
                  <div className="relative h-full min-h-[120px] md:min-h-[130px] rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.015] hover:border-white/[0.2] hover:bg-white/[0.035] transition-colors p-5 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="font-p95 text-[12px] md:text-[15px] tracking-[0.2em] uppercase text-white/50">
                        {link.label.toUpperCase()}
                      </div>
                      <link.Icon className="w-4 h-4 text-white/45 group-hover:text-white transition-colors" strokeWidth={1.75} />
                    </div>
                    <div className="font-p95 text-[15px] md:text-[16px] tracking-[0.05em] text-white/80 group-hover:text-white transition-colors leading-tight truncate">
                      {link.value}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}

            {/* 6. Location — компактная плитка, глобус в исходном размере (видна только верхняя часть, нижняя обрезается overflow-hidden) */}
            <motion.div variants={fadeUp} className="col-span-2 md:col-span-4">
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a] min-h-[200px] md:min-h-[220px]">
                {/* Текст — по центру сверху, поверх глобуса */}
                <div className="relative z-[2] flex flex-col items-center gap-2.5 pt-7 md:pt-9 px-5 text-center">
                  <h4 className="font-p95 text-[clamp(20px,2.4vw,30px)] uppercase tracking-[0.02em] text-white">
                    Москва, Россия
                  </h4>
                  <div className="inline-flex items-center gap-2.5 font-p95 text-[12px] md:text-[15px] tracking-[0.22em] uppercase text-white/55">
                    <span className="relative inline-flex items-center justify-center w-3 h-3">
                      <span className="absolute inset-0 rounded-full bg-[#A6FF00]/30 animate-ping" />
                      <span className="relative w-2 h-2 rounded-full bg-[#A6FF00] shadow-[0_0_10px_#A6FF00]" />
                    </span>
                    Открыт к работе по всему миру
                  </div>
                </div>
                {/* Глобус большого размера — выходит за нижний край плитки, видна только верхняя часть.
                    Квадратный контейнер width=ширина плитки, top=110px → верхушка диска вписана под текст. */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-[110px] md:top-[120px] aspect-square pointer-events-auto"
                  style={{ width: "min(560px, 92%)" }}
                >
                  <DotGlobe />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </>
  );
}

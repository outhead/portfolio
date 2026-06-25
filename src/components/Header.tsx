"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LedLogo from "@/components/LedLogo";
import LedText from "@/components/LedText";
import { PixelGlyph } from "@/components/OledKit";

/** Пиксельный «документ со стрелкой вниз» — иконка CV в языке LED-точек. */
const GLYPH_FILE_DOWN = [
  "11111100",
  "10000110",
  "10000111",
  "10000001",
  "10011001",
  "10011001",
  "10111101",
  "10011001",
  "11111111",
];

/** Пиксельное подчёркивание — ряд LED-точек вместо сплошной линии. */
function PixelUnderline({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute -bottom-1.5 left-0 h-[3px] text-[#A6FF00] transition-all duration-300 ${
        active ? "w-full" : "w-0 group-hover:w-full"
      }`}
      style={{
        backgroundImage: "radial-gradient(circle, currentColor 1.1px, transparent 1.3px)",
        backgroundSize: "5px 3px",
        backgroundPosition: "0 50%",
        backgroundRepeat: "repeat-x",
      }}
    />
  );
}

const navLinks: Array<{ href: string; label: string; goal: string }> = [
  { href: "/#portfolio", label: "Работы", goal: "nav_portfolio" },
  { href: "/experiments", label: "Эксперименты", goal: "nav_experiments" },
  { href: "/speaking", label: "Выступления", goal: "nav_speaking" },
  { href: "/mentoring", label: "Менторинг", goal: "nav_mentoring" },
];

const sectionIds = ["portfolio", "about", "contacts"];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [headerSolid, setHeaderSolid] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? scrollTop / docHeight : 0);
      setHeaderSolid(scrollTop > 80);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Intersection Observer for active nav
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        btnRef.current?.focus();
      }
    },
    [menuOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <motion.div
        className="scroll-progress"
        style={{ scaleX: scrollProgress, transformOrigin: "0% 50%" }}
      />
      <header
        role="banner"
        className={`fixed top-0 left-0 right-0 z-[100] flex justify-between items-center px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] py-4 md:py-5 border-b transition-all duration-300 relative ${
          headerSolid
            ? "bg-black/60 backdrop-blur-xl border-white/[0.06]"
            : "bg-transparent border-transparent"
        }`}
      >
        <Link
          href="/"
          aria-label="Главная"
          onMouseEnter={() => { if (typeof window !== "undefined") window.dispatchEvent(new Event("hero:home")); }}
          className="inline-flex items-center gap-3 md:gap-3.5 no-underline"
        >
          <LedLogo className="h-[12px] md:h-[11px] 2xl:h-[12px] w-auto" />
        </Link>

        <nav aria-label="Основная навигация" className="hidden md:flex gap-4 lg:gap-6 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
          {navLinks.map((link) => {
            // Определяем активный пункт: для якорей — по активной секции на главной,
            // для внешних страниц (/experiments, /speaking, /mentoring) — по pathname
            const isAnchor = link.href.startsWith("/#");
            const isActive = isAnchor
              ? pathname === "/" && activeSection === link.href.replace("/#", "")
              : pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                data-ym-goal={link.goal}
                aria-label={link.label}
                className={`relative no-underline transition-colors duration-200 group min-h-[44px] flex items-center ${
                  isActive ? "text-white" : "text-white/65 hover:text-white"
                }`}
              >
                <LedText text={link.label} className="h-[11px] 2xl:h-[12px] w-auto" />
                <PixelUnderline active={isActive} />
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/Egor_Shugaev_CV.pdf"
            target="_blank"
            data-ym-goal="cta_cv"
            data-ym-goal-params='{"placement":"header"}'
            aria-label="Скачать CV"
            className="inline-flex items-center gap-1.5 text-white/65 no-underline hover:text-white transition-colors border border-white/[0.08] hover:border-white/25 rounded px-3 py-2 min-h-[44px]"
          >
            <PixelGlyph rows={GLYPH_FILE_DOWN} className="h-[13px] w-auto text-[#A6FF00]" />
            <LedText text="CV" className="h-[11px] w-auto" />
          </Link>
        </div>

        {/* Mobile burger — 44px touch target */}
        <button
          ref={btnRef}
          className="md:hidden bg-transparent border-none p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/70"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              ref={menuRef}
              id="mobile-nav"
              role="navigation"
              aria-label="Мобильная навигация"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/[0.04] md:hidden"
            >
              <nav className="flex flex-col p-6 gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    data-ym-goal={link.goal}
                    data-ym-goal-params='{"placement":"mobile_menu"}'
                    aria-label={link.label}
                    className="text-white/65 no-underline hover:text-[#A6FF00] transition-colors min-h-[44px] flex items-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LedText text={link.label} className="h-[12px] w-auto" />
                  </Link>
                ))}
                <Link
                  href="/Egor_Shugaev_CV.pdf"
                  target="_blank"
                  data-ym-goal="cta_cv"
                  data-ym-goal-params='{"placement":"mobile_menu"}'
                  aria-label="Скачать CV"
                  className="inline-flex items-center gap-2 text-white/40 no-underline hover:text-white/60 transition-colors mt-2 pt-4 border-t border-white/[0.06] min-h-[44px]"
                >
                  <PixelGlyph rows={GLYPH_FILE_DOWN} className="h-[14px] w-auto text-[#A6FF00]" />
                  <LedText text="Скачать CV" className="h-[12px] w-auto" />
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

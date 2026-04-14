"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { FileDown, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/#portfolio", label: "Работы" },
  { href: "/#experiments", label: "Эксперименты" },
  { href: "/#about", label: "Обо мне" },
  { href: "/#public", label: "Публично" },
  { href: "/mentoring", label: "Менторинг" },
  { href: "/#contacts", label: "Контакты" },
];

const sectionIds = ["portfolio", "experiments", "about", "public", "contacts"];

export default function Header() {
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
        className={`fixed top-0 left-0 right-0 z-[100] flex justify-between items-center px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-4 md:py-5 backdrop-blur-xl border-b transition-all duration-300 ${
          headerSolid
            ? "bg-black/85 border-white/[0.06]"
            : "bg-black/50 border-transparent"
        }`}
      >
        <Link
          href="/"
          aria-label="Главная"
          className="font-p95 text-sm text-white no-underline tracking-wider hover:opacity-70 transition-opacity"
        >
          ЕШ
        </Link>

        <nav aria-label="Основная навигация" className="hidden md:flex gap-6">
          {navLinks.map((link) => {
            const sectionId = link.href.replace("/#", "");
            const isActive = activeSection === sectionId;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-[11px] font-normal tracking-[0.1em] uppercase no-underline transition-colors duration-200 group min-h-[44px] flex items-center ${
                  isActive ? "text-white" : "text-white/55 hover:text-white"
                }`}
              >
                {link.label}
                <span className={`absolute -bottom-1 left-0 h-px bg-[#A6FF00] transition-all duration-300 ${
                  isActive ? "w-full" : "w-0 group-hover:w-full"
                }`} />
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/Egor_Shugaev_CV.pdf"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase text-white/55 no-underline hover:text-white transition-colors border border-white/[0.08] hover:border-white/25 rounded px-3 py-2 min-h-[44px]"
          >
            <FileDown className="w-3 h-3" strokeWidth={2} />
            CV
          </Link>
          <span className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.12em] uppercase text-[#A6FF00]/80">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A6FF00]/60 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#A6FF00]" />
            </span>
            Open to work
          </span>
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
                    className="text-sm tracking-[0.1em] uppercase text-white/65 no-underline hover:text-[#A6FF00] transition-colors min-h-[44px] flex items-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/Egor_Shugaev_CV.pdf"
                  target="_blank"
                  className="inline-flex items-center gap-2 text-sm tracking-[0.1em] uppercase text-white/40 no-underline hover:text-white/60 transition-colors mt-2 pt-4 border-t border-white/[0.06] min-h-[44px]"
                >
                  <FileDown className="w-3.5 h-3.5" strokeWidth={2} />
                  Скачать CV
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

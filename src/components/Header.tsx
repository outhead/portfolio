"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { FileDown, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/#open-to", label: "Открыт к" },
  { href: "/#about", label: "Обо мне" },
  { href: "/#portfolio", label: "Работы" },
  { href: "/#public", label: "Публично" },
  { href: "/#mentoring", label: "Менторинг" },
  { href: "/#contacts", label: "Контакты" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [headerSolid, setHeaderSolid] = useState(false);

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

  return (
    <>
      <motion.div
        className="scroll-progress"
        style={{ scaleX: scrollProgress, transformOrigin: "0% 50%" }}
      />
      <header
        className={`fixed top-0 left-0 right-0 z-[100] flex justify-between items-center px-5 md:px-10 py-4 md:py-5 backdrop-blur-xl border-b transition-all duration-300 ${
          headerSolid
            ? "bg-black/85 border-white/[0.06]"
            : "bg-black/50 border-transparent"
        }`}
      >
        <Link
          href="/"
          className="font-p95 text-sm text-white no-underline tracking-wider hover:opacity-70 transition-opacity"
        >
          ЕШ
        </Link>

        <nav className="hidden md:flex gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-[11px] font-normal tracking-[0.1em] uppercase text-white/45 no-underline hover:text-white transition-colors duration-200 group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-[#A6FF00] transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/Egor_Shugaev_CV.pdf"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase text-white/50 no-underline hover:text-white transition-colors border border-white/[0.08] hover:border-white/25 rounded px-3 py-1.5"
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

        {/* Mobile burger */}
        <button
          className="md:hidden bg-transparent border-none p-2 text-white/70"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
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
                    className="text-sm tracking-[0.1em] uppercase text-white/60 no-underline hover:text-[#A6FF00] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/Egor_Shugaev_CV.pdf"
                  target="_blank"
                  className="inline-flex items-center gap-2 text-sm tracking-[0.1em] uppercase text-white/30 no-underline hover:text-white/50 transition-colors mt-2 pt-4 border-t border-white/[0.06]"
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

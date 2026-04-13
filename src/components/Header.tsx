"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [headerSolid, setHeaderSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? scrollTop / docHeight : 0);
      setHeaderSolid(scrollTop > 80);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div
        className="scroll-progress"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />
      <header
        className={`fixed top-0 left-0 right-0 z-[100] flex justify-between items-center px-5 md:px-10 py-4 md:py-6 backdrop-blur-xl border-b border-white/[0.04] transition-colors duration-300 ${
          headerSolid ? "bg-black/80" : "bg-black/60"
        }`}
      >
        <Link
          href="/"
          className="font-p95 text-sm text-white no-underline tracking-wider hover:opacity-70 transition-opacity"
        >
          ЕШ
        </Link>

        <nav className="hidden md:flex gap-7">
          {[
            { href: "/#open-to", label: "Открыт к" },
            { href: "/#about", label: "Обо мне" },
            { href: "/#portfolio", label: "Работы" },
            { href: "/#public", label: "Публично" },
            { href: "/#mentoring", label: "Менторинг" },
            { href: "/#contacts", label: "Контакты" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[11px] font-normal tracking-[0.1em] uppercase text-white/30 no-underline hover:text-white/80 transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/Egor_Shugaev_CV.pdf"
            target="_blank"
            className="text-[9px] tracking-[0.12em] uppercase text-white/20 no-underline hover:text-white/50 transition-colors border border-white/[0.06] hover:border-white/[0.12] rounded px-3 py-1.5"
          >
            CV ↓
          </Link>
          <span className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.12em] uppercase text-green-400/70">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400/60 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400/80" />
            </span>
            Open to work
          </span>
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden bg-transparent border-none p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span
            className={`block w-6 h-px bg-white/60 transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`}
          />
          <span
            className={`block w-6 h-px bg-white/60 my-[6px] transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-6 h-px bg-white/60 transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`}
          />
        </button>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/[0.04] md:hidden mobile-menu-enter">
            <nav className="flex flex-col p-6 gap-4">
              {[
                { href: "/#open-to", label: "Открыт к" },
                { href: "/#about", label: "Обо мне" },
                { href: "/#portfolio", label: "Работы" },
                { href: "/#public", label: "Публично" },
                { href: "/#mentoring", label: "Менторинг" },
                { href: "/#contacts", label: "Контакты" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm tracking-[0.1em] uppercase text-white/50 no-underline hover:text-white transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/Egor_Shugaev_CV.pdf"
                target="_blank"
                className="text-sm tracking-[0.1em] uppercase text-white/30 no-underline hover:text-white/50 transition-colors mt-2 pt-4 border-t border-white/[0.06]"
              >
                Скачать CV ↓
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

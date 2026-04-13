import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-[1] border-t border-white/[0.04] px-5 md:px-10 py-4 bg-black/75">
      <div className="flex justify-between flex-wrap gap-4 text-[9px] tracking-[0.12em] uppercase text-white/10">
        <div className="flex gap-6">
          <Link
            href="https://t.me/egoradi"
            target="_blank"
            className="text-white/10 no-underline hover:text-white/40 transition-colors"
          >
            Telegram
          </Link>
          <Link
            href="mailto:egor.outhead@gmail.com"
            className="text-white/10 no-underline hover:text-white/40 transition-colors"
          >
            Email
          </Link>
          <Link
            href="https://github.com/outhead"
            target="_blank"
            className="text-white/10 no-underline hover:text-white/40 transition-colors"
          >
            GitHub
          </Link>
          <Link
            href="https://www.linkedin.com/in/egorshugaev/"
            target="_blank"
            className="text-white/10 no-underline hover:text-white/40 transition-colors"
          >
            LinkedIn
          </Link>
        </div>
        <div>Егор Шугаев © 2026</div>
      </div>
    </footer>
  );
}

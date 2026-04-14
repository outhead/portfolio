import Link from "next/link";
import { Send, Mail, ArrowUp } from "lucide-react";

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

const links = [
  { href: "https://t.me/egoradi", label: "Telegram", Icon: Send },
  { href: "mailto:egor.outhead@gmail.com", label: "Email", Icon: Mail },
  { href: "https://github.com/outhead", label: "GitHub", Icon: GithubIcon },
  { href: "https://www.linkedin.com/in/egorshugaev/", label: "LinkedIn", Icon: LinkedinIcon },
];

export default function Footer() {
  return (
    <footer className="relative z-[1] border-t border-white/[0.06] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] py-6 md:py-8 bg-black">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-5">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              target="_blank"
              aria-label={l.label}
              className="text-white/35 no-underline hover:text-white/70 transition-colors min-h-[44px] flex items-center"
            >
              <l.Icon className="w-4 h-4" strokeWidth={1.75} />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4 text-[10px] tracking-[0.12em] uppercase text-white/25">
          <span>Егор Шугаев © {new Date().getFullYear()}</span>
          <Link
            href="#"
            aria-label="Наверх"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/[0.08] text-white/30 hover:text-white/60 hover:border-white/20 transition-colors no-underline"
          >
            <ArrowUp className="w-3.5 h-3.5" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </footer>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://portfolio-egors-projects-baaaa1ca.vercel.app"),
  title: "Егор Шугаев — Дизайн-директор · Fractional CDO · Ментор",
  description:
    "11 лет в дизайне, 9 — в Big Tech России: МТС (Art Director B2C и Design Director), Ozon (Community Lead), Газпром Нефть (Head of Design), MWS AI (AI Visioner). 11М+ пользователей, 100+ дизайнеров, CX Award 2024. Сейчас — Fractional CDO, advisory, менторинг.",
  keywords: [
    "дизайн-директор",
    "head of design",
    "design director",
    "AI visioner",
    "product design",
    "AI design",
    "UX/UI",
    "design management",
    "design systems",
    "Figma",
    "ментор дизайнеров",
    "design consulting",
    "МТС",
    "Ozon",
    "Газпром Нефть",
    "MWS AI",
  ],
  authors: [{ name: "Егор Шугаев", url: "https://portfolio-egors-projects-baaaa1ca.vercel.app" }],
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  openGraph: {
    title: "Егор Шугаев — Дизайн-директор · Fractional CDO · Ментор",
    description:
      "11 лет в дизайне, 9 — в Big Tech: МТС, Ozon, Газпром Нефть, MWS AI. 11М+ пользователей, 100+ дизайнеров, CX Award 2024.",
    type: "website",
    locale: "ru_RU",
    url: "https://portfolio-egors-projects-baaaa1ca.vercel.app",
    siteName: "Егор Шугаев · Портфолио",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Егор Шугаев — Дизайн-директор, ментор и независимый консультант",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Егор Шугаев — Дизайн-директор · Fractional CDO · Ментор",
    description: "11 лет в дизайне, 9 — в Big Tech. Сейчас — Fractional CDO, advisory, менторинг.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#000000" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Фикс «рефреш открывает низ страницы»:
            - отключаем scroll-restoration браузера,
            - срезаем #hash (частая причина прыжка к #contacts),
            - форсим scroll(0,0) в трёх точках загрузки (head, DOMContentLoaded, load),
            - только после load включаем .js-scroll-smooth, чтобы якорные клики остались плавными. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  if ('scrollRestoration' in history) {
                    history.scrollRestoration = 'manual';
                  }
                  // Убираем #hash, чтобы браузер не прыгал к якорю на загрузке
                  if (window.location.hash) {
                    history.replaceState(
                      null,
                      '',
                      window.location.pathname + window.location.search
                    );
                  }
                  var toTop = function () { window.scrollTo(0, 0); };
                  toTop();
                  document.addEventListener('DOMContentLoaded', toTop);
                  window.addEventListener('load', function () {
                    toTop();
                    requestAnimationFrame(function () {
                      document.documentElement.classList.add('js-scroll-smooth');
                    });
                  });
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Егор Шугаев",
              alternateName: "Egor Shugaev",
              givenName: "Егор",
              familyName: "Шугаев",
              jobTitle: [
                "Design Director",
                "Fractional CDO",
                "Independent Design Consultant",
                "AI Visioner",
                "Mentor",
              ],
              worksFor: {
                "@type": "Organization",
                name: "Независимый консультант",
              },
              email: "egor.outhead@gmail.com",
              url: "https://portfolio-egors-projects-baaaa1ca.vercel.app",
              image: "https://portfolio-egors-projects-baaaa1ca.vercel.app/images/photos/photo-5.jpg",
              sameAs: [
                "https://t.me/egoradi",
                "https://github.com/outhead",
                "https://www.linkedin.com/in/egorshugaev/",
                "https://x.com/egoradi",
              ],
              knowsAbout: [
                "Product Design",
                "Design Management",
                "AI/ML Products",
                "Design Systems",
                "UX/UI Research",
                "Design Leadership",
                "B2C Design",
                "B2B Design",
                "Mobile Design",
                "Enterprise Software",
                "Mentoring",
              ],
              hasCredential: [
                {
                  "@type": "EducationalOccupationalCredential",
                  name: "CX Awards 2024 Winner",
                  credentialCategory: "Award",
                },
              ],
              award: [
                "CX Awards 2024 - Unified Service Portal (ESO) Design",
              ],
              description:
                "Дизайн-директор с 11 годами опыта в крупнейших технологических компаниях России: МТС (Art Director B2C-экосистемы, Design Director), Ozon (Community Lead), Газпром Нефть (Head of Design, CX Award 2024), MWS AI (AI Visioner). Специалист в дизайн-системах, управлении дизайн-командами и AI-продуктах. Сейчас на свободном графике: менторинг, консалтинг, независимые проекты.",
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[300] focus:bg-[#A6FF00] focus:text-black focus:px-4 focus:py-2 focus:rounded focus:text-sm focus:font-semibold"
        >
          Перейти к содержимому
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

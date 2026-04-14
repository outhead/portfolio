import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://portfolio-egors-projects-baaaa1ca.vercel.app"),
  title: "Егор Шугаев — Дизайн-директор, Head of Design AI Division",
  description:
    "Дизайн-директор с 8+ годами опыта в МТС, OZON, Газпром Нефть. Руковожу дизайном B2C-экосистемы и AI-дивизиона (40+ дизайнеров). Специалист в дизайн-системах, AI/ML продуктах и масштабировании команд. Ментор и консультант.",
  keywords: [
    "дизайн-директор",
    "head of design",
    "product design",
    "AI design",
    "UX/UI",
    "design management",
    "design systems",
    "Figma",
    "ментор дизайнеров",
    "МТС",
    "OZON",
    "Газпром Нефть",
  ],
  authors: [{ name: "Егор Шугаев", url: "https://portfolio-egors-projects-baaaa1ca.vercel.app" }],
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  openGraph: {
    title: "Егор Шугаев — Дизайн-директор, Head of Design AI Division",
    description:
      "Руковожу дизайном B2C-экосистемы и AI-дивизиона МТС. 8.8М+ пользователей, 100+ дизайнеров, CX Award 2024.",
    type: "website",
    locale: "ru_RU",
    url: "https://portfolio-egors-projects-baaaa1ca.vercel.app",
    siteName: "Егор Шугаев · Портфолио",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Егор Шугаев — Head of Design, AI Division, МТС",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Егор Шугаев — Дизайн-директор, Head of Design AI Division",
    description: "Руковожу дизайном B2C-экосистемы и AI-дивизиона МТС.",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
                "Head of Design, AI Division",
                "Design Director",
                "Design Manager",
              ],
              worksFor: {
                "@type": "Organization",
                name: "МТС",
                url: "https://mts.ru",
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
                "Дизайн-директор с 8+ годами опыта в крупнейших технологических компаниях России (МТС, OZON, Газпром Нефть). Руковожу дизайном B2C-экосистемы и AI-дивизиона. Специалист в дизайн-системах, управлении дизайн-командами и AI-продуктах. Ментор для продуктовых дизайнеров и консультант по дизайн-трансформации.",
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
        <div className="grid-overlay" />
      </body>
    </html>
  );
}

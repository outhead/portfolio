import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Egor Shugaev — Design Director · Consultant · Mentor",
  description:
    "11 years in design, 7 in leadership across Russia's big tech: MTS (Art Director B2C and Design Director), Ozon (Community Lead), Gazprom Neft (Head of Design), MWS AI (AI Visioner). 11M+ users, 100+ designers, CX Award 2024. Now consulting, advisory and mentoring.",
  keywords: [
    "design director",
    "head of design",
    "AI visioner",
    "product design",
    "AI design",
    "UX/UI",
    "design management",
    "design systems",
    "Figma",
    "design mentor",
    "design consulting",
    "MTS",
    "Ozon",
    "Gazprom Neft",
    "MWS AI",
  ],
  openGraph: {
    title: "Design Director · Consultant · Mentor",
    description: "11 years in design, 7 in leadership across big tech.",
    type: "website",
    locale: "en_US",
    url: "https://shugaev.vercel.app/en",
    siteName: "Egor Shugaev · Portfolio",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Egor Shugaev — Design Director, mentor and independent consultant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Design Director · Consultant · Mentor",
    description: "11 years in design, 7 in leadership across big tech.",
    images: ["/og-image.png"],
  },
  alternates: {
    languages: { ru: "/", en: "/en" },
  },
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return children;
}

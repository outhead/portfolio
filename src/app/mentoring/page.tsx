import type { Metadata } from "next";
import MentoringContent from "./mentoring-content";

export const metadata: Metadata = {
  title: "Менторинг — Егор Шугаев",
  description:
    "Менторинг для дизайнеров и лидов: 1-on-1 сессии, карьерный трекинг, мастерклассы. 7 лет опыта управления в МТС, Ozon, Газпром Нефти.",
  openGraph: {
    title: "Менторинг — Егор Шугаев",
    description:
      "Помогаю дизайнерам и лидам расти. Индивидуальные консультации, карьерный трекинг, воркшопы по AI-инструментам.",
    type: "website",
  },
};

export default function MentoringPage() {
  return <MentoringContent />;
}

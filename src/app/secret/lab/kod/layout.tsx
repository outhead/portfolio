import type { Metadata } from "next";

// Код загадки спрятан в МЕТА-ОПИСАНИИ страницы (видно в превью вкладки/закладки,
// в выдаче, во view-source) — но не на самом экране. Сектор 4 · Узел 6 · Шлюз 8 · Ключ 8 = 4688.
export const metadata: Metadata = {
  title: "Терминал · Загадка №3 — Егор Шугаев",
  description: "Дизайн-директор · Консультант · Ментор · Сектор 4 · Узел 6 · Шлюз 8 · Ключ 8",
};

export default function KodLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

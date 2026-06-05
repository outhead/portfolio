import type { Metadata } from "next";

// Код загадки спрятан в ЗАГОЛОВКЕ ВКЛАДКИ (title) — но не на самом экране.
// Сектор 4 · Узел 6 · Шлюз 8 · Ключ 8 = 4688.
export const metadata: Metadata = {
  title: "Терминал · Сектор 4 · Узел 6 · Шлюз 8 · Ключ 8",
  description: "Дизайн-директор · Консультант · Ментор",
};

export default function KodLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

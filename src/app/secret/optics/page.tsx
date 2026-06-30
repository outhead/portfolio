import type { Metadata } from "next";
import OpticsEditor from "@/components/OpticsEditor";

export const metadata: Metadata = {
  title: "Optics — редактор уровня",
  robots: { index: false, follow: false },
};

export default function OpticsEditorPage() {
  return (
    <main className="min-h-screen bg-black text-white px-5 md:px-[8%] py-12">
      <h1 className="text-[20px] md:text-[26px] font-semibold mb-2">Редактор уровня — призмы и зеркало</h1>
      <p className="text-[14px] text-white/55 mb-8 max-w-[640px]">
        Собери раскладку: где стартуют камни и зеркало, где стоят цели и какого они цвета.
        Двигаешь элементы — лучи считаются вживую, видно решение. Скопируй JSON и пришли — поставлю как уровень.
      </p>
      <OpticsEditor />
    </main>
  );
}

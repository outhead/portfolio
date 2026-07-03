"use client";

import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";

/** Видимый текст-шапка редактора уровня. Вынесено в клиентский компонент,
 *  чтобы сама страница осталась серверной (metadata) — рендер-текст локализуется здесь. */
export default function OpticsEditorIntro() {
  const locale = useLocale();
  return (
    <>
      <h1 className="text-[20px] md:text-[26px] font-semibold mb-2">
        {pick("Редактор уровня — призмы и зеркало", "Level editor — prisms and mirror", locale)}
      </h1>
      <p className="text-[14px] text-white/55 mb-8 max-w-[640px]">
        {pick(
          "Собери раскладку: где стартуют камни и зеркало, где стоят цели и какого они цвета. Двигаешь элементы — лучи считаются вживую, видно решение. Скопируй JSON и пришли — поставлю как уровень.",
          "Lay out the scene: where the stones and the mirror start, where the targets stand and their colors. Move the elements — the rays are computed live, the solution is visible. Copy the JSON and send it over — I'll set it up as a level.",
          locale,
        )}
      </p>
    </>
  );
}

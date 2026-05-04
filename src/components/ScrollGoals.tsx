"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ymGoal } from "@/lib/yandex-metrika";

/**
 * Шлёт цели `scroll_50` и `scroll_100` один раз за просмотр страницы.
 * Сбрасывается при смене pathname — то есть на каждой странице цели
 * могут сработать заново.
 *
 * 100% — считаем по правому нижнему краю окна (с допуском 24px),
 * чтобы цель не зависела от 1-2 пикселей субпиксельного скролла.
 */
export default function ScrollGoals() {
  const pathname = usePathname();
  const fired50 = useRef(false);
  const fired100 = useRef(false);

  useEffect(() => {
    fired50.current = false;
    fired100.current = false;
  }, [pathname]);

  useEffect(() => {
    let ticking = false;

    const compute = () => {
      ticking = false;
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const viewport = window.innerHeight;
      const fullHeight = doc.scrollHeight;
      const scrollable = fullHeight - viewport;
      if (scrollable <= 0) return;

      const ratio = scrollTop / scrollable;

      if (!fired50.current && ratio >= 0.5) {
        fired50.current = true;
        ymGoal("scroll_50", { path: pathname ?? "/" });
      }
      if (!fired100.current && scrollTop + viewport + 24 >= fullHeight) {
        fired100.current = true;
        ymGoal("scroll_100", { path: pathname ?? "/" });
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(compute);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    // Сразу проверим — короткие страницы могут сразу быть «видимы целиком».
    compute();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return null;
}

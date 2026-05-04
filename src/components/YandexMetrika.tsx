"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { YM_COUNTER_ID, ymGoal, ymHit, isYmEnabled } from "@/lib/yandex-metrika";

/**
 * Компонент монтируется один раз в layout и:
 *  1. Загружает скрипт Я.Метрики (с Webvisor, картой кликов, точным показателем
 *     отказа и учётом хешей).
 *  2. На каждом клиентском переходе шлёт hit с актуальным URL — иначе App Router
 *     не сгенерирует «просмотр страницы» для Метрики.
 *  3. Делегированно слушает клики по элементам с атрибутом `data-ym-goal` —
 *     любой <a>/<button> с этим атрибутом автоматически шлёт цель,
 *     без правок onClick по всему сайту.
 *     Опциональный `data-ym-goal-params` — JSON с доп. параметрами визита.
 */
export default function YandexMetrika() {
  if (YM_COUNTER_ID === null) {
    // Без ключа — ничего не рендерим (например, локальный preview).
    return null;
  }

  return (
    <>
      <Script id="yandex-metrika-init" strategy="afterInteractive">
        {`
          (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

          ym(${YM_COUNTER_ID}, "init", {
            clickmap: true,
            trackLinks: true,
            accurateTrackBounce: true,
            webvisor: true,
            trackHash: true,
            defer: false
          });
        `}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${YM_COUNTER_ID}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
      <Suspense fallback={null}>
        <RouteChangeTracker />
      </Suspense>
      <ClickGoalDelegate />
    </>
  );
}

/**
 * Шлёт hit при каждом изменении pathname/searchParams.
 * Первый рендер пропускаем — основной скрипт Метрики уже сам отстукал /.
 */
function RouteChangeTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!pathname) return;
    const qs = searchParams?.toString();
    const url =
      window.location.origin + pathname + (qs ? `?${qs}` : "") + window.location.hash;
    ymHit(url, { title: document.title });
  }, [pathname, searchParams]);

  return null;
}

/**
 * Делегированный обработчик: на любом клике поднимается до ближайшего
 * элемента с `data-ym-goal` и шлёт цель в Метрику.
 */
function ClickGoalDelegate() {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!isYmEnabled()) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>("[data-ym-goal]");
      if (!el) return;
      const goal = el.dataset.ymGoal;
      if (!goal) return;
      let params: Record<string, unknown> | undefined;
      const rawParams = el.dataset.ymGoalParams;
      if (rawParams) {
        try {
          params = JSON.parse(rawParams);
        } catch {
          /* битый JSON — отправим цель без параметров */
        }
      }
      ymGoal(goal, params);
    };
    document.addEventListener("click", handler, { capture: true });
    return () => document.removeEventListener("click", handler, { capture: true });
  }, []);

  return null;
}

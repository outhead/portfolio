"use client";

import { useEffect, useState } from "react";
import MentoringBooking from "@/components/MentoringBooking";
import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";

/** Открыть модалку записи из любого места: openBooking() либо
 *  любой элемент с атрибутом data-open-booking (клик перехватывается). */
export function openBooking() {
  window.dispatchEvent(new CustomEvent("open-booking"));
}

export default function BookingModal() {
  const [open, setOpen] = useState(false);
  const locale = useLocale();

  // Триггеры: кастомное событие + делегированный клик по [data-open-booking]
  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-open-booking]");
      if (el) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("open-booking", onOpen);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("open-booking", onOpen);
      document.removeEventListener("click", onClick);
    };
  }, []);

  // Esc + блокировка скролла фона, пока открыто
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={pick("Запись на встречу", "Book a meeting", locale)}
    >
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative z-[1] w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={pick("Закрыть", "Close", locale)}
          className="absolute top-3 right-3 z-[2] inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/40 border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-colors"
        >
          ✕
        </button>
        {/* Та же запись, что на /mentoring: этап «Когда» → «Контакты» → успех */}
        <MentoringBooking />
      </div>
    </div>
  );
}

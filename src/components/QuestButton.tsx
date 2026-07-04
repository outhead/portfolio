"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import LedText from "@/components/LedText";
import { useLocale } from "@/lib/useLocale";
import { localizedHref } from "@/lib/i18n";

/**
 * Единая кнопка квеста. Три уровня иерархии + общий вид, чтобы кнопки
 * не расползались по экранам (см. UX-ревью, июнь 2026):
 *  - primary   — главное действие экрана. Сплошная заливка лаймом ПО УМОЛЧАНИЮ
 *                (читается без hover, важно на мобиле). Одна на экран.
 *  - secondary — альтернатива (рестарт, «ещё раз», внешняя ссылка). Ghost-рамка.
 *  - tertiary  — тихое действие/тумблер. Просто текст, без pill.
 * Текст — обычный (Handjet), БЕЗ LED-точек. LedText остаётся для заголовков/счёта.
 */
type Variant = "primary" | "secondary" | "tertiary";

const base =
  "inline-flex items-center justify-center gap-2 transition-colors select-none";

const styles: Record<Variant, string> = {
  primary:
    "rounded-full px-6 py-3 text-[16px] bg-[#A6FF00] text-black hover:bg-[#B9FF33] active:bg-[#9AEB00] shadow-[0_0_26px_-8px_rgba(166,255,0,0.7)] disabled:opacity-50 disabled:pointer-events-none",
  secondary:
    "rounded-full px-6 py-3 text-[16px] border border-white/20 text-white/75 hover:border-white/45 hover:text-white disabled:opacity-50 disabled:pointer-events-none",
  tertiary:
    "text-[14px] text-white/45 hover:text-[#A6FF00] disabled:opacity-40 disabled:pointer-events-none",
};

export default function QuestButton({
  children,
  variant = "primary",
  arrow = false,
  href,
  external = false,
  onClick,
  disabled = false,
  type = "button",
  ymGoal,
  ariaLabel,
  className = "",
}: {
  children: ReactNode;
  variant?: Variant;
  arrow?: boolean;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  ymGoal?: string;
  ariaLabel?: string;
  className?: string;
}) {
  // Внутренние ссылки локализуем сами: квесты ходят по /secret/*, и без
  // префикса /en переходы выбрасывали из английской версии в русскую.
  const locale = useLocale();
  const cls = `${base} ${styles[variant]} ${className}`;
  // primary/secondary — лейбл нашим LED-шрифтом в точках (currentColor); tertiary — обычным текстом.
  const led = variant !== "tertiary" && typeof children === "string";
  const inner = led ? (
    <>
      <span className="sr-only">{children as string}</span>
      <LedText text={children as string} className="h-[11px] w-auto" />
      {arrow ? <LedText text="→" className="h-[12px] w-auto" /> : null}
    </>
  ) : (
    <>
      {children}
      {arrow ? <span aria-hidden>→</span> : null}
    </>
  );

  if (href && !disabled) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer"
          className={`${cls} no-underline`} data-ym-goal={ymGoal} aria-label={ariaLabel}>
          {inner}
        </a>
      );
    }
    return (
      <Link href={localizedHref(href, locale)} className={`${cls} no-underline`} data-ym-goal={ymGoal} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} data-ym-goal={ymGoal} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}

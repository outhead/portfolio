/**
 * Словарь интерфейсных строк (chrome): шапка, подвал, лейблы страницы кейса,
 * общие CTA. Контент кейсов и главной — в своих местах (projects.en.ts,
 * локальные словари страниц). Здесь только сквозной UI.
 *
 * Чистые данные, без "use client" — импортируется и на сервере, и на клиенте.
 */
import type { Locale } from "./i18n";

type Dict = {
  nav: { works: string; experiments: string; speaking: string };
  cv: { short: string; download: string; aria: string };
  a11y: { home: string; openMenu: string; closeMenu: string; skip: string };
  lang: { ru: string; en: string; switchAria: string };
  case: {
    allProjects: string;
    back: string;
    prev: string;
    next: string;
    task: string;
    approach: string;
    helped: string;
    result: string;
    contents: string;
    screenshots: string;
    proofs: string;
    swipeLaunches: string;
    tryIt: string;
    tryHint: string;
    openToOffers: string;
    ctaHeading: string;
    writeTelegram: string;
    postersLabel: (n: number) => string;
    // категории ссылок-пруфов (ключ RU → подпись)
    linkCategories: Record<string, string>;
  };
};

export const DICT: Record<Locale, Dict> = {
  ru: {
    nav: { works: "Работы", experiments: "Эксперименты", speaking: "Выступления" },
    cv: { short: "CV", download: "Скачать CV", aria: "Скачать CV" },
    a11y: {
      home: "Главная",
      openMenu: "Открыть меню",
      closeMenu: "Закрыть меню",
      skip: "Перейти к содержимому",
    },
    lang: { ru: "RU", en: "EN", switchAria: "Сменить язык" },
    case: {
      allProjects: "Все проекты",
      back: "Назад",
      prev: "Предыдущий",
      next: "Следующий",
      task: "Задача",
      approach: "Подход",
      helped: "Что способствовало",
      result: "Результат",
      contents: "Содержание",
      screenshots: "Скриншоты",
      proofs: "Пруфы и ссылки",
      swipeLaunches: "← листайте, чтобы увидеть все запуски →",
      tryIt: "Попробовать",
      tryHint: "Тот самый конструктор из видео — открой и покрути сам.",
      openToOffers: "Открыт к офферам",
      ctaHeading: "Хочется поговорить про эту роль или просто познакомиться?",
      writeTelegram: "Написать в Telegram",
      postersLabel: (n) => `Постеры · ${n}`,
      linkCategories: {
        "Награда": "Награда",
        "Выступления и интервью": "Выступления и интервью",
        "Дизайн-система Consta": "Дизайн-система Consta",
        "Пресса": "Пресса",
        "Пресса и интервью": "Пресса и интервью",
        "Партнёрства и артефакты": "Партнёрства и артефакты",
        "Ссылки": "Ссылки",
      },
    },
  },
  en: {
    nav: { works: "Work", experiments: "Experiments", speaking: "Speaking" },
    cv: { short: "CV", download: "Download CV", aria: "Download CV" },
    a11y: {
      home: "Home",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      skip: "Skip to content",
    },
    lang: { ru: "RU", en: "EN", switchAria: "Switch language" },
    case: {
      allProjects: "All projects",
      back: "Back",
      prev: "Previous",
      next: "Next",
      task: "Task",
      approach: "Approach",
      helped: "What helped",
      result: "Result",
      contents: "Contents",
      screenshots: "Screens",
      proofs: "Proof & links",
      swipeLaunches: "← swipe to see every launch →",
      tryIt: "Try it",
      tryHint: "The very playground from the video — open it and spin it yourself.",
      openToOffers: "Open to offers",
      ctaHeading: "Want to talk about this role or just get in touch?",
      writeTelegram: "Message on Telegram",
      postersLabel: (n) => `Posters · ${n}`,
      linkCategories: {
        "Награда": "Award",
        "Выступления и интервью": "Talks & interviews",
        "Дизайн-система Consta": "Consta design system",
        "Пресса": "Press",
        "Пресса и интервью": "Press & interviews",
        "Партнёрства и артефакты": "Partnerships & artifacts",
        "Ссылки": "Links",
      },
    },
  },
};

export function getDict(locale: Locale): Dict {
  return DICT[locale];
}

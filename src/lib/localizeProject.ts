/**
 * Локализация данных кейса. Русский оригинал живёт в data/projects.ts и не
 * трогается. Английские переводы — отдельным overlay-файлом data/projects.en.ts
 * (по slug). localizeProject() накладывает EN поверх RU; чего нет в overlay —
 * остаётся русским (безопасный фоллбэк, сайт не ломается на непереведённом).
 */
import type { Project } from "@/data/projects";
import type { Locale } from "./i18n";
import { projectsEn } from "@/data/projects.en";

/** Глубоко-частичный перевод: те же поля, что у Project, но все опциональны.
 *  Массивы (sections/results/...) мёржатся по индексу. */
export type ProjectEn = {
  title?: string;
  company?: string;
  role?: string;
  roleShort?: string;
  period?: string;
  description?: string;
  longDescription?: string;
  heroSlogan?: string;
  tryLabel?: string;
  tryNote?: string;
  metric?: string;
  metricLabel?: string;
  coverLed?: string[];
  results?: ({ value?: string; label?: string } | undefined)[];
  sections?: (SectionEn | undefined)[];
  links?: ({ label?: string; category?: string } | undefined)[];
  screenshots?: (ScreenshotEn | undefined)[];
};

type ScreenshotEn = { label?: string; caption?: string; alt?: string } | undefined;

type SectionEn = {
  title?: string;
  content?: string;
  context?: string;
  approach?: string;
  approachSimple?: string;
  helped?: string;
  result?: string;
  callouts?: ({ value?: string; label?: string } | undefined)[];
  timeline?: ({ date?: string; title?: string; note?: string } | undefined)[];
  heroes?: ({ alt?: string } | undefined)[];
  videoBlock?: { alt?: string };
  screenshots?: (ScreenshotEn)[];
  links?: ({ label?: string; category?: string } | undefined)[];
};

function mergeScreenshot(base: NonNullable<Project["screenshots"]>[number], en: ScreenshotEn) {
  if (!en) return base;
  if (typeof base === "string") {
    // строку-путь превращаем в объект только если есть подпись
    if (en.label || en.caption || en.alt) return { src: base, ...en };
    return base;
  }
  return { ...base, ...(en.label !== undefined && { label: en.label }), ...(en.caption !== undefined && { caption: en.caption }), ...(en.alt !== undefined && { alt: en.alt }) };
}

/** Мёрж массива по индексу с колбэком слияния элемента. */
function mergeArr<B, E>(base: B[] | undefined, en: (E | undefined)[] | undefined, fn: (b: B, e: E | undefined) => B): B[] | undefined {
  if (!base) return base;
  if (!en) return base;
  return base.map((b, i) => fn(b, en[i]));
}

export function localizeProject(project: Project, locale: Locale): Project {
  if (locale === "ru") return project;
  const en = projectsEn[project.slug];
  if (!en) return project;

  const merged: Project = { ...project };

  const scalar = <K extends keyof Project>(k: K, v: Project[K] | undefined) => {
    if (v !== undefined) merged[k] = v;
  };
  scalar("title", en.title as Project["title"]);
  scalar("company", en.company as Project["company"]);
  scalar("role", en.role as Project["role"]);
  scalar("roleShort", en.roleShort);
  scalar("period", en.period as Project["period"]);
  scalar("description", en.description as Project["description"]);
  scalar("longDescription", en.longDescription as Project["longDescription"]);
  scalar("heroSlogan", en.heroSlogan);
  scalar("tryLabel", en.tryLabel);
  scalar("tryNote", en.tryNote);
  scalar("metric", en.metric);
  scalar("metricLabel", en.metricLabel);
  if (en.coverLed) merged.coverLed = en.coverLed;

  if (en.results) {
    merged.results = mergeArr(project.results, en.results, (b, e) =>
      e ? { value: e.value ?? b.value, label: e.label ?? b.label } : b
    );
  }

  if (en.links) {
    merged.links = mergeArr(project.links, en.links, (b, e) =>
      e ? { ...b, ...(e.label !== undefined && { label: e.label }), ...(e.category !== undefined && { category: e.category }) } : b
    );
  }

  if (en.screenshots) {
    merged.screenshots = mergeArr(project.screenshots, en.screenshots, (b, e) => mergeScreenshot(b, e));
  }

  if (en.sections) {
    merged.sections = mergeArr(project.sections, en.sections, (b, e) => {
      if (!e) return b;
      const s = { ...b };
      if (e.title !== undefined) s.title = e.title;
      if (e.content !== undefined) s.content = e.content;
      if (e.context !== undefined) s.context = e.context;
      if (e.approach !== undefined) s.approach = e.approach;
      if (e.approachSimple !== undefined) s.approachSimple = e.approachSimple;
      if (e.helped !== undefined) s.helped = e.helped;
      if (e.result !== undefined) s.result = e.result;
      if (e.callouts) {
        s.callouts = mergeArr(b.callouts, e.callouts, (cb, ce) =>
          ce ? { value: ce.value ?? cb.value, label: ce.label ?? cb.label } : cb
        );
      }
      if (e.timeline) {
        s.timeline = mergeArr(b.timeline, e.timeline, (tb, te) =>
          te ? { date: te.date ?? tb.date, title: te.title ?? tb.title, ...(te.note !== undefined ? { note: te.note } : tb.note !== undefined ? { note: tb.note } : {}) } : tb
        );
      }
      if (e.heroes) {
        s.heroes = mergeArr(b.heroes, e.heroes, (hb, he) => (he && he.alt !== undefined ? { ...hb, alt: he.alt } : hb));
      }
      if (e.videoBlock && b.videoBlock) {
        s.videoBlock = { ...b.videoBlock, ...(e.videoBlock.alt !== undefined && { alt: e.videoBlock.alt }) };
      }
      if (e.screenshots) {
        s.screenshots = mergeArr(b.screenshots, e.screenshots, (sb, se) => mergeScreenshot(sb, se));
      }
      if (e.links) {
        s.links = mergeArr(b.links, e.links, (lb, le) =>
          le ? { ...lb, ...(le.label !== undefined && { label: le.label }), ...(le.category !== undefined && { category: le.category }) } : lb
        );
      }
      return s;
    });
  }

  return merged;
}

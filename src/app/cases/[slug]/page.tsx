import { projects, getProjectBySlug } from "@/data/projects";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CaseView from "@/components/CaseView";
import { localizeProject } from "@/lib/localizeProject";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: `${project.title} — Егор Шугаев`,
    description: project.description,
    alternates: { languages: { ru: `/cases/${slug}`, en: `/en/cases/${slug}` } },
    openGraph: {
      title: `${project.title} — Егор Шугаев`,
      description: project.description,
      type: "article",
    },
  };
}

function getAdjacent(slug: string) {
  const idx = projects.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0 ? projects[idx - 1] : null,
    next: idx < projects.length - 1 ? projects[idx + 1] : null,
  };
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();
  const { prev, next } = getAdjacent(slug);
  return (
    <CaseView
      project={localizeProject(project, "ru")}
      prev={prev ? localizeProject(prev, "ru") : null}
      next={next ? localizeProject(next, "ru") : null}
      locale="ru"
    />
  );
}

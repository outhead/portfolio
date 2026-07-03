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
  const en = localizeProject(project, "en");
  return {
    title: `${en.title} — Egor Shugaev`,
    description: en.description,
    alternates: { languages: { ru: `/cases/${slug}`, en: `/en/cases/${slug}` } },
    openGraph: {
      title: `${en.title} — Egor Shugaev`,
      description: en.description,
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

export default async function CasePageEn({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();
  const { prev, next } = getAdjacent(slug);
  return (
    <CaseView
      project={localizeProject(project, "en")}
      prev={prev ? localizeProject(prev, "en") : null}
      next={next ? localizeProject(next, "en") : null}
      locale="en"
    />
  );
}

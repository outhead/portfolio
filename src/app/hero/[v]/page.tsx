import type { Metadata } from "next";
import HeroLab from "../HeroLab";

/* Тестовый полигон композиций хиро — /hero/1..4.
   Noindex, с сайта не линкуется. После выбора варианта удалить папку. */

export const metadata: Metadata = {
  title: "Hero Lab — варианты композиции",
  robots: "noindex, nofollow",
};

export function generateStaticParams() {
  return [{ v: "1" }, { v: "2" }, { v: "3" }, { v: "4" }, { v: "5" }];
}

export default async function HeroLabPage({
  params,
}: {
  params: Promise<{ v: string }>;
}) {
  const { v } = await params;
  return <HeroLab v={v} />;
}

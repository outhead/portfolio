import type { Metadata } from "next";
import OpticsEditor from "@/components/OpticsEditor";
import OpticsEditorIntro from "./OpticsEditorIntro";

export const metadata: Metadata = {
  title: "Optics — редактор уровня",
  robots: { index: false, follow: false },
};

export default function OpticsEditorPage() {
  return (
    <main className="min-h-screen bg-black text-white px-5 md:px-[8%] py-12">
      <OpticsEditorIntro />
      <OpticsEditor />
    </main>
  );
}

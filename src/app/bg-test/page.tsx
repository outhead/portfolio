"use client";

import PreviewHome from "../page";
import ShaderDevPanel from "@/components/ShaderDevPanel";

// Тест живого фона (шейдерное сияние) на реальной главной + панель тюнинга.
// localhost:3000/bg-test. Прод (page.tsx) не трогаем.
export default function BgTestPage() {
  return (
    <ShaderDevPanel>
      <PreviewHome />
    </ShaderDevPanel>
  );
}

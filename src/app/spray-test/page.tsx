"use client";

import PreviewHome from "../page";
import SprayDevPanel from "@/components/SprayDevPanel";

// Тестовый клон главной со спреем + живой панелью настроек (ползунки).
// Открыть на localhost:3000/spray-test. Прод (page.tsx) не трогаем.
export default function SprayTestPage() {
  return (
    <SprayDevPanel>
      <PreviewHome />
    </SprayDevPanel>
  );
}

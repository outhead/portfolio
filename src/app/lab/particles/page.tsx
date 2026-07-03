"use client";

import LedText from "@/components/LedText";
import ParticleStudio from "@/components/ParticleStudio";
import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";

export default function ParticleLab() {
  const locale = useLocale();
  return (
    <main className="min-h-screen bg-black text-white px-5 md:px-[8%] pt-28 md:pt-32 pb-20">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <div className="text-white/40">
            <LedText text={pick("Лаба · конструктор частиц", "Lab · particle studio", locale)} className="h-[10px] w-auto" />
          </div>
          <h1 className="text-2xl md:text-3xl">{pick("Фото → облако частиц в 3D", "Photo → particle cloud in 3D", locale)}</h1>
          <p className="text-[13px] md:text-[14px] text-white/55 max-w-[640px]">
            {pick(
              "Закинь фото — глубину посчитаем прямо в браузере (Depth Anything), вырежем фон и соберём объёмное облако точек. Покрути и сохрани.",
              "Drop in a photo — we compute depth right in your browser (Depth Anything), cut out the background and build a volumetric point cloud. Spin it and save.",
              locale,
            )}
          </p>
        </div>
        <ParticleStudio />
      </div>
    </main>
  );
}

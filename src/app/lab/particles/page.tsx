"use client";

import LedText from "@/components/LedText";
import ParticleStudio from "@/components/ParticleStudio";

export default function ParticleLab() {
  return (
    <main className="min-h-screen bg-black text-white px-5 md:px-[8%] pt-28 md:pt-32 pb-20">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <div className="text-white/40">
            <LedText text="Лаба · конструктор частиц" className="h-[10px] w-auto" />
          </div>
          <h1 className="text-2xl md:text-3xl">Фото → облако частиц в 3D</h1>
          <p className="text-[13px] md:text-[14px] text-white/55 max-w-[640px]">
            Закинь фото — глубину посчитаем прямо в браузере (Depth Anything),
            вырежем фон и соберём объёмное облако точек. Покрути и сохрани.
          </p>
        </div>
        <ParticleStudio />
      </div>
    </main>
  );
}

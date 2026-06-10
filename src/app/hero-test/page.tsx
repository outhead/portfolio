"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Trophy, Compass, BarChart3 } from "lucide-react";
import LatentFlowBackground from "@/components/LatentFlowBackground";

// Воссоздание причёсанного хиро (Cloud Design handoff) + наш латентный поток
// вместо hero-fx, на весь фон и за портретом. localhost:3000/hero-test.
const WORDS = ["людей", "команды", "визуал", "сервисы", "интерес"];
const LOGOS = [
  { src: "/images/logos/ozon.svg", alt: "Ozon", h: 19 },
  { src: "/images/logos/mts.svg", alt: "МТС", h: 30 },
  { src: "/images/logos/gazpromneft.svg", alt: "Газпром Нефть", h: 31 },
  { src: "/images/logos/hse.svg", alt: "ВШЭ", h: 30 },
];

function useCountUp(target: number, dur = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}

export default function HeroTest() {
  const [fi, setFi] = useState(0);
  const n1 = useCountUp(30), n2 = useCountUp(7), n3 = useCountUp(27);

  useEffect(() => {
    const id = setInterval(() => setFi((p) => (p + 1) % WORDS.length), 2300);
    return () => clearInterval(id);
  }, []);

  const lbl = "font-[var(--font-body)] uppercase";

  return (
    <section className="relative px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] pt-[18px]">
      <style>{`
        @keyframes hflip{from{opacity:0;filter:blur(7px);transform:translateY(10px)}to{opacity:1;filter:blur(0);transform:none}}
        .hflip{display:inline-block;color:#A6FF00;animation:hflip .5s cubic-bezier(0.22,1,0.36,1)}
        @media (prefers-reduced-motion: reduce){.hflip{animation:none}}
      `}</style>

      {/* наш латентный поток — на весь фон (и просвечивает за портретом через полупрозрачную плитку) */}
      <LatentFlowBackground zIndex={0} color="96,108,102" count={1100} speed={0.42} flowScale={0.0012} fade={0.055} dotSize={1.0} push={0.45} />

      <div className="relative z-[1] grid grid-cols-12 gap-[14px]">
        {/* ───── главная плитка ───── */}
        <div
          className="col-span-12 relative overflow-hidden rounded-[28px] border min-h-[600px] lg:min-h-[690px]"
          style={{
            borderColor: "rgba(255,255,255,0.12)",
            background:
              "radial-gradient(80% 90% at 86% 78%, rgba(166,255,0,0.10), transparent 58%), rgba(10,10,12,0.50)",
          }}
        >
          {/* дотгрид */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1.4px)",
              backgroundSize: "24px 24px",
              maskImage: "radial-gradient(70% 80% at 82% 60%, #000 0%, transparent 70%)",
              WebkitMaskImage: "radial-gradient(70% 80% at 82% 60%, #000 0%, transparent 70%)",
            }}
          />

          {/* портрет — заземлён по низу плитки, крупный, без движения.
              Логика: фигура «стоит» на нижней кромке тайла, голова не упирается
              в верх, лицо примерно на уровне строки заголовка; низ мягко тает. */}
          <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[46%] pointer-events-none z-[1]">
            {/* glow за лицом */}
            <div
              aria-hidden
              className="absolute right-[14%] top-[12%] w-[52%] aspect-square rounded-full"
              style={{ background: "radial-gradient(circle, rgba(166,255,0,0.20), rgba(166,255,0,0.05) 45%, transparent 68%)", filter: "blur(10px)" }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hero-portrait.png"
              alt="Егор Шугаев"
              className="absolute right-[2%] bottom-0 h-[94%] w-auto object-contain"
              style={{
                objectPosition: "bottom right",
                filter: "drop-shadow(0 18px 50px rgba(0,0,0,0.55))",
                maskImage: "linear-gradient(to bottom, #000 86%, transparent)",
                WebkitMaskImage: "linear-gradient(to bottom, #000 86%, transparent)",
              }}
            />
          </div>

          {/* роль — верх-право */}
          <div className={`absolute top-[38px] right-10 z-[3] whitespace-nowrap text-[13px] tracking-[0.14em] text-white/[0.62] ${lbl}`}>
            <span className="text-[#A6FF00]/50 mx-2">[</span>Дизайн-директор<span className="text-[#A6FF00]/50 mx-2">]</span>
          </div>

          {/* контент */}
          <div className="relative z-[2] flex flex-col justify-center min-h-[600px] lg:min-h-[690px] max-w-[64%] px-11 pt-[86px] pb-[120px]">
            <h1 className="font-p95 uppercase text-white" style={{ fontSize: "clamp(60px,8.6vw,132px)", lineHeight: 0.88 }}>
              <span className="block">7 лет</span>
              <span className="block">развиваю</span>
              <span className="block min-h-[1em]"><span key={fi} className="hflip">{WORDS[fi]}</span></span>
            </h1>
            <p className="mt-[26px] text-white/[0.62] font-light max-w-[34ch]" style={{ fontSize: "clamp(17px,1.5vw,20px)", lineHeight: 1.45 }}>
              От стратегии и культуры до AI и цифровых продуктов.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="https://t.me/egoradi" target="_blank" className={`cta inline-flex items-center gap-2.5 px-6 py-[15px] rounded-full bg-[#A6FF00] text-[#0a0a06] font-medium text-[13px] tracking-[0.04em] no-underline hover:bg-white transition-colors ${lbl}`}>
                Обсудить проект <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
              </Link>
              <Link href="#portfolio" className={`cta inline-flex items-center gap-2.5 px-6 py-[15px] rounded-full border border-white/[0.12] text-white/85 font-medium text-[13px] tracking-[0.04em] no-underline hover:border-white/45 hover:text-white transition-colors ${lbl}`}>
                Смотреть кейсы <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>
            </div>
          </div>

          {/* работал в — низ-лево */}
          <div className="hidden md:flex absolute bottom-9 left-11 z-[3] items-center gap-[30px] flex-wrap">
            <span className={`text-[13px] tracking-[0.14em] text-white/[0.62] whitespace-nowrap ${lbl}`}>Работал в</span>
            <div className="flex items-center gap-7">
              {LOGOS.map((l) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={l.alt} src={l.src} alt={l.alt} style={{ height: l.h }} className="w-auto brightness-0 invert opacity-50 hover:opacity-95 transition-opacity" />
              ))}
            </div>
          </div>

          {/* город — низ-право */}
          <div className={`hidden md:block absolute bottom-[38px] right-10 z-[3] text-[13px] tracking-[0.14em] text-white/[0.62] ${lbl}`}>Москва</div>
        </div>

        {/* ───── награда ───── */}
        <Link href="/cases/gazprom-neft" className="col-span-12 lg:col-span-4 relative overflow-hidden rounded-[20px] border min-h-[290px] p-[26px] pr-[150px] flex flex-col no-underline group transition-all"
          style={{ borderColor: "rgba(201,166,107,0.28)", background: "linear-gradient(160deg, rgba(201,166,107,0.10), rgba(201,166,107,0.015) 60%, transparent)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/gpn/prize.png" alt="CX Awards 2024" className="absolute right-[14px] top-1/2 -translate-y-1/2 w-[130px] h-auto opacity-95 group-hover:scale-105 transition-transform duration-500" style={{ filter: "drop-shadow(0 12px 34px rgba(201,166,107,0.4))" }} />
          <span className={`inline-flex items-center gap-2.5 text-[13px] tracking-[0.16em] text-[#C9A66B] whitespace-nowrap ${lbl}`}><Trophy className="w-4 h-4" strokeWidth={1.8} />Награда · 2024</span>
          <div className="font-p95 text-[#C9A66B] mt-auto" style={{ fontSize: "clamp(46px,5vw,72px)", lineHeight: 0.9 }}>CX&apos;24</div>
          <div className={`text-[13px] tracking-[0.12em] text-white/70 mt-2.5 ${lbl}`}>Customer Experience Awards</div>
          <div className={`mt-4 -mr-[124px] pt-3.5 border-t text-[13px] tracking-[0.1em] text-[#C9A66B]/85 whitespace-nowrap ${lbl}`} style={{ borderColor: "rgba(201,166,107,0.18)" }}>Победитель в сегменте B2E</div>
        </Link>

        {/* ───── экспертиза ───── */}
        <Link href="#skills" className="col-span-12 lg:col-span-4 relative overflow-hidden rounded-[20px] border border-white/[0.07] min-h-[290px] p-[26px] flex flex-col no-underline group transition-all hover:border-white/[0.16]"
          style={{ background: "rgba(13,13,15,0.72)" }}>
          <ArrowUpRight className="absolute top-[26px] right-[26px] w-5 h-5 text-white/40 group-hover:text-[#A6FF00] transition-colors" strokeWidth={2} />
          <span className={`inline-flex items-center gap-2.5 text-[13px] tracking-[0.2em] text-[#A6FF00] ${lbl}`}><Compass className="w-4 h-4" strokeWidth={1.8} />Экспертиза</span>
          <ul className="list-none mt-auto flex flex-col gap-[18px]">
            {[["01", "Управление", "дизайн-функции и команды"], ["02", "Направления", "B2C · B2E · EdTech · E-com"], ["03", "Ремесло", "процессы и применение AI"]].map(([n, name, note]) => (
              <li key={n} className="flex items-baseline gap-3.5">
                <span className="text-[13px] font-semibold text-[#A6FF00]/50 w-[22px] shrink-0 tabular-nums" style={{ fontFamily: "var(--font-body)" }}>{n}</span>
                <span>
                  <span className="font-p95 text-[22px] tracking-[0.06em] uppercase text-white block">{name}</span>
                  <span className={`block text-[13px] tracking-[0.04em] text-white/[0.62] mt-[3px] ${lbl}`}>{note}</span>
                </span>
              </li>
            ))}
          </ul>
        </Link>

        {/* ───── в цифрах ───── */}
        <div className="col-span-12 lg:col-span-4 relative overflow-hidden rounded-[20px] border border-white/[0.07] min-h-[290px] p-[26px] flex flex-col" style={{ background: "rgba(13,13,15,0.72)" }}>
          <span className={`inline-flex items-center gap-2.5 text-[13px] tracking-[0.2em] text-white/[0.62] ${lbl}`}><BarChart3 className="w-4 h-4" strokeWidth={1.8} />В цифрах</span>
          <div className="grid grid-cols-3 gap-3.5 mt-auto">
            {[[n1, "публичных запусков"], [n2, "лет опыта"], [n3, "команд"]].map(([n, l], k) => (
              <div key={k} className={`flex flex-col gap-2 ${k > 0 ? "border-l border-white/[0.07] pl-3.5" : ""}`}>
                <span className="font-p95 text-white" style={{ fontSize: "clamp(36px,3.6vw,56px)", lineHeight: 0.86 }}>{n}</span>
                <span className={`text-[13px] tracking-[0.04em] text-white/[0.62] leading-[1.35] ${lbl}`}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 80 }} />
    </section>
  );
}

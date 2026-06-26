"use client";

/* ─────────────────────────────────────────────────────────────────
 * /lab/particles — конструктор «фото → облако частиц в 3D».
 * Метод тот же, что в хиро: вырезка фона + карта глубины (Depth Anything
 * в браузере через transformers.js) + облако точек с пружинами.
 * Гибрид: быстрый предпросмотр сразу, «Обработать» уточняет глубину.
 * Сохранение: клип вращения (webm) + ассеты (силуэт + карта глубины).
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import LedText from "@/components/LedText";
import ParticlePortrait from "@/components/ParticlePortrait";

const DEFAULT_IMG = "/images/hero-portrait.png";
const TJS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.2.4";

// прячем импорт от бандлера (грузим с CDN в рантайме)
// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func, @typescript-eslint/no-explicit-any
const cdnImport = (u: string) => (new Function("u", "return import(u)")(u) as Promise<any>);

export default function ParticleLab() {
  const [portrait, setPortrait] = useState<string>(DEFAULT_IMG);
  const [depth, setDepth] = useState<string | undefined>("/images/hero-depth.png");
  const [count, setCount] = useState(6000);
  const [depthScale, setDepthScale] = useState(0.6);
  const [pointScale, setPointScale] = useState(0.8);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [recording, setRecording] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // освобождаем objectURL'ы
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);
  const keepUrl = (u: string) => { urls.current.push(u); return u; };

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = keepUrl(URL.createObjectURL(f));
    setPortrait(url);
    setDepth(undefined); // быстрый предпросмотр (эллипсоид), пока не «обработали»
    setStatus("Фото загружено. Жми «Обработать» для реальной глубины и вырезки.");
  }

  async function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = src;
    });
  }

  const toUrl = (c: HTMLCanvasElement) =>
    new Promise<string>((r) => c.toBlob((b) => r(URL.createObjectURL(b!)), "image/png")!);

  // RMBG-вырезка + Depth Anything + сглаживание/перцентильная нормализация
  async function process() {
    setBusy(true);
    try {
      setStatus("Гружу модели (первый раз — дольше)…");
      const TJS = await cdnImport(TJS_URL);
      TJS.env.allowLocalModels = false;

      const img = await loadImage(portrait);
      const W = img.naturalWidth, H = img.naturalHeight;

      // 1) Вырезка фона (RMBG). Если не выйдет — фолбэк на порог глубины.
      let maskAlpha: Uint8ClampedArray | null = null;
      try {
        setStatus("Вырезаю фон (RMBG)…");
        const seg = await TJS.pipeline("background-removal", "briaai/RMBG-1.4");
        const res = await seg(portrait);
        const ri = Array.isArray(res) ? res[0] : res;
        const cut: HTMLCanvasElement = ri.toCanvas();
        const mc = document.createElement("canvas"); mc.width = W; mc.height = H;
        const mctx = mc.getContext("2d")!;
        mctx.drawImage(cut, 0, 0, W, H);
        maskAlpha = mctx.getImageData(0, 0, W, H).data;
      } catch (e) {
        console.warn("RMBG недоступен, вырезка по порогу глубины", e);
      }

      // 2) Глубина + сглаживание (blur)
      setStatus("Считаю глубину…");
      const dpipe = await TJS.pipeline("depth-estimation", "onnx-community/depth-anything-v2-small");
      const dout = await dpipe(portrait);
      const dRaw: HTMLCanvasElement = dout.depth.toCanvas();
      const dc = document.createElement("canvas"); dc.width = W; dc.height = H;
      const dctx = dc.getContext("2d")!;
      dctx.filter = "blur(2px)";
      dctx.drawImage(dRaw, 0, 0, W, H);
      dctx.filter = "none";
      const dData = dctx.getImageData(0, 0, W, H).data;

      // перцентильная нормализация по точкам субъекта
      const vals: number[] = [];
      for (let i = 0; i < dData.length; i += 4) {
        if (!maskAlpha || maskAlpha[i + 3] > 40) vals.push(dData[i]);
      }
      vals.sort((a, b) => a - b);
      const p2 = vals.length ? vals[Math.floor(vals.length * 0.02)] : 0;
      const p98 = vals.length ? vals[Math.floor(vals.length * 0.98)] : 255;
      const range = Math.max(1, p98 - p2);
      const thr = p2 + range * 0.28; // порог фона, если нет маски

      // итог: нормализованная глубина + портрет-силуэт
      const depthOut = dctx.createImageData(W, H);
      const pc = document.createElement("canvas"); pc.width = W; pc.height = H;
      const pctx = pc.getContext("2d")!;
      pctx.drawImage(img, 0, 0, W, H);
      const pImg = pctx.getImageData(0, 0, W, H);
      for (let i = 0; i < dData.length; i += 4) {
        let nv = Math.round(((dData[i] - p2) / range) * 255);
        if (nv < 0) nv = 0; else if (nv > 255) nv = 255;
        depthOut.data[i] = nv; depthOut.data[i + 1] = nv; depthOut.data[i + 2] = nv; depthOut.data[i + 3] = 255;
        const keep = maskAlpha ? maskAlpha[i + 3] > 40 : dData[i] >= thr;
        if (!keep) pImg.data[i + 3] = 0;
      }
      dctx.putImageData(depthOut, 0, 0);
      pctx.putImageData(pImg, 0, 0);

      const portraitUrl = keepUrl(await toUrl(pc));
      const depthUrl = keepUrl(await toUrl(dc));
      setPortrait(portraitUrl);
      setDepth(depthUrl);
      setStatus(maskAlpha ? "Готово: фон вырезан (RMBG), глубина сглажена." : "Готово: глубина посчитана (фон по порогу — RMBG недоступен).");
    } catch (err) {
      console.error(err);
      setStatus("Не вышло обработать (нужен современный браузер/доступ к CDN). Предпросмотр работает.");
    } finally {
      setBusy(false);
    }
  }

  function download(url: string, name: string) {
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
  }
  async function saveAssets() {
    download(portrait, "particles-portrait.png");
    if (depth) download(depth, "particles-depth.png");
  }

  async function recordClip() {
    const canvas = wrapRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    setRecording(true);
    setStatus("Записываю клип вращения…");
    try {
      const stream = canvas.captureStream(30);
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const done = new Promise<void>((res) => (rec.onstop = () => res()));
      rec.start();
      await new Promise((r) => setTimeout(r, 4200)); // ~один оборот
      rec.stop();
      await done;
      const url = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
      download(url, "particles.webm");
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setStatus("Клип сохранён (webm).");
    } catch (e) {
      console.error(e);
      setStatus("Запись клипа не поддержана в этом браузере.");
    } finally {
      setRecording(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-5 md:px-[8%] pt-28 md:pt-32 pb-20">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <div className="text-white/40">
            <LedText text="Лаба · конструктор частиц" className="h-[10px] w-auto" />
          </div>
          <h1 className="text-2xl md:text-3xl">Фото → облако частиц в 3D</h1>
          <p className="text-[13px] md:text-[14px] text-white/55 max-w-[640px]">
            Тот же метод, что в хиро: вырезаем фон, считаем карту глубины
            (Depth Anything прямо в браузере) и собираем объёмное облако точек.
            Закинь своё фото, обработай, покрути и сохрани.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* холст */}
          <div className="w-full lg:w-[420px] shrink-0 flex flex-col gap-3">
            <div
              ref={wrapRef}
              className="relative rounded-2xl overflow-hidden border border-[#A6FF00]/20 bg-[#08090a] aspect-[3/4]"
            >
              <ParticlePortrait
                key={`${portrait}-${depth}-${count}`}
                src={portrait}
                depthSrc={depth}
                count={count}
                depthScale={depthScale}
                pointScale={pointScale}
                tilt={0.55}
                assembleOnHover={false}
                autoSpin
                className="absolute inset-0"
              />
            </div>
            {status && <p className="text-[12px] text-white/45 min-h-[16px]">{status}</p>}
          </div>

          {/* управление */}
          <div className="flex-1 flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              <label className="text-[13px] px-4 py-2 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-colors cursor-pointer">
                Загрузить фото
                <input type="file" accept="image/*" onChange={onFile} className="hidden" />
              </label>
              <button
                onClick={process}
                disabled={busy}
                className="text-[13px] px-4 py-2 rounded-full border border-[#A6FF00]/50 text-[#A6FF00] bg-[#A6FF00]/10 hover:bg-[#A6FF00]/20 transition-colors disabled:opacity-50"
              >
                {busy ? "Обработка…" : "Обработать (глубина + вырезка)"}
              </button>
            </div>

            {([
              ["Точек", count, setCount, 1500, 12000, 250],
              ["Глубина", depthScale, setDepthScale, 0, 1.4, 0.05],
              ["Размер точки", pointScale, setPointScale, 0.3, 1.6, 0.05],
            ] as const).map(([label, val, set, min, max, step]) => (
              <label key={label} className="flex items-center gap-4 text-white/50">
                <span className="w-28 shrink-0 text-[13px]">{label}</span>
                <input type="range" min={min} max={max} step={step} value={val}
                  onChange={(e) => (set as (n: number) => void)(Number(e.target.value))}
                  className="flex-1 accent-[#A6FF00]" />
                <span className="w-14 text-right text-[13px] tabular-nums">
                  {val < 20 ? val.toFixed(2) : val}
                </span>
              </label>
            ))}

            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={recordClip} disabled={recording}
                className="text-[13px] px-4 py-2 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50">
                {recording ? "Запись…" : "Записать клип (webm)"}
              </button>
              <button onClick={saveAssets}
                className="text-[13px] px-4 py-2 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-colors">
                Скачать ассеты (силуэт + глубина)
              </button>
            </div>

            <p className="text-[12px] text-white/35 mt-2 max-w-[460px]">
              Глубина считается локально в браузере (модель ~50–100МБ, первый раз
              грузится дольше). Без обработки — быстрый предпросмотр с
              приблизительным объёмом.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

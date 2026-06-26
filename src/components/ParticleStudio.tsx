"use client";

/* ─────────────────────────────────────────────────────────────────
 * ParticleStudio — встроенный конструктор «фото → облако точек в 3D».
 * Загружаешь фото → сразу считается глубина (Depth Anything в браузере),
 * вырезается фон, собирается объёмное облако. Сохранение: клип + ассеты.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import ParticlePortrait from "@/components/ParticlePortrait";

const DEFAULT_IMG = "/images/hero-portrait.png";
const DEFAULT_DEPTH = "/images/hero-depth.png";
const TJS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.2.4";

// прячем импорт от бандлера (грузим с CDN в рантайме)
// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func, @typescript-eslint/no-explicit-any
const cdnImport = (u: string) => (new Function("u", "return import(u)")(u) as Promise<any>);

export default function ParticleStudio() {
  const [portrait, setPortrait] = useState<string>(DEFAULT_IMG);
  const [depth, setDepth] = useState<string | undefined>(DEFAULT_DEPTH);
  const [count, setCount] = useState(6000);
  const [depthScale, setDepthScale] = useState(0.6);
  const [pointScale, setPointScale] = useState(0.8);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [recording, setRecording] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);
  const keepUrl = (u: string) => { urls.current.push(u); return u; };

  const toUrl = (c: HTMLCanvasElement) =>
    new Promise<string>((r) => c.toBlob((b) => r(URL.createObjectURL(b!)), "image/png")!);
  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((res, rej) => {
      const im = new Image(); im.crossOrigin = "anonymous";
      im.onload = () => res(im); im.onerror = rej; im.src = src;
    });

  // Глубина в браузере + вырезка фона по карте глубины
  async function process(srcUrl: string) {
    setBusy(true);
    try {
      setStatus("Гружу модель глубины…");
      const TJS = await cdnImport(TJS_URL);
      TJS.env.allowLocalModels = false;
      const dpipe = await TJS.pipeline("depth-estimation", "onnx-community/depth-anything-v2-small", {
        progress_callback: (p: { status?: string; progress?: number }) => {
          if (!p || !p.status) return;
          if (p.status === "progress" && typeof p.progress === "number")
            setStatus("Загрузка модели · " + Math.round(p.progress) + "%");
          else if (p.status === "ready") setStatus("Считаю глубину…");
        },
      });
      const img = await loadImage(srcUrl);
      const W = img.naturalWidth, H = img.naturalHeight;
      setStatus("Считаю глубину…");
      const dout = await dpipe(srcUrl);
      const dRaw: HTMLCanvasElement = dout.depth.toCanvas();

      const dc = document.createElement("canvas"); dc.width = W; dc.height = H;
      const dctx = dc.getContext("2d")!;
      dctx.filter = "blur(2px)"; dctx.drawImage(dRaw, 0, 0, W, H); dctx.filter = "none";
      const dData = dctx.getImageData(0, 0, W, H).data;

      const vals: number[] = [];
      for (let i = 0; i < dData.length; i += 4) vals.push(dData[i]);
      vals.sort((a, b) => a - b);
      const p2 = vals[Math.floor(vals.length * 0.02)];
      const p98 = vals[Math.floor(vals.length * 0.98)];
      const range = Math.max(1, p98 - p2);
      const thr = p2 + range * 0.30;

      const depthOut = dctx.createImageData(W, H);
      const pc = document.createElement("canvas"); pc.width = W; pc.height = H;
      const pctx = pc.getContext("2d")!;
      pctx.drawImage(img, 0, 0, W, H);
      const pImg = pctx.getImageData(0, 0, W, H);
      for (let i = 0; i < dData.length; i += 4) {
        let nv = Math.round(((dData[i] - p2) / range) * 255);
        if (nv < 0) nv = 0; else if (nv > 255) nv = 255;
        depthOut.data[i] = nv; depthOut.data[i + 1] = nv; depthOut.data[i + 2] = nv; depthOut.data[i + 3] = 255;
        if (dData[i] < thr) pImg.data[i + 3] = 0;
      }
      dctx.putImageData(depthOut, 0, 0);
      pctx.putImageData(pImg, 0, 0);

      setPortrait(keepUrl(await toUrl(pc)));
      setDepth(keepUrl(await toUrl(dc)));
      setStatus("Готово: глубина и вырезка применены.");
    } catch (err) {
      console.error(err);
      setStatus("Не вышло посчитать глубину: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = keepUrl(URL.createObjectURL(f));
    setPortrait(url);
    setDepth(undefined); // плоский предпросмотр, пока считается глубина
    process(url); // сразу обсчёт глубины
  }

  function download(url: string, name: string) {
    const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  }
  function saveAssets() {
    download(portrait, "particles-portrait.png");
    if (depth) download(depth, "particles-depth.png");
  }
  async function recordClip() {
    const canvas = wrapRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    setRecording(true); setStatus("Записываю клип…");
    try {
      const stream = canvas.captureStream(30);
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const done = new Promise<void>((res) => (rec.onstop = () => res()));
      rec.start(); await new Promise((r) => setTimeout(r, 4200)); rec.stop(); await done;
      const url = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
      download(url, "particles.webm"); setTimeout(() => URL.revokeObjectURL(url), 5000);
      setStatus("Клип сохранён (webm).");
    } catch (e) {
      console.error(e); setStatus("Запись клипа не поддержана в этом браузере.");
    } finally { setRecording(false); }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-3">
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
            className="absolute inset-0"
          />
        </div>
        <p className="text-[12px] text-white/45 min-h-[16px]">
          {status || "Закинь своё фото — глубина посчитается прямо в браузере."}
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <label className={`text-[13px] px-4 py-2 rounded-full border transition-colors cursor-pointer ${busy ? "opacity-50 pointer-events-none" : "border-[#A6FF00]/50 text-[#A6FF00] bg-[#A6FF00]/10 hover:bg-[#A6FF00]/20"}`}>
            {busy ? "Обработка…" : "Загрузить фото"}
            <input type="file" accept="image/*" onChange={onFile} disabled={busy} className="hidden" />
          </label>
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

        <div className="flex flex-wrap gap-2 pt-1">
          <button onClick={recordClip} disabled={recording}
            className="text-[13px] px-4 py-2 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50">
            {recording ? "Запись…" : "Записать клип (webm)"}
          </button>
          <button onClick={saveAssets}
            className="text-[13px] px-4 py-2 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-colors">
            Скачать ассеты
          </button>
        </div>

        <p className="text-[12px] text-white/35 max-w-[440px]">
          Глубину считает Depth Anything прямо в браузере (модель грузится один
          раз). Наведи курсор на холст — облако отыгрывает объём.
        </p>
      </div>
    </div>
  );
}

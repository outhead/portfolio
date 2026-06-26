"use client";

/* ─────────────────────────────────────────────────────────────────
 * ParticleStudio — встроенный конструктор «фото → облако точек в 3D».
 * Загружаешь фото → сразу считается глубина (Depth Anything в браузере),
 * вырезается фон, собирается объёмное облако. Сохранение: клип + ассеты.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import ParticlePortrait, { type PointCloud } from "@/components/ParticlePortrait";

const DEFAULT_IMG = "/images/hero-portrait.png";
const DEFAULT_DEPTH = "/images/hero-depth.png";
const TJS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.2.4";
const THREE_URL = "https://esm.sh/three@0.161.0";
const GLTF_URL = "https://esm.sh/three@0.161.0/examples/jsm/loaders/GLTFLoader.js";
const OBJ_URL = "https://esm.sh/three@0.161.0/examples/jsm/loaders/OBJLoader.js";
const SAMPLER_URL = "https://esm.sh/three@0.161.0/examples/jsm/math/MeshSurfaceSampler.js";
const SAMPLE_COUNT = 45000;

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
  const [cloud, setCloud] = useState<PointCloud | null>(null);
  const [cloudKey, setCloudKey] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const is3D = !!cloud;

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
    setCloud(null); // выходим из 3D-режима
    const url = keepUrl(URL.createObjectURL(f));
    setPortrait(url);
    setDepth(undefined); // плоский предпросмотр, пока считается глубина
    process(url); // сразу обсчёт глубины
  }

  // 3D-модель → облако точек: сэмплим точки прямо с поверхности меша
  // (настоящий объём, крутится на 360°, без угадывания глубины).
  async function load3D(file: File) {
    setBusy(true);
    setStatus("Гружу 3D-движок…");
    try {
      const THREE = await cdnImport(THREE_URL);
      const { MeshSurfaceSampler } = await cdnImport(SAMPLER_URL);
      const ext = file.name.toLowerCase().split(".").pop();
      const url = keepUrl(URL.createObjectURL(file));
      let root: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (ext === "obj") {
        const { OBJLoader } = await cdnImport(OBJ_URL);
        root = await new OBJLoader().loadAsync(url);
      } else {
        const { GLTFLoader } = await cdnImport(GLTF_URL);
        const g = await new GLTFLoader().loadAsync(url);
        root = g.scene;
      }
      root.updateMatrixWorld(true);

      setStatus("Сэмплю точки с поверхности…");
      const meshes: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
      root.traverse((o: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (o.isMesh && o.geometry?.attributes?.position) meshes.push(o);
      });
      if (!meshes.length) throw new Error("в модели нет полигонов");

      const weights = meshes.map((m) => m.geometry.attributes.position.count);
      const wsum = weights.reduce((a: number, b: number) => a + b, 0) || 1;
      const pos = new Float32Array(SAMPLE_COUNT * 3);
      const col = new Float32Array(SAMPLE_COUNT * 3);
      const P = new THREE.Vector3();
      const C = new THREE.Color();
      let w = 0;
      for (let mi = 0; mi < meshes.length && w < SAMPLE_COUNT; mi++) {
        const mesh = meshes[mi];
        const cnt = mi === meshes.length - 1
          ? SAMPLE_COUNT - w
          : Math.round(SAMPLE_COUNT * weights[mi] / wsum);
        const sampler = new MeshSurfaceSampler(mesh).build();
        const hasVC = !!mesh.geometry.attributes.color;
        const matCol = mesh.material?.color ?? new THREE.Color(0.82, 0.86, 0.8);
        for (let k = 0; k < cnt && w < SAMPLE_COUNT; k++, w++) {
          if (hasVC) sampler.sample(P, null, C);
          else { sampler.sample(P); C.copy(matCol); }
          P.applyMatrix4(mesh.matrixWorld);
          pos[w * 3] = P.x; pos[w * 3 + 1] = P.y; pos[w * 3 + 2] = P.z;
          col[w * 3] = C.r; col[w * 3 + 1] = C.g; col[w * 3 + 2] = C.b;
        }
      }

      // нормализация в ~[-0.5,0.5] по самой длинной стороне
      let mnX = Infinity, mnY = Infinity, mnZ = Infinity, mxX = -Infinity, mxY = -Infinity, mxZ = -Infinity;
      for (let i = 0; i < w; i++) {
        const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
        if (x < mnX) mnX = x; if (y < mnY) mnY = y; if (z < mnZ) mnZ = z;
        if (x > mxX) mxX = x; if (y > mxY) mxY = y; if (z > mxZ) mxZ = z;
      }
      const cx = (mnX + mxX) / 2, cy = (mnY + mxY) / 2, cz = (mnZ + mxZ) / 2;
      const s = 1 / (Math.max(mxX - mnX, mxY - mnY, mxZ - mnZ) || 1);
      const positions = new Float32Array(w * 3), colors = new Float32Array(w * 3);
      for (let i = 0; i < w; i++) {
        positions[i * 3] = (pos[i * 3] - cx) * s;
        positions[i * 3 + 1] = (pos[i * 3 + 1] - cy) * s;
        positions[i * 3 + 2] = (pos[i * 3 + 2] - cz) * s;
        colors[i * 3] = col[i * 3]; colors[i * 3 + 1] = col[i * 3 + 1]; colors[i * 3 + 2] = col[i * 3 + 2];
      }

      setCloud({ positions, colors });
      setCloudKey(file.name + ":" + file.size + ":" + Date.now());
      setStatus("Готово: " + w.toLocaleString("ru") + " точек с модели. Крутится сама, мышь — наклон.");
    } catch (err) {
      console.error(err);
      setStatus("Не вышло загрузить 3D: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  }

  function on3D(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) load3D(f);
    e.target.value = "";
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
            key={`${is3D ? cloudKey : `${portrait}-${depth}`}-${count}`}
            src={portrait}
            depthSrc={depth}
            cloud={cloud}
            cloudKey={cloudKey}
            spin360={is3D}
            count={count}
            depthScale={depthScale}
            pointScale={pointScale}
            tilt={0.55}
            assembleOnHover={false}
            className="absolute inset-0"
          />
        </div>
        <p className="text-[12px] text-white/45 min-h-[16px]">
          {status || "Закинь фото (посчитаем глубину) или 3D-модель (.glb/.obj)."}
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap gap-2">
            <label className={`text-[13px] px-4 py-2 rounded-full border transition-colors cursor-pointer ${busy ? "opacity-50 pointer-events-none" : "border-[#A6FF00]/50 text-[#A6FF00] bg-[#A6FF00]/10 hover:bg-[#A6FF00]/20"}`}>
              {busy ? "Обработка…" : "Загрузить фото"}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} disabled={busy} className="hidden" />
            </label>
            <label className={`text-[13px] px-4 py-2 rounded-full border transition-colors cursor-pointer ${busy ? "opacity-50 pointer-events-none" : "border-white/15 text-white/70 hover:text-white hover:border-white/30"}`}>
              Загрузить 3D
              <input type="file" accept=".glb,.gltf,.obj" onChange={on3D} disabled={busy} className="hidden" />
            </label>
          </div>
          <p className="text-[12px] text-white/35">
            Фото: JPEG/PNG/WebP (HEIC с айфона может не открыться). 3D: .glb, .gltf
            или .obj — точки берутся прямо с поверхности модели, объём настоящий.
          </p>
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

"use client";

/* ─────────────────────────────────────────────────────────────────
 * ParticlePortrait — облако частиц по карте глубины.
 * Контроллер: декодит картинки и строит формы, затем гоняет рендер либо
 * в Web Worker на OffscreenCanvas (главный поток свободен — плавный скролл),
 * либо, если браузер не умеет OffscreenCanvas/worker, на главном потоке
 * тем же движком (ParticleEngine) — fallback.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef, type RefObject } from "react";
import { ParticleEngine, type EngineConfig, type EngineShape } from "./particleEngine";
import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";

export type Shape = { src: string; depth?: string; depthScale?: number };

/** Готовое облако точек (например, сэмпл с поверхности 3D-модели).
 *  positions/colors — плоские массивы xyz/rgb, координаты в ~[-0.5,0.5]. */
export type PointCloud = { positions: Float32Array; colors?: Float32Array | null };

export type ParticlePortraitProps = {
  src?: string;
  frames?: string[];
  depthSrc?: string;
  shapes?: Shape[];
  cloud?: PointCloud | null;
  cloudKey?: string;
  spin360?: boolean;
  active?: number;
  depthScale?: number;
  count?: number;
  color?: [number, number, number];
  brightness?: number;
  bulge?: number;
  relief?: number;
  tilt?: number;
  gamma?: number;
  pointScale?: number;
  assembleOnHover?: boolean;
  scatterOnHover?: boolean;
  latchAssemble?: boolean;
  forceAssemble?: boolean;
  autoSpin?: boolean;
  trackingRef?: RefObject<HTMLElement | null>;
  className?: string;
};

type Api = {
  shape: (idx: number, s: EngineShape) => void;
  active: (i: number) => void;
  force: (v: boolean) => void;
  pointer: (nx: number, ny: number, hover: boolean) => void;
  size: (w: number, h: number, dpr: number) => void;
  paused: (v: boolean) => void;
  dispose: () => void;
};

const clamp1 = (v: number) => (v < -1 ? -1 : v > 1 ? 1 : v);

export default function ParticlePortrait({
  src,
  frames,
  depthSrc,
  shapes,
  cloud,
  cloudKey,
  spin360 = false,
  active = 0,
  depthScale = 0.6,
  count = 5500,
  color = [235, 238, 230],
  brightness = 1,
  bulge = 0.42,
  relief = 0.06,
  tilt = 0.45,
  gamma = 1.05,
  pointScale = 1,
  assembleOnHover = true,
  scatterOnHover = false,
  latchAssemble = false,
  forceAssemble = false,
  autoSpin = false,
  trackingRef,
  className = "",
}: ParticlePortraitProps) {
  const locale = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Текущее API доставки (worker.postMessage или engine.*) — для пуша active/force.
  const apiRef = useRef<Api | null>(null);
  useEffect(() => {
    apiRef.current?.active(active);
    apiRef.current?.force(forceAssemble);
  }, [active, forceAssemble]);

  // нормализуем список форм
  const shapeList: Shape[] =
    shapes && shapes.length
      ? shapes
      : [{ src: src || (frames && frames[0]) || "/images/hero-portrait.png", depth: depthSrc }];
  const listKey = shapeList
    .map((s) => s.src + "|" + (s.depth || "") + "|" + (s.depthScale ?? ""))
    .join(";");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const list: Shape[] = listKey.split(";").map((s) => {
      const [sc, dp, ds] = s.split("|");
      return { src: sc, depth: dp || undefined, depthScale: ds ? Number(ds) : undefined };
    });
    const usingCloud = !!(cloud && cloud.positions && cloud.positions.length >= 3);
    const shapeCount = usingCloud ? 1 : list.length;
    const N = count;

    const cfg: EngineConfig = {
      N, color, brightness, bulge, tilt, pointScale,
      assembleOnHover, scatterOnHover, latchAssemble, autoSpin, spin360,
      reduce: !!reduce, shapeCount,
    };

    // ── построение форм (декод картинок) — всегда на главном потоке ──
    const sampler = document.createElement("canvas");
    const sctx = sampler.getContext("2d", { willReadFrequently: true })!;
    function buildShape(img: HTMLImageElement, depthImg: HTMLImageElement | null, dScale?: number): EngineShape {
      const dsEff = dScale ?? depthScale;
      const gw = 150;
      const gh = Math.max(1, Math.round(gw * (img.height / img.width)));
      sampler.width = gw; sampler.height = gh;
      sctx.clearRect(0, 0, gw, gh);
      sctx.drawImage(img, 0, 0, gw, gh);
      const d = sctx.getImageData(0, 0, gw, gh).data;
      let depth: Uint8ClampedArray | null = null;
      let dmin = 1, dmax = 0;
      if (depthImg) {
        sctx.clearRect(0, 0, gw, gh);
        sctx.drawImage(depthImg, 0, 0, gw, gh);
        depth = sctx.getImageData(0, 0, gw, gh).data;
        for (let i = 0, p = 0; i < d.length; i += 4, p++) {
          const al = d[i + 3] / 255;
          const l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255 * al;
          if (l < 0.05) continue;
          const dz = depth[p * 4] / 255;
          if (dz < dmin) dmin = dz;
          if (dz > dmax) dmax = dz;
        }
        if (dmax <= dmin) { dmin = 0; dmax = 1; }
      }
      const n = gw * gh;
      const lum = new Float32Array(n), cum = new Float32Array(n);
      let total = 0;
      for (let i = 0, p = 0; i < d.length; i += 4, p++) {
        const al = d[i + 3] / 255;
        let l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
        l = Math.pow(l, gamma) * al;
        lum[p] = l; total += l; cum[p] = total;
      }
      const X = new Float32Array(N), Y = new Float32Array(N), Z = new Float32Array(N), b = new Float32Array(N);
      const aspect = gh / gw;
      for (let i = 0; i < N; i++) {
        const rnd = Math.random() * total;
        let lo = 0, hi = n - 1;
        while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < rnd) lo = m + 1; else hi = m; }
        const gx = lo % gw, gy = (lo / gw) | 0;
        const nx = (gx + Math.random()) / gw - 0.5;
        const ny = ((gy + Math.random()) / gh - 0.5) * aspect;
        X[i] = nx; Y[i] = ny;
        if (depth) {
          const dz = (depth[lo * 4] / 255 - dmin) / (dmax - dmin);
          Z[i] = (dz - 0.5) * dsEff;
        } else {
          Z[i] = (lum[lo] - 0.5) * 0.3;
        }
        b[i] = lum[lo];
      }
      return { X, Y, Z, b, aspect };
    }
    function buildCloud(c: PointCloud, dScale?: number): EngineShape {
      const zMul = (dScale ?? depthScale) / 0.6;
      const M = (c.positions.length / 3) | 0;
      const X = new Float32Array(N), Y = new Float32Array(N), Z = new Float32Array(N), b = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const j = (Math.random() * M) | 0;
        X[i] = c.positions[j * 3];
        Y[i] = -c.positions[j * 3 + 1];
        Z[i] = c.positions[j * 3 + 2] * zMul;
        let lum = 0.82;
        if (c.colors) {
          const r = c.colors[j * 3], g = c.colors[j * 3 + 1], bl = c.colors[j * 3 + 2];
          lum = 0.299 * r + 0.587 * g + 0.114 * bl;
        }
        b[i] = Math.max(0.18, Math.min(1, lum));
      }
      return { X, Y, Z, b, aspect: 1 };
    }

    // ── путь рендера: worker (OffscreenCanvas) или главный поток (fallback) ──
    let worker: Worker | null = null;
    let engine: ParticleEngine | null = null;
    let api: Api;
    let reused = false;

    const canWorker =
      typeof Worker !== "undefined" &&
      typeof OffscreenCanvas !== "undefined" &&
      "transferControlToOffscreen" in HTMLCanvasElement.prototype;

    // StrictMode/HMR перемонтируют эффект, а transferControlToOffscreen допускается
    // над канвасом лишь однажды → кэшируем воркер на DOM-элементе и переиспользуем;
    // терминируем с отложкой, которая отменяется при быстром повторном монтировании.
    const stash = canvas as unknown as {
      __ppWorker?: Worker;
      __ppKill?: ReturnType<typeof setTimeout>;
    };
    if (stash.__ppKill) { clearTimeout(stash.__ppKill); stash.__ppKill = undefined; }

    if (canWorker) {
      try {
        if (stash.__ppWorker) {
          worker = stash.__ppWorker; reused = true;
        } else {
          const off = canvas.transferControlToOffscreen();
          worker = new Worker(new URL("./particlePortrait.worker.ts", import.meta.url), { type: "module" });
          worker.postMessage({ type: "init", canvas: off, cfg }, [off]);
          stash.__ppWorker = worker;
        }
        api = {
          shape: (idx, s) =>
            worker!.postMessage(
              { type: "shape", idx, X: s.X, Y: s.Y, Z: s.Z, b: s.b, aspect: s.aspect },
              [s.X.buffer, s.Y.buffer, s.Z.buffer, s.b.buffer],
            ),
          active: (i) => worker!.postMessage({ type: "active", i }),
          force: (v) => worker!.postMessage({ type: "force", v }),
          pointer: (nx, ny, hover) => worker!.postMessage({ type: "pointer", nx, ny, hover }),
          size: (w, h, dpr) => worker!.postMessage({ type: "size", cssW: w, cssH: h, dpr }),
          paused: (v) => worker!.postMessage({ type: "paused", v }),
          dispose: () => {},
        };
      } catch {
        worker = null;
      }
    }

    if (!worker) {
      // fallback: рисуем на главном потоке тем же движком
      let ctx: CanvasRenderingContext2D | null = null;
      try { ctx = canvas.getContext("2d"); } catch { ctx = null; }
      if (!ctx) return;
      engine = new ParticleEngine(ctx, cfg);
      api = {
        shape: (idx, s) => engine!.setShape(idx, s),
        active: (i) => engine!.setActive(i),
        force: (v) => engine!.setForce(v),
        pointer: (nx, ny, hover) => engine!.setPointer(nx, ny, hover),
        size: (w, h, dpr) => engine!.setSize(w, h, dpr),
        paused: (v) => engine!.setPaused(v),
        dispose: () => engine!.dispose(),
      };
    }

    apiRef.current = api!;

    // начальные размер/состояние
    const rect0 = canvas.getBoundingClientRect();
    api!.size(rect0.width || 1, rect0.height || 1, Math.min(window.devicePixelRatio || 1, 1.5));
    api!.active(active);
    api!.force(forceAssemble);
    api!.paused(false);

    // формы строим/шлём только при первом создании (переиспользуемый воркер их уже имеет)
    if (!reused) {
      if (usingCloud) {
        api!.shape(0, buildCloud(cloud!));
      } else {
        list.forEach((sh, idx) => {
          const img = new Image();
          let depthImg: HTMLImageElement | null = null;
          let need = sh.depth ? 2 : 1, got = 0;
          const ready = () => {
            if (++got < need) return;
            api!.shape(idx, buildShape(img, depthImg, sh.depthScale));
          };
          img.onload = ready; img.onerror = ready; img.src = sh.src;
          if (sh.depth) {
            depthImg = new Image();
            depthImg.onload = ready;
            depthImg.onerror = () => { depthImg = null; need = 1; ready(); };
            depthImg.src = sh.depth;
          }
        });
      }
    }

    // ── события (главный поток) → доставка ──
    const eventTarget: HTMLElement = (trackingRef && trackingRef.current) || canvas;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      api!.pointer(
        clamp1((e.clientX - r.left - r.width / 2) / (r.width / 2)),
        clamp1((e.clientY - r.top - r.height / 2) / (r.height / 2)),
        true,
      );
    };
    const onEnter = () => api!.pointer(0, 0, true);
    const onLeave = () => api!.pointer(0, 0, false);
    eventTarget.addEventListener("pointermove", onMove);
    eventTarget.addEventListener("pointerenter", onEnter);
    eventTarget.addEventListener("pointerleave", onLeave);

    const ro = new ResizeObserver(() => {
      const r = canvas.getBoundingClientRect();
      api!.size(r.width || 1, r.height || 1, Math.min(window.devicePixelRatio || 1, 1.5));
    });
    ro.observe(canvas);

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => api!.paused(!entries.some((e) => e.isIntersecting)),
        { rootMargin: "100px" },
      );
      io.observe(canvas);
    }
    const onVis = () => api!.paused(document.hidden);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      apiRef.current = null;
      ro.disconnect();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      eventTarget.removeEventListener("pointermove", onMove);
      eventTarget.removeEventListener("pointerenter", onEnter);
      eventTarget.removeEventListener("pointerleave", onLeave);
      if (worker) {
        const w = worker;
        try { w.postMessage({ type: "paused", v: true }); } catch { /* */ }
        // отложенная терминация — отменится, если эффект быстро перемонтируется
        stash.__ppKill = setTimeout(() => {
          try { w.postMessage({ type: "dispose" }); w.terminate(); } catch { /* */ }
          stash.__ppWorker = undefined;
          stash.__ppKill = undefined;
        }, 150);
      } else if (engine) {
        engine.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey, cloudKey, spin360, depthScale, count, color.join(","), brightness, bulge, relief, tilt, gamma, pointScale, assembleOnHover, scatterOnHover, latchAssemble, autoSpin, trackingRef]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-label={pick("Портрет из частиц", "Particle portrait", locale)}
      role="img"
    />
  );
}

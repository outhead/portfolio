"use client";

/* ─────────────────────────────────────────────────────────────────
 * ParticlePortrait — облако частиц по карте глубины.
 * • Несколько форм (shapes): портрет / награда / и т.п. Частицы плавно
 *   перетекают между формами по проп `active` (пружинная физика).
 * • Глубина из depth-карты → объём; поворот за курсором.
 * • assembleOnHover: в покое облако рассыпано, по наведению собирается.
 * Рендер — прямой записью в пиксельный буфер (быстро).
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef, type RefObject } from "react";

export type Shape = { src: string; depth?: string; depthScale?: number };

export type ParticlePortraitProps = {
  src?: string;
  frames?: string[];
  depthSrc?: string;
  shapes?: Shape[];
  /** индекс активной формы (морф при смене) */
  active?: number;
  depthScale?: number;
  count?: number;
  color?: [number, number, number];
  bulge?: number;
  relief?: number;
  tilt?: number;
  gamma?: number;
  /** масштаб размера точки (меньше = мельче зерно) */
  pointScale?: number;
  assembleOnHover?: boolean;
  /** после первого наведения остаётся собранным (не разлетается) */
  latchAssemble?: boolean;
  /** постоянное медленное вращение даже в собранном состоянии */
  autoSpin?: boolean;
  trackingRef?: RefObject<HTMLElement | null>;
  className?: string;
};

export default function ParticlePortrait({
  src,
  frames,
  depthSrc,
  shapes,
  active = 0,
  depthScale = 0.6,
  count = 5500,
  color = [235, 238, 230],
  bulge = 0.42,
  relief = 0.06,
  tilt = 0.45,
  gamma = 1.05,
  pointScale = 1,
  assembleOnHover = true,
  latchAssemble = false,
  autoSpin = false,
  trackingRef,
  className = "",
}: ParticlePortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const [CR, CG, CB] = color;
    const N = count;
    const list: Shape[] = listKey.split(";").map((s) => {
      const [sc, dp, ds] = s.split("|");
      return { src: sc, depth: dp || undefined, depthScale: ds ? Number(ds) : undefined };
    });

    type ShapeData = { X: Float32Array; Y: Float32Array; Z: Float32Array; b: Float32Array; aspect: number };
    const data: (ShapeData | null)[] = list.map(() => null);

    const sampler = document.createElement("canvas");
    const sctx = sampler.getContext("2d", { willReadFrequently: true })!;

    function buildShape(img: HTMLImageElement, depthImg: HTMLImageElement | null, dScale?: number): ShapeData {
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
      const halfH = aspect / 2;
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
          // Без карты глубины — ПЛОСКИЙ предпросмотр с лёгким рельефом по
          // яркости (никакой полусферы-«шара»). Объём даёт «Обработать».
          Z[i] = (lum[lo] - 0.5) * 0.3;
        }
        b[i] = lum[lo];
      }
      return { X, Y, Z, b, aspect };
    }

    // загрузка всех форм
    let firstReady = false;
    list.forEach((sh, idx) => {
      const img = new Image();
      let depthImg: HTMLImageElement | null = null;
      let need = sh.depth ? 2 : 1, got = 0;
      const ready = () => {
        if (++got < need) return;
        data[idx] = buildShape(img, depthImg, sh.depthScale);
        if (!firstReady) { firstReady = true; start(); }
      };
      img.onload = ready; img.onerror = ready; img.src = sh.src;
      if (sh.depth) {
        depthImg = new Image();
        depthImg.onload = ready;
        depthImg.onerror = () => { depthImg = null; need = 1; ready(); };
        depthImg.src = sh.depth;
      }
    });

    // ── размер ────────────────────────────────────────────────────
    let dpr = 1, cssW = 1, cssH = 1, scale = 1, cx = 0, cy = 0, curAspect = 1.25;
    let W2 = 1, H2 = 1;
    let imgData: ImageData | null = null, buf32: Uint32Array | null = null;
    function computeScale() {
      scale = Math.min(cssW, cssH / curAspect) * 0.95 * dpr;
      cx = W2 / 2; cy = H2 / 2;
    }
    function resize() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = Math.max(1, rect.width); cssH = Math.max(1, rect.height);
      W2 = Math.round(cssW * dpr); H2 = Math.round(cssH * dpr);
      canvas!.width = W2; canvas!.height = H2;
      imgData = ctx!.createImageData(W2, H2);
      buf32 = new Uint32Array(imgData.data.buffer);
      computeScale();
    }

    // ── частицы ───────────────────────────────────────────────────
    const px = new Float32Array(N), py = new Float32Array(N), pz = new Float32Array(N);
    const vx = new Float32Array(N), vy = new Float32Array(N), vz = new Float32Array(N);
    const sX = new Float32Array(N), sY = new Float32Array(N), sZ = new Float32Array(N), sPe = new Float32Array(N);
    const hX = new Float32Array(N), hY = new Float32Array(N), hZ = new Float32Array(N);
    let inited = false;
    function initP() {
      for (let i = 0; i < N; i++) {
        const a = Math.random() * Math.PI * 2, rr = 0.5 + Math.random() * 0.45;
        hX[i] = Math.cos(a) * rr; hY[i] = (Math.random() - 0.5) * 1.6; hZ[i] = Math.sin(a) * rr;
        px[i] = hX[i]; py[i] = hY[i]; pz[i] = hZ[i];
        vx[i] = vy[i] = vz[i] = 0;
      }
      inited = true;
    }

    // ── курсор / сборка ───────────────────────────────────────────
    let nrx = 0, nry = 0, tnx = 0, tny = 0, hoverT = 0, assemble = 0;
    const eventTarget: HTMLElement = (trackingRef && trackingRef.current) || canvas;
    function onMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      tnx = Math.max(-1, Math.min(1, (e.clientX - rect.left - cssW / 2) / (cssW / 2)));
      tny = Math.max(-1, Math.min(1, (e.clientY - rect.top - cssH / 2) / (cssH / 2)));
      hoverT = 1;
    }
    function onEnter() { hoverT = 1; }
    function onLeave() { hoverT = 0; tnx = 0; tny = 0; }
    eventTarget.addEventListener("pointermove", onMove);
    eventTarget.addEventListener("pointerenter", onEnter);
    eventTarget.addEventListener("pointerleave", onLeave);

    // ── цикл ──────────────────────────────────────────────────────
    let raf = 0, stopped = false, lt = 0, spin = 0, needResize = false, everHovered = false;
    const K = 3.6, DAMP = 3.4, fLen = 2.4;

    function start() {
      resize();
      if (!inited) initP();
      lt = performance.now();
      raf = requestAnimationFrame(loop);
    }

    function loop(now: number) {
      if (stopped) return;
      raf = requestAnimationFrame(loop);
      let dt = (now - lt) / 1000; lt = now;
      if (dt > 0.05) dt = 0.05;
      if (!inited) return;
      if (needResize) { resize(); needResize = false; }

      // активная форма (с фолбэком на ближайшую готовую)
      let ai = activeRef.current | 0;
      if (ai < 0) ai = 0; if (ai >= data.length) ai = data.length - 1;
      let s = data[ai];
      if (!s) { for (let k = 0; k < data.length; k++) if (data[k]) { s = data[k]; break; } }
      if (!s || !buf32 || !imgData) return;
      // Плавный переход аспекта/масштаба — иначе при смене формы точки
      // скачком меняют размер до начала пружинного морфа.
      curAspect += (s.aspect - curAspect) * Math.min(1, dt * 4);
      computeScale();

      if (hoverT > 0) everHovered = true;
      const target = assembleOnHover ? (latchAssemble && everHovered ? 1 : hoverT) : 1;
      assemble += (target - assemble) * Math.min(1, dt * 1.8);
      if (reduce) assemble = target;
      const asmE = assemble * assemble * (3 - 2 * assemble);

      nrx += (tnx - nrx) * 0.06; nry += (tny - nry) * 0.06;
      spin += dt * 0.2;
      // autoSpin — покачивание влево-вправо (а не оборот вокруг), чтобы лицо
      // всегда смотрело на зрителя и отыгрывало объём.
      const auto = autoSpin ? Math.sin(spin * 0.6) * 0.55 : 0;
      const yaw = (1 - asmE) * spin + asmE * (nrx * tilt + auto) + Math.sin(spin) * 0.06 * (1 - asmE);
      const pitch = asmE * (-nry * tilt);
      const sYa = Math.sin(yaw), cYa = Math.cos(yaw), sPi = Math.sin(pitch), cPi = Math.cos(pitch);

      const sX0 = s.X, sY0 = s.Y, sZ0 = s.Z;
      for (let i = 0; i < N; i++) {
        const tx = hX[i] + (sX0[i] - hX[i]) * asmE;
        const ty = hY[i] + (sY0[i] - hY[i]) * asmE;
        const tz = hZ[i] + (sZ0[i] - hZ[i]) * asmE;
        vx[i] += ((tx - px[i]) * K - vx[i] * DAMP) * dt;
        vy[i] += ((ty - py[i]) * K - vy[i] * DAMP) * dt;
        vz[i] += ((tz - pz[i]) * K - vz[i] * DAMP) * dt;
        px[i] += vx[i] * dt; py[i] += vy[i] * dt; pz[i] += vz[i] * dt;
      }

      for (let i = 0; i < N; i++) {
        const x1 = cYa * px[i] + sYa * pz[i];
        const z1 = -sYa * px[i] + cYa * pz[i];
        const y1 = cPi * py[i] - sPi * z1;
        const z2 = sPi * py[i] + cPi * z1;
        const per = fLen / (fLen - z2);
        sX[i] = cx + x1 * scale * per;
        sY[i] = cy + y1 * scale * per;
        sZ[i] = z2; sPe[i] = per;
      }

      buf32.fill(0);
      const dInv = 1 / (bulge * 2);
      const rgb = CR | (CG << 8) | (CB << 16);
      const fbA = s.b;
      for (let i = 0; i < N; i++) {
        const per = sPe[i];
        let dN = (sZ[i] + bulge) * dInv; if (dN < 0) dN = 0; else if (dN > 1) dN = 1;
        const bright = 0.45 + 0.55 * fbA[i];
        const a = (0.3 + 0.7 * (asmE * bright + (1 - asmE) * 0.45)) * (0.55 + 0.45 * dN);
        if (a < 0.02) continue;
        let sz = ((0.7 + (asmE * fbA[i] + (1 - asmE) * 0.3) * 1.7) * per * (0.7 + 0.3 * dN) * dpr * pointScale) | 0;
        if (sz < 1) sz = 1; else if (sz > 6) sz = 6;
        const col = rgb | (((a * 255) | 0) << 24);
        const dx = sX[i] | 0, dy = sY[i] | 0, half = sz >> 1;
        const y0 = dy - half, x0 = dx - half;
        for (let yy = y0; yy < y0 + sz; yy++) {
          if (yy < 0 || yy >= H2) continue;
          const row = yy * W2;
          for (let xx = x0; xx < x0 + sz; xx++) {
            if (xx < 0 || xx >= W2) continue;
            buf32[row + xx] = col;
          }
        }
      }
      ctx!.putImageData(imgData, 0, 0);
    }

    const ro = new ResizeObserver(() => { needResize = true; });
    ro.observe(canvas);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      eventTarget.removeEventListener("pointermove", onMove);
      eventTarget.removeEventListener("pointerenter", onEnter);
      eventTarget.removeEventListener("pointerleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey, depthScale, count, color.join(","), bulge, relief, tilt, gamma, pointScale, assembleOnHover, latchAssemble, autoSpin, trackingRef]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-label="Портрет из частиц"
      role="img"
    />
  );
}

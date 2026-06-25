"use client";

/* ─────────────────────────────────────────────────────────────────
 * ParticlePortrait v4 — одна картинка, сборка по наведению.
 * Покой: облако точек рассыпано и тихо кружит.
 * Наводишь курсор → точки слетаются в лицо (пружины). Уводишь →
 * рассыпаются обратно. Лёгкий 3D-наклон за курсором, когда собрано.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef, type RefObject } from "react";

export type ParticlePortraitProps = {
  src?: string;
  /** алиас: если передан массив — берём первый кадр */
  frames?: string[];
  /** карта глубины (Depth Anything): ярче = ближе. Если есть — z из неё */
  depthSrc?: string;
  /** масштаб глубины из карты */
  depthScale?: number;
  count?: number;
  color?: [number, number, number];
  bulge?: number;
  relief?: number;
  tilt?: number;
  gamma?: number;
  /** собирать по наведению (true) или держать собранным (false) */
  assembleOnHover?: boolean;
  trackingRef?: RefObject<HTMLElement | null>;
  className?: string;
};

export default function ParticlePortrait({
  src,
  frames,
  depthSrc,
  depthScale = 0.55,
  count = 7000,
  color = [235, 238, 230],
  bulge = 0.42,
  relief = 0.06,
  tilt = 0.45,
  gamma = 1.05,
  assembleOnHover = true,
  trackingRef,
  className = "",
}: ParticlePortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const url = src || (frames && frames[0]) || "/images/hero-portrait.png";

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

    // ── цели лица + дом-россыпь ───────────────────────────────────
    const fX = new Float32Array(N), fY = new Float32Array(N), fZ = new Float32Array(N), fb = new Float32Array(N);
    const hX = new Float32Array(N), hY = new Float32Array(N), hZ = new Float32Array(N);
    let aspect = 1.25;
    let built = false;

    const sampler = document.createElement("canvas");
    const sctx = sampler.getContext("2d", { willReadFrequently: true })!;

    function build(img: HTMLImageElement, depthImg: HTMLImageElement | null) {
      const gw = 150;
      const gh = Math.max(1, Math.round(gw * (img.height / img.width)));
      sampler.width = gw; sampler.height = gh;
      sctx.clearRect(0, 0, gw, gh);
      sctx.drawImage(img, 0, 0, gw, gh);
      const d = sctx.getImageData(0, 0, gw, gh).data;
      // карта глубины — в ту же сетку
      let depth: Uint8ClampedArray | null = null;
      let dmin = 1, dmax = 0;
      if (depthImg) {
        sctx.clearRect(0, 0, gw, gh);
        sctx.drawImage(depthImg, 0, 0, gw, gh);
        depth = sctx.getImageData(0, 0, gw, gh).data;
        // диапазон глубины по точкам лица (где есть сигнал портрета)
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
      aspect = gh / gw;
      const halfH = aspect / 2;
      for (let i = 0; i < N; i++) {
        const rnd = Math.random() * total;
        let lo = 0, hi = n - 1;
        while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < rnd) lo = m + 1; else hi = m; }
        const gx = lo % gw, gy = (lo / gw) | 0;
        const nx = (gx + Math.random()) / gw - 0.5;
        const ny = ((gy + Math.random()) / gh - 0.5) * aspect;
        fX[i] = nx; fY[i] = ny;
        if (depth) {
          const dz = (depth[lo * 4] / 255 - dmin) / (dmax - dmin); // 0..1 по лицу
          fZ[i] = (dz - 0.5) * depthScale;
        } else {
          const ex = nx / 0.5, ey = ny / (halfH || 1);
          const inside = Math.max(0, 1 - ex * ex - ey * ey);
          fZ[i] = Math.sqrt(inside) * bulge + (lum[lo] - 0.5) * relief;
        }
        fb[i] = lum[lo];
        // дом — россыпь в объёме
        const a = Math.random() * Math.PI * 2;
        const rr = 0.5 + Math.random() * 0.45;
        hX[i] = Math.cos(a) * rr;
        hY[i] = (Math.random() - 0.5) * (aspect + 0.5);
        hZ[i] = Math.sin(a) * rr;
      }
      built = true;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    let depthImg: HTMLImageElement | null = null;
    let need = depthSrc ? 2 : 1;
    let got = 0;
    const onReady = () => { if (++got >= need) { build(img, depthImg); start(); } };
    img.onload = onReady;
    img.src = url;
    if (depthSrc) {
      depthImg = new Image();
      depthImg.crossOrigin = "anonymous";
      depthImg.onload = onReady;
      depthImg.onerror = () => { depthImg = null; need = 1; onReady(); };
      depthImg.src = depthSrc;
    }

    // ── размер ────────────────────────────────────────────────────
    let dpr = 1, cssW = 1, cssH = 1, scale = 1, cx = 0, cy = 0;
    function resize() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      canvas!.width = Math.round(cssW * dpr);
      canvas!.height = Math.round(cssH * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      scale = Math.min(cssW, cssH / aspect) * 0.96;
      cx = cssW / 2;
      cy = cssH - (cssH - scale * aspect) / 2 - (scale * aspect) / 2;
    }

    // ── частицы ───────────────────────────────────────────────────
    const px = new Float32Array(N), py = new Float32Array(N), pz = new Float32Array(N);
    const vx = new Float32Array(N), vy = new Float32Array(N), vz = new Float32Array(N);
    const order = new Int32Array(N);
    const sX = new Float32Array(N), sY = new Float32Array(N), sZ = new Float32Array(N), sPe = new Float32Array(N);
    let inited = false;
    function initP() {
      for (let i = 0; i < N; i++) {
        px[i] = hX[i]; py[i] = hY[i]; pz[i] = hZ[i];
        vx[i] = vy[i] = vz[i] = 0; order[i] = i;
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
    let raf = 0, stopped = false, lt = 0, spin = 0;
    const K = 5.5, DAMP = 4.0, fLen = 2.4;

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
      if (!inited || !built) return;

      const target = assembleOnHover ? hoverT : 1;
      // плавная сборка/распад
      assemble += (target - assemble) * Math.min(1, dt * 3.2);
      if (reduce) assemble = target;
      const asmE = assemble * assemble * (3 - 2 * assemble); // ease

      nrx += (tnx - nrx) * 0.06;
      nry += (tny - nry) * 0.06;
      spin += dt * 0.2;
      // в покое — медленный круговой дрейф облака; собрано — наклон за курсором
      const yaw = (1 - asmE) * spin + asmE * (nrx * tilt) + Math.sin(spin) * 0.06 * (1 - asmE);
      const pitch = asmE * (-nry * tilt);
      const sY2 = Math.sin(yaw), cY2 = Math.cos(yaw), sP = Math.sin(pitch), cP = Math.cos(pitch);

      for (let i = 0; i < N; i++) {
        const tx = hX[i] + (fX[i] - hX[i]) * asmE;
        const ty = hY[i] + (fY[i] - hY[i]) * asmE;
        const tz = hZ[i] + (fZ[i] - hZ[i]) * asmE;
        const ax = (tx - px[i]) * K - vx[i] * DAMP;
        const ay = (ty - py[i]) * K - vy[i] * DAMP;
        const az = (tz - pz[i]) * K - vz[i] * DAMP;
        vx[i] += ax * dt; vy[i] += ay * dt; vz[i] += az * dt;
        px[i] += vx[i] * dt; py[i] += vy[i] * dt; pz[i] += vz[i] * dt;
      }

      for (let i = 0; i < N; i++) {
        const x1 = cY2 * px[i] + sY2 * pz[i];
        const z1 = -sY2 * px[i] + cY2 * pz[i];
        const y1 = cP * py[i] - sP * z1;
        const z2 = sP * py[i] + cP * z1;
        const per = fLen / (fLen - z2);
        sX[i] = cx + x1 * scale * per;
        sY[i] = cy + y1 * scale * per;
        sZ[i] = z2; sPe[i] = per;
      }

      for (let i = 1; i < N; i++) {
        const oi = order[i], zi = sZ[oi]; let j = i - 1;
        while (j >= 0 && sZ[order[j]] > zi) { order[j + 1] = order[j]; j--; }
        order[j + 1] = oi;
      }

      ctx!.clearRect(0, 0, cssW, cssH);
      for (let k = 0; k < N; k++) {
        const i = order[k];
        const per = sPe[i];
        const dN = Math.max(0, Math.min(1, (sZ[i] + bulge) / (bulge * 2)));
        // в покое точки тусклее и ровнее; собрано — яркость по лицу
        const bright = 0.35 + 0.65 * fb[i];
        const a = (0.18 + 0.82 * (asmE * bright + (1 - asmE) * 0.4)) * (0.5 + 0.5 * dN);
        if (a < 0.015) continue;
        const r = (0.7 + (asmE * fb[i] + (1 - asmE) * 0.3) * 1.7) * per * (0.7 + 0.3 * dN);
        ctx!.fillStyle = `rgba(${CR},${CG},${CB},${a.toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(sX[i], sY[i], r, 0, 6.283);
        ctx!.fill();
      }
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      eventTarget.removeEventListener("pointermove", onMove);
      eventTarget.removeEventListener("pointerenter", onEnter);
      eventTarget.removeEventListener("pointerleave", onLeave);
    };
  }, [url, depthSrc, depthScale, count, color, bulge, relief, tilt, gamma, assembleOnHover, trackingRef]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-label="Портрет из частиц, собирается по наведению"
      role="img"
    />
  );
}

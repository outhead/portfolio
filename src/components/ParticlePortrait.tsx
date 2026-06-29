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

/** Готовое облако точек (например, сэмпл с поверхности 3D-модели).
 *  positions/colors — плоские массивы xyz/rgb, координаты в ~[-0.5,0.5]. */
export type PointCloud = { positions: Float32Array; colors?: Float32Array | null };

export type ParticlePortraitProps = {
  src?: string;
  frames?: string[];
  depthSrc?: string;
  shapes?: Shape[];
  /** готовое облако точек (3D-модель) — перебивает src/shapes */
  cloud?: PointCloud | null;
  /** ключ-детектор смены облака (для пересборки) */
  cloudKey?: string;
  /** непрерывное вращение вокруг оси Y (турнтейбл для 3D) */
  spin360?: boolean;
  /** индекс активной формы (морф при смене) */
  active?: number;
  depthScale?: number;
  count?: number;
  color?: [number, number, number];
  /** множитель яркости точек (1 — без изменений, >1 — ярче) */
  brightness?: number;
  bulge?: number;
  relief?: number;
  tilt?: number;
  gamma?: number;
  /** масштаб размера точки (меньше = мельче зерно) */
  pointScale?: number;
  assembleOnHover?: boolean;
  /** инверсия: в покое собрано, по наведению РАЗЛЕТАЕТСЯ (для карточек) */
  scatterOnHover?: boolean;
  /** после первого наведения остаётся собранным (не разлетается) */
  latchAssemble?: boolean;
  /** принудительно собрать облако независимо от ховера (для пасхалок:
   *  клик по триггеру должен показать морф, даже если ещё не наводили) */
  forceAssemble?: boolean;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  // forceAssemble читаем через ref — слушатели/цикл вешаются один раз.
  const forceAssembleRef = useRef(forceAssemble);
  forceAssembleRef.current = forceAssemble;
  // Будилка цикла: смена формы (морф/пасхалки) и forceAssemble должны
  // оживить «замёрзший» в покое цикл рендера.
  const wakeRef = useRef<(() => void) | null>(null);
  useEffect(() => { wakeRef.current?.(); }, [active, forceAssemble]);

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

    // Облако точек из 3D-модели: сэмплим N точек из готового набора.
    function buildCloud(c: PointCloud, dScale?: number): ShapeData {
      const zMul = (dScale ?? depthScale) / 0.6;
      const M = (c.positions.length / 3) | 0;
      const X = new Float32Array(N), Y = new Float32Array(N), Z = new Float32Array(N), b = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const j = (Math.random() * M) | 0;
        X[i] = c.positions[j * 3];
        Y[i] = -c.positions[j * 3 + 1]; // 3D Y-up → экранный Y вниз
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

    // Режим 3D-облака: строим единственную форму сразу, картинки не грузим.
    if (cloud && cloud.positions && cloud.positions.length >= 3) {
      data[0] = buildCloud(cloud);
    } else
    // загрузка всех форм — просто заполняем data[idx]; цикл уже крутится
    list.forEach((sh, idx) => {
      const img = new Image();
      let depthImg: HTMLImageElement | null = null;
      let need = sh.depth ? 2 : 1, got = 0;
      const ready = () => {
        if (++got < need) return;
        data[idx] = buildShape(img, depthImg, sh.depthScale);
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
      dpr = Math.min(window.devicePixelRatio || 1, 1.5); // декоративный канвас — кап DPR ниже (−пиксели ∝ DPR²)
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
      hoverT = 1; wake();
    }
    function onEnter() { hoverT = 1; wake(); }
    function onLeave() { hoverT = 0; tnx = 0; tny = 0; wake(); }
    eventTarget.addEventListener("pointermove", onMove);
    eventTarget.addEventListener("pointerenter", onEnter);
    eventTarget.addEventListener("pointerleave", onLeave);

    // ── цикл ──────────────────────────────────────────────────────
    let raf = 0, stopped = false, paused = false, idle = false;
    let lt = 0, spin = 0, needResize = false, everHovered = false;
    const K = 3.6, DAMP = 3.4, fLen = 2.4;
    const continuous = autoSpin || spin360; // постоянное движение — не замораживаем
    let pDirty: [number, number, number, number] | null = null; // грязный прямоуг. прошлого кадра

    function tick() {
      if (stopped || paused || raf) return;
      lt = performance.now();
      raf = requestAnimationFrame(loop);
    }
    function wake() { idle = false; tick(); }
    wakeRef.current = wake;

    function loop(now: number) {
      raf = 0;
      if (stopped || paused) return;
      let dt = (now - lt) / 1000; lt = now;
      if (dt > 0.05) dt = 0.05;
      if (!inited) { raf = requestAnimationFrame(loop); return; }
      if (needResize) { resize(); needResize = false; pDirty = null; }

      // активная форма (с фолбэком на ближайшую готовую)
      let ai = activeRef.current | 0;
      if (ai < 0) ai = 0; if (ai >= data.length) ai = data.length - 1;
      let s = data[ai];
      if (!s) { for (let k = 0; k < data.length; k++) if (data[k]) { s = data[k]; break; } }
      if (!s || !buf32 || !imgData) { raf = requestAnimationFrame(loop); return; }
      // Плавный переход аспекта/масштаба — иначе при смене формы точки
      // скачком меняют размер до начала пружинного морфа.
      curAspect += (s.aspect - curAspect) * Math.min(1, dt * 4);
      computeScale();

      if (hoverT > 0) everHovered = true;
      const target = forceAssembleRef.current
        ? 1
        : scatterOnHover
        ? 1 - hoverT
        : assembleOnHover
          ? (latchAssemble && everHovered ? 1 : hoverT)
          : 1;
      assemble += (target - assemble) * Math.min(1, dt * 1.8);
      if (reduce) assemble = target;
      const asmE = assemble * assemble * (3 - 2 * assemble);

      nrx += (tnx - nrx) * 0.06; nry += (tny - nry) * 0.06;
      spin += dt * 0.2;
      // autoSpin — покачивание влево-вправо (а не оборот вокруг), чтобы лицо
      // всегда смотрело на зрителя и отыгрывало объём.
      const auto = autoSpin ? Math.sin(spin * 0.6) * 0.55 : 0;
      // spin360 — непрерывный оборот вокруг оси (турнтейбл для 3D-модели)
      const turn = spin360 ? spin * 0.5 : 0;
      const yaw = (1 - asmE) * spin + asmE * (nrx * tilt + auto + turn) + Math.sin(spin) * 0.06 * (1 - asmE);
      const pitch = asmE * (-nry * tilt);
      const sYa = Math.sin(yaw), cYa = Math.cos(yaw), sPi = Math.sin(pitch), cPi = Math.cos(pitch);

      const sX0 = s.X, sY0 = s.Y, sZ0 = s.Z;
      let maxErr2 = 0, maxV2 = 0;
      for (let i = 0; i < N; i++) {
        const tx = hX[i] + (sX0[i] - hX[i]) * asmE;
        const ty = hY[i] + (sY0[i] - hY[i]) * asmE;
        const tz = hZ[i] + (sZ0[i] - hZ[i]) * asmE;
        const ex = tx - px[i], ey = ty - py[i], ez = tz - pz[i];
        vx[i] += (ex * K - vx[i] * DAMP) * dt;
        vy[i] += (ey * K - vy[i] * DAMP) * dt;
        vz[i] += (ez * K - vz[i] * DAMP) * dt;
        px[i] += vx[i] * dt; py[i] += vy[i] * dt; pz[i] += vz[i] * dt;
        const e2 = ex * ex + ey * ey + ez * ez;
        const v2 = vx[i] * vx[i] + vy[i] * vy[i] + vz[i] * vz[i];
        if (e2 > maxErr2) maxErr2 = e2;
        if (v2 > maxV2) maxV2 = v2;
        // #4 деадзона: почти доехал и почти не движется → прибиваем к цели, гасим дрожание
        if (e2 < 1e-6 && v2 < 1e-6) { px[i] = tx; py[i] = ty; pz[i] = tz; vx[i] = 0; vy[i] = 0; vz[i] = 0; }
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

      // #3 чистим только прошлый грязный прямоугольник (не весь буфер)
      if (pDirty) {
        const [px0, py0, px1, py1] = pDirty;
        for (let yy = py0; yy < py1; yy++) buf32.fill(0, yy * W2 + px0, yy * W2 + px1);
      }
      let cMinX = W2, cMinY = H2, cMaxX = 0, cMaxY = 0;
      const dInv = 1 / (bulge * 2);
      const rgb = CR | (CG << 8) | (CB << 16);
      const fbA = s.b;
      for (let i = 0; i < N; i++) {
        const per = sPe[i];
        let dN = (sZ[i] + bulge) * dInv; if (dN < 0) dN = 0; else if (dN > 1) dN = 1;
        const bright = 0.45 + 0.55 * fbA[i];
        let a = (0.3 + 0.7 * (asmE * bright + (1 - asmE) * 0.45)) * (0.55 + 0.45 * dN);
        a *= brightness;
        if (a > 1) a = 1;
        if (a < 0.02) continue;
        let sz = ((0.7 + (asmE * fbA[i] + (1 - asmE) * 0.3) * 1.7) * per * (0.7 + 0.3 * dN) * dpr * pointScale) | 0;
        if (sz < 1) sz = 1; else if (sz > 6) sz = 6;
        const col = rgb | (((a * 255) | 0) << 24);
        const dx = sX[i] | 0, dy = sY[i] | 0, half = sz >> 1;
        let yA = dy - half, xA = dx - half, yB = dy - half + sz, xB = dx - half + sz;
        if (yA < 0) yA = 0; if (xA < 0) xA = 0;
        if (yB > H2) yB = H2; if (xB > W2) xB = W2;
        if (xA >= xB || yA >= yB) continue;
        if (xA < cMinX) cMinX = xA; if (yA < cMinY) cMinY = yA;
        if (xB > cMaxX) cMaxX = xB; if (yB > cMaxY) cMaxY = yB;
        for (let yy = yA; yy < yB; yy++) {
          const row = yy * W2;
          for (let xx = xA; xx < xB; xx++) buf32[row + xx] = col;
        }
      }

      // заливаем в канвас только объединение прошлого и текущего прямоугольника
      let uMinX = cMinX, uMinY = cMinY, uMaxX = cMaxX, uMaxY = cMaxY;
      if (pDirty) {
        if (pDirty[0] < uMinX) uMinX = pDirty[0];
        if (pDirty[1] < uMinY) uMinY = pDirty[1];
        if (pDirty[2] > uMaxX) uMaxX = pDirty[2];
        if (pDirty[3] > uMaxY) uMaxY = pDirty[3];
      }
      if (uMaxX > uMinX && uMaxY > uMinY) {
        ctx!.putImageData(imgData, 0, 0, uMinX, uMinY, uMaxX - uMinX, uMaxY - uMinY);
      }
      pDirty = cMaxX > cMinX ? [cMinX, cMinY, cMaxX, cMaxY] : null;

      // #1 фриз: облако собрано и успокоилось, нет ховера и постоянного вращения → стоп
      const settled =
        !continuous && hoverT === 0 && assemble > 0.999 &&
        maxV2 < 1e-6 && maxErr2 < 1e-6 &&
        Math.abs(nrx) < 1e-3 && Math.abs(nry) < 1e-3 &&
        Math.abs(curAspect - s.aspect) < 1e-3;
      if (settled) idle = true;
      else raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(() => { needResize = true; wake(); });
    ro.observe(canvas);

    // #1 пауза вне экрана и в фоне вкладки — невидимое не анимируем
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          const vis = entries.some((e) => e.isIntersecting);
          if (vis) { paused = false; wake(); }
          else { paused = true; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
        },
        { rootMargin: "100px" },
      );
      io.observe(canvas);
    }
    const onVis = () => {
      if (document.hidden) { paused = true; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
      else { paused = false; wake(); }
    };
    document.addEventListener("visibilitychange", onVis);

    // Старт цикла сразу при монтировании — он сам дождётся готовности форм.
    resize();
    initP();
    tick();

    return () => {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      eventTarget.removeEventListener("pointermove", onMove);
      eventTarget.removeEventListener("pointerenter", onEnter);
      eventTarget.removeEventListener("pointerleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey, cloudKey, spin360, depthScale, count, color.join(","), brightness, bulge, relief, tilt, gamma, pointScale, assembleOnHover, scatterOnHover, latchAssemble, autoSpin, trackingRef]);

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

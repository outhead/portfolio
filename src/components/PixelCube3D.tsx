"use client";

/* ─────────────────────────────────────────────────────────────────
 * PixelCube3D — настоящий вращающийся 3D-куб, спроецированный в
 * дот-матрицу (LED-панель). 2D-анимация 3D: каждый кадр вершины куба
 * вращаются матрицами, грани закрашиваются с flat-shading и painter's
 * algorithm (перекрытие по глубине) в offscreen-буфер, затем буфер
 * сэмплится по фиксированной сетке точек — диоды зажигаются по яркости.
 *
 * Лого — настоящим знаком (SVG, перекрашен в белый) текстурой на КАЖДОЙ
 * грани (аффинная карта по 3 углам), с альфой по тому, насколько грань
 * повёрнута к зрителю.
 *
 * Все точки одного размера — яркость кодируется только цветом/альфой,
 * как на реальной LED-панели. Покой — медленное вращение, диоды
 * притушены. Ховер — живее и ярче. Уважает prefers-reduced-motion.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

type V3 = [number, number, number];

const VERTS: V3[] = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], // z=-1 (0..3)
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],     // z=1  (4..7)
];

// Грани: вершины в UV-порядке [ (0,0), (1,0), (1,1), (0,1) ], подобраны так,
// что U×V совпадает с outward-нормалью (одинаковая «рукость» → знак не
// зеркалится и одинаково ориентирован на всех гранях).
const FACES: { idx: [number, number, number, number]; n: V3 }[] = [
  { idx: [4, 5, 6, 7], n: [0, 0, 1] },   // front +z
  { idx: [1, 0, 3, 2], n: [0, 0, -1] },  // back  -z
  { idx: [5, 1, 2, 6], n: [1, 0, 0] },   // right +x
  { idx: [0, 4, 7, 3], n: [-1, 0, 0] },  // left  -x
  { idx: [7, 6, 2, 3], n: [0, 1, 0] },   // top   +y
  { idx: [0, 1, 5, 4], n: [0, -1, 0] },  // bottom -y
];

function rotate([x, y, z]: V3, ax: number, ay: number): V3 {
  let c = Math.cos(ay), s = Math.sin(ay);
  const x1 = x * c + z * s;
  const z1 = -x * s + z * c;
  c = Math.cos(ax); s = Math.sin(ax);
  const y1 = y * c - z1 * s;
  const z2 = y * s + z1 * c;
  return [x1, y1, z2];
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export default function PixelCube3D({
  color,
  logoSrc,
  grid = 44,
  className = "",
}: {
  color: string;
  /** URL знака (SVG/PNG). Будет перекрашен в белый и наложен на каждую грань. */
  logoSrc?: string;
  /** Точек на сторону дот-сетки. */
  grid?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const [br, bg, bb] = hexToRgb(color);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const S = 200;
    const buf = document.createElement("canvas");
    buf.width = S; buf.height = S;
    const bctx = buf.getContext("2d", { willReadFrequently: true })!;

    // белая версия знака
    const LS = 128;
    const logoTex = document.createElement("canvas");
    logoTex.width = LS; logoTex.height = LS;
    let logoReady = false;
    if (logoSrc) {
      const img = new Image();
      img.onload = () => {
        const lc = logoTex.getContext("2d")!;
        lc.clearRect(0, 0, LS, LS);
        // вписываем знак с небольшим полем
        const pad = LS * 0.12;
        const box = LS - pad * 2;
        const k = Math.min(box / img.width, box / img.height);
        const w = img.width * k, h = img.height * k;
        lc.drawImage(img, (LS - w) / 2, (LS - h) / 2, w, h);
        // перекраска всех непрозрачных пикселей в белый
        lc.globalCompositeOperation = "source-in";
        lc.fillStyle = "#ffffff";
        lc.fillRect(0, 0, LS, LS);
        lc.globalCompositeOperation = "source-over";
        logoReady = true;
      };
      img.src = logoSrc;
    }

    const light: V3 = (() => {
      const v: V3 = [-0.35, -0.55, 0.9];
      const m = Math.hypot(v[0], v[1], v[2]);
      return [v[0] / m, v[1] / m, v[2] / m];
    })();

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let outPx = 0;
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const size = Math.max(40, Math.min(r.width, r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      outPx = Math.round(size * dpr);
      canvas.width = outPx; canvas.height = outPx;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let ax = -0.42, ay = 0.7;
    let raf = 0;
    let last = performance.now();
    let lit = 0;

    // Текстурируем треугольник: texture(t0,t1,t2) → screen(s0,s1,s2).
    // Аффин на треугольник = кусочно-перспективная аппроксимация (без зеркала).
    type P = [number, number];
    const texTri = (
      s0: P, s1: P, s2: P, t0: P, t1: P, t2: P
    ) => {
      const e1x = t1[0] - t0[0], e1y = t1[1] - t0[1];
      const e2x = t2[0] - t0[0], e2y = t2[1] - t0[1];
      const det = e1x * e2y - e2x * e1y;
      if (Math.abs(det) < 1e-6) return;
      const f1x = s1[0] - s0[0], f1y = s1[1] - s0[1];
      const f2x = s2[0] - s0[0], f2y = s2[1] - s0[1];
      const a = (f1x * e2y - f2x * e1y) / det;
      const c = (-f1x * e2x + f2x * e1x) / det;
      const b = (f1y * e2y - f2y * e1y) / det;
      const d = (-f1y * e2x + f2y * e1x) / det;
      const e = s0[0] - (a * t0[0] + c * t0[1]);
      const f = s0[1] - (b * t0[0] + d * t0[1]);
      bctx.save();
      bctx.beginPath();
      bctx.moveTo(s0[0], s0[1]);
      bctx.lineTo(s1[0], s1[1]);
      bctx.lineTo(s2[0], s2[1]);
      bctx.closePath();
      bctx.clip();
      bctx.setTransform(a, b, c, d, e, f);
      bctx.drawImage(logoTex, 0, 0);
      bctx.setTransform(1, 0, 0, 1, 0, 0);
      bctx.restore();
    };

    const project = (v: V3): [number, number] => {
      const d = 4.4;
      const f = d / (d - v[2]);
      const sc = S * 0.29;
      return [S / 2 + v[0] * sc * f, S / 2 - v[1] * sc * f];
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = hoverRef.current ? 1 : 0;
      lit += (target - lit) * Math.min(1, dt * 6);

      ay += dt * (reduce ? 0 : 0.18 + lit * 0.5);
      ax = -0.42 + Math.sin(now / 2600) * 0.12;

      const rv = VERTS.map((v) => rotate(v, ax, ay));
      const pv = rv.map(project);

      bctx.clearRect(0, 0, S, S);
      const order = FACES.map((_, i) => ({
        i,
        z: FACES[i].idx.reduce((a, k) => a + rv[k][2], 0) / 4,
      })).sort((a, b) => a.z - b.z);

      for (const { i } of order) {
        const face = FACES[i];
        const rn = rotate(face.n, ax, ay);
        const lam = Math.max(0, rn[0] * light[0] + rn[1] * light[1] + rn[2] * light[2]);
        const shade = 0.2 + 0.8 * lam;
        const facing = rn[2];

        const p = face.idx.map((k) => pv[k]);
        bctx.beginPath();
        bctx.moveTo(p[0][0], p[0][1]);
        for (let k = 1; k < 4; k++) bctx.lineTo(p[k][0], p[k][1]);
        bctx.closePath();
        bctx.fillStyle = `rgb(${Math.round(br * shade)},${Math.round(bg * shade)},${Math.round(bb * shade)})`;
        bctx.fill();

        // знак на каждой грани, пока она к зрителю — два текстурных треугольника
        if (logoReady && facing > 0.04) {
          // p в UV-порядке: [ (0,0), (1,0), (1,1), (0,1) ]
          const s0 = p[0] as P, s1 = p[1] as P, s2 = p[2] as P, s3 = p[3] as P;
          const t0: P = [0, 0], t1: P = [LS, 0], t2: P = [LS, LS], t3: P = [0, LS];
          bctx.globalAlpha = Math.min(1, facing * 1.5);
          texTri(s0, s1, s2, t0, t1, t2);
          texTri(s0, s2, s3, t0, t2, t3);
          bctx.globalAlpha = 1;
        }
      }

      const data = bctx.getImageData(0, 0, S, S).data;

      ctx.clearRect(0, 0, outPx, outPx);
      const cell = outPx / grid;
      const rDot = cell * 0.34; // единый размер всех точек
      const bright = 0.42 + 0.58 * lit;
      for (let gy = 0; gy < grid; gy++) {
        for (let gx = 0; gx < grid; gx++) {
          const sx = Math.floor(((gx + 0.5) / grid) * S);
          const sy = Math.floor(((gy + 0.5) / grid) * S);
          const o = (sy * S + sx) * 4;
          const rr = data[o], gg = data[o + 1], bbb = data[o + 2], aa = data[o + 3];
          const cx = (gx + 0.5) * cell;
          const cy = (gy + 0.5) * cell;
          ctx.beginPath();
          ctx.arc(cx, cy, rDot, 0, Math.PI * 2);
          if (aa < 24) {
            ctx.fillStyle = `rgba(${br},${bg},${bb},0.06)`; // погашенный диод
          } else {
            const lum = (0.299 * rr + 0.587 * gg + 0.114 * bbb) / 255;
            ctx.fillStyle = `rgba(${rr},${gg},${bbb},${(0.3 + 0.7 * lum) * bright})`;
          }
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onEnter = () => (hoverRef.current = true);
    const onLeave = () => (hoverRef.current = false);
    wrap.addEventListener("mouseenter", onEnter);
    wrap.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener("mouseenter", onEnter);
      wrap.removeEventListener("mouseleave", onLeave);
    };
  }, [color, logoSrc, grid]);

  return (
    <div ref={wrapRef} className={`relative ${className}`} style={{ aspectRatio: "1 / 1" }}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

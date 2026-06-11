"use client";

/* ─────────────────────────────────────────────────────────────────
 * PixelCube3D — настоящий вращающийся 3D-куб, спроецированный в
 * дот-матрицу (LED-панель). 2D-анимация 3D: каждый кадр вершины куба
 * вращаются матрицами, грани закрашиваются с flat-shading и painter's
 * algorithm (перекрытие по глубине) в offscreen-буфер, затем буфер
 * сэмплится по фиксированной сетке точек — зажигаем диоды по яркости.
 *
 * Лого — текстурой на передней грани (аффинная карта по 3 углам),
 * гаснет когда грань отворачивается от зрителя.
 *
 * Покой — медленное холостое вращение, диоды притушены. Ховер —
 * вращение живее, матрица насыщается бренд-цветом. Уважает
 * prefers-reduced-motion.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

type V3 = [number, number, number];

const VERTS: V3[] = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], // задняя z=-1  (0..3)
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],     // передняя z=1 (4..7)
];

// Грани: индексы 4 вершин + нормаль. front=true несёт лого.
const FACES: { idx: [number, number, number, number]; n: V3; front?: boolean }[] = [
  { idx: [4, 5, 6, 7], n: [0, 0, 1], front: true },
  { idx: [1, 0, 3, 2], n: [0, 0, -1] },
  { idx: [5, 1, 2, 6], n: [1, 0, 0] },
  { idx: [0, 4, 7, 3], n: [-1, 0, 0] },
  { idx: [7, 6, 2, 3], n: [0, 1, 0] },
  { idx: [4, 0, 1, 5], n: [0, -1, 0] },
];

function rotate([x, y, z]: V3, ax: number, ay: number): V3 {
  // Y
  let c = Math.cos(ay), s = Math.sin(ay);
  let x1 = x * c + z * s;
  let z1 = -x * s + z * c;
  // X
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
  logoText,
  grid = 30,
  className = "",
}: {
  color: string;
  /** Текст-лого на передней грани (МТС). Для брендов со знаком — заменить на drawImage. */
  logoText?: string;
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

    // offscreen-буфер для software-рендера куба
    const S = 180;
    const buf = document.createElement("canvas");
    buf.width = S; buf.height = S;
    const bctx = buf.getContext("2d", { willReadFrequently: true })!;

    // offscreen для лого (рисуем текст один раз)
    const logo = document.createElement("canvas");
    const LS = 128;
    logo.width = LS; logo.height = LS;
    if (logoText) {
      const lctx = logo.getContext("2d")!;
      lctx.clearRect(0, 0, LS, LS);
      lctx.fillStyle = "#ffffff";
      lctx.textAlign = "center";
      lctx.textBaseline = "middle";
      lctx.font = `900 ${LS * 0.34}px ui-sans-serif, system-ui, sans-serif`;
      lctx.fillText(logoText, LS / 2, LS / 2 + LS * 0.02);
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
    let lit = 0; // 0..1 — насыщение (плавно к hover)

    const project = (v: V3): [number, number, number] => {
      const d = 4.2;
      const f = d / (d - v[2]);
      const sc = S * 0.3;
      return [S / 2 + v[0] * sc * f, S / 2 - v[1] * sc * f, v[2]];
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = hoverRef.current ? 1 : 0;
      lit += (target - lit) * Math.min(1, dt * 6);

      const baseSpin = reduce ? 0 : 0.18 + lit * 0.55;
      ay += dt * baseSpin;
      ax = -0.42 + Math.sin(now / 2600) * 0.12;

      // вращаем вершины
      const rv = VERTS.map((v) => rotate(v, ax, ay));
      const pv = rv.map(project);

      // рисуем грани back→front
      bctx.clearRect(0, 0, S, S);
      const order = FACES.map((face, i) => {
        const z = face.idx.reduce((a, k) => a + rv[k][2], 0) / 4;
        return { i, z };
      }).sort((a, b) => a.z - b.z);

      for (const { i } of order) {
        const face = FACES[i];
        const rn = rotate(face.n, ax, ay);
        const lam = Math.max(0, rn[0] * light[0] + rn[1] * light[1] + rn[2] * light[2]);
        const shade = 0.22 + 0.78 * lam; // ambient + diffuse
        const facing = rn[2]; // >0 — к зрителю

        const p = face.idx.map((k) => pv[k]);
        bctx.beginPath();
        bctx.moveTo(p[0][0], p[0][1]);
        for (let k = 1; k < 4; k++) bctx.lineTo(p[k][0], p[k][1]);
        bctx.closePath();
        bctx.fillStyle = `rgb(${Math.round(br * shade)},${Math.round(bg * shade)},${Math.round(bb * shade)})`;
        bctx.fill();

        // лого на передней грани, пока она к зрителю
        if (face.front && logoText && facing > 0.05) {
          bctx.save();
          bctx.clip();
          // аффинная карта лого по трём углам грани: 7=верх-лево,6=верх-право,4=низ-лево
          const tl = pv[7], tr = pv[6], bl = pv[4];
          const m11 = (tr[0] - tl[0]) / LS, m12 = (tr[1] - tl[1]) / LS;
          const m21 = (bl[0] - tl[0]) / LS, m22 = (bl[1] - tl[1]) / LS;
          bctx.globalAlpha = Math.min(1, facing * 1.6);
          bctx.setTransform(m11, m12, m21, m22, tl[0], tl[1]);
          bctx.drawImage(logo, 0, 0);
          bctx.setTransform(1, 0, 0, 1, 0, 0);
          bctx.globalAlpha = 1;
          bctx.restore();
        }
      }

      const img = bctx.getImageData(0, 0, S, S).data;

      // вывод: дот-сетка
      ctx.clearRect(0, 0, outPx, outPx);
      const cell = outPx / grid;
      const rDim = cell * 0.15;
      for (let gy = 0; gy < grid; gy++) {
        for (let gx = 0; gx < grid; gx++) {
          const sx = Math.floor(((gx + 0.5) / grid) * S);
          const sy = Math.floor(((gy + 0.5) / grid) * S);
          const o = (sy * S + sx) * 4;
          const rr = img[o], gg = img[o + 1], bbb = img[o + 2], aa = img[o + 3];
          const cx = (gx + 0.5) * cell;
          const cy = (gy + 0.5) * cell;
          // тусклый «погашенный» диод фоном
          ctx.beginPath();
          ctx.arc(cx, cy, rDim, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${br},${bg},${bb},0.05)`;
          ctx.fill();
          if (aa < 24) continue;
          const lum = (0.299 * rr + 0.587 * gg + 0.114 * bbb) / 255; // 0..1
          const bright = 0.35 + 0.65 * lit; // покой тусклее
          const r = cell * (0.2 + 0.32 * lum) * (0.7 + 0.3 * lit);
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rr},${gg},${bbb},${(0.25 + 0.75 * lum) * bright})`;
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
  }, [color, logoText, grid]);

  return (
    <div ref={wrapRef} className={`relative ${className}`} style={{ aspectRatio: "1 / 1" }}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

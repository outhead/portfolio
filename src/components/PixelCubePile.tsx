"use client";

/* ─────────────────────────────────────────────────────────────────
 * PixelCubePile — физика засыпания большими кубами со знаком.
 * Кубы НЕ вращаются сами: фиксированная изо-ориентация, угол спина в
 * плоскости заблокирован (inertia=∞), так что они падают и аккуратно
 * стекаются. Появляются только на ховере, на уходе курсора — утекают.
 *
 * Рендер по правилам пиксельных кубов: вся сцена (кубы, грани с flat-
 * shading, знак на гранях) рисуется в offscreen-буфер, затем буфер
 * сэмплится по фиксированной дот-сетке — зажигаем диоды по яркости,
 * фон — притушенные «погашенные» диоды. Все точки одного размера.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import type Matter from "matter-js";

type V3 = [number, number, number];

const VERTS: V3[] = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
];
const FACES: { idx: [number, number, number, number]; n: V3 }[] = [
  { idx: [4, 5, 6, 7], n: [0, 0, 1] },
  { idx: [1, 0, 3, 2], n: [0, 0, -1] },
  { idx: [5, 1, 2, 6], n: [1, 0, 0] },
  { idx: [0, 4, 7, 3], n: [-1, 0, 0] },
  { idx: [7, 6, 2, 3], n: [0, 1, 0] },
  { idx: [0, 1, 5, 4], n: [0, -1, 0] },
];

// Фиксированная изо-ориентация (видны front/top/right со знаком)
const AX0 = -0.5, AY0 = 0.72;

function rot([x, y, z]: V3, ax: number, ay: number): V3 {
  let c = Math.cos(ay), s = Math.sin(ay);
  const x1 = x * c + z * s, z1 = -x * s + z * c;
  c = Math.cos(ax); s = Math.sin(ax);
  return [x1, y * c - z1 * s, y * s + z1 * c];
}
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

interface Cube { body: Matter.Body; }

export default function PixelCubePile({
  color = "#FF2436",
  logoSrc,
  grid = 64,
}: {
  color?: string;
  logoSrc?: string;
  /** Точек по ширине дот-сетки. */
  grid?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const [br, bg, bb] = hexToRgb(color);
    const light: V3 = (() => {
      const v: V3 = [-0.35, -0.55, 0.9];
      const m = Math.hypot(v[0], v[1], v[2]);
      return [v[0] / m, v[1] / m, v[2] / m];
    })();

    // белый знак
    const LS = 128;
    const logoTex = document.createElement("canvas");
    logoTex.width = LS; logoTex.height = LS;
    let logoReady = false;
    if (logoSrc) {
      const img = new Image();
      img.onload = () => {
        const lc = logoTex.getContext("2d")!;
        const pad = LS * 0.05, box = LS - pad * 2;
        const k = Math.min(box / img.width, box / img.height);
        const w = img.width * k, h = img.height * k;
        lc.drawImage(img, (LS - w) / 2, (LS - h) / 2, w, h);
        lc.globalCompositeOperation = "source-in";
        lc.fillStyle = "#fff";
        lc.fillRect(0, 0, LS, LS);
        lc.globalCompositeOperation = "source-over";
        logoReady = true;
      };
      img.src = logoSrc;
    }

    // offscreen-буфер сцены (хайрес) + лоурес для бокс-фильтр-сэмплинга в точки
    const buf = document.createElement("canvas");
    const bctx = buf.getContext("2d", { willReadFrequently: true })!;
    const lo = document.createElement("canvas");
    const loctx = lo.getContext("2d", { willReadFrequently: true })!;

    let W = 0, H = 0, outW = 0, outH = 0, dpr = 1;
    let Sx = 0, Sy = 0, bs = 1; // буфер и масштаб панель→буфер
    let gridY = 0;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const maxN = mobile ? 9 : 13;
    let L = 70;

    const measure = () => {
      const r = wrap.getBoundingClientRect();
      W = Math.max(40, r.width); H = Math.max(40, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      outW = Math.round(W * dpr); outH = Math.round(H * dpr);
      canvas.width = outW; canvas.height = outH;
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      Sx = Math.min(460, Math.max(280, Math.round(W * 0.7)));
      Sy = Math.round(Sx * H / W);
      buf.width = Sx; buf.height = Sy;
      bs = Sx / W;
      gridY = Math.max(8, Math.round(grid * H / W));
      lo.width = grid; lo.height = gridY;
      L = Math.min(86, Math.max(40, Math.round(W * 0.17)));
    };

    const project = (v: V3, sc: number): [number, number] => {
      const d = 3.9, f = d / (d - v[2]);
      return [v[0] * sc * f, -v[1] * sc * f];
    };

    const texTri = (s0: number[], s1: number[], s2: number[], t0: number[], t1: number[], t2: number[]) => {
      const e1x = t1[0] - t0[0], e1y = t1[1] - t0[1];
      const e2x = t2[0] - t0[0], e2y = t2[1] - t0[1];
      const det = e1x * e2y - e2x * e1y;
      if (Math.abs(det) < 1e-6) return;
      const f1x = s1[0] - s0[0], f1y = s1[1] - s0[1];
      const f2x = s2[0] - s0[0], f2y = s2[1] - s0[1];
      const a = (f1x * e2y - f2x * e1y) / det, c = (-f1x * e2x + f2x * e1x) / det;
      const b = (f1y * e2y - f2y * e1y) / det, d2 = (-f1y * e2x + f2y * e1x) / det;
      bctx.save();
      bctx.beginPath();
      bctx.moveTo(s0[0], s0[1]); bctx.lineTo(s1[0], s1[1]); bctx.lineTo(s2[0], s2[1]); bctx.closePath();
      bctx.clip();
      bctx.setTransform(a, b, c, d2, s0[0] - (a * t0[0] + c * t0[1]), s0[1] - (b * t0[0] + d2 * t0[1]));
      bctx.drawImage(logoTex, 0, 0);
      bctx.setTransform(1, 0, 0, 1, 0, 0);
      bctx.restore();
    };

    const drawCube = (cu: Cube) => {
      const px = cu.body.position.x * bs;
      const py = cu.body.position.y * bs;
      const sc = (L * bs) * 0.34;
      bctx.save();
      bctx.translate(px, py);
      bctx.rotate(cu.body.angle); // обычно ~0 (спин заблокирован)
      const rv = VERTS.map((v) => rot(v, AX0, AY0));
      const pv = rv.map((v) => project(v, sc));
      const order = FACES.map((_, i) => ({ i, z: FACES[i].idx.reduce((a, k) => a + rv[k][2], 0) / 4 })).sort((a, b) => a.z - b.z);
      for (const { i } of order) {
        const face = FACES[i];
        const rn = rot(face.n, AX0, AY0);
        const lam = Math.max(0, rn[0] * light[0] + rn[1] * light[1] + rn[2] * light[2]);
        const shade = 0.22 + 0.78 * lam;
        const p = face.idx.map((k) => pv[k]);
        bctx.beginPath();
        bctx.moveTo(p[0][0], p[0][1]);
        for (let k = 1; k < 4; k++) bctx.lineTo(p[k][0], p[k][1]);
        bctx.closePath();
        bctx.fillStyle = `rgb(${Math.round(br * shade)},${Math.round(bg * shade)},${Math.round(bb * shade)})`;
        bctx.fill();
        if (logoReady && rn[2] > 0.04) {
          const p0 = p[0], p1 = p[1], p2 = p[2], p3 = p[3];
          bctx.globalAlpha = Math.min(1, rn[2] * 1.5);
          texTri(p0, p1, p2, [0, LS], [LS, LS], [LS, 0]);
          texTri(p0, p2, p3, [0, LS], [LS, 0], [0, 0]);
          bctx.globalAlpha = 1;
        }
      }
      bctx.restore();
    };

    let engine: Matter.Engine, runner: Matter.Runner, M: typeof import("matter-js");
    const cubes: Cube[] = [];
    let ground: Matter.Body | null = null;
    let leftWall: Matter.Body, rightWall: Matter.Body;
    let raf = 0, last = performance.now();

    import("matter-js").then((mod) => {
      M = (mod.default ?? mod) as typeof import("matter-js");
      const { Engine, Runner, Bodies, Composite } = M;
      measure();
      engine = Engine.create();
      engine.gravity.y = 1.6;
      runner = Runner.create();
      Runner.run(runner, engine);

      const wallOpts = { isStatic: true, render: { visible: false } };
      leftWall = Bodies.rectangle(-20, H / 2, 40, H * 3, wallOpts);
      rightWall = Bodies.rectangle(W + 20, H / 2, 40, H * 3, wallOpts);
      Composite.add(engine.world, [leftWall, rightWall]);

      const addGround = () => {
        if (ground) return;
        // верх пола чуть выше нижней кромки — пила собирается внутри кадра
        ground = Bodies.rectangle(W / 2, H + 8, W + 60, 32, wallOpts);
        Composite.add(engine.world, ground);
      };
      const removeGround = () => {
        if (!ground) return;
        Composite.remove(engine.world, ground);
        ground = null;
      };

      const spawn = () => {
        if (cubes.length >= maxN) return;
        const x = L / 2 + Math.random() * (W - L);
        const body = Bodies.rectangle(x, -L * 0.5, L, L, {
          inertia: Infinity, // спин заблокирован — не вращаются
          density: 0.004, restitution: 0.06, friction: 0.85, frictionAir: 0.012,
        });
        cubes.push({ body });
        Composite.add(engine.world, body);
      };

      let spawnId: number | null = null;
      const onEnter = () => {
        hoverRef.current = true;
        addGround();
        if (spawnId != null) return;
        const burst = mobile ? 6 : 9;
        for (let i = 0; i < burst; i++) window.setTimeout(spawn, i * 90);
        spawnId = window.setInterval(spawn, 120);
      };
      const onLeave = () => {
        hoverRef.current = false;
        if (spawnId != null) { window.clearInterval(spawnId); spawnId = null; }
        window.setTimeout(removeGround, 80); // пол убран — кубы утекают вниз
      };
      wrap.addEventListener("mouseenter", onEnter);
      wrap.addEventListener("mouseleave", onLeave);

      const isTouch = window.matchMedia("(hover: none)").matches;
      let io: IntersectionObserver | null = null;
      if (isTouch && typeof IntersectionObserver !== "undefined") {
        io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? onEnter() : onLeave())), { rootMargin: "-50% 0px -35% 0px", threshold: 0 });
        io.observe(wrap);
      }

      const sweepId = window.setInterval(() => {
        for (let i = cubes.length - 1; i >= 0; i--) {
          if (cubes[i].body.position.y > H + 300) {
            Composite.remove(engine.world, cubes[i].body);
            cubes.splice(i, 1);
          }
        }
      }, 350);

      const frame = (now: number) => {
        last = now;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, outW, outH);
        bctx.clearRect(0, 0, Sx, Sy);
        const sorted = [...cubes].sort((a, b) => a.body.position.y - b.body.position.y);
        for (const cu of sorted) drawCube(cu);

        // даунскейл хайрес-буфера в сетку (бокс-фильтр) — тонкий знак не теряется
        loctx.clearRect(0, 0, grid, gridY);
        loctx.imageSmoothingEnabled = true;
        loctx.drawImage(buf, 0, 0, Sx, Sy, 0, 0, grid, gridY);
        const data = loctx.getImageData(0, 0, grid, gridY).data;
        const cell = outW / grid;
        const rDot = cell * 0.34;
        for (let gyi = 0; gyi < gridY; gyi++) {
          for (let gx = 0; gx < grid; gx++) {
            const cx = (gx + 0.5) * cell;
            const cy = (gyi + 0.5) * cell;
            const o = (gyi * grid + gx) * 4;
            const rr = data[o], gg = data[o + 1], bbb = data[o + 2], aa = data[o + 3];
            ctx.beginPath();
            ctx.arc(cx, cy, rDot, 0, Math.PI * 2);
            if (aa < 20) {
              ctx.fillStyle = `rgba(${br},${bg},${bb},0.06)`;
            } else {
              const a = aa / 255;
              const lum = (0.299 * rr + 0.587 * gg + 0.114 * bbb) / 255;
              ctx.fillStyle = `rgba(${rr},${gg},${bbb},${(0.3 + 0.7 * lum) * (0.55 + 0.45 * a)})`;
            }
            ctx.fill();
          }
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);

      const onResize = () => {
        const pw = W, ph = H;
        measure();
        if (W === pw && H === ph) return;
        M.Body.setPosition(rightWall, { x: W + 20, y: H / 2 });
        if (ground) M.Body.setPosition(ground, { x: W / 2, y: H + 18 });
      };
      window.addEventListener("resize", onResize);

      (canvas as HTMLCanvasElement & { _cleanup?: () => void })._cleanup = () => {
        if (spawnId != null) window.clearInterval(spawnId);
        window.clearInterval(sweepId);
        wrap.removeEventListener("mouseenter", onEnter);
        wrap.removeEventListener("mouseleave", onLeave);
        io?.disconnect();
        window.removeEventListener("resize", onResize);
        Runner.stop(runner);
        Engine.clear(engine);
      };
    });

    return () => {
      cancelAnimationFrame(raf);
      (canvas as HTMLCanvasElement & { _cleanup?: () => void })._cleanup?.();
    };
  }, [color, logoSrc, grid]);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

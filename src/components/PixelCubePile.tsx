"use client";

/* ─────────────────────────────────────────────────────────────────
 * PixelCubePile — физика засыпания БОЛЬШИМИ 3D-кубами.
 * Matter.js двигает квадратные тела (позиция + крен в плоскости), а
 * каждый куб дополнительно вращается в 3D (tumble) и рисуется сплошными
 * затенёнными гранями со знаком на каждой грани. После отрисовки всей
 * сцены поверх «пробивается» единая LED-маска из точек — вся картинка
 * становится дот-матрицей, как остальной сайт.
 *
 * Покой — пара кубов лежит на дне и тихо кувыркается. Ховер — сверху
 * досыпаются ещё, копятся; уход курсора — лишние убираются.
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

interface Cube { body: Matter.Body; ax: number; ay: number; sx: number; sy: number; }

export default function PixelCubePile({
  color = "#FF2436",
  logoSrc,
}: {
  color?: string;
  logoSrc?: string;
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
      const m = Math.hypot(...v) as number;
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
        const pad = LS * 0.12, box = LS - pad * 2;
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

    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 0, H = 0, outW = 0, outH = 0;
    let dotPattern: CanvasPattern | null = null;
    const buildPattern = () => {
      const pitch = Math.max(6, Math.round((outW / 46)));
      const tile = document.createElement("canvas");
      tile.width = pitch; tile.height = pitch;
      const tc = tile.getContext("2d")!;
      tc.fillStyle = "#fff";
      tc.beginPath();
      tc.arc(pitch / 2, pitch / 2, pitch * 0.34, 0, Math.PI * 2);
      tc.fill();
      dotPattern = ctx.createPattern(tile, "repeat");
    };

    let engine: Matter.Engine;
    let runner: Matter.Runner;
    let M: typeof import("matter-js");
    const cubes: Cube[] = [];
    let ground: Matter.Body | null = null;
    let leftWall: Matter.Body, rightWall: Matter.Body;
    let L = 60; // сторона куба
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const base = mobile ? 2 : 2;
    const maxN = mobile ? 4 : 6;

    const measure = () => {
      const r = wrap.getBoundingClientRect();
      W = Math.max(40, r.width); H = Math.max(40, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      outW = Math.round(W * dpr); outH = Math.round(H * dpr);
      canvas.width = outW; canvas.height = outH;
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      buildPattern();
      L = Math.min(110, Math.max(54, Math.round(W * 0.26)));
    };

    let lit = 0, raf = 0, last = performance.now();

    const project = (v: V3, sc: number): [number, number] => {
      const d = 4.6, f = d / (d - v[2]);
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
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.lineTo(s2[0], s2[1]); ctx.closePath();
      ctx.clip();
      ctx.setTransform(a, b, c, d2, s0[0] - (a * t0[0] + c * t0[1]), s0[1] - (b * t0[0] + d2 * t0[1]));
      ctx.drawImage(logoTex, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.restore();
    };

    const drawCube = (cu: Cube) => {
      const px = cu.body.position.x * dpr;
      const py = cu.body.position.y * dpr;
      const sc = (L * dpr) * 0.34;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(cu.body.angle); // крен в плоскости от физики
      const rv = VERTS.map((v) => rot(v, cu.ax, cu.ay));
      const pv = rv.map((v) => project(v, sc));
      const order = FACES.map((_, i) => ({ i, z: FACES[i].idx.reduce((a, k) => a + rv[k][2], 0) / 4 })).sort((a, b) => a.z - b.z);
      for (const { i } of order) {
        const face = FACES[i];
        const rn = rot(face.n, cu.ax, cu.ay);
        const lam = Math.max(0, rn[0] * light[0] + rn[1] * light[1] + rn[2] * light[2]);
        const shade = 0.22 + 0.78 * lam;
        const p = face.idx.map((k) => pv[k]);
        ctx.beginPath();
        ctx.moveTo(p[0][0], p[0][1]);
        for (let k = 1; k < 4; k++) ctx.lineTo(p[k][0], p[k][1]);
        ctx.closePath();
        ctx.fillStyle = `rgb(${Math.round(br * shade)},${Math.round(bg * shade)},${Math.round(bb * shade)})`;
        ctx.fill();
        if (logoReady && rn[2] > 0.04) {
          const s0 = p[0], s1 = p[1], s2 = p[2], s3 = p[3];
          ctx.globalAlpha = Math.min(1, rn[2] * 1.5);
          texTri(s0, s1, s2, [0, LS], [LS, LS], [LS, 0]);
          texTri(s0, s2, s3, [0, LS], [LS, 0], [0, 0]);
          ctx.globalAlpha = 1;
        }
      }
      ctx.restore();
    };

    import("matter-js").then((mod) => {
      M = (mod.default ?? mod) as typeof import("matter-js");
      const { Engine, Runner, Bodies, Composite } = M;
      measure();
      engine = Engine.create();
      engine.gravity.y = 1.5;
      runner = Runner.create();
      Runner.run(runner, engine);

      const wallOpts = { isStatic: true, render: { visible: false } };
      leftWall = Bodies.rectangle(-20, H / 2, 40, H * 3, wallOpts);
      rightWall = Bodies.rectangle(W + 20, H / 2, 40, H * 3, wallOpts);
      ground = Bodies.rectangle(W / 2, H + 18, W + 60, 36, wallOpts); // пол всегда есть
      Composite.add(engine.world, [leftWall, rightWall, ground]);

      const spawn = () => {
        if (cubes.length >= maxN) return;
        const x = L / 2 + Math.random() * (W - L);
        const body = Bodies.rectangle(x, -L, L, L, {
          chamfer: { radius: 3 },
          density: 0.004, restitution: 0.12, friction: 0.6, frictionAir: 0.008,
          angle: (Math.random() - 0.5) * 0.4,
        });
        cubes.push({ body, ax: Math.random() * 6, ay: Math.random() * 6, sx: (Math.random() - 0.5) * 0.7, sy: 0.4 + Math.random() * 0.6 });
        Composite.add(engine.world, body);
      };
      const despawn = () => {
        if (cubes.length <= base) return;
        // убираем самый верхний (наименьший y)
        let topIdx = 0;
        for (let i = 1; i < cubes.length; i++) if (cubes[i].body.position.y < cubes[topIdx].body.position.y) topIdx = i;
        Composite.remove(engine.world, cubes[topIdx].body);
        cubes.splice(topIdx, 1);
      };
      for (let i = 0; i < base; i++) window.setTimeout(spawn, i * 120);

      // регулятор количества к целевому
      const tick = window.setInterval(() => {
        const target = hoverRef.current ? maxN : base;
        if (cubes.length < target) spawn();
        else if (cubes.length > target) despawn();
        // подмести улетевшие
        for (let i = cubes.length - 1; i >= 0; i--) {
          if (cubes[i].body.position.y > H + 300) {
            Composite.remove(engine.world, cubes[i].body);
            cubes.splice(i, 1);
          }
        }
      }, 260);

      const frame = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        lit += ((hoverRef.current ? 1 : 0) - lit) * Math.min(1, dt * 5);
        const spin = 0.25 + lit * 0.7;
        for (const cu of cubes) { cu.ax += dt * cu.sx * spin; cu.ay += dt * cu.sy * spin; }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, outW, outH);
        // рисуем кубы сплошняком, нижние — поверх
        const sorted = [...cubes].sort((a, b) => a.body.position.y - b.body.position.y);
        for (const cu of sorted) drawCube(cu);
        // пробиваем LED-маску по всей сцене
        if (dotPattern) {
          ctx.globalCompositeOperation = "destination-in";
          ctx.fillStyle = dotPattern;
          ctx.fillRect(0, 0, outW, outH);
          ctx.globalCompositeOperation = "source-over";
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
        window.clearInterval(tick);
        window.removeEventListener("resize", onResize);
        Runner.stop(runner);
        Engine.clear(engine);
      };
    });

    const onEnter = () => (hoverRef.current = true);
    const onLeave = () => (hoverRef.current = false);
    wrap.addEventListener("mouseenter", onEnter);
    wrap.addEventListener("mouseleave", onLeave);
    const isTouch = window.matchMedia("(hover: none)").matches;
    let io: IntersectionObserver | null = null;
    if (isTouch && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((es) => es.forEach((e) => (hoverRef.current = e.isIntersecting)), { rootMargin: "-50% 0px -35% 0px", threshold: 0 });
      io.observe(wrap);
    }

    return () => {
      cancelAnimationFrame(raf);
      wrap.removeEventListener("mouseenter", onEnter);
      wrap.removeEventListener("mouseleave", onLeave);
      io?.disconnect();
      (canvas as HTMLCanvasElement & { _cleanup?: () => void })._cleanup?.();
    };
  }, [color, logoSrc]);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

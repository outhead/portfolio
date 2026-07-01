"use client";

/* ─────────────────────────────────────────────────────────────────
 * PixelCubeSandbox — реалистичная физика кубиков, насыпанных в ёмкость.
 * Физика: cannon-es (настоящие box-контакты, трение, стекинг, сон).
 * Рендер: тот же дот-матричный проектор, что у PixelCubePile —
 * 8 вершин куба проецируются камерой, грани с flat-shading,
 * сцена сэмплится в сетку диодов.
 *
 * Курсор — реальная сила (applyForce) в трёх режимах: push / stir /
 * vortex. Вся угловая динамика (перевороты, качение) рождается из
 * контактов и трения движка, а не из фейкового спина.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import type { World, Body } from "cannon-es";

type V3 = [number, number, number];
type Q = [number, number, number, number];

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => { const m = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / m, a[1] / m, a[2] / m]; };
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];

function qRotArr(q: Q, v: V3): V3 {
  const u: V3 = [q[0], q[1], q[2]];
  const t = cross(u, v).map((x) => x * 2) as V3;
  return add(add(v, t.map((x) => x * q[3]) as V3), cross(u, t));
}
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// геометрия единичного куба (полусторона 1) — масштабируется под каждый куб
const CV: V3[] = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
];
const CF: { idx: [number, number, number, number]; n: V3 }[] = [
  { idx: [4, 5, 6, 7], n: [0, 0, 1] },
  { idx: [1, 0, 3, 2], n: [0, 0, -1] },
  { idx: [5, 1, 2, 6], n: [1, 0, 0] },
  { idx: [0, 4, 7, 3], n: [-1, 0, 0] },
  { idx: [7, 6, 2, 3], n: [0, 1, 0] },
  { idx: [0, 1, 5, 4], n: [0, -1, 0] },
];

export type CursorMode = "push" | "stir" | "vortex" | "off";

export interface CubeSandboxParams {
  gravity: number;      // сила тяжести
  restitution: number;  // упругость удара (0 — не прыгают)
  friction: number;     // трение (выше — быстрее укладываются)
  cubeScale: number;    // размер кубика (доля базового)
  cursorMode: CursorMode;
  cursorRadius: number; // радиус влияния курсора (мировые ед.)
  cursorPush: number;   // сила курсора
  spawnRate: number;    // кубов/сек на ховере
  maxCubes: number;
  autoRain: boolean;    // сыпать без курсора (ёмкость всегда с дном)
}

export const DEFAULT_PARAMS: CubeSandboxParams = {
  gravity: 22,
  restitution: 0.05,
  friction: 0.45,
  cubeScale: 0.62,
  cursorMode: "stir",
  cursorRadius: 1.0,
  cursorPush: 40,
  spawnRate: 26,
  maxCubes: 60,
  autoRain: false,
};

interface Cube { body: Body; col: [number, number, number]; half: number; }

export default function PixelCubeSandbox({
  color = "#FF2436",
  colors,
  logoSrc,
  pitch = 5.2,
  paramsRef,
  onCount,
}: {
  color?: string;
  colors?: string[];
  logoSrc?: string;
  pitch?: number;
  paramsRef: React.RefObject<CubeSandboxParams>;
  onCount?: (n: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef(false);
  const ptrRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const P = () => paramsRef.current;

    const palette = (colors && colors.length ? colors : [color]).map(hexToRgb);
    const [br, bg, bb] = palette[0];
    const lightW = norm([-0.4, 0.78, 0.5]);

    // ── лого-текстура (белый знак на грани) ──
    const LS = 128;
    const logoTex = document.createElement("canvas");
    logoTex.width = LS; logoTex.height = LS;
    let logoReady = false;
    if (logoSrc) {
      const img = new Image();
      img.onload = () => {
        const lc = logoTex.getContext("2d")!;
        const pad = LS * 0.06, box = LS - pad * 2;
        const k = Math.min(box / img.width, box / img.height);
        const w = img.width * k, h = img.height * k;
        lc.drawImage(img, (LS - w) / 2, (LS - h) / 2, w, h);
        lc.globalCompositeOperation = "source-in";
        lc.fillStyle = "#fff"; lc.fillRect(0, 0, LS, LS);
        lc.globalCompositeOperation = "source-over";
        logoReady = true;
      };
      img.src = logoSrc;
    }

    const buf = document.createElement("canvas");
    const bctx = buf.getContext("2d", { willReadFrequently: true })!;
    const lo = document.createElement("canvas");
    const loctx = lo.getContext("2d", { willReadFrequently: true })!;

    // ── ёмкость (мир) ──
    let HX = 2.3;
    const HZ = 1.25;
    const FLOOR = -0.9;    // дно ниже — насыпь копится в кадре
    const SBASE = 0.42;    // базовая полусторона куба

    // ── камера ──
    const lookAt: V3 = [0, 0.4, 0];
    const camC: V3 = [0, 2.3, 5.2];
    const camZ = norm(sub(camC, lookAt));
    const camR = norm(cross([0, 1, 0], camZ));
    const camU = cross(camZ, camR);

    let W = 0, H = 0, outW = 0, outH = 0, dpr = 1;
    let GX = 124;
    let Sx = 0, Sy = 0, focal = 0, cxp = 0, cyp = 0, gridY = 0;
    let cellSize = 0, rDot = 0;
    const bgDots = document.createElement("canvas");

    const measure = () => {
      const r = wrap.getBoundingClientRect();
      W = Math.max(40, r.width); H = Math.max(40, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      outW = Math.round(W * dpr); outH = Math.round(H * dpr);
      canvas.width = outW; canvas.height = outH;
      Sx = Math.min(660, Math.max(380, Math.round(W * 0.9)));
      Sy = Math.round(Sx * H / W);
      buf.width = Sx; buf.height = Sy;
      GX = Math.max(40, Math.round(W / pitch));
      gridY = Math.max(8, Math.round(GX * H / W));
      lo.width = GX; lo.height = gridY;
      focal = Math.min(Sx * 0.92, Sy * 1.64);
      cxp = Sx / 2; cyp = Sy * 0.42;
      HX = Math.max(1.6, (Sx * 0.5) * 5.45 / focal * 0.78);
      cellSize = outW / GX;
      rDot = cellSize * 0.28;
      bgDots.width = outW; bgDots.height = outH;
      const bg2 = bgDots.getContext("2d")!;
      bg2.clearRect(0, 0, outW, outH);
      bg2.fillStyle = `rgba(${br},${bg},${bb},0.06)`;
      for (let gy = 0; gy < gridY; gy++) {
        for (let gx = 0; gx < GX; gx++) {
          bg2.beginPath();
          bg2.arc((gx + 0.5) * cellSize, (gy + 0.5) * cellSize, rDot, 0, Math.PI * 2);
          bg2.fill();
        }
      }
    };
    measure();

    const project = (Pt: V3): [number, number, number] => {
      const d = sub(Pt, camC);
      const vx = dot(d, camR), vy = dot(d, camU), vz = dot(d, camZ);
      const front = -vz;
      const inv = focal / Math.max(0.05, front);
      return [cxp + vx * inv, cyp - vy * inv, front];
    };

    const screenToWorld = (px: number, py: number): V3 => {
      const sx = (px / W) * Sx;
      const sy = (py / H) * Sy;
      const dir: V3 = add(add(
        scale(camR, (sx - cxp) / focal),
        scale(camU, -(sy - cyp) / focal)),
        scale(camZ, -1));
      const denom = Math.abs(dir[2]) < 1e-4 ? 1e-4 : dir[2];
      const t = -camC[2] / denom;
      return add(camC, scale(dir, t));
    };

    const texTri = (s0: number[], s1: number[], s2: number[], t0: number[], t1: number[], t2: number[]) => {
      const e1x = t1[0] - t0[0], e1y = t1[1] - t0[1], e2x = t2[0] - t0[0], e2y = t2[1] - t0[1];
      const det = e1x * e2y - e2x * e1y; if (Math.abs(det) < 1e-6) return;
      const f1x = s1[0] - s0[0], f1y = s1[1] - s0[1], f2x = s2[0] - s0[0], f2y = s2[1] - s0[1];
      const a = (f1x * e2y - f2x * e1y) / det, c = (-f1x * e2x + f2x * e1x) / det;
      const b = (f1y * e2y - f2y * e1y) / det, d2 = (-f1y * e2x + f2y * e1x) / det;
      bctx.save();
      bctx.beginPath(); bctx.moveTo(s0[0], s0[1]); bctx.lineTo(s1[0], s1[1]); bctx.lineTo(s2[0], s2[1]); bctx.closePath(); bctx.clip();
      bctx.setTransform(a, b, c, d2, s0[0] - (a * t0[0] + c * t0[1]), s0[1] - (b * t0[0] + d2 * t0[1]));
      bctx.drawImage(logoTex, 0, 0);
      bctx.setTransform(1, 0, 0, 1, 0, 0);
      bctx.restore();
    };

    // рисуем куб: центр p, ориентация q, полусторона half
    const drawCube = (p: V3, q: Q, half: number, col: [number, number, number]) => {
      const worldV = CV.map((lv) => add(p, qRotArr(q, scale(lv, half))));
      const pv = worldV.map(project);
      const amb = 0.32, dif = 0.95;
      const faces = CF.map((f, i) => {
        const wn = qRotArr(q, f.n);
        const facing = dot(wn, camZ);
        const cen = f.idx.reduce((a, k) => add(a, worldV[k]), [0, 0, 0] as V3).map((x) => x / 4) as V3;
        const depth = project(cen)[2];
        const lam = Math.max(0, dot(wn, lightW));
        return { i, facing, depth, shade: Math.min(1, amb + dif * lam) };
      }).filter((f) => f.facing > 0).sort((a, b2) => b2.depth - a.depth);

      for (const f of faces) {
        const face = CF[f.i];
        const pp = face.idx.map((k) => pv[k]);
        bctx.beginPath();
        bctx.moveTo(pp[0][0], pp[0][1]);
        for (let k = 1; k < 4; k++) bctx.lineTo(pp[k][0], pp[k][1]);
        bctx.closePath();
        bctx.fillStyle = `rgb(${Math.round(col[0] * f.shade)},${Math.round(col[1] * f.shade)},${Math.round(col[2] * f.shade)})`;
        bctx.fill();
        if (logoReady && f.facing > 0.12) {
          bctx.globalAlpha = Math.min(1, f.facing * 1.4);
          texTri(pp[0], pp[1], pp[2], [0, LS], [LS, LS], [LS, 0]);
          texTri(pp[0], pp[2], pp[3], [0, LS], [LS, 0], [0, 0]);
          bctx.globalAlpha = 1;
        }
      }
    };

    // ── физика ──
    let world: World | null = null;
    const cubes: Cube[] = [];
    let cancelled = false;
    let CANNONref: typeof import("cannon-es") | null = null;
    let floorBody: Body | null = null;
    let cubeCMat: import("cannon-es").ContactMaterial | null = null;
    let cubeMaterial: import("cannon-es").Material | null = null;
    // невидимая сфера курсора — физически расталкивает кубы
    let cursorBody: Body | null = null;
    let cursorMaterial: import("cannon-es").Material | null = null;
    let curRadiusUsed = 0;

    let curWorld: V3 | null = null;
    let curPrev: V3 | null = null;
    let curVel: V3 = [0, 0, 0];
    let simT = 0;

    const spawn = () => {
      if (!world || !CANNONref || !cubeMaterial) return;
      if (cubes.length >= P().maxCubes) return;
      const C = CANNONref;
      const half = SBASE * P().cubeScale;
      const shape = new C.Box(new C.Vec3(half, half, half));
      const x = (Math.random() * 2 - 1) * (HX - half - 0.05);
      const z = (Math.random() * 2 - 1) * (HZ - half - 0.05);
      const body = new C.Body({
        mass: 1,
        shape,
        material: cubeMaterial,
        position: new C.Vec3(x, 2.1 + Math.random() * 0.5, z),
        linearDamping: 0.05,
        angularDamping: 0.35,
      });
      body.velocity.set((Math.random() - 0.5) * 0.5, -1.4 - Math.random() * 0.6, (Math.random() - 0.5) * 0.5);
      body.angularVelocity.set((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
      body.allowSleep = true;
      body.sleepSpeedLimit = 0.28;
      body.sleepTimeLimit = 0.5;
      world.addBody(body);
      cubes.push({ body, col: palette[(Math.random() * palette.length) | 0], half });
    };

    const setFloor = (on: boolean) => {
      if (!world || !CANNONref) return;
      if (on && !floorBody) {
        const C = CANNONref;
        floorBody = new C.Body({ mass: 0, material: cubeMaterial! });
        floorBody.addShape(new C.Plane());
        floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // нормаль вверх
        floorBody.position.set(0, FLOOR, 0);
        world.addBody(floorBody);
      } else if (!on && floorBody) {
        world.removeBody(floorBody);
        floorBody = null;
        // будим всех: иначе спящие кубы зависают в воздухе («прилипают»),
        // когда убрали опору под ними
        for (const cu of cubes) cu.body.wakeUp();
      }
    };

    // невидимая сфера курсора нужного радиуса (пересоздаём при смене радиуса)
    const ensureCursorBody = (r: number) => {
      if (!world || !CANNONref || !cursorMaterial) return;
      if (cursorBody && Math.abs(curRadiusUsed - r) < 0.02) return;
      const C = CANNONref;
      if (cursorBody) world.removeBody(cursorBody);
      cursorBody = new C.Body({ mass: 0, type: C.Body.KINEMATIC, material: cursorMaterial });
      cursorBody.addShape(new C.Sphere(r));
      cursorBody.position.set(0, -1000, 0);
      cursorBody.collisionResponse = true;
      world.addBody(cursorBody);
      curRadiusUsed = r;
    };

    import("cannon-es").then((C) => {
      if (cancelled) return;
      CANNONref = C;
      world = new C.World({ gravity: new C.Vec3(0, -P().gravity, 0) });
      world.broadphase = new C.SAPBroadphase(world);
      world.allowSleep = true;
      // @ts-expect-error solver.iterations есть у GSSolver (дефолтный)
      world.solver.iterations = 18;
      // @ts-expect-error solver.tolerance
      world.solver.tolerance = 0.001;

      cubeMaterial = new C.Material("cube");
      cubeCMat = new C.ContactMaterial(cubeMaterial, cubeMaterial, {
        friction: P().friction,
        restitution: P().restitution,
      });
      world.addContactMaterial(cubeCMat);
      world.defaultContactMaterial.friction = P().friction;
      world.defaultContactMaterial.restitution = P().restitution;

      // материал курсор↔куб: почти без трения, лёгкий отскок — сфера
      // толкает кубы упруго, не «прилипая» к ним
      cursorMaterial = new C.Material("cursor");
      world.addContactMaterial(new C.ContactMaterial(cubeMaterial, cursorMaterial, {
        friction: 0.05, restitution: 0.4,
      }));

      // стенки ёмкости (статичные плоскости), нормалями внутрь
      const wall = (pos: V3, euler: V3) => {
        const b = new C.Body({ mass: 0, material: cubeMaterial! });
        b.addShape(new C.Plane());
        b.quaternion.setFromEuler(euler[0], euler[1], euler[2]);
        b.position.set(pos[0], pos[1], pos[2]);
        world!.addBody(b);
      };
      wall([-HX, 0, 0], [0, Math.PI / 2, 0]);   // левая, нормаль +x
      wall([HX, 0, 0], [0, -Math.PI / 2, 0]);   // правая, нормаль -x
      wall([0, 0, -HZ], [0, 0, 0]);             // задняя, нормаль +z
      wall([0, 0, HZ], [0, Math.PI, 0]);        // передняя, нормаль -z

      ensureCursorBody(P().cursorRadius);

      // idle-куб по центру: пусть просто упадёт и ляжет (реалистично).
      // Дно ставим, чтобы одиночный куб не улетал вниз в покое.
      setFloor(true);
      spawn();
    });

    const applyCursor = () => {
      if (!world || !CANNONref) return;
      const pr = P();
      const C = CANNONref;
      ensureCursorBody(pr.cursorRadius);
      if (!cursorBody) return;

      // курсор вне зоны или выключен — паркуем сферу под миром
      if (!curWorld || pr.cursorMode === "off") {
        cursorBody.position.set(0, -1000, 0);
        cursorBody.velocity.set(0, 0, 0);
        return;
      }

      // невидимая сфера следует за курсором и физически расталкивает
      // все кубы, которых касается; её скорость = скорость руки, поэтому
      // взмахом кубы разлетаются
      cursorBody.position.set(curWorld[0], curWorld[1], curWorld[2]);
      cursorBody.velocity.set(curVel[0], curVel[1], curVel[2]);

      // доп. силовое поле поверх контакта (усиление + режимы) и пробуждение
      const R = pr.cursorRadius;
      for (const cu of cubes) {
        const b = cu.body;
        const dp: V3 = [b.position.x - curWorld[0], b.position.y - curWorld[1], b.position.z - curWorld[2]];
        const dist = Math.hypot(dp[0], dp[1], dp[2]);
        if (dist >= R) continue;
        b.wakeUp();
        const f = 1 - dist / R;
        const n = dist < 1e-3 ? ([0, 1, 0] as V3) : scale(dp, 1 / dist);
        let force: V3 = [0, 0, 0];
        if (pr.cursorMode === "push") {
          force = scale(n, pr.cursorPush * (0.4 + f * f));
        } else if (pr.cursorMode === "stir") {
          force = add(scale(curVel, f * 6), scale(n, pr.cursorPush * 0.2 * f));
        } else if (pr.cursorMode === "vortex") {
          const tang = cross([0, 1, 0], n);
          force = add(scale(tang, pr.cursorPush * 1.2 * f), scale(n, -pr.cursorPush * 0.2 * f));
        }
        b.applyForce(new C.Vec3(force[0], force[1], force[2]), b.position);
      }
    };

    let raf = 0, last = performance.now(), spawnAcc = 0, countAcc = 0;
    const frame = (now: number) => {
      let dt = (now - last) / 1000; last = now;
      dt = Math.min(0.033, dt);
      simT += dt;

      if (world && CANNONref) {
        const pr = P();
        world.gravity.set(0, -pr.gravity, 0);
        if (cubeCMat) { cubeCMat.friction = pr.friction; cubeCMat.restitution = pr.restitution; }
        world.defaultContactMaterial.friction = pr.friction;
        world.defaultContactMaterial.restitution = pr.restitution;

        // курсор → мир + скорость
        const ptr = ptrRef.current;
        if (ptr) {
          const wpos = screenToWorld(ptr.x, ptr.y);
          if (curPrev) curVel = scale(sub(wpos, curPrev), 1 / Math.max(dt, 1e-3));
          curPrev = wpos; curWorld = wpos;
        } else { curWorld = null; curPrev = null; curVel = [0, 0, 0]; }

        // спавн
        const wantSpawn = pr.autoRain || hoverRef.current;
        if (wantSpawn && cubes.length < pr.maxCubes) {
          spawnAcc += dt;
          const interval = 1 / Math.max(1, pr.spawnRate);
          while (spawnAcc > interval) { spawnAcc -= interval; spawn(); }
        }

        applyCursor();
        world.step(1 / 60, dt, 4);

        // убрать улетевшие вниз (дно убрано)
        for (let i = cubes.length - 1; i >= 0; i--) {
          if (cubes[i].body.position.y < FLOOR - 6) {
            world.removeBody(cubes[i].body);
            cubes.splice(i, 1);
          }
        }
      }

      // рендер
      bctx.clearRect(0, 0, Sx, Sy);
      const list = cubes.map((cu) => {
        const b = cu.body;
        const p: V3 = [b.position.x, b.position.y, b.position.z];
        const q: Q = [b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w];
        return { p, q, half: cu.half, col: cu.col, depth: project(p)[2] };
      }).sort((a, b) => b.depth - a.depth);
      for (const c of list) drawCube(c.p, c.q, c.half, c.col);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, outW, outH);
      ctx.drawImage(bgDots, 0, 0);
      loctx.clearRect(0, 0, GX, gridY);
      loctx.imageSmoothingEnabled = true;
      loctx.drawImage(buf, 0, 0, Sx, Sy, 0, 0, GX, gridY);
      const data = loctx.getImageData(0, 0, GX, gridY).data;
      for (let gy = 0; gy < gridY; gy++) {
        for (let gx = 0; gx < GX; gx++) {
          const o = (gy * GX + gx) * 4;
          const aa = data[o + 3];
          if (aa < 20) continue;
          const rr = data[o], gg = data[o + 1], bbb = data[o + 2];
          const a = aa / 255;
          const mx = Math.max(rr, gg, bbb) / 255;
          ctx.beginPath();
          ctx.arc((gx + 0.5) * cellSize, (gy + 0.5) * cellSize, rDot, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rr},${gg},${bbb},${(0.34 + 0.66 * mx) * (0.55 + 0.45 * a)})`;
          ctx.fill();
        }
      }

      countAcc += dt;
      if (onCount && countAcc > 0.2) { countAcc = 0; onCount(cubes.length); }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const activate = () => { hoverRef.current = true; setFloor(true); };
    const deactivate = () => {
      hoverRef.current = false;
      ptrRef.current = null;
      if (P().autoRain) { setFloor(true); return; }
      setFloor(false); // дно убрано — насыпь утекает вниз
    };
    const onEnter = () => activate();
    const onLeave = () => deactivate();
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      ptrRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    wrap.addEventListener("mouseenter", onEnter);
    wrap.addEventListener("mouseleave", onLeave);
    wrap.addEventListener("pointermove", onMove);
    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      wrap.removeEventListener("mouseenter", onEnter);
      wrap.removeEventListener("mouseleave", onLeave);
      wrap.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, colors, logoSrc, pitch]);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

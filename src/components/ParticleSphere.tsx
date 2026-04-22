"use client";

import { useEffect, useRef, type RefObject } from "react";

// ParticleSphere — облако частиц, которое стягивается из глубины кадра к
// поверхности целевой фигуры (shape), держится и затухает.
// Физика: инвертированная версия алгоритма rectangleworld.com.
//
// Интерактив:
//   • auto-rotate — фигура крутится по yaw со скоростью autoYawSpeed
//   • hover — при входе курсора фигура плавно «поворачивается в сторону
//             курсора» по кратчайшему пути (важно: без «раскрутки» через
//             накопленные в idle обороты)
// События курсора слушаются либо на самом canvas, либо на элементе
// `trackingRef`, чтобы курсор можно было отслеживать в более широкой
// области (например, на весь hero-bento, а не только в плитке).
// Drag и click-teleport сняты намеренно: плитка воспринималась как
// ловушка для случайных кликов по ссылкам, а дёргать шар вручную —
// лишняя функция, которая ничего не добавляла.

export type ParticleShape = "sphere" | "heart";

interface ParticleSphereProps {
  className?: string;
  r?: number;
  g?: number;
  b?: number;
  sphereRadFactor?: number;
  numPerFrame?: number;
  startMul?: number;
  flightFrames?: number;
  holdFrames?: number;
  decayFrames?: number;
  shape?: ParticleShape;
  interactive?: boolean;
  // Элемент, на который вешаем события курсора. Если не задан — сам canvas.
  trackingRef?: RefObject<HTMLElement | null>;
}

// ── Генераторы целевых точек для разных форм ─────────────────────
type TargetFn = () => { x: number; y: number; z: number };

function makeSphereTarget(rad: number): TargetFn {
  return () => {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(Math.random() * 2 - 1);
    const sPhi = Math.sin(phi);
    return {
      x: rad * sPhi * Math.cos(theta),
      y: rad * sPhi * Math.sin(theta),
      z: rad * Math.cos(phi),
    };
  };
}

function makeHeartTarget(rad: number): TargetFn {
  // Классическое 2D-сердце, инвертирую ось y (canvas +y = вниз) и центрирую;
  // в 3D заполняю ellipsoid-срезом, чтобы получилась объёмная фигура.
  const sc = rad / 15;
  const zThick = 4 * sc;
  return () => {
    const t = Math.random() * 2 * Math.PI;
    const u = Math.random() * 2 - 1;
    const prof = Math.sqrt(Math.max(0, 1 - u * u));
    const st = Math.sin(t);
    const ct = Math.cos(t);
    const x2d = 16 * st * st * st;
    const y2d =
      13 * ct - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return {
      x: sc * x2d * prof,
      y: (-y2d - 5) * sc * prof,
      z: zThick * u,
    };
  };
}

function getTargetFn(shape: ParticleShape, rad: number): TargetFn {
  switch (shape) {
    case "heart":
      return makeHeartTarget(rad);
    case "sphere":
    default:
      return makeSphereTarget(rad);
  }
}

export default function ParticleSphere({
  className = "",
  r = 166,
  g = 255,
  b = 0,
  sphereRadFactor = 0.36,
  numPerFrame = 10,
  startMul = 3.6,
  flightFrames = 70,
  holdFrames = 55,
  decayFrames = 70,
  shape = "sphere",
  interactive = true,
  trackingRef,
}: ParticleSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Константы проекции ─────────────────────────────────────────
    const fLen = 320;
    const zMax = fLen - 2;
    const particleRad = 2.2;
    const zeroAlphaDepth = -750;
    const randAccelInFlight = 0.18;
    const autoYawSpeed = (2 * Math.PI) / 24; // рад/сек
    const pitchLimit = 1.1;
    // Cursor-follow: насколько сильно фигура «смотрит» на курсор и как быстро.
    const cursorYawMax = 0.7;
    const cursorPitchMax = 0.55;
    const cursorLerpPerSec = 3.2; // быстрее → резче follow
    const centerLerpPerSec = 4.6; // скорость плавного центрирования при resize

    // ── Углы: утилита для «кратчайшего угла» ──────────────────────
    // В auto-rotate yaw растёт монотонно и может накопить несколько
    // оборотов. Когда курсор заходит, cursor-follow должен идти к
    // цели КРАТЧАЙШИМ путём (|dYaw| ≤ π), иначе шар «раскручивается»
    // через все накопленные обороты. Нормализацию по модулю 2π
    // применяем сразу к накопленному yaw в auto-rotate; а lerp в
    // cursor-follow считает дельту через ту же функцию.
    const TAU = Math.PI * 2;
    const normalizeAngle = (a: number) => {
      const x = a % TAU;
      if (x > Math.PI) return x - TAU;
      if (x < -Math.PI) return x + TAU;
      return x;
    };
    const rgbPrefix = `rgba(${r},${g},${b},`;

    type P = {
      x: number; y: number; z: number;
      tx: number; ty: number; tz: number;
      velX: number; velY: number; velZ: number;
      projX: number; projY: number;
      age: number;
      dead: boolean;
      alpha: number;
      flight: number;
      hold: number;
      decay: number;
      prev: P | null;
      next: P | null;
    };

    const particleList: { first: P | null } = { first: null };
    const recycleBin: { first: P | null } = { first: null };

    // ── Размер / DPR / форма ──────────────────────────────────────
    let DPR = 1;
    let cssW = 1;
    let cssH = 1;
    let sphereRad = 100;
    let sphereCenterZ = -3 - sphereRad;
    let targetFn: TargetFn = makeSphereTarget(sphereRad);

    // Центр фигуры в canvas-координатах (CSS px). Плавно лерпится к targetC*.
    let targetCX = 0;
    let targetCY = 0;
    let currentCX = 0;
    let currentCY = 0;
    let centerInitialized = false;

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      canvas.width = Math.round(cssW * DPR);
      canvas.height = Math.round(cssH * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      sphereRad = Math.min(cssW, cssH) * sphereRadFactor;
      sphereCenterZ = -3 - sphereRad;
      targetFn = getTargetFn(shape, sphereRad);
      if (!centerInitialized) {
        targetCX = currentCX = cssW / 2;
        targetCY = currentCY = cssH / 2;
        centerInitialized = true;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ── Пул частиц ────────────────────────────────────────────────
    const newEmpty = (): P => ({
      x: 0, y: 0, z: 0,
      tx: 0, ty: 0, tz: 0,
      velX: 0, velY: 0, velZ: 0,
      projX: 0, projY: 0,
      age: 0, dead: false, alpha: 0,
      flight: 0, hold: 0, decay: 0,
      prev: null, next: null,
    });

    const takeParticle = (): P => {
      let p: P;
      if (recycleBin.first) {
        p = recycleBin.first;
        if (p.next) { recycleBin.first = p.next; p.next.prev = null; }
        else recycleBin.first = null;
      } else {
        p = newEmpty();
      }
      if (particleList.first == null) {
        particleList.first = p; p.prev = null; p.next = null;
      } else {
        p.next = particleList.first;
        particleList.first.prev = p;
        particleList.first = p;
        p.prev = null;
      }
      return p;
    };

    const recycle = (p: P) => {
      if (particleList.first === p) {
        if (p.next) { p.next.prev = null; particleList.first = p.next; }
        else particleList.first = null;
      } else {
        if (p.next == null) { if (p.prev) p.prev.next = null; }
        else { if (p.prev) p.prev.next = p.next; p.next.prev = p.prev; }
      }
      if (recycleBin.first == null) {
        recycleBin.first = p; p.prev = null; p.next = null;
      } else {
        p.next = recycleBin.first;
        recycleBin.first.prev = p;
        recycleBin.first = p;
        p.prev = null;
      }
    };

    const spawn = () => {
      const tgt = targetFn();
      const sx = tgt.x * startMul;
      const sy = tgt.y * startMul;
      const sz = tgt.z * startMul;
      const flight = flightFrames + Math.floor(Math.random() * 20 - 10);
      const p = takeParticle();
      p.tx = tgt.x;
      p.ty = tgt.y;
      p.tz = sphereCenterZ + tgt.z;
      p.x = sx;
      p.y = sy;
      p.z = sphereCenterZ + sz;
      p.velX = (tgt.x - sx) / flight;
      p.velY = (tgt.y - sy) / flight;
      p.velZ = (p.tz - p.z) / flight;
      p.age = 0;
      p.dead = false;
      p.alpha = 0;
      p.flight = flight;
      p.hold = holdFrames;
      p.decay = decayFrames;
    };

    // ── Интерактив ─────────────────────────────────────────────────
    let yaw = 0;
    let pitch = 0;
    let lastFrameT = performance.now();

    let cursorInside = false;
    let cursorCanvasX = 0;
    let cursorCanvasY = 0;

    // Элемент, на котором слушаем события (может быть шире, чем canvas).
    const eventTarget: HTMLElement =
      (trackingRef && trackingRef.current) || canvas;

    const cursorToCanvas = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    // Только tracking курсора — ни drag, ни click-teleport. При входе
    // помечаем cursorInside=true, в step() cursor-follow возьмёт
    // актуальные координаты.
    const onPointerMove = (e: PointerEvent) => {
      const c = cursorToCanvas(e.clientX, e.clientY);
      cursorCanvasX = c.x;
      cursorCanvasY = c.y;
      cursorInside = true;
    };

    const onPointerLeave = () => {
      cursorInside = false;
    };

    const onPointerEnter = () => {
      cursorInside = true;
    };

    if (interactive) {
      eventTarget.addEventListener("pointermove", onPointerMove);
      eventTarget.addEventListener("pointerleave", onPointerLeave);
      eventTarget.addEventListener("pointerenter", onPointerEnter);
    }

    // ── Рендер-цикл ───────────────────────────────────────────────
    let raf = 0;

    const step = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastFrameT) / 1000);
      lastFrameT = now;

      // Плавно подгоняем центр фигуры к целевому (после клика-teleport)
      const cLerp = 1 - Math.exp(-centerLerpPerSec * dt);
      currentCX += (targetCX - currentCX) * cLerp;
      currentCY += (targetCY - currentCY) * cLerp;

      // Углы поворота — или cursor-follow, или auto-rotate.
      if (cursorInside) {
        // Cursor-follow: фигура «смотрит» в сторону курсора. Горизонталь
        // инвертирована — шар поворачивается В ту же сторону, куда ведёт
        // курсор, а не вслед за ним.
        const dxC = cursorCanvasX - currentCX;
        const dyC = cursorCanvasY - currentCY;
        const nx = Math.max(-1, Math.min(1, dxC / (cssW * 0.5)));
        const ny = Math.max(-1, Math.min(1, dyC / (cssH * 0.5)));
        const desiredYaw = -nx * cursorYawMax;
        const desiredPitch = ny * cursorPitchMax;
        const k = 1 - Math.exp(-cursorLerpPerSec * dt);
        // КРАТЧАЙШИЙ путь к целевому yaw — иначе при заходе из auto-rotate
        // lerp бы проехал через все накопленные в idle обороты (шар
        // «раскручивается» и пропорционально длительности простоя).
        const dYaw = normalizeAngle(desiredYaw - yaw);
        yaw += dYaw * k;
        pitch += (desiredPitch - pitch) * k;
      } else {
        // Auto-rotate. Нормализуем yaw в [-π, π], чтобы он не накапливал
        // обороты — так вход cursor-follow всегда идёт коротким путём.
        yaw = normalizeAngle(yaw + autoYawSpeed * dt);
        pitch *= Math.pow(0.6, dt);
      }
      // Safety: удерживаем pitch в пределах, на случай любых крайних
      // значений (обычно не нужно).
      if (pitch > pitchLimit) pitch = pitchLimit;
      else if (pitch < -pitchLimit) pitch = -pitchLimit;

      for (let i = 0; i < numPerFrame; i++) spawn();

      const sinY = Math.sin(yaw);
      const cosY = Math.cos(yaw);
      const sinP = Math.sin(pitch);
      const cosP = Math.cos(pitch);

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, cssW, cssH);

      let p = particleList.first;
      while (p !== null) {
        const nextP = p.next;
        p.age++;

        const total = p.flight + p.hold + p.decay;

        if (p.age < p.flight) {
          p.velX += randAccelInFlight * (Math.random() * 2 - 1) * 0.05;
          p.velY += randAccelInFlight * (Math.random() * 2 - 1) * 0.05;
          p.velZ += randAccelInFlight * (Math.random() * 2 - 1) * 0.05;
          p.x += p.velX;
          p.y += p.velY;
          p.z += p.velZ;
        } else {
          p.x = p.tx;
          p.y = p.ty;
          p.z = p.tz;
          p.velX = p.velY = p.velZ = 0;
        }

        if (p.age >= total) {
          p.dead = true;
        } else if (p.age < p.flight) {
          const t = p.age / p.flight;
          p.alpha = t * t * (3 - 2 * t);
        } else if (p.age < p.flight + p.hold) {
          p.alpha = 1;
        } else {
          const t = (p.age - p.flight - p.hold) / p.decay;
          p.alpha = 1 - t * t;
        }

        const pz = p.z - sphereCenterZ;
        const x1 = cosY * p.x + sinY * pz;
        const z1 = -sinY * p.x + cosY * pz;
        const y1 = cosP * p.y - sinP * z1;
        const z2 = sinP * p.y + cosP * z1;
        const rotZ = z2 + sphereCenterZ;

        const m = fLen / (fLen - rotZ);
        p.projX = x1 * m + currentCX;
        p.projY = y1 * m + currentCY;

        const outside =
          p.projX > cssW || p.projX < 0 ||
          p.projY > cssH || p.projY < 0 ||
          rotZ > zMax;

        if (outside || p.dead) {
          recycle(p);
        } else {
          let depth = 1 - rotZ / zeroAlphaDepth;
          if (depth > 1) depth = 1;
          else if (depth < 0) depth = 0;
          const a = depth * p.alpha;
          if (a > 0.005) {
            ctx.fillStyle = rgbPrefix + a.toFixed(3) + ")";
            ctx.beginPath();
            ctx.arc(p.projX, p.projY, m * particleRad, 0, 2 * Math.PI, false);
            ctx.fill();
          }
        }

        p = nextP;
      }
    };

    const loop = () => {
      step();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (interactive) {
        eventTarget.removeEventListener("pointermove", onPointerMove);
        eventTarget.removeEventListener("pointerleave", onPointerLeave);
        eventTarget.removeEventListener("pointerenter", onPointerEnter);
      }
    };
  }, [r, g, b, sphereRadFactor, numPerFrame, startMul, flightFrames, holdFrames, decayFrames, shape, interactive, trackingRef]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
    />
  );
}

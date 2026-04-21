"use client";

import { useEffect, useRef } from "react";

// ParticleSphere — частицы прилетают из глубины кадра и приклеиваются к
// поверхности воображаемой сферы, держатся и затухают.
// Адаптация алгоритма rectangleworld.com (3D → 2D проекция) с инвертированной
// физикой: вместо отлёта от сферы наружу — полёт к сфере + stick.

interface ParticleSphereProps {
  className?: string;
  // Цвет частиц (RGB, 0–255). По умолчанию акцентный неоновый.
  r?: number;
  g?: number;
  b?: number;
  // Радиус сферы как доля min(width, height). 0.36 ≈ визуально 72% от min-размерa.
  sphereRadFactor?: number;
  // Сколько частиц рождается каждый кадр.
  numPerFrame?: number;
  // Множитель стартовой дистанции: startPos = targetPos * startMul (по тому же направлению).
  startMul?: number;
  // Длительности в кадрах (≈ 60fps).
  flightFrames?: number;
  holdFrames?: number;
  decayFrames?: number;
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
}: ParticleSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Константы проекции ─────────────────────────────────────────
    const fLen = 320; // расстояние до наблюдателя (оригинал)
    const zMax = fLen - 2;
    const particleRad = 2.2;
    const zeroAlphaDepth = -750;
    const randAccelInFlight = 0.18; // лёгкое "дрожание" на траектории
    const turnSpeed = (2 * Math.PI) / 24000; // очень медленный поворот всей сферы
    const rgbPrefix = `rgba(${r},${g},${b},`;

    type P = {
      // текущая позиция в "мировой" системе (CSS-пиксели относительно центра)
      x: number; y: number; z: number;
      // куда летит — точка на сфере в мировой системе
      tx: number; ty: number; tz: number;
      // скорости
      velX: number; velY: number; velZ: number;
      // проекция на экран (в CSS-пикселях)
      projX: number; projY: number;
      // возраст в кадрах
      age: number;
      dead: boolean;
      alpha: number;
      // intrinsic лайвспан
      flight: number;
      hold: number;
      decay: number;
      // связный список
      prev: P | null;
      next: P | null;
    };

    const particleList: { first: P | null } = { first: null };
    const recycleBin: { first: P | null } = { first: null };

    // ── Размер/DPR ────────────────────────────────────────────────
    let DPR = 1;
    let cssW = 1;
    let cssH = 1;
    let sphereRad = 100;
    let sphereCenterZ = -3 - sphereRad;

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      canvas.width = Math.round(cssW * DPR);
      canvas.height = Math.round(cssH * DPR);
      // рисуем в CSS-пикселях, DPR делает сглаживание
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      sphereRad = Math.min(cssW, cssH) * sphereRadFactor;
      sphereCenterZ = -3 - sphereRad;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ── Управление пулом частиц ───────────────────────────────────
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
        if (p.next) {
          recycleBin.first = p.next;
          p.next.prev = null;
        } else {
          recycleBin.first = null;
        }
      } else {
        p = newEmpty();
      }
      // В голову списка
      if (particleList.first == null) {
        particleList.first = p;
        p.prev = null;
        p.next = null;
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
        if (p.next == null) {
          if (p.prev) p.prev.next = null;
        } else {
          if (p.prev) p.prev.next = p.next;
          p.next.prev = p.prev;
        }
      }
      if (recycleBin.first == null) {
        recycleBin.first = p;
        p.prev = null;
        p.next = null;
      } else {
        p.next = recycleBin.first;
        recycleBin.first.prev = p;
        recycleBin.first = p;
        p.prev = null;
      }
    };

    // ── Породить частицу: стартует далеко, приклеится к сфере ─────
    const spawn = () => {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);
      const sPhi = Math.sin(phi);
      // target — точка на сфере (в мировой системе относительно центра сферы)
      const tx = sphereRad * sPhi * Math.cos(theta);
      const ty = sphereRad * sPhi * Math.sin(theta);
      const tz = sphereRad * Math.cos(phi);
      // Старт: по тому же направлению от центра, но дальше
      const sx = tx * startMul;
      const sy = ty * startMul;
      const sz = tz * startMul;
      // Длительность подлёта немного варьирует
      const flight = flightFrames + Math.floor(Math.random() * 20 - 10);
      const p = takeParticle();
      p.tx = tx;
      p.ty = ty;
      p.tz = sphereCenterZ + tz;
      p.x = sx;
      p.y = sy;
      p.z = sphereCenterZ + sz;
      // Стартовая скорость так, чтобы за flight кадров дойти до target
      p.velX = (tx - sx) / flight;
      p.velY = (ty - sy) / flight;
      p.velZ = (p.tz - p.z) / flight;
      p.age = 0;
      p.dead = false;
      p.alpha = 0;
      p.flight = flight;
      p.hold = holdFrames;
      p.decay = decayFrames;
    };

    // ── Рендер-цикл ───────────────────────────────────────────────
    let turnAngle = 0;
    let raf = 0;

    const step = () => {
      // Новые частицы
      for (let i = 0; i < numPerFrame; i++) spawn();

      turnAngle = (turnAngle + turnSpeed) % (2 * Math.PI);
      const sinA = Math.sin(turnAngle);
      const cosA = Math.cos(turnAngle);

      // Полный clear (в CSS-пикселях)
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, cssW, cssH);

      const projCX = cssW / 2;
      const projCY = cssH / 2;

      let p = particleList.first;
      while (p !== null) {
        const nextP = p.next;
        p.age++;

        const total = p.flight + p.hold + p.decay;

        if (p.age < p.flight) {
          // Полёт: возможен лёгкий шум по траектории
          p.velX += randAccelInFlight * (Math.random() * 2 - 1) * 0.05;
          p.velY += randAccelInFlight * (Math.random() * 2 - 1) * 0.05;
          p.velZ += randAccelInFlight * (Math.random() * 2 - 1) * 0.05;
          p.x += p.velX;
          p.y += p.velY;
          p.z += p.velZ;
        } else {
          // Прилипание: фиксируем позицию на сфере
          p.x = p.tx;
          p.y = p.ty;
          p.z = p.tz;
          p.velX = p.velY = p.velZ = 0;
        }

        // Огибающая (envelope) альфа:
        //   фаза полёта — плавный рост (attack)
        //   фаза hold — держится максимально
        //   фаза decay — плавное затухание
        if (p.age >= total) {
          p.dead = true;
        } else if (p.age < p.flight) {
          // сглаживаем 0→1 по кривой ease-out, чтобы появление не было линейным
          const t = p.age / p.flight;
          p.alpha = t * t * (3 - 2 * t); // smoothstep
        } else if (p.age < p.flight + p.hold) {
          p.alpha = 1;
        } else {
          const t = (p.age - p.flight - p.hold) / p.decay;
          p.alpha = 1 - t * t;
        }

        // Поворот вокруг вертикальной оси + перспектива
        const rotX = cosA * p.x + sinA * (p.z - sphereCenterZ);
        const rotZ = -sinA * p.x + cosA * (p.z - sphereCenterZ) + sphereCenterZ;
        const m = fLen / (fLen - rotZ);
        p.projX = rotX * m + projCX;
        p.projY = p.y * m + projCY;

        const outside =
          p.projX > cssW || p.projX < 0 ||
          p.projY > cssH || p.projY < 0 ||
          rotZ > zMax;

        if (outside || p.dead) {
          recycle(p);
        } else {
          // Глубина: чем ближе к наблюдателю, тем ярче
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
    };
  }, [r, g, b, sphereRadFactor, numPerFrame, startMul, flightFrames, holdFrames, decayFrames]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
    />
  );
}

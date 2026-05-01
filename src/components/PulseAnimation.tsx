"use client";

import { useEffect, useRef, useState } from "react";

export type PulseVariant = "wave" | "shockwave" | "spiral";

interface PulseAnimationProps {
  variant: PulseVariant;
  /** Реверс направления анимации. Для spiral — пульс идёт от края к центру. */
  reverse?: boolean;
  className?: string;
}

const W = 180;
const H = 180;
const cx = W / 2;
const cy = H / 2;
const dotRings = [
  { radius: 15, count: 6 },
  { radius: 30, count: 12 },
  { radius: 45, count: 18 },
  { radius: 60, count: 24 },
  { radius: 75, count: 30 },
];

/** Pulse-анимации для плиток «Услуги & экспертиза»:
 *  - default: статичный кадр (t=0), точки серые
 *  - hover ближайшего .group-родителя: запускается RAF-анимация, точки зелёные #A6FF00 */
export default function PulseAnimation({ variant, reverse = false, className }: PulseAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState(false);

  // hover-listener на ближайшем .group-родителе
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let el: HTMLElement | null = canvas;
    while (el && !el.classList.contains("group")) {
      el = el.parentElement;
    }
    const target: HTMLElement | null = el ?? canvas.parentElement;
    if (!target) return;
    const enter = () => setHover(true);
    const leave = () => setHover(false);
    target.addEventListener("mouseenter", enter);
    target.addEventListener("mouseleave", leave);
    return () => {
      target.removeEventListener("mouseenter", enter);
      target.removeEventListener("mouseleave", leave);
    };
  }, []);

  // RAF-loop при hover; статичный кадр t=0 без hover
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = W;
    canvas.height = H;

    const fill = (a: number) =>
      hover
        ? `rgba(166, 255, 0, ${Math.max(0, Math.min(1, a))})`
        : `rgba(255, 255, 255, ${Math.max(0, Math.min(1, a * 0.55))})`;

    const drawWave = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = fill(0.9);
      ctx.fill();
      dotRings.forEach((ring, ri) => {
        for (let i = 0; i < ring.count; i++) {
          const a = (i / ring.count) * Math.PI * 2;
          const rp = Math.sin(t * 2 - ri * 0.4) * 3;
          const x = cx + Math.cos(a) * (ring.radius + rp);
          const y = cy + Math.sin(a) * (ring.radius + rp);
          const op =
            0.4 + ((Math.sin(t * 2 - ri * 0.4 + i * 0.2) + 1) / 2) * 0.6;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = fill(op);
          ctx.fill();
        }
      });
    };

    const drawShockwave = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const waveSpeed = 30;
      const waveThickness = 40;
      const maxDotRadius = dotRings[dotRings.length - 1].radius;
      const maxAnimatedRadius = maxDotRadius + waveThickness;
      const rotMagnitude = 0.15;
      const rotSpeedFactor = 3;

      ctx.beginPath();
      ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = fill(0.8);
      ctx.fill();

      const wavefront = (t * waveSpeed) % maxAnimatedRadius;
      dotRings.forEach((ring) => {
        for (let i = 0; i < ring.count; i++) {
          const baseAngle = (i / ring.count) * Math.PI * 2;
          const baseRadius = ring.radius;
          const dist = baseRadius - wavefront;
          let pf = 0;
          if (Math.abs(dist) < waveThickness / 2) {
            pf = Math.cos((dist / (waveThickness / 2)) * (Math.PI / 2));
            pf = Math.max(0, pf);
          }
          let cur = baseAngle;
          if (pf > 0.01) {
            cur += pf * Math.sin(t * rotSpeedFactor + i * 0.5) * rotMagnitude;
          }
          const ds = 1.5 + pf * 1.8;
          const x = cx + Math.cos(cur) * baseRadius;
          const y = cy + Math.sin(cur) * baseRadius;
          const op = 0.2 + pf * 0.7;
          ctx.beginPath();
          ctx.arc(x, y, ds, 0, Math.PI * 2);
          ctx.fillStyle = fill(op);
          ctx.fill();
        }
      });
    };

    const drawSpiral = (t: number) => {
      // Спираль через ту же сетку из 5 концентрических колец.
      // Эффект: фронт идёт ОТ края К ЦЕНТРУ, по дороге закручиваясь по углу.
      // Когда фронт пересекает точку — она вспыхивает, потом гаснет.
      // Получается «спиральная воронка» — точки пробегают от внешнего кольца к центру.
      ctx.clearRect(0, 0, W, H);
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = fill(0.5);
      ctx.fill();

      const maxR = 75; // максимальный радиус (внешнее кольцо)
      const radialSpeed = 80; // px/sec — скорость движения фронта по радиусу
      const cycleSpan = maxR + 30; // px: max радиус + пауза «вне поля» после центра
      const cycleDuration = cycleSpan / radialSpeed; // длительность одного цикла
      const angularSpeed = 1.6; // рад/с — закручивание во время полёта к центру
      const twistFactor = 0.025; // дополнительный спиральный сдвиг по радиусу
      const armWidth = Math.PI / 2.5; // ширина рукава в радианах
      const numArms = 2;
      const dir = reverse ? -1 : 1;
      const decayRate = 4.0; // экспоненциальный спад вспышки во времени

      // Время в текущем цикле
      const tCycle = t % cycleDuration;

      dotRings.forEach((ring, ringIndex) => {
        for (let i = 0; i < ring.count; i++) {
          const baseAngle = (i / ring.count) * Math.PI * 2;
          const x = cx + Math.cos(baseAngle) * ring.radius;
          const y = cy + Math.sin(baseAngle) * ring.radius;

          // Базовая пульсация точки (как у wave/shockwave) — плавная,
          // независимая от спирального фронта. opacity и size слегка дышат.
          const breath =
            (Math.sin(t * 1.6 - ringIndex * 0.4 + i * 0.2) + 1) / 2; // 0..1
          const baseOpacity = 0.25 + breath * 0.25;
          const baseSize = 1.8 + breath * 0.6;

          // Когда фронт пересёк это кольцо в текущем цикле
          const tPass = (maxR - ring.radius) / radialSpeed;
          const timeSincePass = tCycle - tPass;

          // Спиральный flash — поверх базовой пульсации
          let bestPf = 0;
          if (timeSincePass >= 0) {
            for (let arm = 0; arm < numArms; arm++) {
              const armOffset = (arm / numArms) * Math.PI * 2;
              const armAngleAtPass =
                dir * (t - timeSincePass) * angularSpeed +
                ring.radius * twistFactor +
                armOffset;

              let da = baseAngle - armAngleAtPass;
              da = ((da % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;

              let angularGate = 0;
              if (Math.abs(da) < armWidth / 2) {
                angularGate = Math.max(
                  0,
                  Math.cos((da / (armWidth / 2)) * (Math.PI / 2))
                );
              }
              const timeDecay = Math.exp(-timeSincePass * decayRate);
              const pf = angularGate * timeDecay;
              if (pf > bestPf) bestPf = pf;
            }
          }

          // Композиция: базовая пульсация + flash. Берём максимум, чтобы
          // вспышка не "обнулила" базовое состояние.
          const dotSize = Math.max(baseSize, baseSize + bestPf * 2.2);
          const op = Math.max(baseOpacity, baseOpacity + bestPf * 0.65);
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = fill(Math.min(1, op));
          ctx.fill();
        }
      });
    };

    const drawDefault = () => {
      // Единый статичный кадр для всех вариантов:
      // 5 концентрических колец точек одного размера и opacity, серые.
      ctx.clearRect(0, 0, W, H);
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = fill(0.5);
      ctx.fill();
      dotRings.forEach((ring) => {
        for (let i = 0; i < ring.count; i++) {
          const a = (i / ring.count) * Math.PI * 2;
          const x = cx + Math.cos(a) * ring.radius;
          const y = cy + Math.sin(a) * ring.radius;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = fill(0.45);
          ctx.fill();
        }
      });
    };

    const drawAt = (t: number) => {
      if (variant === "wave") drawWave(t);
      else if (variant === "shockwave") drawShockwave(t);
      else drawSpiral(t);
    };

    let time = 0;
    let lastTime: number | null = null;
    let rafId = 0;
    let stopped = false;

    if (hover) {
      const loop = (now: number) => {
        if (stopped) return;
        if (lastTime == null) lastTime = now;
        const dt = (now - lastTime) / 1000;
        lastTime = now;
        time += dt;
        drawAt(time);
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    } else {
      // Статика: единый базовый кадр (одинаковый для всех вариантов)
      drawDefault();
    }

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
    };
  }, [hover, variant, reverse]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className={className}
      aria-hidden
    />
  );
}

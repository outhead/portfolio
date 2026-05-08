"use client";

import { useEffect, useRef } from "react";
import type Matter from "matter-js";

/**
 * Фоновый слой с физикой Matter.js — лаймовые пилюли, падающие сверху.
 * Триггерится по hover родителя:
 *  - mouseenter: появляется пол, начинается спавн пилюль
 *  - mouseleave: пол убирается, спавн стопается, пилюли падают вниз и удаляются
 *
 * Размещать как абсолютный inset-0 child внутри hover-элемента.
 * Сам слой `pointer-events-none`, чтобы не мешать кликам по родителю.
 */
export default function PillsBackdrop() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const trigger = container.parentElement;
    if (!trigger) return;

    let cancelled = false;
    let cleanupFn: (() => void) | null = null;

    import("matter-js").then((mod) => {
      if (cancelled) return;
      const M = (mod.default ?? mod) as typeof import("matter-js");
      const { Engine, Render, Runner, Bodies, Composite } = M;

      const measure = () => ({ w: container.clientWidth, h: container.clientHeight });
      let { w, h } = measure();
      if (w < 10 || h < 10) return;

      const engine = Engine.create();
      engine.gravity.y = 1.8;

      const render = Render.create({
        element: container,
        engine,
        options: {
          width: w,
          height: h,
          wireframes: false,
          background: "transparent",
          pixelRatio: window.devicePixelRatio,
        },
      });
      Render.run(render);

      const runner = Runner.create();
      Runner.run(runner, engine);

      // Стенки (всегда)
      const wallOpts = { isStatic: true, render: { visible: false } };
      const leftWall = Bodies.rectangle(-12, h / 2, 24, h * 2, wallOpts);
      const rightWall = Bodies.rectangle(w + 12, h / 2, 24, h * 2, wallOpts);
      Composite.add(engine.world, [leftWall, rightWall]);

      // Пол — переключаемый
      let ground: Matter.Body | null = null;
      const addGround = () => {
        if (ground) return;
        ground = Bodies.rectangle(w / 2, h + 12, w + 40, 24, wallOpts);
        Composite.add(engine.world, ground);
      };
      const removeGround = () => {
        if (!ground) return;
        Composite.remove(engine.world, ground);
        ground = null;
      };

      // Pill factory — крупные лаймовые пилюли
      const pillW = Math.max(72, Math.round(w * 0.22));
      const pillH = Math.max(30, Math.round(pillW * 0.42));
      const maxPills = 25;

      const pillBodies: Matter.Body[] = [];
      const spawnPill = () => {
        if (pillBodies.length >= maxPills) return;
        const x = pillW / 2 + Math.random() * (w - pillW);
        const pill = Bodies.rectangle(x, -pillH, pillW, pillH, {
          chamfer: { radius: pillH / 2 },
          density: 0.003, // ×3 от дефолтной (0.001) — тяжелее
          restitution: 0.35,
          friction: 0.08,
          frictionAir: 0.004,
          angle: Math.random() * Math.PI,
          render: {
            fillStyle: "#A6FF00",
            strokeStyle: "rgba(0,0,0,0.35)",
            lineWidth: 1,
          },
        });
        pillBodies.push(pill);
        Composite.add(engine.world, pill);
      };

      // Подметаем выпавшие за нижний край пилюли (когда пол убран)
      const sweepId = window.setInterval(() => {
        for (let i = pillBodies.length - 1; i >= 0; i--) {
          const p = pillBodies[i];
          if (p.position.y > h + 200) {
            Composite.remove(engine.world, p);
            pillBodies.splice(i, 1);
          }
        }
      }, 400);

      // Hover-state
      let spawnId: number | null = null;
      const onEnter = () => {
        addGround();
        if (spawnId != null) return;
        // Стартовый burst: 8 пилюль в первые 400мс
        for (let i = 0; i < 8; i++) {
          window.setTimeout(spawnPill, i * 50);
        }
        // Дальше — каждые 120мс, чтобы половина кубика заполнялась за ~3 секунды
        spawnId = window.setInterval(spawnPill, 120);
      };
      const onLeave = () => {
        if (spawnId != null) {
          window.clearInterval(spawnId);
          spawnId = null;
        }
        // Чуть задержим, чтобы текущие пилюли не «застряли»
        window.setTimeout(removeGround, 80);
      };
      trigger.addEventListener("mouseenter", onEnter);
      trigger.addEventListener("mouseleave", onLeave);

      // На тач-устройствах (без hover) триггерим тем же IntersectionObserver-ом,
      // что используется у card-видео: когда карточка пересекает полосу-фокус
      // (50%—65% от верха viewport) — onEnter; ушла — onLeave. Без этого на
      // мобиле пилюли никогда не появлялись (mouseenter не приходит).
      const isTouch =
        typeof window !== "undefined" &&
        window.matchMedia("(hover: none)").matches;
      let mobileIO: IntersectionObserver | null = null;
      if (isTouch && typeof IntersectionObserver !== "undefined") {
        mobileIO = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) onEnter();
              else onLeave();
            }
          },
          { rootMargin: "-50% 0px -35% 0px", threshold: 0 }
        );
        mobileIO.observe(trigger);
      }

      // Resize
      const onResize = () => {
        const next = measure();
        if (next.w === w && next.h === h) return;
        w = next.w;
        h = next.h;
        render.canvas.width = w;
        render.canvas.height = h;
        render.options.width = w;
        render.options.height = h;
        M.Body.setPosition(rightWall, { x: w + 12, y: h / 2 });
        if (ground) M.Body.setPosition(ground, { x: w / 2, y: h + 12 });
      };
      window.addEventListener("resize", onResize);

      cleanupFn = () => {
        if (spawnId != null) window.clearInterval(spawnId);
        window.clearInterval(sweepId);
        trigger.removeEventListener("mouseenter", onEnter);
        trigger.removeEventListener("mouseleave", onLeave);
        mobileIO?.disconnect();
        window.removeEventListener("resize", onResize);
        Render.stop(render);
        Runner.stop(runner);
        render.canvas.remove();
        Engine.clear(engine);
      };
    });

    return () => {
      cancelled = true;
      cleanupFn?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="absolute inset-0 z-0 pointer-events-none"
    />
  );
}

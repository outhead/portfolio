"use client";

/* ─────────────────────────────────────────────────────────────────
 * PixelCubeRain — физика засыпания: на ховере отсек заполняется
 * маленькими бренд-кубиками (Matter.js), которые падают и копятся;
 * на уходе курсора пол убирается и кубики утекают вниз.
 * По мотивам PillsBackdrop (webgl-блок), но квадратные кубики в
 * бренд-цвете с белым «диодом» в центре.
 *
 * Размещать абсолютным inset-0 внутри hover-элемента (.group / окно).
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import type Matter from "matter-js";

export default function PixelCubeRain({ color = "#FF2436" }: { color?: string }) {
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
      engine.gravity.y = 1.6;

      const render = Render.create({
        element: container,
        engine,
        options: { width: w, height: h, wireframes: false, background: "transparent", pixelRatio: window.devicePixelRatio },
      });
      Render.run(render);
      const runner = Runner.create();
      Runner.run(runner, engine);

      const wallOpts = { isStatic: true, render: { visible: false } };
      const leftWall = Bodies.rectangle(-12, h / 2, 24, h * 2, wallOpts);
      const rightWall = Bodies.rectangle(w + 12, h / 2, 24, h * 2, wallOpts);
      Composite.add(engine.world, [leftWall, rightWall]);

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

      const mobile = window.matchMedia("(max-width: 767px)").matches;
      const size = Math.min(34, Math.max(18, Math.round(w * 0.075))); // сторона кубика
      const maxCubes = mobile ? 46 : 64;

      const bodies: Matter.Body[] = [];
      const spawn = () => {
        if (bodies.length >= maxCubes) return;
        const x = size / 2 + Math.random() * (w - size);
        const cube = Bodies.rectangle(x, -size, size, size, {
          chamfer: { radius: 2 },
          density: 0.003,
          restitution: 0.18,
          friction: 0.45,
          frictionAir: 0.006,
          angle: (Math.random() - 0.5) * 0.5,
          render: { fillStyle: color, strokeStyle: "rgba(0,0,0,0.4)", lineWidth: 1.5 },
        });
        bodies.push(cube);
        Composite.add(engine.world, cube);
      };

      const sweepId = window.setInterval(() => {
        for (let i = bodies.length - 1; i >= 0; i--) {
          if (bodies[i].position.y > h + 200) {
            Composite.remove(engine.world, bodies[i]);
            bodies.splice(i, 1);
          }
        }
      }, 400);

      let spawnId: number | null = null;
      const onEnter = () => {
        addGround();
        if (spawnId != null) return;
        const burst = mobile ? 14 : 20;
        for (let i = 0; i < burst; i++) window.setTimeout(spawn, i * 35);
        spawnId = window.setInterval(spawn, mobile ? 45 : 50);
      };
      const onLeave = () => {
        if (spawnId != null) { window.clearInterval(spawnId); spawnId = null; }
        window.setTimeout(removeGround, 80);
      };
      trigger.addEventListener("mouseenter", onEnter);
      trigger.addEventListener("mouseleave", onLeave);

      const isTouch = window.matchMedia("(hover: none)").matches;
      let io: IntersectionObserver | null = null;
      if (isTouch && typeof IntersectionObserver !== "undefined") {
        io = new IntersectionObserver(
          (entries) => entries.forEach((e) => (e.isIntersecting ? onEnter() : onLeave())),
          { rootMargin: "-50% 0px -35% 0px", threshold: 0 }
        );
        io.observe(trigger);
      }

      const onResize = () => {
        const next = measure();
        if (next.w === w && next.h === h) return;
        w = next.w; h = next.h;
        render.canvas.width = w; render.canvas.height = h;
        render.options.width = w; render.options.height = h;
        M.Body.setPosition(rightWall, { x: w + 12, y: h / 2 });
        if (ground) M.Body.setPosition(ground, { x: w / 2, y: h + 12 });
      };
      window.addEventListener("resize", onResize);

      cleanupFn = () => {
        if (spawnId != null) window.clearInterval(spawnId);
        window.clearInterval(sweepId);
        trigger.removeEventListener("mouseenter", onEnter);
        trigger.removeEventListener("mouseleave", onLeave);
        io?.disconnect();
        window.removeEventListener("resize", onResize);
        Render.stop(render);
        Runner.stop(runner);
        render.canvas.remove();
        Engine.clear(engine);
      };
    });

    return () => { cancelled = true; cleanupFn?.(); };
  }, [color]);

  return <div ref={containerRef} aria-hidden className="absolute inset-0 z-[1] pointer-events-none" />;
}

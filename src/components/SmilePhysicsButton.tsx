"use client";

import { useEffect, useRef } from "react";
import type Matter from "matter-js";

function pluralize(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "раз";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "раза";
  return "раз";
}

interface SmilePhysicsButtonProps {
  onClick: () => void;
  /** Глобальный счётчик «улыбнулись» — рендерим под надписью; null = ещё грузим */
  globalCount: number | null;
  pressing: boolean;
}

/**
 * Чёрный кубик с лаймовыми пилюлями, падающими сверху.
 * Заполнение останавливается когда в кубе ~25 пилюль (≈ половина).
 * Onclick → onClick prop; драг пилюль — через Matter.MouseConstraint.
 */
export default function SmilePhysicsButton({
  onClick,
  globalCount,
  pressing,
}: SmilePhysicsButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    // Динамический импорт Matter — он only-client
    import("matter-js").then((mod) => {
      if (cancelled) return;
      const Matter = (mod.default ?? mod) as typeof import("matter-js");
      const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint } = Matter;

      const w = container.clientWidth;
      const h = container.clientHeight;

      const engine = Engine.create();
      engine.gravity.y = 1.05;

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

      // Стенки + пол (top открыт, чтобы пилюли могли «подсыпаться»)
      const wallOpts = {
        isStatic: true,
        render: { visible: false },
      };
      const ground = Bodies.rectangle(w / 2, h + 12, w + 40, 24, wallOpts);
      const leftWall = Bodies.rectangle(-12, h / 2, 24, h * 2, wallOpts);
      const rightWall = Bodies.rectangle(w + 12, h / 2, 24, h * 2, wallOpts);
      Composite.add(engine.world, [ground, leftWall, rightWall]);

      // Pill factory — крупные пилюли, лайм
      const pillW = Math.max(46, Math.round(w * 0.26));
      const pillH = Math.max(20, Math.round(pillW * 0.42));
      const maxPills = 25;
      let spawned = 0;

      function spawnPill() {
        if (spawned >= maxPills) return;
        spawned++;
        const x = pillW / 2 + Math.random() * (w - pillW);
        const pill = Bodies.rectangle(x, -pillH, pillW, pillH, {
          chamfer: { radius: pillH / 2 },
          restitution: 0.45,
          friction: 0.06,
          frictionAir: 0.012,
          angle: Math.random() * Math.PI,
          render: {
            fillStyle: "#A6FF00",
            strokeStyle: "rgba(0,0,0,0.35)",
            lineWidth: 1,
          },
        });
        Composite.add(engine.world, pill);
      }

      // Начальный burst + интервал
      for (let i = 0; i < 5; i++) {
        setTimeout(spawnPill, i * 140);
      }
      const intervalId = window.setInterval(spawnPill, 850);

      // Drag-через-Mouse (можно крутить пилюли)
      const mouse = Mouse.create(render.canvas);
      const mouseConstraint = MouseConstraint.create(engine, {
        mouse,
        constraint: {
          stiffness: 0.2,
          render: { visible: false },
        },
      });
      Composite.add(engine.world, mouseConstraint);
      // Привязка mouse к рендеру (для синхронизации pixelRatio)
      (render as unknown as { mouse: Matter.Mouse }).mouse = mouse;
      // Снимаем wheel-handler matter-js, чтобы скролл страницы работал поверх кнопки
      const mouseAny = mouse as unknown as { mousewheel?: EventListener };
      if (mouseAny.mousewheel) {
        render.canvas.removeEventListener("mousewheel", mouseAny.mousewheel);
        render.canvas.removeEventListener("DOMMouseScroll", mouseAny.mousewheel);
      }

      // Resize
      const onResize = () => {
        const newW = container.clientWidth;
        const newH = container.clientHeight;
        render.canvas.width = newW;
        render.canvas.height = newH;
        render.options.width = newW;
        render.options.height = newH;
        // Move walls
        Matter.Body.setPosition(ground, { x: newW / 2, y: newH + 12 });
        Matter.Body.setPosition(rightWall, { x: newW + 12, y: newH / 2 });
      };
      window.addEventListener("resize", onResize);

      return () => {
        cancelled = true;
        window.clearInterval(intervalId);
        window.removeEventListener("resize", onResize);
        Render.stop(render);
        Runner.stop(runner);
        render.canvas.remove();
        Engine.clear(engine);
      };
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Улыбнуться"
      className={`group relative aspect-[5/3] md:aspect-square w-full md:w-[220px] lg:w-[260px] rounded-3xl bg-black overflow-hidden border border-[#A6FF00]/30 select-none cursor-pointer transition-all duration-300 hover:border-[#A6FF00]/60 hover:shadow-[0_0_80px_-10px_rgba(166,255,0,0.45)] ${
        pressing ? "scale-[0.96]" : "scale-100"
      }`}
    >
      {/* Канвас Matter — внизу, занимает всю площадь */}
      <div ref={containerRef} className="absolute inset-0 z-[1]" />
      {/* Текст — сверху, не блокирует drag по пилюлям */}
      <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-3 md:gap-4 pointer-events-none">
        <span className="font-p95 text-[clamp(28px,3.8vw,52px)] leading-none uppercase tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
          Улыбнуться
        </span>
        {globalCount != null && (
          <span className="inline-flex items-baseline gap-1.5 font-p95 text-white/65">
            <span className="text-[18px] md:text-[20px] leading-none tabular-nums drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {globalCount.toLocaleString("ru-RU")}
            </span>
            <span className="text-[10px] md:text-[11px] tracking-[0.18em] uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {pluralize(globalCount)} нажали
            </span>
          </span>
        )}
      </div>
    </button>
  );
}

"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** цвет напыления "R,G,B" */
  color?: string;
  /** скорость растворения (0 — не тает, 0.02 — быстро) */
  fade?: number;
  /** минимальный радиус распыла, см */
  minRadiusCm?: number;
  /** кол-во частиц в факеле */
  nMist?: number;
  /** максимальный размер частицы, px */
  dotMax?: number;
  /** плотность (множитель прозрачности) */
  density?: number;
  /** порог скролла в px, ниже которого не реагирует */
  step?: number;
  /** сколько пера на 1px скролла */
  adv?: number;
  /** частота синуса (лево-право) */
  freq?: number;
  /** вертикальное уплотнение: <1 — проходы перекрываются (ровнее поток) */
  vScale?: number;
  /** вероятность капли на каждый штамп (0..1) */
  dripRate?: number;
  /** минимальный размер капли, px */
  dripSizeMin?: number;
  /** максимальный размер капли, px */
  dripSizeMax?: number;
  /** вязкость 0..1 (выше — медленнее, липче) */
  viscosity?: number;
  /** максимальная длина потёка, px (рандомизируется по размеру капли и вязкости) */
  runMax?: number;
  /** 0..1 — насколько капли тяготеют к краям/местам застоя */
  edgeBias?: number;
  /** лимит одновременных капель */
  maxDrips?: number;
  /** слипание капель при касании */
  coalesce?: boolean;
  /** авто-рисование без скролла (для отладки/тюнинга) */
  autoDraw?: boolean;
  /** CSS-блюр всего слоя спрея, px (надёжная альтернатива backdrop-filter) */
  blur?: number;
  /** z-index оверлея */
  zIndex?: number;
};

export default function SprayTrail({
  color = "30,186,18",
  fade = 0.002,
  minRadiusCm = 2.7,
  nMist = 300,
  dotMax = 0.9,
  density = 3,
  step = 118,
  adv = 0.35,
  freq = 0.037,
  vScale = 0.5,
  dripRate = 0.05,
  dripSizeMin = 0.9,
  dripSizeMax = 4.3,
  viscosity = 0.88,
  runMax = 180,
  edgeBias = 1,
  maxDrips = 70,
  coalesce = true,
  autoDraw = false,
  blur = 0,
  zIndex = 9999,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const CM = 96 / 2.54;
    const COS45 = 0.70710678,
      SIN45 = 0.70710678;

    let W = 0,
      H = 0,
      dpr = 1;
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      cvs.width = W * dpr;
      cvs.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size);

    let prog = 0,
      target = 0,
      acc = 0,
      lastY = window.scrollY || 0;
    const onScroll = () => {
      const y = window.scrollY || 0;
      const d = y - lastY;
      lastY = y;
      if (d > 0) acc += d; // только вниз
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const g = () => Math.random() + Math.random() + Math.random() - 1.5;

    type Drip = { x: number; y: number; vy: number; r: number; a: number; maxRun: number; run: number };
    const drips: Drip[] = [];
    const addDrip = (x: number, y: number) => {
      if (drips.length >= maxDrips) return;
      const r = dripSizeMin + Math.random() * Math.max(0, dripSizeMax - dripSizeMin);
      // длина потёка: больше для крупных капель и низкой вязкости, с разбросом
      const mr = runMax * (r / dripSizeMax) * (0.2 + Math.random() * 0.95) * (1.15 - viscosity * 0.55);
      drips.push({
        x: x + (Math.random() - 0.5) * minRadiusCm * CM * 0.5,
        y: y + (Math.random() - 0.5) * 6,
        vy: 0.1 + Math.random() * 0.2,
        r,
        a: (0.1 + Math.random() * 0.12) * density,
        maxRun: mr,
        run: 0,
      });
    };

    const stepDrips = () => {
      // слипание: площадь сохраняется, импульс усредняется
      if (coalesce) {
        for (let i = 0; i < drips.length; i++) {
          for (let j = i + 1; j < drips.length; j++) {
            const A = drips[i],
              B = drips[j];
            const dx = A.x - B.x,
              dy = A.y - B.y;
            const touch = (A.r + B.r) * 0.7;
            if (dx * dx + dy * dy < touch * touch) {
              const mi = A.r * A.r,
                mj = B.r * B.r,
                m = mi + mj;
              A.x = (A.x * mi + B.x * mj) / m;
              A.y = (A.y * mi + B.y * mj) / m;
              A.vy = (A.vy * mi + B.vy * mj) / m;
              A.r = Math.sqrt(m);
              A.a = Math.max(A.a, B.a);
              A.maxRun += B.maxRun * 0.5; // слипшаяся бежит дальше
              drips.splice(j, 1);
              j--;
            }
          }
        }
      }
      ctx.globalCompositeOperation = "source-over";
      for (let k = drips.length - 1; k >= 0; k--) {
        const d = drips[k];
        let term = (4.0 - viscosity * 3.4) * (0.45 + d.r / dripSizeMax);
        if (term < 0.12) term = 0.12;
        d.vy += 0.08 * (0.4 + d.r / dripSizeMax); // масса тянет вниз
        d.vy *= 1 - (viscosity * 0.1) / Math.max(d.r, 0.6); // вязкое трение, сильнее для тонких
        if (d.vy > term) d.vy = term;
        if (d.vy < 0) d.vy = 0;
        const nx = d.x + (Math.random() - 0.5) * 0.4,
          ny = d.y + d.vy;
        ctx.strokeStyle = `rgba(${color},${d.a})`;
        ctx.lineWidth = d.r * 1.7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        ctx.fillStyle = `rgba(${color},${Math.min(d.a * 1.5, 0.4)})`;
        ctx.beginPath();
        ctx.arc(nx, ny, d.r, 0, 6.2832);
        ctx.fill();
        d.x = nx;
        d.y = ny;
        d.run += d.vy;
        d.a *= 0.9975;
        // засыхает: добежала свой лимит или случайно встала на медленном ходу
        if (d.run >= d.maxRun || (d.vy < 0.25 && Math.random() < 0.02 * (0.5 + viscosity))) {
          ctx.fillStyle = `rgba(${color},${Math.min(d.a * 1.7, 0.45)})`;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r * 1.05, 0, 6.2832);
          ctx.fill();
          drips.splice(k, 1);
          continue;
        }
        if (d.a < 0.02 || ny > H + 12) drips.splice(k, 1);
      }
    };

    const spray = (x: number, y: number) => {
      const MIN_R = minRadiusCm * CM;
      ctx.globalCompositeOperation = "source-over";
      const sig = MIN_R / 2.4; // факел, эллипс под 45°
      const n = Math.round(nMist);
      for (let i = 0; i < n; i++) {
        const lx = g() * sig,
          ly = g() * sig * 0.55;
        const ox = lx * COS45 - ly * SIN45,
          oy = lx * SIN45 + ly * COS45;
        ctx.fillStyle = `rgba(${color},${(0.01 + Math.random() * 0.04) * density})`;
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, 0.4 + Math.random() * dotMax, 0, 6.2832);
        ctx.fill();
      }
      const csig = MIN_R * 0.22; // плотное ядро
      const cn = Math.round(n * 0.29);
      for (let j = 0; j < cn; j++) {
        const lx2 = g() * csig,
          ly2 = g() * csig * 0.55;
        const ox2 = lx2 * COS45 - ly2 * SIN45,
          oy2 = lx2 * SIN45 + ly2 * COS45;
        ctx.fillStyle = `rgba(${color},${(0.05 + Math.random() * 0.09) * density})`;
        ctx.beginPath();
        ctx.arc(x + ox2, y + oy2, 0.6 + Math.random() * dotMax, 0, 6.2832);
        ctx.fill();
      }
    };

    const stamp = (p: number) => {
      const MIN_R = minRadiusCm * CM;
      const yy = (p * vScale) % H; // <1 — проходы перекрываются, поток ровнее
      const xx = MIN_R * 0.6 + (W - MIN_R * 1.2) * (0.5 + 0.5 * Math.sin(p * freq));
      spray(xx, yy);
      // капли — больше на краях синуса и в застое, но и в середине ненулевой шанс
      const slope = Math.abs(Math.cos(p * freq));
      const w = Math.max(0.12, 1 - edgeBias + edgeBias * (1 - slope));
      if (Math.random() < dripRate * w) addDrip(xx, yy);
    };

    let raf = 0;
    const frame = () => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0,0,0,${fade})`;
      ctx.fillRect(0, 0, W, H);

      if (autoDraw) target += adv * 3; // тюнинг без скролла
      if (acc >= step) {
        target += acc * adv;
        acc = 0;
      }
      let budget = 8;
      while (prog < target && budget > 0) {
        const s = Math.min(2, target - prog, budget);
        prog += s;
        budget -= s;
        stamp(prog);
      }
      stepDrips();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      window.removeEventListener("scroll", onScroll);
    };
  }, [
    color,
    fade,
    minRadiusCm,
    nMist,
    dotMax,
    density,
    step,
    adv,
    freq,
    vScale,
    dripRate,
    dripSizeMin,
    dripSizeMax,
    viscosity,
    runMax,
    edgeBias,
    maxDrips,
    coalesce,
    autoDraw,
  ]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        filter: blur ? `blur(${blur}px)` : undefined,
        zIndex,
      }}
    />
  );
}

"use client";

/* ─────────────────────────────────────────────────────────────────
 * NeuralWeb — генеративная структура из светящихся узлов и связей:
 * нейросеть / карта созвездий / системная архитектура. Canvas 2D,
 * медленное вращение + параллакс от курсора + бегущие сигналы.
 * prefers-reduced-motion → статичный кадр.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

export default function NeuralWeb({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    const resize = () => {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Узлы: фибоначчи-сфера с джиттером радиуса → «созвездие», не шар
    const N = 78;
    const nodes = Array.from({ length: N }).map((_, i) => {
      const t = (i + 0.5) / N;
      const incl = Math.acos(1 - 2 * t);
      const az = Math.PI * (1 + Math.sqrt(5)) * i;
      const jr = 0.74 + 0.42 * Math.pow(Math.random(), 2);
      return {
        x: Math.sin(incl) * Math.cos(az) * jr,
        y: Math.cos(incl) * jr * 0.8,
        z: Math.sin(incl) * Math.sin(az) * jr,
        r: 1 + Math.random() * 1.3,
        hub: false,
        ph: Math.random() * Math.PI * 2,
      };
    });
    for (let i = 0; i < 6; i++) {
      const n = nodes[Math.floor((i + 0.37) * (N / 6))];
      n.hub = true;
      n.r = 2.4 + Math.random() * 0.8;
    }

    // Рёбра: 2 ближайших соседа (хабы — 5) в 3D
    const edges: Array<[number, number]> = [];
    const has = new Set<string>();
    for (let i = 0; i < N; i++) {
      const dists = nodes
        .map((m, j) => ({
          j,
          d:
            j === i
              ? 1e9
              : (nodes[i].x - m.x) ** 2 + (nodes[i].y - m.y) ** 2 + (nodes[i].z - m.z) ** 2,
        }))
        .sort((a, b) => a.d - b.d);
      const k = nodes[i].hub ? 5 : 2;
      for (let m = 0; m < k; m++) {
        const j = dists[m].j;
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!has.has(key)) {
          has.add(key);
          edges.push([i, j]);
        }
      }
    }

    let mx = 0;
    let my = 0;
    const onMove = (e: MouseEvent) => {
      const b = canvas.getBoundingClientRect();
      mx = ((e.clientX - b.left) / Math.max(b.width, 1) - 0.5) * 2;
      my = ((e.clientY - b.top) / Math.max(b.height, 1) - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let raf = 0;

    const frame = () => {
      const t = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      const ay = t * 0.1 + mx * 0.35;
      const ax = Math.sin(t * 0.06) * 0.16 + my * 0.22;
      const R = Math.min(W, H) * 0.46;
      const cx = W / 2;
      const cy = H / 2;

      const P = nodes.map((n) => {
        const x1 = n.x * Math.cos(ay) + n.z * Math.sin(ay);
        const z1 = -n.x * Math.sin(ay) + n.z * Math.cos(ay);
        const y1 = n.y * Math.cos(ax) - z1 * Math.sin(ax);
        const z2 = n.y * Math.sin(ax) + z1 * Math.cos(ax);
        const s = 1 / (1.95 - z2);
        return { sx: cx + x1 * R * s, sy: cy + y1 * R * s, z: z2, s };
      });

      for (const [i, j] of edges) {
        const a = P[i];
        const b = P[j];
        const al = 0.07 + 0.14 * ((a.z + b.z) / 2 + 1);
        ctx.strokeStyle = `rgba(166,255,0,${al.toFixed(3)})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
      }

      // Бегущие сигналы по рёбрам
      for (let s = 0; s < 4; s++) {
        const e = edges[(s * 31 + Math.floor(t * 0.4) * 17) % edges.length];
        const k = (t * (0.3 + s * 0.09)) % 1;
        const a = P[e[0]];
        const b = P[e[1]];
        ctx.fillStyle = "rgba(200,255,120,0.9)";
        ctx.beginPath();
        ctx.arc(a.sx + (b.sx - a.sx) * k, a.sy + (b.sy - a.sy) * k, 1.3, 0, 7);
        ctx.fill();
      }

      // Узлы: хабы пульсируют и светятся
      nodes.forEach((n, i) => {
        const p = P[i];
        const pulse = 0.6 + 0.4 * Math.sin(t * 1.3 + n.ph);
        const r = Math.max(n.r * p.s, 0.4);
        if (n.hub) {
          const g = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, r * 7);
          g.addColorStop(0, `rgba(166,255,0,${(0.4 * pulse).toFixed(3)})`);
          g.addColorStop(1, "rgba(166,255,0,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, r * 7, 0, 7);
          ctx.fill();
        }
        const al = 0.3 + 0.55 * ((p.z + 1) / 2);
        ctx.fillStyle = n.hub
          ? `rgba(225,255,170,${(0.7 + 0.3 * pulse).toFixed(3)})`
          : `rgba(190,235,120,${al.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, 7);
        ctx.fill();
      });

      if (!reduced) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}

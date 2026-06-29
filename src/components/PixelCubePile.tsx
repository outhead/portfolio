"use client";

/* ─────────────────────────────────────────────────────────────────
 * PixelCubePile — кубы падают В ОБЪЁМЕ (настоящая 3D-сцена).
 * Собственная лёгкая 3D-физика: гравитация, пол/стенки коробки,
 * коллизии кубов сферо-аппроксимацией, ориентация кватернионами —
 * кубы кувыркаются при падении и копятся с глубиной, затем замирают.
 *
 * Рендер: камера с перспективой проецирует 8 вершин каждого куба,
 * грани с flat-shading и знаком, дальние кубы мельче/тусклее (глубина).
 * Вся сцена рисуется в хайрес-буфер и сэмплится бокс-фильтром в дот-
 * сетку — тот же пиксельный язык, что у вращающихся кубов.
 *
 * Появляются на ховере, на уходе курсора — пол убирается, утекают.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

type V3 = [number, number, number];
type Q = [number, number, number, number]; // x,y,z,w

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => { const m = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / m, a[1] / m, a[2] / m]; };

function qNorm(q: Q): Q { const m = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0] / m, q[1] / m, q[2] / m, q[3] / m]; }
function qRot(q: Q, v: V3): V3 {
  const u: V3 = [q[0], q[1], q[2]];
  const t = cross(u, v).map((x) => x * 2) as V3;
  return add(add(v, t.map((x) => x * q[3]) as V3), cross(u, t));
}
// интеграция кватерниона угловой скоростью w за dt
function qIntegrate(q: Q, w: V3, dt: number): Q {
  const wq: Q = [w[0] * dt * 0.5, w[1] * dt * 0.5, w[2] * dt * 0.5, 0];
  // dq = wq ⊗ q
  const dq: Q = [
    wq[3] * q[0] + wq[0] * q[3] + wq[1] * q[2] - wq[2] * q[1],
    wq[3] * q[1] - wq[0] * q[2] + wq[1] * q[3] + wq[2] * q[0],
    wq[3] * q[2] + wq[0] * q[1] - wq[1] * q[0] + wq[2] * q[3],
    wq[3] * q[3] - wq[0] * q[0] - wq[1] * q[1] - wq[2] * q[2],
  ];
  return qNorm([q[0] + dq[0], q[1] + dq[1], q[2] + dq[2], q[3] + dq[3]]);
}
function qAxis(axis: V3, ang: number): Q {
  const h = ang / 2, s = Math.sin(h);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(h)];
}
// ориентация покоя: только наклон вперёд (pitch) — лево-право симметрично,
// куб смотрится строго по центру, смайл на передней грани читается
const Q_IDLE: Q = qAxis([1, 0, 0], -0.42);
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// геометрия куба (полусторона S)
const S = 0.42;
const CV: V3[] = [
  [-S, -S, -S], [S, -S, -S], [S, S, -S], [-S, S, -S],
  [-S, -S, S], [S, -S, S], [S, S, S], [-S, S, S],
];
const CF: { idx: [number, number, number, number]; n: V3 }[] = [
  { idx: [4, 5, 6, 7], n: [0, 0, 1] },
  { idx: [1, 0, 3, 2], n: [0, 0, -1] },
  { idx: [5, 1, 2, 6], n: [1, 0, 0] },
  { idx: [0, 4, 7, 3], n: [-1, 0, 0] },
  { idx: [7, 6, 2, 3], n: [0, 1, 0] },
  { idx: [0, 1, 5, 4], n: [0, -1, 0] },
];

interface Body3 { p: V3; v: V3; q: Q; w: V3; col: [number, number, number]; center: boolean; frozen: boolean; }

export default function PixelCubePile({
  color = "#FF2436",
  colors,
  logoSrc,
  grid = 124,
  pitch,
  maxCubes,
  idleCenter = false,
  centerFrac = 0.5,
}: {
  color?: string;
  /** Палитра: каждый куб берёт случайный цвет. Перебивает `color`. */
  colors?: string[];
  logoSrc?: string;
  grid?: number;
  /** Физический шаг точки (CSS px на ячейку). Если задан — число колонок
   *  считается из ширины, и детализация одинакова на любой карточке.
   *  Перебивает `grid`. */
  pitch?: number;
  /** Переопределить макс. число кубов (напр. для лёгких превью-плиток). */
  maxCubes?: number;
  /** В покое один куб подвешен по центру; на ховере он падает и начинается
   *  засыпание; после ухода курсора все утекают и сверху падает новый
   *  центральный куб, застывающий по центру. */
  idleCenter?: boolean;
  /** Вертикаль подвеса idle-куба: доля высоты кадра (0.5 = центр,
   *  0.4 = чуть выше — когда внизу карточки лежит тайтл). */
  centerFrac?: number;
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

    const palette = (colors && colors.length ? colors : [color]).map(hexToRgb);
    const [br, bg, bb] = palette[0]; // база для погашенных диодов фона
    const lightW = norm([-0.4, 0.78, 0.5]); // свет сверху-слева-фронта

    // белый знак
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

    // буферы
    const buf = document.createElement("canvas");
    const bctx = buf.getContext("2d", { willReadFrequently: true })!;
    const lo = document.createElement("canvas");
    const loctx = lo.getContext("2d", { willReadFrequently: true })!;

    // ── Коробка (мир) ──
    let HX = 2.3;              // полуширина — пересчитывается в measure() под аспект
    const HZ = 1.25;           // полуглубина
    const FLOOR = -0.35;       // y пола (ниже — насыпь садится ниже в кадре)
    const G = 30;              // тяжелее — кубы падают резко, без «парения»
    const REST = 0.32, LIN_DAMP = 0.06, ANG_DAMP = 0.55, FLOOR_FRIC = 0.82; // почти нет воздушного демпфа — настоящее падение
    const RAD = S * 1.06;      // радиус сферы для коллизий кубов

    // ── Камера ──
    const lookAt: V3 = [0, 0.85, 0];
    const camC: V3 = [0, 2.5, 5.2];
    const camZ = norm(sub(camC, lookAt));       // ось «назад»
    const camR = norm(cross([0, 1, 0], camZ));  // право
    const camU = cross(camZ, camR);             // верх

    let W = 0, H = 0, outW = 0, outH = 0, dpr = 1;
    let GX = grid; // колонок дот-сетки; при `pitch` пересчитывается в measure()
    let Sx = 0, Sy = 0, gridY = 0, focal = 0, cxp = 0, cyp = 0;
    let cellSize = 0, rDot = 0;
    let CENTER_Y = 0.6; // мировая высота подвеса — вычисляется под центр кадра
    const bgDots = document.createElement("canvas"); // кэш погашенных диодов
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const maxN = maxCubes ?? (mobile ? 30 : 45);

    const measure = () => {
      const r = wrap.getBoundingClientRect();
      W = Math.max(40, r.width); H = Math.max(40, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      outW = Math.round(W * dpr); outH = Math.round(H * dpr);
      canvas.width = outW; canvas.height = outH;
      // CSS-размер канваса НЕ задаём инлайном: на html стоит zoom:1.25, и
      // getBoundingClientRect возвращает уже умноженные на zoom пиксели —
      // инлайн-ширина из ректа раздувала канвас на 25% (куб уезжал
      // вправо-вниз за обрез). Классы w-full/h-full держат точный размер.
      Sx = Math.min(660, Math.max(380, Math.round(W * 0.9)));
      Sy = Math.round(Sx * H / W);
      buf.width = Sx; buf.height = Sy;
      GX = pitch ? Math.max(40, Math.round(W / pitch)) : grid;
      gridY = Math.max(8, Math.round(GX * H / W));
      lo.width = GX; lo.height = gridY;
      // Масштаб куба нормируем от высоты кадра (Sy*1.64 ≡ Sx*0.92 при 16:9):
      // на широких карточках куб не разрастается, видимый размер одинаковый
      // во всех плитках. Sx-кап — для портретных пропорций.
      focal = Math.min(Sx * 0.92, Sy * 1.64);
      cxp = Sx / 2; cyp = Sy * 0.42;
      // Стенки коробки растягиваем под видимую ширину кадра — насыпь
      // на ховере заполняет широкие карточки до краёв, а не центр.
      HX = Math.max(1.6, (Sx * 0.5) * 5.45 / focal * 0.78);
      // высота подвеса, проецирующаяся в `centerFrac` высоты кадра (бинпоиск)
      {
        let loY = -1, hiY = 3;
        for (let it = 0; it < 32; it++) {
          const mid = (loY + hiY) / 2;
          const d: V3 = [-camC[0], mid - camC[1], -camC[2]];
          const vy = dot(d, camU);
          const front = Math.max(0.05, -dot(d, camZ));
          const sy = cyp - vy * focal / front;
          if (sy > Sy * centerFrac) loY = mid; else hiY = mid; // ниже цели → поднять
        }
        CENTER_Y = (loY + hiY) / 2;
      }
      cellSize = outW / GX;
      rDot = cellSize * 0.28;
      // кэш фоновой сетки погашенных диодов (статична — рисуем один раз)
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

    // мир→экран(буфер). Возвращает [sx,sy,depth] (depth = расстояние перед камерой)
    const project = (P: V3): [number, number, number] => {
      const d = sub(P, camC);
      const vx = dot(d, camR), vy = dot(d, camU), vz = dot(d, camZ); // vz>0 — позади камеры
      const front = -vz; // перед камерой положителен
      const inv = focal / Math.max(0.05, front);
      return [cxp + vx * inv, cyp - vy * inv, front];
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

    const drawCube = (b: Body3) => {
      const worldV = CV.map((lv) => add(b.p, qRot(b.q, lv)));
      const pv = worldV.map(project);
      // грани, видимые камере, по убыванию глубины
      // у подвешенного куба грани подсвечены ровнее — весь силуэт горит,
      // и куб (центрально-симметричный) читается строго по центру при вращении
      const amb = b.frozen ? 0.62 : 0.3, dif = b.frozen ? 0.42 : 1.0;
      const faces = CF.map((f, i) => {
        const wn = qRot(b.q, f.n);
        const facing = dot(wn, camZ); // camZ к камере; >0 — грань к нам
        const cen = f.idx.reduce((a, k) => add(a, worldV[k]), [0, 0, 0] as V3).map((x) => x / 4) as V3;
        const depth = project(cen)[2];
        const lam = Math.max(0, dot(wn, lightW));
        return { i, facing, depth, shade: Math.min(1, amb + dif * lam) };
      }).filter((f) => f.facing > 0).sort((a, b2) => b2.depth - a.depth);

      for (const f of faces) {
        const face = CF[f.i];
        const p = face.idx.map((k) => pv[k]);
        bctx.beginPath();
        bctx.moveTo(p[0][0], p[0][1]);
        for (let k = 1; k < 4; k++) bctx.lineTo(p[k][0], p[k][1]);
        bctx.closePath();
        bctx.fillStyle = `rgb(${Math.round(b.col[0] * f.shade)},${Math.round(b.col[1] * f.shade)},${Math.round(b.col[2] * f.shade)})`;
        bctx.fill();
        if (logoReady && f.facing > 0.12) {
          bctx.globalAlpha = Math.min(1, f.facing * 1.4);
          texTri(p[0], p[1], p[2], [0, LS], [LS, LS], [LS, 0]);
          texTri(p[0], p[2], p[3], [0, LS], [LS, 0], [0, 0]);
          bctx.globalAlpha = 1;
        }
      }
    };

    const bodies: Body3[] = [];
    let grounded = false;
    let simT = 0;
    const rndQ = (): Q => qNorm([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]);
    const rndW = (k: number): V3 => [(Math.random() - 0.5) * k, (Math.random() - 0.5) * k, (Math.random() - 0.5) * k];

    const spawn = () => {
      if (bodies.length >= maxN) return;
      bodies.push({
        // спавн у верхней кромки сетки (мировая высота линии ≈ 2.2), а не из офскрина
        p: [(Math.random() * 2 - 1) * (HX - S), 2.35 + Math.random() * 0.5, (Math.random() * 2 - 1) * (HZ - S)],
        v: [(Math.random() - 0.5) * 0.6, -1.6 - Math.random() * 0.8, (Math.random() - 0.5) * 0.4], // стартовый толчок вниз — нет ленивого «вползания»
        q: rndQ(),
        w: rndW(3.4), // заметный кувырок при падении
        col: palette[(Math.random() * palette.length) | 0],
        center: false, frozen: false,
      });
    };
    // подвешенный по центру куб (в покое)
    const addIdleCenter = () => {
      bodies.push({ p: [0, CENTER_Y, 0], v: [0, 0, 0], q: Q_IDLE, w: [0, 0, 0], col: palette[0], center: true, frozen: true });
    };
    // новый центральный куб падает сверху и застывает по центру
    const dropCenter = () => {
      bodies.push({ p: [0, 2.7, 0], v: [0, 0, 0], q: rndQ(), w: rndW(1.2), col: palette[0], center: true, frozen: false });
    };
    if (idleCenter) addIdleCenter();

    const step = (dt: number) => {
      for (const b of bodies) {
        // подвешенный центральный куб: бобинг + плавное вращение «как обычно».
        // Центроид на x=0 → горизонтально по центру; высота — ровно центр кадра.
        if (b.frozen) {
          b.p = [0, CENTER_Y + Math.sin(simT * 1.6) * 0.05, 0];
          b.q = qIntegrate(b.q, [0.42, 1.15, 0], dt);
          continue;
        }
        b.v[1] -= G * dt;
        b.p = add(b.p, b.v.map((x) => x * dt) as V3);
        const ld = Math.max(0, 1 - LIN_DAMP * dt);
        b.v = b.v.map((x) => x * ld) as V3;
        const adf = Math.max(0, 1 - ANG_DAMP * dt);
        b.w = b.w.map((x) => x * adf) as V3;
        b.q = qIntegrate(b.q, b.w, dt);

        // ищущий центральный куб: падает сверху и застывает по центру
        if (b.center && b.p[1] <= CENTER_Y && b.v[1] <= 0) {
          b.p = [0, CENTER_Y, 0]; b.v = [0, 0, 0]; b.w = [0, 0, 0]; b.q = Q_IDLE; b.frozen = true;
          continue;
        }

        // стенки
        if (b.p[0] < -HX + S) { b.p[0] = -HX + S; b.v[0] = Math.abs(b.v[0]) * REST; }
        if (b.p[0] > HX - S) { b.p[0] = HX - S; b.v[0] = -Math.abs(b.v[0]) * REST; }
        if (b.p[2] < -HZ + S) { b.p[2] = -HZ + S; b.v[2] = Math.abs(b.v[2]) * REST; }
        if (b.p[2] > HZ - S) { b.p[2] = HZ - S; b.v[2] = -Math.abs(b.v[2]) * REST; }
        // пол
        if (grounded && b.p[1] < FLOOR + S) {
          b.p[1] = FLOOR + S;
          b.v[1] = -b.v[1] * REST;
          b.v[0] *= FLOOR_FRIC; b.v[2] *= FLOOR_FRIC;
          b.w = b.w.map((x) => x * 0.7) as V3;
        }
        // righting: на низкой скорости куб стремится лечь на плоскую грань
        const speed = Math.hypot(b.v[0], b.v[1], b.v[2]);
        if (grounded && b.p[1] < FLOOR + S + 0.25 && speed < 1.5) {
          const ex = qRot(b.q, [1, 0, 0]), ey = qRot(b.q, [0, 1, 0]), ez = qRot(b.q, [0, 0, 1]);
          let up: V3 = [0, 1, 0], bestAbs = -1;
          for (const e of [ex, ey, ez]) for (const s of [1, -1]) {
            const vy = e[1] * s;
            if (Math.abs(vy) > bestAbs) { bestAbs = Math.abs(vy); up = [e[0] * s, e[1] * s, e[2] * s]; }
          }
          const corr = cross(up, [0, 1, 0]); // ось выправления, |corr| ~ sin(угла наклона)
          b.w = [b.w[0] + corr[0] * 9 * dt * 6, b.w[1] + corr[1] * 9 * dt * 6, b.w[2] + corr[2] * 9 * dt * 6];
        }
      }
      // коллизии кубов (сферо-аппроксимация) — несколько итераций релаксации,
      // чтобы быстрые/плотные кубы не проходили друг сквозь друга
      const min = RAD * 2;
      for (let it = 0; it < 3; it++) {
        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) {
            const a = bodies[i], c = bodies[j];
            if (a.frozen || c.frozen) continue; // подвешенный куб не толкаем
            const dvec = sub(c.p, a.p);
            let dist = Math.hypot(dvec[0], dvec[1], dvec[2]);
            if (dist >= min) continue;
            if (dist < 1e-4) dist = 1e-4;
            const n = dvec.map((x) => x / dist) as V3;
            const push = (min - dist) * 0.5;
            a.p = sub(a.p, n.map((x) => x * push) as V3);
            c.p = add(c.p, n.map((x) => x * push) as V3);
            if (it === 0) {
              // импульс скорости только в первом проходе
              const va = dot(a.v, n), vc = dot(c.v, n);
              const da = (vc - va) * (1 + REST) * 0.5;
              a.v = add(a.v, n.map((x) => x * da) as V3);
              c.v = sub(c.v, n.map((x) => x * da) as V3);
              a.w = a.w.map((x) => x * 0.85) as V3;
              c.w = c.w.map((x) => x * 0.85) as V3;
            }
          }
        }
      }
      // подмести улетевшие вниз (когда пол убран)
      for (let i = bodies.length - 1; i >= 0; i--) {
        if (bodies[i].p[1] < -6) bodies.splice(i, 1);
      }
    };

    let raf = 0, last = performance.now(), spawnAcc = 0;
    const frame = (now: number) => {
      let dt = (now - last) / 1000; last = now;
      dt = Math.min(0.033, dt);
      simT += dt;
      // спавн на ховере
      if (hoverRef.current && bodies.length < maxN) {
        spawnAcc += dt;
        if (spawnAcc > 0.04) { spawnAcc = 0; spawn(); }
      }
      // под-шаги физики для устойчивости (важно при высокой гравитации/плотности)
      const sub2 = 7;
      for (let k = 0; k < sub2; k++) step(dt / sub2);

      // рендер сцены в буфер
      bctx.clearRect(0, 0, Sx, Sy);
      const sorted = [...bodies].sort((a, b) => project(b.p)[2] - project(a.p)[2]); // дальние первыми
      for (const b of sorted) drawCube(b);

      // даунскейл → точки
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, outW, outH);
      ctx.drawImage(bgDots, 0, 0); // статичный фон погашенных диодов — кэш
      loctx.clearRect(0, 0, GX, gridY);
      loctx.imageSmoothingEnabled = true;
      loctx.drawImage(buf, 0, 0, Sx, Sy, 0, 0, GX, gridY);
      const data = loctx.getImageData(0, 0, GX, gridY).data;
      for (let gy = 0; gy < gridY; gy++) {
        for (let gx = 0; gx < GX; gx++) {
          const o = (gy * GX + gx) * 4;
          const aa = data[o + 3];
          if (aa < 20) continue; // погашенные — уже в фоне
          const rr = data[o], gg = data[o + 1], bbb = data[o + 2];
          const a = aa / 255;
          const mx = Math.max(rr, gg, bbb) / 255;
          ctx.beginPath();
          ctx.arc((gx + 0.5) * cellSize, (gy + 0.5) * cellSize, rDot, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rr},${gg},${bbb},${(0.34 + 0.66 * mx) * (0.55 + 0.45 * a)})`;
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const activate = () => {
      hoverRef.current = true; grounded = true;
      // отпускаем подвешенный/ищущий центральный куб — он падает вместе со всеми
      for (const b of bodies) {
        if (b.center || b.frozen) { b.center = false; b.frozen = false; b.v = [0, -1.4, 0]; b.w = rndW(3.4); }
      }
    };
    const deactivate = () => {
      hoverRef.current = false; grounded = false; // пол убран — все утекают
      // сверху падает новый центральный куб и застывает по центру
      if (idleCenter && !bodies.some((b) => b.center)) dropCenter();
    };
    const onEnter = () => activate();
    const onLeave = () => deactivate();
    wrap.addEventListener("mouseenter", onEnter);
    wrap.addEventListener("mouseleave", onLeave);
    const isTouch = window.matchMedia("(hover: none)").matches;
    let io: IntersectionObserver | null = null;
    if (isTouch && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? activate() : deactivate())),
        { rootMargin: "-50% 0px -35% 0px", threshold: 0 });
      io.observe(wrap);
    }
    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    // пауза рендера, когда карточка вне вьюпорта — несколько канвасов на
    // главной не жгут CPU одновременно
    let rafRunning = true;
    const visIO = new IntersectionObserver((es) => {
      const vis = es[0].isIntersecting;
      if (vis && !rafRunning) { rafRunning = true; last = performance.now(); raf = requestAnimationFrame(frame); }
      else if (!vis && rafRunning) { rafRunning = false; cancelAnimationFrame(raf); }
    }, { threshold: 0 });
    visIO.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      wrap.removeEventListener("mouseenter", onEnter);
      wrap.removeEventListener("mouseleave", onLeave);
      io?.disconnect();
      visIO.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [color, colors, logoSrc, grid, pitch, maxCubes, idleCenter, centerFrac]);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

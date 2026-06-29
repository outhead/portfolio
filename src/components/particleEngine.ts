/* ─────────────────────────────────────────────────────────────────
 * ParticleEngine — физика + рендер облака частиц, независимо от среды.
 * Работает с любым 2D-контекстом: обычным (main thread, fallback) и
 * OffscreenCanvasRenderingContext2D (в Web Worker). Сам владеет циклом
 * (requestAnimationFrame есть и в Window, и в DedicatedWorker; для
 * совсем старых сред — setTimeout-фолбэк).
 *
 * Хост (компонент или воркер-обёртка) только:
 *  - строит формы (декод картинок) и отдаёт setShape();
 *  - проксирует события: setPointer / setActive / setForce / setSize / setPaused.
 * Оптимизации: фриз в покое, грязный прямоугольник, снап-деадзона, кап DPR.
 * ──────────────────────────────────────────────────────────────── */

export type EngineShape = {
  X: Float32Array; Y: Float32Array; Z: Float32Array; b: Float32Array; aspect: number;
};

export type EngineConfig = {
  N: number;
  color: [number, number, number];
  brightness: number;
  bulge: number;
  tilt: number;
  pointScale: number;
  assembleOnHover: boolean;
  scatterOnHover: boolean;
  latchAssemble: boolean;
  autoSpin: boolean;
  spin360: boolean;
  reduce: boolean;
  shapeCount: number;
};

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const RAF = (cb: (t: number) => void): number =>
  typeof requestAnimationFrame === "function"
    ? requestAnimationFrame(cb)
    : (setTimeout(() => cb(Date.now()), 16) as unknown as number);
const CAF = (id: number): void => {
  if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(id);
  else clearTimeout(id);
};

export class ParticleEngine {
  private ctx: Ctx2D;
  private cfg: EngineConfig;
  private N: number;
  private K = 3.6;
  private DAMP = 3.4;
  private fLen = 2.4;
  private continuous: boolean;

  private data: (EngineShape | null)[];

  private px: Float32Array; private py: Float32Array; private pz: Float32Array;
  private vx: Float32Array; private vy: Float32Array; private vz: Float32Array;
  private sX: Float32Array; private sY: Float32Array; private sZ: Float32Array; private sPe: Float32Array;
  private hX: Float32Array; private hY: Float32Array; private hZ: Float32Array;

  private dpr = 1; private cssW = 1; private cssH = 1;
  private scale = 1; private cx = 0; private cy = 0; private curAspect = 1.25;
  private W2 = 1; private H2 = 1;
  private imgData: ImageData | null = null;
  private buf32: Uint32Array | null = null;
  private needResize = false;

  private nrx = 0; private nry = 0; private tnx = 0; private tny = 0;
  private hoverT = 0; private assemble = 0; private spin = 0;
  private everHovered = false;
  private activeIdx = 0;
  private force = false;

  private raf = 0; private stopped = false; private paused = false; private idle = false;
  private lt = 0;
  private pDirty: [number, number, number, number] | null = null;

  constructor(ctx: Ctx2D, cfg: EngineConfig) {
    this.ctx = ctx;
    this.cfg = cfg;
    this.N = cfg.N;
    this.continuous = cfg.autoSpin || cfg.spin360;
    this.data = new Array(Math.max(1, cfg.shapeCount)).fill(null);
    const N = this.N;
    this.px = new Float32Array(N); this.py = new Float32Array(N); this.pz = new Float32Array(N);
    this.vx = new Float32Array(N); this.vy = new Float32Array(N); this.vz = new Float32Array(N);
    this.sX = new Float32Array(N); this.sY = new Float32Array(N); this.sZ = new Float32Array(N); this.sPe = new Float32Array(N);
    this.hX = new Float32Array(N); this.hY = new Float32Array(N); this.hZ = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, rr = 0.5 + Math.random() * 0.45;
      this.hX[i] = Math.cos(a) * rr; this.hY[i] = (Math.random() - 0.5) * 1.6; this.hZ[i] = Math.sin(a) * rr;
      this.px[i] = this.hX[i]; this.py[i] = this.hY[i]; this.pz[i] = this.hZ[i];
    }
  }

  setShape(idx: number, shape: EngineShape) {
    if (idx >= 0 && idx < this.data.length) this.data[idx] = shape;
    this.wake();
  }
  setActive(i: number) { this.activeIdx = i | 0; this.wake(); }
  setForce(v: boolean) { this.force = !!v; this.wake(); }
  setPointer(nx: number, ny: number, hover: boolean) {
    this.tnx = nx; this.tny = ny; this.hoverT = hover ? 1 : 0; this.wake();
  }
  setSize(cssW: number, cssH: number, dpr: number) {
    this.cssW = Math.max(1, cssW); this.cssH = Math.max(1, cssH);
    this.dpr = Math.min(dpr || 1, 1.5);
    this.needResize = true; this.wake();
  }
  setPaused(p: boolean) {
    this.paused = p;
    if (p) { if (this.raf) { CAF(this.raf); this.raf = 0; } }
    else this.wake();
  }
  dispose() { this.stopped = true; if (this.raf) { CAF(this.raf); this.raf = 0; } }

  private computeScale() {
    this.scale = Math.min(this.cssW, this.cssH / this.curAspect) * 0.95 * this.dpr;
    this.cx = this.W2 / 2; this.cy = this.H2 / 2;
  }
  private resize() {
    this.W2 = Math.round(this.cssW * this.dpr);
    this.H2 = Math.round(this.cssH * this.dpr);
    const cv = this.ctx.canvas as { width: number; height: number };
    cv.width = this.W2; cv.height = this.H2;
    this.imgData = this.ctx.createImageData(this.W2, this.H2);
    this.buf32 = new Uint32Array(this.imgData.data.buffer);
    this.computeScale();
  }
  private tick() {
    if (this.stopped || this.paused || this.raf) return;
    this.lt = (typeof performance !== "undefined" ? performance.now() : Date.now());
    this.raf = RAF(this.loop);
  }
  private wake() { this.idle = false; this.tick(); }

  private loop = (now: number) => {
    this.raf = 0;
    if (this.stopped || this.paused) return;
    let dt = (now - this.lt) / 1000; this.lt = now;
    if (dt > 0.05) dt = 0.05;
    if (this.needResize) { this.resize(); this.needResize = false; this.pDirty = null; }

    let ai = this.activeIdx | 0;
    if (ai < 0) ai = 0; if (ai >= this.data.length) ai = this.data.length - 1;
    let s = this.data[ai];
    if (!s) { for (let k = 0; k < this.data.length; k++) if (this.data[k]) { s = this.data[k]; break; } }
    if (!s || !this.buf32 || !this.imgData) { this.raf = RAF(this.loop); return; }

    const cfg = this.cfg;
    const N = this.N, W2 = this.W2, H2 = this.H2;
    const buf32 = this.buf32;

    this.curAspect += (s.aspect - this.curAspect) * Math.min(1, dt * 4);
    this.computeScale();

    if (this.hoverT > 0) this.everHovered = true;
    const target = this.force
      ? 1
      : cfg.scatterOnHover
      ? 1 - this.hoverT
      : cfg.assembleOnHover
        ? (cfg.latchAssemble && this.everHovered ? 1 : this.hoverT)
        : 1;
    this.assemble += (target - this.assemble) * Math.min(1, dt * 1.8);
    if (cfg.reduce) this.assemble = target;
    const asmE = this.assemble * this.assemble * (3 - 2 * this.assemble);

    this.nrx += (this.tnx - this.nrx) * 0.06; this.nry += (this.tny - this.nry) * 0.06;
    this.spin += dt * 0.2;
    const auto = cfg.autoSpin ? Math.sin(this.spin * 0.6) * 0.55 : 0;
    const turn = cfg.spin360 ? this.spin * 0.5 : 0;
    const yaw = (1 - asmE) * this.spin + asmE * (this.nrx * cfg.tilt + auto + turn) + Math.sin(this.spin) * 0.06 * (1 - asmE);
    const pitch = asmE * (-this.nry * cfg.tilt);
    const sYa = Math.sin(yaw), cYa = Math.cos(yaw), sPi = Math.sin(pitch), cPi = Math.cos(pitch);

    const px = this.px, py = this.py, pz = this.pz, vx = this.vx, vy = this.vy, vz = this.vz;
    const hX = this.hX, hY = this.hY, hZ = this.hZ;
    const sXa = this.sX, sYa2 = this.sY, sZa = this.sZ, sPe = this.sPe;
    const sX0 = s.X, sY0 = s.Y, sZ0 = s.Z;
    const K = this.K, DAMP = this.DAMP, fLen = this.fLen;
    let maxErr2 = 0, maxV2 = 0;
    for (let i = 0; i < N; i++) {
      const tx = hX[i] + (sX0[i] - hX[i]) * asmE;
      const ty = hY[i] + (sY0[i] - hY[i]) * asmE;
      const tz = hZ[i] + (sZ0[i] - hZ[i]) * asmE;
      const ex = tx - px[i], ey = ty - py[i], ez = tz - pz[i];
      vx[i] += (ex * K - vx[i] * DAMP) * dt;
      vy[i] += (ey * K - vy[i] * DAMP) * dt;
      vz[i] += (ez * K - vz[i] * DAMP) * dt;
      px[i] += vx[i] * dt; py[i] += vy[i] * dt; pz[i] += vz[i] * dt;
      const e2 = ex * ex + ey * ey + ez * ez;
      const v2 = vx[i] * vx[i] + vy[i] * vy[i] + vz[i] * vz[i];
      if (e2 > maxErr2) maxErr2 = e2;
      if (v2 > maxV2) maxV2 = v2;
      if (e2 < 1e-6 && v2 < 1e-6) { px[i] = tx; py[i] = ty; pz[i] = tz; vx[i] = 0; vy[i] = 0; vz[i] = 0; }
    }

    const cx = this.cx, cy = this.cy, scale = this.scale;
    for (let i = 0; i < N; i++) {
      const x1 = cYa * px[i] + sYa * pz[i];
      const z1 = -sYa * px[i] + cYa * pz[i];
      const y1 = cPi * py[i] - sPi * z1;
      const z2 = sPi * py[i] + cPi * z1;
      const per = fLen / (fLen - z2);
      sXa[i] = cx + x1 * scale * per;
      sYa2[i] = cy + y1 * scale * per;
      sZa[i] = z2; sPe[i] = per;
    }

    // грязный прямоугольник: чистим только прошлую область
    if (this.pDirty) {
      const [qx0, qy0, qx1, qy1] = this.pDirty;
      for (let yy = qy0; yy < qy1; yy++) buf32.fill(0, yy * W2 + qx0, yy * W2 + qx1);
    }
    let cMinX = W2, cMinY = H2, cMaxX = 0, cMaxY = 0;
    const dInv = 1 / (cfg.bulge * 2);
    const rgb = cfg.color[0] | (cfg.color[1] << 8) | (cfg.color[2] << 16);
    const fbA = s.b, bulge = cfg.bulge, brightness = cfg.brightness, pointScale = cfg.pointScale, dpr = this.dpr;
    for (let i = 0; i < N; i++) {
      const per = sPe[i];
      let dN = (sZa[i] + bulge) * dInv; if (dN < 0) dN = 0; else if (dN > 1) dN = 1;
      const bright = 0.45 + 0.55 * fbA[i];
      let a = (0.3 + 0.7 * (asmE * bright + (1 - asmE) * 0.45)) * (0.55 + 0.45 * dN);
      a *= brightness;
      if (a > 1) a = 1;
      if (a < 0.02) continue;
      let sz = ((0.7 + (asmE * fbA[i] + (1 - asmE) * 0.3) * 1.7) * per * (0.7 + 0.3 * dN) * dpr * pointScale) | 0;
      if (sz < 1) sz = 1; else if (sz > 6) sz = 6;
      const col = rgb | (((a * 255) | 0) << 24);
      const dx = sXa[i] | 0, dy = sYa2[i] | 0, half = sz >> 1;
      let yA = dy - half, xA = dx - half, yB = dy - half + sz, xB = dx - half + sz;
      if (yA < 0) yA = 0; if (xA < 0) xA = 0;
      if (yB > H2) yB = H2; if (xB > W2) xB = W2;
      if (xA >= xB || yA >= yB) continue;
      if (xA < cMinX) cMinX = xA; if (yA < cMinY) cMinY = yA;
      if (xB > cMaxX) cMaxX = xB; if (yB > cMaxY) cMaxY = yB;
      for (let yy = yA; yy < yB; yy++) {
        const row = yy * W2;
        for (let xx = xA; xx < xB; xx++) buf32[row + xx] = col;
      }
    }

    let uMinX = cMinX, uMinY = cMinY, uMaxX = cMaxX, uMaxY = cMaxY;
    if (this.pDirty) {
      if (this.pDirty[0] < uMinX) uMinX = this.pDirty[0];
      if (this.pDirty[1] < uMinY) uMinY = this.pDirty[1];
      if (this.pDirty[2] > uMaxX) uMaxX = this.pDirty[2];
      if (this.pDirty[3] > uMaxY) uMaxY = this.pDirty[3];
    }
    if (uMaxX > uMinX && uMaxY > uMinY) {
      this.ctx.putImageData(this.imgData, 0, 0, uMinX, uMinY, uMaxX - uMinX, uMaxY - uMinY);
    }
    this.pDirty = cMaxX > cMinX ? [cMinX, cMinY, cMaxX, cMaxY] : null;

    const settled =
      !this.continuous && this.hoverT === 0 && this.assemble > 0.999 &&
      maxV2 < 1e-6 && maxErr2 < 1e-6 &&
      Math.abs(this.nrx) < 1e-3 && Math.abs(this.nry) < 1e-3 &&
      Math.abs(this.curAspect - s.aspect) < 1e-3;
    if (settled) this.idle = true;
    else this.raf = RAF(this.loop);
  };
}

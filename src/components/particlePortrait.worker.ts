/// <reference lib="webworker" />
/* Воркер облака частиц: получает OffscreenCanvas и гоняет ParticleEngine
 * вне главного потока. Формы (декод картинок) строит главный поток и
 * присылает готовыми массивами. */
import { ParticleEngine, type EngineConfig, type EngineShape } from "./particleEngine";

let engine: ParticleEngine | null = null;

/* eslint-disable @typescript-eslint/no-explicit-any */
self.onmessage = (e: MessageEvent<any>) => {
  const m = e.data;
  switch (m?.type) {
    case "init": {
      const cv = m.canvas as OffscreenCanvas;
      const ctx = cv.getContext("2d");
      if (ctx) engine = new ParticleEngine(ctx, m.cfg as EngineConfig);
      break;
    }
    case "shape":
      engine?.setShape(m.idx, { X: m.X, Y: m.Y, Z: m.Z, b: m.b, aspect: m.aspect } as EngineShape);
      break;
    case "pointer": engine?.setPointer(m.nx, m.ny, m.hover); break;
    case "active": engine?.setActive(m.i); break;
    case "force": engine?.setForce(m.v); break;
    case "size": engine?.setSize(m.cssW, m.cssH, m.dpr); break;
    case "paused": engine?.setPaused(m.v); break;
    case "dispose": engine?.dispose(); engine = null; self.close(); break;
  }
};
/* eslint-enable @typescript-eslint/no-explicit-any */

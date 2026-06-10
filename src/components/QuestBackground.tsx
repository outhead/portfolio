"use client";

import { useEffect, useRef } from "react";

/**
 * Живой WebGL-фон для уровней квеста. Доменно-искажённый fbm («вены» + свечение),
 * БЕЗ вихря (swirl убран). Цвет — параметр палитры, чтобы уровни визуально различались.
 * Полупрозрачный, pointer-events:none, тихо живёт на фоне.
 */
type Palette = "green" | "yellow" | "red";

// mid — заливка, glow — свечение вен, hot — горячие точки (0..1 RGB)
const PALETTES: Record<Palette, { mid: [number, number, number]; glow: [number, number, number]; hot: [number, number, number] }> = {
  green:  { mid: [0.05, 0.45, 0.18], glow: [0.35, 1.0, 0.25], hot: [0.6, 1.0, 0.0] },
  yellow: { mid: [0.42, 0.34, 0.05], glow: [1.0, 0.82, 0.20], hot: [1.0, 0.62, 0.0] },
  red:    { mid: [0.45, 0.12, 0.08], glow: [1.0, 0.38, 0.24], hot: [1.0, 0.25, 0.12] },
};

const FRAG = `precision highp float;uniform vec2 r;uniform float t;uniform vec3 uMid;uniform vec3 uGlow;uniform vec3 uHot;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=h(i),b=h(i+vec2(1,0)),c=h(i+vec2(0,1)),d=h(i+vec2(1,1));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<6;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}
void main(){vec2 uv=gl_FragCoord.xy/r.xy;float asp=r.x/r.y;float tt=t*0.11;
vec2 cen=(uv-0.5)*vec2(asp,1.);
vec2 p=cen*2.2+vec2(2.0);
vec2 q=vec2(fbm(p+vec2(0.0,tt)),fbm(p+vec2(5.2,1.3)-tt));
vec2 w=vec2(fbm(p+1.8*q+vec2(1.7,9.2)+tt*1.3),fbm(p+1.8*q+vec2(8.3,2.8)-tt));
vec2 w2=vec2(fbm(p+2.2*w+tt*0.8),fbm(p+2.2*w-tt));
float f=fbm(p+3.0*w2);float veins=pow(smoothstep(0.5,0.93,f),2.0);
vec3 col=vec3(0.02,0.025,0.03);col=mix(col,uMid,smoothstep(0.25,0.92,f));
col+=uGlow*veins*0.55;col+=uHot*pow(veins,3.0)*0.5;col*=0.9+0.4*f;
gl_FragColor=vec4(col,1.);}`;

const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

export default function QuestBackground({
  palette = "green",
  opacity = 0.36,
}: { palette?: Palette; opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const g = (c.getContext("webgl") || c.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!g) return;

    const sh = (type: number, src: string) => {
      const o = g.createShader(type)!;
      g.shaderSource(o, src); g.compileShader(o); return o;
    };
    const P = g.createProgram()!;
    g.attachShader(P, sh(g.VERTEX_SHADER, VERT));
    g.attachShader(P, sh(g.FRAGMENT_SHADER, FRAG));
    g.linkProgram(P); g.useProgram(P);

    const B = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, B);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const L = g.getAttribLocation(P, "p");
    g.enableVertexAttribArray(L);
    g.vertexAttribPointer(L, 2, g.FLOAT, false, 0, 0);

    const uR = g.getUniformLocation(P, "r");
    const uT = g.getUniformLocation(P, "t");
    const pal = PALETTES[palette];
    g.uniform3fv(g.getUniformLocation(P, "uMid"), pal.mid);
    g.uniform3fv(g.getUniformLocation(P, "uGlow"), pal.glow);
    g.uniform3fv(g.getUniformLocation(P, "uHot"), pal.hot);

    const resize = () => {
      const d = Math.min(window.devicePixelRatio || 1, 1.25);
      c.width = Math.max(1, Math.floor(c.clientWidth * d));
      c.height = Math.max(1, Math.floor(c.clientHeight * d));
      g.viewport(0, 0, c.width, c.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let raf = 0;
    const frame = () => {
      g.uniform2f(uR, c.width, c.height);
      g.uniform1f(uT, (performance.now() - t0) / 1000);
      g.drawArrays(g.TRIANGLES, 0, 3);
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    frame();

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [palette]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity }}
    />
  );
}

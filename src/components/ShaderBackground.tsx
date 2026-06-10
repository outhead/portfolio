"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** тёмная база "R,G,B" */
  c0?: string;
  /** средний тон "R,G,B" */
  c1?: string;
  /** акцент "R,G,B" */
  c2?: string;
  /** скорость анимации */
  speed?: number;
  /** масштаб нойза (меньше — крупнее перетекания) */
  scale?: number;
  /** сила domain-warp */
  warp?: number;
  /** контраст */
  contrast?: number;
  /** яркость */
  brightness?: number;
  /** количество акцента */
  accent?: number;
  /** реакция на курсор/скролл (0 — выкл) */
  pointer?: number;
  zIndex?: number;
};

const rgb = (s: string) => {
  const h = s.replace("#", "");
  if (h.length === 6)
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
  return s.split(",").map((v) => +v / 255);
};

const FRAG = `precision highp float;
uniform vec2 r;uniform float t;uniform vec2 m;
uniform float scl,warp,contrast,bright,accAmt;uniform vec3 c0,c1,c2;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 float a=h(i),b=h(i+vec2(1,0)),c=h(i+vec2(0,1)),d=h(i+vec2(1,1));
 return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.02;a*=.5;}return s;}
void main(){
 vec2 uv=gl_FragCoord.xy/r.xy;
 vec2 p=uv*vec2(r.x/r.y,1.)*scl + m;
 float tt=t;
 vec2 q=vec2(fbm(p+tt),fbm(p+vec2(5.2,1.3)-tt));
 vec2 w=vec2(fbm(p+2.*q+vec2(1.7,9.2)+tt*1.3),fbm(p+2.*q+vec2(8.3,2.8)-tt));
 float f=fbm(p+warp*w);
 f=pow(clamp(f,0.,1.),contrast);
 vec3 col=mix(c0,c1,smoothstep(0.25,0.95,f));
 col=mix(col,c2,smoothstep(0.78,1.0,f)*accAmt*length(w));
 col*=bright*(0.82+0.38*f);
 gl_FragColor=vec4(col,1.);
}`;
const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

export default function ShaderBackground({
  c0 = "8,17,11",
  c1 = "13,138,46",
  c2 = "166,255,0",
  speed = 0.5,
  scale = 2.4,
  warp = 3.5,
  contrast = 1.2,
  brightness = 1,
  accent = 0.45,
  pointer = 0.3,
  zIndex = 0,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const gl = (cv.getContext("webgl") || cv.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return;

    const sh = (type: number, src: string) => {
      const o = gl.createShader(type)!;
      gl.shaderSource(o, src);
      gl.compileShader(o);
      return o;
    };
    const pr = gl.createProgram()!;
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(pr);
    gl.useProgram(pr);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const lp = gl.getAttribLocation(pr, "p");
    gl.enableVertexAttribArray(lp);
    gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);

    const U = (n: string) => gl.getUniformLocation(pr, n);
    const uR = U("r"), uT = U("t"), uM = U("m"), uScl = U("scl"), uWarp = U("warp"),
      uContrast = U("contrast"), uBright = U("bright"), uAcc = U("accAmt"),
      uC0 = U("c0"), uC1 = U("c1"), uC2 = U("c2");

    const a0 = rgb(c0), a1 = rgb(c1), a2 = rgb(c2);
    gl.uniform3f(uC0, a0[0], a0[1], a0[2]);
    gl.uniform3f(uC1, a1[0], a1[1], a1[2]);
    gl.uniform3f(uC2, a2[0], a2[1], a2[2]);
    gl.uniform1f(uScl, scale);
    gl.uniform1f(uWarp, warp);
    gl.uniform1f(uContrast, contrast);
    gl.uniform1f(uBright, brightness);
    gl.uniform1f(uAcc, accent);

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cv.width = Math.floor(cv.clientWidth * dpr);
      cv.height = Math.floor(cv.clientHeight * dpr);
      gl.viewport(0, 0, cv.width, cv.height);
    };
    size();
    window.addEventListener("resize", size);

    let mx = 0, my = 0, tmx = 0, tmy = 0;
    const onMove = (e: PointerEvent) => {
      tmx = (e.clientX / window.innerWidth - 0.5) * pointer;
      tmy = (e.clientY / window.innerHeight - 0.5) * pointer;
    };
    const onScroll = () => {
      tmy = ((window.scrollY || 0) / window.innerHeight) * pointer * 0.6;
    };
    if (pointer > 0) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    let raf = 0;
    const t0 = performance.now();
    const frame = () => {
      mx += (tmx - mx) * 0.04;
      my += (tmy - my) * 0.04;
      gl.uniform2f(uR, cv.width, cv.height);
      gl.uniform1f(uT, ((performance.now() - t0) / 1000) * speed * 0.1);
      gl.uniform2f(uM, mx, my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      gl.deleteProgram(pr);
    };
  }, [c0, c1, c2, speed, scale, warp, contrast, brightness, accent, pointer]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex }}
    />
  );
}

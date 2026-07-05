"use client";

/* ─────────────────────────────────────────────────────────────────
 * HypercubeHero — стеклянный SDF-куб для hero кейса «Гиперкуб».
 *
 * Шейдер куба портирован ОДИН-В-ОДИН из движка живого гиперкуба
 * (index.html, GLASS_FRAG): roundedBoxIntersect + roundedBoxNormal,
 * преломление по Снеллиусу (k = cosI² + eta² − 1), рёбра через
 * pc = hitPos + 0.5, и infiniteGrid — марш преломлённого луча сквозь
 * три семейства плоскостей с pow(glow, index) на глубину. Именно это
 * даёт яркий каркас, решётку тоннелем вглубь и узлы под bloom.
 *
 * Два прохода WebGL2, без three.js и без библиотек:
 *  1) сцена → FBO (тот же GLASS_FRAG),
 *  2) bloom + ACES-тонмаппинг (по числам конфига: strength 0.58,
 *     threshold 0.15, exposure 0.85).
 *
 * Взаимодействие: в покое куб вращается; по наведению камера влетает
 * ВНУТРЬ (uEnter 0→1) — кадр заполняется светящейся решёткой.
 *
 * Перф-бюджет (как в ProjectCard/DotGlobe): рендер-скейл 0.62 + DPR≤1.5,
 * FPS-кап ~40, пауза по IntersectionObserver, на reduced-motion/мобиле —
 * один статичный кадр без цикла и ховера. По нагрузке ≈ одна карточка-глобус.
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

const SCENE_FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes;
uniform float uTime;
uniform float uEnter;
uniform vec3 uColor;

const vec3 SIZE = vec3(0.5);
const float RAD = 0.02;
const float glowWidth = 0.014;
const float glow = 0.77;
const float eta = 1.01;
const float complexity = 0.0;
const float fresnelPow = 3.0;
const float edgeGlow = 1.0;

mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }

float rbi(vec3 ro, vec3 rd){
  vec3 m=1.0/rd; vec3 n=m*ro; vec3 k=abs(m)*(SIZE+RAD);
  vec3 t1=-n-k; vec3 t2=-n+k;
  float tN=max(max(t1.x,t1.y),t1.z);
  float tF=min(min(t2.x,t2.y),t2.z);
  if(tN>tF||tF<0.0) return -1.0;
  return tN>0.0?tN:tF;
}
vec3 rbn(vec3 p){ return sign(p)*normalize(max(abs(p)-SIZE+RAD,0.0)); }
float fres(vec3 rd, vec3 n){ return pow(1.0-abs(dot(rd,n)),fresnelPow); }

vec3 env(vec3 d){
  float y=d.y*0.5+0.5;
  vec3 b=mix(vec3(0.008,0.008,0.012), vec3(0.035,0.03,0.025), y);
  float key=pow(max(dot(d, normalize(vec3(0.4,0.6,0.5))),0.0), 24.0);
  return b + vec3(1.0,0.8,0.45)*key*0.8;
}

// Звёздное поле в фоне (замена GPGPU-частиц движка — дёшево, хеш-точки).
float hash21(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
vec3 starfield(vec3 dir){
  vec2 sp = vec2(atan(dir.x, dir.z), asin(clamp(dir.y, -1.0, 1.0))) * 3.5;
  vec2 c = floor(sp * 9.0);
  float h = hash21(c);
  if(h < 0.93) return vec3(0.0);
  vec2 f = fract(sp * 9.0) - 0.5;
  float s = smoothstep(0.13, 0.0, length(f)) * (0.5 + 0.5 * fract(h * 17.3));
  s *= 0.78 + 0.22 * sin(uTime * 0.9 + h * 40.0); // мягкое мерцание, не гаснет в ноль
  return vec3(0.72, 0.75, 0.85) * s * 0.6;
}

// infiniteGrid — портировано из GLASS_FRAG живого гиперкуба.
vec3 infiniteGrid(vec3 ro, vec3 rd){
  vec3 ird=1.0/rd;
  float bestV=20.0; float bestP=0.0;
  for(int axis=0;axis<3;axis++){
    vec3 ro2=axis==0?ro.zyx:(axis==1?ro.xzy:ro);
    vec3 rd2=axis==0?rd.zyx:(axis==1?rd.xzy:rd);
    vec3 ird2=axis==0?ird.zyx:(axis==1?ird.xzy:ird);
    float sz=rd2.z<0.0?-1.0:1.0;
    float d=(glowWidth-0.5-ro2.z*sz)*ird2.z*sz;
    if(d<0.0){
      vec2 xy=ro2.xy+rd2.xy*d+0.5;
      for(float i=0.0;i<16.0;i++){
        vec2 uv=fract(xy);
        float osg=1.0-glowWidth;
        if(uv.x<=glowWidth||uv.x>=osg||uv.y<=glowWidth||uv.y>=osg){
          vec2 xyi=abs(floor(xy));
          float v=max(xyi.x,xyi.y)+i;
          vec2 frame=abs(uv-0.5)-0.5+glowWidth;
          float sdf=length(max(frame,0.0))+min(max(frame.x,frame.y),0.0);
          sdf=sdf/glowWidth; sdf*=sdf;
          vec2 f=1.0-2.0*abs(uv-0.5);
          float p=3.0-2.0*max(f.x,f.y);
          p=pow(p,4.0); p*=sdf*sdf; p=max(p,0.0);
          p=mix(1.0,p,complexity);
          if(v<bestV){bestV=v;bestP=p;}
          break;
        }
        xy-=rd2.xy*ird2.z*sz;
      }
    }
  }
  return vec3(bestV,0.0,bestP);
}

void main(){
  vec2 uv=(gl_FragCoord.xy*2.0-uRes)/uRes.y;
  float e=uEnter*uEnter*(3.0-2.0*uEnter);

  float dist=mix(1.85, -0.32, e);
  vec3 ro=vec3(0.0,0.0,dist);
  vec3 rd=normalize(vec3(uv*0.6, -1.0));

  float ay=uTime*0.2;
  float ax=sin(uTime*0.15)*0.2+0.32;
  ro.xz*=rot(ay); ro.zy*=rot(ax);
  rd.xz*=rot(ay); rd.zy*=rot(ax);

  vec3 col=starfield(rd);
  float d=rbi(ro,rd);
  if(d>0.0){
    col=vec3(0.0);
    vec3 hit=ro+rd*d;
    vec3 nor=rbn(hit);
    float fr=fres(rd,nor);
    col=env(reflect(rd,nor))*fr;
    float cosI=dot(rd,nor);
    float k=cosI*cosI+eta*eta-1.0;
    if(k>=0.0){
      vec3 refDir=normalize(nor*(sqrt(k)+cosI)-rd);
      float power=1.0-fres(refDir,-nor);
      vec3 pc=hit+0.5;
      int ec=0;
      if(pc.x<=glowWidth||pc.x>=1.0-glowWidth) ec++;
      if(pc.y<=glowWidth||pc.y>=1.0-glowWidth) ec++;
      if(pc.z<=glowWidth||pc.z>=1.0-glowWidth) ec++;
      if(ec>=2){
        col+=uColor*power*edgeGlow;
      } else {
        vec3 f=infiniteGrid(hit,refDir);
        col+=pow(glow,f.x)*f.z*power*uColor;
      }
    }
  }
  o=vec4(col,1.0);
}`;

const BLOOM_FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes;
uniform sampler2D uTex;
vec3 aces(vec3 x){ x*=0.85; return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  vec3 base=texture(uTex,uv).rgb;
  vec2 tx=1.0/uRes;
  vec3 bl=vec3(0.0); float tot=0.0;
  for(int i=0;i<24;i++){
    float a=float(i)*2.399963;
    float r=sqrt(float(i)/24.0)*16.0;
    vec2 off=vec2(cos(a),sin(a))*r*tx;
    vec3 s=texture(uTex,uv+off).rgb;
    bl+=max(s-0.15,0.0)*(1.0-r/18.0);
    tot+=(1.0-r/18.0);
  }
  bl/=max(tot,1e-3);
  vec3 c=base+bl*0.58;
  o=vec4(aces(c),1.0);
}`;

const VERT = `#version 300 es
in vec2 p;
void main(){ gl_Position=vec4(p,0.0,1.0); }`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn("HypercubeHero shader:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function makeProg(gl: WebGL2RenderingContext, frag: string) {
  const prog = gl.createProgram()!;
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn("HypercubeHero link:", gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

export default function HypercubeHero({
  color = "#d49c4d",
  className,
}: {
  color?: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    const cv: HTMLCanvasElement = canvas;

    const glOrNull = cv.getContext("webgl2", { alpha: false, antialias: false });
    if (!glOrNull) return;
    const gl: WebGL2RenderingContext = glOrNull;

    const pScene = makeProg(gl, SCENE_FRAG);
    const pBloom = makeProg(gl, BLOOM_FRAG);
    if (!pScene || !pBloom) return;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    function bindQuad(p: WebGLProgram) {
      const l = gl.getAttribLocation(p, "p");
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
    }

    const tex = gl.createTexture();
    const fbo = gl.createFramebuffer();
    let W = 1,
      H = 1;
    function alloc() {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    const uSR = gl.getUniformLocation(pScene, "uRes");
    const uST = gl.getUniformLocation(pScene, "uTime");
    const uSE = gl.getUniformLocation(pScene, "uEnter");
    const uSC = gl.getUniformLocation(pScene, "uColor");
    const uBR = gl.getUniformLocation(pBloom, "uRes");
    const uBT = gl.getUniformLocation(pBloom, "uTex");
    const rgb = hexToRgb(color);

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(pointer: coarse)").matches;
    const staticMode = reduce || coarse;

    const SCALE = staticMode ? 0.55 : 0.62;
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = cv.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr * SCALE));
      const h = Math.max(1, Math.round(rect.height * dpr * SCALE));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
        W = w;
        H = h;
        alloc();
      }
    }
    resize();
    window.addEventListener("resize", resize);

    let enter = 0;
    let target = 0;
    if (!staticMode) {
      cv.addEventListener("pointerenter", () => (target = 1));
      cv.addEventListener("pointerleave", () => (target = 0));
    }

    let visible = true;
    const io = new IntersectionObserver(
      (ents) => {
        visible = ents[0]?.isIntersecting ?? true;
        if (visible && !staticMode && raf === 0) loop(performance.now());
      },
      { threshold: 0.06 }
    );
    io.observe(cv);

    const FRAME = 1000 / 40;
    let last = 0;
    let raf = 0;
    const start = performance.now();

    function draw(now: number) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, W, H);
      gl.useProgram(pScene!);
      bindQuad(pScene!);
      gl.uniform2f(uSR, W, H);
      gl.uniform1f(uST, (now - start) / 1000);
      gl.uniform1f(uSE, enter);
      gl.uniform3f(uSC, rgb[0], rgb[1], rgb[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, cv.width, cv.height);
      gl.useProgram(pBloom!);
      bindQuad(pBloom!);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(uBT, 0);
      gl.uniform2f(uBR, cv.width, cv.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function loop(now: number) {
      raf = 0;
      if (!visible) return;
      if (now - last >= FRAME) {
        last = now;
        enter += (target - enter) * 0.09;
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    }

    if (staticMode) {
      draw(start + 1400);
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      io.disconnect();
      gl.deleteProgram(pScene);
      gl.deleteProgram(pBloom);
      gl.deleteBuffer(buf);
      gl.deleteTexture(tex);
      gl.deleteFramebuffer(fbo);
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

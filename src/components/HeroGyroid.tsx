"use client";

import { useEffect, useRef } from "react";

// Контейнерный гироид — вписан в родителя (не fixed). Приглушённый, для хиро.
export default function HeroGyroid({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const gl = (cv.getContext("webgl") || cv.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return;

    const V = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    const F = `precision highp float;uniform vec2 r;uniform float t;uniform vec2 mp;
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
void main(){vec2 uv=(gl_FragCoord.xy-0.5*r.xy)/r.y;
vec3 ro=vec3(0.0,0.0,-3.0);vec3 rd=normalize(vec3(uv,1.3));
float ax=(mp.y-0.5)*0.5+t*0.03;float ay=(mp.x-0.5)*0.5+t*0.045;
rd.xz*=rot(ay);rd.yz*=rot(ax);ro.xz*=rot(ay);ro.yz*=rot(ax);
float d=0.0,glow=0.0;
for(int i=0;i<54;i++){vec3 p=ro+rd*d;p.z+=t*0.28;vec3 pp=p*1.25;
float gv=dot(sin(pp+0.3*sin(t*0.18)),cos(pp.yzx));float sdf=abs(gv)*0.5;
glow+=exp(-sdf*7.0)*0.03;d+=0.06+sdf*0.26;if(d>9.0)break;}
// приглушённая палитра: тёмно-тиловый -> мягкий зелёный, без неона
vec3 far=vec3(0.02,0.05,0.045),near=vec3(0.10,0.26,0.16);
vec3 col=mix(far,near,smoothstep(0.4,1.5,glow))*glow;
col*=1.0-0.3*length(uv);
gl_FragColor=vec4(col,1.0);}`;

    const sh = (type: number, src: string) => {
      const o = gl.createShader(type)!;
      gl.shaderSource(o, src);
      gl.compileShader(o);
      return o;
    };
    const pr = gl.createProgram()!;
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, V));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, F));
    gl.linkProgram(pr);
    gl.useProgram(pr);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const lp = gl.getAttribLocation(pr, "p");
    gl.enableVertexAttribArray(lp);
    gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(pr, "r"), uT = gl.getUniformLocation(pr, "t"), uM = gl.getUniformLocation(pr, "mp");

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cv.width = Math.max(1, Math.floor(cv.clientWidth * dpr));
      cv.height = Math.max(1, Math.floor(cv.clientHeight * dpr));
      gl.viewport(0, 0, cv.width, cv.height);
    };
    size();
    window.addEventListener("resize", size);

    let tx = 0.5, ty = 0.5, mx = 0.5, my = 0.5;
    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect();
      tx = (e.clientX - b.left) / b.width;
      ty = 1 - (e.clientY - b.top) / b.height;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    const t0 = performance.now();
    const frame = () => {
      mx += (tx - mx) * 0.05;
      my += (ty - my) * 0.05;
      gl.uniform2f(uR, cv.width, cv.height);
      gl.uniform1f(uT, (performance.now() - t0) / 1000);
      gl.uniform2f(uM, mx, my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      window.removeEventListener("pointermove", onMove);
      gl.deleteProgram(pr);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={className} style={{ display: "block", width: "100%", height: "100%" }} />;
}

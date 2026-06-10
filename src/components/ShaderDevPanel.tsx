"use client";

import { useState, type ReactNode } from "react";
import ShaderBackground from "@/components/ShaderBackground";
import ContourBackground from "@/components/ContourBackground";
import LatentFlowBackground from "@/components/LatentFlowBackground";

type Num = { k: string; label: string; min: number; max: number; step: number };

const AURORA: Num[] = [
  { k: "speed", label: "Скорость", min: 0, max: 2, step: 0.01 },
  { k: "scale", label: "Масштаб", min: 0.5, max: 6, step: 0.1 },
  { k: "warp", label: "Domain-warp", min: 0, max: 6, step: 0.1 },
  { k: "contrast", label: "Контраст", min: 0.3, max: 3, step: 0.05 },
  { k: "brightness", label: "Яркость", min: 0.3, max: 2, step: 0.05 },
  { k: "accent", label: "Акцент", min: 0, max: 1, step: 0.02 },
  { k: "pointer", label: "Реакция", min: 0, max: 1.5, step: 0.02 },
];
const AURORA_DEF: Record<string, number> = { speed: 0.5, scale: 2.4, warp: 3.5, contrast: 1.2, brightness: 1, accent: 0.45, pointer: 0.3 };

const CONTOUR: Num[] = [
  { k: "lines", label: "Линий", min: 12, max: 90, step: 1 },
  { k: "speed", label: "Скорость", min: 0.002, max: 0.05, step: 0.001 },
  { k: "amp", label: "Амплитуда", min: 20, max: 200, step: 2 },
  { k: "cursorRadius", label: "Радиус курсора", min: 40, max: 400, step: 10 },
  { k: "cursorLift", label: "Вспучивание", min: 0, max: 150, step: 2 },
];
const CONTOUR_DEF: Record<string, number> = { lines: 44, speed: 0.013, amp: 92, cursorRadius: 150, cursorLift: 48 };

const FLOW: Num[] = [
  { k: "count", label: "Частиц", min: 200, max: 4000, step: 50 },
  { k: "speed", label: "Скорость", min: 0.1, max: 2, step: 0.05 },
  { k: "flowScale", label: "Масштаб поля", min: 0.0004, max: 0.004, step: 0.0001 },
  { k: "fade", label: "Длина нитей", min: 0.01, max: 0.2, step: 0.005 },
  { k: "dotSize", label: "Размер точки", min: 0.6, max: 3, step: 0.1 },
  { k: "push", label: "Сила курсора", min: 0, max: 2, step: 0.05 },
];
const FLOW_DEF: Record<string, number> = { count: 1600, speed: 0.55, flowScale: 0.0013, fade: 0.045, dotSize: 1.1, push: 0.6 };

const lbl = { fontSize: 12, color: "#cfd2cf", marginBottom: 3 } as const;
const rowS = { marginBottom: 9 } as const;

function Field({ f, val, on }: { f: Num; val: number; on: (v: number) => void }) {
  return (
    <div style={rowS}>
      <div style={lbl}>{f.label}</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input type="range" min={f.min} max={f.max} step={f.step} value={val} onChange={(e) => on(+e.target.value)} style={{ flex: 1 }} />
        <input type="number" min={f.min} max={f.max} step={f.step} value={val} onChange={(e) => on(+e.target.value)}
          style={{ width: 66, background: "#111", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "3px 5px", fontSize: 12 }} />
      </div>
    </div>
  );
}
const hex2rgb = (h: string) => h.replace("#", "").match(/.{2}/g)!.map((x) => parseInt(x, 16)).join(",");
function Color({ t, v, on }: { t: string; v: string; on: (s: string) => void }) {
  return (
    <label style={{ fontSize: 11, color: "#cfd2cf", display: "flex", flexDirection: "column", gap: 4 }}>
      {t}
      <input type="color" value={v} onChange={(e) => on(e.target.value)} style={{ width: 52, height: 26, padding: 0, background: "none", border: "1px solid #333", borderRadius: 6 }} />
    </label>
  );
}

export default function ShaderDevPanel({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<"flow" | "contours" | "aurora">("flow");
  const [open, setOpen] = useState(true);

  // aurora
  const [a, setA] = useState<Record<string, number>>({ ...AURORA_DEF });
  const [ac0, setAc0] = useState("#08110b");
  const [ac1, setAc1] = useState("#0d8a2e");
  const [ac2, setAc2] = useState("#a6ff00");
  // contours
  const [c, setC] = useState<Record<string, number>>({ ...CONTOUR_DEF });
  const [cbg, setCbg] = useState("#06080a");
  const [cline, setCline] = useState("#2d9646");
  const [cacc, setCacc] = useState("#a0ff5a");
  const [cnodes, setCnodes] = useState(true);
  // flow
  const [fl, setFl] = useState<Record<string, number>>({ ...FLOW_DEF });
  const [flcol, setFlcol] = useState("#6e967d");

  const setAk = (k: string) => (v: number) => setA((s) => ({ ...s, [k]: v }));
  const setCk = (k: string) => (v: number) => setC((s) => ({ ...s, [k]: v }));
  const setFk = (k: string) => (v: number) => setFl((s) => ({ ...s, [k]: v }));

  const propsStr =
    mode === "aurora"
      ? `<ShaderBackground\n  c0="${hex2rgb(ac0)}"\n  c1="${hex2rgb(ac1)}"\n  c2="${hex2rgb(ac2)}"\n` +
        AURORA.map((f) => `  ${f.k}={${a[f.k]}}`).join("\n") + `\n/>`
      : mode === "contours"
      ? `<ContourBackground\n  bg="${hex2rgb(cbg)}"\n  line="${hex2rgb(cline)}"\n  accent="${hex2rgb(cacc)}"\n` +
        CONTOUR.map((f) => `  ${f.k}={${c[f.k]}}`).join("\n") + `\n  nodes={${cnodes}}\n/>`
      : `<LatentFlowBackground\n  color="${hex2rgb(flcol)}"\n` +
        FLOW.map((f) => `  ${f.k}={${fl[f.k]}}`).join("\n") + `\n/>`;
  const copy = () => navigator.clipboard && navigator.clipboard.writeText(propsStr);

  return (
    <>
      {mode === "aurora" ? (
        <ShaderBackground zIndex={0} c0={hex2rgb(ac0)} c1={hex2rgb(ac1)} c2={hex2rgb(ac2)}
          speed={a.speed} scale={a.scale} warp={a.warp} contrast={a.contrast} brightness={a.brightness} accent={a.accent} pointer={a.pointer} />
      ) : mode === "contours" ? (
        <ContourBackground zIndex={0} bg={hex2rgb(cbg)} line={hex2rgb(cline)} accent={hex2rgb(cacc)}
          lines={c.lines} speed={c.speed} amp={c.amp} cursorRadius={c.cursorRadius} cursorLift={c.cursorLift} nodes={cnodes} />
      ) : (
        <LatentFlowBackground zIndex={0} color={hex2rgb(flcol)}
          count={fl.count} speed={fl.speed} flowScale={fl.flowScale} fade={fl.fade} dotSize={fl.dotSize} push={fl.push} />
      )}

      <div id="glassroot" style={{ position: "relative", zIndex: 1 }}>{children}</div>
      <style>{`#glassroot section.bg-black{background-color:transparent!important;}`}</style>

      <div style={{
        position: "fixed", top: 12, right: 12, zIndex: 2147483000, width: open ? 290 : "auto",
        maxHeight: "92vh", overflowY: "auto", background: "rgba(16,18,17,0.94)", border: "1px solid #2a2e2b",
        borderRadius: 12, padding: open ? 12 : "8px 12px", color: "#e9e9ee", font: "13px/1.4 ui-sans-serif,system-ui",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: open ? 10 : 0 }}>
          <strong style={{ fontWeight: 500 }}>BG dev</strong>
          <button onClick={() => setOpen((o) => !o)} style={btn}>{open ? "—" : "+"}</button>
        </div>
        {open && (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <button onClick={() => setMode("flow")} style={{ ...btn, flex: 1, padding: "6px 4px", background: mode === "flow" ? "#2f6d22" : "#1d211e" }}>Поток</button>
              <button onClick={() => setMode("contours")} style={{ ...btn, flex: 1, padding: "6px 4px", background: mode === "contours" ? "#2f6d22" : "#1d211e" }}>Контуры</button>
              <button onClick={() => setMode("aurora")} style={{ ...btn, flex: 1, padding: "6px 4px", background: mode === "aurora" ? "#2f6d22" : "#1d211e" }}>Сияние</button>
            </div>

            {mode === "aurora" ? (
              <>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <Color t="база" v={ac0} on={setAc0} /><Color t="тон" v={ac1} on={setAc1} /><Color t="акцент" v={ac2} on={setAc2} />
                </div>
                {AURORA.map((f) => <Field key={f.k} f={f} val={a[f.k]} on={setAk(f.k)} />)}
              </>
            ) : mode === "contours" ? (
              <>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <Color t="фон" v={cbg} on={setCbg} /><Color t="линии" v={cline} on={setCline} /><Color t="узлы" v={cacc} on={setCacc} />
                </div>
                {CONTOUR.map((f) => <Field key={f.k} f={f} val={c[f.k]} on={setCk(f.k)} />)}
                <label style={check}><input type="checkbox" checked={cnodes} onChange={(e) => setCnodes(e.target.checked)} /> узлы у курсора</label>
              </>
            ) : (
              <>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <Color t="частицы" v={flcol} on={setFlcol} />
                </div>
                {FLOW.map((f) => <Field key={f.k} f={f} val={fl[f.k]} on={setFk(f.k)} />)}
              </>
            )}

            <button onClick={copy} style={{ ...btnWide, width: "100%", marginTop: 10 }}>Копир. пропсы</button>
          </>
        )}
      </div>
    </>
  );
}

const btn = { background: "#1d211e", color: "#e9e9ee", border: "1px solid #333", borderRadius: 6, padding: "2px 9px", cursor: "pointer", fontSize: 13 } as const;
const btnWide = { ...btn, padding: "6px 8px" } as const;
const check = { display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#cfd2cf", margin: "8px 0 2px" } as const;

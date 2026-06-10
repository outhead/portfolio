"use client";

import { useState, type ReactNode } from "react";
import SprayTrail from "@/components/SprayTrail";

type Num = { k: string; label: string; min: number; max: number; step: number };

const SPRAY_FIELDS: Num[] = [
  { k: "minRadiusCm", label: "Размер распыла (см)", min: 0.5, max: 25, step: 0.1 },
  { k: "nMist", label: "Кол-во частиц", min: 10, max: 10000, step: 10 },
  { k: "dotMax", label: "Размер частиц (px)", min: 0.5, max: 6, step: 0.1 },
  { k: "density", label: "Плотность", min: 0.2, max: 1000, step: 1 },
  { k: "freq", label: "Частота (лево-право)", min: 0.005, max: 0.08, step: 0.001 },
  { k: "vScale", label: "Уплотнение по вертикали", min: 0.1, max: 1.5, step: 0.05 },
  { k: "step", label: "Шаг скролла (px)", min: 1, max: 200, step: 1 },
  { k: "adv", label: "Ускорение", min: 0.05, max: 3, step: 0.05 },
  { k: "fade", label: "Затухание", min: 0, max: 0.03, step: 0.001 },
];
const DRIP_FIELDS: Num[] = [
  { k: "dripRate", label: "Частота капель", min: 0, max: 1, step: 0.01 },
  { k: "dripSizeMin", label: "Размер: мин", min: 0.3, max: 8, step: 0.1 },
  { k: "dripSizeMax", label: "Размер: макс", min: 1, max: 16, step: 0.1 },
  { k: "viscosity", label: "Вязкость", min: 0, max: 1, step: 0.02 },
  { k: "runMax", label: "Длина потёка (px)", min: 20, max: 800, step: 10 },
  { k: "edgeBias", label: "К краям/застою", min: 0, max: 1, step: 0.05 },
  { k: "maxDrips", label: "Лимит капель", min: 30, max: 1000, step: 10 },
];

type Preset = { color: string; coalesce: boolean; [k: string]: number | string | boolean };

const PRESETS: Record<string, Preset> = {
  Старт: {
    color: "#ffffff", minRadiusCm: 3, nMist: 90, dotMax: 1.7, density: 1, freq: 0.02, vScale: 1,
    step: 55, adv: 0.9, fade: 0.004, dripRate: 0.04, dripSizeMin: 1, dripSizeMax: 4, viscosity: 0.6,
    runMax: 220, edgeBias: 0.8, maxDrips: 120, coalesce: true,
  },
  Спрей: {
    color: "#1eba12", minRadiusCm: 2.7, nMist: 300, dotMax: 0.9, density: 3, freq: 0.037, vScale: 0.5,
    step: 118, adv: 0.35, fade: 0.002, dripRate: 0.05, dripSizeMin: 0.9, dripSizeMax: 4.3, viscosity: 0.88,
    runMax: 180, edgeBias: 1, maxDrips: 70, coalesce: true,
  },
  Плотный: {
    color: "#1eba12", minRadiusCm: 20, nMist: 8800, dotMax: 0.9, density: 878, freq: 0.028, vScale: 1.5,
    step: 195, adv: 1.7, fade: 0.011, dripRate: 0, dripSizeMin: 7.9, dripSizeMax: 16, viscosity: 0.88,
    runMax: 180, edgeBias: 1, maxDrips: 70, coalesce: true,
  },
  Гранж: {
    color: "#3a3a3a", minRadiusCm: 1.4, nMist: 180, dotMax: 0.8, density: 760, freq: 0.003, vScale: 0.08,
    step: 182, adv: 300, fade: 0.019, dripRate: 699, dripSizeMin: 0.3, dripSizeMax: 1, viscosity: 1.1,
    runMax: 110, edgeBias: 1, maxDrips: 1000, coalesce: true,
  },
};
const PRESET_NAMES = Object.keys(PRESETS);
const numKeys = [...SPRAY_FIELDS, ...DRIP_FIELDS].map((f) => f.k);

const lbl = { fontSize: 12, color: "#cfd2cf", marginBottom: 3 } as const;
const rowS = { marginBottom: 9 } as const;

function Field({ f, val, on }: { f: Num; val: number; on: (v: number) => void }) {
  return (
    <div style={rowS}>
      <div style={lbl}>{f.label}</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input type="range" min={f.min} max={f.max} step={f.step} value={val}
          onChange={(e) => on(+e.target.value)} style={{ flex: 1 }} />
        <input type="number" min={f.min} max={f.max} step={f.step} value={val}
          onChange={(e) => on(+e.target.value)}
          style={{ width: 66, background: "#111", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "3px 5px", fontSize: 12 }} />
      </div>
    </div>
  );
}

export default function SprayDevPanel({ children }: { children: ReactNode }) {
  const [p, setP] = useState<Record<string, number>>(() => {
    const o: Record<string, number> = {};
    numKeys.forEach((k) => (o[k] = (PRESETS.Спрей as Record<string, number>)[k]));
    return o;
  });
  const [color, setColor] = useState(PRESETS.Спрей.color);
  const [coalesce, setCoalesce] = useState(PRESETS.Спрей.coalesce);
  const [autoDraw, setAutoDraw] = useState(false);
  const [glass, setGlass] = useState(true);
  const [glassOpacity, setGlassOpacity] = useState(0.62);
  const [bgBlur, setBgBlur] = useState(0);
  const [selector, setSelector] = useState(".bg-black:not(section)");
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState("Спрей");

  const set = (k: string) => (v: number) => setP((s) => ({ ...s, [k]: v }));
  const applyPreset = (name: string) => {
    const pr = PRESETS[name];
    const o: Record<string, number> = {};
    numKeys.forEach((k) => (o[k] = (pr as Record<string, number>)[k]));
    setP(o);
    setColor(pr.color);
    setCoalesce(pr.coalesce);
    setActive(name);
  };

  const rgb = (() => {
    const h = color.replace("#", "");
    return `${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)}`;
  })();

  const glassCSS = glass
    ? `#glassroot section.bg-black{background-color:transparent!important;}
#glassroot ${selector}{background-color:rgba(10,12,11,${glassOpacity})!important;}`
    : "";

  const propsStr =
    `<SprayTrail\n  color="${rgb}"\n` +
    numKeys.map((k) => `  ${k}={${p[k]}}`).join("\n") +
    `\n  blur={${bgBlur}}\n  coalesce={${coalesce}}\n/>`;

  const copy = (t: string) => navigator.clipboard && navigator.clipboard.writeText(t);

  return (
    <>
      <SprayTrail
        zIndex={0}
        color={rgb}
        coalesce={coalesce}
        autoDraw={autoDraw}
        blur={bgBlur}
        minRadiusCm={p.minRadiusCm}
        nMist={p.nMist}
        dotMax={p.dotMax}
        density={p.density}
        freq={p.freq}
        vScale={p.vScale}
        step={p.step}
        adv={p.adv}
        fade={p.fade}
        dripRate={p.dripRate}
        dripSizeMin={p.dripSizeMin}
        dripSizeMax={p.dripSizeMax}
        viscosity={p.viscosity}
        runMax={p.runMax}
        edgeBias={p.edgeBias}
        maxDrips={p.maxDrips}
      />
      <div id="glassroot" style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
      {glassCSS ? <style>{glassCSS}</style> : null}

      <div
        style={{
          position: "fixed", top: 12, right: 12, zIndex: 2147483000,
          width: open ? 300 : "auto", maxHeight: "92vh", overflowY: "auto",
          background: "rgba(16,18,17,0.94)", border: "1px solid #2a2e2b", borderRadius: 12,
          padding: open ? 12 : "8px 12px", color: "#e9e9ee",
          font: "13px/1.4 ui-sans-serif,system-ui",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: open ? 10 : 0 }}>
          <strong style={{ fontWeight: 500 }}>Spray dev</strong>
          <button onClick={() => setOpen((o) => !o)} style={btn}>{open ? "—" : "+"}</button>
        </div>

        {open && (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              {PRESET_NAMES.map((n) => (
                <button key={n} onClick={() => applyPreset(n)}
                  style={{ ...btn, flex: 1, padding: "6px 4px", background: active === n ? "#2f6d22" : "#1d211e", borderColor: active === n ? "#3b8a2b" : "#333" }}>
                  {n}
                </button>
              ))}
            </div>

            <div style={section}>Распыл</div>
            <div style={rowS}>
              <div style={lbl}>Цвет</div>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                style={{ width: 44, height: 28, padding: 0, background: "none", border: "1px solid #333", borderRadius: 6 }} />
            </div>
            {SPRAY_FIELDS.map((f) => <Field key={f.k} f={f} val={p[f.k]} on={set(f.k)} />)}

            <div style={section}>Капли</div>
            {DRIP_FIELDS.map((f) => <Field key={f.k} f={f} val={p[f.k]} on={set(f.k)} />)}
            <label style={check}><input type="checkbox" checked={coalesce} onChange={(e) => setCoalesce(e.target.checked)} /> слипание</label>
            <label style={check}><input type="checkbox" checked={autoDraw} onChange={(e) => setAutoDraw(e.target.checked)} /> авто-рисование (без скролла)</label>

            <div style={section}>Стекло и блюр</div>
            <label style={check}><input type="checkbox" checked={glass} onChange={(e) => setGlass(e.target.checked)} /> включить стекло (заливка)</label>
            <Field f={{ k: "glassOpacity", label: "Плотность стекла", min: 0, max: 1, step: 0.02 }} val={glassOpacity} on={setGlassOpacity} />
            <Field f={{ k: "bgBlur", label: "Блюр спрея (фон), px", min: 0, max: 30, step: 1 }} val={bgBlur} on={setBgBlur} />
            <div style={rowS}>
              <div style={lbl}>CSS-селектор блоков</div>
              <input type="text" value={selector} onChange={(e) => setSelector(e.target.value)}
                style={{ width: "100%", background: "#111", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "5px 7px", fontSize: 12, fontFamily: "ui-monospace,monospace", boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={() => copy(propsStr)} style={btnWide}>Копир. пропсы</button>
              <button onClick={() => copy(glassCSS)} style={btnWide}>Копир. CSS</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

const btn = { background: "#1d211e", color: "#e9e9ee", border: "1px solid #333", borderRadius: 6, padding: "2px 9px", cursor: "pointer", fontSize: 13 } as const;
const btnWide = { ...btn, flex: 1, padding: "6px 8px" } as const;
const section = { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7e847f", margin: "12px 0 7px", borderTop: "1px solid #2a2e2b", paddingTop: 9 } as const;
const check = { display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#cfd2cf", margin: "6px 0" } as const;

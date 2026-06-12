"use client";

/* ─────────────────────────────────────────────────────────────────
 * GlyphEditor — мини-конструктор глифов для LED-движка.
 * Сетка 5×7 (или крупнее), рисование точками (клик/драг),
 * импорт PNG по контрасту, экспорт строк-битмап для LED_GLYPHS.
 * Фаза 2 из кейса led-font-engine.
 * ──────────────────────────────────────────────────────────────── */

import { useCallback, useRef, useState } from "react";
import LedText from "@/components/LedText";

const SIZES = [
  { label: "5×7 — буква", cols: 5, rows: 7 },
  { label: "9×7 — иконка", cols: 9, rows: 7 },
  { label: "16×16 — пиксель-арт", cols: 16, rows: 16 },
] as const;

export default function GlyphEditor() {
  const [size, setSize] = useState<(typeof SIZES)[number]>(SIZES[0]);
  const [grid, setGrid] = useState<boolean[]>(() => new Array(5 * 7).fill(false));
  const [copied, setCopied] = useState(false);
  const drawing = useRef<null | boolean>(null); // что «красим» при драге
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = (s: (typeof SIZES)[number]) => {
    setSize(s);
    setGrid(new Array(s.cols * s.rows).fill(false));
  };

  const setCell = useCallback((i: number, v: boolean) => {
    setGrid((g) => (g[i] === v ? g : g.map((x, j) => (j === i ? v : x))));
  }, []);

  // Экспорт в формат LED_GLYPHS: строки "01110"
  const rowsOut: string[] = [];
  for (let r = 0; r < size.rows; r++) {
    let s = "";
    for (let c = 0; c < size.cols; c++) s += grid[r * size.cols + c] ? "1" : "0";
    rowsOut.push(s);
  }
  const exportText = `[\n  ${rowsOut.map((r) => `"${r}"`).join(",\n  ")},\n]`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  // Импорт PNG: даунскейл в сетку, порог по яркости (с альфой)
  const importPng = (file: File) => {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = size.cols;
      cv.height = size.rows;
      const ctx = cv.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, size.cols, size.rows);
      const d = ctx.getImageData(0, 0, size.cols, size.rows).data;
      // средняя яркость как порог — работает и для тёмных, и для светлых картинок
      const lum: number[] = [];
      for (let i = 0; i < size.cols * size.rows; i++) {
        const a = d[i * 4 + 3] / 255;
        lum.push(((d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114) / 255) * a);
      }
      const avg = lum.reduce((s, x) => s + x, 0) / lum.length;
      setGrid(lum.map((x) => x > avg));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Размер сетки */}
      <div className="flex flex-wrap gap-2">
        {SIZES.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => reset(s)}
            className={`px-4 py-2 rounded-full border text-[12px] tracking-[0.06em] uppercase font-service transition-colors ${
              size.label === s.label
                ? "border-[#A6FF00]/60 text-[#A6FF00] bg-[#A6FF00]/10"
                : "border-white/15 text-white/55 hover:text-white hover:border-white/30"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Сетка-рисовалка */}
        <div
          className="select-none touch-none rounded-2xl bg-[#0b0b0a] p-4 self-start"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${size.cols}, 1fr)`,
            gap: 4,
          }}
          onPointerLeave={() => (drawing.current = null)}
          onPointerUp={() => (drawing.current = null)}
        >
          {grid.map((on, i) => (
            <button
              key={i}
              type="button"
              aria-label={`точка ${i}`}
              onPointerDown={(e) => {
                e.preventDefault();
                drawing.current = !on;
                setCell(i, !on);
              }}
              onPointerEnter={() => {
                if (drawing.current !== null) setCell(i, drawing.current);
              }}
              className={`rounded-full transition-colors duration-75 ${
                on ? "bg-[#A6FF00] shadow-[0_0_8px_rgba(166,255,0,0.5)]" : "bg-white/[0.07] hover:bg-white/[0.18]"
              }`}
              style={{ width: size.cols > 9 ? 18 : 30, height: size.cols > 9 ? 18 : 30 }}
            />
          ))}
        </div>

        {/* Экспорт */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="text-white/40">
            <LedText text="Битмапа для LED_GLYPHS" className="h-[9px] w-auto" />
          </div>
          <pre className="text-[13px] leading-relaxed text-[#A6FF00]/80 bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 overflow-x-auto font-service">
            {exportText}
          </pre>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={copy}
              className="px-5 py-2.5 rounded-full bg-[#A6FF00] text-black text-[13px] font-medium hover:bg-[#b8ff33] transition-colors"
            >
              {copied ? "Скопировано" : "Скопировать"}
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-5 py-2.5 rounded-full border border-white/20 text-white/70 text-[13px] hover:text-white hover:border-white/40 transition-colors"
            >
              Импорт PNG
            </button>
            <button
              type="button"
              onClick={() => reset(size)}
              className="px-5 py-2.5 rounded-full border border-white/10 text-white/40 text-[13px] hover:text-white/70 transition-colors"
            >
              Очистить
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importPng(f);
                e.target.value = "";
              }}
            />
          </div>
          <p className="text-[13px] text-white/40 max-w-[420px]">
            Картинка уляжется в сетку по контрасту — дальше дорисовывай точками.
            Битмапу можно вставить прямо в{" "}
            <a
              href="https://github.com/outhead/led-font"
              target="_blank"
              rel="noreferrer"
              className="text-white/60 hover:text-[#A6FF00] transition-colors"
            >
              led-font
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

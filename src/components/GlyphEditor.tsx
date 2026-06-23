"use client";

/* ─────────────────────────────────────────────────────────────────
 * GlyphEditor — конструктор глифов для LED-движка.
 * Сетка 5×7 / 9×7 / 16×16, рисование точками (клик/драг),
 * живое мини-превью «как в шрифте» рядом, сохранение в браузерную
 * галерею «Мои глифы», импорт PNG по контрасту, экспорт строк-битмап.
 * ──────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from "react";
import LedText from "@/components/LedText";
import {
  type SavedGlyph,
  loadGlyphs,
  seedDefaults,
  addGlyph,
  removeGlyph,
  isBlank,
  isDuplicate,
} from "@/components/glyphStore";

type Size = { label: string; cols: number; rows: number };

const SIZES: Size[] = [
  { label: "5×7 — буква", cols: 5, rows: 7 },
  { label: "9×7 — иконка", cols: 9, rows: 7 },
  { label: "16×16 — пиксель-арт", cols: 16, rows: 16 },
];

/* Мини-превью глифа: горящие точки SVG-кружками (как в реальном шрифте). */
function GlyphPreview({ bitmap, h = 24 }: { bitmap: string[]; h?: number }) {
  const rows = bitmap.length;
  const cols = bitmap[0]?.length ?? 0;
  const P = 4;
  const dot = 1.5;
  const lit: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (bitmap[r][c] === "1") lit.push({ x: c * P + P / 2, y: r * P + P / 2 });
    }
  }
  return (
    <svg
      viewBox={`0 0 ${cols * P} ${rows * P}`}
      style={{ height: h, width: "auto" }}
      aria-hidden
      focusable="false"
    >
      {lit.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={dot} fill="currentColor" />
      ))}
    </svg>
  );
}

export default function GlyphEditor() {
  const [size, setSize] = useState<Size>(SIZES[0]);
  const [grid, setGrid] = useState<boolean[]>(() => new Array(SIZES[0].cols * SIZES[0].rows).fill(false));
  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "dup">("idle");
  const [saved, setSaved] = useState<SavedGlyph[]>([]);
  const drawing = useRef<null | boolean>(null); // что «красим» при драге
  const fileRef = useRef<HTMLInputElement>(null);

  // Галерея «Мои глифы»: засев примеров + синхронизация между редакторами
  useEffect(() => {
    setSaved(seedDefaults());
    const sync = () => setSaved(loadGlyphs());
    window.addEventListener("led-glyphs-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("led-glyphs-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const reset = (s: Size) => {
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
  const isEmpty = isBlank(rowsOut);
  // дубль — точно такой же глиф уже в галерее; пересчитывается на каждый рендер
  const dup = !isEmpty && isDuplicate(rowsOut);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const save = () => {
    if (isEmpty) return;
    if (isDuplicate(rowsOut)) {
      setSaveState("dup");
      setTimeout(() => setSaveState("idle"), 1600);
      return;
    }
    setSaved(addGlyph(rowsOut, size.cols, size.rows));
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 1500);
  };

  const loadInto = (g: SavedGlyph) => {
    const s: Size =
      SIZES.find((x) => x.cols === g.cols && x.rows === g.rows) ??
      { label: `${g.cols}×${g.rows}`, cols: g.cols, rows: g.rows };
    setSize(s);
    const next = new Array(g.cols * g.rows).fill(false);
    for (let r = 0; r < g.rows; r++)
      for (let c = 0; c < g.cols; c++) next[r * g.cols + c] = g.bitmap[r]?.[c] === "1";
    setGrid(next);
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

        {/* Действия + живое превью + экспорт */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Живое мини-превью «как в шрифте» */}
          <div className="flex items-center gap-4">
            <span className="text-white/35 shrink-0">
              <LedText text="Как в шрифте" className="h-[8px] w-auto" />
            </span>
            <div className="flex items-center justify-center min-w-[44px] min-h-[40px] px-3 py-2 rounded-lg border border-white/[0.08] bg-black text-[#A6FF00]">
              {isEmpty ? (
                <span className="text-[12px] text-white/25">пусто</span>
              ) : (
                <GlyphPreview bitmap={rowsOut} h={size.rows > 9 ? 40 : 26} />
              )}
            </div>
          </div>

          <div className="text-white/40">
            <LedText text="Битмапа для LED_GLYPHS" className="h-[9px] w-auto" />
          </div>
          <pre className="text-[13px] leading-relaxed text-[#A6FF00]/80 bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 overflow-x-auto font-service">
            {exportText}
          </pre>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={save}
              disabled={isEmpty || dup}
              title={dup ? "Точно такой глиф уже сохранён" : undefined}
              className="px-5 py-2.5 rounded-full bg-[#A6FF00] text-black text-[13px] font-medium hover:bg-[#b8ff33] transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            >
              {saveState === "saved" ? "Сохранено ✓" : dup ? "Уже сохранён" : "Сохранить глиф"}
            </button>
            <button
              type="button"
              onClick={copy}
              className="px-5 py-2.5 rounded-full border border-white/20 text-white/70 text-[13px] hover:text-white hover:border-white/40 transition-colors"
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

      {/* Галерея «Мои глифы» */}
      <div className="border-t border-white/[0.06] pt-5">
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-white/45">
            <LedText text="Мои глифы" className="h-[9px] w-auto" />
          </span>
          {saved.length > 0 && (
            <span className="text-[12px] tabular-nums text-white/25">{saved.length}</span>
          )}
        </div>
        {saved.length === 0 ? (
          <p className="text-[13px] text-white/30">
            Пусто. Нарисуй что-нибудь и нажми «Сохранить глиф» — появится здесь
            маленькой превьюшкой и переживёт перезагрузку.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {saved.map((g) => (
              <div
                key={g.id}
                className="group relative flex items-center justify-center rounded-lg border border-white/[0.08] bg-black px-3 py-3 min-w-[56px] text-white/85 hover:border-[#A6FF00]/45 hover:text-[#A6FF00] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => loadInto(g)}
                  title="Открыть в редакторе крупно"
                  className="flex items-center justify-center"
                >
                  <GlyphPreview bitmap={g.bitmap} h={g.rows > 9 ? 34 : 26} />
                </button>
                <button
                  type="button"
                  onClick={() => setSaved(removeGlyph(g.id))}
                  title="Удалить"
                  aria-label="Удалить глиф"
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black border border-white/20 text-white/50 text-[12px] leading-none opacity-0 group-hover:opacity-100 hover:text-white hover:border-white/50 transition-opacity flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

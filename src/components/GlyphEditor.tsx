"use client";

/* ─────────────────────────────────────────────────────────────────
 * GlyphEditor — конструктор глифов для LED-движка.
 * Сетка 5×7 / 9×7 / 16×16, рисование точками (клик/драг),
 * живое мини-превью «как в шрифте» рядом, публикация в ОБЩУЮ галерею
 * (Supabase), листание галереи, импорт PNG, экспорт строк-битмап.
 * ──────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from "react";
import LedText from "@/components/LedText";
import {
  type SavedGlyph,
  loadGlyphs,
  saveGlyph,
  setGlyphHidden,
  isBlank,
  sigOf,
  PAGE,
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

type SaveState = "idle" | "saving" | "saved" | "dup" | "error";

export default function GlyphEditor() {
  const [size, setSize] = useState<Size>(SIZES[0]);
  const [grid, setGrid] = useState<boolean[]>(() => new Array(SIZES[0].cols * SIZES[0].rows).fill(false));
  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saved, setSaved] = useState<SavedGlyph[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const drawing = useRef<null | boolean>(null); // что «красим» при драге
  const fileRef = useRef<HTMLInputElement>(null);

  // Загрузка битмапы из кода: принимает массив "01..." / строки точками (. и X/#),
  // в любом форматировании (с кавычками, скобками, запятыми). Размер — по строкам.
  const loadFromCode = (text: string) => {
    const raw = text.replace(/[xX#]/g, "1").replace(/\./g, "0");
    const tokens = raw.split(/[^01]+/).filter(Boolean);
    if (!tokens.length) return;
    const cols = Math.max(...tokens.map((t) => t.length));
    const rows = tokens.length;
    const padded = tokens.map((t) => t.padEnd(cols, "0").slice(0, cols));
    const s: Size =
      SIZES.find((x) => x.cols === cols && x.rows === rows) ?? { label: `${cols}×${rows}`, cols, rows };
    setSize(s);
    setGrid(padded.flatMap((t) => [...t].map((ch) => ch === "1")));
    setShowPaste(false);
    setPasteText("");
  };

  // Общая галерея: первая страница при монтировании
  useEffect(() => {
    let alive = true;
    loadGlyphs(PAGE, 0).then((list) => {
      if (!alive) return;
      setSaved(list);
      setHasMore(list.length === PAGE);
    });
    return () => {
      alive = false;
    };
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    const next = await loadGlyphs(PAGE, saved.length);
    setSaved((prev) => {
      const seen = new Set(prev.map((g) => g.id));
      return [...prev, ...next.filter((g) => !seen.has(g.id))];
    });
    setHasMore(next.length === PAGE);
    setLoadingMore(false);
  };

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
  // дубль среди уже загруженных (полную проверку делает БД по уникальной сигнатуре)
  const localDup = !isEmpty && saved.some((g) => sigOf(g.bitmap) === sigOf(rowsOut));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const save = async () => {
    if (isEmpty || saveState === "saving") return;
    if (localDup) {
      setSaveState("dup");
      setTimeout(() => setSaveState("idle"), 1600);
      return;
    }
    setSaveState("saving");
    const res = await saveGlyph(rowsOut, size.cols, size.rows);
    if (res.ok) {
      if (res.entry) setSaved((prev) => [res.entry!, ...prev]);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    } else if (res.duplicate) {
      setSaveState("dup");
      setTimeout(() => setSaveState("idle"), 1600);
    } else {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2200);
    }
  };

  // Краудсорс-модерация: скрыть/раскрыть ото всех (оптимистично + откат при ошибке)
  const toggleHidden = async (g: SavedGlyph) => {
    const next = !g.hidden;
    setSaved((prev) => prev.map((x) => (x.id === g.id ? { ...x, hidden: next } : x)));
    const ok = await setGlyphHidden(g.id, next);
    if (!ok) setSaved((prev) => prev.map((x) => (x.id === g.id ? { ...x, hidden: g.hidden } : x)));
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

  const saveLabel =
    saveState === "saving"
      ? "Публикую…"
      : saveState === "saved"
      ? "В галерее ✓"
      : saveState === "dup" || localDup
      ? "Уже есть"
      : saveState === "error"
      ? "Ошибка, ещё раз"
      : "Сохранить в галерею";

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
          <pre className="text-[14px] leading-relaxed text-[#A6FF00]/80 bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 overflow-x-auto font-service">
            {exportText}
          </pre>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={save}
              disabled={isEmpty || localDup || saveState === "saving"}
              title={localDup ? "Точно такой глиф уже в общей галерее" : undefined}
              className="px-5 py-2.5 rounded-full bg-[#A6FF00] text-black text-[14px] font-medium hover:bg-[#b8ff33] transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            >
              {saveLabel}
            </button>
            <button
              type="button"
              onClick={copy}
              className="px-5 py-2.5 rounded-full border border-white/20 text-white/70 text-[14px] hover:text-white hover:border-white/40 transition-colors"
            >
              {copied ? "Скопировано" : "Скопировать"}
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-5 py-2.5 rounded-full border border-white/20 text-white/70 text-[14px] hover:text-white hover:border-white/40 transition-colors"
            >
              Импорт PNG
            </button>
            <button
              type="button"
              onClick={() => setShowPaste((v) => !v)}
              className="px-5 py-2.5 rounded-full border border-white/20 text-white/70 text-[14px] hover:text-white hover:border-white/40 transition-colors"
            >
              Из кода
            </button>
            <button
              type="button"
              onClick={() => reset(size)}
              className="px-5 py-2.5 rounded-full border border-white/10 text-white/40 text-[14px] hover:text-white/70 transition-colors"
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

          {showPaste ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={6}
                placeholder={'Вставь битмапу: строки из 0/1 (или . и X), можно с кавычками и запятыми. Размер сетки определится сам.'}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-[13px] leading-relaxed text-[#A6FF00]/80 font-service outline-none focus:border-[#A6FF00]/40"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadFromCode(pasteText)}
                  disabled={!pasteText.trim()}
                  className="px-5 py-2.5 rounded-full bg-[#A6FF00] text-black text-[14px] font-medium hover:bg-[#b8ff33] transition-colors disabled:opacity-35"
                >
                  Загрузить в сетку
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPaste(false); setPasteText(""); }}
                  className="px-5 py-2.5 rounded-full border border-white/15 text-white/50 text-[14px] hover:text-white/80 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : null}

          <p className="text-[14px] text-white/40 max-w-[440px]">
            «Сохранить в галерею» — глиф увидят все: галерея общая. Картинка уляжется
            в сетку по контрасту, битмапу можно вставить прямо в{" "}
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

      {/* Общая галерея с краудсорс-модерацией */}
      {(() => {
        const hiddenCount = saved.filter((g) => g.hidden).length;
        const shown = showHidden ? saved : saved.filter((g) => !g.hidden);
        return (
          <div className="border-t border-white/[0.06] pt-5">
            <div className="flex items-baseline gap-3 mb-1 flex-wrap">
              <span className="text-white/45">
                <LedText text="Общая галерея" className="h-[9px] w-auto" />
              </span>
              {shown.length > 0 && (
                <span className="text-[12px] tabular-nums text-white/25">
                  {shown.length}
                  {hasMore ? "+" : ""}
                </span>
              )}
              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHidden((v) => !v)}
                  className="text-[12px] text-white/40 hover:text-white/70 transition-colors underline underline-offset-2"
                >
                  {showHidden ? "не показывать скрытые" : `показать скрытые (${hiddenCount})`}
                </button>
              )}
            </div>
            <p className="text-[12px] text-white/30 mb-3">
              Скрыть может любой — глиф пропадёт у всех. Раскрыть тоже может любой.
            </p>
            {shown.length === 0 ? (
              <p className="text-[14px] text-white/30">
                {saved.length === 0
                  ? "Пока пусто. Нарисуй что-нибудь и нажми «Сохранить в галерею» — глиф появится здесь у всех."
                  : "Всё скрыто. Нажми «показать скрытые», чтобы посмотреть."}
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2.5">
                  {shown.map((g) => (
                    <div
                      key={g.id}
                      className={`group relative flex items-center justify-center rounded-lg border bg-black px-3 py-3 min-w-[56px] transition-colors ${
                        g.hidden
                          ? "border-white/[0.06] text-white/30 opacity-60"
                          : "border-white/[0.08] text-white/85 hover:border-[#A6FF00]/45 hover:text-[#A6FF00]"
                      }`}
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
                        onClick={() => toggleHidden(g)}
                        title={g.hidden ? "Раскрыть для всех" : "Скрыть ото всех"}
                        aria-label={g.hidden ? "Раскрыть глиф" : "Скрыть глиф"}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black border border-white/20 text-white/55 text-[12px] leading-none opacity-0 group-hover:opacity-100 hover:text-white hover:border-white/50 transition-opacity flex items-center justify-center"
                      >
                        {g.hidden ? "↺" : "×"}
                      </button>
                    </div>
                  ))}
                </div>
                {hasMore && (
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="mt-4 px-5 py-2.5 rounded-full border border-white/15 text-white/55 text-[14px] hover:text-white hover:border-white/35 transition-colors disabled:opacity-40"
                  >
                    {loadingMore ? "Загружаю…" : "Показать ещё"}
                  </button>
                )}
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
}

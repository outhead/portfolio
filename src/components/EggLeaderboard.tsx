"use client";

/* Модалка лидерборда охоты за пасхалками. Открывается кликом по счётчику
 * и автоматически на 6/6 (с формой ввода ника). Рейтинг — по скорости. */

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadEggBoard, saveEggScore, fmtEggTime, type EggEntry } from "./eggBoard";

type Props = {
  open: boolean;
  onClose: () => void;
  /** показать форму ввода ника (нашёл всё и ещё не отправил) */
  canSubmit: boolean;
  /** время прохождения (от первой пасхалки до всех), мс */
  durationMs: number | null;
  found: number;
  total: number;
  onSubmitted: () => void;
};

export default function EggLeaderboard({
  open,
  onClose,
  canSubmit,
  durationMs,
  found,
  total,
  onSubmitted,
}: Props) {
  const [entries, setEntries] = useState<EggEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    loadEggBoard(20).then((rows) => {
      if (alive) {
        setEntries(rows);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [open]);

  // Esc закрывает
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submit = useCallback(async () => {
    const nm = name.trim();
    if (!nm || sending) return;
    setSending(true);
    const rows = await saveEggScore(nm, durationMs, found);
    setEntries(rows);
    setSending(false);
    setSubmitted(true);
    onSubmitted();
  }, [name, sending, durationMs, found, onSubmitted]);

  const showForm = canSubmit && !submitted;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Лидерборд пасхалок"
            className="relative w-full max-w-[440px] rounded-2xl border border-white/10 bg-[#0f0f0e] p-6 md:p-7 shadow-2xl"
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-service text-[18px] md:text-[20px] text-white tracking-[0.01em]">
                  Доска искателей
                </div>
                <div className="mt-1 text-[13px] text-white/45">
                  Кто нашёл все {total} пасхалок — по скорости
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="shrink-0 -mr-1 -mt-1 h-8 w-8 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {showForm && (
              <div className="mt-5 rounded-xl border border-[#A6FF00]/30 bg-[#A6FF00]/[0.06] p-4">
                <div className="text-[14px] text-white/85">
                  Ты нашёл все {total}! Время: <span className="text-[#A6FF00]">{fmtEggTime(durationMs)}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 32))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submit();
                    }}
                    placeholder="Имя или ник"
                    maxLength={32}
                    autoFocus
                    className="flex-1 min-w-0 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-[#A6FF00]/60"
                  />
                  <button
                    type="button"
                    onClick={submit}
                    disabled={!name.trim() || sending}
                    className="shrink-0 rounded-lg bg-[#A6FF00] px-4 py-2 text-[14px] font-medium text-black hover:bg-white disabled:opacity-40 transition-colors"
                  >
                    {sending ? "…" : "Записать"}
                  </button>
                </div>
              </div>
            )}

            {submitted && (
              <div className="mt-5 text-[14px] text-[#A6FF00]">Записал. Ты в доске ↓</div>
            )}

            <div className="mt-5 max-h-[46vh] overflow-y-auto [scrollbar-width:thin]">
              {loading ? (
                <div className="py-8 text-center text-[13px] text-white/40">Загрузка…</div>
              ) : entries.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-white/40">
                  Пока никто не нашёл все. Будь первым.
                </div>
              ) : (
                <ol className="flex flex-col">
                  {entries.map((e, i) => (
                    <li
                      key={`${e.name}-${e.at}-${i}`}
                      className="flex items-center gap-3 border-b border-white/[0.05] py-2.5 last:border-0"
                    >
                      <span
                        className={`w-6 shrink-0 text-right text-[13px] tabular-nums ${
                          i === 0 ? "text-[#C9A66B]" : "text-white/35"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[14px] text-white/85">
                        {e.name}
                      </span>
                      <span className="shrink-0 text-[13px] tabular-nums text-white/55">
                        {fmtEggTime(e.durationMs)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

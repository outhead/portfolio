"use client";

import LedText from "@/components/LedText";
import { LedLines } from "@/components/LedBoard";
import { useState } from "react";
import confetti from "canvas-confetti";
import {
  loadBoard,
  saveScore,
  fmtQuestTime,
  questElapsed,
  questHints,
  clearQuestStart,
  type LbEntry,
} from "../../leaderboard";
import QuestBackground from "@/components/QuestBackground";
import HintButton from "@/components/HintButton";
import QuestButton from "@/components/QuestButton";
import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";

/**
 * Финал квеста — «Код на виду» (Notpron). Код 4488 спрятан в заголовке вкладки.
 * После ввода — финальный лидерборд по ВРЕМЕНИ ПРОХОЖДЕНИЯ ВСЕГО КВЕСТА.
 * Текущие записи помечены как друзья/тестировщики (можно скрыть и увидеть остальных).
 */
const CODE = "4488";

function celebrate() {
  const colors = ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"];
  confetti({ particleCount: 140, spread: 110, startVelocity: 45, origin: { y: 0.6 }, colors, disableForReducedMotion: true });
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.25, y: 0.5 }, colors, disableForReducedMotion: true }), 200);
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.75, y: 0.5 }, colors, disableForReducedMotion: true }), 360);
}

export default function KodFinal() {
  const locale = useLocale();
  const [entry, setEntry] = useState("");
  const [won, setWon] = useState(false);
  const [wrong, setWrong] = useState(false);

  const [winMs, setWinMs] = useState<number | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [entries, setEntries] = useState<LbEntry[]>([]);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [youAt, setYouAt] = useState<number | null>(null);
  const [othersOnly, setOthersOnly] = useState(true); // по умолчанию прячем друзей/тестеров

  const push = (d: string) => {
    if (won || entry.length >= 4) return;
    const next = entry + d;
    setEntry(next);
    if (next.length === 4) {
      if (next === CODE) {
        setTimeout(() => {
          setWinMs(questElapsed());
          setHintsUsed(questHints());
          setWon(true);
          celebrate();
          loadBoard().then(setEntries);
        }, 150);
      } else {
        setWrong(true);
        setTimeout(() => { setWrong(false); setEntry(""); }, 600);
      }
    }
  };
  const back = () => setEntry((e) => e.slice(0, -1));

  async function submit() {
    if (submitting || submitted || winMs == null) return;
    setSubmitting(true);
    const { entries: top, at, id } = await saveScore(name.trim() || pick("Гость", "Guest", locale), winMs, { hints: hintsUsed });
    setEntries(top);
    setYouAt(at);
    setSubmitted(true);
    setSubmitting(false);
    try {
      localStorage.setItem("quest_name", name.trim()); // имя → в кооп и понг
      if (id) localStorage.setItem("quest_row_id", id); // строка в рейтинге → урезать время в делёже
    } catch { /* */ }
    clearQuestStart(); // следующий заход — новый отсчёт
  }

  const shown = othersOnly ? entries.filter((e) => !e.tester) : entries;

  return (
    <main className="relative bg-black text-white overflow-y-auto flex flex-col items-center px-5 pt-[88px] pb-16" style={{ minHeight: "100dvh" }}>
      <QuestBackground palette="cyan" opacity={0.3} />
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(166,255,0,0.06), transparent 60%)",
      }} />

      {!won ? (
        <>
        <div className="relative z-[1] w-full max-w-[320px] mx-auto flex flex-col items-center text-center select-none">
          <p className="text-white/40 mb-3">
            <span className="sr-only">{pick("Загадка №5 · финал", "Riddle #5 · finale", locale)}</span>
            <LedText text={pick("Загадка №5 · финал", "Riddle #5 · finale", locale)} className="h-[9px] w-auto" />
          </p>
          <h1 className="mb-2">
            <LedLines text={pick("Введи код", "Enter the code", locale)} center maxChars={20} lineClass="h-[17px] md:h-[24px]" />
          </h1>
          <p className="text-[14px] text-white/40 mb-8">{pick("Терминал #0000 · доступ закрыт", "Terminal #0000 · access denied", locale)}</p>

          <div className={`flex gap-3 mb-8 transition-transform ${wrong ? "translate-x-1" : ""}`} style={wrong ? { color: "#C9A66B" } : undefined}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`w-12 h-14 rounded-md border flex items-center justify-center ${wrong ? "border-[#C9A66B]/60" : "border-white/20"} ${entry[i] ? "text-white" : "text-white/20"}`}>
                <LedText text={entry[i] ?? "·"} scale={2} dot={1.45} className="h-[20px] w-auto" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {["1","2","3","4","5","6","7","8","9"].map((d) => (
              <button key={d} type="button" onClick={() => push(d)}
                className="w-16 h-16 rounded-md border border-white/12 bg-white/[0.03] text-white/85 hover:border-white/30 hover:bg-white/[0.07] transition-colors inline-flex items-center justify-center">
                <LedText text={d} className="h-[15px] w-auto" />
              </button>
            ))}
            <button type="button" onClick={back} aria-label={pick("Стереть", "Erase", locale)}
              className="w-16 h-16 rounded-md border border-white/12 bg-white/[0.03] text-white/45 hover:border-white/30 transition-colors inline-flex items-center justify-center">
              <LedText text="←" className="h-[13px] w-auto" />
            </button>
            <button type="button" onClick={() => push("0")}
              className="w-16 h-16 rounded-md border border-white/12 bg-white/[0.03] text-white/85 hover:border-white/30 hover:bg-white/[0.07] transition-colors inline-flex items-center justify-center">
              <LedText text="0" className="h-[15px] w-auto" />
            </button>
            <span className="w-16 h-16" />
          </div>

          <HintButton
            className="mt-8"
            hints={pick(
              [
                "Подбирать не нужно. Цифры спрятаны где-то на странице.",
                "Пролистай в самый низ — загляни в подвал.",
              ],
              [
                "No need to guess. The digits are hidden somewhere on the page.",
                "Scroll all the way down — peek into the basement.",
              ],
              locale,
            )}
          />
        </div>

        {/* Разгадка — в самом «подвале»: надо пролистать вниз (на телефоне — пара экранов) */}
        <div aria-hidden style={{ height: "128vh" }} />
        <div className="relative z-[1] w-full max-w-[440px] mx-auto text-center pb-4">
          <p className="text-white/25">
            <span className="sr-only">{pick("Сектор 4 · Узел 4 · Шлюз 8 · Ключ 8", "Sector 4 · Node 4 · Gate 8 · Key 8", locale)}</span>
            <LedText text={pick("Сектор 4 · Узел 4 · Шлюз 8 · Ключ 8", "Sector 4 · Node 4 · Gate 8 · Key 8", locale)} className="h-[9px] w-auto" />
          </p>
          <p className="mt-2 text-[10px] tracking-[0.2em] uppercase text-white/12">{pick("Терминал #0000 · служебная метка", "Terminal #0000 · service label", locale)}</p>
        </div>
        </>
      ) : (
        <div className="relative z-[1] w-full max-w-[440px] mx-auto flex flex-col items-center text-center">
          <p className="text-white/40 mb-3">
            <span className="sr-only">{pick("Квест пройден", "Quest complete", locale)}</span>
            <LedText text={pick("Квест пройден", "Quest complete", locale)} className="h-[9px] w-auto" />
          </p>
          <h1 className="text-[#A6FF00] mb-4">
            <LedLines text={pick("Доступ", "Access", locale)} center maxChars={20} lineClass="h-[26px] md:h-[38px]" />
          </h1>
          {winMs != null ? (
            <p className="text-[16px] text-white/80 mb-8">
              {pick("Весь квест за ", "Whole quest in ", locale)}<span className="text-[#A6FF00] tabular-nums">{fmtQuestTime(winMs)}</span>
              {hintsUsed > 0 ? (
                <> · {pick("подсказок: ", "hints: ", locale)}<span className="text-[#C9A66B] tabular-nums">{hintsUsed}</span></>
              ) : (
                <> · <span className="text-[#A6FF00]">{pick("без подсказок", "no hints", locale)}</span></>
              )}
            </p>
          ) : (
            <p className="text-sm text-white/50 mb-8">{pick("Код был в заголовке вкладки. (Время не засчитано — квест начат не с шифра.)", "The code was in the tab title. (Time not counted — quest wasn't started from the cipher.)", locale)}</p>
          )}

          {/* ─── 1. Имя + опциональный отзыв за кнопкой ─── */}
          {winMs != null && !submitted ? (
            <div className="w-full max-w-[340px] mx-auto flex flex-col gap-3 mb-10">
              <input
                type="text" value={name}
                onChange={(e) => { setName(e.target.value); try { localStorage.setItem("quest_name", e.target.value.trim()); } catch { /* */ } }}
                maxLength={20} placeholder={pick("Твоё имя", "Your name", locale)} aria-label={pick("Имя для таблицы лидеров", "Name for the leaderboard", locale)}
                className="bg-white/[0.06] border border-white/15 rounded-full px-5 py-3.5 text-[16px] text-white text-center placeholder:text-white/35 outline-none focus:border-[#A6FF00]/60 transition-colors"
              />

              <QuestButton onClick={submit} disabled={submitting} className="mt-1">
                {submitting ? "..." : pick("В таблицу", "To the board", locale)}
              </QuestButton>
              <p className="text-[12px] text-white/30">{pick("Имя необязательно — таблица лидеров ниже в любом случае.", "Name is optional — the leaderboard is below either way.", locale)}</p>
            </div>
          ) : null}

          {/* ─── 2. После отправки: статус ─── */}
          {submitted ? (
            <p className="text-[16px] text-white/75 mb-6 max-w-[420px]">{pick("Ты в таблице. Спасибо, что дошёл.", "You're on the board. Thanks for making it here.", locale)}</p>
          ) : null}

          {/* ─── 3. Лидерборд — виден сразу после победы ─── */}
          {entries.length > 0 ? (
            <div className="w-full max-w-[380px] mx-auto mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white/40">
                  <span className="sr-only">{pick("Быстрее всех", "Fastest", locale)}</span>
                  <LedText text={pick("Быстрее всех", "Fastest", locale)} className="h-[8px] w-auto" />
                </p>
                <button type="button" onClick={() => setOthersOnly((v) => !v)}
                  className="text-[12px] tracking-[0.08em] uppercase text-white/35 hover:text-[#A6FF00] transition-colors">
                  {othersOnly ? pick("все", "all", locale) : pick("без друзей", "hide friends", locale)}
                </button>
              </div>
              <ol className="text-left">
                {shown.map((e, i) => {
                  const mine = youAt != null && e.at === youAt;
                  return (
                    <li key={`${e.at}-${i}`} className={`flex items-center gap-3 py-2 border-b border-white/[0.05] last:border-0 ${mine ? "text-[#A6FF00]" : "text-white/80"}`}>
                      <span className="w-5 text-white/35">
                        <LedText text={String(i + 1)} className="h-[9px] w-auto" />
                      </span>
                      <span className="flex-1 text-[16px] truncate">
                        {e.name}
                        {e.tester ? <span className="ml-2 text-[10px] tracking-[0.1em] uppercase text-[#C9A66B]/70 align-middle">{pick("друг/тест", "friend/test", locale)}</span> : null}
                      </span>
                      <span className="text-[12px] text-white/45 whitespace-nowrap tabular-nums inline-flex items-center gap-1.5">
                        {fmtQuestTime(e.timeMs)}
                        {e.hints > 0 ? (
                          <span className="text-[#C9A66B]/80" title={pick(`${e.hints} подсказок · штраф +${e.hints * 30}с`, `${e.hints} hints · penalty +${e.hints * 30}s`, locale)}>
                            +{e.hints}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
                {shown.length === 0 ? <li className="py-2 text-sm text-white/35">{pick("Будь первым из остальных.", "Be the first of the rest.", locale)}</li> : null}
              </ol>
            </div>
          ) : null}

          {/* ─── Дальше: кооп — сразу под таблицей ─── */}
          <div className="mb-8 flex flex-col items-center">
            <p className="text-[14px] text-white/45 mb-3 max-w-xs">{pick("Есть ещё одна. Но в одиночку её не пройти.", "There's one more. But you can't solve it alone.", locale)}</p>
            <QuestButton href="/secret/pair" arrow>{pick("Кооп-загадка", "Co-op riddle", locale)}</QuestButton>
          </div>

        </div>
      )}
    </main>
  );
}

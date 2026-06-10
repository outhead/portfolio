"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";
import {
  loadBoard,
  loadFeedback,
  saveScore,
  fmtQuestTime,
  questElapsed,
  clearQuestStart,
  type LbEntry,
  type FbEntry,
} from "../../leaderboard";

// Телеграм-канал для кнопки «подписаться» и вейтлиста. Пусто → кнопка скрыта.
const TG_CHANNEL = "https://t.me/aiegorka";

/**
 * Финал квеста — «Код на виду» (Notpron). Код 4688 спрятан в заголовке вкладки.
 * После ввода — финальный лидерборд по ВРЕМЕНИ ПРОХОЖДЕНИЯ ВСЕГО КВЕСТА.
 * Текущие записи помечены как друзья/тестировщики (можно скрыть и увидеть остальных).
 */
const CODE = "4688";

function celebrate() {
  const colors = ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"];
  confetti({ particleCount: 140, spread: 110, startVelocity: 45, origin: { y: 0.6 }, colors, disableForReducedMotion: true });
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.25, y: 0.5 }, colors, disableForReducedMotion: true }), 200);
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.75, y: 0.5 }, colors, disableForReducedMotion: true }), 360);
}

export default function KodFinal() {
  const [entry, setEntry] = useState("");
  const [won, setWon] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [hint, setHint] = useState(false);
  const [hint2, setHint2] = useState(false);

  const [winMs, setWinMs] = useState<number | null>(null);
  const [entries, setEntries] = useState<LbEntry[]>([]);
  const [fb, setFb] = useState<FbEntry[]>([]);
  const [name, setName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [feedback, setFeedback] = useState("");
  const [publish, setPublish] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [youAt, setYouAt] = useState<number | null>(null);
  const [othersOnly, setOthersOnly] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setHint(true), 10000);
    const id2 = setTimeout(() => setHint2(true), 22000);
    return () => { clearTimeout(id); clearTimeout(id2); };
  }, []);

  const push = (d: string) => {
    if (won || entry.length >= 4) return;
    const next = entry + d;
    setEntry(next);
    if (next.length === 4) {
      if (next === CODE) {
        setTimeout(() => {
          setWinMs(questElapsed());
          setWon(true);
          celebrate();
          loadBoard().then(setEntries);
          loadFeedback().then(setFb);
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
    const { entries: top, at } = await saveScore(name.trim() || "Гость", winMs, {
      telegram: telegram.trim(),
      feedback: feedback.trim(),
      published: publish,
    });
    setEntries(top);
    setYouAt(at);
    setSubmitted(true);
    setSubmitting(false);
    if (feedback.trim() && publish) loadFeedback().then(setFb); // обновить доску своим отзывом
    clearQuestStart(); // следующий заход — новый отсчёт
  }

  const shown = othersOnly ? entries.filter((e) => !e.tester) : entries;

  return (
    <main className="relative bg-black text-white overflow-y-auto flex flex-col items-center px-5 pt-[88px] pb-16" style={{ minHeight: "100dvh" }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(166,255,0,0.06), transparent 60%)",
      }} />

      {!won ? (
        <div className="relative z-[1] w-full max-w-[320px] mx-auto flex flex-col items-center text-center select-none">
          <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-3">Загадка №5 · финал</p>
          <h1 className="font-p95 leading-[0.95] uppercase tracking-tight mb-2" style={{ fontSize: "clamp(26px, 5vw, 44px)" }}>
            Введи код
          </h1>
          <p className="text-[13px] text-white/40 mb-8">Терминал #0000 · доступ закрыт</p>

          <div className={`flex gap-3 mb-8 transition-transform ${wrong ? "translate-x-1" : ""}`} style={wrong ? { color: "#C9A66B" } : undefined}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`w-12 h-14 rounded-md border flex items-center justify-center font-p95 text-2xl ${wrong ? "border-[#C9A66B]/60" : "border-white/20"} ${entry[i] ? "text-white" : "text-white/20"}`}>
                {entry[i] ?? "·"}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {["1","2","3","4","5","6","7","8","9"].map((d) => (
              <button key={d} type="button" onClick={() => push(d)}
                className="w-16 h-16 rounded-md border border-white/12 bg-white/[0.03] text-white/85 font-p95 text-xl hover:border-white/30 hover:bg-white/[0.07] transition-colors">
                {d}
              </button>
            ))}
            <button type="button" onClick={back}
              className="w-16 h-16 rounded-md border border-white/12 bg-white/[0.03] text-white/45 text-sm hover:border-white/30 transition-colors">←</button>
            <button type="button" onClick={() => push("0")}
              className="w-16 h-16 rounded-md border border-white/12 bg-white/[0.03] text-white/85 font-p95 text-xl hover:border-white/30 hover:bg-white/[0.07] transition-colors">0</button>
            <span className="w-16 h-16" />
          </div>

          <p className="mt-8 text-[13px] text-[#C9A66B]/85 transition-opacity duration-700 min-h-[20px] max-w-[280px]" style={{ opacity: hint ? 1 : 0 }}>
            {hint2
              ? "Загляни в заголовок вкладки браузера — цифры там."
              : "Код подбирать не нужно. Разгадка под носом."}
          </p>
        </div>
      ) : (
        <div className="relative z-[1] w-full max-w-[440px] mx-auto flex flex-col items-center text-center">
          <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-3">Квест пройден</p>
          <h1 className="font-p95 leading-none uppercase tracking-tight text-[#A6FF00] mb-4" style={{ fontSize: "clamp(40px, 11vw, 76px)" }}>
            Доступ
          </h1>
          {winMs != null ? (
            <p className="text-[15px] text-white/80 mb-8">
              Весь квест за <span className="text-[#A6FF00] tabular-nums">{fmtQuestTime(winMs)}</span>
            </p>
          ) : (
            <p className="text-sm text-white/50 mb-8">Код был в заголовке вкладки. (Время не засчитано — квест начат не с шифра.)</p>
          )}

          {winMs != null && !submitted ? (
            <div className="w-full max-w-[420px] mx-auto flex flex-col gap-2.5 mb-8 text-left">
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                maxLength={20} placeholder="Твоё имя" aria-label="Имя для таблицы лидеров"
                className="bg-white/[0.06] border border-white/15 rounded-full px-5 py-3 text-[15px] text-white placeholder:text-white/35 outline-none focus:border-[#A6FF00]/60 transition-colors"
              />
              <input
                type="text" value={telegram} onChange={(e) => setTelegram(e.target.value)}
                maxLength={80} placeholder="Телеграм для вейтлиста (необязательно)" aria-label="Телеграм для вейтлиста"
                className="bg-white/[0.06] border border-white/15 rounded-full px-5 py-3 text-[15px] text-white placeholder:text-white/35 outline-none focus:border-[#A6FF00]/60 transition-colors"
              />
              <p className="text-[12px] text-white/35 px-1 -mt-1">Напишу туда, когда выйдут новые игры. Прошедшим — тесты и приятные штуки.</p>
              <textarea
                value={feedback} onChange={(e) => setFeedback(e.target.value)}
                maxLength={500} rows={3} placeholder="Пожелание или фидбэк (необязательно)" aria-label="Фидбэк"
                className="bg-white/[0.06] border border-white/15 rounded-2xl px-5 py-3 text-[15px] text-white placeholder:text-white/35 outline-none focus:border-[#A6FF00]/60 transition-colors resize-none"
              />
              <label className="flex items-center gap-2.5 px-1 text-[13px] text-white/55 cursor-pointer select-none">
                <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)}
                  className="w-4 h-4 accent-[#A6FF00] cursor-pointer" />
                Опубликовать на доске прошедших
              </label>
              <button type="button" onClick={submit} disabled={submitting}
                className="mt-1 inline-flex items-center justify-center px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[14px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors disabled:opacity-50">
                <span className="leading-none translate-y-[1px]">{submitting ? "..." : "Отправить"}</span>
              </button>
            </div>
          ) : null}

          {submitted ? (
            <div className="w-full max-w-[420px] mx-auto mb-8 flex flex-col items-center text-center gap-3">
              <p className="text-[15px] text-white/75">Записал. {telegram.trim() ? "Добавлю в вейтлист." : ""} Спасибо, что дошёл.</p>
              {TG_CHANNEL ? (
                <a href={TG_CHANNEL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[13px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors no-underline">
                  <span className="leading-none translate-y-[1px]">Подписаться на канал</span>
                </a>
              ) : null}
            </div>
          ) : null}

          {entries.length > 0 ? (
            <div className="w-full max-w-[380px] mx-auto mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="font-p95 text-[11px] tracking-[0.22em] uppercase text-white/35">Быстрее всех</p>
                <button type="button" onClick={() => setOthersOnly((v) => !v)}
                  className="text-[11px] tracking-[0.08em] uppercase text-white/40 hover:text-[#A6FF00] transition-colors">
                  {othersOnly ? "показать всех" : "скрыть друзей/тест."}
                </button>
              </div>
              <ol className="text-left">
                {shown.map((e, i) => {
                  const mine = youAt != null && e.at === youAt;
                  return (
                    <li key={`${e.at}-${i}`} className={`flex items-center gap-3 py-2 border-b border-white/[0.05] ${mine ? "text-[#A6FF00]" : "text-white/80"}`}>
                      <span className="font-p95 tabular-nums text-[13px] w-5 text-white/35">{i + 1}</span>
                      <span className="flex-1 text-[15px] truncate">
                        {e.name}
                        {e.tester ? <span className="ml-2 text-[10px] tracking-[0.1em] uppercase text-[#C9A66B]/70 align-middle">друг/тест</span> : null}
                      </span>
                      <span className="text-[12px] text-white/45 whitespace-nowrap tabular-nums">{fmtQuestTime(e.timeMs)}</span>
                    </li>
                  );
                })}
                {shown.length === 0 ? <li className="py-2 text-sm text-white/35">Пока только друзья/тестировщики. Будь первым из остальных.</li> : null}
              </ol>
            </div>
          ) : null}

          {fb.length > 0 ? (
            <div className="w-full max-w-[420px] mx-auto mb-8 text-left">
              <p className="font-p95 text-[11px] tracking-[0.22em] uppercase text-white/35 mb-3">Стена прошедших</p>
              <div className="flex flex-col gap-2.5">
                {fb.map((f, i) => (
                  <div key={`${f.at}-${i}`} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                    <p className="text-[14px] text-white/80 leading-snug break-words">{f.feedback}</p>
                    <p className="mt-1.5 text-[11px] text-white/35">— {f.name}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mb-8 flex flex-col items-center">
            <p className="text-[13px] text-white/45 mb-3 max-w-xs">Есть ещё одна. Но в одиночку её не пройти.</p>
            <Link href="/secret/pair" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[14px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors no-underline">
              <span className="leading-none translate-y-[1px]">Кооп-загадка</span><span className="leading-none">→</span>
            </Link>
          </div>

          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/60 font-p95 text-[14px] tracking-[0.12em] uppercase hover:border-white/40 hover:text-white transition-colors no-underline">
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
            <span className="leading-none translate-y-[1px]">На главную</span>
          </Link>
        </div>
      )}
    </main>
  );
}

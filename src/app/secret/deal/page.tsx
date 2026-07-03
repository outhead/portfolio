"use client";

/**
 * Split or Steal — эпилог после игр (отдельный экран, тем же составом по ?room=).
 * Банк $500. Каждый тайно жмёт «Поделить» или «Забрать всё»:
 *  - оба «поделить» → по $250;
 *  - один «забрать всё» → ему $500 и он «крыса», второму ноль;
 *  - оба «забрать всё» → по нулям, оба «крысы».
 * Выигрыш капает в доску делёжки; пригласившему (он есть в квест-рейтинге)
 * деньги режут квест-время через Edge boost_time.
 */

import { useEffect, useRef, useState } from "react";
import LedText from "@/components/LedText";
import { LedLines } from "@/components/LedBoard";
import confetti from "canvas-confetti";
import QuestBackground from "@/components/QuestBackground";
import QuestButton from "@/components/QuestButton";
import { useLocale } from "@/lib/useLocale";
import { pick as t } from "@/lib/i18n";
import { connectRelay, type Relay } from "../pong/pongRelay";
import { submitDeal, loadDeals, boostQuestTime, type DealRow } from "../dealStore";
import { submitFeedback } from "../leaderboard";

const POT = 500;
const TG_CHANNEL = "https://t.me/aiegorka";
type Choice = "split" | "steal";
type Stage = "connecting" | "choose" | "wait" | "result";

export default function DealPage() {
  const locale = useLocale();
  const [stage, setStage] = useState<Stage>("connecting");
  const [oppName, setOppName] = useState("");
  const [result, setResult] = useState<{ mine: number; opp: number; myRat: boolean; oppRat: boolean } | null>(null);
  const [board, setBoard] = useState<DealRow[]>([]);
  const [myName, setMyName] = useState("");
  const [fbTg, setFbTg] = useState("");
  const [fbText, setFbText] = useState("");
  const [fbSending, setFbSending] = useState(false);
  const [fbDone, setFbDone] = useState(false);

  const chRef = useRef<Relay | null>(null);
  const roleRef = useRef<"host" | "guest">("host");
  const soloRef = useRef(false);
  const myNameRef = useRef("");
  const mineRef = useRef<Choice | null>(null);
  const oppRef = useRef<Choice | null>(null);
  const resolvedRef = useRef(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const code = p.get("room") || p.get("s") || "";
    roleRef.current = p.get("host") === "1" ? "host" : p.get("room") || p.get("s") ? "guest" : "host";
    try {
      const nm = (localStorage.getItem("quest_name") || "").trim().slice(0, 16);
      myNameRef.current = nm; setMyName(nm);
    } catch { /* */ }

    if (!code) { soloRef.current = true; setStage("choose"); return; }

    const ch = connectRelay(code);
    chRef.current = ch;
    const hello = { name: myNameRef.current };
    /* eslint-disable @typescript-eslint/no-explicit-any */
    ch.on("hello", (pl: any) => { if (pl?.name) setOppName(pl.name); ch.send("hello", hello); });
    ch.on("deal", (pl: any) => {
      if (pl?.choice === "split" || pl?.choice === "steal") { oppRef.current = pl.choice; resolve(); }
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */
    ch.onOpen(() => { setStage((s) => (s === "connecting" ? "choose" : s)); ch.send("hello", hello); });
    const t = setTimeout(() => setStage((s) => (s === "connecting" ? "choose" : s)), 1500);
    return () => { clearTimeout(t); ch.close(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function broadcast(choice: Choice) {
    const ch = chRef.current;
    for (let i = 0; i < 5; i++) setTimeout(() => ch?.send("deal", { choice }), i * 300);
  }

  function resolve() {
    const mine = mineRef.current, opp = oppRef.current;
    if (!mine || !opp || resolvedRef.current) return;
    resolvedRef.current = true;
    let m = 0, o = 0, mr = false, or_ = false;
    if (mine === "split" && opp === "split") { m = 250; o = 250; }
    else if (mine === "steal" && opp === "split") { m = POT; mr = true; }
    else if (mine === "split" && opp === "steal") { o = POT; or_ = true; }
    else { mr = true; or_ = true; }
    setResult({ mine: m, opp: o, myRat: mr, oppRat: or_ });
    setStage("result");
    if (m > 0 && !mr) {
      confetti({ particleCount: 120, spread: 100, startVelocity: 42, origin: { y: 0.55 },
        colors: ["#A6FF00", "#D9FF66", "#FFFFFF"], disableForReducedMotion: true });
    }
    submitDeal(myNameRef.current || t("Гость", "Guest", locale), m, mr);
    if (roleRef.current === "host" && m > 0) {
      try { const rid = localStorage.getItem("quest_row_id"); if (rid) boostQuestTime(rid, m); } catch { /* */ }
    }
    loadDeals().then(setBoard);
  }

  function pick(c: Choice) {
    if (mineRef.current) return;
    mineRef.current = c;
    if (soloRef.current) {
      // соло-тренировка: «соперник» решает случайно
      setStage("wait");
      setTimeout(() => { oppRef.current = Math.random() < 0.5 ? "split" : "steal"; resolve(); }, 900);
      return;
    }
    if (oppRef.current) resolve(); else setStage("wait");
    broadcast(c);
  }

  async function sendFb() {
    if (fbSending || fbDone || (!fbTg.trim() && !fbText.trim())) return;
    setFbSending(true);
    const ok = await submitFeedback(myNameRef.current || t("Гость", "Guest", locale), { telegram: fbTg.trim(), feedback: fbText.trim(), published: true });
    setFbSending(false);
    if (ok) setFbDone(true);
  }

  const them = oppName || t("соперник", "opponent", locale);
  const me = myName || t("ты", "you", locale);

  return (
    <main className="relative bg-black text-white overflow-y-auto flex flex-col items-center px-5 pt-[88px] pb-16" style={{ minHeight: "100dvh" }}>
      <QuestBackground palette="violet" opacity={0.3} />
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 55% 45% at 50% 35%, rgba(166,255,0,0.06), transparent 60%)",
      }} />

      <div className="relative z-[1] w-full max-w-[440px] mx-auto flex flex-col items-center text-center">
        <p className="text-white/40 mb-3">
          <span className="sr-only">{t("Делёж · банк $500", "Split · pot $500", locale)}</span>
          <LedText text={t("Делёж · банк $500", "Split · pot $500", locale)} className="h-[9px] w-auto" />
        </p>

        {stage === "connecting" ? <p className="text-white/55 text-sm mt-8">{t("Подключаюсь…", "Connecting…", locale)}</p> : null}

        {stage === "choose" || stage === "wait" ? (
          <>
            <h1 className="mb-4">
              <LedLines text={t("$500 на двоих", "$500 for two", locale)} center maxChars={20} lineClass="h-[20px] md:h-[26px]" />
            </h1>
            <p className="text-[15px] text-white/65 max-w-sm leading-relaxed mb-8">
              {t(
                "Можно поделить честно — по $250 каждому. А можно забрать всё. Но если оба жадничаете — остаётесь ни с чем. Кто забрал всё — крыса.",
                "You can split it fairly — $250 each. Or you can take it all. But if you both get greedy, you both walk away with nothing. Whoever takes it all is a rat.",
                locale,
              )}
            </p>
            {stage === "wait" ? (
              <p className="text-[15px] text-[#A6FF00]">{t("Ты выбрал. Ждём решение напарника…", "You've chosen. Waiting for your partner…", locale)}</p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                <QuestButton onClick={() => pick("split")} className="w-full sm:w-auto">{t("Поделить", "Split", locale)}</QuestButton>
                <QuestButton onClick={() => pick("steal")} variant="secondary" className="w-full sm:w-auto">{t("Забрать всё", "Take it all", locale)}</QuestButton>
              </div>
            )}
          </>
        ) : null}

        {stage === "result" && result ? (
          <>
            <h1 className={`mb-4 ${result.myRat ? "text-[#FF5A5A]" : "text-[#A6FF00]"}`}>
              <LedLines text={result.myRat ? t("Ты крыса", "You're a rat", locale) : result.mine > 0 ? t("Победа", "Victory", locale) : t("Мимо", "Missed", locale)} center maxChars={20} lineClass="h-[20px] md:h-[26px]" />
            </h1>
            <p className="text-[15px] text-white/75 max-w-sm leading-relaxed mb-2">
              {result.mine === 250
                ? t(`Поделили честно — тебе $250, ${them} $250.`, `Split fairly — $250 for you, $250 for ${them}.`, locale)
                : result.myRat && !result.oppRat
                ? t(`Ты забрал всё — $${POT}. ${them} остался ни с чем.`, `You took it all — $${POT}. ${them} got nothing.`, locale)
                : !result.myRat && result.oppRat
                ? t(`${them} забрал всё. Ты остался ни с чем — ${them} крыса.`, `${them} took it all. You got nothing — ${them} is a rat.`, locale)
                : t(`Оба решили забрать всё. По нулям. Оба крысы.`, `You both went for it all. Zero each. Both rats.`, locale)}
            </p>
            {result.mine > 0 && roleRef.current === "host" ? (
              <p className="text-[13px] text-white/40 mb-6">{t("Выигрыш срезал тебе время в квест-рейтинге.", "Your winnings shaved time off your quest ranking.", locale)}</p>
            ) : <div className="mb-6" />}

            {board.length > 0 ? (
              <div className="w-full max-w-[380px] mx-auto mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                <p className="text-white/40 mb-3">
                  <span className="sr-only">{t("Доска делёжки", "Split board", locale)}</span>
                  <LedText text={t("Доска делёжки", "Split board", locale)} className="h-[8px] w-auto" />
                </p>
                <ol className="text-left">
                  {board.map((d, i) => (
                    <li key={`${d.at}-${i}`} className="flex items-center gap-3 py-2 border-b border-white/[0.05] last:border-0">
                      <span className="w-5 text-white/35"><LedText text={String(i + 1)} className="h-[9px] w-auto" /></span>
                      <span className={`flex-1 text-[15px] truncate ${d.rat ? "text-[#FF5A5A]" : "text-white/80"}`}>
                        {d.name}
                        {d.rat ? <span className="ml-2 text-[10px] tracking-[0.1em] uppercase text-[#FF5A5A]/90 align-middle">{t("крыса", "rat", locale)}</span> : null}
                      </span>
                      <span className="text-[13px] text-white/55 whitespace-nowrap tabular-nums">${d.amount}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {/* финал: ник/телеграм + отзыв */}
            <div className="w-full max-w-[360px] mx-auto rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-center">
              {fbDone ? (
                <p className="text-[14px] text-[#A6FF00]">{t("Спасибо! Если оставил телеграм — позову на новые игры.", "Thanks! If you left your Telegram, I'll invite you to new games.", locale)}</p>
              ) : (
                <>
                  <p className="text-[14px] text-white/75 mb-3">{t("Понравилось? Оставь телеграм — позову на новые игры и расскажу о проектах.", "Enjoyed it? Leave your Telegram — I'll invite you to new games and share my projects.", locale)}</p>
                  <input value={fbTg} onChange={(e) => setFbTg(e.target.value)} maxLength={80} placeholder={t("Телеграм / ник", "Telegram / handle", locale)} aria-label={t("Телеграм", "Telegram", locale)}
                    className="w-full mb-2 bg-white/[0.06] border border-white/15 rounded-full px-4 py-2.5 text-[14px] text-white text-center placeholder:text-white/35 outline-none focus:border-[#A6FF00]/60 transition-colors" />
                  <textarea value={fbText} onChange={(e) => setFbText(e.target.value)} maxLength={500} rows={2} placeholder={t("Отзыв (необязательно)", "Feedback (optional)", locale)} aria-label={t("Отзыв", "Feedback", locale)}
                    className="w-full mb-3 bg-white/[0.06] border border-white/15 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder:text-white/35 outline-none focus:border-[#A6FF00]/60 transition-colors resize-none" />
                  <div className="flex items-center justify-center gap-3">
                    <QuestButton onClick={sendFb} disabled={fbSending || (!fbTg.trim() && !fbText.trim())}>{fbSending ? "..." : t("Оставить", "Send", locale)}</QuestButton>
                    <QuestButton href={TG_CHANNEL} external variant="secondary">{t("Канал", "Channel", locale)}</QuestButton>
                  </div>
                </>
              )}
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}

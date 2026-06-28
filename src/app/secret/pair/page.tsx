"use client";

import LedText from "@/components/LedText";
import { LedLines } from "@/components/LedBoard";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { pairCall, pairState, sendReaction, type ReactionType } from "./pairApi";
import QuestBackground from "@/components/QuestBackground";
import QuestButton from "@/components/QuestButton";
import PixelArt, { REACTION_ART } from "@/components/PixelArt";

/**
 * Кооп-загадка. Двое (можно и с одного устройства/сети — без проверки IP).
 * Смотрящий (создатель) видит нужный порядок тумблеров, но двигать не может.
 * Контроллер (зашёл по ссылке) двигает тумблеры, но цели не видит.
 * Совпало → у обоих сразу открывается финал, без кодов.
 */
const LEN = 6;

function celebrate() {
  const colors = ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"];
  confetti({ particleCount: 130, spread: 110, startVelocity: 45, origin: { y: 0.6 }, colors, disableForReducedMotion: true });
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.25, y: 0.5 }, colors, disableForReducedMotion: true }), 200);
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.75, y: 0.5 }, colors, disableForReducedMotion: true }), 360);
}

type Phase = "loading" | "viewer" | "controller" | "full" | "error" | "done";

// bits — что показываем (цель или текущее). Если передан compare — подсвечиваем
// зелёным совпадающие позиции (для ряда «сейчас» сравниваем с целью).
function Row({ bits, compare, wave }: { bits: string; compare?: string; wave?: boolean }) {
  return (
    <div className="flex gap-2.5 justify-center">
      {Array.from({ length: LEN }).map((_, i) => {
        const on = bits[i] === "1";
        const match = compare ? bits[i] === compare[i] : null;
        const labelColor =
          match === null ? "rgba(255,255,255,0.4)" : match ? "#A6FF00" : "#C9A66B";
        const borderColor =
          match === null
            ? on ? "rgba(166,255,0,0.7)" : "rgba(255,255,255,0.18)"
            : match ? "rgba(166,255,0,0.7)" : "rgba(201,166,107,0.7)";
        return (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className={`w-7 h-12 rounded-full border flex justify-center p-[3px] transition-colors duration-300 ${wave ? "tgl-wave" : ""}`}
              style={{
                animationDelay: wave ? `${i * 60}ms` : undefined,
                borderColor,
                background: on
                  ? "linear-gradient(180deg, rgba(166,255,0,0.14), rgba(166,255,0,0.06))"
                  : "rgba(255,255,255,0.04)",
                boxShadow: on
                  ? "0 0 14px rgba(166,255,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)"
                  : "inset 0 1px 5px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <div
                className="w-5 h-5 rounded-full"
                style={{
                  background: on ? "linear-gradient(180deg, #C6FF4D, #8FE000)" : "rgba(255,255,255,0.22)",
                  transform: on ? "translateY(0)" : "translateY(22px)",
                  transition: "transform 300ms cubic-bezier(0.34,1.56,0.64,1), background 200ms, box-shadow 200ms",
                  boxShadow: on ? "0 1px 4px rgba(0,0,0,0.45), 0 0 10px rgba(166,255,0,0.55)" : "0 1px 3px rgba(0,0,0,0.4)",
                }}
              />
            </div>
            <span className="text-[10px]" style={{ color: labelColor }}>
              {on ? "вкл" : "выкл"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function PairPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [id, setId] = useState<string>("");
  const [shareUrl, setShareUrl] = useState("");
  const [target, setTarget] = useState("");
  const [switches, setSwitches] = useState("0".repeat(LEN));
  const [joined, setJoined] = useState(false);
  const [solved, setSolved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState(""); // код пары — переиспользуем как комнату для пинг-понга
  const [incoming, setIncoming] = useState<{ type: ReactionType; k: number } | null>(null); // прилетевшая реакция
  const [sent, setSent] = useState<{ type: ReactionType; k: number } | null>(null); // своя — «отправлено»
  const lastReactTs = useRef(0);
  const reactInit = useRef(false);
  // Имя игрока: нужно для пинг-понга. Если его нет (гость по ссылке) — спрашиваем.
  const [needName, setNeedName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const targetRef = useRef("");
  const claimedRef = useRef(false);
  const solvedRef = useRef(false);
  const pendingFlips = useRef(0);  // сколько flip-запросов в полёте — пока >0, поллинг не перетирает switches
  const lastFlipAt = useRef(0);    // когда контроллер последний раз щёлкал — чтобы поллинг не «отскакивал» тумблеры
  const switchesRef = useRef("0".repeat(LEN));
  const setSw = (s: string) => { switchesRef.current = s; setSwitches(s); };
  const initRef = useRef(false);
  const ctlKey = useRef("");      // ключ контроллера — авторизация flip (IP может меняться под VPN)
  const tokenRef = useRef("");

  // join: ключ из sessionStorage переживает смену IP. force:1 всегда — проверки
  // «разные IP» больше нет, можно играть и с одного устройства/сети.
  async function joinPair(s: string) {
    const stored = (() => { try { return sessionStorage.getItem(`pair_key_${s}`) || ""; } catch { return ""; } })();
    const r = await pairCall("join", { token: s, key: stored, force: 1 });
    if (r.error === "full") return setPhase("full");
    if (r.error || !r.id) return setPhase("error");
    if (typeof r.key === "string" && r.key) {
      ctlKey.current = r.key;
      try { sessionStorage.setItem(`pair_key_${s}`, r.key); } catch { /* */ }
    }
    setId(String(r.id));
    setToken(s);
    setSw(String(r.switches || "0".repeat(LEN)));
    setSolved(!!r.solved);
    setPhase("controller");
  }

  // init: создаём или присоединяемся
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const s = new URLSearchParams(window.location.search).get("s");
    tokenRef.current = s || "";
    (async () => {
      if (s) {
        await joinPair(s);
      } else {
        const r = await pairCall("create");
        if (r.error || !r.id) return setPhase("error");
        setId(String(r.id));
        setTarget(String(r.target));
        targetRef.current = String(r.target);
        setSw(String(r.switches || "0".repeat(LEN)));
        setToken(String(r.token));
        setShareUrl(`${window.location.origin}/secret/pair?s=${r.token}`);
        setPhase("viewer");
      }
    })();
  }, []);

  // поллинг состояния
  useEffect(() => {
    if (!id || solved) return;
    const iv = setInterval(async () => {
      const st = await pairState(id);
      if (!st) return;
      // Смотрящий (есть target) всегда берёт switches с сервера. Контроллер — только
      // когда не в полёте flip И не щёлкал ~1.8с: иначе поллинг, стартовавший ДО флипа,
      // возвращается ПОСЛЕ и «отскакивает» тумблер назад. Простой больше 1.8с — самовосстановление.
      const canApply = targetRef.current
        ? pendingFlips.current === 0
        : pendingFlips.current === 0 && performance.now() - lastFlipAt.current > 4000;
      if (canApply) setSw(st.switches);
      setJoined(st.joined);
      if (st.solved && !solvedRef.current) {
        solvedRef.current = true;
        setSolved(true);
        celebrate();
      }
      // смотрящий знает target → как только совпало, забирает ключ
      if (!claimedRef.current && targetRef.current && st.switches === targetRef.current) {
        claimedRef.current = true;
        const r = await pairCall("claim", { id });
        if (r.ok && !solvedRef.current) {
          solvedRef.current = true;
          setSolved(true);
          celebrate();
        }
      }
      // реакция напарника (формат "by:type:ts"); при первом опросе только запоминаем,
      // чтобы не показывать старую реакцию при заходе
      if (st.react) {
        const [by, type, tsStr] = st.react.split(":");
        const ts = Number(tsStr) || 0;
        const mySide = targetRef.current ? "a" : "b";
        if (!reactInit.current) { reactInit.current = true; lastReactTs.current = ts; }
        else if (ts > lastReactTs.current) {
          lastReactTs.current = ts;
          if (by !== mySide && REACTION_ART[type]) {
            setIncoming({ type: type as ReactionType, k: ts });
          }
        }
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [id, solved]);

  // прилетевшая реакция живёт ~1.7с
  useEffect(() => {
    if (!incoming) return;
    const t = setTimeout(() => setIncoming(null), 1900);
    return () => clearTimeout(t);
  }, [incoming]);
  // «отправлено» — короткий фидбэк отправителю
  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => setSent(null), 1000);
    return () => clearTimeout(t);
  }, [sent]);

  // нет имени (обычно гость по ссылке) → спросим перед игрой
  useEffect(() => {
    try { if (!(localStorage.getItem("quest_name") || "").trim()) setNeedName(true); } catch { /* */ }
  }, []);
  function saveName() {
    const n = nameInput.trim().slice(0, 16);
    if (!n) return;
    try { localStorage.setItem("quest_name", n); } catch { /* */ }
    setNeedName(false);
  }

  async function flip(i: number) {
    if (solved) return;
    try { navigator.vibrate?.(10); } catch { /* iOS молчит — ок */ }
    // Оптимистично: переключаем мгновенно, сервер подтверждает в фоне.
    // Шлём ЦЕЛЕВОЕ значение (не toggle) — повторы и гонки идемпотентны.
    const next = switchesRef.current.split("");
    const want = next[i] === "1" ? "0" : "1";
    next[i] = want;
    setSw(next.join(""));
    lastFlipAt.current = performance.now();
    pendingFlips.current++;
    try {
      // до 3 попыток: сеть под VPN нестабильна, а откат тумблера поллингом
      // выглядит как «залипшая кнопка»
      for (let attempt = 0; attempt < 3; attempt++) {
        const r = await pairCall("flip", { id, index: i, value: want, key: ctlKey.current });
        if (typeof r.switches === "string") {
          if (pendingFlips.current === 1) setSw(r.switches);
          lastFlipAt.current = performance.now();
          return;
        }
        // forbidden после смены IP — реджойн по ключу и повтор
        if (r.error === "forbidden" && tokenRef.current) {
          await pairCall("join", { token: tokenRef.current, key: ctlKey.current });
        }
        await new Promise((res) => setTimeout(res, 450));
      }
    } finally {
      pendingFlips.current--;
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }

  // реакции напарнику: смотрящий — сторона "a", контроллер — "b"
  function react(type: ReactionType) {
    if (!id) return;
    try { navigator.vibrate?.(12); } catch { /* */ }
    setSent({ type, k: Date.now() }); // фидбэк: отправитель видит, что улетело
    sendReaction(id, phase === "viewer" ? "a" : "b", type);
  }
  const REACTIONS: { type: ReactionType; label: string }[] = [
    { type: "up", label: "Палец вверх" },
    { type: "left", label: "Левее" },
    { type: "right", label: "Правее" },
    { type: "poop", label: "Какашка" },
  ];
  const reactionBar = (
    <div className="mt-8 flex flex-col items-center gap-2.5 relative">
      <span className="text-[11px] uppercase tracking-[0.12em] text-white/35">кинь реакцию напарнику</span>
      <div className="flex items-center justify-center gap-2.5">
        {REACTIONS.map((r) => (
          <button
            key={r.type}
            type="button"
            onClick={() => react(r.type)}
            aria-label={r.label}
            className="w-14 h-14 inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.12] hover:border-[#A6FF00]/50 active:scale-90 transition-all"
          >
            <PixelArt art={REACTION_ART[r.type]} grid={false} className="h-9 w-auto block" />
          </button>
        ))}
      </div>
      {/* фидбэк отправителю: иконка улетает вверх + «отправлено» */}
      {sent ? (
        <div key={sent.k} className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-7">
          <PixelArt art={REACTION_ART[sent.type]} grid={false} className="h-11 w-auto sent-fly" />
        </div>
      ) : null}
      <span className="h-4 text-[11px] text-[#A6FF00] transition-opacity" style={{ opacity: sent ? 1 : 0 }}>
        отправлено
      </span>
    </div>
  );

  return (
    <main className="relative bg-black text-white overflow-y-auto flex flex-col items-center px-5 pt-[88px] pb-16" style={{ minHeight: "100dvh" }}>
      <QuestBackground palette="violet" opacity={0.34} />
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 55% 45% at 50% 35%, rgba(166,255,0,0.06), transparent 60%)",
      }} />

      {/* гейт имени: без имени в игру не пускаем (нужно для подписи в пинг-понге) */}
      {needName ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center bg-black/85 backdrop-blur-sm">
          <p className="text-white/40 mb-3"><LedText text="Как тебя зовут" className="h-[9px] w-auto" /></p>
          <p className="text-[14px] text-white/50 mb-5 max-w-xs">Имя увидит напарник в игре.</p>
          <input
            type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveName(); }}
            maxLength={16} placeholder="Имя" aria-label="Имя"
            className="w-full max-w-[280px] bg-white/[0.06] border border-white/15 rounded-full px-5 py-3.5 text-[15px] text-white text-center placeholder:text-white/35 outline-none focus:border-[#A6FF00]/60 transition-colors"
          />
          <QuestButton onClick={saveName} disabled={!nameInput.trim()} className="mt-4">Продолжить</QuestButton>
        </div>
      ) : null}

      {/* прилетевшая реакция от напарника — крупное LED-табло, точки загораются волной */}
      {incoming ? (
        <div key={incoming.k} className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center">
          <div className="led-show" style={{ height: "min(56vw, 56vh)" }}>
            <PixelArt art={REACTION_ART[incoming.type]} animate className="h-full w-auto" />
          </div>
        </div>
      ) : null}

      <style jsx>{`
        @keyframes ledOn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ledShow {
          0%   { opacity: 0; transform: scale(0.9); }
          10%  { opacity: 1; transform: scale(1); }
          84%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.03); }
        }
        @keyframes sentFly {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          18%  { opacity: 1; }
          100% { transform: translateY(-52px) scale(0.6); opacity: 0; }
        }
        :global(.led-dot) { animation: ledOn 0.26s ease-out backwards; }
        :global(.led-show) { animation: ledShow 1.9s ease-out forwards; }
        :global(.sent-fly) { animation: sentFly 0.9s ease-out forwards; }
      `}</style>

      <div className="relative z-[1] w-full max-w-[480px] mx-auto flex flex-col items-center text-center">
        <p className="text-white/40 mb-5">
          <span className="sr-only">Кооп · последняя загадка</span>
          <LedText text="Кооп · последняя загадка" className="h-[9px] w-auto" />
        </p>

        {phase === "loading" ? <p className="text-white/50 text-sm mt-10">Соединяю…</p> : null}

        {phase === "error" ? (
          <>
            <h1 className="mb-4 flex justify-center"><span className="sr-only">Сбой связи</span><LedText text="Сбой связи" scale={2} dot={1.45} className="h-[20px] md:h-[26px] w-auto" /></h1>
            <p className="text-white/55 text-sm mb-8 max-w-xs">Не удалось открыть сессию. Попробуй обновить страницу.</p>
            <Link href="/secret/lab/kod" className="text-[14px] text-white/40 hover:text-white/70 no-underline">← К терминалу</Link>
          </>
        ) : null}

        {phase === "full" ? (
          <>
            <h1 className="mb-4 flex justify-center"><span className="sr-only">Занято</span><LedText text="Занято" scale={2} dot={1.45} className="h-[20px] md:h-[26px] w-auto" /></h1>
            <p className="text-white/55 text-sm max-w-xs">В этой сессии уже двое. Пусть напарник создаст новую.</p>
          </>
        ) : null}

        {/* СМОТРЯЩИЙ */}
        {phase === "viewer" ? (
          <>
            <h1 className="mb-3">
              <LedLines text="Ты видишь, как надо" center maxChars={20} lineClass="h-[17px] md:h-[24px]" />
            </h1>
            <p className="text-[14px] text-white/55 max-w-sm mb-8">
              Переключить тумблеры можешь не ты. Диктуй напарнику нужный порядок.
            </p>

            <p className="text-white/35 mb-3">
              <span className="sr-only">Цель</span>
              <LedText text="Цель" className="h-[8px] w-auto" />
            </p>
            <Row bits={target} />

            <p className="text-white/35 mt-8 mb-3">
              <span className="sr-only">Сейчас у напарника</span>
              <LedText text="Сейчас у напарника" className="h-[8px] w-auto" />
            </p>
            <Row bits={switches} compare={target} wave={solved} />

            {!solved ? (
              <div className="mt-10 w-full flex flex-col items-center">
                {!joined ? (
                  <>
                    <p className="text-[14px] text-white/50 mb-3">Отправь ссылку второму игроку (на другом устройстве):</p>
                    <QuestButton onClick={copy}>{copied ? "скопировано" : "копировать ссылку"}</QuestButton>
                    <p className="mt-4 text-[12px] text-white/30 break-all max-w-xs">{shareUrl}</p>
                  </>
                ) : (
                  <>
                    <p className="text-[14px] text-[#A6FF00]">Напарник на связи. Диктуй порядок.</p>
                    {reactionBar}
                  </>
                )}
              </div>
            ) : (
              <div className="mt-10 flex flex-col items-center">
                <p className="text-[#A6FF00] mb-2 flex justify-center"><span className="sr-only">Сошлось!</span><LedText text="Сошлось!" scale={2} dot={1.45} className="h-[20px] md:h-[26px] w-auto" /></p>
                <p className="text-[14px] text-white/55 max-w-xs">Вы сделали это вдвоём. Финал открыт у обоих.</p>
                <QuestButton href={`/secret/pair/done?room=${token}&host=1`} arrow className="mt-6">Дальше</QuestButton>
              </div>
            )}
          </>
        ) : null}

        {/* КОНТРОЛЛЕР */}
        {phase === "controller" ? (
          <>
            <h1 className="mb-3">
              <LedLines text="Ты переключаешь" center maxChars={20} lineClass="h-[17px] md:h-[24px]" />
            </h1>
            <p className="text-[14px] text-white/55 max-w-sm mb-10">
              Порядок видит напарник. Слушай его и щёлкай тумблеры.
            </p>

            <div className="flex gap-2.5 justify-center">
              {Array.from({ length: LEN }).map((_, i) => {
                const on = switches[i] === "1";
                return (
                  <button key={i} type="button" onClick={() => flip(i)} disabled={solved}
                    aria-label={`Тумблер ${i + 1}: ${on ? "вкл" : "выкл"}`} aria-pressed={on}
                    className="flex flex-col items-center gap-2 group disabled:opacity-60">
                    <div className={`w-12 h-[72px] rounded-full border flex justify-center p-1.5 transition-all duration-300 group-active:scale-95 group-hover:border-white/40 ${solved ? "tgl-wave" : ""}`}
                      style={{
                        animationDelay: solved ? `${i * 60}ms` : undefined,
                        borderColor: on ? "rgba(166,255,0,0.8)" : "rgba(255,255,255,0.18)",
                        background: on
                          ? "linear-gradient(180deg, rgba(166,255,0,0.14), rgba(166,255,0,0.06))"
                          : "rgba(255,255,255,0.03)",
                        boxShadow: on
                          ? "0 0 20px rgba(166,255,0,0.22), inset 0 0 10px rgba(166,255,0,0.10), inset 0 1px 0 rgba(255,255,255,0.10)"
                          : "inset 0 2px 8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
                      }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{
                          background: on
                            ? "linear-gradient(180deg, #C6FF4D, #8FE000)"
                            : "rgba(255,255,255,0.22)",
                          transform: on ? "translateY(0)" : "translateY(24px)",
                          transition: "transform 320ms cubic-bezier(0.34,1.56,0.64,1), background 200ms, box-shadow 320ms",
                          boxShadow: on
                            ? "0 2px 6px rgba(0,0,0,0.5), 0 0 16px rgba(166,255,0,0.6)"
                            : "0 2px 4px rgba(0,0,0,0.45)",
                        }}>
                        <div className="w-1.5 h-1.5 rounded-full"
                          style={{ background: on ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.35)", transition: "background 200ms" }} />
                      </div>
                    </div>
                    <span className="text-[10px] transition-colors duration-300"
                      style={{ color: on ? "rgba(166,255,0,0.75)" : "rgba(255,255,255,0.35)" }}>{i + 1}</span>
                  </button>
                );
              })}
            </div>

            {!solved ? (
              <>
                <p className="mt-10 text-[14px] text-white/40">Напарник скажет, когда сойдётся.</p>
                {reactionBar}
              </>
            ) : (
              <div className="mt-10 flex flex-col items-center">
                <p className="text-[#A6FF00] mb-2 flex justify-center"><span className="sr-only">Сошлось!</span><LedText text="Сошлось!" scale={2} dot={1.45} className="h-[20px] md:h-[26px] w-auto" /></p>
                <p className="text-[14px] text-white/55 max-w-xs">Вы сделали это вдвоём. Финал открыт у обоих.</p>
                <QuestButton href={`/secret/pair/done?room=${token}`} arrow className="mt-6">Дальше</QuestButton>
              </div>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}

"use client";

import LedText from "@/components/LedText";
import { LedLines } from "@/components/LedBoard";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { pairCall, pairState } from "./pairApi";
import QuestBackground from "@/components/QuestBackground";

/**
 * Кооп-загадка. Двое, разные IP.
 * Смотрящий (создатель) видит нужный порядок тумблеров, но двигать не может.
 * Контроллер (зашёл по ссылке с другого IP) двигает тумблеры, но цели не видит.
 * Совпало → у обоих сразу открывается финал, без кодов.
 * Тот же IP, что у создателя → блок с намёком про «вторую руку».
 */
const LEN = 6;

function celebrate() {
  const colors = ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"];
  confetti({ particleCount: 130, spread: 110, startVelocity: 45, origin: { y: 0.6 }, colors, disableForReducedMotion: true });
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.25, y: 0.5 }, colors, disableForReducedMotion: true }), 200);
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.75, y: 0.5 }, colors, disableForReducedMotion: true }), 360);
}

type Phase = "loading" | "viewer" | "controller" | "same_ip" | "full" | "error" | "done";

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

  const targetRef = useRef("");
  const claimedRef = useRef(false);
  const solvedRef = useRef(false);
  const pendingFlips = useRef(0);  // сколько flip-запросов в полёте — пока >0, поллинг не перетирает switches
  const lastFlipAt = useRef(0);    // когда контроллер последний раз щёлкал — чтобы поллинг не «отскакивал» тумблеры
  const switchesRef = useRef("0".repeat(LEN));
  const setSw = (s: string) => { switchesRef.current = s; setSwitches(s); };
  const initRef = useRef(false);

  // init: создаём или присоединяемся
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const s = new URLSearchParams(window.location.search).get("s");
    (async () => {
      if (s) {
        const r = await pairCall("join", { token: s });
        if (r.error === "same_ip") return setPhase("same_ip");
        if (r.error === "full") return setPhase("full");
        if (r.error || !r.id) return setPhase("error");
        setId(String(r.id));
        setToken(s);
        setSw(String(r.switches || "0".repeat(LEN)));
        setSolved(!!r.solved);
        setPhase("controller");
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
        : pendingFlips.current === 0 && performance.now() - lastFlipAt.current > 1800;
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
    }, 1000);
    return () => clearInterval(iv);
  }, [id, solved]);

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
      const r = await pairCall("flip", { id, index: i, value: want });
      // применяем ответ сервера только если это последний запрос в полёте
      if (typeof r.switches === "string" && pendingFlips.current === 1) setSw(r.switches);
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

  return (
    <main className="relative bg-black text-white overflow-y-auto flex flex-col items-center px-5 pt-[88px] pb-16" style={{ minHeight: "100dvh" }}>
      <QuestBackground palette="violet" opacity={0.34} />
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 55% 45% at 50% 35%, rgba(166,255,0,0.06), transparent 60%)",
      }} />

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
            <Link href="/secret/lab/kod" className="text-[13px] text-white/40 hover:text-white/70 no-underline">← К терминалу</Link>
          </>
        ) : null}

        {phase === "same_ip" ? (
          <>
            <h1 className="mb-5 flex justify-center"><span className="sr-only">Хм.</span><LedText text="Хм." scale={2} dot={1.45} className="h-[20px] md:h-[28px] w-auto" /></h1>
            <p className="text-[15px] text-white/70 max-w-xs leading-relaxed mb-3">
              Я вижу, как ты пытаешься меня обмануть. Тебе нужен кто-то — дальше, чем твоя вторая рука.
            </p>
            <p className="text-[13px] text-white/35 max-w-xs">Придётся постараться по-настоящему.</p>
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
            <p className="text-[13px] text-white/55 max-w-sm mb-8">
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
                    <p className="text-[13px] text-white/50 mb-3">Отправь ссылку второму игроку (на другом устройстве):</p>
                    <button type="button" onClick={copy}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] hover:bg-[#A6FF00] hover:text-black transition-colors">
                      <span className="leading-none translate-y-[1px]">{copied ? "скопировано" : "копировать ссылку"}</span>
                    </button>
                    <p className="mt-4 text-[11px] text-white/30 break-all max-w-xs">{shareUrl}</p>
                  </>
                ) : (
                  <p className="text-[14px] text-[#A6FF00]">Напарник на связи. Диктуй порядок.</p>
                )}
              </div>
            ) : (
              <div className="mt-10 flex flex-col items-center">
                <p className="text-[#A6FF00] mb-2 flex justify-center"><span className="sr-only">Сошлось!</span><LedText text="Сошлось!" scale={2} dot={1.45} className="h-[20px] md:h-[26px] w-auto" /></p>
                <p className="text-[13px] text-white/55 max-w-xs">Вы сделали это вдвоём. Финал открыт у обоих.</p>
                <Link href={`/secret/pair/done?room=${token}&host=1`} className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] hover:bg-[#A6FF00] hover:text-black transition-colors no-underline">
                  <span className="sr-only">Дальше</span><LedText text="Дальше" className="h-[10px] w-auto" /><LedText text="→" className="h-[11px] w-auto" />
                </Link>
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
            <p className="text-[13px] text-white/55 max-w-sm mb-10">
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
              <p className="mt-10 text-[13px] text-white/40">Напарник скажет, когда сойдётся.</p>
            ) : (
              <div className="mt-10 flex flex-col items-center">
                <p className="text-[#A6FF00] mb-2 flex justify-center"><span className="sr-only">Сошлось!</span><LedText text="Сошлось!" scale={2} dot={1.45} className="h-[20px] md:h-[26px] w-auto" /></p>
                <p className="text-[13px] text-white/55 max-w-xs">Вы сделали это вдвоём. Финал открыт у обоих.</p>
                <Link href={`/secret/pair/done?room=${token}`} className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] hover:bg-[#A6FF00] hover:text-black transition-colors no-underline">
                  <span className="sr-only">Дальше</span><LedText text="Дальше" className="h-[10px] w-auto" /><LedText text="→" className="h-[11px] w-auto" />
                </Link>
              </div>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}

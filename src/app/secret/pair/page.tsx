"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";
import { pairCall, pairState } from "./pairApi";

/**
 * Кооп-загадка. Двое, разные IP.
 * Смотрящий (создатель) видит нужный порядок тумблеров, но двигать не может.
 * Контроллер (зашёл по ссылке с другого IP) двигает тумблеры, но цели не видит.
 * Совпало → смотрящему открывается ключ; он диктует напарнику, тот вводит → дальше.
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
function Row({ bits, compare }: { bits: string; compare?: string }) {
  return (
    <div className="flex gap-2.5 justify-center">
      {Array.from({ length: LEN }).map((_, i) => {
        const on = bits[i] === "1";
        const match = compare ? bits[i] === compare[i] : null;
        const labelColor =
          match === null ? "rgba(255,255,255,0.4)" : match ? "#A6FF00" : "#C9A66B";
        return (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className="w-9 h-9 rounded-full border transition-colors"
              style={{
                background: on ? "#A6FF00" : "rgba(255,255,255,0.05)",
                borderColor: on ? "#A6FF00" : "rgba(255,255,255,0.18)",
                boxShadow: on ? "0 0 10px rgba(166,255,0,0.5)" : "none",
              }}
            />
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
  const [reward, setReward] = useState("");
  const [flipping, setFlipping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [keyWrong, setKeyWrong] = useState(false);
  const [ctrlDone, setCtrlDone] = useState(false);
  const [token, setToken] = useState(""); // код пары — переиспользуем как комнату для пинг-понга

  const targetRef = useRef("");
  const claimedRef = useRef(false);
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
        setSwitches(String(r.switches || "0".repeat(LEN)));
        setSolved(!!r.solved);
        setPhase("controller");
      } else {
        const r = await pairCall("create");
        if (r.error || !r.id) return setPhase("error");
        setId(String(r.id));
        setTarget(String(r.target));
        targetRef.current = String(r.target);
        setSwitches(String(r.switches || "0".repeat(LEN)));
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
      setSwitches(st.switches);
      setJoined(st.joined);
      if (st.solved) setSolved(true);
      // смотрящий знает target → как только совпало, забирает ключ
      if (!claimedRef.current && targetRef.current && st.switches === targetRef.current) {
        claimedRef.current = true;
        const r = await pairCall("claim", { id });
        if (r.ok) {
          setReward(String(r.reward));
          setSolved(true);
          celebrate();
        }
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [id, solved]);

  async function flip(i: number) {
    if (flipping || solved) return;
    setFlipping(true);
    const r = await pairCall("flip", { id, index: i });
    if (typeof r.switches === "string") setSwitches(r.switches);
    setFlipping(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }

  async function submitKey() {
    const r = await pairCall("unlock", { id, key: keyInput.trim() });
    if (r.ok) { setCtrlDone(true); celebrate(); }
    else { setKeyWrong(true); setTimeout(() => setKeyWrong(false), 700); }
  }

  return (
    <main className="relative bg-black text-white overflow-y-auto flex flex-col items-center px-5 pt-[88px] pb-16" style={{ minHeight: "100dvh" }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: "radial-gradient(ellipse 55% 45% at 50% 35%, rgba(166,255,0,0.06), transparent 60%)",
      }} />

      <div className="relative z-[1] w-full max-w-[480px] mx-auto flex flex-col items-center text-center">
        <p className="font-p95 text-[12px] tracking-[0.25em] uppercase text-white/40 mb-5">Кооп · последняя загадка</p>

        {phase === "loading" ? <p className="text-white/50 text-sm mt-10">Соединяю…</p> : null}

        {phase === "error" ? (
          <>
            <h1 className="font-p95 uppercase tracking-tight mb-4" style={{ fontSize: "clamp(28px,5vw,44px)" }}>Сбой связи</h1>
            <p className="text-white/55 text-sm mb-8 max-w-xs">Не удалось открыть сессию. Попробуй обновить страницу.</p>
            <Link href="/secret/lab/kod" className="text-[13px] text-white/40 hover:text-white/70 no-underline">← К терминалу</Link>
          </>
        ) : null}

        {phase === "same_ip" ? (
          <>
            <h1 className="font-p95 uppercase tracking-tight mb-5" style={{ fontSize: "clamp(28px,5.5vw,48px)" }}>Хм.</h1>
            <p className="text-[15px] text-white/70 max-w-xs leading-relaxed mb-3">
              Я вижу, как ты пытаешься меня обмануть. Тебе нужен кто-то — дальше, чем твоя вторая рука.
            </p>
            <p className="text-[13px] text-white/35 max-w-xs">Придётся постараться по-настоящему.</p>
          </>
        ) : null}

        {phase === "full" ? (
          <>
            <h1 className="font-p95 uppercase tracking-tight mb-4" style={{ fontSize: "clamp(28px,5vw,44px)" }}>Занято</h1>
            <p className="text-white/55 text-sm max-w-xs">В этой сессии уже двое. Пусть напарник создаст новую.</p>
          </>
        ) : null}

        {/* СМОТРЯЩИЙ */}
        {phase === "viewer" ? (
          <>
            <h1 className="font-p95 leading-[1.05] uppercase tracking-tight mb-3" style={{ fontSize: "clamp(24px,4.5vw,40px)" }}>
              Ты видишь, как надо
            </h1>
            <p className="text-[13px] text-white/55 max-w-sm mb-8">
              Переключить тумблеры можешь не ты. Диктуй напарнику нужный порядок.
            </p>

            <p className="font-p95 text-[11px] tracking-[0.22em] uppercase text-white/35 mb-3">Цель</p>
            <Row bits={target} />

            <p className="font-p95 text-[11px] tracking-[0.22em] uppercase text-white/35 mt-8 mb-3">Сейчас у напарника</p>
            <Row bits={switches} compare={target} />

            {!solved ? (
              <div className="mt-10 w-full flex flex-col items-center">
                {!joined ? (
                  <>
                    <p className="text-[13px] text-white/50 mb-3">Отправь ссылку второму игроку (на другом устройстве):</p>
                    <button type="button" onClick={copy}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[13px] tracking-[0.1em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors">
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
                <p className="text-[14px] text-white/70 mb-2">Сошлось. Ключ:</p>
                <p className="font-p95 text-[#A6FF00] tracking-[0.2em]" style={{ fontSize: "clamp(34px,9vw,56px)" }}>{reward}</p>
                <p className="mt-3 text-[13px] text-white/55 max-w-xs">Продиктуй его напарнику — он введёт и откроет финал.</p>
                <Link href={`/secret/pair/done?room=${token}&host=1`} className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[13px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors no-underline">
                  <span className="leading-none translate-y-[1px]">Дальше</span><span className="leading-none">→</span>
                </Link>
              </div>
            )}
          </>
        ) : null}

        {/* КОНТРОЛЛЕР */}
        {phase === "controller" ? (
          <>
            <h1 className="font-p95 leading-[1.05] uppercase tracking-tight mb-3" style={{ fontSize: "clamp(24px,4.5vw,40px)" }}>
              Ты переключаешь
            </h1>
            <p className="text-[13px] text-white/55 max-w-sm mb-10">
              Порядок видит напарник. Слушай его и щёлкай тумблеры.
            </p>

            <div className="flex gap-2.5 justify-center">
              {Array.from({ length: LEN }).map((_, i) => {
                const on = switches[i] === "1";
                return (
                  <button key={i} type="button" onClick={() => flip(i)} disabled={flipping || solved}
                    className="flex flex-col items-center gap-2 group disabled:opacity-60">
                    <div className="w-11 h-16 rounded-full border flex items-start justify-center p-1 transition-colors"
                      style={{ borderColor: on ? "#A6FF00" : "rgba(255,255,255,0.2)", background: on ? "rgba(166,255,0,0.12)" : "rgba(255,255,255,0.03)" }}>
                      <div className="w-9 h-9 rounded-full transition-transform"
                        style={{ background: on ? "#A6FF00" : "rgba(255,255,255,0.25)", transform: on ? "translateY(0)" : "translateY(28px)", boxShadow: on ? "0 0 10px rgba(166,255,0,0.5)" : "none" }} />
                    </div>
                    <span className="text-[10px] text-white/35">{i + 1}</span>
                  </button>
                );
              })}
            </div>

            {!solved ? (
              <p className="mt-10 text-[13px] text-white/40">Напарник скажет, когда сойдётся.</p>
            ) : ctrlDone ? (
              <div className="mt-10 flex flex-col items-center">
                <p className="text-[15px] text-[#A6FF00] mb-4">Ключ принят.</p>
                <Link href={`/secret/pair/done?room=${token}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[13px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors no-underline">
                  <span className="leading-none translate-y-[1px]">Дальше</span><span className="leading-none">→</span>
                </Link>
              </div>
            ) : (
              <div className="mt-10 w-full max-w-[280px] mx-auto flex flex-col items-center">
                <p className="text-[14px] text-white/70 mb-3">Сошлось! Напарник назовёт ключ — введи его.</p>
                <input
                  value={keyInput} onChange={(e) => setKeyInput(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                  onKeyDown={(e) => { if (e.key === "Enter") submitKey(); }}
                  inputMode="numeric" placeholder="••••" aria-label="Ключ от напарника"
                  className={`w-full text-center tracking-[0.4em] font-p95 text-2xl bg-white/[0.06] border rounded-full px-5 py-3 text-white outline-none transition-colors ${keyWrong ? "border-[#C9A66B]" : "border-white/15 focus:border-[#A6FF00]/60"}`}
                />
                <button type="button" onClick={submitKey}
                  className="mt-3 inline-flex items-center justify-center px-6 py-3 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[13px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors">
                  <span className="leading-none translate-y-[1px]">Ввести</span>
                </button>
              </div>
            )}
          </>
        ) : null}

        <Link href="/" className="mt-12 inline-flex items-center gap-1.5 text-[13px] text-white/30 hover:text-white/60 transition-colors no-underline">
          <ArrowLeft className="w-3 h-3" strokeWidth={2.2} /> На главную
        </Link>
      </div>
    </main>
  );
}

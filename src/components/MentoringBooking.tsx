"use client";

import { useEffect, useMemo, useState } from "react";
import LedText from "@/components/LedText";
import {
  loadFreeSlots,
  createBooking,
  downloadIcs,
  slotTime,
  slotFull,
  type DayGroup,
} from "@/lib/mentoringBooking";

const inputCls =
  "w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-[15px] text-white/90 placeholder:text-white/30 outline-none focus:border-[#A6FF00]/50 transition-colors";

export default function MentoringBooking() {
  const [groups, setGroups] = useState<DayGroup[] | null>(null);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [step, setStep] = useState<"time" | "form" | "done">("time");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [topic, setTopic] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<"taken" | "error" | null>(null);

  useEffect(() => {
    loadFreeSlots().then((g) => {
      setGroups(g);
      if (g.length) setDayKey(g[0].key);
    });
  }, []);

  const day = useMemo(
    () => groups?.find((g) => g.key === dayKey) ?? null,
    [groups, dayKey],
  );

  const pickTime = (iso: string) => {
    setSlot(iso);
    setErr(null);
    setStep("form");
  };

  const reload = () => {
    setGroups(null);
    setSlot(null);
    setStep("time");
    loadFreeSlots().then((g) => {
      setGroups(g);
      setDayKey(g.length ? g[0].key : null);
    });
  };

  const submit = async () => {
    if (!slot || !name.trim() || !contact.trim()) return;
    setSending(true);
    setErr(null);
    const res = await createBooking({
      slotIso: slot,
      name: name.trim(),
      contact: contact.trim(),
      topic: topic.trim() || undefined,
    });
    setSending(false);
    if (res.ok) setStep("done");
    else if (res.taken) {
      setErr("taken");
      reload();
    } else setErr("error");
  };

  // ── Успех ───────────────────────────────────────────────
  if (step === "done" && slot) {
    return (
      <div className="rounded-2xl border border-[#A6FF00]/25 bg-[#0f0f0e] p-5 md:p-6">
        <div className="flex items-center gap-2 text-[#A6FF00] mb-3">
          <LedText text="Готово" className="h-[11px] w-auto" />
        </div>
        <p className="text-[15px] text-white/80 mb-1.5">{slotFull(slot)}</p>
        <p className="text-[13px] text-white/50 leading-relaxed mb-5 max-w-md">
          Подтвержу в&nbsp;течение дня в&nbsp;Telegram и&nbsp;пришлю ссылку на&nbsp;встречу.
        </p>
        <button
          type="button"
          onClick={() => downloadIcs(slot)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#A6FF00] text-black hover:bg-white transition-colors"
        >
          <LedText text="В календарь" className="h-[10px] w-auto" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f0e] p-5 md:p-6">
      {/* Шаги */}
      <div className="flex items-center gap-2 mb-4 text-[12px] tracking-wide">
        <span className={step === "time" ? "text-[#A6FF00]" : "text-white/35"}>
          1 · Когда
        </span>
        <span className="text-white/20">→</span>
        <span className={step === "form" ? "text-[#A6FF00]" : "text-white/35"}>
          2 · Контакты
        </span>
      </div>

      {groups === null ? (
        <div className="text-white/40 text-[14px] py-2">Загружаю свободные окна…</div>
      ) : groups.length === 0 ? (
        <div className="text-white/55 text-[14px] py-2 leading-relaxed">
          Свободных окон на&nbsp;ближайшие недели нет. Напиши в&nbsp;Telegram —
          подберём время:{" "}
          <a href="https://t.me/egoradi" target="_blank" rel="noopener noreferrer" className="text-[#A6FF00] no-underline">
            @egoradi
          </a>
        </div>
      ) : step === "time" ? (
        // ── Шаг 1: день → время ───────────────────────────
        <div>
          <p className="text-[13px] text-white/45 mb-3">Будни пн–чт, 18:00–21:00 МСК · ~60 минут</p>

          {/* Дни — сетка с переносом, все видны сразу */}
          <div className="flex flex-wrap gap-2 mb-5">
            {groups.map((g) => {
              const active = g.key === dayKey;
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setDayKey(g.key)}
                  className={
                    "px-3 py-2 rounded-xl border text-center leading-tight transition-colors " +
                    (active
                      ? "bg-white/[0.08] border-[#A6FF00]/50"
                      : "bg-black/30 border-white/10 hover:border-white/30")
                  }
                >
                  <div className={"text-[12px] " + (active ? "text-[#A6FF00]" : "text-white/50")}>
                    {g.wd}
                  </div>
                  <div className="text-[13px] text-white/85 tabular-nums">{g.dShort}</div>
                </button>
              );
            })}
          </div>

          {/* Время выбранного дня */}
          <div className="flex flex-wrap gap-2">
            {day?.slots.map((s) => (
              <button
                key={s.iso}
                type="button"
                onClick={() => pickTime(s.iso)}
                className="px-4 py-2.5 rounded-xl text-[15px] tabular-nums bg-black/30 text-white/85 border border-white/12 hover:border-[#A6FF00]/60 hover:text-white transition-colors"
              >
                {slotTime(s.iso)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        // ── Шаг 2: контакты ────────────────────────────────
        <div className="space-y-3 max-w-md">
          <button
            type="button"
            onClick={() => setStep("time")}
            className="flex items-center gap-2 text-[14px] text-white/75 hover:text-white transition-colors"
          >
            <span className="text-[#A6FF00]">✓</span>
            {slot && <span>{slotFull(slot)}</span>}
            <span className="text-white/35 text-[13px]">· изменить</span>
          </button>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className={inputCls}
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              autoFocus
            />
            <input
              className={inputCls}
              placeholder="Telegram или email"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={200}
            />
          </div>
          <input
            className={inputCls}
            placeholder="Что обсудить? (необязательно)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={1000}
          />

          {err === "taken" && (
            <div className="text-[#ffb4a6] text-[13px]">
              Слот только что заняли — выбери другое время.
            </div>
          )}
          {err === "error" && (
            <div className="text-[#ffb4a6] text-[13px]">
              Не отправилось. Попробуй ещё раз или напиши в&nbsp;Telegram.
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={sending || !name.trim() || !contact.trim()}
            data-ym-goal="mentoring_booking_submit"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#A6FF00] text-black hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <LedText text={sending ? "Отправляю…" : "Записаться"} className="h-[10px] w-auto" />
            {!sending && <LedText text="→" className="h-[12px] w-auto" />}
          </button>
        </div>
      )}
    </div>
  );
}

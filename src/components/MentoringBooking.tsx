"use client";

import { useEffect, useState } from "react";
import LedText from "@/components/LedText";
import {
  loadFreeSlots,
  createBooking,
  downloadIcs,
  slotTime,
  slotFull,
  type DayGroup,
} from "@/lib/mentoringBooking";

const FORMATS = ["1-на-1 сессия", "Карьерный трекинг", "Мастеркласс"];

const inputCls =
  "w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-[15px] text-white/90 placeholder:text-white/30 outline-none focus:border-[#A6FF00]/50 transition-colors";

export default function MentoringBooking() {
  const [groups, setGroups] = useState<DayGroup[] | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState("");
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("");
  const [phase, setPhase] = useState<"idle" | "sending" | "done" | "taken" | "error">("idle");

  useEffect(() => {
    loadFreeSlots().then(setGroups);
  }, []);

  const reloadSlots = () => {
    setGroups(null);
    setSlot(null);
    loadFreeSlots().then(setGroups);
  };

  const submit = async () => {
    if (!slot || !name.trim() || !contact.trim()) return;
    setPhase("sending");
    const res = await createBooking({
      slotIso: slot,
      name: name.trim(),
      contact: contact.trim(),
      role: role.trim() || undefined,
      topic: topic.trim() || undefined,
      format: format || undefined,
    });
    if (res.ok) setPhase("done");
    else if (res.taken) {
      setPhase("taken");
      reloadSlots();
    } else setPhase("error");
  };

  // ── Успех ───────────────────────────────────────────────
  if (phase === "done" && slot) {
    return (
      <div className="rounded-2xl border border-[#A6FF00]/25 bg-[#0f0f0e] p-6 md:p-8">
        <div className="text-[#A6FF00] mb-4">
          <LedText text="Заявка отправлена" className="h-[11px] md:h-[12px] w-auto" />
        </div>
        <p className="text-[15px] md:text-[16px] text-white/70 leading-relaxed mb-2">
          {slotFull(slot)}
        </p>
        <p className="text-[14px] md:text-[15px] text-white/55 leading-relaxed mb-7 max-w-md">
          Я подтвержу в течение дня в&nbsp;Telegram и&nbsp;пришлю ссылку на&nbsp;встречу.
          Пока можешь добавить время в&nbsp;свой календарь.
        </p>
        <button
          type="button"
          onClick={() => downloadIcs(slot)}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#A6FF00] text-black hover:bg-white transition-colors"
        >
          <LedText text="Добавить в календарь" className="h-[10px] w-auto" />
        </button>
      </div>
    );
  }

  // ── Форма ───────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f0e] p-6 md:p-8">
      <h3 className="text-white mb-2">
        <span className="sr-only">Выбери время</span>
        <LedText text="Выбери время" className="h-[13px] md:h-[15px] w-auto" />
      </h3>
      <p className="text-[14px] md:text-[15px] text-white/55 leading-relaxed mb-6">
        Будни пн–чт, 18:00–21:00 по&nbsp;Москве. Сессия ~60&nbsp;минут.
      </p>

      {/* Слоты */}
      {groups === null ? (
        <div className="text-white/40 text-[14px] mb-6">Загружаю свободные окна…</div>
      ) : groups.length === 0 ? (
        <div className="text-white/50 text-[14px] mb-6">
          Свободных окон на&nbsp;ближайшие недели нет. Напиши в&nbsp;Telegram — подберём время.
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {groups.map((g) => (
            <div key={g.key}>
              <div className="text-[#C9A66B]/70 mb-2">
                <span className="sr-only">{g.label}</span>
                <LedText text={g.label} className="h-[8px] w-auto" />
              </div>
              <div className="flex flex-wrap gap-2">
                {g.slots.map((s) => {
                  const active = slot === s.iso;
                  return (
                    <button
                      key={s.iso}
                      type="button"
                      onClick={() => setSlot(s.iso)}
                      className={
                        "px-4 py-2 rounded-full text-[14px] tabular-nums border transition-colors " +
                        (active
                          ? "bg-[#A6FF00] text-black border-[#A6FF00]"
                          : "bg-black/30 text-white/75 border-white/12 hover:border-white/35")
                      }
                    >
                      {slotTime(s.iso)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Поля — появляются после выбора слота */}
      {slot && (
        <div className="space-y-3 pt-5 border-t border-white/[0.06]">
          <div className="text-white/50 text-[13px]">
            Выбрано: <span className="text-white/80">{slotFull(slot)}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className={inputCls}
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
            />
            <input
              className={inputCls}
              placeholder="Telegram или email"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className={inputCls}
              placeholder="Роль и грейд (необязательно)"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              maxLength={120}
            />
            <select
              className={inputCls + " appearance-none cursor-pointer"}
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="" className="bg-[#111]">Формат (необязательно)</option>
              {FORMATS.map((f) => (
                <option key={f} value={f} className="bg-[#111]">
                  {f}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className={inputCls + " min-h-[88px] resize-y"}
            placeholder="Что хочешь обсудить?"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={1000}
          />

          {phase === "taken" && (
            <div className="text-[#ffb4a6] text-[13px]">
              Этот слот только что заняли — окна обновил, выбери другой.
            </div>
          )}
          {phase === "error" && (
            <div className="text-[#ffb4a6] text-[13px]">
              Не отправилось. Попробуй ещё раз или напиши в&nbsp;Telegram.
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={phase === "sending" || !name.trim() || !contact.trim()}
            data-ym-goal="mentoring_booking_submit"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#A6FF00] text-black hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
          >
            <LedText
              text={phase === "sending" ? "Отправляю…" : "Записаться"}
              className="h-[10px] w-auto"
            />
            {phase !== "sending" && <LedText text="→" className="h-[12px] w-auto" />}
          </button>
        </div>
      )}
    </div>
  );
}

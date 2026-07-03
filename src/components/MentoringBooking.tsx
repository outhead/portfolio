"use client";

import { useEffect, useMemo, useState } from "react";
import LedText from "@/components/LedText";
import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";
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

const WEEK_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const WEEK_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS_RU = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function parseKey(k: string) {
  const [y, m, d] = k.split("-").map(Number);
  return { y, m: m - 1, d };
}

/** Список месяцев от первого до последнего доступного дня включительно. */
function monthsBetween(firstKey: string, lastKey: string): Array<{ y: number; m: number }> {
  const a = parseKey(firstKey);
  const b = parseKey(lastKey);
  const out: Array<{ y: number; m: number }> = [];
  let y = a.y;
  let m = a.m;
  while (y < b.y || (y === b.y && m <= b.m)) {
    out.push({ y, m });
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return out;
}

/** Ячейки месяца, неделя с понедельника (null = пустая ячейка-отступ). */
function monthCells(y: number, m: number): Array<number | null> {
  const firstW = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const cells: Array<number | null> = [];
  for (let i = 0; i < firstW; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return cells;
}

export default function MentoringBooking() {
  const locale = useLocale();
  const WEEK = pick(WEEK_RU, WEEK_EN, locale);
  const MONTHS = pick(MONTHS_RU, MONTHS_EN, locale);
  const [groups, setGroups] = useState<DayGroup[] | null>(null);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [monthIdx, setMonthIdx] = useState(0);
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
  const availByKey = useMemo(
    () => new Map((groups ?? []).map((g) => [g.key, g])),
    [groups],
  );
  const months = useMemo(
    () =>
      groups && groups.length
        ? monthsBetween(groups[0].key, groups[groups.length - 1].key)
        : [],
    [groups],
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
      setMonthIdx(0);
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
          <LedText text={pick("Готово", "Done", locale)} className="h-[11px] w-auto" />
        </div>
        <p className="text-[15px] text-white/80 mb-1.5">{slotFull(slot, locale === "en")}</p>
        <p className="text-[13px] text-white/50 leading-relaxed mb-5 max-w-md">
          {pick(
            "Подтвержу в течение дня в Telegram и пришлю ссылку на встречу.",
            "I'll confirm within the day on Telegram and send the meeting link.",
            locale,
          )}
        </p>
        <button
          type="button"
          onClick={() => downloadIcs(slot, locale === "en")}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#A6FF00] text-black hover:bg-white transition-colors"
        >
          <LedText text={pick("В календарь", "Add to calendar", locale)} className="h-[10px] w-auto" />
        </button>
      </div>
    );
  }

  const cur = months[monthIdx];
  const cells = cur ? monthCells(cur.y, cur.m) : [];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f0e] p-5 md:p-6">
      {/* Шаги */}
      <div className="flex items-center gap-2 mb-4 text-[12px] tracking-wide">
        <span className={step === "time" ? "text-[#A6FF00]" : "text-white/35"}>
          {pick("1 · Когда", "1 · When", locale)}
        </span>
        <span className="text-white/20">→</span>
        <span className={step === "form" ? "text-[#A6FF00]" : "text-white/35"}>
          {pick("2 · Контакты", "2 · Contacts", locale)}
        </span>
      </div>

      {groups === null ? (
        <div className="text-white/40 text-[14px] py-2">{pick("Загружаю свободные окна…", "Loading open slots…", locale)}</div>
      ) : groups.length === 0 ? (
        <div className="text-white/55 text-[14px] py-2 leading-relaxed">
          {pick(
            "Свободных окон на ближайшие недели нет. Напиши в Telegram — подберём время: ",
            "No open slots in the coming weeks. Message me on Telegram and we'll find a time: ",
            locale,
          )}
          <a href="https://t.me/egoradi" target="_blank" rel="noopener noreferrer" className="text-[#A6FF00] no-underline">
            @egoradi
          </a>
        </div>
      ) : step === "time" ? (
        // ── Шаг 1: календарь + колонка времени ─────────────
        <div className="grid md:grid-cols-[minmax(0,300px)_1fr] gap-6 md:gap-8">
          {/* Календарь */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
                disabled={monthIdx === 0}
                aria-label={pick("Предыдущий месяц", "Previous month", locale)}
                className="w-7 h-7 rounded-lg border border-white/10 text-white/70 hover:border-white/30 disabled:opacity-25 disabled:hover:border-white/10 transition-colors"
              >
                ‹
              </button>
              <div className="text-[14px] text-white/85">
                {cur ? `${MONTHS[cur.m]} ${cur.y}` : ""}
              </div>
              <button
                type="button"
                onClick={() => setMonthIdx((i) => Math.min(months.length - 1, i + 1))}
                disabled={monthIdx >= months.length - 1}
                aria-label={pick("Следующий месяц", "Next month", locale)}
                className="w-7 h-7 rounded-lg border border-white/10 text-white/70 hover:border-white/30 disabled:opacity-25 disabled:hover:border-white/10 transition-colors"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEK.map((w) => (
                <div key={w} className="text-[11px] text-white/30 text-center py-1">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (d === null) return <div key={`e${i}`} />;
                const key = keyOf(cur.y, cur.m, d);
                const avail = availByKey.has(key);
                const active = key === dayKey;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!avail}
                    onClick={() => setDayKey(key)}
                    className={
                      "h-9 rounded-lg text-[13px] tabular-nums transition-colors " +
                      (active
                        ? "bg-[#A6FF00] text-black font-medium"
                        : avail
                          ? "text-white/85 border border-white/12 hover:border-[#A6FF00]/60"
                          : "text-white/20 cursor-default")
                    }
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Время выбранного дня */}
          <div className="md:border-l md:border-white/[0.06] md:pl-8">
            <div className="text-[13px] text-white/45 mb-3">
              {day ? (locale === "en" ? day.labelEn : day.label) : pick("Выбери дату слева", "Pick a date on the left", locale)}
              <span className="text-white/30">{pick(" · 18:00–21:00 МСК · ~60 мин", " · 18:00–21:00 MSK · ~60 min", locale)}</span>
            </div>
            <div className="flex flex-wrap md:flex-col gap-2 md:max-w-[200px]">
              {day?.slots.map((s) => (
                <button
                  key={s.iso}
                  type="button"
                  onClick={() => pickTime(s.iso)}
                  className="px-4 py-2.5 rounded-xl text-[15px] tabular-nums bg-black/30 text-white/85 border border-white/12 hover:border-[#A6FF00]/60 hover:text-white transition-colors md:text-center"
                >
                  {slotTime(s.iso)}
                </button>
              ))}
            </div>
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
            {slot && <span>{slotFull(slot, locale === "en")}</span>}
            <span className="text-white/35 text-[13px]">{pick("· изменить", "· change", locale)}</span>
          </button>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className={inputCls}
              placeholder={pick("Имя", "Name", locale)}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              autoFocus
            />
            <input
              className={inputCls}
              placeholder={pick("Telegram или email", "Telegram or email", locale)}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={200}
            />
          </div>
          <input
            className={inputCls}
            placeholder={pick("Что обсудить? (необязательно)", "What to discuss? (optional)", locale)}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={1000}
          />

          {err === "taken" && (
            <div className="text-[#ffb4a6] text-[13px]">
              {pick("Слот только что заняли — выбери другое время.", "That slot was just taken — pick another time.", locale)}
            </div>
          )}
          {err === "error" && (
            <div className="text-[#ffb4a6] text-[13px]">
              {pick("Не отправилось. Попробуй ещё раз или напиши в Telegram.", "Didn't go through. Try again or message me on Telegram.", locale)}
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={sending || !name.trim() || !contact.trim()}
            data-ym-goal="mentoring_booking_submit"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#A6FF00] text-black hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <LedText text={sending ? pick("Отправляю…", "Sending…", locale) : pick("Записаться", "Book", locale)} className="h-[10px] w-auto" />
            {!sending && <LedText text="→" className="h-[12px] w-auto" />}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * mentoringBooking — запись на менторинг через Supabase PostgREST.
 *
 * Слоты генерятся по правилу на стороне клиента: будни пн–чт, 18/19/20
 * по Москве (UTC+3, без перехода на летнее). Занятые слоты приходят из
 * RPC get_taken_slots (без PII). Бронь — POST в mentoring_bookings,
 * уникальный slot_start режет двойную запись (409).
 *
 * В проде ходим через свой домен (/sb/rest проксирует Supabase —
 * *.supabase.co блокируется в РФ). В dev — напрямую.
 * ──────────────────────────────────────────────────────────────── */

const SB_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hvkygaghhxgaolxemndr.supabase.co";
const SB_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a3lnYWdoaHhnYW9seGVtbmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDYwNjAsImV4cCI6MjA5NDg4MjA2MH0.IoRNKO3Jb51k1XA2y7-Q-PSaxpPhBj56G1SZJaKKau4";

const DEV = process.env.NODE_ENV === "development";
const REST = DEV ? `${SB_URL}/rest/v1` : "/sb/rest";
const TABLE = "mentoring_bookings";

const MSK_OFFSET = 3 * 3600 * 1000; // Москва = UTC+3, фиксировано
const HOURS = [18, 19, 20]; // часы старта по МСК
const WEEKDAYS = [1, 2, 3, 4]; // пн–чт (0=вс)
const DAYS_AHEAD = 28; // горизонт записи
const LEAD_MS = 2 * 3600 * 1000; // минимальный запас до встречи
const SLOT_MINUTES = 60;

export type Slot = {
  iso: string; // абсолютное время старта, ISO/UTC — для БД и сравнения
  ms: number;
};

export type DayGroup = {
  key: string; // YYYY-MM-DD (МСК)
  label: string; // «Пн, 7 июля»
  wd: string; // «Пн»
  dShort: string; // «7 июл»
  slots: Slot[];
};

const WD_RU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MON_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const MON_SHORT = [
  "янв", "фев", "мар", "апр", "мая", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];

/** Поля даты в МСК для абсолютного момента ms. */
function mskParts(ms: number) {
  const d = new Date(ms + MSK_OFFSET);
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth(),
    day: d.getUTCDate(),
    wd: d.getUTCDay(),
    h: d.getUTCHours(),
    min: d.getUTCMinutes(),
  };
}

/** Абсолютный момент для даты МСК и часа МСК. */
function mskMoment(y: number, m: number, day: number, hour: number): number {
  return Date.UTC(y, m, day, hour, 0, 0) - MSK_OFFSET;
}

/** Человекочитаемое время слота в МСК: «18:00». */
export function slotTime(iso: string): string {
  const p = mskParts(Date.parse(iso));
  return `${String(p.h).padStart(2, "0")}:${String(p.min).padStart(2, "0")}`;
}

/** Полная подпись слота: «Пн, 7 июля, 18:00 МСК». */
export function slotFull(iso: string): string {
  const p = mskParts(Date.parse(iso));
  return `${WD_RU[p.wd]}, ${p.day} ${MON_RU[p.m]}, ${slotTime(iso)} МСК`;
}

/** Все слоты по правилу на горизонте, без фильтра занятости. */
function ruleSlots(nowMs: number): Slot[] {
  const t = mskParts(nowMs);
  const out: Slot[] = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    // полдень МСК i-го дня → берём дату МСК
    const probe = mskParts(mskMoment(t.y, t.m, t.day + i, 12));
    if (!WEEKDAYS.includes(probe.wd)) continue;
    for (const h of HOURS) {
      const ms = mskMoment(probe.y, probe.m, probe.day, h);
      if (ms > nowMs + LEAD_MS) out.push({ iso: new Date(ms).toISOString(), ms });
    }
  }
  return out.sort((a, b) => a.ms - b.ms);
}

/** Тянет занятые слоты из RPC. Сбой → пустой набор (покажем все слоты). */
async function takenSet(fromMs: number, toMs: number): Promise<Set<number>> {
  try {
    const res = await fetch(`${REST}/rpc/get_taken_slots`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_from: new Date(fromMs).toISOString(),
        p_to: new Date(toMs).toISOString(),
      }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error("sb");
    const rows = (await res.json()) as Array<{ slot_start: string }>;
    return new Set(rows.map((r) => Date.parse(r.slot_start)));
  } catch {
    return new Set();
  }
}

/** Свободные слоты, сгруппированные по дням. */
export async function loadFreeSlots(): Promise<DayGroup[]> {
  const now = Date.now();
  const all = ruleSlots(now);
  if (all.length === 0) return [];
  const taken = await takenSet(all[0].ms, all[all.length - 1].ms + 3600 * 1000);
  const groups = new Map<string, DayGroup>();
  for (const s of all) {
    if (taken.has(s.ms)) continue;
    const p = mskParts(s.ms);
    const key = `${p.y}-${String(p.m + 1).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        label: `${WD_RU[p.wd]}, ${p.day} ${MON_RU[p.m]}`,
        wd: WD_RU[p.wd],
        dShort: `${p.day} ${MON_SHORT[p.m]}`,
        slots: [],
      };
      groups.set(key, g);
    }
    g.slots.push(s);
  }
  return [...groups.values()];
}

export type BookingInput = {
  slotIso: string;
  name: string;
  contact: string;
  role?: string;
  topic?: string;
  format?: string;
};

export type BookingResult = { ok: boolean; taken?: boolean; error?: string };

/** Создаёт бронь. 409 (unique slot_start) → слот уже заняли. */
export async function createBooking(input: BookingInput): Promise<BookingResult> {
  try {
    const res = await fetch(`${REST}/${TABLE}`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        slot_start: input.slotIso,
        name: input.name,
        contact: input.contact,
        role: input.role || null,
        topic: input.topic || null,
        format: input.format || null,
        status: "new",
      }),
    });
    if (res.status === 409) return { ok: false, taken: true };
    if (!res.ok) return { ok: false, error: `sb_${res.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: "network" };
  }
}

/** .ics для менти: добавить встречу в свой календарь. */
export function buildIcs(slotIso: string): string {
  const start = new Date(Date.parse(slotIso));
  const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const uid = `mentoring-${start.getTime()}@egorshugaev`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//egorshugaev//mentoring//RU",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    "SUMMARY:Менторинг с Егором Шугаевым",
    "DESCRIPTION:Сессия менторинга. Детали и ссылку на встречу пришлю в Telegram.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Триггерит скачивание .ics в браузере. */
export function downloadIcs(slotIso: string) {
  const blob = new Blob([buildIcs(slotIso)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mentoring.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// notify-booking — шлёт Егору уведомление в Telegram при новой заявке на менторинг.
// Вызывается триггером AFTER INSERT на public.mentoring_bookings (через pg_net).
//
// Секреты (Supabase → Edge Functions → Secrets):
//   TELEGRAM_BOT_TOKEN — токен бота от @BotFather
//   TELEGRAM_CHAT_ID   — числовой id чата Егора (узнать у @userinfobot)
//   NOTIFY_SECRET      — общий секрет, чтобы дёргать функцию мог только триггер
//
// deno-lint-ignore-file
declare const Deno: { env: { get(k: string): string | undefined }; serve: (h: (r: Request) => Response | Promise<Response>) => void };

const BOT = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const CHAT = Deno.env.get("TELEGRAM_CHAT_ID") ?? "";
const SECRET = Deno.env.get("NOTIFY_SECRET") ?? "";

const MSK = 3 * 3600 * 1000;
const WD = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MON = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

function slotLabel(iso: string): string {
  const d = new Date(new Date(iso).getTime() + MSK);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${WD[d.getUTCDay()]}, ${d.getUTCDate()} ${MON[d.getUTCMonth()]}, ${hh}:${mm} МСК`;
}

function esc(s: string): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("method", { status: 405 });

  // Защита: триггер шлёт заголовок с общим секретом.
  if (SECRET && req.headers.get("x-notify-secret") !== SECRET) {
    return new Response("forbidden", { status: 403 });
  }
  if (!BOT || !CHAT) return new Response("not configured", { status: 200 });

  let rec: Record<string, unknown> = {};
  try {
    const body = await req.json();
    rec = body?.record ?? body ?? {};
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const lines = [
    "<b>Новая заявка на менторинг</b>",
    `🗓 ${esc(slotLabel(String(rec.slot_start ?? "")))}`,
    `👤 ${esc(String(rec.name ?? "—"))}`,
    `✉️ ${esc(String(rec.contact ?? "—"))}`,
  ];
  if (rec.role) lines.push(`💼 ${esc(String(rec.role))}`);
  if (rec.format) lines.push(`📦 ${esc(String(rec.format))}`);
  if (rec.topic) lines.push(`📝 ${esc(String(rec.topic))}`);

  const tg = await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT,
      text: lines.join("\n"),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  return new Response(tg.ok ? "ok" : "tg error", { status: tg.ok ? 200 : 502 });
});

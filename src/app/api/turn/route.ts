import { NextResponse } from "next/server";

/**
 * Выдаёт временные TURN-креды (Cloudflare Realtime TURN) для p2p понга/дуэли.
 * Зачем: на мобайле/CGNAT/VPN прямое p2p без TURN не собирается — игроки валятся
 * на relay (выше задержка). С TURN p2p встаёт чаще → ниже пинг.
 *
 * Секреты — только серверные env (в код не попадают):
 *   CF_TURN_KEY_ID      — id TURN-ключа из Cloudflare (Realtime → TURN)
 *   CF_TURN_API_TOKEN   — долгоживущий секрет ключа (генерит временные креды)
 * Нет env → отдаём { iceServers: null }, клиент работает на старом ICE (STUN+openrelay).
 * Креды короткоживущие (TTL 24ч), публичная выдача — это штатная модель TURN.
 */
export const runtime = "edge";

export async function GET() {
  const keyId = process.env.CF_TURN_KEY_ID;
  const token = process.env.CF_TURN_API_TOKEN;
  if (!keyId || !token) return NextResponse.json({ iceServers: null });
  try {
    const r = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ttl: 86400 }),
      }
    );
    if (!r.ok) return NextResponse.json({ iceServers: null });
    const data = (await r.json()) as { iceServers?: unknown };
    return NextResponse.json(
      { iceServers: data.iceServers ?? null },
      { headers: { "cache-control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ iceServers: null });
  }
}

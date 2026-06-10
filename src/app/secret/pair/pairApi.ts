// Клиент кооп-загадки. Запись/секреты — через Edge Function `pair` (service role,
// IP-хеш, скрытые колонки target/reward/ip). Чтение состояния для поллинга —
// PostgREST по anon-ключу (видны только switches/joined/solved).
//
// ВАЖНО: в проде ходим НЕ на *.supabase.co напрямую (домен блокируется в РФ без VPN),
// а через свой домен — vercel.json проксирует /sb/* на Supabase. Реальный IP клиента
// edge-функция достаёт из x-forwarded-for, который проставляет Vercel-прокси.
// В dev (next dev rewrites из vercel.json не читает) — напрямую.

const SB_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hvkygaghhxgaolxemndr.supabase.co";
const SB_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a3lnYWdoaHhnYW9seGVtbmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDYwNjAsImV4cCI6MjA5NDg4MjA2MH0.IoRNKO3Jb51k1XA2y7-Q-PSaxpPhBj56G1SZJaKKau4";

const DEV = process.env.NODE_ENV === "development";
const FN = DEV ? `${SB_URL}/functions/v1/pair` : "/sb/functions/pair";
const REST = DEV ? `${SB_URL}/rest/v1` : "/sb/rest";

export async function pairCall(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(FN, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, ...payload }),
    });
    return await res.json();
  } catch {
    return { error: "network" };
  }
}

export type PairState = { switches: string; joined: boolean; solved: boolean };

export async function pairState(id: string): Promise<PairState | null> {
  try {
    const res = await fetch(
      `${REST}/pair_session?id=eq.${id}&select=switches,joined,solved`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: "no-store" }
    );
    const rows = (await res.json()) as PairState[];
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}

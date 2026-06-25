// Доска делёжки (Split or Steal после 3-го матча пинг-понга).
// Чтение/запись — PostgREST по anon-ключу (RLS). В проде через свой домен (/sb/*),
// в dev — напрямую. boost_time идёт через Edge Function (service role, режет квест-время).

const SB_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hvkygaghhxgaolxemndr.supabase.co";
const SB_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a3lnYWdoaHhnYW9seGVtbmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDYwNjAsImV4cCI6MjA5NDg4MjA2MH0.IoRNKO3Jb51k1XA2y7-Q-PSaxpPhBj56G1SZJaKKau4";

const DEV = process.env.NODE_ENV === "development";
const REST = DEV ? `${SB_URL}/rest/v1` : "/sb/rest";
const FN = DEV ? `${SB_URL}/functions/v1/pair` : "/sb/functions/pair";
const TABLE = "deal_results";

export type DealRow = { name: string; amount: number; rat: boolean; at: number };
type Row = { name: string; amount: number; rat: boolean; created_at: string };

export async function loadDeals(limit = 12): Promise<DealRow[]> {
  try {
    const res = await fetch(
      `${REST}/${TABLE}?select=name,amount,rat,created_at&order=amount.desc&order=created_at.desc&limit=${limit}`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: "no-store" }
    );
    if (!res.ok) throw new Error("sb");
    return ((await res.json()) as Row[]).map((r) => ({
      name: r.name,
      amount: r.amount,
      rat: !!r.rat,
      at: Date.parse(r.created_at) || 0,
    }));
  } catch {
    return [];
  }
}

export async function submitDeal(name: string, amount: number, rat: boolean): Promise<boolean> {
  try {
    const res = await fetch(`${REST}/${TABLE}`, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: (name || "Гость").slice(0, 20),
        amount: Math.max(0, Math.min(500, Math.round(amount))),
        rat: !!rat,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Урезать квест-время по выигрышу (только пригласивший — он есть в квест-таблице).
export async function boostQuestTime(rowId: string, amount: number): Promise<boolean> {
  if (!rowId || amount <= 0) return false;
  try {
    const res = await fetch(FN, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "boost_time", id: rowId, amount }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

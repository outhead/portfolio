// Транспорт понга через свой Cloudflare-релей (WebSocket), вместо supabase-js Realtime.
// Доступен в РФ без VPN. API подобран так, чтобы лечь на текущую логику понга:
//   const r = connectRelay(code);
//   r.on("state", p => ...); r.on("paddle", p => ...); r.on("hello", () => ...);
//   r.onPeers(n => ...);   // n>=2 → соперник на связи
//   r.send("state", {...});
//   r.close();
//
// URL релея задаётся в Vercel: NEXT_PUBLIC_RELAY_URL = wss://pong-relay.<...>.workers.dev

const RELAY = process.env.NEXT_PUBLIC_RELAY_URL || "";

export type Relay = {
  send: (event: string, payload?: unknown) => void;
  on: (event: string, cb: (payload: unknown) => void) => void;
  onPeers: (cb: (count: number) => void) => void;
  close: () => void;
  readonly available: boolean;
};

export function connectRelay(code: string): Relay {
  const handlers: Record<string, ((p: unknown) => void)[]> = {};
  let peersCb: ((n: number) => void) | null = null;
  let ws: WebSocket | null = null;
  let closed = false;
  let retry = 0;

  const open = () => {
    if (closed || !RELAY) return;
    ws = new WebSocket(`${RELAY}/room/${code}`);
    ws.addEventListener("open", () => { retry = 0; });
    ws.addEventListener("message", (ev: MessageEvent) => {
      let m: { event?: string; payload?: unknown };
      try { m = JSON.parse(ev.data as string); } catch { return; }
      if (!m.event) return;
      if (m.event === "__peers") { peersCb?.((m.payload as { count?: number })?.count ?? 0); return; }
      (handlers[m.event] || []).forEach((cb) => cb(m.payload));
    });
    const reconnect = () => {
      if (closed) return;
      retry = Math.min(retry + 1, 6);
      setTimeout(open, 400 * retry); // мягкий бэкофф
    };
    ws.addEventListener("close", reconnect);
    ws.addEventListener("error", () => { try { ws?.close(); } catch { /* */ } });
  };
  open();

  return {
    available: !!RELAY,
    send: (event, payload) => {
      if (ws && ws.readyState === 1) ws.send(JSON.stringify({ event, payload }));
    },
    on: (event, cb) => { (handlers[event] || (handlers[event] = [])).push(cb); },
    onPeers: (cb) => { peersCb = cb; },
    close: () => { closed = true; try { ws?.close(); } catch { /* */ } },
  };
}

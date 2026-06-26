// P2P-транспорт понга: WebRTC DataChannel напрямую между игроками.
// Зачем: через Supabase Realtime каждый пакет летит в Европу и обратно (100–300мс RTT,
// а домен ещё и блокируется в РФ). P2P в одном городе — 5–30мс, и после рукопожатия
// внешняя инфраструктура не нужна вообще.
//
// Сигналинг (обмен offer/answer при старте) — таблица pong_signal через /sb/rest,
// т.е. через прокси своего домена (vercel.json) — работает без VPN.
// Без trickle ICE: ждём полного сбора кандидатов и шлём ОДИН offer / ОДИН answer.
// Каждая попытка имеет aid (attempt id) — answer принимается только к своему offer.
// До 3 попыток соединения; после обрыва открытого канала — до 3 реконнектов.
//
// Каналы: "fast" — unordered, без ретрансмиссий (state/paddle, 60 Гц, потери не страшны);
//         "ctl"  — надёжный (hello/rematch/hit/release).

const SB_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hvkygaghhxgaolxemndr.supabase.co";
const SB_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a3lnYWdoaHhnYW9seGVtbmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDYwNjAsImV4cCI6MjA5NDg4MjA2MH0.IoRNKO3Jb51k1XA2y7-Q-PSaxpPhBj56G1SZJaKKau4";

const DEV = process.env.NODE_ENV === "development";
const REST = DEV ? `${SB_URL}/rest/v1` : "/sb/rest";
const HEADERS = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
};

// STUN — пара гугловых + российский sipnet (на случай недоступности Google).
// TURN — публичный Open Relay (Metered, 20ГБ/мес бесплатно): фолбэк для CGNAT-пар.
const ICE: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  { urls: "stun:stun.sipnet.ru:3478" },
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:443",
      "turn:openrelay.metered.ca:443?transport=tcp",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

// Временные TURN-креды (Cloudflare) тянем один раз за сессию и добавляем В НАЧАЛО списка
// ICE. Нет кред (env не задан / ошибка) — остаёмся на STUN+openrelay (как было).
let icePromise: Promise<RTCIceServer[]> | null = null;
function getIce(): Promise<RTCIceServer[]> {
  if (!icePromise) {
    icePromise = (async () => {
      try {
        const res = await fetch("/api/turn", { cache: "no-store" });
        const d = (await res.json()) as { iceServers?: RTCIceServer | RTCIceServer[] | null };
        if (d?.iceServers) {
          const extra = Array.isArray(d.iceServers) ? d.iceServers : [d.iceServers];
          return [...extra, ...ICE];
        }
      } catch { /* фолбэк ниже */ }
      return ICE;
    })();
  }
  return icePromise;
}

export type NetMsg = { event: string; payload: Record<string, unknown> };

export type P2PHandle = {
  sendFast: (m: NetMsg) => void;
  sendCtl: (m: NetMsg) => void;
  close: () => void;
};

type Sig = { aid?: string; sdp?: RTCSessionDescriptionInit };

async function sigPost(room: string, sender: string, type: string, payload: unknown) {
  try {
    await fetch(`${REST}/pong_signal`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ room, sender, type, payload }),
    });
  } catch { /* сигналинг ретраится поллингом */ }
}

// последний свежий (< 2 мин) сигнал нужного типа от другой стороны
async function sigGet(room: string, sender: string, type: string): Promise<Sig | null> {
  try {
    const fresh = new Date(Date.now() - 120000).toISOString();
    const res = await fetch(
      `${REST}/pong_signal?room=eq.${encodeURIComponent(room)}&sender=eq.${sender}&type=eq.${type}` +
        `&created_at=gt.${encodeURIComponent(fresh)}&order=id.desc&limit=1&select=payload`,
      { headers: HEADERS, cache: "no-store" }
    );
    const rows = (await res.json()) as { payload: Sig }[];
    return rows?.[0]?.payload ?? null;
  } catch {
    return null;
  }
}

async function sigCleanup(room: string) {
  try {
    await fetch(`${REST}/pong_signal?room=eq.${encodeURIComponent(room)}`, {
      method: "DELETE",
      headers: HEADERS,
    });
  } catch { /* не критично */ }
}

// гигиена: сносим сигналы старше часа от брошенных сессий (любой может, таблица мусорная)
function sigPurgeOld() {
  const old = new Date(Date.now() - 3600000).toISOString();
  fetch(`${REST}/pong_signal?created_at=lt.${encodeURIComponent(old)}`, {
    method: "DELETE",
    headers: HEADERS,
  }).catch(() => {});
}

function waitIce(pc: RTCPeerConnection, ms = 4000): Promise<void> {
  return new Promise((res) => {
    if (pc.iceGatheringState === "complete") return res();
    const t = setTimeout(res, ms);
    pc.addEventListener("icegatheringstatechange", () => {
      if (pc.iceGatheringState === "complete") { clearTimeout(t); res(); }
    });
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function connectP2P(opts: {
  room: string;
  role: "host" | "guest";
  onMessage: (m: NetMsg) => void;
  onOpen: () => void;
  onClose: () => void;
}): P2PHandle {
  const { room, role, onMessage, onOpen, onClose } = opts;
  let cancelled = false;
  let pc: RTCPeerConnection | null = null;
  let fast: RTCDataChannel | null = null;
  let ctl: RTCDataChannel | null = null;
  let reconnects = 0;

  const runAttempt = async (n: number) => {
    if (cancelled || n > 3) return;
    console.log(`[pong p2p] попытка ${n}${reconnects ? ` (реконнект ${reconnects})` : ""}`);
    const aid = Math.random().toString(36).slice(2, 8);
    const st = { settled: false, failed: false, fastOpen: false, ctlOpen: false };
    const ice = await getIce();
    if (cancelled) return;
    const pcA = new RTCPeerConnection({ iceServers: ice });
    pc = pcA;

    const fail = (why: string) => {
      if (cancelled || st.failed) return;
      st.failed = true;
      clearTimeout(tOut);
      console.log("[pong p2p] fail:", why);
      try { pcA.close(); } catch { /* */ }
      if (st.settled) {
        // канал был открыт и умер — сообщаем и пробуем переподключиться
        onClose();
        if (reconnects < 3) { reconnects++; setTimeout(() => runAttempt(1), 800); }
      } else {
        setTimeout(() => runAttempt(n + 1), 1000);
      }
    };

    const tOut = setTimeout(() => { if (!st.settled) fail("timeout 15s"); }, 15000);

    const wireA = (dc: RTCDataChannel, isFast: boolean) => {
      dc.onmessage = (e) => { try { onMessage(JSON.parse(String(e.data))); } catch { /* */ } };
      dc.onopen = () => {
        if (isFast) st.fastOpen = true; else st.ctlOpen = true;
        if (st.fastOpen && st.ctlOpen && !st.settled) {
          st.settled = true;
          clearTimeout(tOut);
          if (role === "host") void sigCleanup(room);
          console.log("[pong p2p] канал открыт ✓");
          onOpen();
        }
      };
      dc.onclose = () => { if (st.settled) fail("channel closed"); };
    };

    pcA.onconnectionstatechange = () => {
      const s = pcA.connectionState;
      console.log("[pong p2p] conn:", s);
      if (s === "failed" || s === "closed") fail(s);
      else if (s === "disconnected") {
        // transient-обрывы у мобильных бывают — даём 3с очухаться
        setTimeout(() => { if (pcA.connectionState === "disconnected") fail("disconnected"); }, 3000);
      }
    };
    pcA.oniceconnectionstatechange = () => console.log("[pong p2p] ice:", pcA.iceConnectionState);

    (async () => {
      try {
        if (role === "host") {
          // Старые сигналы комнаты — в мусор, чтобы гость не схватил протухший offer.
          // ВАЖНО дождаться: иначе DELETE дойдёт ПОЗЖЕ нашего offer и стерёт его.
          await sigCleanup(room);
          sigPurgeOld();
          fast = pcA.createDataChannel("fast", { ordered: false, maxRetransmits: 0 });
          ctl = pcA.createDataChannel("ctl");
          wireA(fast, true); wireA(ctl, false);
          await pcA.setLocalDescription(await pcA.createOffer());
          await waitIce(pcA);
          if (cancelled || st.failed) return;
          await sigPost(room, "host", "offer", { aid, sdp: pcA.localDescription });
          console.log("[pong p2p] offer posted", aid);
          for (let i = 0; i < 180 && !cancelled && !st.settled && !st.failed; i++) {
            const ans = await sigGet(room, "guest", "answer");
            if (ans?.sdp && ans.aid === aid) {
              console.log("[pong p2p] answer received");
              await pcA.setRemoteDescription(ans.sdp).catch(() => fail("bad answer"));
              break;
            }
            await sleep(1000);
          }
        } else {
          pcA.ondatachannel = (e) => {
            if (e.channel.label === "fast") { fast = e.channel; wireA(fast, true); }
            else { ctl = e.channel; wireA(ctl, false); }
          };
          for (let i = 0; i < 180 && !cancelled && !st.failed; i++) {
            const off = await sigGet(room, "host", "offer");
            if (off?.sdp) {
              console.log("[pong p2p] offer received → answering", off.aid);
              await pcA.setRemoteDescription(off.sdp);
              await pcA.setLocalDescription(await pcA.createAnswer());
              await waitIce(pcA);
              if (cancelled || st.failed) return;
              await sigPost(room, "guest", "answer", { aid: off.aid, sdp: pcA.localDescription });
              break;
            }
            await sleep(900);
          }
        }
      } catch (e) {
        fail(String(e));
      }
    })();
  };

  runAttempt(1);

  return {
    sendFast: (m: NetMsg) => {
      if (fast && fast.readyState === "open") {
        try { fast.send(JSON.stringify(m)); } catch { /* */ }
      }
    },
    sendCtl: (m: NetMsg) => {
      if (ctl && ctl.readyState === "open") {
        try { ctl.send(JSON.stringify(m)); } catch { /* */ }
      }
    },
    close: () => {
      cancelled = true;
      try { fast?.close(); ctl?.close(); pc?.close(); } catch { /* */ }
    },
  };
}

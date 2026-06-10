// P2P-транспорт понга: WebRTC DataChannel напрямую между игроками.
// Зачем: через Supabase Realtime каждый пакет летит в Европу и обратно (100–300мс RTT,
// а домен ещё и блокируется в РФ). P2P в одном городе — 5–30мс, и после рукопожатия
// внешняя инфраструктура не нужна вообще.
//
// Сигналинг (обмен offer/answer при старте) — таблица pong_signal через /sb/rest,
// т.е. через прокси своего домена (vercel.json) — работает без VPN.
// Без trickle ICE: ждём полного сбора кандидатов и шлём ОДИН offer / ОДИН answer.
//
// Каналы: "fast" — unordered, без ретрансмиссий (state/paddle, 60 Гц, потери не страшны);
//         "ctl"  — надёжный (hello/rematch).

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

export type NetMsg = { event: string; payload: Record<string, unknown> };

export type P2PHandle = {
  sendFast: (m: NetMsg) => void;
  sendCtl: (m: NetMsg) => void;
  close: () => void;
};

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
async function sigGet(room: string, sender: string, type: string): Promise<unknown | null> {
  try {
    const fresh = new Date(Date.now() - 120000).toISOString();
    const res = await fetch(
      `${REST}/pong_signal?room=eq.${encodeURIComponent(room)}&sender=eq.${sender}&type=eq.${type}` +
        `&created_at=gt.${encodeURIComponent(fresh)}&order=id.desc&limit=1&select=payload`,
      { headers: HEADERS, cache: "no-store" }
    );
    const rows = (await res.json()) as { payload: unknown }[];
    return rows?.[0]?.payload ?? null;
  } catch {
    return null;
  }
}

function sigCleanup(room: string) {
  fetch(`${REST}/pong_signal?room=eq.${encodeURIComponent(room)}`, {
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
  let opened = false;
  let fast: RTCDataChannel | null = null;
  let ctl: RTCDataChannel | null = null;
  let fastOpen = false;
  let ctlOpen = false;

  const pc = new RTCPeerConnection({ iceServers: ICE });

  const maybeOpen = () => {
    if (fastOpen && ctlOpen && !opened && !cancelled) {
      opened = true;
      if (role === "host") sigCleanup(room);
      onOpen();
    }
  };

  const wire = (dc: RTCDataChannel, isFast: boolean) => {
    dc.onmessage = (e) => {
      try { onMessage(JSON.parse(String(e.data))); } catch { /* мусор игнорим */ }
    };
    dc.onopen = () => { if (isFast) fastOpen = true; else ctlOpen = true; maybeOpen(); };
    dc.onclose = () => { if (opened) onClose(); };
  };

  pc.onconnectionstatechange = () => {
    const st = pc.connectionState;
    if ((st === "failed" || st === "disconnected" || st === "closed") && opened) onClose();
  };

  (async () => {
    if (role === "host") {
      // старые сигналы этой комнаты — в мусор, чтобы гость не схватил протухший offer
      sigCleanup(room);
      await sleep(300);
      fast = pc.createDataChannel("fast", { ordered: false, maxRetransmits: 0 });
      ctl = pc.createDataChannel("ctl");
      wire(fast, true); wire(ctl, false);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitIce(pc);
      if (cancelled) return;
      await sigPost(room, "host", "offer", pc.localDescription);
      // ждём answer до ~3 минут (гость может открыть ссылку не сразу)
      for (let i = 0; i < 180 && !cancelled && !opened; i++) {
        const ans = await sigGet(room, "guest", "answer");
        if (ans) {
          await pc.setRemoteDescription(ans as RTCSessionDescriptionInit).catch(() => {});
          return;
        }
        await sleep(1000);
      }
    } else {
      pc.ondatachannel = (e) => {
        if (e.channel.label === "fast") { fast = e.channel; wire(fast, true); }
        else { ctl = e.channel; wire(ctl, false); }
      };
      for (let i = 0; i < 180 && !cancelled && !opened; i++) {
        const off = await sigGet(room, "host", "offer");
        if (off) {
          try {
            await pc.setRemoteDescription(off as RTCSessionDescriptionInit);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await waitIce(pc);
            if (cancelled) return;
            await sigPost(room, "guest", "answer", pc.localDescription);
          } catch { /* протухший offer — продолжаем поллить */ }
          // дальше ждём открытия каналов; если не открылись — onConnectionState разрулит
          return;
        }
        await sleep(900);
      }
    }
  })();

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
      try { fast?.close(); ctl?.close(); pc.close(); } catch { /* */ }
    },
  };
}

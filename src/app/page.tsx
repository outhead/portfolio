"use client";

import ProjectCard from "@/components/ProjectCard";
import ParticlePortrait from "@/components/ParticlePortrait";
import PulseAnimation, { type PulseVariant } from "@/components/PulseAnimation";
import LedText from "@/components/LedText";
import { LedBoard, LedCounter, LedLines, type LedLine } from "@/components/LedBoard";
import { Oled, PixelGlyph, GLYPH_ORG, GLYPH_GRID, GLYPH_CODE } from "@/components/OledKit";
import FinalCTA from "@/components/FinalCTA";
import PixelCubePile from "@/components/PixelCubePile";
import PixelPhoto from "@/components/PixelPhoto";
import BioRotator from "@/components/BioRotator";
import ConstellationFigures from "@/components/ConstellationFigures";
import { TypographyFix } from "@/components/TypographyFix";
import { workProjects } from "@/data/projects";
import { Plus } from "lucide-react";
import { ymGoal } from "@/lib/yandex-metrika";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Code2,
  Send,
  Mail,
  FileDown,
  MapPin,
  ArrowRight,
  Users,
  Sparkles,
  Globe,
  Layers,
  ArrowUpRight,
  Play,
} from "lucide-react";

// Любимые выступления — пиксельные превью на главной (прямые ссылки на видео).
// Полный список — на /speaking.
const SPEAKING_PICKS: Array<{ label: string; url: string; thumb: string }> = [
  {
    label: "«ИИ бесполезен» — подкаст про ИИ",
    url: "https://youtu.be/iGQzN9T4upA",
    thumb: "/images/gpn/links/ai-fun.jpg",
  },
  {
    label: "ЦЕХ News #13 — ИИ в дизайне",
    url: "https://youtu.be/4s7j57G71fg",
    thumb: "/images/gpn/links/ai-edited.jpg",
  },
];

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
  </svg>
);

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.58v-2.1c-3.34.72-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.08-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.82 1.31 3.5 1 .1-.78.42-1.32.76-1.62-2.67-.3-5.48-1.34-5.48-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.52 11.52 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .3" />
  </svg>
);

// === Motion ===
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const viewport = { once: true, margin: "-10% 0px -10% 0px" };

// ───────────────────────────────────────────────────────────────────
// SectionLabel (bracket mono)
// ───────────────────────────────────────────────────────────────────
function SectionLabel({
  children,
  tone = "dark",
}: {
  children: React.ReactNode;
  tone?: "dark" | "light";
}) {
  const isLight = tone === "light";
  return (
    <div
      className={`inline-flex items-center gap-2 ${
        isLight ? "text-black/65" : "text-white/75"
      }`}
    >
      <span className="sr-only">{children}</span>
      <LedText text="[" className="h-[12px] md:h-[13px] w-auto text-[#C9A66B]" />
      <LedText
        text={typeof children === "string" ? children : ""}
        className="h-[12px] md:h-[13px] w-auto"
      />
      <LedText text="]" className="h-[12px] md:h-[13px] w-auto text-[#C9A66B]" />
    </div>
  );
}


// ───────────────────────────────────────────────────────────────────
// DotGlobe — интерактивный дотовый глобус: точки только на суше
// (world-atlas 110m, 180×90 bitgrid), drag-to-rotate + автовращение,
// маркер Москвы с пульсацией. Рендер в canvas для плавности.
// ───────────────────────────────────────────────────────────────────
const LAND_GRID_B64 =
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf4AP/AAAAAAAAAAAAAAAAAAAAAAAAX/z///+AAAAAAAABAAAAAAAAAAAAAYd8P///wAA+AAAAAA8AAAAAAAAAAAwAnw////4AAIAAAAAAGAAAAAAAAAAADivwAf//wAAAAADAAf/wAHYAAAAAADoi3sAP//gAAAAAMAD///sAAAAgBgACfwz/AD/+gAAAwAEHf///////+AP//////////////4A//EgAAAAAAAgH///////////////gAFAAgAAAAAAAAz///////////////BhQAAAAAAAAAAAAP/////4A0B4AAAD5/////////////Af3////gHgA4AAAH5///////////LwAHgH///gHkAAAAAH4/////////+CIAABAB///4D+AAAAGCx/////////4A8AAIAAf///n/gAAAOCD/////////wA4AAAAAf///n/wAAAbP///////////AgAAAAAP/////wAAADf//////////9AAAAAAAF////0YAAAB///////////9AAAAAAAD////8EAAAB///////////5AAAAAAAD////2AAAAB/f5fP//////wAAAAAAAD////gAAAAfxnwPP//////jAAAAAAAD////AAAAAPCb3/n/////+CAAAAAAAD///8AAAAAfALf/n////+ECAAAAAAAB///8AAAAAGHQP/n/////mMAAAAAAAA///8AAAAAH+Ai///////E8AAAAAAAAf//wAAAAAP/AA///////BgAAAAAAAAP//gAAAAAf/73///////gAAAAAAAAAD/AQAAAAAf////f/////gAAAAAAAAAF+AQAAAAB///+/n/////AAAAAAAAAAC+AAAAAAB///+f0H////AAAAAAAAAAAeAwAAAAD////f/B///8gAAAAAAAAAAeGEAAAAH////v+B/z/AAAAAAAAAAAAPMAgAAAD////n+A/B+gAAAAAAAAAAAD8AAAAAD////n4AeB/AgAAAAAAAAAAAPAAAAAH////3gAcAfAgAAAAAAAAAAADAAAAAD////6AAcAfggAAAAAAAAAAABDwAAAD////8wAMATAIAAAAAAAAAAAAr/AAAB/////gAKASAAAAAAAAAAAAAAH/gAAA/////gACAAAIAAAAAAAAAAAAH/8AAAaH///AAAAsGAAAAAAAAAAAAAH/+AAAAB//+AAAAUOAAAAAAAAAAAAAP/+AAAAB//8AAAAYegAAAAAAAAAAAAP//gAAAD//4AAAAMeBgAAAAAAAAAAAP//8AAAB//wAAAAGdiuAAAAAAAAAAAf///AAAA//wAAAACAQHgAAAAAAAAAAP///gAAA//wAAAABwAHwgAAAAAAAAAH///AAAA//wAAAAACIDQIAAAAAAAAAH//+AAAAf/wAAAAAAAAAAAAAAAAAAAD//+AAAA//wgAAAAABxAAAAAAAAAAAD//+AAAA//wgAAAAAPxgBAAAAAAAAAA//8AAAA//jgAAAAAf5gAAAAAAAAAAAf/8AAAA//DgAAAAAf/gAAAAAAAAAAAf/8AAAAf/DAAAAAD//4CAAAAAAAAAAf/wAAAAf/DAAAAAH//4AAAAAAAAAAAf/AAAAAf+CAAAAAH//8AAAAAAAAAAAf/AAAAAP8AAAAAAH//+AAAAAAAAAAA/+AAAAAP8AAAAAAH//+AAAAAAAAAAA/+AAAAAH4AAAAAAD//+AAAAAAAAAAA/8AAAAAHwAAAAAADwf8AAAAAAAAAAA/gAAAAAAAAAAAAACAH4AIAAAAAAAAB/wAAAAAAAAAAAAAAAD4AEAAAAAAAAB+AAAAAAAAAAAAAAAAAAAGAAAAAAAAB6AAAAAAAAAAAAAAAAAwAMAAAAAAAAA8AAAAAAAAAAAAAAAAAQAYAAAAAAAAB4AAAAAAAAAAAAAAAAAAAwAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAACAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAeAAIP+f/gAAAAAAAAAAAMAAAAAAABP/+H//////AAAAAAAAAAA+AAAAAf////8////////AAAAAAAOEAPAAAB///////////////gAAAP//T//8AAAH//////////////+AAAH/////4AAAH///////////////8AAE//////4ABw////////////////8AAAD//////gCA////////////////wAAAf/////////////////////////+AAH/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

// Побережья — упрощённые полилинии из world-atlas land-110m.json
// Формат: uint16 numArcs, затем на каждую дугу: uint16 N, потом N × (int16 lon*100, int16 lat*100)
const COASTLINE_B64 =
  "ggAEALvovOCA6FzgG+am4LvovOADAM/B8uANwEzhz8Hy4AUAXe6D4RPvveDY6oHg/uyD4V3ug+EEAKfQSuOg0UzjGtA646fQSuMEAPTOTOONzyXjSM5O4/TOTOMEAFbZ5+Ns2qzjB9jr41bZ5+MGAEPlSOQ85K7js+IC5NnjMeSP5BjlQ+VI5EIAsLnp3p29PN9Bwqfe" +
  "GcjI3gHET99KxPTfvMJS4M7GnuBTwx7hJML34ePExOFlx6DiftM04/zVouLk2MHigNei4zriG+MS5XvjxuXb4zrlxOS75eDla+lJ51nmdeXb52DkPeg242zkEOLU4QniO+OR4YXhEuFC6X7f2fSe4Gj0CuEU8vbgBvJm4Sj5p+L3+W3jUf1L5JUKeuQ7DT7lGQ++5E4VSub/F3Xl6Rp35Tcb9eR9Gork+hpk5Isa7+NLG8bj2hy05F8iI+ZqJa3lKyhk5nop2uVgLETmzy655cM0feayNdjl1Tjd5eFC/uPlPzjiPEE94TE/FOFrPmHgLUJB36RFAd+wueneBwCJ5ffql+ai6vXkUurW4lzrOeTh6unkfOuJ5ffqBAAh6QrsU+m66xjov+sh6QrsBAB0G5Xs2hqP7O4aAu10G5XsBQDMOBHw7TkJ8Mc5H+8NOf3uzDgR8AYAlkME8BFE2e+cQ9/uJULI7RxB8u2WQwTwBwA1RODxvEVG8XREt+/mQ5HwPkRm8W9Dg/I1RODxAwBIQVj3E0Al+EhBWPcDAK1FOvlKRej4rUU6+QMAsLmI+RVGmvmwubn5AgCwubn5sLmI+QIAsLm5+bC5iPkCAJFBkfmRQZH5AgBHQSv6R0Er+ggAjhO0+mYSQvY0ET325RBi910RqvmjEk36OBNM+44TtPocABQ4oPrJOCX6LzmY+NI70fXNO+zzmDph8Sg5wPDwNibx/TWR8nM1OvLVNSbzHzVf8k0zsvMbLk7y7yyk8jEtp/NGLMz1nyy69ZcsgPc2L1D4GTFx+qIyJ/q0M6f7UTVe++40JPrGNhX5rDfV+xQ4oPoCAFQ/6PtUP+j7AwAnLwD8eS5E/CcvAPwDANU+JfxiPmT81T4l/AMAKD9A/Lo+wPwoP0D8BACcMAr8OjAA/L4xuPycMAr8BAAOLtf8iS6Z/JotefwOLtf8AwACMNf82C6P/AIw1/wDAHQ+vvzNPRr9dD6+/AMAij0h/SY9bP2KPSH9BQBuKlr9My27/CgpU/1tKbL9bipa/QIAoTST/aE0k/0DAOQ8Vv1cPP795DxW/QQAXjvc/fA5wf0yO1/+Xjvc/QMAtTGm/jcxwv61Mab+AwD3Msv+9jGt/vcyy/4DANI7Pv7aOu7+0js+/g8AZjSN/+o0r/4JNlb/ejh+/t063vuKOAX9tzdb/ME1t/wrNiT94TXl/fIzZf6PM+b+OjQj//wyov9mNI3/CwDsMI4A8i4YAD0vc/8uMML/dy9B/xww6v1BL/n+Cy/X/aEu5v3jLjkA7DCOAAQARTJxAAoypv/5MdkARTJxAAcAVim3/RIoWv45JSQCFCYNApAoCgBzKc7+Vim3/QwACy63AHwuWgAFLk4AXy1v/g4r2/6dKtL/1irJACQsNgGZLbQCji4dAtMtRAELLrcABgBeMUkD/DAuAkkwDwOgL88C/TDQA14xSQMFALofbAIzH6QCTx/WA/Mf8AK6H2wCAwAy6PMDzefxAzLo8wMEAG4wBATOL8sDeDBjBG4wBAQEAEoupAPGLUUDry5xBEoupAMEAJwvpQQYMIYEqC8UBJwvpQQEAAYxwATAMPUDizDoBAYxwAQEAHkvGwVeL8UEAC9DBXkvGwUHAGQvOgfbL60GjS+ZBWswYgV4MOYE5y7ZBWQvOgcDAGHmHwe85S0HYeYfBwMA9uH7BmbhHwf24fsGBQCm48MHUOVFB+riKge/40sHpuPDBwQAGitMB28qkQdHK9gHGitMBwMAPsN0Bx7D6wc+w3QHAgAIwxAICMMQCAIAxMJGCMTCRggCAGvCVAhrwlQIAgDBwZYIwcGWCAYA4ODlCAbj7Aeg4cIHDeDYCM/ejgjg4OUIAwC24UgJdeHZCbbhSAkFAFYv5wgrL5UI6y40CXYv4glWL+cIAwCa4WIKJuF3CprhYgoDAOzhYwqd4ZAK7OFjCgMAmDRXDbQz4wyYNFcNAwCCDe8Nmgy2DYIN7w0DAEIJ8w1FCsoNQgnzDQQAEAbvDuYFTg7bBLEOEAbvDgQAmQMZEHEDMw8wA/8PmQMZEAwAEjeCDsk2ug0LNRINxDSEDSszPQ2QM/MM3DJGDI0yAg3OM9cNADXhDTk3KhASN4IOAwC8A3cQVgOCELwDdxAFADc4QRHaOOYQrDY9EHU3yxE3OEERAwAi5y8Sx+ckEiLnLxIDANvnLxPM5nsT2+cvEwMAwc/zEtzN1RPBz/MSCAAT6s0T0Ol1ExzrPRNF6zoS0OqnEtnomBJb6icUE+rNEwMAKcwcFcLMYhQpzBwVBwAdONMTgTgiE+43QxMPOAYSgTf1EY03LxUdONMTBgBZ/WoUGvw+FDf8DBVf/Y0Vyv1QFVn9ahQDAPUEuRVCBMoV9QS5FQQAO8RQFpXDchaSxH8WO8RQFg4A1P7nFmn+exY8/4gWyP7dFagAmhSRAAkU9P2EE6v+FxTx/U8UNv7mFNn+FhWZ/S4WC/7nFtT+5xYDAFK/ZxeXvoUXUr9nFwMACeFIGJzgOhgJ4UgYAwAC4H8YMd9lGALgfxgDAOu86hgbvroY67zqGAQAvN6mGbbg5Rju3dIYvN6mGQkAVfr2Ga/6cRm2+M4YHPf8GH73KBmk9lkZUfeKGX/2oRlV+vYZBABd4jsa1OFnGqnikRpd4jsaBgCwufAa5rvqGaK9xhlxvBkZM7rTGbC5YhkCALC5YhmwufAaAwCj2v8aBNkcG6Pa/xoDALC58BtQRqsbsLnwGwMAsLnwG6K61xuwufAbkgCh3CYb4d1AGpjeTBu63zYbQuBoGn/eABqc2zoYBNsHF/LbTRbd34sVyeABFEzhiBTR4FsVGuIVFlTh+RbK4WEXfeFYGCjjZBjR5NoX7+QIF5PlvRbG5pIX3OcCFpvpVxVA6l8UjeigExDmnxM55EoSl+Y7E9HmEBL45+wRXOhdEqTo8BF45gMRKOZfEdbmsRHG5aIRY+TPEKzkRBB/4m4PVuKKDi3iSw9r4uMNOuBIDJrg2Qkm38ELV9ubC0XaDwvF2cQIY9qMBwzcTwe83DQI/91qCEPdNQZr3/cFQ99WBDDgbwP84WAD+ePcBP7jiwOu5MAEXeUgBNTnMASh5+MDrelVAvTrpAFR7Pj/de5l/5bu8/5i8OH+GPL9/W/yIv3l8Ob6AfBu92PtR/bn7M30++qQ8i3pwfLR6Zbx3ejg8Kbn1fB95/nvkOb27zbnYO+35TXuOeYz7f7kL+xh5Y3rQ+T56rnilut34v3sC+Oq7XPix+2Y43Lv9+Id7xjkVvOY5Ej4FuQ4+U/iR/pD4Jr91+D2/mPglv/f4YEBduFAA+zgfQNn4NICit7hA9PdMgWS1yUHy9bLB5XW5Qgq02wMQdUPCS7Uqgkv0ukM4tCFDWjPvw9Lz9ISHdBmEgTQJBM4ztsToMu0FonGyRe9xBwXKsXwFx3C3xWhv0AVqMIEF7vA6xYcvwYYMsFPGVW+pxnYwNQZ3L60GtbC4Buuyuoa8s2IG3jVUhqJ1uAaX9htGtnZyhpz2kkaMdv7GlHaYRvP2hgcodwmGwsAZ9OQHL3V/Ruo1Y0cZNaMHI7YWxv919savdPGGirSVBsW1H0bXNH0G2fTkBwDAC7Xrhw61rIcLteuHAMALuKOHGjgpRwu4o4cFgAw3pQc2N/PHHXgJhzI4/Qb1+UHGx/l2BrX5x4aCOdkGW/l4hm95sMYIuXnGCfmMRjE4kQZpeEXGZLhgxkc45IZg+N1GijhaRvj3NIbEN2RHHne1Bww3pQcBwDM2Ngc9tnQHDja/hv211McxNhnHFbYqBzM2NgcAwAYOJkcojapHBg4mRwFAJjbbRy72iYcftqwHKXc2hyY220cBgDy0OQbz84THJbPyBw0zwUd4dKzHPLQ5BsDAOE6VB0UOV0d4TpUHQMAb9tKHS7aRR1v20odAwCtOIQdgjVmHa04hB0EAIbZ+B2o2Uwd9teEHYbZ+B0GALvVxB211nwdKtQSHQXSYh3s0uAdu9XEHQcAeRagGxoUIhy7FVQd5RrmHdgWBx2mFUUceRagGwUABNseHtHgRB3v3BwdENr7HQTbHh4DAJzSVR4C0LwdnNJVHg0ALxMgEK8Tug84E64OBxVwDpYUow9iFf8P/BR0EKEUERCnE20RuBSuEbgUTRI8Em0RLxMgENkAsLliGU9GYRlNRT0ZA0ZWGIlCZBfiP2MXSj/AFr8/ghZUP20VPz3tE+g8LRY/QG8YjD6nFzo+IRg4Pf8XPjxYF5A8GxeMNxAXyTRhFaY2KxU6N2gU/jUXEtExiA9tMrQNaTFvDY4xaQ63MOMO9DBzD0kvMg+EL/8PHC5QD3MuoQ7ML6IOiy6jDZ8vYQyILwcLRS3mCCQr8gdkKnwIXCm3B7UqPwWoKo8EFClcAxonPQXCJpwDOCgpArcogQCbJxQBaiYLA/QlnQbLJEQG2SQdB7Yj5Qj6IWYIYR82BjIfDARKHh0DuRw/Bl8cWAiHGygI7RnuCWwWDgoRFpoKYBVYCiAU4wqTE8cLvhK2CzwUYgkZFWwJBBZQCjUWeAldF7cIlxW7BvwQ8ASpEI4Ghw32CqQNhgtADc0KqgypC6QORQewEJYEbREUBPcTsgTxEygEphKmAVAPLP7uD0P6lw1G+NoNlPa5DPP1lAzF9AYLM/OpB2bynATx+FkFz/unBAj+cAOR/60DdQFOAqoBsQFzAnv84wGD+cEEHvnBBbH5Ewdf+Y0Ir/34DSf/vQ23A5cOVgRqDgoEMw11B9MLagjUDDENGQwgDlEOzApSDjkKag8XDWoQ+w7/D0oQZBBUDqwRSA92EqgNExIxDp8RPA1UEa0MtRECDQASAwwyEtAKohBBCwoQ1wi6D2QJtQ7JCDkOogdMECIF3hHrBDkROAexD5cGzA9KBtcOBQalD3kDVRE2AdMQKf9TDob8Zw5V/M8Qdv8yEYn/+RE1/gQTXv8AEz7/chMsA+kUVgNPFiIEjRbFA6sVRgQZFa4HQxVPCI8VbghtFmwJRxYeCR8XYAtzF1QIuBdqCK8Y7AlvGaoIrBn5BoMYsAb2F1cHeBc0BuoVDgWgFQwEOxc2AuMWTwJ2GH4HRhuXCb8bAAvPGwoQWhr+DsgZ9gwHGnUO8RiGDnIZdw80GXEQ+BkrEc8Z+RDJGhESqRobEgsa/BTmGmoXrBqnF0kbwxqZGg4avxsHG3QcWxxuHBEc5RvHHLka2BvoGUoc2RlRHXgajhzpGyodcxzUHcsbTh47HNYfBxxzH8UcwyhaHpUsoR28KvocmjG9HEkzpxupMxAcozbtG1s2ShzfNnUcHD6vG94+IBvERRwbsLnwGgMAWNtIHlTaZx5Y20geAwD11Foep9NdHvXUWh4DAKgJaR4ZCFgeqAlpHgMAKtW0HgrUoR4q1bQeAwCR2n4eednPHpHafh4DAOrYmR7L1voe6tiZHgQADCmXHtgmcB7hJ/8eDCmXHgUAIQciH2oI2B43Bv0dFQQdHyEHIh8EAPEJaR+1CkYfyQZgH/EJaR8DAPoTdx+FEXsf+hN3HwQACifQHp4jYh96Jb0fCifQHgYAAt4eH3re/h6H3I4eOdpQH+fbvh8C3h4fDgA+5Xcg1+dHIPXh/B6N4q0eiODCHQvd3x2G3W4ezt5KHqTdnR7C3v8eC95ZHwfgbh853P4fPuV3ICoAavWgINv3USCK8xwgO/vBHyv4Uh8T+U0fTvjDHsn4Eh6I9+8dQfi6He33XB1v+AYdy/ajHEr3MhxR9kEcgfeaGwb25xu09W8bRfdlG3PwkhlG73wYDu96FybtxhfV69sY6+o/GiHsURuk6jEbxOqqG+3rkRsx6v4boOpbHB3pgB0+5bYdHOQVHuzlOh5e43weVeYEH27lTB+H5/EfnO7mH7ztRyBq9aAg";

function DotGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Декод grid точек на суше ────────────────────────────────
    const LON_STEPS = 180;
    const LAT_STEPS = 90;
    const gridBin = atob(LAND_GRID_B64);
    const landDots: Array<{ lon: number; lat: number }> = [];
    for (let la = 0; la < LAT_STEPS; la++) {
      const lat = ((90 - (la + 0.5) * (180 / LAT_STEPS)) * Math.PI) / 180;
      for (let lo = 0; lo < LON_STEPS; lo++) {
        // шахматное прореживание — сбивает плотность в 2 раза и ломает
        // ровные ряды, визуально спокойнее
        if (((la + lo) & 1) === 0) continue;
        const idx = la * LON_STEPS + lo;
        const bit = (gridBin.charCodeAt(idx >> 3) >> (7 - (idx & 7))) & 1;
        if (bit) {
          const lon = ((-180 + (lo + 0.5) * (360 / LON_STEPS)) * Math.PI) / 180;
          landDots.push({ lon, lat });
        }
      }
    }

    // Побережья отключены — линии при 110m+DP упрощении корявые.
    // Константа COASTLINE_B64 оставлена в файле на случай будущего использования.

    // Без графикулы — чистый глобус в стиле референса
    const DEG = Math.PI / 180;

    // Москва
    const MOS_LAT = 55.75 * DEG;
    const MOS_LON = 37.62 * DEG;

    // Состояние анимации
    // HOME — точка покоя: Москва смотрит на зрителя чуть правее центра,
    // северный полюс наклонён к камере. После драга шар плавно возвращается
    // в HOME, чтобы метка Москвы всегда была видна, когда юзер не крутит.
    const HOME_LON = -0.6;
    const HOME_LAT = 0.75;
    const homeReturnPerSec = 1.4; // скорость возврата к HOME
    let rotLon = HOME_LON;
    let rotLat = HOME_LAT;
    let dragging = false;
    let lastPX = 0;
    let lastPY = 0;
    let lastMoveT = performance.now();
    // Инерция (рад/с) — задаётся в onMove, затухает после onUp
    let velLon = 0;
    let velLat = 0;
    let last = performance.now();
    let idleResumeAt = 0; // пауза перед возвратом к HOME (после клика/drag)
    let rafId = 0;

    const resize = () => {
      const DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * DPR);
      canvas.height = Math.round(rect.height * DPR);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!dragging) {
        const spd = Math.hypot(velLon, velLat);
        if (spd > 0.02) {
          // Инерционный выбег: экспоненциальное затухание (~12% за секунду)
          rotLon += velLon * dt;
          rotLat = Math.max(-1.1, Math.min(1.1, rotLat + velLat * dt));
          const decay = Math.pow(0.12, dt);
          velLon *= decay;
          velLat *= decay;
        } else if (now > idleResumeAt) {
          // Spring-back в HOME — Москва всегда возвращается на фронт.
          velLon = 0;
          velLat = 0;
          const k = 1 - Math.exp(-homeReturnPerSec * dt);
          // Кратчайший путь по долготе (через ±π), чтобы не «раскручиваться»
          // через накопленные обороты.
          let dHomeLon = HOME_LON - rotLon;
          if (dHomeLon > Math.PI) dHomeLon -= Math.PI * 2;
          else if (dHomeLon < -Math.PI) dHomeLon += Math.PI * 2;
          rotLon += dHomeLon * k;
          rotLat += (HOME_LAT - rotLat) * k;
        }
      }

      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(W, H) * 0.46;

      ctx.clearRect(0, 0, W, H);

      const cosT = Math.cos(rotLat);
      const sinT = Math.sin(rotLat);

      // Проекция lon/lat → экран + z (глубина)
      // project inline — избегаем аллокаций
      const projCache = { sx: 0, sy: 0, z: 0 };
      const project = (lon: number, lat: number) => {
        const cLat = Math.cos(lat);
        const sLat = Math.sin(lat);
        const eLon = lon + rotLon;
        const x1 = cLat * Math.sin(eLon);
        const y1 = sLat;
        const z1 = cLat * Math.cos(eLon);
        const y2 = y1 * cosT - z1 * sinT;
        const z2 = y1 * sinT + z1 * cosT;
        projCache.sx = cx + x1 * R;
        projCache.sy = cy - y2 * R;
        projCache.z = z2;
        return projCache;
      };

      // Слой 1: точки внутренности континентов (без контуров — они корявые)
      for (let i = 0; i < landDots.length; i++) {
        const p = landDots[i];
        const { sx, sy, z } = project(p.lon, p.lat);
        if (z < 0.04) continue;
        const op = 0.28 + 0.5 * z;
        const rr = 0.55 + 0.75 * z;
        ctx.globalAlpha = op;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(sx, sy, rr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Слой 2: тонкий контур лимба (горизонт сферы)
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      // Слой 5: маркер Москвы с пульсацией
      const m = project(MOS_LON, MOS_LAT);
      if (m.z > -0.15) {
        const visible = m.z > 0.02;
        const alphaMul = visible ? 1 : Math.max(0, 1 + m.z / 0.15);
        const pulse = 0.5 + 0.5 * Math.sin(now * 0.003);
        ctx.fillStyle = `rgba(166,255,0,${0.05 * alphaMul})`;
        ctx.beginPath();
        ctx.arc(m.sx, m.sy, 22 + 10 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(166,255,0,${0.22 * alphaMul})`;
        ctx.beginPath();
        ctx.arc(m.sx, m.sy, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(166,255,0,${alphaMul})`;
        ctx.beginPath();
        ctx.arc(m.sx, m.sy, 4.2, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    // Я.Метрика — фиксируем интеракт с глобусом ровно один раз за маунт
    // компонента. И отдельно — первый реальный drag (>3px), чтобы отличать
    // случайный клик от осознанного «покрутил».
    let goalInteractFired = false;
    let goalDragFired = false;
    let dragStartPX = 0;
    let dragStartPY = 0;

    // Pointer-интеракция
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastPX = e.clientX;
      lastPY = e.clientY;
      dragStartPX = e.clientX;
      dragStartPY = e.clientY;
      lastMoveT = performance.now();
      velLon = 0;
      velLat = 0;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
      if (!goalInteractFired) {
        goalInteractFired = true;
        ymGoal("globe_interact");
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const mdt = Math.max(0.008, (now - lastMoveT) / 1000);
      lastMoveT = now;
      const dx = e.clientX - lastPX;
      const dy = e.clientY - lastPY;
      lastPX = e.clientX;
      lastPY = e.clientY;
      const dLon = dx * 0.006;
      const dLat = dy * 0.006;
      rotLon += dLon;
      rotLat = Math.max(-1.1, Math.min(1.1, rotLat + dLat));
      // Сглаженная угловая скорость (рад/с) — ema с быстрым хвостом
      const vxNow = dLon / mdt;
      const vyNow = dLat / mdt;
      velLon = velLon * 0.5 + vxNow * 0.5;
      velLat = velLat * 0.5 + vyNow * 0.5;
      // Первый «реальный» drag — порог в 3px, чтобы не считать дрожание мышки.
      if (!goalDragFired) {
        const totalDx = e.clientX - dragStartPX;
        const totalDy = e.clientY - dragStartPY;
        if (Math.hypot(totalDx, totalDy) > 3) {
          goalDragFired = true;
          ymGoal("globe_drag");
        }
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
      canvas.style.cursor = "grab";
      // Ограничиваем максимальную инерцию, чтобы резкий «швырок» не улетал
      const maxV = 4.0;
      const sp = Math.hypot(velLon, velLat);
      if (sp > maxV) {
        velLon = (velLon / sp) * maxV;
        velLat = (velLat / sp) * maxV;
      }
      // Если пользователь не двигал шар вообще (клик) — не нужно идле-паузы
      idleResumeAt = performance.now() + (Math.hypot(velLon, velLat) > 0.02 ? 2400 : 600);
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onUp);
    canvas.style.cursor = "grab";

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full touch-none select-none"
      aria-hidden
    />
  );
}

// ───────────────────────────────────────────────────────────────────
// CAREER — hover-reveal list
// ───────────────────────────────────────────────────────────────────
const careerJobs: Array<{
  year: string;
  company: string;
  role: string;
  scope: string;
  details?: string[];
  current?: boolean;
}> = [
  {
    year: "Сейчас",
    company: "Свободный график",
    role: "Ментор · Консультант · AI Visioner",
    scope: "Менторинг, консалтинг, эксперименты в AI",
    details: [
      "30+ менти за карьеру (включая АД-период)",
      "Консалтинг: аудит дизайн-функций, найм, постановка процессов",
      "Читал курс по прикладному ИИ в ВШЭ",
    ],
    current: true,
  },
  {
    year: "2025–2026",
    company: "MWS AI",
    role: "AI Visioner",
    scope: "AI-дивизион МТС Web Services, 2 продукта",
    details: [
      "Задавал AI-направление двум флагманским продуктам дивизиона",
      "Определял UX-принципы для AI-агентов и чат-интерфейсов",
      "Собрал UI Kit для внутренних AI-продуктов",
    ],
  },
  {
    year: "2024–2025",
    company: "МТС",
    role: "Design Director",
    scope: "8 команд, 6 лидов, 3 арт-дира, 40+ дизайнеров, 4 запуска голосовой",
    details: [
      "Голосовая экосистема: 4 публичных запуска за 2025 (вкл. AI-шумоподавление, впервые на рынке моб. связи)",
      "Кросс-продуктовая интеграция Мой МТС: 30+ экосистемных продуктов в одном flow поверх 5 параллельных бизнесов",
      "AI в рутине ДЦВ: Cursor, Claude, Figma-плагины — пошёл первым сам",
    ],
  },
  {
    year: "2022–2024",
    company: "Газпром Нефть",
    role: "Head of Design",
    scope: "76 команд, 42 лида, 100+ дизайнеров, CX Award'24",
    details: [
      "Собрал единую дизайн-функцию из разрозненных команд",
      "Запустил дизайн-систему для 76 продуктов",
      "CX Awards'24 за Unified Service Portal (ESO)",
    ],
  },
  {
    year: "2021–2022",
    company: "Ozon",
    role: "Community Lead",
    scope: "Канал с 0 до 17К подписчиков, −60% к оттоку на найме",
    details: [
      "Построил дизайн-комьюнити с нуля",
      "Вырастил канал с 0 до 17К подписчиков",
      "Сократил отток на найме дизайнеров на 60%",
    ],
  },
  {
    year: "2017–2021",
    company: "МТС",
    role: "Art Director B2C",
    scope: "16 команд, 60+ дизайнеров, 11М+ пользователей",
    details: [
      "Арт-дирекшн B2C-экосистемы МТС",
      "×10 рост транзакций в МТС Cashback",
      "Унификация визуального языка по 16 командам",
    ],
  },
];

function CareerHoverList() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="rounded-2xl border border-white/[0.06] overflow-hidden bg-[#0f0f0e]">
      {careerJobs.map((job, i) => {
        const isExpanded = expandedIdx === i;
        const toggle = () =>
          setExpandedIdx((prev) => (prev === i ? null : i));

        return (
          <div
            key={job.year + job.company}
            className={`group relative ${i > 0 ? "border-t border-white/[0.06]" : ""} hover:bg-white/[0.025] transition-colors`}
          >
            {/* Mobile: вся строка — кнопка toggle */}
            <button
              type="button"
              onClick={toggle}
              aria-expanded={isExpanded}
              className="md:hidden w-full flex items-center gap-3 px-5 py-[18px] text-left"
            >
              <span
                className={`shrink-0 w-2 h-2 rounded-full ${
                  job.current ? "bg-[#A6FF00]" : "bg-white/25"
                }`}
                aria-hidden
              />
              <span className="shrink-0 text-white/70 w-[76px]">
                <span className="sr-only">{job.year}</span>
                <LedText text={job.year} className="h-[9px] w-auto" />
              </span>
              <span className="flex-1 min-w-0 flex flex-col gap-1">
                <span className="text-white">
                  <span className="sr-only">{job.company}</span>
                  <LedText text={job.company} className="h-[11px] w-auto" />
                </span>
                <span className="font-service text-[16px] tracking-[0.02em] text-white/60 leading-tight">
                  {job.role}
                </span>
              </span>
              <ArrowRight
                className={`w-4 h-4 text-white/40 transition-transform shrink-0 ${
                  isExpanded ? "rotate-90" : ""
                }`}
                strokeWidth={1.75}
              />
            </button>

            {/* Desktop: статичная строка (hover-раскрытие ниже через group-hover) */}
            <div className="hidden md:flex items-center gap-6 px-7 py-5">
              <span
                className={`shrink-0 w-2 h-2 rounded-full ${
                  job.current ? "bg-[#A6FF00]" : "bg-white/25"
                }`}
                aria-hidden
              />
              <span className="shrink-0 text-white/70 w-[110px]">
                <span className="sr-only">{job.year}</span>
                <LedText text={job.year} className="h-[10px] w-auto" />
              </span>
              <span className="flex-1 min-w-0 flex flex-row items-baseline gap-3">
                <span className="text-white min-w-0">
                  <span className="sr-only">{job.company}</span>
                  <LedText text={job.company} className="h-[12px] w-auto" />
                </span>
                <span className="font-service text-[16px] tracking-[0.02em] text-white/60 leading-tight truncate">
                  {job.role}
                </span>
              </span>
            </div>

            {/* Desktop: hover-раскрытие */}
            {job.details && (
              <div
                className="hidden md:grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                aria-hidden="true"
              >
                <div className="overflow-hidden">
                  <div className="px-7 pb-6 pl-[calc(28px+8px+24px+110px+24px)]">
                    <p className="text-[16px] text-white/78 leading-relaxed mb-3">
                      {job.scope}
                    </p>
                    <ul className="space-y-1.5">
                      {job.details.map((d) => (
                        <li
                          key={d}
                          className="flex items-start gap-2 text-[16px] text-white/72 leading-snug"
                        >
                          <span className="mt-[7px] h-px w-2 shrink-0 bg-white/30" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile: click-раскрытие */}
            <AnimatePresence initial={false}>
              {isExpanded && job.details && (
                <motion.div
                  key="career-mobile-expand"
                  className="md:hidden overflow-hidden"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="px-5 pt-0.5 pb-5">
                    <p className="text-[16px] text-white/78 leading-relaxed mb-3">
                      {job.scope}
                    </p>
                    <ul className="space-y-1.5">
                      {job.details.map((d) => (
                        <li
                          key={d}
                          className="flex items-start gap-2 text-[16px] text-white/72 leading-snug"
                        >
                          <span className="mt-[7px] h-px w-2 shrink-0 bg-white/30" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// ServiceTile — плитка «Услуги & экспертиза» с pulse-анимацией.
// Hover активирует анимацию на десктопе. На мобиле — IntersectionObserver:
// когда плитка попадает в центр viewport, анимация активируется (по очереди при скролле).
// ───────────────────────────────────────────────────────────────────
type ServiceTileData = {
  key: string;
  index: string;
  label: string;
  title: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>;
  accent: string;
  animation: PulseVariant;
  animationReverse?: boolean;
  body: string;
  items: string[];
};

function ServiceTile({ tile }: { tile: ServiceTileData }) {
  const { label, title, Icon, accent, animation, animationReverse, body } = tile;
  const tileRef = useRef<HTMLDivElement>(null);
  const [mobileActive, setMobileActive] = useState(false);

  // IntersectionObserver: активирует pulse на мобиле, когда плитка пересекает
  // тонкую полосу чуть ниже середины viewport (50%—65% от верха).
  // На md+ pulse работает через hover, и mobileActive остаётся false.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 767px)");
    const el = tileRef.current;
    if (!el) return;

    let io: IntersectionObserver | null = null;

    const setup = () => {
      io?.disconnect();
      if (!mql.matches) {
        setMobileActive(false);
        return;
      }
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            setMobileActive(entry.isIntersecting);
          }
        },
        {
          // Полоса 50%—65% от верха viewport: top=-50% поднимает верх корня
          // на середину, bottom=-35% оставляет 15% активной зоны чуть ниже середины.
          rootMargin: "-50% 0px -35% 0px",
          threshold: 0,
        }
      );
      io.observe(el);
    };

    setup();
    mql.addEventListener("change", setup);
    return () => {
      mql.removeEventListener("change", setup);
      io?.disconnect();
    };
  }, []);

  return (
    <motion.div
      ref={tileRef}
      variants={fadeUp}
      className="group isolate relative w-full h-full rounded-2xl border border-white/[0.06] bg-[#0f0f0e] hover:border-white/[0.2] transition-colors p-6 md:p-8 flex flex-col gap-5 md:gap-6 min-h-[360px] md:min-h-[420px] overflow-hidden"
    >
      {/* Верх: index / icon / label */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon
            className="w-5 h-5 md:w-6 md:h-6"
            style={{ color: accent }}
            strokeWidth={1.75}
          />
          <span style={{ color: `${accent}CC` }}>
            <span className="sr-only">{label}</span>
            <LedText text={`( ${label} )`} className="h-[10px] w-auto" />
          </span>
        </div>
      </div>

      {/* Заголовок — пиксельный, единым языком с табло хиро */}
      <h3 className="text-white min-h-[40px] md:min-h-[46px]">
        <span className="sr-only">{title}</span>
        <LedText text={title} scale={2} dot={1.45} className="h-[16px] md:h-[19px] w-auto max-w-full" />
      </h3>

      {/* Pulse-анимация. Фиксированная высота (не flex-1!), чтобы круг
          стоял на одной y-координате во всех плитках. Default — статичный
          серый кадр; hover (десктоп) или scroll-into-view (мобила) — зелёная анимация. */}
      <div className="h-[150px] md:h-[165px] my-4 md:my-7 flex items-center justify-center">
        <div className="relative w-[140px] h-[140px] mx-auto">
          <PulseAnimation
            variant={animation}
            reverse={animationReverse}
            active={mobileActive}
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </div>

      {/* Описание — прижато к низу карточки (на место бывших items),
          mt-auto выравнивает низ всех 3 карточек по горизонтали. */}
      <p className="text-[16px] md:text-[16px] leading-relaxed text-white/74">
        {body}
      </p>
    </motion.div>
  );
}

// ───────────────────────────────────────────────────────────────────
// TOOLBOX — ряд инструментов (stokt «Everyday's Toolbox»)
// ───────────────────────────────────────────────────────────────────
const tools: Array<{ name: string; icon: React.ReactNode }> = [
  {
    name: "Figma",
    icon: (
      // Серый по умолчанию (currentColor), на ховер группы — фирменные 5 цветов
      <svg viewBox="0 0 38 57" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"          className="fill-current group-hover:fill-[#1ABCFE] [@media(hover:none)]:fill-[#1ABCFE] transition-colors" />
        <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"  className="fill-current group-hover:fill-[#0ACF83] [@media(hover:none)]:fill-[#0ACF83] transition-colors" />
        <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z"                     className="fill-current group-hover:fill-[#FF7262] [@media(hover:none)]:fill-[#FF7262] transition-colors" />
        <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" className="fill-current group-hover:fill-[#F24E1E] [@media(hover:none)]:fill-[#F24E1E] transition-colors" />
        <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" className="fill-current group-hover:fill-[#A259FF] [@media(hover:none)]:fill-[#A259FF] transition-colors" />
      </svg>
    ),
  },
  {
    name: "Photoshop",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <rect x="2" y="2" width="20" height="20" rx="3" strokeWidth="1.5" fill="none"
          className="stroke-current group-hover:stroke-[#31A8FF] [@media(hover:none)]:stroke-[#31A8FF] transition-colors" />
        <text
          x="12"
          y="16.5"
          textAnchor="middle"
          fontWeight="700"
          fontSize="11"
          className="fill-current group-hover:fill-[#31A8FF] [@media(hover:none)]:fill-[#31A8FF] transition-colors"
        >
          Ps
        </text>
      </svg>
    ),
  },
  {
    name: "Illustrator",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <rect x="2" y="2" width="20" height="20" rx="3" strokeWidth="1.5" fill="none"
          className="stroke-current group-hover:stroke-[#FF9A00] [@media(hover:none)]:stroke-[#FF9A00] transition-colors" />
        <text
          x="12"
          y="16.5"
          textAnchor="middle"
          fontWeight="700"
          fontSize="11"
          className="fill-current group-hover:fill-[#FF9A00] [@media(hover:none)]:fill-[#FF9A00] transition-colors"
        >
          Ai
        </text>
      </svg>
    ),
  },
  {
    name: "Claude",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path className="fill-current group-hover:fill-[#D97757] [@media(hover:none)]:fill-[#D97757] transition-colors" d="M4.709 15.955l4.72-2.647.079-.23-.079-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.061 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.729-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.929-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312z" />
      </svg>
    ),
  },
  {
    name: "Nano Banana",
    icon: (
      // Сплошной банан-силуэт: серый по умолчанию, жёлтый на ховер
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path
          className="fill-current group-hover:fill-[#FFD60A] [@media(hover:none)]:fill-[#FFD60A] transition-colors"
          d="M5.15 17.89c5.52-1.52 8.65-6.89 7-12C11.55 4 11.5 2 13 2c3.22 0 5 5.5 5 8 0 6.5-4.2 12-10.49 12C5.11 22 2 22 2 20c0-1.5 1.14-1.55 3.15-2.11Z"
        />
      </svg>
    ),
  },
  {
    name: "Cursor",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M11.925 24l10.425-6-10.425-6L1.5 18l10.425 6z M22.35 18L11.925 12V0L22.35 6v12z M1.5 18V6l10.425 6v12L1.5 18z" />
      </svg>
    ),
  },
  {
    name: "Seedance",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 15 Q 7.5 5, 12 15 T 21 15" />
        <circle cx="3" cy="15" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="21" cy="15" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "Three.js",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M.38 0a.27.27 0 0 0-.256.332l2.894 12.236a.27.27 0 0 0 .407.17l3.726-2.42 2.504 9.998a.27.27 0 0 0 .41.167L23.877 12.3a.27.27 0 0 0 .046-.416L.565.077A.27.27 0 0 0 .381 0zm.47.602L22.98 11.655l-11.832 7.59L8.614 9.12a.27.27 0 0 0-.408-.169L4.48 11.372z" />
      </svg>
    ),
  },
];

function Toolbox() {
  // 8-плиточный bento с иконками: каждая карточка — иконка тулзы + name.
  // Подзаголовок «без ритуалов и ярлыков» — лёгкая ирония к шаблонным «my stack» секциям.
  return (
    <section className="relative z-[1] bg-black border-t border-white/[0.06]">
      <div className="px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] py-10 md:py-14">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          <motion.div
            variants={fadeUp}
            className="mb-6 md:mb-8 flex items-baseline gap-3"
          >
            <SectionLabel>ИНСТРУМЕНТЫ</SectionLabel>
            <span className="text-[14px] md:text-[16px] text-white/40 tracking-[0.06em]">
              которые я использую каждый день
            </span>
          </motion.div>

          <motion.div
            variants={stagger}
            className="grid grid-cols-4 md:grid-cols-8 gap-2.5 md:gap-3"
          >
            {tools.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                title={t.name}
                className="group relative rounded-xl border border-white/[0.06] bg-[#0f0f0e] hover:border-[#A6FF00]/30 transition-colors px-3 py-4 md:py-5 flex flex-col items-center justify-center gap-3 min-h-[86px] md:min-h-[96px] overflow-hidden"
              >
                <div className="w-6 h-6 md:w-7 md:h-7 text-white/72 group-hover:text-white [@media(hover:none)]:text-white transition-colors">
                  {t.icon}
                </div>
                <span className="text-white/70 group-hover:text-white [@media(hover:none)]:text-white transition-colors">
                  <span className="sr-only">{t.name}</span>
                  <LedText text={t.name} className="h-[8px] md:h-[9px] w-auto" />
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════
const HERO_BUBBLES = [
  "Воу. Интерактив.",
  "По сайту спрятаны пасхалки и мини-задания.",
  "Долистай до конца — там кнопка с сюрпризом.",
  "Жми на цифры и логотипы",
];
const TEXT_START = 4; // индексы текст-форм начинаются здесь
const HERO_SHAPES = [
  { src: "/images/hero-portrait.png", depth: "/images/hero-depth.png" }, // 0 рим-свет (я)
  { src: "/images/face-c-portrait.png", depth: "/images/face-c-depth.png" }, // 1 награда
  { src: "/images/face-e-portrait.png", depth: "/images/face-e-depth.png" }, // 2 бас
  { src: "/images/fig-a-portrait.png", depth: "/images/fig-a-depth.png", depthScale: 0.35 }, // 3 глитч (фигура из точек)
  ...HERO_BUBBLES.map((_, i) => ({
    src: `/images/txt-${i}-portrait.png`,
    depth: `/images/txt-${i}-depth.png`,
  })), // 4..7 фразы из частиц
  { src: "/images/egg-portrait.png", depth: "/images/egg-depth.png", depthScale: 0.5 }, // 8 яйцо (одиночный клик по МТС)
];
const SHAPE_EGG = TEXT_START + HERO_BUBBLES.length; // 8

// ── Счётчик пасхалок (egg hunt) ────────────────────────────────────
// Реестр пасхалок главной. total = длина списка (растёт, когда добавляем
// новые: лого-центр, инструменты и т.д.). Прогресс — localStorage, событие
// `egg:found` с detail=id. Любая пасхалка зовёт foundEgg(id).
const EGGS: { id: string; label: string }[] = [
  { id: "award", label: "Награда" },
  { id: "bass", label: "Цифры" },
  { id: "glitch", label: "Глитч-код" },
  { id: "egg", label: "Яйцо" },
  { id: "constellation", label: "Созвездие" },
  { id: "cta", label: "Кнопка «не нажимать»" },
];
const EGG_IDS = new Set(EGGS.map((e) => e.id));
// Зафиксированный total счётчика. НЕ берём длину списка — растёт явным числом,
// когда сам решаешь раскрыть новые. Сейчас 6.
const EGG_TOTAL = 6;
const EGG_STORE_KEY = "egg-hunt-found-v1";
function foundEgg(id: string) {
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent("egg:found", { detail: id }));
}
function useEggHunt() {
  const [found, setFound] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const raw = localStorage.getItem(EGG_STORE_KEY);
      if (raw) setFound(new Set((JSON.parse(raw) as string[]).filter((i) => EGG_IDS.has(i))));
    } catch {}
    const onFound = (e: Event) => {
      const id = (e as CustomEvent).detail as string;
      if (!id || !EGG_IDS.has(id)) return;
      setFound((prev) => {
        if (prev.has(id)) return prev;
        const n = new Set(prev);
        n.add(id);
        try { localStorage.setItem(EGG_STORE_KEY, JSON.stringify([...n])); } catch {}
        return n;
      });
    };
    window.addEventListener("egg:found", onFound);
    return () => window.removeEventListener("egg:found", onFound);
  }, []);
  return { found, count: found.size, total: EGG_TOTAL };
}
// Финальный залп при сборе всех пасхалок — лаймовый, из двух нижних углов.
function fireEggHuntFinale() {
  const lime = ["#A6FF00", "#B8FF33", "#F2F4EF"];
  confetti({ particleCount: 90, spread: 70, startVelocity: 55, origin: { x: 0, y: 1 }, angle: 60, colors: lime });
  confetti({ particleCount: 90, spread: 70, startVelocity: 55, origin: { x: 1, y: 1 }, angle: 120, colors: lime });
  setTimeout(() => confetti({ particleCount: 120, spread: 100, startVelocity: 45, origin: { x: 0.5, y: 0.7 }, colors: lime }), 250);
}

export default function PreviewHome() {
  const heroSphereRef = useRef<HTMLDivElement>(null);
  // Пасхалки портрета: форма + наборы кликнутых чисел/логотипов
  const [heroShape, setHeroShape] = useState(0);
  const [clickedNums, setClickedNums] = useState<Set<number>>(new Set());
  const [bubbleStage, setBubbleStage] = useState(0);
  // «Портрет вовлечён» — любой триггер пасхалки форсит сборку облака, чтобы
  // морф был виден, даже если до этого по портрету не наводили. Сбрасывается
  // по hero:home. Чинит баг: клик по МТС/цифрам без ховера ничего не показывал.
  const [heroEngaged, setHeroEngaged] = useState(false);
  // Счётчик пасхалок
  const { count: eggCount, total: eggTotal } = useEggHunt();
  const eggDone = eggTotal > 0 && eggCount >= eggTotal;
  const eggCelebrated = useRef(false);
  useEffect(() => {
    if (!eggDone || eggCelebrated.current) return;
    eggCelebrated.current = true;
    let already = false;
    try { already = localStorage.getItem("egg-hunt-celebrated") === "1"; } catch {}
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!already && !reduce) fireEggHuntFinale();
    try { localStorage.setItem("egg-hunt-celebrated", "1"); } catch {}
  }, [eggDone]);
  // Текущая форма в ref — чтобы скролл-подсказка не морфила поверх
  // залипших пасхалок (бас/награда) и срабатывала только в покое.
  const heroShapeRef = useRef(0);
  heroShapeRef.current = heroShape;
  // Портрет «активирован» — был первый контакт (ховер/клик). До этого
  // скролл его не трогает.
  const portraitActivated = useRef(false);

  const revertTimer = useRef<number | null>(null);
  const scheduleRevert = (ms = 4500) => {
    if (revertTimer.current) window.clearTimeout(revertTimer.current);
    revertTimer.current = window.setTimeout(() => setHeroShape(0), ms);
  };
  const cancelRevert = () => {
    if (revertTimer.current) window.clearTimeout(revertTimer.current);
  };
  // Клик по портрету → следующая фраза, собранная ИЗ ЧАСТИЦ. Авто-возврат.
  const phraseIdx = useRef(0);
  const onPortraitTap = () => {
    portraitActivated.current = true;
    setHeroEngaged(true);
    const i = phraseIdx.current % HERO_BUBBLES.length;
    phraseIdx.current = i + 1;
    setBubbleStage(i + 1); // для скринридера
    setHeroShape(TEXT_START + i);
    scheduleRevert(8500);
  };
  // Стабильная ссылка на tap для слушателя скролла (он вешается один раз).
  const onPortraitTapRef = useRef(onPortraitTap);
  onPortraitTapRef.current = onPortraitTap;
  // Бас — 3 числа в любом порядке, ЗАЛИПАЕТ (без авто-возврата)
  const tapNum = (i: number) =>
    setClickedNums((prev) => {
      const n = new Set(prev); n.add(i);
      if (n.size >= 3) { cancelRevert(); setHeroEngaged(true); setHeroShape(2); foundEgg("bass"); }
      return n;
    });
  // Ховер-пасхалки — только для мыши (на тач-устройствах их триггерит скролл)
  const canHover = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  // Награда — наведение, ЗАЛИПАЕТ
  const showAward = () => { if (!canHover()) return; cancelRevert(); setHeroEngaged(true); setHeroShape(1); foundEgg("award"); };
  const goHomeHover = () => { if (canHover()) window.dispatchEvent(new Event("hero:home")); };
  // Глитч — точная последовательность логотипов, САМ пропадает
  const LOGO_CODE = ["mts", "ozon", "gpn", "mts"];
  const logoSeq = useRef<string[]>([]);
  const tapLogo = (k: string) => {
    const seq = [...logoSeq.current, k].slice(-LOGO_CODE.length);
    logoSeq.current = seq;
    // Полная комбинация МТС→Ozon→ГПН→МТС → глитч-фигура.
    if (seq.length === LOGO_CODE.length && seq.every((v, i) => v === LOGO_CODE[i])) {
      setHeroEngaged(true);
      setHeroShape(3);
      scheduleRevert(5000);
      logoSeq.current = [];
      foundEgg("glitch");
      return;
    }
    // Одиночный клик по МТС → яйцо (всегда, даже без предварительного ховера).
    if (k === "mts") {
      setHeroEngaged(true);
      setHeroShape(SHAPE_EGG);
      scheduleRevert(5000);
      foundEgg("egg");
    }
  };
  // Возврат к портрету — наведение на лого «ЕГОР ШУГАЕВ» в шапке (window-event)
  useEffect(() => {
    const home = () => {
      cancelRevert();
      setHeroEngaged(false);
      setHeroShape(0);
      setClickedNums(new Set());
      logoSeq.current = [];
    };
    window.addEventListener("hero:home", home);
    return () => window.removeEventListener("hero:home", home);
  }, []);

  // Скролл-подсказка (работает без активации, в т.ч. на телефоне):
  // • первым кадром виден портрет (лицо);
  // • скролл ВНИЗ → портрет мгновенно собирается в текст-фразу (forceAssemble
  //   через onPortraitTap гарантирует видимость даже без ховера на тач);
  // • скролл ВВЕРХ → возврат в портрет.
  // Не перебивает залипшие пасхалки (бас/награда/яйцо) — только покой (shape 0)
  // и только свою скролл-фразу при возврате (диапазон текст-форм 4..7).
  useEffect(() => {
    let lastY = window.scrollY;
    let armed = true; // готов выдать морф на следующий скролл вниз
    const inView = () => {
      const el = heroSphereRef.current;
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    };
    const TEXT_END = TEXT_START + HERO_BUBBLES.length; // 8 (4..7 — скролл-фразы)
    const onScroll = () => {
      const y = window.scrollY;
      const down = y > lastY;
      lastY = y;
      if (!inView()) { armed = true; return; }
      if (down) {
        if (armed && heroShapeRef.current === 0) {
          armed = false;
          onPortraitTapRef.current();
        }
      } else {
        // вверх → вернуть портрет, если показываем именно скролл-фразу
        const s = heroShapeRef.current;
        if (s >= TEXT_START && s < TEXT_END) {
          if (revertTimer.current) window.clearTimeout(revertTimer.current);
          setHeroShape(0);
        }
        armed = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // На тач-устройствах нет ховера — собираем лицо сразу, чтобы первым кадром
  // был портрет, а не рассыпанное облако (на десктопе остаётся сборка по ховеру).
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      setHeroEngaged(true);
    }
  }, []);

  const heroLines: LedLine[] = [
    { text: "7 ЛЕТ", color: "#F2F4EF" },
    { text: "РАЗВИВАЮ", color: "#F2F4EF" },
    { words: ["ЛЮДЕЙ", "КОМАНДЫ", "ВИЗУАЛ", "СЕРВИСЫ", "ИНТЕРЕС"], color: "#A6FF00" },
  ];
  // На главной по умолчанию показываем только готовые work-кейсы (без wip).
  // wip-кейсы (ozon, mts-b2c) — за кнопкой «Показать ещё», чтобы недоделанные
  // карточки не утяжеляли первое впечатление.
  const [showExtraProjects, setShowExtraProjects] = useState(false);
  const mainProjects = useMemo(() => workProjects.filter((p) => !p.wip), []);
  const extraProjects = useMemo(() => workProjects.filter((p) => p.wip), []);
  return (
    <>
      <TypographyFix />
      {/* ═══════ HERO — «премиальный дисплей»: LED-табло + нейроструктура + OLED-панели ═══════ */}
      <section className="relative bg-black">
        {/* Воздух: мягкий свет сверху + лаймовый ambient снизу */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(255,255,255,0.035), transparent 60%), radial-gradient(ellipse 55% 35% at 50% 105%, rgba(166,255,0,0.05), transparent 70%)",
          }}
        />

        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="relative z-[2] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] pt-2 md:pt-4 pb-8 md:pb-10"
        >
          <div className="grid grid-cols-12 gap-3 md:gap-5 items-stretch">
            {/* ── Хиро-дисплей: LED-табло ── */}
            <motion.div variants={fadeUp} className="col-span-12 lg:col-span-7 lg:row-span-2">
              <Oled className="h-full p-5 md:p-6 flex flex-col">
                <div className="relative">
                  <LedBoard
                    className="hidden md:block w-full h-auto"
                    align="left"
                    scale={2}
                    dotR={1.45}
                    pad={2}
                    minCols={114}
                    minRows={50}
                    dim="rgba(255,255,255,0.03)"
                    dimR={1.0}
                    lines={heroLines}
                  />
                  <LedBoard
                    className="md:hidden w-full h-auto"
                    align="left"
                    scale={1}
                    pad={1}
                    minCols={51}
                    minRows={31}
                    dim="rgba(255,255,255,0.03)"
                    dimR={1.15}
                    lines={heroLines}
                  />
                </div>
                <h1 className="sr-only">
                  7 лет развиваю людей, команды, визуал, сервисы — дизайн-директор Егор Шугаев
                </h1>
                <p className="font-service mt-5 md:mt-6 max-w-[460px] text-[16px] md:text-[20px] leading-snug tracking-[0.02em] text-white/60">
                  От стратегии и культуры до AI и цифровых продуктов.
                </p>
                <div className="mt-5 md:mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    data-open-booking
                    data-ym-goal="open_booking"
                    data-ym-goal-params='{"placement":"hero"}'
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#A6FF00] text-black hover:bg-white transition-colors"
                  >
                    <span className="sr-only">Обсудить проект</span>
                    <LedText text="Обсудить проект" className="h-[11px] w-auto" />
                    <LedText text="→" className="h-[13px] w-auto" />
                  </button>
                  <Link
                    href="#portfolio"
                    data-ym-goal="hero_view_cases"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/20 text-white/85 hover:border-[#A6FF00]/60 hover:text-[#A6FF00] transition-colors no-underline"
                  >
                    <span className="sr-only">Смотреть кейсы</span>
                    <LedText text="Смотреть кейсы" className="h-[11px] w-auto" />
                    <LedText text="→" className="h-[13px] w-auto" />
                  </Link>
                </div>
                <div className="mt-9 md:mt-auto md:pt-8 flex items-center gap-6 md:gap-10 flex-wrap">
                  <img onClick={() => tapLogo("ozon")} src="/images/logos/ozon.svg" alt="Ozon" className="h-4 md:h-5 w-auto self-center brightness-0 invert opacity-55 hover:opacity-100 transition-opacity cursor-pointer" />
                  <img onClick={() => tapLogo("mts")} src="/images/logos/mts.svg" alt="МТС" className="h-6 md:h-8 w-auto brightness-0 invert opacity-55 hover:opacity-100 transition-opacity cursor-pointer" />
                  <img onClick={() => tapLogo("gpn")} src="/images/logos/gazpromneft.svg" alt="Газпром нефть" className="h-6 md:h-8 w-auto brightness-0 invert opacity-55 hover:opacity-100 transition-opacity cursor-pointer" />
                  <img onClick={() => tapLogo("hse")} src="/images/logos/hse.svg" alt="ВШЭ" className="h-6 md:h-8 w-auto brightness-0 invert opacity-55 hover:opacity-100 transition-opacity cursor-pointer" />
                </div>
              </Oled>
            </motion.div>

            {/* ── Нейроструктура: узлы, связи, сигналы ── */}
            <motion.div variants={fadeUp} className="col-span-12 lg:col-span-5">
              <Oled className="h-full p-5 md:p-7 flex flex-col gap-4">
                <div className="flex items-center justify-between text-white/35">
                  <span
                    onMouseEnter={goHomeHover}
                    className="inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span className="sr-only">Дизайн-директор</span>
                    <LedText text="[" className="h-[10px] w-auto text-[#C9A66B]/70" />
                    <LedText text="Дизайн-директор" className="h-[10px] w-auto" />
                    <LedText text="]" className="h-[10px] w-auto text-[#C9A66B]/70" />
                  </span>
                  {/* Счётчик пасхалок — справа, симметрично лейблу */}
                  <span
                    className="inline-flex items-center gap-1.5 select-none"
                    title="Тут спрятаны мини-игры — найди все"
                  >
                    <span className="sr-only">{`Найдено пасхалок: ${eggCount} из ${eggTotal}`}</span>
                    <LedText text="Найдено" className="h-[8px] w-auto opacity-60" />
                    <LedText
                      text={`${eggCount} из ${eggTotal}`}
                      className={`h-[10px] w-auto ${eggDone ? "text-[#A6FF00]" : "text-white/75"}`}
                    />
                  </span>
                </div>
                <div
                  ref={heroSphereRef}
                  onClick={onPortraitTap}
                  onPointerEnter={() => { portraitActivated.current = true; }}
                  className="relative flex-1 min-h-[280px] md:min-h-[320px] cursor-pointer"
                >
                  {/* Портрет из частиц по карте глубины. Форма морфит по пасхалкам. */}
                  <ParticlePortrait
                    className="absolute inset-0 w-full h-full"
                    trackingRef={heroSphereRef}
                    shapes={HERO_SHAPES}
                    active={heroShape}
                    count={4500}
                    color={[255, 255, 255]}
                    depthScale={0.6}
                    pointScale={0.6}
                    tilt={0.5}
                    assembleOnHover
                    latchAssemble
                    forceAssemble={heroEngaged}
                  />
                  {/* Фразы собираются из самих частиц (форма-текст), не оверлеем.
                      Озвучка для скринридера: */}
                  <span aria-live="polite" className="sr-only">
                    {bubbleStage > 0 ? HERO_BUBBLES[(bubbleStage - 1) % HERO_BUBBLES.length] : ""}
                  </span>
                </div>
                <div className="flex items-center text-white/35">
                  <span aria-label="Москва">
                    <LedText text="Москва" className="h-[10px] w-auto" />
                  </span>
                </div>
              </Oled>
            </motion.div>

            {/* ── В цифрах: LED-счётчики + тихий граф из точек ── */}
            <motion.div variants={fadeUp} className="col-span-12 lg:col-span-5">
              <Oled className="h-full p-5 md:p-7 flex items-center">
                <div className="relative w-full flex justify-center gap-8 md:gap-14 lg:gap-6 xl:gap-12">
                  {[
                    { v: "30", l: "запусков" },
                    { v: "7", l: "лет опыта" },
                    { v: "27", l: "команд" },
                  ].map((m, i) => (
                    <div
                      key={m.l}
                      onClick={() => tapNum(i)}
                      className="flex flex-col gap-4 cursor-pointer select-none"
                    >
                      <LedCounter value={m.v} tone="#C9A66B" />
                      <span className="text-white/40">
                        <span className="sr-only">{m.l}</span>
                        <LedText text={m.l} className="h-[9px] w-auto" />
                      </span>
                    </div>
                  ))}
                </div>
              </Oled>
            </motion.div>

            {/* ── Награда: тёплая золотая LED-матрица, ссылка на кейс ── */}
            <motion.div variants={fadeUp} className="col-span-12 md:col-span-5">
              <Link
                href="/cases/gazprom-neft"
                aria-label="Открыть кейс Газпром Нефть — CX Awards 2024"
                data-ym-goal="case_open"
                data-ym-goal-params='{"case_slug":"gazprom-neft","placement":"hero_award_tile"}'
                onMouseEnter={showAward}
                className="block h-full no-underline group"
              >
                <Oled className="h-full p-5 md:p-7 flex flex-col gap-6 transition-colors duration-300 group-hover:border-[#C9A66B]/30">
                  <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage:
                        "radial-gradient(rgba(201,166,107,0.13) 1.1px, transparent 1.2px)",
                      backgroundSize: "13px 13px",
                      maskImage:
                        "radial-gradient(ellipse 90% 80% at 70% 30%, black, transparent 75%)",
                      WebkitMaskImage:
                        "radial-gradient(ellipse 90% 80% at 70% 30%, black, transparent 75%)",
                    }}
                  />
                  <div className="relative text-[#C9A66B]/70">
                    <span className="sr-only">Награда · 2024</span>
                    <LedText text="Награда · 2024" className="h-[10px] w-auto" />
                  </div>
                  {/* Пиксельная статуэтка CX Awards — справа, во всю высоту панели */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/gpn/prize.png"
                    alt=""
                    aria-hidden
                    className="absolute right-5 md:right-9 top-1/2 -translate-y-1/2 h-[82%] lg:h-[64%] xl:h-[80%] w-auto pointer-events-none select-none"
                  />
                  <span className="sr-only">CX Awards 2024</span>
                  <LedText
                    text="СХ·24"
                    scale={2}
                    dot={1.45}
                    className="relative h-[36px] md:h-[46px] w-auto self-start text-[#C9A66B]"
                  />
                  <div className="relative mt-auto">
                    <div className="text-white/50">
                      <span className="sr-only">Customer Experience Awards</span>
                      <LedText text="Customer Experience Awards" className="h-[10px] w-auto" />
                    </div>
                    <div className="mt-6 text-[#C9A66B]/80">
                      <span className="sr-only">Победитель в сегменте B2E</span>
                      <LedText text="Победитель в сегменте B2E" className="h-[10px] w-auto" />
                    </div>
                  </div>
                </Oled>
              </Link>
            </motion.div>

            {/* ── Экспертиза: бары активности, ссылка на #skills ── */}
            <motion.div variants={fadeUp} className="col-span-12 md:col-span-7">
              <Link
                href="#skills"
                aria-label="Перейти к экспертизе"
                data-ym-goal="nav_skills"
                className="block h-full no-underline group"
              >
                <Oled className="h-full p-5 md:p-7 transition-colors duration-300 group-hover:border-[#A6FF00]/25">
                  <div className="mb-5 text-white/40">
                    <span className="sr-only">Экспертиза</span>
                    <LedText text="Экспертиза" className="h-[10px] w-auto" />
                  </div>
                  <ul className="flex flex-col">
                    {[
                      { num: "01", label: "Управление", note: "дизайн-функции и команды", glyph: GLYPH_ORG },
                      { num: "02", label: "Направления", note: "B2C / B2E / EdTech / E-COM", glyph: GLYPH_GRID },
                      { num: "03", label: "Ремесло", note: "процессы и применение AI", glyph: GLYPH_CODE },
                    ].map((item) => (
                      <li
                        key={item.num}
                        className="flex items-center gap-4 py-3.5"
                      >
                        <span className="w-5 shrink-0 text-[#C9A66B]/70">
                          <LedText text={item.num} className="h-[9px] w-auto" />
                        </span>
                        <span className="flex-1 min-w-0 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                          <span className="text-white">
                            <span className="sr-only">{item.label}</span>
                            <LedText text={item.label} className="h-[11px] w-auto" />
                          </span>
                          <span className="font-service text-[12px] md:text-[14px] tracking-[0.06em] uppercase text-white/45">
                            {item.note}
                          </span>
                        </span>
                        <PixelGlyph rows={item.glyph} className="h-[15px] w-auto shrink-0 text-[#C9A66B]/80" />
                      </li>
                    ))}
                  </ul>
                </Oled>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══════ PROJECTS — полноширинный асимметричный бенто ═══════ */}
      <section
        id="portfolio"
        className="relative z-[1] bg-black border-t border-white/[0.06] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] py-14 md:py-20"
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          {/* Топ-2 готовых кейса — равные плитки 2×1 на десктопе */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-5">
            {mainProjects.slice(0, 2).map((p, i) =>
              p ? (
                <motion.div key={p.slug ?? i} variants={fadeUp}>
                  <ProjectCard project={p} index={i} />
                </motion.div>
              ) : null,
            )}
          </div>

          {/* Хвост: широкий mentorship-agent + ссылка на эксперименты */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-5 mt-4 md:mt-5">
            {mainProjects[2] && (
              <motion.div variants={fadeUp} className="md:col-span-2">
                {/* showTags=false: у менторской карточки теги решили не показывать */}
                <ProjectCard project={mainProjects[2]} index={2} wide showTags={false} />
              </motion.div>
            )}
            <motion.div variants={fadeUp}>
              {/* Плитка-«экран» в одном языке с кейсами: зелёная дот-матрица
                  на всю площадь, лейбл сверху, тайтл и «Смотреть» внизу.
                  В покое — тихая сетка, на ховере сыплются зелёные кубики. */}
              <Link href="/experiments" data-ym-goal="nav_experiments" data-ym-goal-params='{"placement":"work_grid"}' className="no-underline group block h-full">
                <div className="relative h-full min-h-[280px] md:min-h-[340px] rounded-2xl overflow-hidden bg-[#0b0b0a]">
                  <div className="absolute inset-0">
                    <PixelCubePile color="#A6FF00" pitch={5.2} maxCubes={26} />
                  </div>
                  <div aria-hidden className="absolute inset-x-0 top-0 h-16 md:h-20 bg-gradient-to-b from-black/60 to-transparent z-[1] pointer-events-none" />
                  <div aria-hidden className="absolute inset-x-0 bottom-0 h-28 md:h-36 bg-gradient-to-t from-black/85 via-black/45 to-transparent z-[1] pointer-events-none" />
                  <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/20 flex items-center justify-center bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 z-[3] pointer-events-none">
                    <ArrowUpRight className="w-4 h-4 text-white/90" strokeWidth={2} />
                  </div>
                  {/* pointer-events-none — ховер проходит до канваса с кубами.
                      Низ — только тайтл, как у кейсов. */}
                  <div className="relative z-[2] h-full flex flex-col p-4 md:p-5 pointer-events-none">
                    <div className="text-white/75 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                      <span className="sr-only">Эксперименты</span>
                      <LedText text="Эксперименты" className="h-[9px] md:h-[10px] w-auto" />
                    </div>
                    <div className="mt-auto flex flex-col items-center text-center pb-1 md:pb-1.5">
                      <h3 className="text-white max-w-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                        <LedLines
                          text="Код, WebGL, шейдеры."
                          center
                          maxChars={12}
                          lineClass="h-[15px] md:h-[18px]"
                        />
                      </h3>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Wip-кейсы (ozon, mts-b2c) — за кнопкой «Показать ещё»: они в работе,
              не хочу утяжелять первое впечатление недоделанными карточками. */}
          {extraProjects.length > 0 && (
            <>
              {!showExtraProjects ? (
                <motion.div
                  variants={fadeUp}
                  className="mt-6 md:mt-8 flex items-center justify-center"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowExtraProjects(true);
                      ymGoal("home_show_more_projects");
                    }}
                    className="group inline-flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 rounded-full border border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/25 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-white/74 group-hover:text-[#A6FF00] transition-colors" strokeWidth={2} />
                    <span className="text-white/80 group-hover:text-white transition-colors">
                      <span className="sr-only">Показать ещё {extraProjects.length} кейса</span>
                      <LedText text={`Показать ещё ${extraProjects.length} кейса`} className="h-[11px] w-auto" />
                    </span>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  className="grid md:grid-cols-2 gap-4 md:gap-5 mt-4 md:mt-5"
                >
                  {extraProjects.map((p, i) => (
                    <ProjectCard key={p.slug} project={p} index={mainProjects.length + i} />
                  ))}
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </section>

      {/* ═══════ CAREER — hover-list с историей ролей, сразу после кейсов ═══════ */}
      <section className="relative z-[1] bg-black border-t border-white/[0.06] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] py-14 md:py-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <div className="mb-4 flex items-center justify-between">
              <SectionLabel>КАРЬЕРА</SectionLabel>
            </div>
            <CareerHoverList />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════ SERVICES / EXPERTISE — 3-колоночный бенто по мотивам Stokt ═══════ */}
      <section
        id="skills"
        className="relative z-[1] bg-black border-t border-white/[0.06] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] py-14 md:py-20"
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          {/* Заголовок — meta + мощный слоган */}
          <motion.div variants={fadeUp} className="mb-10 md:mb-14 max-w-4xl">
            <SectionLabel>ЭКСПЕРТИЗА</SectionLabel>
          </motion.div>

          {/* На мобиле — горизонтальная карусель со snap-скроллом, на md+ — 3-колоночный грид. */}
          <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory -mx-5 px-5 md:mx-0 md:px-0 pb-2 md:pb-0 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              {
                key: "management",
                index: "01",
                label: "УПРАВЛЕНИЕ",
                title: "Строю дизайн-функции",
                Icon: Users,
                accent: "#C9A66B",
                animation: "network" as PulseVariant,
                body:
                  "Собираю команды под задачу, выстраиваю процессы, культуру и дизайн-систему. Нанимаю на рост, развиваю лидов, защищаю бюджет. Когда ухожу, стараюсь оставить функцию, которая продолжает расти без меня.",
                items: [
                  "Design Management",
                  "Org Design · Hiring",
                  "Дизайн-процессы",
                  "OKR · Roadmap",
                  "Community · Employer Brand",
                ],
              },
              {
                key: "product",
                index: "02",
                label: "ПРОДУКТ",
                title: "Фокус на метриках",
                Icon: Sparkles,
                accent: "#C9A66B",
                animation: "target" as PulseVariant,
                body:
                  "Работаю на число. Discovery, гипотезы, CJM, A/B, research внутри процесса. Умею считать дизайн и доказывать его ценность продакт-менеджеру и C-левелу. Делаю это в B2C-экосистемах, B2E-инструментах и в EdTech.",
                items: [
                  "B2C-экосистемы",
                  "B2E · внутренние инструменты",
                  "EdTech",
                  "Discovery · Research · CJM · JTBD",
                  "A/B · Product Strategy",
                ],
              },
              {
                key: "craft",
                index: "03",
                label: "РЕМЕСЛО",
                title: "Оптимизирую процессы",
                Icon: Code2,
                accent: "#C9A66B",
                animation: "ai" as PulseVariant,
                body:
                  "Автоматизирую рутину, собираю AI-инструменты и агенты под конкретные задачи. Понимаю, что реально сделать руками и сколько это стоит в человеко-часах. Знаю, когда применять AI, а когда нанимать эксперта.",
                items: [
                  "AI-инструменты · агенты",
                  "Эмоциональный дизайн · детали",
                  "Prompt engineering",
                  "Figma · Design Systems",
                  "React · TypeScript",
                  "Three.js · WebGL",
                ],
              },
            ].map((tile) => (
              <div key={tile.key} className="shrink-0 w-[85vw] sm:w-[60vw] md:w-auto snap-start md:snap-align-none h-full">
                <ServiceTile tile={tile} />
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════ TESTIMONIALS — с астериксом * (stokt) ═══════ */}
      <section className="relative z-[1] overflow-hidden bg-black border-t border-white/[0.06] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] py-14 md:py-20">
        {/* лёгкий ambient-свет, плавно проявляется при скролле в вид */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
          transition={{ duration: 1.3, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 45% at 50% 12%, rgba(166,255,0,0.05), transparent 62%)",
          }}
        />
        <motion.div
          className="relative z-[1]"
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          {/* Центрированный заголовочный блок: ярлык → крупный хедлайн → астерикс-сноска */}
          <motion.div variants={fadeUp} className="mb-14 md:mb-20 text-center">
            <SectionLabel>ОТЗЫВЫ</SectionLabel>
            <h3 className="mt-6 md:mt-8 flex justify-center text-white">
              <LedLines
                text="Не верьте мне на слово"
                accent="*"
                accentColor="#C9A66B"
                center
                maxChars={26}
                lineClass="h-[22px] md:h-[42px]"
              />
            </h3>
            <p className="mt-5 md:mt-7 flex justify-center text-[#C9A66B]">
              <span className="sr-only">* Спросите тех, кто со мной работал</span>
              <LedText text="* Спросите тех, кто со мной работал" className="h-[11px] md:h-[14px] w-auto" />
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory -mx-5 px-5 md:mx-0 md:px-0 pb-2 md:pb-0 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {[
              {
                quote:
                  "Инноватор, шарит за ИИ. Уравновешенный — принимает только хорошо обдуманные решения. Собирает сильные команды, строит отлаженные процессы. И при этом очень приятный человек.",
                name: "Никита Вишневский",
                role: "Управляющий директор, Райффайзен (ранее — МТС)",
                avatar: "/images/testimonials/vishnevsky.jpeg",
              },
              {
                quote:
                  "Работал с Егором и в Газпром нефти и когда он был в МТС. Лучше чем Егора найти трудно. Он легенда дизайна, ИИ и менеджмента.",
                name: "Егор Гончарук",
                role: "Руководитель проектного офиса, Газпром Нефть",
                avatar: "/images/testimonials/goncharuk.png",
              },
              {
                quote:
                  "С Егором сложные задачи решаются легче, сильные hard skills сочетаются с редким умением выстраивать процессы, которые реально работают. Егор искренне болеет за результат и делает всё, чтобы его достичь.",
                name: "Семён Речмедин",
                role: "CPO Eva, МегаФон (ранее — CPO голосовой экосистемы)",
                avatar: "/images/testimonials/rechmedin.jpg",
              },
            ].map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                className="shrink-0 w-[85vw] sm:w-[60vw] md:w-auto snap-start md:snap-align-none relative h-full p-6 md:p-7 rounded-2xl border border-white/[0.06] bg-[#0f0f0e] hover:border-[#A6FF00]/20 transition-colors duration-300 flex flex-col overflow-hidden"
              >
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(255,255,255,0.07) 1.1px, transparent 1.2px)",
                    backgroundSize: "13px 13px",
                    maskImage:
                      "radial-gradient(ellipse 70% 80% at 90% 8%, black, transparent 70%)",
                    WebkitMaskImage:
                      "radial-gradient(ellipse 70% 80% at 90% 8%, black, transparent 70%)",
                  }}
                />
                <span className="relative mb-5 text-[#C9A66B]/70" aria-hidden>
                  <LedText text='"' scale={2} dot={1.45} className="h-[18px] w-auto" />
                </span>
                <p className="text-white/75 text-[16px] md:text-[16px] leading-relaxed mb-7 md:mb-8">
                  {t.quote}
                </p>
                {/* mt-auto прижимает подпись к низу карточки — выравнивает подписи в обоих кейсах */}
                <div className="mt-auto pt-5 md:pt-6 border-t border-white/[0.06] flex items-center gap-4">
                  <div className="relative shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border border-white/[0.08] bg-white/[0.04]">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[16px] text-white font-medium leading-tight">{t.name}</div>
                    <div className="text-[12.5px] text-white/50 mt-1 leading-snug">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════ MENTORING + SPEAKING — два крупных блока друг под другом ═══════ */}
      <section className="relative z-[1] bg-black border-t border-white/[0.06]">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
          className="px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] py-14 md:py-20 flex flex-col gap-5 md:gap-6"
        >
          {/* ── МЕНТОРИНГ: слева кнопка записи, справа созвездие-пасхалка ── */}
          <motion.div variants={fadeUp}>
            <div className="relative rounded-2xl overflow-hidden border border-[#A6FF00]/15 hover:border-[#A6FF00]/35 transition-colors duration-300 bg-[#0c0e09]">
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 65% 90% at 10% 0%, rgba(166,255,0,0.07), transparent 60%)",
                }}
              />
              <div className="relative grid md:grid-cols-[1fr_minmax(0,340px)] items-stretch">
                {/* Левая часть — клик открывает запись на сессию */}
                <button
                  type="button"
                  data-open-booking
                  data-ym-goal="nav_mentoring"
                  data-ym-goal-params='{"placement":"offer_blocks"}'
                  className="group text-left no-underline p-8 md:p-12 flex flex-col justify-between min-h-[300px] md:min-h-[360px]"
                >
                  <div>
                    <div className="inline-flex items-center gap-2 text-white/75 mb-5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#A6FF00]" />
                      <span className="sr-only">МЕНТОРИНГ</span>
                      <LedText text="МЕНТОРИНГ" className="h-[11px] w-auto" />
                    </div>
                    <h3 className="text-white mb-5 max-w-lg">
                      <LedLines
                        text="Веду дизайнеров на переходе в сеньор-лиды"
                        maxChars={26}
                        lineClass="h-[16px] md:h-[22px]"
                      />
                    </h3>
                    <p className="text-[16px] text-white/72 leading-relaxed max-w-lg">
                      Провёл уже больше 40 менторинг-сессий. Помогаю пройти развилки:
                      как вырасти до лида, как собрать команду, как защитить проект
                      перед топ-менеджментом. Не на каждую развилку у меня есть готовый
                      ответ, но обычно есть похожий опыт.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-[#A6FF00] mt-8 pt-6 border-t border-white/[0.08]">
                    <span className="sr-only">Записаться на сессию</span>
                    <LedText text="Записаться на сессию" className="h-[10px] w-auto" />
                    <LedText
                      text="→"
                      className="h-[12px] w-auto group-hover:translate-x-1 transition-transform"
                    />
                  </span>
                </button>
                {/* Правая часть — созвездие из облака точек, клик = пасхалка */}
                <div className="relative hidden md:block border-l border-white/[0.06] bg-black/20">
                  <ConstellationFigures className="absolute inset-0" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── ВЫСТУПЛЕНИЯ: пиксельные превью конкретных видео + текст ── */}
          <motion.div variants={fadeUp}>
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] hover:border-[#C9A66B]/35 transition-colors duration-300 bg-[#0e0d0a]">
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 65% 90% at 90% 0%, rgba(201,166,107,0.07), transparent 60%)",
                }}
              />
              <div className="relative grid md:grid-cols-[minmax(0,380px)_1fr] items-stretch">
                {/* Превью двух любимых выступлений — прямые ссылки на видео */}
                <div className="border-b md:border-b-0 md:border-r border-white/[0.06] bg-black/20 p-6 md:p-8 flex flex-col gap-4 justify-center">
                  {SPEAKING_PICKS.map((v) => (
                    <a
                      key={v.url}
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-ym-goal="nav_speaking"
                      data-ym-goal-params='{"placement":"offer_preview"}'
                      aria-label={v.label}
                      className="group/preview relative block aspect-video rounded-lg overflow-hidden border border-white/[0.08] hover:border-[#C9A66B]/45 transition-colors no-underline"
                    >
                      <PixelPhoto src={v.thumb} cols={54} aspect={1.78} className="absolute inset-0" />
                      <div
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"
                      />
                      <span
                        aria-hidden
                        className="absolute top-2.5 left-2.5 inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 transition-colors group-hover/preview:bg-[#C9A66B] group-hover/preview:border-[#C9A66B]"
                      >
                        <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5 transition-colors group-hover/preview:text-black group-hover/preview:fill-black" strokeWidth={2} />
                      </span>
                      <span className="absolute bottom-2.5 left-3 right-3 text-[12px] leading-snug text-white/85">
                        {v.label}
                      </span>
                    </a>
                  ))}
                </div>
                {/* Текст */}
                <Link
                  href="/speaking"
                  data-ym-goal="nav_speaking"
                  data-ym-goal-params='{"placement":"offer_blocks"}'
                  className="group no-underline p-8 md:p-12 flex flex-col justify-between min-h-[280px]"
                >
                  <div>
                    <div className="inline-flex items-center gap-2 text-white/75 mb-5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C9A66B]" />
                      <span className="sr-only">ВЫСТУПЛЕНИЯ</span>
                      <LedText text="ВЫСТУПЛЕНИЯ" className="h-[11px] w-auto" />
                    </div>
                    <h3 className="text-white mb-5 max-w-lg">
                      <LedLines
                        text="Выступаю и модерирую секции про AI и дизайн"
                        maxChars={26}
                        lineClass="h-[16px] md:h-[22px]"
                      />
                    </h3>
                    <p className="text-[16px] text-white/72 leading-relaxed max-w-lg">
                      Внутренние конференции МТС и Ozon, Дизайн-Просмотр, ВШЭ (читал
                      курс по прикладному ИИ). Темы: AI в продукте, масштабирование
                      дизайна, дизайн-системы.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-white/72 group-hover:text-white transition-colors mt-8 pt-6 border-t border-white/[0.08]">
                    <span className="sr-only">Смотреть все выступления</span>
                    <LedText text="Смотреть все выступления" className="h-[10px] w-auto" />
                    <LedText
                      text="→"
                      className="h-[12px] w-auto group-hover:translate-x-1 transition-transform"
                    />
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════ TOOLBOX — ряд инструментов ═══════ */}
      <Toolbox />

      {/* ═══════ FINAL CTA — счётчик + фейерверк, easter-egg на 15/30/46 кликах ═══════ */}
      <FinalCTA />

      {/* ═══════ ABOUT — о себе, последняя секция перед глобальным футером ═══════ */}
      <section
        id="about"
        className="relative z-[1] overflow-hidden bg-black border-t border-white/[0.06] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] py-14 md:py-20"
      >
        {/* лёгкий ambient-свет, плавно проявляется при скролле в вид */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
          transition={{ duration: 1.3, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 45% 55% at 22% 42%, rgba(166,255,0,0.06), transparent 65%)",
          }}
        />
        <motion.div
          className="relative z-[1]"
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-8 md:mb-12">
            <SectionLabel>О СЕБЕ</SectionLabel>
          </motion.div>

          {/* Фото (узкая колонка) + bio (широкая) */}
          <div className="grid lg:grid-cols-[minmax(260px,320px)_1fr] gap-6 md:gap-10">
            <motion.div variants={fadeUp}>
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/[0.06] bg-black">
                <span className="sr-only">Егор Шугаев — дизайн-директор, ментор и независимый консультант</span>
                <PixelPhoto
                  src="/images/photos/me-pixel.png"
                  cols={72}
                  aspect={0.8}
                  gamma={1.5}
                  threshold={0.1}
                  idle={0.72}
                  className="absolute inset-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-1.5 text-[12px] tracking-[0.2em] uppercase text-white/74">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A6FF00]/60 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#A6FF00]" />
                  </span>
                  <span className="sr-only">Сейчас · МСК</span>
                  <LedText text="Сейчас · МСК" className="h-[9px] w-auto" />
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col">
              <BioRotator
                className="max-w-2xl"
                items={[
                  <>Пришёл в дизайн из&nbsp;полиграфии и&nbsp;остался в&nbsp;нём по простой причине: мне нравится узнавать первопричины потребностей пользователей и&nbsp;решений бизнеса, искать провалы, <span className="text-[#C9A66B]">растить людей и&nbsp;цифры</span>. В&nbsp;какой-то момент это оказалось не побочным интересом, а&nbsp;рабочей профессией.</>,
                  <>Сейчас мне интересна связка <span className="text-[#A6FF00]">«дизайн и&nbsp;AI»</span>. Менторю дизайнеров и&nbsp;лидов, экспериментирую сам, пишу код. Иногда поделки получаются криво, но это часть процесса.</>,
                  <>Работаю от&nbsp;задачи: строю и&nbsp;автоматизирую процессы, влезаю глубоко — от&nbsp;стратегии до&nbsp;ревью макетов. Задача руководителя, как я&nbsp;её вижу, — <span className="text-[#C9A66B]">дать команде ясность</span>: кто чем занят и&nbsp;зачем. Тогда люди действуют увереннее, а&nbsp;не на&nbsp;ощупь.</>,
                ]}
              />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══════ CONTACTS — bento-грид из action-тайлов ═══════ */}
      <section
        id="contacts"
        className="relative z-[1] overflow-hidden bg-black border-t border-white/[0.06] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] py-14 md:py-20"
      >
        {/* лёгкий ambient-свет, плавно проявляется при скролле в вид */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
          transition={{ duration: 1.3, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 45% 50% at 20% 35%, rgba(166,255,0,0.05), transparent 62%)",
          }}
        />
        <motion.div
          className="relative z-[1]"
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-8 md:mb-10">
            <SectionLabel>КОНТАКТЫ</SectionLabel>
          </motion.div>

          {/* Bento 4×N: Telegram — широкая (col-span-2), Email/LI/GH/CV — 4 одинарных, Location — col-span-2, Accepting — col-span-2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {/* 1. Telegram — главная широкая плитка */}
            <motion.div variants={fadeUp} className="col-span-2 md:col-span-2 md:row-span-2">
              <Link
                href="https://t.me/egoradi"
                target="_blank"
                data-ym-goal="cta_telegram"
                data-ym-goal-params='{"placement":"contacts_grid"}'
                className="group no-underline block h-full"
              >
                <div className="relative h-full min-h-[160px] md:min-h-[230px] rounded-2xl overflow-hidden border border-[#A6FF00]/30 bg-[#A6FF00] hover:bg-[#B8FF33] transition-colors p-6 md:p-8 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="text-black/60">
                      <span className="sr-only">Telegram</span>
                      <LedText text="Telegram" className="h-[10px] w-auto" />
                    </div>
                    <Send className="w-5 h-5 md:w-6 md:h-6 text-black" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="text-black">
                      <span className="sr-only">@egoradi</span>
                      <LedText text="@egoradi" scale={2} dot={1.45} className="h-[22px] md:h-[34px] w-auto" />
                    </div>
                    <div className="mt-3 inline-flex items-center gap-2 text-black/70 group-hover:text-black transition-colors">
                      <span className="sr-only">Написать</span>
                      <LedText text="Написать" className="h-[10px] w-auto" />
                      <LedText text="→" className="h-[12px] w-auto group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* 2-5. Email, LinkedIn, GitHub, CV — 4 равных мини-плитки */}
            {[
              { label: "Email", value: "egor.outhead@gmail.com", href: "mailto:egor.outhead@gmail.com", Icon: Mail, goal: "cta_email" },
              { label: "LinkedIn", value: "егор-шугаев-03735078", href: "https://www.linkedin.com/in/егор-шугаев-03735078/", Icon: LinkedinIcon, goal: "cta_linkedin" },
              { label: "GitHub", value: "outhead", href: "https://github.com/outhead", Icon: GithubIcon, goal: "cta_github" },
              { label: "CV / PDF", value: "Скачать", href: "/Egor_Shugaev_CV.pdf", Icon: FileDown, goal: "cta_cv" },
            ].map((link) => (
              <motion.div key={link.label} variants={fadeUp}>
                <Link
                  href={link.href}
                  target="_blank"
                  data-ym-goal={link.goal}
                  data-ym-goal-params='{"placement":"contacts_grid"}'
                  className="group no-underline block h-full"
                >
                  <div className="relative h-full min-h-[104px] md:min-h-[112px] rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0f0f0e] hover:border-white/[0.2] transition-colors p-5 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="text-white/70">
                        <span className="sr-only">{link.label}</span>
                        <LedText text={link.label} className="h-[10px] w-auto" />
                      </div>
                      <link.Icon className="w-4 h-4 text-white/45 group-hover:text-white transition-colors" strokeWidth={1.75} />
                    </div>
                    <div className="text-white/80 group-hover:text-white transition-colors min-w-0 overflow-hidden">
                      <span className="sr-only">{link.value}</span>
                      <LedText text={link.value} className="h-[10px] w-auto max-w-full" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}

            {/* 6. Location — компактная плитка, глобус справа (выходит за правый край), текст слева. */}
            <motion.div variants={fadeUp} className="col-span-2 md:col-span-4">
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f0e] min-h-[200px] md:min-h-[220px]">
                {/* Текст — абсолют, чтобы НЕ блокировать drag по глобусу справа */}
                <div className="absolute z-[2] left-6 md:left-8 top-1/2 -translate-y-1/2 max-w-[60%] md:max-w-[55%] flex flex-col items-start gap-3 pointer-events-none">
                  <h4 className="text-white">
                    <span className="sr-only">Москва, Россия</span>
                    <LedText text="Москва, Россия" scale={2} dot={1.45} className="h-[16px] md:h-[20px] w-auto" />
                  </h4>
                  <div className="inline-flex items-center gap-2.5 text-white/72">
                    <span className="relative inline-flex items-center justify-center w-3 h-3 shrink-0">
                      <span className="absolute inset-0 rounded-full bg-[#A6FF00]/30 animate-ping" />
                      <span className="relative w-2 h-2 rounded-full bg-[#A6FF00] shadow-[0_0_10px_#A6FF00]" />
                    </span>
                    <span className="sr-only">Открыт к работе по всему миру</span>
                    <LedText text="Открыт к работе по всему миру" className="h-[10px] w-auto" />
                  </div>
                </div>
                {/* Глобус — справа, чуть протискивается за правый край; левая часть с маркером Москвы видна */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 right-[-120px] md:right-[-160px] aspect-square pointer-events-auto"
                  style={{ width: "560px" }}
                >
                  <DotGlobe />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </>
  );
}

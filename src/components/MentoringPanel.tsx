"use client";

/* ─────────────────────────────────────────────────────────────────
 * MentoringPanel — правая панель блока менторинга.
 * Сначала головоломка с лучом (ConstellationFigures). Когда игрок
 * решает её, после короткого победного момента панель кросс-фейдом
 * сменяется на 3D-облако точек с портретом (как в хиро).
 * ──────────────────────────────────────────────────────────────── */

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ConstellationFigures from "./ConstellationFigures";
import ParticlePortrait from "./ParticlePortrait";
import { MENTORING_LEVEL } from "@/lib/optics";

const PORTRAIT = [{ src: "/images/mikki-portrait.png", depth: "/images/mikki-depth.png" }];

export default function MentoringPanel({ className = "" }: { className?: string }) {
  const [phase, setPhase] = useState<"play" | "portrait">("play");
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className={className}>
      <AnimatePresence mode="wait">
        {phase === "play" ? (
          <motion.div
            key="game"
            className="absolute inset-0"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ConstellationFigures
              className="absolute inset-0"
              level={MENTORING_LEVEL}
              lockMirror
              onSolve={() => {
                // засчитываем пасхалку «созвездие» в счётчик на главной
                window.dispatchEvent(new CustomEvent("egg:found", { detail: "constellation" }));
                // дать догореть победной вспышке, затем сменить на приз
                window.setTimeout(() => setPhase("portrait"), 950);
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="portrait"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9 }}
          >
            <ParticlePortrait
              className="absolute inset-0 w-full h-full"
              trackingRef={ref}
              shapes={PORTRAIT}
              count={12000}
              color={[255, 255, 255]}
              depthScale={0.45}
              pointScale={1.25}
              tilt={0.5}
              assembleOnHover
              latchAssemble
              forceAssemble
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

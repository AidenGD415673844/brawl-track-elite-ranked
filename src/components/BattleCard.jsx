import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Check, Info, ArrowLeft } from "lucide-react";
import { TIER_BG, TIER_DECOR } from "@/lib/battleCards";
import CardParticleBg from "@/components/CardParticleBg";
import HolographicOverlay from "@/components/HolographicOverlay";
import TierAuraOverlay from "@/components/TierAuraOverlay";

function StarIcon({ color, lit, size = 9 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path
        d="M12,2 L14.5,9 L22,9.5 L16,14.5 L18,22 L12,17.5 L6,22 L8,14.5 L2,9.5 L9.5,9 Z"
        fill={lit ? color : "rgba(0,0,0,0.42)"}
        stroke={lit ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.22)"}
        strokeWidth="1"
        style={lit ? { filter: `drop-shadow(0 0 4px ${color})` } : undefined}
      />
    </svg>
  );
}

// Single battle card — front shows tier art; a small info button flips it
// to a back face with mastery stats (games at tier, unlock threshold, status).
export default function BattleCard({ card, unlocked, equipped, onClick, frequency }) {
  const c = card.color;
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [flipped, setFlipped] = useState(false);
  const hasFrequency = Number.isFinite(Number(frequency));
  const freqNum = hasFrequency ? Number(frequency) : 0;
  const starCount = unlocked ? Math.min(6, Math.max(0, hasFrequency ? freqNum : 1)) : 0;

  const handleMouseMove = (e) => {
    if (!unlocked || flipped || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ rx: -dy * 12, ry: dx * 12 });
  };

  const handleMouseLeave = () => setTilt({ rx: 0, ry: 0 });

  const toggleFlip = (e) => {
    e.stopPropagation();
    if (!unlocked) return;
    setFlipped((f) => !f);
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={!flipped && unlocked ? onClick : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={unlocked && !flipped ? { scale: 0.96 } : undefined}
      animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
      whileHover={unlocked && !flipped ? { scale: 1.06 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative aspect-[3/4] rounded-xl overflow-hidden"
      style={{
        border: `2px solid ${equipped ? c.text : "#000"}`,
        background: `${TIER_DECOR[card.tier]}, ${TIER_BG[card.tier]}`,
        boxShadow: equipped
          ? `0 0 20px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`
          : `inset 0 1px 0 rgba(255,255,255,0.1)`,
        cursor: unlocked ? "pointer" : "default",
        transformPerspective: 600,
        contain: "strict",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {!flipped ? (
          <motion.div
            key="front"
            className="absolute inset-0"
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ backfaceVisibility: "hidden" }}
          >
            {unlocked && <CardParticleBg tier={card.tier} color={c} />}
            <HolographicOverlay color={c} active={unlocked} />
            {unlocked && <TierAuraOverlay tier={card.tier} variant="selector" />}

            <div className="absolute top-1.5 left-0 right-0 flex items-center justify-center gap-1 z-20">
              {Array.from({ length: 6 }).map((_, i) => (
                <StarIcon key={i} color={c.text} lit={i < starCount} />
              ))}
            </div>

            <div className="absolute inset-0 flex items-center justify-center pt-3 pb-6 z-10">
              <img
                src={card.image}
                alt={card.tier}
                className="max-w-[60%] max-h-[60%] object-contain"
                style={{
                  filter: unlocked
                    ? `drop-shadow(0 0 12px ${c.glow})`
                    : "brightness(0.3) grayscale(1)",
                }}
              />
            </div>

            <div
              className="absolute bottom-0 left-0 right-0 py-1.5 text-center z-10"
              style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, transparent 100%)" }}
            >
              <p className="font-display text-xs font-bold tracking-wide" style={{ color: unlocked ? c.text : "rgba(255,255,255,0.3)" }}>
                {card.tier.toUpperCase()}
              </p>
            </div>

            {!unlocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/50">
                <Lock className="w-5 h-5 text-white/40" />
                <p className="text-[9px] text-white/40 mt-1 font-bold">
                  {card.minElo.toLocaleString()} Elo
                </p>
              </div>
            )}

            {equipped && (
              <div
                className="absolute top-1 right-1 z-30 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: c.text }}
              >
                <Check className="w-3 h-3 text-black" strokeWidth={3} />
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="back"
            className="absolute inset-0 z-30 flex flex-col items-center justify-center p-3 text-center"
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              backfaceVisibility: "hidden",
              background: "linear-gradient(180deg, rgba(0,0,0,0.82), rgba(0,0,0,0.92))",
            }}
          >
            <p className="font-display text-xs font-bold tracking-wide mb-2" style={{ color: c.text }}>
              {card.tier.toUpperCase()}
            </p>
            <div className="space-y-1.5 text-[10px] text-white/80">
              <div>
                <span className="opacity-60">Games at tier: </span>
                <span className="font-bold" style={{ color: c.text }}>{freqNum}</span>
              </div>
              <div>
                <span className="opacity-60">Unlock threshold: </span>
                <span className="font-bold text-white">{card.minElo.toLocaleString()} Elo</span>
              </div>
              <div>
                <span className="opacity-60">Status: </span>
                <span className="font-bold" style={{ color: equipped ? c.text : "#22c55e" }}>
                  {equipped ? "Equipped" : "Unlocked"}
                </span>
              </div>
              <div className="flex justify-center gap-0.5 pt-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <StarIcon key={i} color={c.text} lit={i < starCount} size={10} />
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={toggleFlip}
              className="mt-3 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-white/70 hover:text-white"
            >
              <ArrowLeft className="w-2.5 h-2.5" /> Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info flip toggle — always accessible on unlocked cards */}
      {unlocked && !flipped && (
        <button
          type="button"
          onClick={toggleFlip}
          aria-label="Card stats"
          className="absolute bottom-1 right-1 z-40 w-5 h-5 rounded-full bg-black/60 hover:bg-black/90 flex items-center justify-center border border-white/20"
        >
          <Info className="w-2.5 h-2.5 text-white/90" />
        </button>
      )}
    </motion.button>
  );
}

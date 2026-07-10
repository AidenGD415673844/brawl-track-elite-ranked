import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Check } from "lucide-react";
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

// Single battle card — CSS-based design matching the official Brawl Stars
// card aesthetic. Enhanced with holographic shimmer overlay and 3D tilt
// that tracks mouse position for an interactive foil-card feel.
export default function BattleCard({ card, unlocked, equipped, onClick, frequency }) {
  const c = card.color;
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const hasFrequency = Number.isFinite(Number(frequency));
  const starCount = unlocked ? Math.min(6, Math.max(0, hasFrequency ? Number(frequency) : 1)) : 0;

  const handleMouseMove = (e) => {
    if (!unlocked || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ rx: -dy * 12, ry: dx * 12 });
  };

  const handleMouseLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={unlocked ? onClick : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={unlocked ? { scale: 0.96 } : undefined}
      animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
      whileHover={unlocked ? { scale: 1.06 } : undefined}
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
      }}
    >
      {/* Animated tier-themed particle background */}
      {unlocked && <CardParticleBg tier={card.tier} color={c} />}

      {/* Holographic shimmer overlay */}
      <HolographicOverlay color={c} active={unlocked} />

      {/* Tier-specific animated aura (Pro arrow, Mythic vortex, etc.) */}
      {unlocked && <TierAuraOverlay tier={card.tier} />}

      {/* Top star row */}
      <div className="absolute top-1.5 left-0 right-0 flex items-center justify-center gap-1 z-20">
        {Array.from({ length: 6 }).map((_, i) => (
          <StarIcon key={i} color={c.text} lit={i < starCount} />
        ))}
      </div>

      {/* Central tier icon */}
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

      {/* Tier name at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 py-1.5 text-center z-10"
        style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, transparent 100%)" }}
      >
        <p
          className="font-display text-xs font-bold tracking-wide"
          style={{ color: unlocked ? c.text : "rgba(255,255,255,0.3)" }}
        >
          {card.tier.toUpperCase()}
        </p>
      </div>

      {/* Lock overlay for locked cards */}
      {!unlocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/50">
          <Lock className="w-5 h-5 text-white/40" />
          <p className="text-[9px] text-white/40 mt-1 font-bold">
            {card.minElo.toLocaleString()} Elo
          </p>
        </div>
      )}

      {/* Equipped badge */}
      {equipped && (
        <div
          className="absolute top-1 right-1 z-30 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: c.text }}
        >
          <Check className="w-3 h-3 text-black" strokeWidth={3} />
        </div>
      )}
    </motion.button>
  );
}
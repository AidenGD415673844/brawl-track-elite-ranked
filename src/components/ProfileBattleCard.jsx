import React from "react";
import { motion } from "framer-motion";
import { getRank, TIER_COLORS } from "@/lib/ranks";

function StarIcon({ color, size = 8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12,2 L14.5,9 L22,9.5 L16,14.5 L18,22 L12,17.5 L6,22 L8,14.5 L2,9.5 L9.5,9 Z" />
    </svg>
  );
}

// No-image avatar silhouette — circle head + half-circle body
function NoImageAvatar({ color, size = 90 }) {
  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div
        className="rounded-full"
        style={{
          width: size * 0.42,
          height: size * 0.42,
          background: `linear-gradient(180deg, ${color.to}30, ${color.from}50)`,
          border: `2px solid ${color.text}50`,
        }}
      />
      <div
        className="rounded-t-full"
        style={{
          width: size * 0.85,
          height: size * 0.48,
          marginTop: -size * 0.04,
          background: `linear-gradient(180deg, ${color.from}50, ${color.to}30)`,
          borderTop: `2px solid ${color.text}50`,
        }}
      />
    </div>
  );
}

// Thematic bottom decoration — tier-specific abstract shapes
function TierBottomGraphic({ color }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-1/3 overflow-hidden pointer-events-none">
      <div
        className="absolute bottom-[-30%] left-1/2 w-[80%] h-full rounded-[50%] opacity-25"
        style={{
          transform: "translateX(-50%)",
          background: `radial-gradient(ellipse at center, ${color.to}50, transparent 70%)`,
        }}
      />
      <div
        className="absolute bottom-[-15%] left-[15%] w-[28%] h-[55%] rounded-t-full opacity-20"
        style={{ background: `radial-gradient(ellipse at top, ${color.from}, transparent 70%)` }}
      />
      <div
        className="absolute bottom-[-15%] right-[15%] w-[28%] h-[55%] rounded-t-full opacity-20"
        style={{ background: `radial-gradient(ellipse at top, ${color.from}, transparent 70%)` }}
      />
    </div>
  );
}

// Profile Battle Card — displays the player's all-time peak rank
// as a themed battle card with avatar silhouette, stars, and animations.
// Placed below the Battle Card gallery grid.
export default function ProfileBattleCard({ player }) {
  const peakElo = Math.max(
    player.highestElo || 0,
    player.currentElo || 0,
    player.lastSeasonElo || 0
  );
  const peakRank = getRank(peakElo);
  const c = TIER_COLORS[peakRank.tier];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative"
    >
      {/* Floating wrapper */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative aspect-[3/4] rounded-xl overflow-hidden max-w-[180px] mx-auto"
        style={{
          border: `4px solid ${c.text}`,
          background: `linear-gradient(180deg, rgba(0,0,0,0.7) 0%, ${c.from} 40%, ${c.to} 100%)`,
          boxShadow: `0 0 24px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
        }}
      >
        {/* Thematic bottom graphic */}
        <TierBottomGraphic color={c} />

        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${c.text}20 50%, transparent 60%)`,
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
        />

        {/* Top star row with central peak rank icon */}
        <div className="absolute top-2 left-0 right-0 flex items-center justify-center gap-1 z-10">
          {Array.from({ length: 3 }).map((_, i) => (
            <StarIcon key={`l${i}`} color={c.text} />
          ))}
          <div className="mx-1">
            <img
              src={peakRank.image}
              alt={peakRank.tier}
              style={{
                width: 28,
                height: 28,
                objectFit: "contain",
                filter: `drop-shadow(0 0 8px ${c.glow})`,
              }}
            />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <StarIcon key={`r${i}`} color={c.text} />
          ))}
        </div>

        {/* Center — no-image avatar */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-6 pb-12 z-10">
          <NoImageAvatar color={c} size={90} />
        </div>

        {/* Bottom — peak rank label */}
        <div
          className="absolute bottom-0 left-0 right-0 py-2 text-center z-10"
          style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)" }}
        >
          <p className="text-[9px] uppercase tracking-wider text-white/60 font-bold">
            All-Time Peak
          </p>
          <p
            className="font-display text-sm font-bold"
            style={{ color: c.text, textShadow: `0 0 10px ${c.glow}` }}
          >
            {peakRank.name.toUpperCase()}
          </p>
          <p className="text-[9px] text-white/50 font-bold">
            {peakElo.toLocaleString()} Elo
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
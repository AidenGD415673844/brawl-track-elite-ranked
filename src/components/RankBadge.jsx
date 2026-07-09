import React from "react";
import { getRank, TIER_COLORS } from "@/lib/ranks";

// RankBadge — renders the rank image for a given Elo.
// The roman numeral is baked into each asset, so no pips overlay needed.
export default function RankBadge({ elo, size = 56 }) {
  const rank = getRank(elo);
  const c = TIER_COLORS[rank.tier];
  return (
    <div className="shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
      <img
        src={rank.image}
        alt={rank.name}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          filter: `drop-shadow(0 0 ${size * 0.18}px ${c.glow})`,
        }}
      />
    </div>
  );
}
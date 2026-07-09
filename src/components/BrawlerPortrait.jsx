import React, { useState } from "react";
import { brawlerImageUrl, PLACEHOLDER_BRAWLER } from "@/lib/brawlers";
import { getRank, TIER_COLORS } from "@/lib/ranks";

// Displays a brawler portrait with the player's rank icon overlaid
// in the bottom-left corner, and Elo number below.
export default function BrawlerPortrait({
  brawler,
  elo,
  size = 48,
  rankOverlaySize = 20,
  showRankOverlay = true,
  showElo = true,
  transitionText = null,
}) {
  const [imgError, setImgError] = useState(false);
  const rank = getRank(elo || 0);
  const c = TIER_COLORS[rank.tier];

  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <div className="relative" style={{ width: size, height: size }}>
        <img
          src={imgError ? PLACEHOLDER_BRAWLER : brawlerImageUrl(brawler)}
          alt={brawler || "Unknown"}
          onError={() => setImgError(true)}
          className="rounded-lg object-cover"
          style={{ width: size, height: size }}
        />
        {showRankOverlay && (
          <img
            src={rank.image}
            alt={rank.name}
            className="absolute -bottom-1 -left-1 rounded-full bg-card"
            style={{
              width: rankOverlaySize,
              height: rankOverlaySize,
              objectFit: "contain",
              filter: `drop-shadow(0 0 4px ${c.glow})`,
            }}
          />
        )}
      </div>
      {showElo && (
        <span className="text-[8px] font-bold text-muted-foreground leading-tight">
          {(elo || 0).toLocaleString()}
        </span>
      )}
      {transitionText && (
        <span className="text-[7px] font-bold text-cyan-400 leading-tight max-w-[60px] text-center">
          {transitionText}
        </span>
      )}
    </div>
  );
}
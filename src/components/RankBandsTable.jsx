import React from "react";
import { Card } from "@/components/ui/card";
import { MAJOR_RANKS, RANKS, getRank, TIER_COLORS } from "@/lib/ranks";
import RankBadge from "@/components/RankBadge";

// Rank bands table — grouped by major tier with new icon assets.
// Shows one card per tier with the full Elo range and sub-rank pips.
export default function RankBandsTable({ elo }) {
  const current = getRank(elo);

  return (
    <Card className="bg-card border-border p-4 rounded-2xl">
      <h3 className="text-sm font-display font-semibold text-foreground mb-4">Rank Bands</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {MAJOR_RANKS.map((tier) => {
          const c = TIER_COLORS[tier.tier];
          const isCurrentTier = tier.tier === current.tier;
          const tierRanks = RANKS.filter((r) => r.tier === tier.tier);
          const tierMin = tierRanks[0].min;
          const tierMax = tierRanks[tierRanks.length - 1].max;

          return (
            <div
              key={tier.tier}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition ${
                isCurrentTier
                  ? "border-cyan-500/70 bg-cyan-500/10"
                  : "border-border bg-muted/40"
              }`}
            >
              <RankBadge elo={tier.min} size={40} showPips={isCurrentTier} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: c.text }}>
                  {tier.tier}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tierMin.toLocaleString()}
                  {isFinite(tierMax) ? ` – ${tierMax.toLocaleString()}` : "+"}
                </p>
              </div>
              {isCurrentTier && (
                <div className="text-right">
                  <span className="text-[10px] font-bold text-cyan-500 uppercase block">You</span>
                  <span className="text-[9px] text-muted-foreground">{current.roman}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
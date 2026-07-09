import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getRank, getRankIndex, RANKS, TIER_COLORS } from "@/lib/ranks";

// SafetyNetSimulator — calculates how many consecutive losses the player
// can absorb before dropping to the next lower sub-rank, based on their
// average loss per game from the battle log.
export default function SafetyNetSimulator({ currentElo, battleLog }) {
  const data = useMemo(() => {
    const rank = getRank(currentElo);
    const idx = getRankIndex(currentElo);
    const c = TIER_COLORS[rank.tier];

    // Next lower sub-rank
    const lowerIdx = Math.max(0, idx - 1);
    const lowerRank = RANKS[lowerIdx];
    const demotionThreshold = lowerRank.max + 1; // must go below this
    const gap = currentElo - demotionThreshold;

    // Average loss from battle log
    const defeats = (battleLog || []).filter((e) => !e.manual && e.result === "defeat");
    let avgLoss = 80; // default fallback
    if (defeats.length > 0) {
      const losses = defeats.map((e) => Math.abs(e.delta || 0));
      avgLoss = Math.round(losses.reduce((a, b) => a + b, 0) / losses.length);
    }

    const lossesUntilDemotion = avgLoss > 0 ? Math.max(0, Math.ceil(gap / avgLoss)) : 0;
    const isAtFloor = gap <= 0;
    const isLowBuffer = lossesUntilDemotion <= 2 && !isAtFloor;

    return {
      rank,
      lowerRank: idx > 0 ? lowerRank : null,
      gap: Math.max(0, gap),
      avgLoss,
      lossesUntilDemotion,
      isAtFloor,
      isLowBuffer,
      color: c,
    };
  }, [currentElo, battleLog]);

  const Icon = data.isLowBuffer || data.isAtFloor ? AlertTriangle : Shield;
  const iconColor = data.isAtFloor ? "text-red-500" : data.isLowBuffer ? "text-amber-500" : "text-emerald-500";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5 rounded-2xl bg-card border-border">
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <h3 className="text-sm font-display font-bold text-foreground">Safety Net</h3>
        </div>

        {!data.lowerRank ? (
          <div className="text-center py-2">
            <p className="text-sm font-bold text-emerald-500">Lowest Rank Reached</p>
            <p className="text-[11px] text-muted-foreground mt-1">No demotion possible</p>
          </div>
        ) : data.isAtFloor ? (
          <div className="text-center py-2">
            <p className="text-sm font-bold text-red-500">At Demotion Threshold</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              One more loss drops you to {data.lowerRank.name}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-display font-black" style={{ color: data.color.text }}>
                {data.lossesUntilDemotion}
              </span>
              <span className="text-xs text-muted-foreground">
                losses until {data.lowerRank.name}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3">
              Avg loss: {data.avgLoss} Elo · Buffer: {data.gap.toLocaleString()} Elo
            </p>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (data.lossesUntilDemotion / 10) * 100)}%`,
                  background: data.isLowBuffer ? "#f59e0b" : "#10b981",
                }}
              />
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
}
import React from "react";
import { Card } from "@/components/ui/card";
import { getRank, rankProgress, TIER_COLORS } from "@/lib/ranks";
import RankBadge from "@/components/RankBadge";

function RankCard({ label, elo }) {
  const rank = getRank(elo);
  const c = TIER_COLORS[rank.tier];
  const pct = Math.round(rankProgress(elo) * 100);
  return (
    <Card className="bg-card border-border p-4 rounded-2xl">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{label}</p>
      <div className="flex items-center gap-3">
        <RankBadge elo={elo} size={56} />
        <div className="min-w-0">
          <p className="font-bold truncate" style={{ color: c.text }}>
            {rank.name}
          </p>
          <p className="text-sm text-muted-foreground">{Number(elo).toLocaleString()} Elo</p>
        </div>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c.from}, ${c.to})` }}
        />
      </div>
    </Card>
  );
}

export default function SummaryCards({ player }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <RankCard label="Current Rank" elo={player.currentElo} />
      <RankCard label="All-Time Peak" elo={player.highestElo} />
      <RankCard label="Current Season Highest" elo={player.currentSeasonHighest} />
      <RankCard label="Last Season Highest" elo={player.lastSeasonElo} />
    </div>
  );
}
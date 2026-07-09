import React from "react";
import { Card } from "@/components/ui/card";
import { getRank, TIER_COLORS } from "@/lib/ranks";
import RankBadge from "@/components/RankBadge";
import { getEquippedCard } from "@/lib/battleCards";

export default function ProfileBadge({ player }) {
  const rank = getRank(player.currentElo);
  const c = TIER_COLORS[rank.tier];
  const equippedCard = getEquippedCard(player);
  const accent = equippedCard ? equippedCard.color : c;

  return (
    <Card
      className="relative overflow-hidden bg-card border-border p-5 rounded-2xl"
      style={{
        borderColor: equippedCard ? accent.text : undefined,
        boxShadow: equippedCard ? `0 0 16px ${accent.glow}` : undefined,
      }}
    >
      {/* Themed accent strip at top — colored by equipped card */}
      {equippedCard && (
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, ${accent.from}, ${accent.to}, ${accent.from})` }}
        />
      )}
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">
            Player Profile
          </p>
          <h2 className="font-display text-xl font-bold text-foreground">{rank.name}</h2>
          <p className="text-sm text-muted-foreground">
            {player.currentElo.toLocaleString()} Elo
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <span className="text-muted-foreground">
              <span className="font-display font-bold text-foreground">
                {player.trophies.toLocaleString()}
              </span>{" "}
              trophies
            </span>
            <span className="text-muted-foreground">
              <span className="font-display font-bold text-foreground">{player.winRate}%</span> WR
            </span>
            <span className="text-muted-foreground">
              <span className="font-display font-bold text-foreground">{player.gamesPlayed}</span>{" "}
              games
            </span>
          </div>
        </div>
        {/* Current rank badge */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-full blur-xl" style={{ background: c.glow }} />
          <RankBadge elo={player.currentElo} size={72} />
        </div>
      </div>
    </Card>
  );
}
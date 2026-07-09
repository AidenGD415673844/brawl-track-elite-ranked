import React from "react";
import { Lock } from "lucide-react";
import { BATTLE_CARDS, isCardUnlocked } from "@/lib/battleCards";

// Shows progress toward unlocking the next locked battle card.
export default function CardMasteryProgress({ player }) {
  const peakElo = Math.max(
    player.currentElo || 0,
    player.highestElo || 0,
    player.lastSeasonElo || 0
  );

  const nextLocked = BATTLE_CARDS.find((card) => !isCardUnlocked(card, player));

  if (!nextLocked) {
    return (
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-emerald-500 font-bold">
        <span>★</span>
        <span>All Battle Cards Unlocked!</span>
        <span>★</span>
      </div>
    );
  }

  const prevCard = BATTLE_CARDS[BATTLE_CARDS.indexOf(nextLocked) - 1];
  const startElo = prevCard ? prevCard.minElo : 0;
  const targetElo = nextLocked.minElo;
  const progress = Math.min(100, Math.max(0, ((peakElo - startElo) / (targetElo - startElo)) * 100));
  const remaining = Math.max(0, targetElo - peakElo);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-bold">
            Next: {nextLocked.tier} Card
          </span>
        </div>
        <span className="text-xs font-bold" style={{ color: nextLocked.color.text }}>
          {remaining > 0 ? `${remaining.toLocaleString()} Elo to go` : "Ready!"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${nextLocked.color.from}, ${nextLocked.color.to})`,
          }}
        />
      </div>
    </div>
  );
}
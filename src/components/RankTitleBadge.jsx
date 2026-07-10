import React from "react";
import { Sparkles } from "lucide-react";
import { getRankTitle, pickTitleRankName } from "@/lib/rankTitles";
import * as ranksModule from "@/lib/ranks";

// Compact italic tagline that adapts to the player's highest rank + streaks.
// Props:
//   player         — required (uses currentElo, currentSeasonHighest, highestElo)
//   battleLog      — optional, used only to derive streaks
//   deservedGap    — optional integer (deserved - current)
//   rankName       — override; skips pickTitleRankName when provided
//   className      — extra classes
//   showIcon       — default true
export default function RankTitleBadge({
  player,
  battleLog = [],
  deservedGap = 0,
  rankName,
  className = "",
  showIcon = true,
}) {
  const name = rankName || pickTitleRankName(player, ranksModule);

  // Cheap inline streak calc — avoids pulling battleLog helpers when unused.
  let winStreak = 0, lossStreak = 0;
  const real = (battleLog || []).filter((e) => !e?.manual);
  for (const e of real) {
    if (e?.result === "victory") { if (lossStreak) break; winStreak++; }
    else if (e?.result === "defeat") { if (winStreak) break; lossStreak++; }
    else break;
  }

  const { title, modifier } = getRankTitle(name, { winStreak, lossStreak, deservedGap });

  return (
    <div className={`flex items-center gap-1.5 text-[11px] italic text-muted-foreground ${className}`}>
      {showIcon && <Sparkles className="w-3 h-3 opacity-70 shrink-0" />}
      <span className="truncate">
        <span className="font-semibold not-italic text-foreground/80">{name}:</span>{" "}
        {title}
        {modifier && <span className="opacity-70"> — {modifier}</span>}
      </span>
    </div>
  );
}

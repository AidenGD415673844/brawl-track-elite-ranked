import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Zap } from "lucide-react";
import { suggestTeammates } from "@/lib/synergyAutoSuggest";

// SynergyAutoSuggest — when the player selects their brawler in the battle
// log input, this component recommends the top 2 teammate brawlers based on
// historical win rates when paired with that brawler.
export default function SynergyAutoSuggest({ brawlers, battleLog }) {
  const selfBrawler = brawlers?.self;

  const result = useMemo(
    () => suggestTeammates(battleLog, selfBrawler, { topN: 2, minGames: 1 }),
    [battleLog, selfBrawler]
  );

  if (!selfBrawler || result.suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2.5"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Zap className="w-3 h-3 text-cyan-400" />
        <span className="text-[10px] font-display font-bold text-cyan-400 uppercase tracking-wider">
          Best Teammates for {selfBrawler}
        </span>
        <span className="text-[9px] text-muted-foreground ml-auto">
          {result.totalWithBrawler} games analyzed
        </span>
      </div>

      <div className="flex gap-2">
        {result.suggestions.map((s, i) => (
          <motion.div
            key={s.brawler}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-2 rounded-lg bg-background/60 p-1.5 flex-1"
          >
            <img
              src={s.image}
              alt={s.brawler}
              className="w-8 h-8 object-contain shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-foreground truncate">{s.brawler}</p>
              <p className="text-[9px]" style={{
                color: s.winRate >= 55 ? "#10b981" : s.winRate >= 45 ? "#eab308" : "#ef4444"
              }}>
                {s.winRate}% WR · {s.total} games
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
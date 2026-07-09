import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, TrendingDown } from "lucide-react";
import { suggestBrawlersByMode } from "@/lib/brawlerSuggestions";
import { MODES } from "@/lib/battleLog";

// BrawlerSuggestions — analyzes battle history for the selected mode and
// suggests the top 3 brawlers by win rate for the player's rank bracket.
// Falls back to letting the user pick a mode if none is provided.
export default function BrawlerSuggestions({ battleLog, mode, currentElo }) {
  const [selectedMode, setSelectedMode] = useState(mode || MODES[0]);

  // Sync external mode prop if it changes
  useEffect(() => {
    if (mode) setSelectedMode(mode);
  }, [mode]);

  const result = useMemo(
    () => suggestBrawlersByMode(battleLog, selectedMode, currentElo),
    [battleLog, selectedMode, currentElo]
  );

  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-display font-bold text-foreground uppercase tracking-wider">
          Brawler Suggestions
        </span>
      </div>

      {/* Mode selector */}
      <div className="flex flex-wrap gap-1 mb-3">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMode(m)}
            className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition ${
              selectedMode === m
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "bg-muted text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {result.suggestions.length === 0 ? (
        <p className="text-[10px] text-muted-foreground text-center py-4 italic">
          {result.totalModeGames === 0
            ? `No ${selectedMode} matches logged yet. Play and log battles to get suggestions!`
            : `Not enough ${selectedMode} data (need 2+ games per brawler). Keep logging!`}
        </p>
      ) : (
        <div className="space-y-1.5">
          {result.suggestions.map((s, i) => (
            <motion.div
              key={s.brawler}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-2.5 rounded-lg bg-background/50 p-2"
            >
              {/* Rank number */}
              <span className="text-[10px] font-display font-black text-muted-foreground w-4 text-center">
                #{i + 1}
              </span>

              {/* Brawler portrait */}
              <img
                src={s.image}
                alt={s.brawler}
                className="w-9 h-9 object-contain shrink-0"
              />

              {/* Name + games */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-foreground truncate">{s.brawler}</p>
                <p className="text-[9px] text-muted-foreground">{s.total} games · {selectedMode}</p>
              </div>

              {/* Win rate */}
              <div className="text-right shrink-0">
                <p
                  className="text-sm font-display font-black"
                  style={{ color: s.winRate >= 55 ? "#10b981" : s.winRate >= 45 ? "#eab308" : "#ef4444" }}
                >
                  {s.winRate}%
                </p>
                <p className="text-[9px] flex items-center justify-end gap-0.5" style={{
                  color: s.avgElo >= 0 ? "#10b981" : "#ef4444"
                }}>
                  {s.avgElo >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {s.avgElo >= 0 ? "+" : ""}{s.avgElo}/game
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
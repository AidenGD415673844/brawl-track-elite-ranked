import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, ChevronDown, ChevronUp, Database } from "lucide-react";
import { predictBattles } from "@/lib/battlePredictor";
import { getRank, TIER_COLORS } from "@/lib/ranks";
import RankBadge from "@/components/RankBadge";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedCounter from "@/components/AnimatedCounter";
import { loadHistory } from "@/lib/assessmentHistory";

export default function BattlePredictor({
  playerElo,
  winRate,
  queueType,
  teammateElos,
  enemyElos,
  highestElo,
  battleLog = [],
}) {
  const [expanded, setExpanded] = useState(true);

  // Latest Deserved Rank assessment (if any) — pulls prediction slightly.
  const deservedElo = useMemo(() => {
    try {
      const h = loadHistory();
      return h?.[0]?.deservedElo ?? null;
    } catch {
      return null;
    }
  }, []);

  const prediction = useMemo(
    () => predictBattles(
      playerElo, winRate, queueType, teammateElos, enemyElos,
      highestElo || playerElo, battleLog, deservedElo,
    ),
    [playerElo, winRate, queueType, teammateElos, enemyElos, highestElo, battleLog, deservedElo]
  );

  const currentRank = getRank(playerElo);
  const c = TIER_COLORS[currentRank.tier];

  const winSwing = prediction.avgWin;
  const lossSwing = prediction.avgLoss;
  const dataSample = (battleLog || []).filter((e) => !e.manual).length;

  return (
    <Card className="bg-card border-border p-4 rounded-2xl">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-display font-semibold text-foreground">Battle Predictor</h3>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              {prediction.winProb}% win prob · Enemy avg {prediction.enemyAvg || "—"}
              {dataSample > 0 && (
                <span className="inline-flex items-center gap-0.5 text-cyan-400/80">
                  · <Database className="w-2.5 h-2.5" /> {dataSample} logged
                </span>
              )}
              {prediction.deservedAdjust !== 0 && (
                <span className="text-fuchsia-400/80">· DR {prediction.deservedAdjust > 0 ? "+" : ""}{prediction.deservedAdjust}%</span>
              )}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              {/* Win probability bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase text-muted-foreground font-display">Win Probability</span>
                  <AnimatedCounter value={prediction.winProb} suffix="%" className="text-sm font-bold text-emerald-500" />
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${prediction.winProb}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Projected single-game Elo swing */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase text-emerald-600 font-display font-bold">If you win</span>
                  <AnimatedCounter value={winSwing} showSign className="text-sm font-display font-black text-emerald-500" />
                </div>
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase text-red-600 font-display font-bold">If you lose</span>
                  <AnimatedCounter value={lossSwing} showSign className="text-sm font-display font-black text-red-500" />
                </div>
              </div>

              {/* 3 scenarios */}
              <div className="grid grid-cols-3 gap-2">
                {/* Best case */}
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2 text-center">
                  <p className="text-[9px] uppercase text-emerald-600 font-display font-bold mb-1">5 Wins</p>
                  <RankBadge elo={prediction.bestCase.finalElo} size={32} />
                  <p className="text-[9px] font-bold text-emerald-500 mt-1">{prediction.bestCase.finalRank}</p>
                  <p className="text-[10px] font-display font-black text-emerald-500">{prediction.bestCase.finalElo.toLocaleString()}</p>
                </div>

                {/* Expected */}
                <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-2 text-center">
                  <p className="text-[9px] uppercase text-cyan-600 font-display font-bold mb-1">Expected</p>
                  <RankBadge elo={prediction.expected.finalElo} size={32} />
                  <p className="text-[9px] font-bold text-cyan-500 mt-1">{prediction.expected.finalRank}</p>
                  <p className="text-[10px] font-display font-black text-cyan-500">{prediction.expected.finalElo.toLocaleString()}</p>
                </div>

                {/* Worst case */}
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-2 text-center">
                  <p className="text-[9px] uppercase text-red-600 font-display font-bold mb-1">5 Losses</p>
                  <RankBadge elo={prediction.worstCase.finalElo} size={32} />
                  <p className="text-[9px] font-bold text-red-500 mt-1">{prediction.worstCase.finalRank}</p>
                  <p className="text-[10px] font-display font-black text-red-500">{prediction.worstCase.finalElo.toLocaleString()}</p>
                </div>
              </div>

              {/* Expected path */}
              <div>
                <p className="text-[10px] uppercase text-muted-foreground font-display mb-2">Projected Elo Path</p>
                <div className="flex items-end justify-between gap-1 h-16">
                  {prediction.expected.path.map((step, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        className="w-full rounded-t bg-gradient-to-t from-cyan-500 to-purple-500"
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(10, (step.eloAfter - playerElo + 200) / 4)}%` }}
                        transition={{ delay: i * 0.1, duration: 0.3 }}
                      />
                      <span className="text-[8px] text-muted-foreground">{step.battle}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rank change indicator */}
              {prediction.rankChange !== 0 && (
                <div className={`text-center text-xs font-bold ${prediction.rankChange > 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {prediction.rankChange > 0 ? "↑" : "↓"} {Math.abs(prediction.rankChange)} sub-rank{Math.abs(prediction.rankChange) !== 1 ? "s" : ""} projected
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
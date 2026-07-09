import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Flame, Trophy } from "lucide-react";
import { getWinStreak, getBestWinStreak } from "@/lib/battleLog";

export default function WinStreakTracker({ battleLog }) {
  const streak = getWinStreak(battleLog);
  const best = getBestWinStreak(battleLog);
  const isWinning = streak > 0;
  const nextMilestone = Math.ceil((streak + 1) / 5) * 5;
  const progress = streak > 0 ? ((streak % 5) / 5) * 100 : 0;

  return (
    <Card
      className={`p-5 rounded-2xl border ${
        isWinning
          ? "bg-gradient-to-br from-orange-500/15 to-red-500/10 border-orange-500/30"
          : "bg-card border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={isWinning ? { scale: [1, 1.15, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Flame
              className={`w-10 h-10 ${isWinning ? "text-orange-400" : "text-muted-foreground"}`}
            />
          </motion.div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">
              Win Streak
            </p>
            <motion.p
              key={streak}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="font-display text-3xl font-bold text-foreground"
            >
              {streak > 0 ? streak : 0}
            </motion.p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-muted-foreground justify-end">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-xs font-display">Best</span>
          </div>
          <p className="font-display text-xl font-bold text-foreground">{best}</p>
        </div>
      </div>

      {isWinning && (
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-display">
            <span>Next milestone</span>
            <span>{nextMilestone}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
            />
          </div>
        </div>
      )}
    </Card>
  );
}
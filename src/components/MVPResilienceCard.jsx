import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Star, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { computeMVPResilience } from "@/lib/matchAnalysis";

// MVPResilienceCard — displays the player's "MVP Resilience" score,
// a metric combining overall Star Player rate with Star Player rate in losses.
// High loss-star rate = performing well despite bad teams.
export default function MVPResilienceCard({ battleLog }) {
  const data = useMemo(() => computeMVPResilience(battleLog), [battleLog]);

  if (data.totalGames === 0) return null;

  const scoreColor =
    data.score >= 75 ? "#10b981"
    : data.score >= 55 ? "#22d3ee"
    : data.score >= 35 ? "#f59e0b"
    : "#ef4444";

  return (
    <Card className="bg-card border-border p-4 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-cyan-500" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground">MVP Resilience</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Score ring */}
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/30" />
            <motion.circle
              cx="32" cy="32" r="28" fill="none" stroke={scoreColor} strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 28}
              initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - data.score / 100) }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-display font-black" style={{ color: scoreColor }}>
              {data.score}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-sm" style={{ color: scoreColor }}>
            {data.label}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Star className="w-2.5 h-2.5 text-yellow-500" />
              <span className="font-bold text-foreground">{data.starRate}%</span> star
            </span>
            {data.lossStarRate > 0 && (
              <span className="text-[10px] text-muted-foreground">
                <span className="font-bold text-red-500">{data.lossStarRate}%</span> in losses
              </span>
            )}
          </div>
          <p className="text-[9px] text-muted-foreground/70 mt-1">
            {data.starCount} stars in {data.totalGames} games
          </p>
        </div>
      </div>
    </Card>
  );
}
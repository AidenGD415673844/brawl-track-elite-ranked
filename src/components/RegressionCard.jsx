import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { computeRegression } from "@/lib/regressionAnalysis";

// RegressionCard — displays whether the player is over/under-performing
// relative to their Elo-expected win rate. Uses the standard Elo
// expected-score formula to predict regression to the mean.
export default function RegressionCard({ battleLog }) {
  const data = useMemo(() => computeRegression(battleLog), [battleLog]);

  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-4 rounded-2xl bg-card border-border">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4" style={{ color: data.color }} />
          <h3 className="text-sm font-display font-bold text-foreground">Regression Forecast</h3>
        </div>

        <div className="flex items-center gap-4">
          {/* Deviation gauge */}
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/30" />
              <motion.circle
                cx="32" cy="32" r="28" fill="none" stroke={data.color} strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 28}
                initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - Math.min(100, Math.abs(data.deviation) * 2) / 100) }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-display font-black" style={{ color: data.color }}>
                {data.deviation > 0 ? "+" : ""}{data.deviation}%
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-sm" style={{ color: data.color }}>
              {data.label}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
              {data.description}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] text-muted-foreground">
                Expected: <span className="font-bold text-foreground">{data.expectedWinRate}%</span>
              </span>
              <span className="text-[10px] text-muted-foreground">
                Actual: <span className="font-bold text-foreground">{data.actualWinRate}%</span>
              </span>
              <span className="text-[9px] text-muted-foreground/60">
                {data.sampleSize} games
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
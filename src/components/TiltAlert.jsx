import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Coffee, Flame, TrendingDown } from "lucide-react";
import { analyzeTilt } from "@/lib/coachAnalysis";

// TiltAlert — a coaching widget that appears on the home dashboard when
// the player is on a losing streak or performing below their average.
// Also shows positive reinforcement during win streaks.
export default function TiltAlert({ battleLog }) {
  const insight = useMemo(() => analyzeTilt(battleLog), [battleLog]);

  if (!insight.hasData || (!insight.isTilting && insight.severity === "neutral")) {
    return null;
  }

  // Positive streak — subtle encouragement
  if (insight.streakType === "win") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center gap-3"
      >
        <Flame className="w-5 h-5 text-emerald-500 shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-display font-bold text-emerald-500">{insight.message}</p>
          <p className="text-[10px] text-muted-foreground">{insight.suggestion}</p>
        </div>
      </motion.div>
    );
  }

  // Tilt / losing streak — alert
  const severityStyles = {
    high: {
      border: "border-red-500/40",
      bg: "bg-red-500/15",
      icon: "text-red-500",
      iconBg: "bg-red-500/20",
    },
    medium: {
      border: "border-orange-500/40",
      bg: "bg-orange-500/15",
      icon: "text-orange-500",
      iconBg: "bg-orange-500/20",
    },
    low: {
      border: "border-amber-500/40",
      bg: "bg-amber-500/15",
      icon: "text-amber-500",
      iconBg: "bg-amber-500/20",
    },
  };

  const styles = severityStyles[insight.severity] || severityStyles.low;
  const Icon = insight.streakType === "dip" ? TrendingDown : AlertTriangle;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        className={`rounded-xl border ${styles.border} ${styles.bg} p-3 flex items-center gap-3`}
      >
        <div className={`w-9 h-9 rounded-lg ${styles.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${styles.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-display font-bold ${styles.icon}`}>{insight.message}</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Coffee className="w-2.5 h-2.5" />
            {insight.suggestion}
          </p>
        </div>
        {insight.overallWR > 0 && (
          <div className="text-right shrink-0">
            <p className="text-[9px] text-muted-foreground">Recent vs Avg</p>
            <p className="text-[10px] font-bold">
              <span className={insight.recentWR < insight.overallWR ? "text-red-500" : "text-emerald-500"}>
                {insight.recentWR}%
              </span>
              <span className="text-muted-foreground"> / {insight.overallWR}%</span>
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
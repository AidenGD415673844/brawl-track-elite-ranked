import React from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Clock } from "lucide-react";
import { getRank, TIER_COLORS } from "@/lib/ranks";
import { motion } from "framer-motion";

// Rank decay warning — shows when a Diamond+ player hasn't played in 5+ days.
// Severity escalates with inactivity duration.
export default function RankDecayWarning({ battleLog, currentElo }) {
  const realBattles = (battleLog || []).filter((e) => !e.manual);
  if (realBattles.length === 0) return null;

  const lastBattle = realBattles[0];
  const lastDate = new Date(lastBattle.timestamp);
  const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  // Only show for Diamond+ (3000+ Elo)
  if (currentElo < 3000) return null;

  // Show warning after 5+ days
  if (daysSince < 5) return null;

  const rank = getRank(currentElo);
  const c = TIER_COLORS[rank.tier];

  const severity = daysSince >= 14 ? "critical" : daysSince >= 10 ? "high" : "medium";
  const severityConfig = {
    critical: { bg: "bg-red-500/15", border: "border-red-500/40", text: "text-red-500", label: "CRITICAL" },
    high: { bg: "bg-orange-500/15", border: "border-orange-500/40", text: "text-orange-500", label: "HIGH RISK" },
    medium: { bg: "bg-yellow-500/15", border: "border-yellow-500/40", text: "text-yellow-500", label: "WARNING" },
  };
  const cfg = severityConfig[severity];

  const decayRisk = daysSince >= 14
    ? "Your skills are deteriorating rapidly. At this rank, extended breaks significantly impact your mechanical sharpness and game sense. Consider playing a warm-up match before pushing ranked again."
    : daysSince >= 10
    ? "You're at risk of losing your edge. Diamond+ ranks require consistent play to maintain mechanical sharpness. Play a few unranked matches to warm up before jumping back into ranked."
    : "You haven't played in a few days. Consider a warm-up match to shake off the rust before pushing ranked. Consistency is key at this rank.";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={`${cfg.bg} ${cfg.border} border p-4 rounded-2xl`}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className={`w-4 h-4 ${cfg.text} shrink-0`} />
          <span className={`text-xs font-bold ${cfg.text} font-display`}>
            RANK DECAY WARNING
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
            {cfg.label}
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {daysSince} day{daysSince !== 1 ? "s" : ""} inactive
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {decayRisk}
        </p>
        <p className="text-[10px] mt-2" style={{ color: c.text }}>
          Current rank: {rank.name} ({currentElo.toLocaleString()} Elo)
        </p>
      </Card>
    </motion.div>
  );
}
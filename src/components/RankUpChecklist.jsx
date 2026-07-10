import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, Rocket, Gauge } from "lucide-react";
import { buildRankUpChecklist, promotionReadiness } from "@/lib/rankUp";

const TONE = {
  emerald: "text-emerald-500 bg-emerald-500/15 border-emerald-500/40",
  cyan:    "text-cyan-500 bg-cyan-500/15 border-cyan-500/40",
  amber:   "text-amber-500 bg-amber-500/15 border-amber-500/40",
  rose:    "text-rose-500 bg-rose-500/15 border-rose-500/40",
};

export default function RankUpChecklist({ player, battleLog }) {
  const items = useMemo(() => buildRankUpChecklist(player, battleLog), [player, battleLog]);
  const readiness = useMemo(() => promotionReadiness(player, battleLog), [player, battleLog]);
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);
  const tone = TONE[readiness.tone] || TONE.cyan;

  return (
    <Card className="bg-card border-border p-5 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
          <Rocket className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-display font-bold text-foreground">Rank-Up Checklist</h3>
          <p className="text-[10px] text-muted-foreground">
            {done}/{items.length} checks passed · {pct}% ready
          </p>
        </div>
        <div className={`rounded-xl border px-3 py-1.5 text-right ${tone}`}>
          <div className="flex items-center gap-1 justify-end">
            <Gauge className="w-3 h-3" />
            <span className="text-[10px] uppercase font-bold tracking-wide">Readiness</span>
          </div>
          <p className="text-lg font-display font-bold leading-none">{readiness.score}</p>
        </div>
      </div>

      <p className={`text-xs font-bold mb-3 ${tone.split(" ")[0]}`}>{readiness.label}</p>

      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
        />
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2">
            {item.done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <p className={`text-xs ${item.done ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}>
                {item.label}
              </p>
              <p className="text-[10px] text-muted-foreground">{item.hint}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <Stat label="Recent WR" value={`${readiness.factors.recentWR}%`} />
        <Stat label="Trend" value={`${readiness.factors.trend > 0 ? "+" : ""}${readiness.factors.trend}`} />
        <Stat label="Streak" value={String(readiness.factors.streak)} />
        <Stat label="Matchup" value={`${readiness.factors.matchup > 0 ? "+" : ""}${readiness.factors.matchup}`} />
      </div>
    </Card>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-muted/40 border border-border py-1.5">
      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-xs font-display font-bold text-foreground">{value}</p>
    </div>
  );
}

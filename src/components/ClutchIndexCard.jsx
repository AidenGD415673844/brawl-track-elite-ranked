import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Flame, Snowflake, ShieldOff, Zap } from "lucide-react";
import { computeClutchIndex, computePressure } from "@/lib/clutchIndex";

const VERDICT_COLOR = {
  "Legendary Under Fire": "#f97316",
  "Clutch":               "#f59e0b",
  "Steady":               "#22d3ee",
  "Ice Cold":             "#94a3b8",
  "Warming Up":           "#94a3b8",
  "No Data":              "#64748b",
};

export default function ClutchIndexCard({ battleLog }) {
  const stats = useMemo(() => computeClutchIndex(battleLog || []), [battleLog]);

  // Recent 20 rated: (index, pressure, win?)
  const spark = useMemo(() => {
    const rated = [];
    for (let i = 0; i < (battleLog?.length || 0) && rated.length < 20; i++) {
      const e = battleLog[i];
      if (e.manual || !(e.result === "victory" || e.result === "defeat")) continue;
      const p = computePressure(e, battleLog, i);
      if (p) rated.push({ pressure: p.score, win: e.result === "victory" });
    }
    return rated.reverse();
  }, [battleLog]);

  const topMoments = useMemo(() => {
    const arr = [];
    for (let i = 0; i < (battleLog?.length || 0); i++) {
      const e = battleLog[i];
      if (e.manual || !(e.result === "victory" || e.result === "defeat")) continue;
      const p = computePressure(e, battleLog, i);
      if (p && p.score >= 60) arr.push({ e, p });
      if (arr.length >= 20) break;
    }
    return arr.sort((a, b) => b.p.score - a.p.score).slice(0, 3);
  }, [battleLog]);

  const color = VERDICT_COLOR[stats.verdict] || "#22d3ee";

  return (
    <Card className="bg-card border-border p-4 sm:p-5 rounded-2xl overflow-hidden relative">
      <div className="flex items-center gap-2 mb-1">
        <Flame className="w-4 h-4" style={{ color }} />
        <h3 className="text-sm font-display font-semibold text-foreground">Clutch Index</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Did you win when it mattered? {stats.highPressure} high-pressure games in last {stats.sample}.
      </p>

      <div className="flex items-baseline gap-3 mb-3">
        <motion.span
          key={stats.index}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-5xl font-display font-black"
          style={{ color, textShadow: `0 0 24px ${color}55` }}
        >
          {stats.index}
        </motion.span>
        <div className="flex flex-col">
          <span className="text-xs font-display font-bold uppercase tracking-wider" style={{ color }}>
            {stats.verdict}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {stats.wins}/{stats.highPressure} clutch wins · avg pressure {stats.avgPressure}
          </span>
        </div>
      </div>

      {/* Pressure sparkline — bar height = pressure, color = W/L */}
      {spark.length > 0 && (
        <div className="flex items-end gap-[3px] h-14 mb-3">
          {spark.map((s, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${Math.max(6, s.pressure)}%`,
                background: s.win
                  ? `linear-gradient(180deg, #10b981, #059669)`
                  : `linear-gradient(180deg, #ef4444, #b91c1c)`,
                opacity: s.pressure >= 60 ? 1 : 0.45,
                boxShadow: s.pressure >= 60 ? `0 0 8px ${s.win ? "#10b981aa" : "#ef4444aa"}` : "none",
              }}
              title={`Pressure ${s.pressure} · ${s.win ? "Win" : "Loss"}`}
            />
          ))}
        </div>
      )}

      {topMoments.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider">
            Top Pressure Moments
          </div>
          {topMoments.map(({ e, p }, i) => {
            const win = e.result === "victory";
            const Icon = win ? Flame : ShieldOff;
            return (
              <div
                key={i}
                className="flex items-center justify-between text-[10px] rounded-lg px-2 py-1 border"
                style={{
                  borderColor: win ? "#10b98155" : "#ef444455",
                  background: win ? "#10b98111" : "#ef444411",
                }}
              >
                <span className="flex items-center gap-1.5">
                  <Icon className="w-3 h-3" style={{ color: win ? "#10b981" : "#ef4444" }} />
                  <span className="font-bold text-foreground">{e.mode || "Ranked"}</span>
                  <span className="text-muted-foreground">{e.brawler || ""}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="font-bold" style={{ color: win ? "#10b981" : "#ef4444" }}>{p.score}</span>
                  <span className={win ? "text-emerald-500" : "text-red-500"}>
                    {e.delta > 0 ? "+" : ""}{e.delta}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {stats.sample === 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
          <Snowflake className="w-4 h-4" />
          Log battles to unlock your Clutch Index.
        </div>
      )}
    </Card>
  );
}

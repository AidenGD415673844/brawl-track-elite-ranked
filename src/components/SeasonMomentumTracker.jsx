import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";

// SeasonMomentumTracker — compares the player's recent Elo gain rate
// (last 20 games) against their all-time average to show whether
// they're trending above or below their typical performance.
export default function SeasonMomentumTracker({ battleLog, seasonStartDate }) {
  // Only battles logged after the current season's start count toward
  // this season's momentum. This prevents the previous season's chart
  // from bleeding through after clicking "New Season".
  const seasonStartTs = seasonStartDate ? new Date(seasonStartDate).getTime() : 0;
  const seasonLogAll = useMemo(() => {
    const real = (battleLog || []).filter((e) => !e.manual);
    if (!seasonStartTs) return real;
    return real.filter((e) => {
      const ts = e.timestamp ? new Date(e.timestamp).getTime() : 0;
      return ts >= seasonStartTs;
    });
  }, [battleLog, seasonStartTs]);

  const data = useMemo(() => {
    if (seasonLogAll.length < 2) return null;
    const realLog = seasonLogAll;

    // Battle log is newest-first; reverse for chronological order
    const chrono = [...realLog].reverse();
    const allTimeDelta = chrono[chrono.length - 1].eloAfter - chrono[0].playerElo;
    const allTimeGames = chrono.length;
    const allTimeRate = allTimeDelta / allTimeGames;

    // "This season" = last 20 games (or all if fewer)
    const seasonLog = chrono.slice(-Math.min(20, chrono.length));
    const seasonDelta = seasonLog[seasonLog.length - 1].eloAfter - seasonLog[0].playerElo;
    const seasonGames = seasonLog.length;
    const seasonRate = seasonDelta / seasonGames;

    const momentum = allTimeRate !== 0
      ? Math.round(((seasonRate - allTimeRate) / Math.abs(allTimeRate)) * 100)
      : 0;

    return {
      seasonRate: Math.round(seasonRate * 10) / 10,
      allTimeRate: Math.round(allTimeRate * 10) / 10,
      momentum,
      seasonGames,
    };
  }, [seasonLogAll]);

  if (!data) {
    // Fresh-season empty state — replaces the stale prior-season chart.
    if (seasonStartTs) {
      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5 rounded-2xl bg-card border-border">
            <div className="flex items-center gap-2 mb-1">
              <Minus className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-sm font-display font-bold text-foreground">Season Momentum</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Fresh season · 0 logged. Play a couple of matches to see your trend.
            </p>
          </Card>
        </motion.div>
      );
    }
    return null;
  }

  const isUp = data.momentum > 5;
  const isDown = data.momentum < -5;
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const color = isUp ? "text-emerald-500" : isDown ? "text-red-500" : "text-muted-foreground";
  const barColor = isUp ? "#10b981" : isDown ? "#ef4444" : "#6b7280";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5 rounded-2xl bg-card border-border">
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`w-5 h-5 ${color}`} />
          <h3 className="text-sm font-display font-bold text-foreground">Season Momentum</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Recent</p>
            <p className="text-lg font-display font-bold text-foreground">
              {data.seasonRate > 0 ? "+" : ""}{data.seasonRate}
            </p>
            <p className="text-[9px] text-muted-foreground">Elo/game</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">All-Time</p>
            <p className="text-lg font-display font-bold text-muted-foreground">
              {data.allTimeRate > 0 ? "+" : ""}{data.allTimeRate}
            </p>
            <p className="text-[9px] text-muted-foreground">Elo/game</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Momentum</p>
            <p className={`text-lg font-display font-bold ${color}`}>
              {data.momentum > 0 ? "+" : ""}{data.momentum}%
            </p>
            <p className="text-[9px] text-muted-foreground">vs average</p>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, Math.abs(data.momentum))}%`,
              background: barColor,
            }}
          />
        </div>

        {/* Elo sparkline — last 20 games trend */}
        <div className="mt-3">
          <Sparkline battleLog={battleLog} />
        </div>
      </Card>
    </motion.div>
  );
}

function Sparkline({ battleLog }) {
  const points = useMemo(() => {
    const real = (battleLog || []).filter((e) => !e.manual);
    if (real.length < 2) return [];
    const chrono = [...real].reverse().slice(-20);
    const elos = chrono.map((e, i) => ({
      x: i,
      y: e.eloAfter,
      win: e.result === "victory",
    }));
    const minY = Math.min(...elos.map((p) => p.y));
    const maxY = Math.max(...elos.map((p) => p.y));
    const range = maxY - minY || 1;
    return elos.map((p) => ({
      ...p,
      nx: (p.x / (elos.length - 1)) * 100,
      ny: 100 - ((p.y - minY) / range) * 100,
    }));
  }, [battleLog]);

  if (points.length < 2) return null;

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.nx} ${p.ny}`).join(" ");
  const areaPath = `${path} L 100 100 L 0 100 Z`;

  return (
    <div>
      <p className="text-[9px] uppercase text-muted-foreground font-display mb-1">Elo Trend (last {points.length})</p>
      <svg className="w-full h-12" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#sparkline-grad)" />
        <path d={path} fill="none" stroke="#22d3ee" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.nx}
            cy={p.ny}
            r="1.2"
            fill={p.win ? "#10b981" : "#ef4444"}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  );
}
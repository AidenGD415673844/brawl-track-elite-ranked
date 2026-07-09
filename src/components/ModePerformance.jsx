import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { motion } from "framer-motion";

export default function ModePerformance({ battleLog }) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const gridStroke = dark ? "#1e293b" : "#e2e8f0";
  const axisStroke = "#64748b";
  const tooltipStyle = {
    background: dark ? "#0f172a" : "#ffffff",
    border: `1px solid ${dark ? "#334155" : "#cbd5e1"}`,
    borderRadius: 12,
    color: dark ? "#e2e8f0" : "#1e293b",
    fontSize: 12,
  };

  const { data, personalAvg } = useMemo(() => {
    const byMode = {};
    let totalWins = 0;
    let totalGames = 0;
    for (const entry of battleLog) {
      if (entry.manual) continue;
      if (!byMode[entry.mode])
        byMode[entry.mode] = { mode: entry.mode, wins: 0, losses: 0, total: 0 };
      byMode[entry.mode].total++;
      totalGames++;
      if (entry.result === "victory") {
        byMode[entry.mode].wins++;
        totalWins++;
      } else {
        byMode[entry.mode].losses++;
      }
    }
    const modeData = Object.values(byMode).map((d) => ({
      ...d,
      winRate: d.total > 0 ? Math.round((d.wins / d.total) * 100) : 0,
    }));
    const avg = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
    return { data: modeData, personalAvg: avg };
  }, [battleLog]);

  if (data.length === 0) {
    return (
      <Card className="bg-card border-border p-4 sm:p-5 rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-cyan-500" />
          <h3 className="text-sm font-display font-semibold text-foreground">Mode Performance</h3>
        </div>
        <p className="text-xs text-muted-foreground py-12 text-center">
          Log battles to see your win rate by game mode.
        </p>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border p-4 sm:p-5 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="w-4 h-4 text-cyan-500" />
        <h3 className="text-sm font-display font-semibold text-foreground">Mode Performance</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Win rate (%) by game mode
        <span className="ml-2 text-[10px] font-bold" style={{ color: "#64748b" }}>
          Personal Avg: <span style={{ color: personalAvg >= 50 ? "#10b981" : "#ef4444" }}>{personalAvg}%</span>
        </span>
      </p>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="h-56 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 8, left: -12, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />
            <ReferenceLine
              y={personalAvg}
              stroke="#64748b"
              strokeDasharray="5 3"
              strokeWidth={1.5}
              label={{ value: "Avg", position: "right", fontSize: 9, fill: "#64748b" }}
            />
            <XAxis
              dataKey="mode"
              stroke={axisStroke}
              fontSize={9}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis stroke={axisStroke} fontSize={11} width={40} domain={[0, 100]} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => [`${v}%`, "Win Rate"]}
            />
            <Bar
              dataKey="winRate"
              radius={[6, 6, 0, 0]}
              isAnimationActive={true}
              animationDuration={800}
            >
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    d.winRate >= 55
                      ? "#10b981"
                      : d.winRate >= 50
                      ? "#f59e0b"
                      : "#ef4444"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </Card>
  );
}
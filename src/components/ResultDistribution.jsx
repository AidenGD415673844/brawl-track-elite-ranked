import React from "react";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { motion } from "framer-motion";

export default function ResultDistribution({ battleLog }) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const tooltipStyle = {
    background: dark ? "#0f172a" : "#ffffff",
    border: `1px solid ${dark ? "#334155" : "#cbd5e1"}`,
    borderRadius: 12,
    color: dark ? "#e2e8f0" : "#1e293b",
    fontSize: 12,
  };

  const wins = battleLog.filter((e) => e.result === "victory").length;
  const losses = battleLog.filter((e) => e.result === "defeat").length;
  const total = wins + losses;

  const data = [
    { name: "Wins", value: wins, color: "#10b981" },
    { name: "Losses", value: losses, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  if (total === 0) {
    return (
      <Card className="bg-card border-border p-4 sm:p-5 rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <PieIcon className="w-4 h-4 text-cyan-500" />
          <h3 className="text-sm font-display font-semibold text-foreground">Result Distribution</h3>
        </div>
        <p className="text-xs text-muted-foreground py-12 text-center">
          Log battles to see your win/loss distribution.
        </p>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border p-4 sm:p-5 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
        <PieIcon className="w-4 h-4 text-cyan-500" />
        <h3 className="text-sm font-display font-semibold text-foreground">Result Distribution</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{total} battles logged</p>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative h-48 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={3}
              isAnimationActive={true}
              animationDuration={800}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v, name) => [v, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-2xl font-display font-black text-foreground">{winRate}%</p>
          <p className="text-[10px] text-muted-foreground">Win Rate</p>
        </div>
      </motion.div>
      <div className="flex justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-muted-foreground">Wins ({wins})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-xs text-muted-foreground">Losses ({losses})</span>
        </div>
      </div>
    </Card>
  );
}
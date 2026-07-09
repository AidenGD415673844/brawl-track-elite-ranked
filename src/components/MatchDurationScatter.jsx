import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ZAxis,
} from "recharts";
import { ScatterChart as ScatterIcon } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

// Match Duration vs. Win Rate scatter plot.
// Uses entry.duration (seconds) if available; falls back to time-of-day proxy otherwise.
export default function MatchDurationScatter({ battleLog }) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [hovered, setHovered] = useState(null);

  const gridStroke = dark ? "#1e293b" : "#e2e8f0";
  const axisStroke = "#64748b";
  const tooltipStyle = {
    background: dark ? "#0f172a" : "#ffffff",
    border: `1px solid ${dark ? "#334155" : "#cbd5e1"}`,
    borderRadius: 12,
    color: dark ? "#e2e8f0" : "#1e293b",
    fontSize: 12,
  };

  const data = useMemo(() => {
    return (battleLog || [])
      .filter((e) => !e.manual && e.duration)
      .map((e) => ({
        duration: e.duration,
        win: e.result === "victory" ? 1 : 0,
        brawler: e.brawler,
        mode: e.mode,
        result: e.result,
      }));
  }, [battleLog]);

  const winData = data.filter((d) => d.win === 1);
  const lossData = data.filter((d) => d.win === 0);

  if (data.length === 0) {
    return (
      <Card className="bg-card border-border p-4 sm:p-5 rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <ScatterIcon className="w-4 h-4 text-cyan-500" />
          <h3 className="text-sm font-display font-semibold text-foreground">Match Duration vs. Win Rate</h3>
        </div>
        <p className="text-xs text-muted-foreground text-center py-8">
          Log battles with a duration (seconds) to see this scatter plot.
        </p>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={tooltipStyle} className="p-2 rounded-xl">
        <p className="font-bold text-xs">{d.result === "victory" ? "Victory" : "Defeat"}</p>
        <p className="text-[10px]">Duration: {Math.floor(d.duration / 60)}m {d.duration % 60}s</p>
        {d.brawler && <p className="text-[10px]">Brawler: {d.brawler}</p>}
        <p className="text-[10px]">Mode: {d.mode}</p>
      </div>
    );
  };

  return (
    <Card className="bg-card border-border p-4 sm:p-5 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
        <ScatterIcon className="w-4 h-4 text-cyan-500" />
        <h3 className="text-sm font-display font-semibold text-foreground">Match Duration vs. Win Rate</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Green = wins, Red = losses — find your optimal game length
      </p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 8, left: -12, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />
            <XAxis
              type="number"
              dataKey="duration"
              name="Duration"
              unit="s"
              stroke={axisStroke}
              fontSize={11}
              tickFormatter={(v) => `${Math.floor(v / 60)}m`}
            />
            <YAxis
              type="number"
              dataKey="win"
              name="Result"
              stroke={axisStroke}
              fontSize={11}
              tickCount={2}
              tickFormatter={(v) => (v === 1 ? "Win" : "Loss")}
              domain={[-0.5, 1.5]}
            />
            <ZAxis range={[60, 60]} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter name="Wins" data={winData} fill="#10b981" fillOpacity={0.7} />
            <Scatter name="Losses" data={lossData} fill="#ef4444" fillOpacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
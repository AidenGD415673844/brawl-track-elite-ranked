import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { motion } from "framer-motion";
import BattleDetailModal from "@/components/BattleDetailModal";

const TIMEFRAMES = [
  { key: "all", label: "All Time" },
  { key: "7d", label: "Last 7 Days" },
  { key: "20", label: "Last 20" },
];

export default function EloProgressionChart({ battleLog }) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [timeframe, setTimeframe] = useState("all");
  const [selected, setSelected] = useState(null);

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
    let entries = [...(battleLog || [])].filter((e) => !e.manual).reverse();

    if (timeframe === "7d") {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      entries = entries.filter((e) => new Date(e.timestamp).getTime() > cutoff);
    } else if (timeframe === "20") {
      entries = entries.slice(-20);
    }

    return entries.map((entry, i) => ({
      game: i + 1,
      elo: entry.eloAfter,
      mode: entry.mode,
      result: entry.result,
      brawler: entry.brawler,
      entry,
    }));
  }, [battleLog, timeframe]);

  const handleClick = (e) => {
    if (e && e.activePayload && e.activePayload[0]) {
      setSelected(e.activePayload[0].payload.entry);
    }
  };

  if (data.length < 2) {
    return (
      <Card className="bg-card border-border p-4 sm:p-5 rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-cyan-500" />
          <h3 className="text-sm font-display font-semibold text-foreground">Elo Progression</h3>
        </div>
        <p className="text-xs text-muted-foreground py-12 text-center">
          Log at least 2 battles to see your Elo progression chart.
        </p>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={tooltipStyle} className="p-2 rounded-xl cursor-pointer">
        <p className="font-bold text-xs">Battle {d.game}</p>
        <p className="text-[10px]">{d.result === "victory" ? "Victory" : "Defeat"} · {d.mode}</p>
        <p className="text-[10px]">{d.elo.toLocaleString()} Elo</p>
        {d.brawler && <p className="text-[10px]">{d.brawler}</p>}
        <p className="text-[9px] text-cyan-400 mt-1">Click for details</p>
      </div>
    );
  };

  return (
    <Card className="bg-card border-border p-4 sm:p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-500" />
          <h3 className="text-sm font-display font-semibold text-foreground">Elo Progression</h3>
        </div>
        <div className="flex gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.key}
              onClick={() => setTimeframe(tf.key)}
              className={`px-2 py-1 rounded-lg text-[10px] font-display font-bold transition ${
                timeframe === tf.key
                  ? "bg-cyan-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Click any point to view battle details · {data.length} battles shown
      </p>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="h-64 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 8, left: -12, bottom: 0 }} onClick={handleClick}>
            <defs>
              <linearGradient id="eloLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />
            <XAxis dataKey="game" stroke={axisStroke} fontSize={11} />
            <YAxis
              stroke={axisStroke}
              fontSize={11}
              width={48}
              domain={["dataMin - 100", "dataMax + 100"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              dataKey="elo"
              stroke="url(#eloLine)"
              strokeWidth={3}
              dot={{ r: 3, fill: "#22d3ee", cursor: "pointer" }}
              activeDot={{ r: 7, fill: "#e879f9", stroke: "#fff", strokeWidth: 2, cursor: "pointer" }}
              isAnimationActive={true}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {selected && <BattleDetailModal entry={selected} onClose={() => setSelected(null)} />}
    </Card>
  );
}
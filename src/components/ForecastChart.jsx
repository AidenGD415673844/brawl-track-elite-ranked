import React from "react";
import { Card } from "@/components/ui/card";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Activity } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { motion } from "framer-motion";

export default function ForecastChart({ forecast }) {
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

  if (!forecast) return null;

  const data = forecast.paths.map((p) => ({
    match: p.match,
    low: p.low,
    band: p.high - p.low,
    median: p.median,
    high: p.high,
    trend: p.trend,
  }));

  return (
    <Card className="bg-card border-border p-4 sm:p-5 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Activity className="w-4 h-4 text-cyan-500" />
        <h3 className="text-sm font-display font-semibold text-foreground">
          Forecast — Monte Carlo Cone of Uncertainty
        </h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {forecast.paths.length - 1} simulated matches · {forecast.isBestOf3 ? "Best of 3" : "Best of 1"} format
        {forecast.isBestOf3 && forecast.effectiveWinRate ? ` · ${forecast.effectiveWinRate}% series win rate` : ""} · low (P10), median (P50), high (P90)
      </p>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="h-72 sm:h-80 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="medianLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#e879f9" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />
            <XAxis
              dataKey="match"
              stroke={axisStroke}
              fontSize={11}
              label={{
                value: "Matches",
                position: "insideBottom",
                offset: -2,
                fill: axisStroke,
                fontSize: 11,
              }}
            />
            <YAxis stroke={axisStroke} fontSize={11} width={48} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v, name) => {
                if (name === "band") return null;
                return [Math.round(v), name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area
              dataKey="low"
              stackId="cone"
              stroke="none"
              fill="transparent"
              legendType="none"
              name="low"
            />
            <Area
              dataKey="band"
              stackId="cone"
              stroke="none"
              fill="url(#cone)"
              name="Uncertainty"
              isAnimationActive={true}
              animationDuration={800}
            />
            <Line
              dataKey="high"
              stroke="#22d3ee"
              strokeWidth={1}
              dot={false}
              strokeDasharray="4 3"
              name="High (P90)"
              isAnimationActive={true}
              animationDuration={1000}
            />
            <Line
              dataKey="median"
              stroke="url(#medianLine)"
              strokeWidth={3}
              dot={false}
              name="Median (P50)"
              isAnimationActive={true}
              animationDuration={1200}
              activeDot={{ r: 6, fill: "#e879f9", stroke: "#fff", strokeWidth: 2 }}
            />
            <Line
              dataKey="low"
              stroke="#f87171"
              strokeWidth={1}
              dot={false}
              strokeDasharray="4 3"
              name="Low (P10)"
              isAnimationActive={true}
              animationDuration={1000}
            />
            <Line
              dataKey="trend"
              stroke="#facc15"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="2 2"
              name="Trend"
              isAnimationActive={true}
              animationDuration={1000}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>
    </Card>
  );
}
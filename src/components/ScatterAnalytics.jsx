import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { climbScore, riskScore } from "@/lib/forecast";
import { useTheme } from "@/lib/ThemeContext";
import { motion } from "framer-motion";

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function Panel({ title, xKey, yKey, xLabel, yLabel, cloud, player, dark }) {
  const gridStroke = dark ? "#1e293b" : "#e2e8f0";
  const axisStroke = "#64748b";
  const tooltipStyle = {
    background: dark ? "#0f172a" : "#ffffff",
    border: `1px solid ${dark ? "#334155" : "#cbd5e1"}`,
    borderRadius: 12,
    color: dark ? "#e2e8f0" : "#1e293b",
    fontSize: 12,
  };
  const scatterFill = dark ? "#475569" : "#94a3b8";

  return (
    <Card className="bg-card border-border p-4 rounded-2xl">
      <h3 className="text-sm font-display font-semibold text-foreground mb-3">{title}</h3>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="h-56 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 10, left: -12, bottom: 5 }}>
            <defs>
              <filter id={`glow-${xKey}`}>
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />
            <XAxis
              type="number"
              dataKey={xKey}
              name={xLabel}
              stroke={axisStroke}
              fontSize={10}
              label={{
                value: xLabel,
                position: "insideBottom",
                offset: -3,
                fill: axisStroke,
                fontSize: 10,
              }}
            />
            <YAxis
              type="number"
              dataKey={yKey}
              name={yLabel}
              stroke={axisStroke}
              fontSize={10}
              width={44}
            />
            <ZAxis range={[60, 60]} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter
              data={cloud}
              fill={scatterFill}
              isAnimationActive={true}
              animationDuration={600}
            />
            <Scatter
              data={[player]}
              fill="#22d3ee"
              shape="star"
              isAnimationActive={true}
              animationDuration={800}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </motion.div>
      <p className="text-xs text-muted-foreground mt-2">
        <span className="text-cyan-500 font-display font-semibold">★ You</span> vs. comparison
        field
      </p>
    </Card>
  );
}

export default function ScatterAnalytics({ player, boost }) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const { cloud, me } = useMemo(() => {
    const rand = seeded(42);
    const cloud = Array.from({ length: 40 }, () => {
      const elo = Math.round(rand() * 11000 + 200);
      const wr = Math.round(rand() * 45 + 35);
      return {
        elo,
        trophies: Math.round(elo * (0.8 + rand() * 0.6)),
        winRate: wr,
        climb: climbScore(wr),
        skill: Math.round(rand() * 9 + 1),
        risk: riskScore(wr),
      };
    });
    const me = {
      elo: player.currentElo,
      trophies: player.trophies,
      winRate: player.winRate,
      climb: climbScore(player.winRate, boost.multiplier),
      skill: player.skill,
      risk: riskScore(player.winRate),
    };
    return { cloud, me };
  }, [player, boost]);

  return (
    <div className="grid grid-cols-1 gap-4">
      <Panel
        title="Skill vs Risk"
        xKey="skill"
        yKey="risk"
        xLabel="Skill"
        yLabel="Risk (σ)"
        cloud={cloud}
        player={me}
        dark={dark}
      />
    </div>
  );
}
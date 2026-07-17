import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Rocket, Timer } from "lucide-react";
import { computeVelocity } from "@/lib/eloVelocity";

function Sparkline({ points }) {
  if (!points || points.length < 2) return null;
  const w = 160, h = 40;
  const min = Math.min(...points), max = Math.max(...points);
  const range = Math.max(1, max - min);
  const step = w / (points.length - 1);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - ((p - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={d} fill="none" stroke="url(#veloGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="veloGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const VERDICT_COLOR = {
  "Rocket 🚀": "#22c55e",
  "Climbing":  "#22d3ee",
  "Cruising":  "#a3a3a3",
  "Stalling":  "#eab308",
  "Sliding":   "#ef4444",
  "No Data":   "#71717a",
};

export default function EloVelocityCard({ battleLog }) {
  const v = useMemo(() => computeVelocity(battleLog), [battleLog]);
  const color = VERDICT_COLOR[v.verdict] || "#a3a3a3";

  return (
    <Card className="bg-card border-border p-4 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
          <Rocket className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="text-sm font-display font-semibold text-foreground">Elo Velocity</h3>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: `${color}22`, color }}>
          {v.verdict}
        </span>
      </div>

      {v.empty ? (
        <p className="text-[11px] text-muted-foreground text-center py-4">
          Play 3+ rated matches to see your pace.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <p className="text-[9px] uppercase text-muted-foreground">Per Game (last 10)</p>
              <p className="text-2xl font-display font-black" style={{ color }}>
                {v.perGame > 0 ? "+" : ""}{v.perGame}
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase text-muted-foreground">Per Hour</p>
              <p className="text-2xl font-display font-black text-foreground">
                {v.perHour > 0 ? "+" : ""}{v.perHour}
              </p>
            </div>
          </div>
          <Sparkline points={v.sparkline} />
          {v.timeToNext && (
            <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
              <Timer className="w-3 h-3" />
              <span>
                ~{v.timeToNext.games} games to <b className="text-foreground">{v.timeToNext.rank}</b>
                {v.timeToNext.hours ? ` (~${v.timeToNext.hours}h at this pace)` : ""}
              </span>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

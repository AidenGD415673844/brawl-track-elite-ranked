import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Swords, TrendingUp, TrendingDown } from "lucide-react";
import { topMatchups, confidenceLabel } from "@/lib/matchupIntel";

function Row({ row, side }) {
  const conf = confidenceLabel(row.games);
  const pct = Math.round(row.rate * 100);
  const color = side === "up" ? "#22c55e" : "#ef4444";
  return (
    <div className="flex items-center justify-between text-[11px] py-1 border-b border-border/40 last:border-0">
      <span className="font-bold text-foreground truncate max-w-[110px]">{row.enemy}</span>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{row.w}W-{row.l}L</span>
        <span className="font-display font-black" style={{ color }}>{pct}%</span>
        <span
          className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide"
          style={{ background: `${conf.color}22`, color: conf.color }}
        >
          {conf.label}
        </span>
      </div>
    </div>
  );
}

export default function MatchupIntelCard({ battleLog }) {
  const data = useMemo(() => topMatchups(battleLog, { min: 3, take: 5 }), [battleLog]);
  const empty = data.total === 0;

  return (
    <Card className="bg-card border-border p-4 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
          <Swords className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="text-sm font-display font-semibold text-foreground">Matchup Intel</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">{data.total} enemies tracked</span>
      </div>
      {empty ? (
        <p className="text-[11px] text-muted-foreground text-center py-6">
          Log a few battles with enemy brawlers to unlock matchup stats.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1 mb-1 text-[10px] font-bold uppercase text-emerald-500">
              <TrendingUp className="w-3 h-3" /> Favored
            </div>
            {data.favored.length === 0
              ? <p className="text-[10px] text-muted-foreground italic">Need more games</p>
              : data.favored.map((r) => <Row key={r.enemy} row={r} side="up" />)}
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1 text-[10px] font-bold uppercase text-red-500">
              <TrendingDown className="w-3 h-3" /> Nightmare
            </div>
            {data.nightmare.length === 0
              ? <p className="text-[10px] text-muted-foreground italic">Need more games</p>
              : data.nightmare.map((r) => <Row key={r.enemy} row={r} side="down" />)}
          </div>
        </div>
      )}
    </Card>
  );
}

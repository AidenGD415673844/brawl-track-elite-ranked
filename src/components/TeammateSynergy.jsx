import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import { getRank } from "@/lib/ranks";
import RankBadge from "@/components/RankBadge";

// Teammate Synergy Matrix — win rate grouped by teammate Elo.
export default function TeammateSynergy({ battleLog }) {
  const data = useMemo(() => {
    const real = (battleLog || []).filter((e) => !e.manual && e.teammateElos);
    const byMate = {};
    for (const e of real) {
      for (const elo of e.teammateElos) {
        const key = String(elo);
        if (!byMate[key]) byMate[key] = { elo: Number(elo), wins: 0, total: 0 };
        byMate[key].total++;
        if (e.result === "victory") byMate[key].wins++;
      }
    }
    return Object.values(byMate)
      .map((m) => ({ ...m, winRate: Math.round((m.wins / m.total) * 100) }))
      .sort((a, b) => b.total - a.total);
  }, [battleLog]);

  const getColor = (wr) => {
    if (wr >= 60) return "text-emerald-500";
    if (wr >= 50) return "text-yellow-500";
    if (wr >= 40) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <Card className="bg-card border-border p-4 sm:p-5 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-4 h-4 text-cyan-500" />
        <h3 className="text-sm font-display font-semibold text-foreground">Teammate Synergy Matrix</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Win rate by teammate Elo grouping</p>

      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">
          Log battles with teammate Elo values to see synergy stats.
        </p>
      ) : (
        <div className="space-y-2">
          {data.map((m, i) => {
            const rank = getRank(m.elo);
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-2"
              >
                <RankBadge elo={m.elo} size={28} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    Mate @ {m.elo.toLocaleString()} Elo
                  </p>
                  <p className="text-[10px] text-muted-foreground">{rank.name}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-display font-black ${getColor(m.winRate)}`}>
                    {m.winRate}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">{m.wins}W / {m.total - m.wins}L</p>
                </div>
                {/* Mini bar */}
                <div className="w-16 h-2 rounded-full bg-muted overflow-hidden hidden sm:block">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${m.winRate}%`,
                      background: m.winRate >= 60 ? "#10b981" : m.winRate >= 50 ? "#eab308" : m.winRate >= 40 ? "#f97316" : "#ef4444",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
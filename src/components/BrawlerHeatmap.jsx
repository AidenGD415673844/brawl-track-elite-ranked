import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Grid3x3 } from "lucide-react";
import { brawlerImageUrl, PLACEHOLDER_BRAWLER } from "@/lib/brawlers";

// Brawler Performance Heatmap — color-coded win rate per brawler.
export default function BrawlerHeatmap({ battleLog }) {
  const data = useMemo(() => {
    const real = (battleLog || []).filter((e) => !e.manual && e.brawler);
    const byBrawler = {};
    for (const e of real) {
      if (!byBrawler[e.brawler]) byBrawler[e.brawler] = { wins: 0, total: 0 };
      byBrawler[e.brawler].total++;
      if (e.result === "victory") byBrawler[e.brawler].wins++;
    }
    return Object.entries(byBrawler)
      .map(([name, { wins, total }]) => ({
        name,
        wins,
        total,
        winRate: Math.round((wins / total) * 100),
      }))
      .sort((a, b) => b.total - a.total);
  }, [battleLog]);

  const getColor = (wr) => {
    if (wr >= 60) return { bg: "rgba(16,185,129,0.25)", border: "rgba(16,185,129,0.5)", text: "#10b981" };
    if (wr >= 50) return { bg: "rgba(234,179,8,0.20)", border: "rgba(234,179,8,0.45)", text: "#eab308" };
    if (wr >= 40) return { bg: "rgba(249,115,22,0.20)", border: "rgba(249,115,22,0.45)", text: "#f97316" };
    return { bg: "rgba(239,68,68,0.20)", border: "rgba(239,68,68,0.45)", text: "#ef4444" };
  };

  return (
    <Card className="bg-card border-border p-4 sm:p-5 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Grid3x3 className="w-4 h-4 text-cyan-500" />
        <h3 className="text-sm font-display font-semibold text-foreground">Brawler Performance Heatmap</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Win rate by brawler — green is strong, red needs work</p>

      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">
          Log battles with a brawler selected to see your performance heatmap.
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {data.map((b) => {
            const c = getColor(b.winRate);
            return (
              <div
                key={b.name}
                className="rounded-xl border p-2 text-center"
                style={{ background: c.bg, borderColor: c.border }}
              >
                <img
                  src={brawlerImageUrl(b.name)}
                  alt={b.name}
                  onError={(e) => { e.target.src = PLACEHOLDER_BRAWLER; }}
                  className="w-10 h-10 mx-auto rounded-lg object-cover mb-1"
                />
                <p className="text-[9px] font-bold text-foreground truncate">{b.name}</p>
                <p className="text-sm font-display font-black" style={{ color: c.text }}>
                  {b.winRate}%
                </p>
                <p className="text-[8px] text-muted-foreground">{b.wins}W / {b.total - b.wins}L</p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
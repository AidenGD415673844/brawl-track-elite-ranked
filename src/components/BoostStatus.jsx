import React from "react";
import { Card } from "@/components/ui/card";
import { Zap, TrendingUp } from "lucide-react";

export default function BoostStatus({ boost, forecast }) {
  const active = boost.active;
  return (
    <Card
      className={`p-4 rounded-2xl border ${
        active
          ? "bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/50"
          : "bg-card border-border"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Zap className={`w-4 h-4 ${active ? "text-cyan-500" : "text-muted-foreground"}`} />
        <h3 className="text-sm font-semibold text-foreground">Rank Boost</h3>
      </div>
      <p
        className={`text-2xl font-black ${
          active ? "text-cyan-500" : "text-muted-foreground"
        }`}
      >
        {boost.label}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {boost.ranksAway > 0
          ? `${boost.ranksAway} rank${boost.ranksAway > 1 ? "s" : ""} from ${boost.targetRank.name}`
          : "At or above target rank"}
      </p>
      {forecast && (
        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-2 text-sm text-purple-500">
            <TrendingUp className="w-4 h-4" />
            Gain per win: <span className="font-bold">+{forecast.gainPerWin}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-red-400">Loss: -{forecast.lossPerDefeat}</span>
          </div>
          {forecast.isBestOf3 && (
            <p className="text-[10px] text-cyan-500 font-medium">
              Best of 3 · {forecast.effectiveWinRate}% series win rate
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
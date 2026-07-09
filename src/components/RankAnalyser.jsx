import React from "react";
import { Card } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { analyzeRank } from "@/lib/rankAnalysis";

export default function RankAnalyser({ player, forecast, boost, battleLog }) {
  const analysis = analyzeRank(player, forecast, boost, battleLog);

  // Condense all sections into one cohesive narrative paragraph
  const fullNarrative = [
    analysis.headline,
    ...analysis.sections.map((s) => s.text),
  ]
    .filter(Boolean)
    .join("  ");

  return (
    <Card className="bg-card border-border p-5 rounded-2xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Rank Analyser</h3>
          <p className="text-[10px] text-muted-foreground">Full coaching narrative for your tier</p>
        </div>
      </div>

      <p
        className="text-sm text-foreground leading-relaxed"
        style={{ color: analysis.color.text }}
      >
        {fullNarrative}
      </p>
    </Card>
  );
}
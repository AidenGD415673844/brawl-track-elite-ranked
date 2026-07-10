import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { FlaskConical, ArrowRight } from "lucide-react";
import { simulateWinShare } from "@/lib/rankUp";
import RankBadge from "@/components/RankBadge";
import { TIER_COLORS, getRank } from "@/lib/ranks";

export default function RankUpSimulator({ player, battleLog }) {
  const [wins, setWins] = useState(3);
  const [total, setTotal] = useState(5);

  const result = useMemo(
    () => simulateWinShare(player, wins, total, battleLog),
    [player, wins, total, battleLog]
  );
  const currentRank = getRank(player.currentElo);
  const cCur = TIER_COLORS[currentRank.tier];
  const cNew = TIER_COLORS[result.projectedRank.tier];
  const eloUp = result.eloChange >= 0;

  return (
    <Card className="bg-card border-border p-5 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center">
          <FlaskConical className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-display font-bold text-foreground">Rank-Up Simulator</h3>
          <p className="text-[10px] text-muted-foreground">
            Test a "what if I win X of the next Y" scenario
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Wins</span>
            <span className="font-display font-bold text-emerald-500">{wins}</span>
          </div>
          <Slider
            min={0}
            max={total}
            step={1}
            value={[wins]}
            onValueChange={(v) => setWins(v[0])}
          />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Next matches</span>
            <span className="font-display font-bold text-cyan-500">{total}</span>
          </div>
          <Slider
            min={1}
            max={20}
            step={1}
            value={[total]}
            onValueChange={(v) => {
              const nt = v[0];
              setTotal(nt);
              if (wins > nt) setWins(nt);
            }}
          />
        </div>
      </div>

      <motion.div
        key={`${wins}-${total}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-4 sm:gap-6 py-3"
      >
        <div className="flex flex-col items-center">
          <RankBadge elo={player.currentElo} size={64} />
          <p className="mt-1 text-[11px] font-bold" style={{ color: cCur.text }}>{currentRank.name}</p>
          <p className="text-[10px] text-muted-foreground">{player.currentElo.toLocaleString()} Elo</p>
        </div>
        <ArrowRight className="w-6 h-6 text-muted-foreground shrink-0" />
        <div className="flex flex-col items-center">
          <RankBadge elo={result.projectedElo} size={64} />
          <p className="mt-1 text-[11px] font-bold" style={{ color: cNew.text }}>{result.projectedRank.name}</p>
          <p className="text-[10px] text-muted-foreground">{result.projectedElo.toLocaleString()} Elo</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <Cell label="Per win" value={`+${result.winDelta}`} tone="text-emerald-500" />
        <Cell label="Per loss" value={`${result.lossDelta}`} tone="text-rose-500" />
        <Cell
          label="Net"
          value={`${eloUp ? "+" : ""}${result.eloChange}`}
          tone={eloUp ? "text-emerald-500" : "text-rose-500"}
        />
      </div>

      {result.rankChange !== 0 && (
        <p className="text-center text-xs mt-3 font-bold" style={{ color: eloUp ? cNew.text : cCur.text }}>
          {result.rankChange > 0 ? "▲" : "▼"} {Math.abs(result.rankChange)} sub-rank{Math.abs(result.rankChange) === 1 ? "" : "s"}
        </p>
      )}
    </Card>
  );
}

function Cell({ label, value, tone }) {
  return (
    <div className="rounded-lg bg-muted/40 border border-border py-1.5 text-center">
      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-xs font-display font-bold ${tone}`}>{value}</p>
    </div>
  );
}

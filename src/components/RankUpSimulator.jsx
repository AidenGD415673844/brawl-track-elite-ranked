import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { FlaskConical, ArrowRight, AlertTriangle } from "lucide-react";
import { simulateWinShare } from "@/lib/rankUp";
import RankBadge from "@/components/RankBadge";
import { TIER_COLORS, getRank } from "@/lib/ranks";

const FALLBACK_TIER = TIER_COLORS.Bronze;

class SimBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidUpdate(prev) {
    // Reset error when the underlying player changes (e.g. after New Season).
    if (prev.playerKey !== this.props.playerKey && this.state.err) {
      this.setState({ err: null });
    }
  }
  render() {
    if (this.state.err) {
      return (
        <Card className="bg-card border-border p-5 rounded-2xl">
          <div className="flex items-center gap-2 text-amber-500 text-xs">
            <AlertTriangle className="w-4 h-4" />
            Simulator temporarily unavailable — log a battle to refresh.
          </div>
        </Card>
      );
    }
    return this.props.children;
  }
}

function SimulatorInner({ player, battleLog }) {
  const [wins, setWins] = useState(3);
  const [total, setTotal] = useState(5);

  // Clamp wins whenever total shrinks or the player resets.
  useEffect(() => {
    if (wins > total) setWins(total);
  }, [total, wins]);
  useEffect(() => {
    // On player reset (New Season), snap sliders back to a safe default.
    setWins((w) => Math.min(w, 5));
    setTotal((t) => (t < 1 ? 5 : t));
  }, [player?.currentElo]);

  const result = useMemo(
    () => simulateWinShare(player, wins, total, battleLog),
    [player, wins, total, battleLog]
  );
  const safeCurrentElo = Number.isFinite(Number(player?.currentElo)) ? Number(player.currentElo) : 0;
  const currentRank = getRank(safeCurrentElo) || getRank(0);
  const cCur = TIER_COLORS[currentRank?.tier] || FALLBACK_TIER;
  const cNew = TIER_COLORS[result?.projectedRank?.tier] || FALLBACK_TIER;
  const eloUp = (result?.eloChange ?? 0) >= 0;

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
            value={[Math.min(wins, total)]}
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
        key={`${wins}-${total}-${safeCurrentElo}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-4 sm:gap-6 py-3"
      >
        <div className="flex flex-col items-center">
          <RankBadge elo={safeCurrentElo} size={64} />
          <p className="mt-1 text-[11px] font-bold" style={{ color: cCur.text }}>{currentRank?.name || "Bronze I"}</p>
          <p className="text-[10px] text-muted-foreground">{safeCurrentElo.toLocaleString()} Elo</p>
        </div>
        <ArrowRight className="w-6 h-6 text-muted-foreground shrink-0" />
        <div className="flex flex-col items-center">
          <RankBadge elo={result?.projectedElo ?? safeCurrentElo} size={64} />
          <p className="mt-1 text-[11px] font-bold" style={{ color: cNew.text }}>
            {result?.projectedRank?.name || "Bronze I"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {(result?.projectedElo ?? safeCurrentElo).toLocaleString()} Elo
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <Cell label="Per win" value={`+${result?.winDelta ?? 0}`} tone="text-emerald-500" />
        <Cell label="Per loss" value={`${result?.lossDelta ?? 0}`} tone="text-rose-500" />
        <Cell
          label="Net"
          value={`${eloUp ? "+" : ""}${result?.eloChange ?? 0}`}
          tone={eloUp ? "text-emerald-500" : "text-rose-500"}
        />
      </div>

      {(result?.rankChange ?? 0) !== 0 && (
        <p className="text-center text-xs mt-3 font-bold" style={{ color: eloUp ? cNew.text : cCur.text }}>
          {result.rankChange > 0 ? "▲" : "▼"} {Math.abs(result.rankChange)} sub-rank{Math.abs(result.rankChange) === 1 ? "" : "s"}
        </p>
      )}
    </Card>
  );
}

export default function RankUpSimulator({ player, battleLog }) {
  return (
    <SimBoundary playerKey={player?.currentElo}>
      <SimulatorInner player={player} battleLog={battleLog} />
    </SimBoundary>
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

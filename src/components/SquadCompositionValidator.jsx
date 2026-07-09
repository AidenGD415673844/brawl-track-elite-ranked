import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { getRank, getRankIndex, RANKS } from "@/lib/ranks";
import { getRankRestriction } from "@/lib/lobbyValidation";
import RankBadge from "@/components/RankBadge";

// SquadCompositionValidator — flags team compositions that violate
// the official Ranked team restriction policy.
// Restriction is based on the HIGHEST-ranked player in the party.
export default function SquadCompositionValidator({ player, squad }) {
  const validation = useMemo(() => {
    const playerElo = Number(player?.currentElo) || 0;
    if (playerElo <= 0) return { checks: [], allValid: true, maxGap: null };

    const playerIdx = getRankIndex(playerElo);
    const playerRank = getRank(playerElo);

    // Build squad list with Elos
    const squadWithElo = squad
      .map((mate, i) => ({ mate, i, elo: Number(mate.currentElo) || 0 }))
      .filter((s) => s.elo > 0);

    if (squadWithElo.length === 0)
      return { checks: [], allValid: true, maxGap: getRankRestriction(playerIdx), playerRank };

    // Find highest-ranked player in the entire party (player + squad)
    const allIndices = [playerIdx, ...squadWithElo.map((s) => getRankIndex(s.elo))];
    const highestIdx = Math.max(...allIndices);
    const gap = getRankRestriction(highestIdx);
    const highestRank = RANKS[highestIdx];
    const minAllowed = highestIdx - gap;
    const maxAllowed = highestIdx + gap;

    const checks = squadWithElo.map((s) => {
      const mateIdx = getRankIndex(s.elo);
      const mateRank = getRank(s.elo);
      const dist = Math.abs(mateIdx - highestIdx);
      return {
        idx: s.i,
        mateElo: s.elo,
        mateRank,
        gap: dist,
        valid: mateIdx >= minAllowed && mateIdx <= maxAllowed,
      };
    });

    const allValid = checks.every((c) => c.valid);
    return { checks, allValid, maxGap: gap, highestRank, playerRank };
  }, [player, squad]);

  if (validation.checks.length === 0) return null;

  const { allValid, maxGap, highestRank, playerRank, checks } = validation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
    >
      <Card
        className={`p-4 rounded-2xl border ${
          allValid
            ? "bg-emerald-500/5 border-emerald-500/30"
            : "bg-red-500/5 border-red-500/40"
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          {allValid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-red-500" />
          )}
          <h3 className="text-sm font-display font-semibold text-foreground">
            Team Restriction Check
          </h3>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-display font-bold ${
              allValid
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/20 text-red-600 dark:text-red-400"
            }`}
          >
            {allValid ? "COMPLIANT" : "VIOLATION"}
          </span>
        </div>

        <p className="text-[10px] text-muted-foreground mb-3">
          Highest rank: {highestRank.name} — teammates must be within ±{maxGap} sub-rank{maxGap !== 1 ? "s" : ""}.
        </p>

        <div className="space-y-2">
          {checks.map((c) =>
            c.skipped ? null : (
              <div
                key={c.idx}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${
                  c.valid ? "bg-emerald-500/5" : "bg-red-500/10"
                }`}
              >
                <RankBadge elo={c.mateElo} size={28} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">
                    Teammate {c.idx + 1} · {c.mateRank.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {c.mateElo.toLocaleString()} Elo · {c.gap} sub-rank{c.gap !== 1 ? "s" : ""} from highest
                  </p>
                </div>
                {c.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                )}
              </div>
            )
          )}
        </div>

        {!allValid && (
          <p className="text-[10px] text-red-500 mt-3 leading-relaxed">
            This composition cannot queue together in Ranked. The gap exceeds the ±{maxGap} rank limit for {highestRank.name}.
          </p>
        )}
      </Card>
    </motion.div>
  );
}
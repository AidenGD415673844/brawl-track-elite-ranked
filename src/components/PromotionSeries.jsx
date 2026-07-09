import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ChevronsUp, Check, X } from "lucide-react";
import { getRank, getRankIndex, RANKS, TIER_COLORS } from "@/lib/ranks";
import RankBadge from "@/components/RankBadge";

// Promotion Series — shown only while sitting in the top sub-rank (III) of a
// tier, i.e. one step from a new major tier. Tracks recent same-band form as a
// pip row and the Elo gap to promotion. Pure presentation over the battle log.
export default function PromotionSeries({ player, battleLog = [] }) {
  const currentElo = Number(player?.currentElo) || 0;
  const rank = getRank(currentElo);
  const idx = getRankIndex(currentElo);
  const nextRank = RANKS[idx + 1];

  const inPromoWindow = rank.roman === "III" && !!nextRank;

  const { pips, eloToPromote, progress, oneWinAway } = useMemo(() => {
    if (!inPromoWindow) return { pips: [], eloToPromote: 0, progress: 0, oneWinAway: false };
    const band = (battleLog || [])
      .filter((e) => !e.manual && (e.result === "victory" || e.result === "defeat" || e.result === "draw"))
      .filter((e) => {
        const eloRef = Number(e.eloAfter);
        return eloRef >= rank.min && eloRef <= rank.max;
      })
      .slice(0, 6)
      .reverse();
    const span = rank.max - rank.min || 1;
    const gap = Math.max(1, nextRank.min - currentElo);
    return {
      pips: band,
      eloToPromote: gap,
      progress: Math.min(1, Math.max(0, (currentElo - rank.min) / span)),
      oneWinAway: gap <= 45,
    };
  }, [inPromoWindow, battleLog, rank.min, rank.max, nextRank, currentElo]);

  if (!inPromoWindow) return null;

  const c = TIER_COLORS[nextRank.tier];

  return (
    <Card
      className="p-4 rounded-2xl border relative overflow-hidden"
      style={{
        borderColor: `${c.from}44`,
        background: `linear-gradient(135deg, ${c.from}12, transparent 70%)`,
      }}
    >
      {oneWinAway && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0.15 }}
          animate={{ opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          style={{ boxShadow: `inset 0 0 40px ${c.glow}` }}
        />
      )}

      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ChevronsUp className="w-5 h-5" style={{ color: c.text }} />
          <div>
            <h3 className="text-sm font-display font-bold text-foreground">Promotion Series</h3>
            <p className="text-[10px] text-muted-foreground">
              {oneWinAway ? "One win from promotion!" : `Push to ${nextRank.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <RankBadge elo={currentElo} size={30} />
          <ChevronsUp className="w-3.5 h-3.5 text-muted-foreground" />
          <RankBadge elo={nextRank.min} size={30} />
        </div>
      </div>

      {/* Recent same-band form */}
      <div className="relative flex items-center gap-1.5 mb-3">
        <span className="text-[9px] uppercase text-muted-foreground font-display mr-1">Form</span>
        {pips.length === 0 && (
          <span className="text-[10px] text-muted-foreground/70 italic">No games at this rank yet</span>
        )}
        {pips.map((e, i) => {
          const win = e.result === "victory";
          const draw = e.result === "draw";
          return (
            <motion.div
              key={e.id || i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 300 }}
              className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                win
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                  : draw
                  ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400"
                  : "bg-red-500/20 border-red-500/50 text-red-400"
              }`}
            >
              {win ? <Check className="w-3.5 h-3.5" /> : draw ? <span className="text-[9px] font-bold">D</span> : <X className="w-3.5 h-3.5" />}
            </motion.div>
          );
        })}
      </div>

      {/* Progress to promotion */}
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] uppercase text-muted-foreground font-display">Progress in {rank.name}</span>
          <span className="text-[10px] font-bold" style={{ color: c.text }}>
            {eloToPromote.toLocaleString()} Elo to go
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${c.from}, ${c.to})` }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(progress * 100)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>
    </Card>
  );
}

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRank, TIER_COLORS } from "@/lib/ranks";
import { computeParticipantTransitions } from "@/lib/battleLog";
import { computeFairness, computeWhatIf } from "@/lib/matchAnalysis";
import RankBadge from "@/components/RankBadge";
import AnimatedCounter from "@/components/AnimatedCounter";
import { Clock, Sliders, Trash2, Star, Pencil, FlaskConical, BarChart3, Trophy, Gauge, Swords, Shield, Flame } from "lucide-react";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function eloTransition(beforeElo, afterElo) {
  return `${Math.round(beforeElo).toLocaleString()} → ${Math.round(afterElo).toLocaleString()}`;
}

const FAIRNESS_COLORS = {
  emerald: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  orange: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  red: "bg-red-500/15 text-red-500 border-red-500/30",
  cyan: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
  slate: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  amber: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  blue: "bg-blue-500/15 text-blue-500 border-blue-500/30",
};

const PERF_LABELS = {
  gems: "Gems",
  damage: "Safe Dmg",
  control: "Ctrl %",
  goals: "Goals",
  stars: "Stars",
  kos: "KOs",
};

function TeamMember({ label, elo, beforeElo, afterElo, brawler, isStar, isYou, playerElo }) {
  const rank = getRank(elo);
  const c = TIER_COLORS[rank.tier];
  const gap = isYou ? 0 : Math.round(elo - playerElo);

  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[44px]">
      <div className={`relative ${isYou ? "ring-2 ring-cyan-400 rounded-lg" : ""}`}>
        <RankBadge elo={elo} size={36} />
        {isStar && (
          <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
            <Star className="w-2.5 h-2.5 text-white fill-white" />
          </div>
        )}
      </div>
      <span className={`text-[8px] font-display font-bold ${isYou ? "text-cyan-400" : "text-muted-foreground"}`}>
        {label}
      </span>
      <span className="text-[7px] font-bold leading-tight" style={{ color: c.text }}>
        {rank.name}
      </span>
      {brawler && (
        <span className="text-[7px] text-foreground/50 max-w-[44px] truncate text-center">
          {brawler}
        </span>
      )}
      {!isYou && gap !== 0 && (
        <span className={`text-[7px] font-bold leading-tight ${gap > 0 ? "text-orange-500/80" : "text-cyan-500/80"}`}>
          {gap > 0 ? "+" : ""}{gap} vs you
        </span>
      )}
      {beforeElo !== undefined && afterElo !== undefined && (
        <span className={`text-[7px] font-bold leading-tight max-w-[64px] text-center ${isYou ? "text-cyan-400" : "text-muted-foreground"}`}>
          {eloTransition(beforeElo, afterElo)}
        </span>
      )}
    </div>
  );
}

export default function BattleLogCard({ entry, onDelete, onEdit, streakCount = 0 }) {
  const [showWhatIf, setShowWhatIf] = useState(false);

  // Manual adjustment entry
  if (entry.manual) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-600/10 to-blue-600/5 p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-display text-sm font-bold text-foreground">Manual Adjustment</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(entry.timestamp)}
            </span>
            {onDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-muted-foreground hover:text-red-500 transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2">
          <span className="text-[10px] text-muted-foreground">{entry.eloAfter.toLocaleString()} Elo</span>
          <span className={`font-display text-base font-bold ${entry.delta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {entry.delta > 0 ? "+" : ""}{entry.delta}
          </span>
        </div>
      </motion.div>
    );
  }

  const isWin = entry.result === "victory";
  const isDraw = entry.result === "draw";
  const flameCount = isWin && streakCount >= 2 ? Math.min(5, streakCount) : 0;
  const transitions = computeParticipantTransitions(entry);
  const fairness = computeFairness(entry);
  const whatIf = showWhatIf ? computeWhatIf(entry) : null;

  const brawlers = entry.brawlers || {
    self: entry.brawler || null,
    mate1: null, mate2: null,
    enemy1: null, enemy2: null, enemy3: null,
  };
  const starKey = entry.starPlayer === true ? "self" : entry.starPlayer;

  // Performance heatmap data
  const perf = entry.performance;
  const hasPerf = perf && Object.keys(perf).length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl border p-4 ${
        isWin
          ? "bg-gradient-to-br from-purple-600/15 to-cyan-600/10 border-purple-500/20"
          : isDraw
          ? "bg-gradient-to-br from-yellow-600/10 to-amber-600/5 border-yellow-500/20"
          : "bg-gradient-to-br from-red-900/15 to-purple-900/10 border-red-500/20"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display text-sm font-bold text-foreground">{entry.mode}</span>
          {entry.queueType && entry.queueType !== "solo" && (
            <span className={`text-[8px] px-1.5 py-0.5 rounded font-display font-bold ${
              entry.queueType === "duo" ? "bg-purple-500/20 text-purple-400" : "bg-pink-500/20 text-pink-400"
            }`}>
              {entry.queueType.toUpperCase()}
            </span>
          )}
          {fairness.label && (
            <span className={`text-[8px] px-1.5 py-0.5 rounded border font-display font-bold ${FAIRNESS_COLORS[fairness.color] || FAIRNESS_COLORS.slate}`}>
              {fairness.label}
              {fairness.diff !== 0 && ` (${fairness.diff > 0 ? "+" : ""}${fairness.diff})`}
            </span>
          )}
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-foreground/10 text-foreground/60 font-display font-bold">
            RANKED
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo(entry.timestamp)}
          </span>
          {onEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(entry); }} className="text-muted-foreground hover:text-cyan-500 transition">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-muted-foreground hover:text-red-500 transition">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Victory / Defeat / Draw */}
      <div className="text-center mb-3">
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className={`font-display text-xl tracking-wide ${
            isWin ? "text-emerald-500" : isDraw ? "text-yellow-500" : "text-red-500"
          }`}
        >
          {isWin ? "VICTORY" : isDraw ? "DRAW" : "DEFEAT"}
        </motion.span>
        {flameCount > 0 && (
          <div className="mt-1 flex items-center justify-center gap-0.5">
            {Array.from({ length: flameCount }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, y: 6, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.07, type: "spring", stiffness: 320 }}
              >
                <Flame
                  className="w-3.5 h-3.5 text-orange-500 fill-orange-500/40"
                  style={{ filter: "drop-shadow(0 0 4px rgba(249,115,22,0.6))" }}
                />
              </motion.span>
            ))}
            <span className="ml-1 text-[9px] font-display font-bold text-orange-500">
              {streakCount} WIN STREAK
            </span>
          </div>
        )}
      </div>

      {/* Team display */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[8px] font-display font-bold text-cyan-400 uppercase tracking-wider">◀ Your Team</span>
          <div className="flex gap-1.5">
            <TeamMember
              label="YOU"
              elo={entry.playerElo}
              beforeElo={transitions.self.before}
              afterElo={transitions.self.after}
              brawler={brawlers.self}
              isStar={starKey === "self"}
              isYou
              playerElo={entry.playerElo}
            />
            {entry.teammateElos.map((elo, i) => (
              <TeamMember
                key={i}
                label={`M${i + 1}`}
                elo={elo}
                beforeElo={transitions.mates[i]?.before}
                afterElo={transitions.mates[i]?.after}
                brawler={brawlers[`mate${i + 1}`]}
                isStar={starKey === `mate${i + 1}`}
                playerElo={entry.playerElo}
              />
            ))}
          </div>
        </div>

        <div className="px-1.5 py-0.5 rounded-md bg-foreground text-background font-display text-[10px] font-bold">
          VS
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-[8px] font-display font-bold text-red-400 uppercase tracking-wider">Enemy Team ▶</span>
          <div className="flex gap-1.5">
            {entry.enemyElos.map((elo, i) => (
              <TeamMember
                key={i}
                label={`E${i + 1}`}
                elo={elo}
                beforeElo={transitions.enemies[i]?.before}
                afterElo={transitions.enemies[i]?.after}
                brawler={brawlers[`enemy${i + 1}`]}
                isStar={starKey === `enemy${i + 1}`}
                playerElo={entry.playerElo}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Team vs Enemy averages summary */}
      {(() => {
        const teamElos = [entry.playerElo, ...(entry.teammateElos || [])].map(Number).filter((e) => e > 0);
        const enemyElos = (entry.enemyElos || []).map(Number).filter((e) => e > 0);
        if (teamElos.length === 0 || enemyElos.length === 0) return null;
        const teamAvg = Math.round(teamElos.reduce((a, b) => a + b, 0) / teamElos.length);
        const enemyAvg = Math.round(enemyElos.reduce((a, b) => a + b, 0) / enemyElos.length);
        const gap = teamAvg - enemyAvg;
        const teamRank = getRank(teamAvg);
        const enemyRank = getRank(enemyAvg);
        const tc = TIER_COLORS[teamRank.tier];
        const ec = TIER_COLORS[enemyRank.tier];
        return (
          <div className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-muted/40 px-3 py-1.5 flex-wrap">
            <Shield className="w-3 h-3 text-cyan-400" />
            <span className="text-[9px] text-muted-foreground">Team</span>
            <span className="text-[10px] font-bold" style={{ color: tc.text }}>{teamAvg.toLocaleString()}</span>
            <span className="text-[8px] text-muted-foreground/60">{teamRank.name}</span>
            <span className="text-[9px] text-muted-foreground mx-1">vs</span>
            <span className="text-[10px] font-bold" style={{ color: ec.text }}>{enemyAvg.toLocaleString()}</span>
            <span className="text-[8px] text-muted-foreground/60">{enemyRank.name}</span>
            <span className="text-[9px] text-muted-foreground">Enemy</span>
            <Swords className="w-3 h-3 text-red-400" />
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${gap > 0 ? "bg-emerald-500/15 text-emerald-500" : gap < 0 ? "bg-red-500/15 text-red-500" : "bg-muted text-muted-foreground"}`}>
              {gap > 0 ? "+" : ""}{gap}
            </span>
          </div>
        );
      })()}

      {/* Teammate Stats Badges — peak Elo, skill level, Elo contribution */}
      {entry.teammateProfiles && entry.teammateProfiles.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          {entry.teammateProfiles.map((profile, i) => {
            if (!profile) return null;
            const mateElo = entry.teammateElos[i];
            const transition = transitions.mates[i];
            const contribution = transition ? transition.after - transition.before : 0;
            const peak = Number(profile.highestElo) || 0;
            const skill = Number(profile.skill) || 0;
            if (peak === 0 && skill === 0 && contribution === 0) return null;
            return (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-lg bg-muted/60 border border-border px-2 py-1"
              >
                <span className="text-[8px] font-display font-bold text-purple-400">M{i + 1}</span>
                {peak > 0 && (
                  <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                    <Trophy className="w-2.5 h-2.5 text-amber-500" />
                    <span className="font-bold text-foreground">{peak.toLocaleString()}</span>
                  </span>
                )}
                {skill > 0 && (
                  <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                    <Gauge className="w-2.5 h-2.5 text-cyan-500" />
                    <span className="font-bold text-foreground">{skill}/10</span>
                  </span>
                )}
                {transition && (
                  <span className={`text-[9px] font-bold ${contribution >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {contribution > 0 ? "+" : ""}{contribution} Elo
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Performance heatmap */}
      {hasPerf && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <BarChart3 className="w-3 h-3 text-muted-foreground" />
          {Object.entries(perf).map(([key, val]) => (
            <span key={key} className="text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded">
              {PERF_LABELS[key] || key}: <span className="text-cyan-400">{val}</span>
            </span>
          ))}
        </div>
      )}

      {/* Delta + What-if toggle */}
      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{entry.eloAfter.toLocaleString()} Elo</span>
          <button
            onClick={(e) => { e.stopPropagation(); setShowWhatIf(!showWhatIf); }}
            className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-fuchsia-400 transition"
            title="What if the result was flipped?"
          >
            <FlaskConical className="w-3 h-3" />
            What-If
          </button>
        </div>
        <motion.span
          key={entry.delta}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 14 }}
          className={`font-display text-base font-bold ${isWin ? "text-emerald-500" : isDraw ? "text-yellow-500" : "text-red-500"}`}
        >
          <AnimatedCounter value={entry.delta} showSign />
        </motion.span>
      </div>

      {/* What-if simulation */}
      <AnimatePresence>
        {showWhatIf && whatIf && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 p-2.5">
              <p className="text-[9px] font-bold text-fuchsia-400 mb-1">
                If result was {whatIf.flippedResult.toUpperCase()}:
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Elo would be: <span className="font-bold text-foreground">{whatIf.eloAfter.toLocaleString()}</span>
                </span>
                <span className={`text-[10px] font-bold ${whatIf.delta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {whatIf.delta > 0 ? "+" : ""}{whatIf.delta}
                </span>
              </div>
              <p className="text-[9px] text-muted-foreground mt-1">
                Actual: {entry.eloAfter.toLocaleString()} ({entry.delta > 0 ? "+" : ""}{entry.delta}) ·
                Difference: {whatIf.eloAfter - entry.eloAfter > 0 ? "+" : ""}{whatIf.eloAfter - entry.eloAfter} Elo
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
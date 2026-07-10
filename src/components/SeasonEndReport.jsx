import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Gamepad2, Target, Share2, Archive } from "lucide-react";
import { getRank, TIER_COLORS } from "@/lib/ranks";
import { TIER_BG, TIER_DECOR } from "@/lib/battleCards";
import { computeSeasonReset } from "@/lib/seasonReset";
import { SUB_RANK_DESCRIPTIONS } from "@/lib/subRankDescriptions";
import TierSparkles from "@/components/TierSparkles";
import RankSceneBackground from "@/components/RankSceneBackground";
import SeasonTimeline from "@/components/SeasonTimeline";
import SeasonBrawlerHighlight from "@/components/SeasonBrawlerHighlight";
import { computeSeasonStory } from "@/lib/seasonStory";
import { playCardSFX } from "@/lib/cardSfx";
import { computeSeasonBadges, computeSeasonDiff, savePriorSeason } from "@/lib/seasonBadges";
import { generateSeasonShareCard } from "@/lib/shareCard";

// Season End Report — full-screen overlay with curtain reveal,
// rank badge animation, stat grid, and Lilita One typography.
export default function SeasonEndReport({ player, battleLog, onClose }) {
  const [phase, setPhase] = useState(0);

  // Current season only — NOT all-time highestElo
  const peakElo = Math.max(
    player.currentSeasonHighest || 0,
    player.currentElo || 0
  );
  const peakRank = getRank(peakElo);
  const c = TIER_COLORS[peakRank.tier];
  const resetInfo = computeSeasonReset(peakElo);

  // Filter to current season only (using seasonStartDate if available)
  const seasonStart = player.seasonStartDate ? new Date(player.seasonStartDate) : null;
  const realLog = (battleLog || []).filter((e) => {
    if (e.manual) return false;
    if (!seasonStart) return true;
    return new Date(e.timestamp) >= seasonStart;
  });
  const wins = realLog.filter((e) => e.result === "victory").length;
  const losses = realLog.filter((e) => e.result === "defeat").length;
  const draws = realLog.filter((e) => e.result === "draw").length;
  const seasonGames = realLog.length;
  const seasonWinRate = seasonGames > 0 ? Math.round((wins / seasonGames) * 100) : 0;
  const funny = SUB_RANK_DESCRIPTIONS[peakRank.name]?.funny || "";
  const story = computeSeasonStory(realLog);
  const badges = useMemo(() => computeSeasonBadges(player, realLog), [player, realLog]);
  const compare = useMemo(() => computeSeasonDiff(player, realLog), [player, realLog]);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      await generateSeasonShareCard({
        peakRank, peakElo, wins, losses, games: seasonGames, winRate: seasonWinRate, badges,
      });
    } finally { setSharing(false); }
  };

  const handleArchive = () => {
    savePriorSeason(player, realLog);
  };

  useEffect(() => {
    const timers = [
      setTimeout(() => {
        setPhase(1);
        playCardSFX(peakRank.tier);
      }, 900),
      setTimeout(() => setPhase(2), 1700),
      setTimeout(() => setPhase(3), 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [peakRank.tier]);

  const stats = [
    { icon: Trophy, label: "Peak Rank", value: peakRank.name },
    { icon: TrendingUp, label: "Peak Elo", value: peakElo.toLocaleString() },
    { icon: Gamepad2, label: "Season Games", value: String(seasonGames) },
    { icon: Target, label: "Season Win Rate", value: `${seasonWinRate}%` },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Cinematic tier-themed background — fixed so it stays during scroll */}
        <div className="fixed inset-0">
          <RankSceneBackground tier={peakRank.tier} color={c} />
        </div>

        {/* Sparkles */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <TierSparkles tier={peakRank.tier} color={c} delay={0.5} />
        </div>

        {/* Curtain panels */}
        <motion.div
          className="fixed left-0 top-0 bottom-0 w-1/2 z-20"
          initial={{ x: 0 }}
          animate={{ x: "-100%" }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          style={{ background: `linear-gradient(90deg, ${c.from}cc, ${c.from}33)` }}
        />
        <motion.div
          className="fixed right-0 top-0 bottom-0 w-1/2 z-20"
          initial={{ x: 0 }}
          animate={{ x: "100%" }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          style={{ background: `linear-gradient(270deg, ${c.from}cc, ${c.from}33)` }}
        />

        {/* Content — scrollable, centered when it fits */}
        <div className="relative z-30 min-h-screen flex flex-col items-center justify-center py-10 px-6">
          <div className="flex flex-col items-center max-w-2xl w-full">
            {/* Title */}
            <motion.h1
              className="font-display text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -20 }}
              transition={{ duration: 0.5 }}
              style={{
                fontSize: "2rem",
                color: c.text,
                textShadow: `0 0 20px ${c.glow}`,
                letterSpacing: "0.05em",
              }}
            >
              SEASON COMPLETE
            </motion.h1>

            {/* Season Battle Card */}
            <motion.div
              className="my-6"
              initial={{ scale: 0, opacity: 0, rotateY: -45 }}
              animate={{
                scale: phase >= 1 ? [0, 1.15, 1] : 0,
                opacity: phase >= 1 ? 1 : 0,
                rotateY: phase >= 1 ? 0 : -45,
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ perspective: 1000 }}
            >
              <div
                className="rounded-xl overflow-hidden relative"
                style={{
                  width: 170,
                  height: 227,
                  border: `3px solid ${c.text}`,
                  background: `${TIER_DECOR[peakRank.tier]}, ${TIER_BG[peakRank.tier]}`,
                  boxShadow: `0 0 40px ${c.glow}, 0 10px 30px rgba(0,0,0,0.5)`,
                }}
              >
                {/* Stars */}
                <div className="absolute top-2 left-0 right-0 flex justify-center gap-0.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <svg key={i} width={10} height={10} viewBox="0 0 24 24" fill={c.text}>
                      <path d="M12,2 L14.5,9 L22,9.5 L16,14.5 L18,22 L12,17.5 L6,22 L8,14.5 L2,9.5 L9.5,9 Z" />
                    </svg>
                  ))}
                </div>
                {/* Rank image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={peakRank.image}
                    alt={peakRank.name}
                    style={{
                      width: 100,
                      height: 100,
                      objectFit: "contain",
                      filter: `drop-shadow(0 0 15px ${c.glow})`,
                    }}
                  />
                </div>
                {/* Tier name */}
                <div
                  className="absolute bottom-0 left-0 right-0 py-2 text-center"
                  style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.8), transparent)" }}
                >
                  <p className="font-display text-sm font-bold" style={{ color: c.text }}>
                    {peakRank.tier.toUpperCase()}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Rank name */}
            <motion.p
              className="font-display text-center"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: phase >= 1 ? 1 : 0, x: phase >= 1 ? 0 : -100 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              style={{
                fontSize: "1.75rem",
                color: c.text,
                textShadow: `0 0 15px ${c.glow}`,
              }}
            >
              {peakRank.name.toUpperCase()}
            </motion.p>

            {/* Elo */}
            <motion.p
              className="text-sm font-bold text-white/60 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase >= 1 ? 1 : 0 }}
              transition={{ delay: 0.5 }}
            >
              {peakElo.toLocaleString()} Peak Elo
            </motion.p>

            {/* Stats grid */}
            {phase >= 2 && (
              <motion.div
                className="grid grid-cols-2 gap-3 w-full mb-4"
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
              >
                {stats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={i}
                      className="rounded-xl border p-3 text-center"
                      style={{ background: `${c.from}15`, borderColor: `${c.from}33` }}
                      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: c.text }} />
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">{stat.label}</p>
                      <p className="text-sm font-display font-bold" style={{ color: c.text }}>{stat.value}</p>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Win/Loss record */}
            {phase >= 2 && (
              <motion.div
                className="flex gap-6 mb-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div>
                  <p className="text-xs text-muted-foreground">Wins</p>
                  <p className="font-display text-xl text-emerald-500">{wins}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Losses</p>
                  <p className="font-display text-xl text-red-500">{losses}</p>
                </div>
                {draws > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Draws</p>
                    <p className="font-display text-xl text-slate-400">{draws}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Brawler MVP highlight */}
            {phase >= 3 && story.hasData && (
              <motion.div
                className="w-full mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <SeasonBrawlerHighlight story={story} color={c} />
              </motion.div>
            )}

            {/* Elo journey timeline scrubber */}
            {phase >= 3 && story.hasData && story.eloPoints.length > 1 && (
              <motion.div
                className="w-full rounded-xl border p-3 mb-4"
                style={{ background: `${c.from}10`, borderColor: `${c.from}33` }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <SeasonTimeline story={story} color={c} />
              </motion.div>
            )}

            {/* Season fun-fact commentary */}
            {phase >= 3 && story.hasData && (
              <motion.div
                className="w-full rounded-xl border p-3 mb-4 space-y-1.5"
                style={{ background: `${c.from}10`, borderColor: `${c.from}33` }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <p className="text-xs font-bold text-foreground mb-1">Season Highlights</p>
                {story.bestStreak > 1 && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    🔥 Best win streak: <span className="font-bold" style={{ color: c.text }}>{story.bestStreak} wins</span> in a row
                  </p>
                )}
                {story.bestMode && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    🎯 Strongest mode: <span className="font-bold" style={{ color: c.text }}>{story.bestMode}</span> ({story.bestModeWR}% over {story.bestModeGames} games)
                  </p>
                )}
                {story.breakthrough && story.breakthrough.delta > 0 && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    ⚡ Biggest breakthrough: <span className="font-bold text-emerald-400">+{story.breakthrough.delta} Elo</span>
                    {story.breakthrough.brawler ? ` with ${story.breakthrough.brawler}` : ""}
                    {story.breakthrough.mode ? ` in ${story.breakthrough.mode}` : ""}
                  </p>
                )}
                {story.stumble && story.stumble.delta < 0 && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    💔 Toughest loss: <span className="font-bold text-red-400">{story.stumble.delta} Elo</span>
                    {story.stumble.brawler ? ` as ${story.stumble.brawler}` : ""}
                  </p>
                )}
              </motion.div>
            )}

            {/* Funny summary */}
            {phase >= 3 && funny && (
              <motion.div
                className="w-full rounded-xl border p-3 mb-4"
                style={{ background: `${c.from}10`, borderColor: `${c.from}33` }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-xs font-bold text-foreground mb-1">Season Summary</p>
                <p className="text-xs text-muted-foreground italic leading-relaxed">"{funny}"</p>
              </motion.div>
            )}

            {/* Badges */}
            {phase >= 3 && badges.length > 0 && (
              <motion.div
                className="w-full rounded-xl border p-3 mb-4"
                style={{ background: `${c.from}10`, borderColor: `${c.from}33` }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-xs font-bold text-foreground mb-2">Badges Earned ({badges.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {badges.map((b) => (
                    <div key={b.id}
                      title={b.desc}
                      className="rounded-lg border px-2 py-1 text-[11px] flex items-center gap-1"
                      style={{ background: `${c.from}22`, borderColor: `${c.from}55`, color: c.text }}>
                      <span>{b.emoji}</span><span className="font-bold">{b.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Prior season comparison */}
            {phase >= 3 && compare.prior && (
              <motion.div
                className="w-full rounded-xl border p-3 mb-4"
                style={{ background: `${c.from}10`, borderColor: `${c.from}33` }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-xs font-bold text-foreground mb-2">vs. Previous Season</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <Diff label="Peak" value={compare.diff.peakElo} />
                  <Diff label="WR" value={compare.diff.winRate} suffix="%" />
                  <Diff label="Games" value={compare.diff.games} />
                  <Diff label="Streak" value={compare.diff.bestStreak} />
                </div>
              </motion.div>
            )}

            {/* Reset info */}
            {phase >= 3 && (
              <motion.div
                className="text-center mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-xs text-muted-foreground">
                  Next Season Start:{" "}
                  <span className="font-bold font-display" style={{ color: c.text }}>{resetInfo.resetLabel}</span>
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  ({resetInfo.newElo.toLocaleString()} Elo)
                </p>
              </motion.div>
            )}

            {/* Continue button */}
            {phase >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-4 flex flex-wrap gap-2 justify-center"
              >
                <Button
                  onClick={handleShare}
                  disabled={sharing}
                  variant="outline"
                  className="rounded-xl px-4 font-display tracking-wide gap-2"
                  style={{ borderColor: `${c.text}55`, color: c.text }}
                >
                  <Share2 className="w-4 h-4" />
                  {sharing ? "Rendering…" : "Share Card"}
                </Button>
                <Button
                  onClick={handleArchive}
                  variant="outline"
                  className="rounded-xl px-4 font-display tracking-wide gap-2"
                  style={{ borderColor: `${c.text}55`, color: c.text }}
                >
                  <Archive className="w-4 h-4" />
                  Archive Season
                </Button>
                <Button
                  onClick={onClose}
                  className="rounded-xl px-8 font-display tracking-wide"
                  style={{
                    background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                    color: "#fff",
                    border: `1px solid ${c.text}44`,
                  }}
                >
                  Continue
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Diff({ label, value, suffix = "" }) {
  const positive = value > 0;
  const zero = value === 0;
  const tone = zero ? "text-muted-foreground" : positive ? "text-emerald-500" : "text-rose-500";
  const sign = positive ? "+" : "";
  return (
    <div className="rounded-lg bg-muted/30 border border-border py-1.5">
      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-xs font-display font-bold ${tone}`}>{zero ? "—" : `${sign}${value}${suffix}`}</p>
    </div>
  );
}
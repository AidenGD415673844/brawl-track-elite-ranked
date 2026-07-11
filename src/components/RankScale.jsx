import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { MAJOR_RANKS, RANKS, getRank, TIER_COLORS, tierProgress } from "@/lib/ranks";
import RankBadge from "@/components/RankBadge";
import { RankClickSplash } from "@/components/RankUpAnimation";
import { playScaleSFX } from "@/lib/sfx";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function RankScale({ elo, seasonHighest }) {
  const peakSeason = Math.max(Number(seasonHighest) || 0, Number(elo) || 0);
  const currentRank = getRank(elo);
  const currentMajorIdx = MAJOR_RANKS.findIndex(
    (r) => r.tier === currentRank.tier
  );
  const [viewIdx, setViewIdx] = useState(Math.max(0, currentMajorIdx));
  const [clickSplash, setClickSplash] = useState(null);

  const navigate = (dir) => {
    const next = Math.max(0, Math.min(MAJOR_RANKS.length - 1, viewIdx + dir));
    setViewIdx(next);
  };

  const handleDragEnd = (e, info) => {
    if (info.offset.x < -50) navigate(1);
    else if (info.offset.x > 50) navigate(-1);
  };

  const handleCardClick = () => {
    const rank = MAJOR_RANKS[viewIdx];
    setClickSplash(rank);
    playScaleSFX(rank.tier);
  };

  const visible = [
    viewIdx > 0 ? MAJOR_RANKS[viewIdx - 1] : null,
    MAJOR_RANKS[viewIdx],
    viewIdx < MAJOR_RANKS.length - 1 ? MAJOR_RANKS[viewIdx + 1] : null,
  ];

  const currentTier = MAJOR_RANKS[viewIdx].tier;
  const tierRanks = RANKS.filter((r) => r.tier === currentTier);
  const tierColors = TIER_COLORS[currentTier];

  // Tier mastery — progress through the entire tier
  const mastery = tierProgress(elo);
  const isCurrentTierView = currentTier === currentRank.tier;

  return (
    <Card className="bg-card border-border p-4 sm:p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display font-semibold text-foreground">Rank Progression</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            disabled={viewIdx === 0}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[10px] text-muted-foreground font-display px-2">
            {viewIdx + 1} / {MAJOR_RANKS.length}
          </span>
          <button
            onClick={() => navigate(1)}
            disabled={viewIdx === MAJOR_RANKS.length - 1}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Major-rank carousel */}
      <motion.div
        className="flex items-center justify-center gap-4 py-4 cursor-pointer select-none"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        onClick={handleCardClick}
      >
        {visible.map((rank, i) => {
          if (!rank) return <div key={`empty-${i}`} className="w-14 sm:w-16 shrink-0" />;
          const isCenter = i === 1;
          const isCurrentTier = rank.tier === currentRank.tier;
          const c = TIER_COLORS[rank.tier];
          // For the center tile: if it's the player's current tier, show their actual sub-rank icon;
          // otherwise show the tier's I sub-rank icon.
          const displayElo = isCenter && isCurrentTier ? elo : rank.min;
          return (
            <motion.div
              key={`major-${i}`}
              className="flex flex-col items-center"
              animate={{
                scale: isCenter ? 1.0 : 0.65,
                opacity: isCenter ? 1 : 0.5,
              }}
              transition={{ duration: 0.3 }}
              style={{ filter: isCenter ? `drop-shadow(0 0 20px ${c.glow})` : "none" }}
            >
              <RankBadge elo={displayElo} size={isCenter ? 80 : 56} />
              {isCenter && (
                <>
                  <p
                    className="mt-2 font-display text-lg font-bold"
                    style={{ color: c.text }}
                  >
                    {isCurrentTier ? currentRank.name : rank.tier}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {(isCurrentTier ? currentRank.min : rank.min).toLocaleString()}{isFinite(isCurrentTier ? currentRank.max : rank.max) ? ` – ${(isCurrentTier ? currentRank.max : rank.max).toLocaleString()}` : "+"} Elo
                  </p>
                  {isCurrentTier && (
                    <span className="mt-1 text-[9px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      YOUR TIER
                    </span>
                  )}
                </>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Tier Mastery bar — progress through the entire tier */}
      {isCurrentTierView && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase text-muted-foreground font-display">
              {currentTier} Mastery
            </span>
            <span className="text-[10px] font-bold" style={{ color: tierColors.text }}>
              {Math.round(mastery * 100)}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden relative">
            {/* Sub-rank tick marks (Diamond I / II / III boundaries etc.) */}
            {tierRanks.slice(1).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-white/20 z-[1]"
                style={{ left: `${((i + 1) / tierRanks.length) * 100}%` }}
              />
            ))}
            <motion.div
              className="h-full rounded-full relative overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${mastery * 100}%` }}
              transition={{ duration: 0.6 }}
              style={{ background: `linear-gradient(90deg, ${tierColors.from}, ${tierColors.to})` }}
            >
              <div className="absolute right-0 top-0 h-full w-1 bg-white/60 rounded-full" />
              {/* Shimmer sweep */}
              <div className="absolute inset-0 rank-shimmer" />
            </motion.div>
          </div>

        </div>
      )}

      {/* Segmented progress bar for current tier's sub-ranks */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase text-muted-foreground font-display">
            {currentTier} Sub-Ranks
          </span>
          <span className="text-[10px] font-bold" style={{ color: tierColors.text }}>
            {elo.toLocaleString()} Elo
          </span>
        </div>
        <div className="flex gap-1">
          {tierRanks.map((r) => {
            const span = isFinite(r.max) ? r.max - r.min : 1000;
            const pct = (v) => Math.min(100, Math.max(0, ((v - r.min) / span) * 100));
            const inBand = (v) => v >= r.min && (isFinite(r.max) ? v <= r.max : true);
            const isPassed = elo >= r.max;
            const isCurrent = inBand(elo);
            const progress = isPassed ? 100 : isCurrent ? pct(elo) : 0;
            // Ghost bar to season peak — extends past current only if peak > elo
            const peakPassed = peakSeason >= r.max;
            const peakInBand = inBand(peakSeason);
            const peakProgress = peakPassed ? 100 : peakInBand ? pct(peakSeason) : peakSeason > r.max ? 100 : 0;
            const showPeak = peakSeason > elo && peakProgress > progress;
            const c = TIER_COLORS[r.tier];
            return (
              <div key={r.name} className="flex-1">
                <div className="h-3 rounded-full bg-muted overflow-hidden relative">
                  {/* Transparent ghost bar — season highest */}
                  {showPeak && (
                    <motion.div
                      className="absolute inset-y-0 left-0 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${peakProgress}%` }}
                      transition={{ duration: 0.7 }}
                      style={{
                        background: `linear-gradient(90deg, ${c.from}55, ${c.to}66)`,
                        border: `1px dashed ${c.to}80`,
                      }}
                    />
                  )}
                  {/* Solid bar — current Elo */}
                  <motion.div
                    className="h-full rounded-full relative z-[1]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                    style={{ background: `linear-gradient(90deg, ${c.from}, ${c.to})` }}
                  />
                  {isCurrent && (
                    <div
                      className="absolute top-0 w-1 h-full bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.8)] z-[2]"
                      style={{ left: `calc(${progress}% - 2px)` }}
                    />
                  )}
                  {/* Peak marker */}
                  {showPeak && peakInBand && (
                    <div
                      className="absolute top-0 w-[2px] h-full rounded-full z-[3]"
                      style={{
                        left: `calc(${peakProgress}% - 1px)`,
                        background: c.text,
                        boxShadow: `0 0 6px ${c.glow}`,
                      }}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[9px] font-display font-bold ${isCurrent ? "" : "text-muted-foreground"}`} style={isCurrent ? { color: c.text } : {}}>
                    {r.roman}
                  </span>
                  <span className="text-[8px] text-muted-foreground">
                    {r.min.toLocaleString()}–{isFinite(r.max) ? r.max.toLocaleString() : "+"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {peakSeason > elo && (
          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded-sm" style={{ background: `linear-gradient(90deg, ${tierColors.from}, ${tierColors.to})` }} />
              <span>Now: {elo.toLocaleString()} Elo</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded-sm border" style={{ background: `${tierColors.from}55`, borderColor: `${tierColors.to}80`, borderStyle: "dashed" }} />
              <span>Season high: {peakSeason.toLocaleString()} Elo</span>
            </div>
            <span className="opacity-70">· {(peakSeason - elo).toLocaleString()} Elo to reclaim your peak</span>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground text-center">
        Swipe or use arrows to explore major ranks · Click the icon to replay its theme
      </p>

      {clickSplash && (
        <RankClickSplash rank={clickSplash} onComplete={() => setClickSplash(null)} />
      )}
    </Card>
  );
}
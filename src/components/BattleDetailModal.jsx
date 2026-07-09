import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MapPin, Swords, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { getRank, TIER_COLORS } from "@/lib/ranks";
import BrawlerPortrait from "@/components/BrawlerPortrait";

// Shows full battle details when a chart point is clicked.
export default function BattleDetailModal({ entry, onClose }) {
  if (!entry) return null;

  const isWin = entry.result === "victory";
  const rank = getRank(entry.eloAfter);
  const c = TIER_COLORS[rank.tier];

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="p-5 relative"
            style={{
              background: isWin
                ? "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(34,211,238,0.15))"
                : "linear-gradient(135deg, rgba(220,38,38,0.15), rgba(127,29,29,0.1))",
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              {entry.brawler && (
                <BrawlerPortrait
                  brawler={entry.brawler}
                  elo={entry.eloAfter}
                  size={56}
                  rankOverlaySize={22}
                  showElo={false}
                />
              )}
              <div>
                <p className="text-xs text-muted-foreground">{timeAgo(entry.timestamp)}</p>
                <p
                  className="text-xl font-display font-bold"
                  style={{ color: isWin ? "#10b981" : "#ef4444" }}
                >
                  {isWin ? "VICTORY" : "DEFEAT"}
                </p>
              </div>
              {entry.starPlayer && (
                <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-[10px] font-bold text-yellow-500">STAR PLAYER</span>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Battle info */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-muted/50 p-2 text-center">
                <Swords className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
                <p className="text-[10px] text-muted-foreground">Mode</p>
                <p className="text-xs font-bold text-foreground">{entry.mode}</p>
              </div>
              {entry.map && (
                <div className="rounded-xl bg-muted/50 p-2 text-center">
                  <MapPin className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-[10px] text-muted-foreground">Map</p>
                  <p className="text-xs font-bold text-foreground truncate">{entry.map}</p>
                </div>
              )}
              {entry.brawler && (
                <div className="rounded-xl bg-muted/50 p-2 text-center">
                  <Trophy className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-[10px] text-muted-foreground">Brawler</p>
                  <p className="text-xs font-bold text-foreground truncate">{entry.brawler}</p>
                </div>
              )}
            </div>

            {/* Elo change */}
            <div className="rounded-xl border border-border p-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Elo Change</p>
                <p className="text-lg font-display font-bold" style={{ color: isWin ? "#10b981" : "#ef4444" }}>
                  {entry.delta > 0 ? "+" : ""}{entry.delta}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase text-muted-foreground">Elo After</p>
                <p className="text-lg font-display font-bold text-foreground">
                  {entry.eloAfter.toLocaleString()}
                </p>
                <p className="text-[10px]" style={{ color: c.text }}>
                  {rank.name}
                </p>
              </div>
            </div>

            {/* Elo details */}
            {entry.eloDetails && typeof entry.eloDetails === "object" && (
              <div className="rounded-xl border border-border p-3 space-y-1.5">
                <p className="text-[10px] uppercase text-muted-foreground">Elo Breakdown</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base</span>
                    <span className="font-bold text-foreground">{entry.eloDetails.base}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Multiplier</span>
                    <span className="font-bold text-foreground">{entry.eloDetails.mult?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Team Avg</span>
                    <span className="font-bold text-foreground">{entry.eloDetails.teamAvg?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Enemy Avg</span>
                    <span className="font-bold text-foreground">{entry.eloDetails.enemyAvg?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Queue</span>
                    <span className="font-bold text-foreground capitalize">{entry.eloDetails.queueType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tier</span>
                    <span className="font-bold text-foreground">{entry.eloDetails.rankTier}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {entry.eloDetails.isUnderdog && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-500 font-bold">UNDERDOG</span>
                  )}
                  {entry.eloDetails.isFavored && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-500 font-bold">FAVORED</span>
                  )}
                  {entry.eloDetails.rankedBoost && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-bold">RANKED BOOST</span>
                  )}
                  {entry.eloDetails.seasonRefreshed && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-500 font-bold">SEASON REFRESH</span>
                  )}
                </div>
              </div>
            )}

            {/* Team display */}
            {entry.teammateElos && entry.teammateElos.length > 0 && (() => {
              const teamElos = [entry.playerElo, ...entry.teammateElos].map(Number).filter((e) => e > 0);
              const teamAvg = Math.round(teamElos.reduce((a, b) => a + b, 0) / teamElos.length);
              const teamRank = getRank(teamAvg);
              const tc = TIER_COLORS[teamRank.tier];
              return (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Your Team</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-muted-foreground">Avg</span>
                      <span className="text-[10px] font-bold" style={{ color: tc.text }}>{teamAvg.toLocaleString()}</span>
                      <span className="text-[8px] text-muted-foreground/60">{teamRank.name}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <BrawlerPortrait elo={entry.playerElo} brawler={entry.brawler} size={36} rankOverlaySize={16} />
                    {entry.teammateElos.map((elo, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <BrawlerPortrait elo={elo} brawler={null} size={36} rankOverlaySize={16} />
                        <span className="text-[7px] text-muted-foreground">
                          {elo - entry.playerElo > 0 ? "+" : ""}{elo - entry.playerElo}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {entry.enemyElos && entry.enemyElos.length > 0 && (() => {
              const enemyAvg = Math.round(entry.enemyElos.reduce((a, b) => a + b, 0) / entry.enemyElos.length);
              const enemyRank = getRank(enemyAvg);
              const ec = TIER_COLORS[enemyRank.tier];
              const gap = Math.round(entry.playerElo - enemyAvg);
              return (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Enemy Team</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-muted-foreground">Avg</span>
                      <span className="text-[10px] font-bold" style={{ color: ec.text }}>{enemyAvg.toLocaleString()}</span>
                      <span className="text-[8px] text-muted-foreground/60">{enemyRank.name}</span>
                      <span className={`text-[8px] font-bold px-1 rounded ${gap > 0 ? "bg-emerald-500/15 text-emerald-500" : gap < 0 ? "bg-red-500/15 text-red-500" : "bg-muted text-muted-foreground"}`}>
                        {gap > 0 ? "+" : ""}{gap}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {entry.enemyElos.map((elo, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <BrawlerPortrait elo={elo} brawler={null} size={36} rankOverlaySize={16} />
                        <span className={`text-[7px] ${elo - entry.playerElo > 0 ? "text-orange-500/80" : "text-cyan-500/80"}`}>
                          {elo - entry.playerElo > 0 ? "+" : ""}{elo - entry.playerElo}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { getRank, TIER_COLORS } from "@/lib/ranks";
import { History, ArrowUp, ArrowDown, Minus, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RankBadge from "@/components/RankBadge";

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl bg-muted/50 border border-border p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-display">{label}</p>
      <p className="text-lg font-display font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function PlayerHistory({ snapshots, player }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  const sorted = [...snapshots].sort((a, b) => new Date(b.date) - new Date(a.date));
  const recent = sorted.slice(0, 10);

  const chrono = [...snapshots].sort((a, b) => new Date(a.date) - new Date(b.date));
  const first = chrono[0];
  const peak = snapshots.length
    ? snapshots.reduce((a, b) => (b.currentElo > a.currentElo ? b : a))
    : null;

  const longTermDelta = first ? player.currentElo - first.currentElo : 0;
  const wins = chrono.filter((s, i) => i > 0 && s.currentElo >= chrono[i - 1].currentElo).length;
  const losses = Math.max(0, snapshots.length - 1 - wins);
  const lastSeasonDelta = player.currentElo - player.lastSeasonElo;

  return (
    <Card className="bg-card border-border p-5 rounded-2xl">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-cyan-500" />
        <h3 className="text-sm font-display font-semibold text-foreground">Player History</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat
          label="Peak Elo"
          value={peak ? peak.currentElo.toLocaleString() : player.highestElo.toLocaleString()}
          sub={getRank(peak ? peak.currentElo : player.highestElo).name}
        />
        <Stat
          label="Long-Term Climb"
          value={`${longTermDelta >= 0 ? "+" : ""}${longTermDelta}`}
          sub={first ? "since first snapshot" : "no history yet"}
        />
        <Stat label="Up / Down" value={`${wins} / ${losses}`} sub="snapshot trend" />
        <Stat
          label="vs Last Season"
          value={`${lastSeasonDelta >= 0 ? "+" : ""}${lastSeasonDelta}`}
          sub={`Last: ${player.lastSeasonElo.toLocaleString()}`}
        />
      </div>

      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-display">
        Recent Snapshots
      </p>
      {recent.length ? (
        <div className="space-y-1.5">
          {recent.map((s, i) => {
            const older = recent[i + 1];
            const delta = older ? s.currentElo - older.currentElo : 0;
            const Icon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
            const color =
              delta > 0 ? "text-emerald-500" : delta < 0 ? "text-red-500" : "text-muted-foreground";
            const isExpanded = expandedIdx === i;
            const rank = getRank(s.currentElo);

            return (
              <div
                key={i}
                className="rounded-lg bg-muted/40 border border-border overflow-hidden"
              >
                <button
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                  className="w-full flex items-center justify-between text-sm px-3 py-2 hover:bg-muted/60 transition"
                >
                  <div className="flex items-center gap-2">
                    <RankBadge elo={s.currentElo} size={24} />
                    <span className="text-foreground font-display font-semibold">{rank.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">
                      {new Date(s.date).toLocaleDateString()}
                    </span>
                    <span className={`flex items-center gap-1 font-display font-semibold ${color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {delta !== 0 ? Math.abs(delta) : "—"}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 pt-0">
                        <div className="text-center">
                          <p className="text-[9px] uppercase text-muted-foreground font-display">Elo</p>
                          <p className="text-sm font-display font-bold text-foreground">
                            {s.currentElo.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] uppercase text-muted-foreground font-display">Win Rate</p>
                          <p className="text-sm font-display font-bold text-foreground">
                            {s.winRate ?? "—"}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] uppercase text-muted-foreground font-display">Trophies</p>
                          <p className="text-sm font-display font-bold text-foreground">
                            {(s.trophies || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] uppercase text-muted-foreground font-display">Games</p>
                          <p className="text-sm font-display font-bold text-foreground">
                            {s.gamesPlayed ?? "—"}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Save snapshots to build your history.</p>
      )}
    </Card>
  );
}
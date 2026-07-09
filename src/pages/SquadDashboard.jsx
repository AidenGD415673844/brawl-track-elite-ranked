import React, { useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RankBadge from "@/components/RankBadge";
import { loadBattleLog, getWinStreak, computeParticipantTransitions } from "@/lib/battleLog";
import { loadPlayer } from "@/lib/playerStorage";
import { getRank, getRankIndex, TIER_COLORS } from "@/lib/ranks";
import { getSubrankLimits } from "@/lib/lobbyValidation";
import { useToast } from "@/components/ui/use-toast";
import { Users, Trophy, Gauge, TrendingUp, ChevronLeft, Award, Heart, Target, ShieldAlert } from "lucide-react";
import SquadCompositionValidator from "@/components/SquadCompositionValidator";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function SquadDashboard() {
  const player = loadPlayer();
  const battleLog = useMemo(() => loadBattleLog(), []);
  const { toast } = useToast();
  const violationNotifiedRef = useRef(false);

  // Extract teammate data from battle log entries with profiles
  const squadData = useMemo(() => {
    const teammates = new Map();

    battleLog
      .filter((e) => !e.manual && e.teammateProfiles?.length > 0)
      .forEach((entry) => {
        entry.teammateProfiles.forEach((profile, i) => {
          if (!profile) return;
          const mateElo = entry.teammateElos[i];
          if (!mateElo || mateElo <= 0) return;

          // Use highestElo as pseudo-ID, fallback to currentElo
          const id = Number(profile.highestElo) || mateElo;

          if (!teammates.has(id)) {
            teammates.set(id, {
              id,
              currentElo: mateElo,
              highestElo: Number(profile.highestElo) || mateElo,
              lastSeasonElo: Number(profile.lastSeasonElo) || 0,
              trophies: Number(profile.trophies) || 0,
              skill: Number(profile.skill) || 5,
              games: 0,
              wins: 0,
              losses: 0,
              draws: 0,
              totalContribution: 0,
              lastPlayed: entry.timestamp,
            });
          }

          const mate = teammates.get(id);
          mate.games++;
          mate.currentElo = mateElo; // update to most recent
          if (entry.result === "victory") mate.wins++;
          else if (entry.result === "defeat") mate.losses++;
          else mate.draws++;

          // Elo contribution for this teammate
          const transitions = computeParticipantTransitions(entry);
          if (transitions.mates && transitions.mates[i]) {
            mate.totalContribution += transitions.mates[i].after - transitions.mates[i].before;
          }

          // Update timestamp
          mate.lastPlayed = entry.timestamp;
        });
      });

    return Array.from(teammates.values()).sort((a, b) => b.games - a.games);
  }, [battleLog]);

  // Toast alert for rank-gap policy violations
  useEffect(() => {
    if (violationNotifiedRef.current || squadData.length === 0) return;

    const playerElo = Number(player?.currentElo) || 0;
    if (playerElo <= 0) return;

    const playerIdx = getRankIndex(playerElo);
    const limits = getSubrankLimits(playerIdx);
    const playerRank = getRank(playerElo);

    const violators = squadData.filter((mate) => {
      const mateIdx = getRankIndex(mate.currentElo);
      return mateIdx < limits.minIdx || mateIdx > limits.maxIdx;
    });

    if (violators.length > 0) {
      violationNotifiedRef.current = true;
      toast({
        title: "Squad Composition Violation",
        description: `${violators.length} teammate${violators.length > 1 ? "s" : ""} outside the allowed rank range for ${playerRank.name}. Check the validation panel below.`,
        variant: "destructive",
        duration: 6000,
      });
    }
  }, [squadData, player, toast]);

  // Overall squad stats
  const squadStats = useMemo(() => {
    if (squadData.length === 0) return null;

    const totalGames = squadData.reduce((s, t) => s + t.games, 0);
    const totalWins = squadData.reduce((s, t) => s + t.wins, 0);
    const avgElo = Math.round(
      squadData.reduce((s, t) => s + t.currentElo, 0) / squadData.length
    );
    const avgSkill = (
      squadData.reduce((s, t) => s + t.skill, 0) / squadData.length
    ).toFixed(1);
    const bestSynergy = squadData
      .filter((t) => t.games > 0)
      .sort((a, b) => (b.wins / b.games) - (a.wins / a.games))[0];

    return {
      totalMembers: squadData.length,
      totalGames,
      totalWins,
      winRate: totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0,
      avgElo,
      avgSkill,
      bestSynergy,
    };
  }, [squadData]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className="pointer-events-none fixed inset-0 dark:opacity-40 opacity-[0.12]"
        style={{
          background:
            "radial-gradient(600px circle at 20% 0%, rgba(168,85,247,0.12), transparent 40%), radial-gradient(600px circle at 90% 10%, rgba(34,211,238,0.14), transparent 40%)",
        }}
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <motion.header
          {...fadeUp}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="outline" className="border-border bg-card text-foreground hover:bg-muted rounded-xl">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            </Link>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-black tracking-tight bg-gradient-to-r from-purple-500 to-pink-600 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                Squad Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">
                Teammate performance · synergy · comparative analytics
              </p>
            </div>
          </div>
        </motion.header>

        {squadData.length === 0 ? (
          <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
            <Card className="bg-card border-border p-8 rounded-2xl text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-bold text-foreground mb-1">No squad data yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Log duo/trio battles with teammate profiles to see comparative
                performance metrics here.
              </p>
              <Link to="/" className="inline-block mt-4">
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl">
                  Log a Battle
                </Button>
              </Link>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Squad summary cards */}
            {squadStats && (
              <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="bg-card border-border p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="text-[10px] uppercase text-muted-foreground font-display">Squad Size</span>
                  </div>
                  <p className="text-2xl font-display font-black text-foreground">{squadStats.totalMembers}</p>
                </Card>
                <Card className="bg-card border-border p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-cyan-500" />
                    <span className="text-[10px] uppercase text-muted-foreground font-display">Win Rate</span>
                  </div>
                  <p className="text-2xl font-display font-black text-emerald-500">{squadStats.winRate}%</p>
                  <p className="text-[9px] text-muted-foreground">{squadStats.totalWins}W / {squadStats.totalGames} games</p>
                </Card>
                <Card className="bg-card border-border p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] uppercase text-muted-foreground font-display">Avg Elo</span>
                  </div>
                  <p className="text-2xl font-display font-black text-foreground">{squadStats.avgElo.toLocaleString()}</p>
                </Card>
                <Card className="bg-card border-border p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Gauge className="w-4 h-4 text-cyan-500" />
                    <span className="text-[10px] uppercase text-muted-foreground font-display">Avg Skill</span>
                  </div>
                  <p className="text-2xl font-display font-black text-foreground">{squadStats.avgSkill}<span className="text-sm text-muted-foreground">/10</span></p>
                </Card>
              </motion.div>
            )}

            {/* Best synergy highlight */}
            {squadStats?.bestSynergy && (
              <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
                <Card className="bg-gradient-to-br from-purple-600/15 to-pink-600/10 border-purple-500/20 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] uppercase text-muted-foreground font-display">Best Synergy Partner</p>
                      <div className="flex items-center gap-2">
                        <RankBadge elo={squadStats.bestSynergy.currentElo} size={32} />
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {squadStats.bestSynergy.highestElo.toLocaleString()} peak
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {Math.round((squadStats.bestSynergy.wins / squadStats.bestSynergy.games) * 100)}% win rate · {squadStats.bestSynergy.games} games
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Cross-tier validation */}
            <SquadCompositionValidator player={player} squad={squadData} />

            {/* Teammate comparison cards */}
            <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="space-y-3">
              <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Teammate Breakdown
              </h3>
              {squadData.map((mate, i) => {
                const rank = getRank(mate.currentElo);
                const c = TIER_COLORS[rank.tier];
                const winRate = mate.games > 0 ? Math.round((mate.wins / mate.games) * 100) : 0;
                const avgContribution = mate.games > 0 ? Math.round(mate.totalContribution / mate.games) : 0;
                return (
                  <Card key={mate.id} className="bg-card border-border p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <RankBadge elo={mate.currentElo} size={48} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground" style={{ color: c.text }}>
                            {rank.name}
                          </p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-display font-bold">
                            M{i + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Trophy className="w-2.5 h-2.5 text-amber-500" />
                            {mate.highestElo.toLocaleString()} peak
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Gauge className="w-2.5 h-2.5 text-cyan-500" />
                            {mate.skill}/10
                          </span>
                          {mate.trophies > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Award className="w-2.5 h-2.5 text-purple-500" />
                              {mate.trophies.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Win rate + contribution */}
                      <div className="text-right shrink-0">
                        <p className={`text-lg font-display font-black ${winRate >= 50 ? "text-emerald-500" : "text-red-500"}`}>
                          {winRate}%
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {mate.wins}W {mate.losses}L{mate.draws > 0 ? ` ${mate.draws}D` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Stats bar */}
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-muted/50 p-2 text-center">
                        <p className="text-[9px] uppercase text-muted-foreground font-display">Games</p>
                        <p className="text-sm font-bold text-foreground">{mate.games}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2 text-center">
                        <p className="text-[9px] uppercase text-muted-foreground font-display">Avg Contribution</p>
                        <p className={`text-sm font-bold ${avgContribution >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {avgContribution > 0 ? "+" : ""}{avgContribution}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2 text-center">
                        <p className="text-[9px] uppercase text-muted-foreground font-display">Total Elo</p>
                        <p className={`text-sm font-bold ${mate.totalContribution >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {mate.totalContribution > 0 ? "+" : ""}{mate.totalContribution}
                        </p>
                      </div>
                    </div>

                    {/* Win rate bar */}
                    <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden flex">
                      <div className="h-full bg-emerald-500" style={{ width: `${(mate.wins / mate.games) * 100}%` }} />
                      <div className="h-full bg-yellow-500" style={{ width: `${(mate.draws / mate.games) * 100}%` }} />
                      <div className="h-full bg-red-500" style={{ width: `${(mate.losses / mate.games) * 100}%` }} />
                    </div>
                  </Card>
                );
              })}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
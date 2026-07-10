import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, Gauge, Settings as SettingsIcon, Users, Flag, Sparkles } from "lucide-react";
import InputForm from "@/components/InputForm";
import ProfileBadge from "@/components/ProfileBadge";
import SummaryCards from "@/components/SummaryCards";
import BoostStatus from "@/components/BoostStatus";
import WinStreakTracker from "@/components/WinStreakTracker";
import EloProgressionChart from "@/components/EloProgressionChart";
import ForecastChart from "@/components/ForecastChart";
import ScatterAnalytics from "@/components/ScatterAnalytics";
import ModePerformance from "@/components/ModePerformance";
import ResultDistribution from "@/components/ResultDistribution";
import RankScale from "@/components/RankScale";
import RankBandsTable from "@/components/RankBandsTable";
import PlayerHistory from "@/components/PlayerHistory";
import Milestones from "@/components/Milestones";
import BattleLog from "@/components/BattleLog";
import RankAnalyser from "@/components/RankAnalyser";
import RankDescription from "@/components/RankDescription";
import TiltAlert from "@/components/TiltAlert";
import CSVImport from "@/components/CSVImport";
import HomeSkeleton from "@/components/HomeSkeleton";
import InboxButton from "@/components/InboxButton";
import Inbox from "@/components/Inbox";
import RankUpAnimation from "@/components/RankUpAnimation";
import MVPResilienceCard from "@/components/MVPResilienceCard";
import RegressionCard from "@/components/RegressionCard";
import BrawlerHeatmap from "@/components/BrawlerHeatmap";
import MatchDurationScatter from "@/components/MatchDurationScatter";
import BattleCardGallery from "@/components/BattleCardGallery";
import { getEquippedCard } from "@/lib/battleCards";
import MatchSimulator from "@/components/MatchSimulator";
import AchievementBadges from "@/components/AchievementBadges";
import { getBoost, runForecast } from "@/lib/forecast";
import { loadSnapshots, saveSnapshot, computeMilestones } from "@/lib/history";
import { loadBattleLog, getWinStreak } from "@/lib/battleLog";
import { getGateStatus } from "@/components/PowerBrawlerGate";
import { loadPlayer, savePlayer, DEFAULT_PLAYER } from "@/lib/playerStorage";
import { exportCSV, exportPDF } from "@/lib/exports";
import {
  notifyStreak, notifyLossStreak, notifyRankUp, notifyAchievement,
} from "@/lib/inbox";
import { notifyTierUpgrade } from "@/lib/tierUpgrades";
import { checkAchievements } from "@/lib/achievements";
import LiveKitLobby from "@/components/LiveKitLobby";
import { syncActiveSpace } from "@/lib/brawlSpaces";
import { Layers } from "lucide-react";
import RankDecayWarning from "@/components/RankDecayWarning";
import DraftPredictor from "@/components/DraftPredictor";
import { computeSeasonReset } from "@/lib/seasonReset";
import { getRank } from "@/lib/ranks";
import { incrementRankFrequency } from "@/lib/rankFrequency";
import SeasonEndReport from "@/components/SeasonEndReport";
import SeasonMomentumTracker from "@/components/SeasonMomentumTracker";
import SafetyNetSimulator from "@/components/SafetyNetSimulator";
import PromotionSeries from "@/components/PromotionSeries";
import { useToast } from "@/components/ui/use-toast";
import { broadcastBattle, onReceiveBattle, disconnect as disconnectP2P } from "@/lib/p2pSync";
import { addRemoteBattle } from "@/lib/battleLog";
import { primeAudio } from "@/lib/sfx";
import { loadHistory as loadAssessmentHistory } from "@/lib/assessmentHistory";
import BackendStatusChip from "@/components/BackendStatusChip";
import RankUpChecklist from "@/components/RankUpChecklist";
import RankUpSimulator from "@/components/RankUpSimulator";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState(DEFAULT_PLAYER);
  const [snapshots, setSnapshots] = useState([]);
  const [battleLog, setBattleLog] = useState([]);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [rankUpAnim, setRankUpAnim] = useState(null);
  const [seasonReportOpen, setSeasonReportOpen] = useState(false);
  const prevStreakRef = useRef(0);
  const { toast } = useToast();

  useEffect(() => {
    const p = loadPlayer();
    const s = loadSnapshots();
    const bl = loadBattleLog();
    // Safety net: season-highest should never sit below current Elo
    if ((p.currentSeasonHighest || 0) < (p.currentElo || 0)) {
      p.currentSeasonHighest = p.currentElo;
      savePlayer(p);
    }
    setPlayer(p);
    setSnapshots(s);
    setBattleLog(bl);
    prevStreakRef.current = getWinStreak(bl);
    const timer = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading) savePlayer(player);
  }, [player, loading]);

  // Sync current data back to active BrawlSpace on unmount
  useEffect(() => {
    return () => syncActiveSpace();
  }, []);

  // P2P real-time sync — receive battles from connected peers
  useEffect(() => {
    onReceiveBattle((entry) => {
      const newLog = addRemoteBattle(entry);
      setBattleLog(newLog);
    });
    return () => disconnectP2P();
  }, []);

  const boost = useMemo(
    () => getBoost(player.currentElo, Math.max(player.highestElo, player.currentElo)),
    [player.currentElo, player.highestElo]
  );

  const gateStatus = useMemo(
    () => getGateStatus(player.currentElo, player.power9Brawlers || 0, player.power11Brawlers || 0),
    [player.currentElo, player.power9Brawlers, player.power11Brawlers]
  );

  const themeAccent = useMemo(() => {
    const equipped = getEquippedCard(player);
    return equipped ? equipped.color : null;
  }, [player.equippedCard]);

  const forecast = useMemo(
    () =>
      runForecast({
        currentElo: player.currentElo,
        winRate: player.winRate,
        boostMultiplier: boost.multiplier,
        capElo: gateStatus.active ? player.currentElo : null,
      }),
    [player.currentElo, player.winRate, boost.multiplier, gateStatus.active]
  );

  const milestones = useMemo(
    () => computeMilestones(snapshots, battleLog),
    [snapshots, battleLog]
  );

  // Days since last Deserved Rank assessment (null if <7 or none)
  const assessmentReminder = useMemo(() => {
    if (loading) return null;
    const hist = loadAssessmentHistory();
    if (!hist.length) return null;
    const days = Math.floor((Date.now() - hist[0].timestamp) / 86400000);
    return days >= 7 ? days : null;
  }, [loading]);

  const handleSave = () => {
    setSnapshots(saveSnapshot(player));
  };

  const handleCSVImport = (data) => {
    setPlayer((p) => ({
      ...p,
      ...data,
      trophies: Math.max(1000, data.trophies ?? p.trophies ?? 1000),
    }));
  };

  const handleResetSeason = () => {
    const peakElo = player.currentSeasonHighest || player.highestElo || player.currentElo;
    const result = computeSeasonReset(peakElo);

    setPlayer((p) => ({
      ...p,
      lastSeasonElo: peakElo,
      currentElo: result.newElo,
      currentSeasonHighest: result.newElo,
      seasonRefreshed: true,
      seasonStartDate: new Date().toISOString(),
      winStreak: 0,
    }));

    toast({
      title: "Season Reset Complete",
      description: `${result.oldRankName} → ${result.resetLabel} (${result.newElo.toLocaleString()} Elo)`,
    });
  };

  const handleSaveTeam = (teamElos, teamProfiles) => {
    setPlayer((p) => ({ ...p, teamElos, teamProfiles }));
  };

  const handleEquipCard = (cardTier) => {
    setPlayer((p) => ({ ...p, equippedCard: cardTier }));
  };

  const handleUpdatePower = (powerData) => {
    setPlayer((p) => ({ ...p, ...powerData }));
  };


  const handleBattleLogged = (entry, newLog) => {
    primeAudio();
    setBattleLog(newLog);

    // Broadcast to connected peers via P2P
    if (entry && !entry.manual) {
      broadcastBattle(entry);
    }

    if (!entry) {
      setPlayer((p) => ({ ...p, winStreak: 0 }));
      prevStreakRef.current = 0;
      return;
    }

    const newElo = entry.eloAfter;

    if (!entry.manual) {
      const newStreak = getWinStreak(newLog);

      // Win streak inbox notification
      if (newStreak > 0) {
        const winMilestones = [3, 5, 7, 10, 15, 20];
        if (newStreak > prevStreakRef.current && winMilestones.includes(newStreak)) {
          notifyStreak(newStreak);
        }
      }

      // Loss streak / tilt warning
      if (newStreak < 0) {
        const lossStreak = Math.abs(newStreak);
        const prevLoss = Math.abs(Math.min(0, prevStreakRef.current));
        if (lossStreak > prevLoss && [3, 5, 7].includes(lossStreak)) {
          notifyLossStreak(lossStreak);
        }
      }
      prevStreakRef.current = newStreak;

      // Rank-up detection → animation + inbox notification
      if (entry.rankUp && entry.rankUp.isRankUp) {
        notifyRankUp(entry.rankUp.oldRank, entry.rankUp.newRank, entry.rankUp.isMajorRankUp);
        setRankUpAnim({ oldRank: entry.rankUp.oldRank, newRank: entry.rankUp.newRank, isMajor: entry.rankUp.isMajorRankUp });
        // Deep-analysis notification on major tier upgrade
        if (entry.rankUp.isMajorRankUp) {
          const newTier = entry.rankUp.newRank.tier;
          if (["Diamond", "Mythic", "Legendary", "Masters"].includes(newTier)) {
            notifyTierUpgrade(newTier);
          }
        }
      }

      // Auto-increment rank frequency when reaching a new peak tier this season
      const oldPeakElo = player.currentSeasonHighest || player.currentElo || 0;
      const newPeakElo = Math.max(oldPeakElo, newElo);
      if (newPeakElo > oldPeakElo) {
        const oldPeakTier = getRank(oldPeakElo).tier;
        const newPeakTier = getRank(newPeakElo).tier;
        if (newPeakTier !== oldPeakTier) {
          incrementRankFrequency(newPeakTier);
        }
      }

      // Achievement unlock detection
      const oldBadges = checkAchievements(battleLog, player);
      const newBadges = checkAchievements(newLog, {
        ...player,
        currentElo: newElo,
        highestElo: Math.max(player.highestElo || 0, newElo),
      });
      const newlyUnlocked = newBadges.filter(
        (a) => a.unlocked && !oldBadges.find((b) => b.id === a.id)?.unlocked
      );
      newlyUnlocked.forEach((a) => notifyAchievement(a.name, a.description));
    }

    setPlayer((p) => {
      const updated = {
        ...p,
        currentElo: newElo,
        highestElo: Math.max(p.highestElo, newElo),
        currentSeasonHighest: Math.max(p.currentSeasonHighest || 0, newElo),
      };

      if (!entry.manual) {
        updated.gamesPlayed = (p.gamesPlayed || 0) + 1;
        const realLog = newLog.filter((e) => !e.manual);
        const wins = realLog.filter((e) => e.result === "victory").length;
        const losses = realLog.filter((e) => e.result === "defeat").length;
        const total = wins + losses;
        const streak = getWinStreak(newLog);
        updated.winStreak = streak > 0 ? streak : 0;
        if (total > 0) updated.winRate = Math.round((wins / total) * 100);

        // Auto-deactivate season refresh on sub-rank up
        if (p.seasonRefreshed && entry.rankUp && entry.rankUp.isRankUp) {
          updated.seasonRefreshed = false;
        }
      }

      return updated;
    });
  };

  const handleBattleDeleted = (newLog, newElo, wasManual) => {
    setBattleLog(newLog);
    prevStreakRef.current = getWinStreak(newLog);

    setPlayer((p) => {
      const realLog = newLog.filter((e) => !e.manual);
      const wins = realLog.filter((e) => e.result === "victory").length;
      const losses = realLog.filter((e) => e.result === "defeat").length;
      const total = wins + losses;
      const streak = getWinStreak(newLog);

      return {
        ...p,
        currentElo: newElo ?? p.currentElo,
        winStreak: streak > 0 ? streak : 0,
        gamesPlayed: wasManual ? p.gamesPlayed : Math.max(0, (p.gamesPlayed || 0) - 1),
        winRate: total > 0 ? Math.round((wins / total) * 100) : p.winRate,
      };
    });
  };

  const handleBattleEdited = (newLog, newElo) => {
    setBattleLog(newLog);
    prevStreakRef.current = getWinStreak(newLog);

    setPlayer((p) => {
      const realLog = newLog.filter((e) => !e.manual);
      const wins = realLog.filter((e) => e.result === "victory").length;
      const losses = realLog.filter((e) => e.result === "defeat").length;
      const total = wins + losses;
      const streak = getWinStreak(newLog);
      const latestElo = newElo ?? (newLog.length > 0 ? newLog[0].eloAfter : p.currentElo);

      return {
        ...p,
        currentElo: latestElo,
        highestElo: Math.max(p.highestElo || 0, latestElo),
        currentSeasonHighest: Math.max(p.currentSeasonHighest || 0, latestElo),
        winStreak: streak > 0 ? streak : 0,
        winRate: total > 0 ? Math.round((wins / total) * 100) : p.winRate,
      };
    });
  };

  if (loading) return <HomeSkeleton />;

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1000px circle at 15% -10%, hsl(var(--primary) / 0.10), transparent 55%)," +
            "radial-gradient(900px circle at 90% 5%, rgba(168,85,247,0.14), transparent 55%)," +
            "radial-gradient(1200px circle at 50% 110%, rgba(34,211,238,0.10), transparent 60%)",
          animation: "app-aurora 8s ease-in-out infinite",
        }}
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <motion.header
          {...fadeUp}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4"
          style={themeAccent ? { borderBottom: `2px solid ${themeAccent.text}40` } : undefined}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-900/40">
              <Gauge className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-black tracking-tight bg-gradient-to-r from-cyan-500 to-purple-600 dark:from-cyan-300 dark:to-purple-300 bg-clip-text text-transparent">
                Ranked Analytics
              </h1>
              <p className="text-xs text-muted-foreground">
                Elo forecast · rank boost · Monte Carlo climb
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <InboxButton onClick={() => setInboxOpen(true)} />
            <Link to="/brawlspaces">
              <Button
                variant="outline"
                className="border-border bg-card text-foreground hover:bg-muted rounded-xl"
              >
                <Layers className="w-4 h-4 mr-2" /> Spaces
              </Button>
            </Link>
            <Link to="/squad">
              <Button
                variant="outline"
                className="border-border bg-card text-foreground hover:bg-muted rounded-xl"
              >
                <Users className="w-4 h-4 mr-2" /> Squad
              </Button>
            </Link>
            <Link to="/deserved-rank">
              <Button
                variant="outline"
                title="Assess Rank"
                aria-label="Assess Rank"
                className="border-border bg-card text-foreground hover:bg-muted rounded-xl px-3 sm:px-4 relative"
              >
                <Sparkles className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Assess Rank</span>
                {assessmentReminder && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-background"
                    title={`It's been ${assessmentReminder}d since your last assessment`}
                  >
                    !
                  </span>
                )}
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setSeasonReportOpen(true)}
              className="border-border bg-card text-foreground hover:bg-muted rounded-xl"
            >
              <Flag className="w-4 h-4 mr-2" /> Season Report
            </Button>
            <CSVImport onImport={handleCSVImport} />
            <Button
              variant="outline"
              onClick={() => {
                const res = exportCSV(player, forecast, snapshots, battleLog);
                toast(res?.success
                  ? { title: "CSV exported", description: res.ios
                      ? "Opened in a new tab — use Share → Save to Files."
                      : "Your data has been downloaded." }
                  : { title: "CSV export failed", description: res?.error || "Unknown error", variant: "destructive" });
              }}
              className="border-border bg-card text-foreground hover:bg-muted rounded-xl"
            >
              <FileDown className="w-4 h-4 mr-2" /> CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const res = exportPDF(player, forecast, battleLog);
                toast(res?.success
                  ? { title: "PDF exported", description: res.ios
                      ? "Opened in a new tab — use Share → Save to Files."
                      : "Your report has been downloaded." }
                  : { title: "PDF export failed", description: res?.error || "Unknown error", variant: "destructive" });
              }}
              className="border-border bg-card text-foreground hover:bg-muted rounded-xl"
            >
              <FileText className="w-4 h-4 mr-2" /> PDF
            </Button>
            <Link to="/settings">
              <Button
                variant="outline"
                className="border-border bg-card text-foreground hover:bg-muted rounded-xl"
              >
                <SettingsIcon className="w-4 h-4 mr-2" /> Settings
              </Button>
            </Link>
            <BackendStatusChip compact />
          </div>
        </motion.header>

        <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
          <ProfileBadge player={player} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.07 }}>
          <BattleCardGallery
            player={player}
            onEquip={handleEquipCard}
          />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <InputForm
            player={player}
            setPlayer={setPlayer}
            onSave={handleSave}
            onResetSeason={handleResetSeason}
            
          />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.12 }}>
          <TiltAlert battleLog={battleLog} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.13 }}>
          <PromotionSeries player={player} battleLog={battleLog} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.14 }}>
          <SummaryCards player={player} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.17 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MVPResilienceCard battleLog={battleLog} />
          <RegressionCard battleLog={battleLog} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BoostStatus boost={boost} forecast={forecast} />
          <WinStreakTracker battleLog={battleLog} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.22 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SeasonMomentumTracker battleLog={battleLog} />
          <SafetyNetSimulator currentElo={player.currentElo} battleLog={battleLog} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
          <EloProgressionChart battleLog={battleLog} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
          <ForecastChart forecast={forecast} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.35 }}>
          <ScatterAnalytics player={player} boost={boost} />
        </motion.div>

        {/* New analytics: Brawler Heatmap, Teammate Synergy, Match Duration */}
        <motion.div {...fadeUp} transition={{ delay: 0.37 }}>
          <BrawlerHeatmap battleLog={battleLog} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.38 }}>
          <MatchSimulator battleLog={battleLog} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.39 }}>
          <MatchDurationScatter battleLog={battleLog} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.4 }}>
          <RankAnalyser player={player} forecast={forecast} boost={boost} battleLog={battleLog} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.41 }}>
          <DraftPredictor currentElo={player.currentElo} winRate={player.winRate} battleLog={battleLog} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.42 }}>
          <LiveKitLobby />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.45 }}>
          <BattleLog
            currentElo={player.currentElo}
            highestElo={player.highestElo}
            battleLog={battleLog}
            onBattleLogged={handleBattleLogged}
            onBattleDeleted={handleBattleDeleted}
            onBattleEdited={handleBattleEdited}
            seasonRefreshed={player.seasonRefreshed}
            teamElos={player.teamElos}
            teamProfiles={player.teamProfiles}
            onSaveTeam={handleSaveTeam}
            power9Brawlers={player.power9Brawlers}
            power11Brawlers={player.power11Brawlers}
            matePower9={player.matePower9}
            matePower11={player.matePower11}
            onUpdatePower={handleUpdatePower}
          />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.5 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ModePerformance battleLog={battleLog} />
          <ResultDistribution battleLog={battleLog} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.55 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PlayerHistory snapshots={snapshots} player={player} />
          <Milestones milestones={milestones} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.57 }}>
          <AchievementBadges battleLog={battleLog} player={player} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.6 }}>
          <RankScale elo={player.currentElo} seasonHighest={player.currentSeasonHighest} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.65 }}>
          <RankDecayWarning battleLog={battleLog} currentElo={player.currentElo} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.67 }}>
          <RankBandsTable elo={player.currentElo} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.7 }}>
          <RankDescription elo={player.currentElo} winStreak={player.winStreak} />
        </motion.div>

        <footer className="text-center space-y-2 pt-4 pb-2">
          <p className="text-xs text-muted-foreground">
            Forecast model: dynamic rank-based gains/losses · floor protection · Mythic+ safety net
          </p>
          <p className="text-[10px] text-muted-foreground/70 max-w-2xl mx-auto leading-relaxed">
            This content is not affiliated with, endorsed, sponsored or specifically approved by Supercell and Supercell is not responsible for it. For more information, see Supercell's Fan Content Policy.
          </p>
        </footer>
      </div>

      {/* Inbox panel */}
      <Inbox open={inboxOpen} onClose={() => setInboxOpen(false)} />

      {/* Season End Report overlay */}
      {seasonReportOpen && (
        <SeasonEndReport
          player={player}
          battleLog={battleLog}
          onClose={() => setSeasonReportOpen(false)}
        />
      )}

      {/* Rank-up animation overlay */}
      {rankUpAnim && (
        <RankUpAnimation
          oldRank={rankUpAnim.oldRank}
          newRank={rankUpAnim.newRank}
          isMajor={rankUpAnim.isMajor}
          withVoiceover
          autoDismiss
          onComplete={() => setRankUpAnim(null)}
        />
      )}
    </div>
  );
}
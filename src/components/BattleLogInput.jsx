import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MODES, calculateDelta, computeParticipantTransitions } from "@/lib/battleLog";
import { checkTiltLock } from "@/lib/rankUp";
import { validateLobby, canQueue } from "@/lib/lobbyValidation";
import BrawlerSelect from "@/components/BrawlerSelect";
import BattlePredictor from "@/components/BattlePredictor";
import TeammateRoom from "@/components/TeammateRoom";
import TeamRestrictionsTable from "@/components/TeamRestrictionsTable";
import SynergyGrade from "@/components/SynergyGrade";
import SynergyAutoSuggest from "@/components/SynergyAutoSuggest";
import RankBadge from "@/components/RankBadge";
import {
  Plus, Users, Swords, Star, Save, Download, Camera, Search,
  User, UserPlus, Pencil, X, TrendingUp, AlertTriangle, Wand2,
  BarChart3, ChevronDown, ChevronUp, Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PERFORMANCE_FIELDS = {
  "Gem Grab":   { key: "gems", label: "Gems Collected", placeholder: "10" },
  "Heist":      { key: "damage", label: "Safe Damage", placeholder: "4500" },
  "Hot Zone":   { key: "control", label: "Zone Control %", placeholder: "65" },
  "Brawl Ball": { key: "goals", label: "Goals Scored", placeholder: "2" },
  "Bounty":     { key: "stars", label: "Stars Earned", placeholder: "5" },
  "Knockout":   { key: "kos", label: "KOs", placeholder: "3" },
};

function clampInput(val) {
  if (val === "") return "";
  const n = Math.floor(Number(val));
  if (isNaN(n) || n < 0) return 0;
  return n;
}

function EloInput({ value, onChange, placeholder }) {
  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(e) => onChange(clampInput(e.target.value))}
        placeholder={placeholder}
        className="bg-muted border-border text-foreground focus-visible:ring-cyan-500 text-xs h-8 w-20"
      />
      {value !== "" && Number(value) > 0 && (
        <RankBadge elo={Number(value)} size={24} />
      )}
    </div>
  );
}

function StarToggle({ isActive, onClick, label, disabled = false }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={label ? `Star Player: ${label}` : "Star Player"}
      className={`p-1.5 rounded-lg transition shrink-0 border ${
        isActive
          ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-500"
          : "bg-muted border-transparent text-muted-foreground hover:text-yellow-500"
      } ${disabled ? "opacity-60 cursor-not-allowed hover:text-muted-foreground" : ""}`}
    >
      <Star className={`w-3 h-3 ${isActive ? "fill-yellow-500" : ""}`} />
    </button>
  );
}

export default function BattleLogInput({
  playerElo,
  highestElo,
  battleLog = [],
  onLog,
  seasonRefreshed = false,
  teamElos = [],
  teamProfiles: savedProfiles,
  onSaveTeam,
  editingEntry,
  onCancelEdit,
}) {
  const [mode, setMode] = useState(MODES[0]);
  const [result, setResult] = useState("victory");
  const [brawlers, setBrawlers] = useState({ self: "", mate1: "", mate2: "", mate3: "", enemy1: "", enemy2: "", enemy3: "" });
  const [starPlayer, setStarPlayer] = useState(null);
  const [duration, setDuration] = useState("");
  const [queueType, setQueueType] = useState("solo");
  const [teammateElos, setTeammateElos] = useState(["", ""]);
  const [teammateProfiles, setTeammateProfiles] = useState([
    { highestElo: "", lastSeasonElo: "", trophies: "", skill: 5 },
    { highestElo: "", lastSeasonElo: "", trophies: "", skill: 5 },
  ]);
  const [enemyElos, setEnemyElos] = useState(["", "", ""]);
  const [showPredictor, setShowPredictor] = useState(false);
  const [autoFillRanks, setAutoFillRanks] = useState(false);
  const [showApiMsg, setShowApiMsg] = useState(false);
  const [showTeammateRoom, setShowTeammateRoom] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [performance, setPerformance] = useState({});
  const [showRestrictions, setShowRestrictions] = useState(false);
  const [manualDeltaOn, setManualDeltaOn] = useState(false);
  const [manualDeltaStr, setManualDeltaStr] = useState("");
  const [manualMateDeltas, setManualMateDeltas] = useState(["", "", ""]);
  const [manualEnemyDeltas, setManualEnemyDeltas] = useState(["", "", ""]);

  useEffect(() => {
    if (teamElos && teamElos.length >= 2 && !editingEntry) {
      setTeammateElos(teamElos.map(String));
    }
    if (savedProfiles && savedProfiles.length >= 2 && !editingEntry) {
      setTeammateProfiles(savedProfiles);
    }
  }, [teamElos, savedProfiles, editingEntry]);

  useEffect(() => {
    if (editingEntry) {
      setMode(editingEntry.mode || MODES[0]);
      setResult(editingEntry.result || "victory");
      setBrawlers(editingEntry.brawlers || { self: editingEntry.brawler || "", mate1: "", mate2: "", mate3: "", enemy1: "", enemy2: "", enemy3: "" });
      setStarPlayer(editingEntry.starPlayer === true ? "self" : editingEntry.starPlayer || null);
      setDuration(editingEntry.duration?.toString() || "");
      setQueueType(editingEntry.queueType || "solo");
      setTeammateElos(editingEntry.teammateElos?.map(String) || ["", ""]);
      setTeammateProfiles(editingEntry.teammateProfiles?.length > 0
        ? editingEntry.teammateProfiles
        : [
            { highestElo: "", lastSeasonElo: "", trophies: "", skill: 5 },
            { highestElo: "", lastSeasonElo: "", trophies: "", skill: 5 },
          ]);
      setEnemyElos(editingEntry.enemyElos?.map(String) || ["", "", ""]);
      setPerformance(editingEntry.performance || {});
    }
  }, [editingEntry]);

  // Auto-fill ranks from battle history — ONLY when last round was duo/trio.
  // Duo: fill mate1 only, leave mate2 blank. Trio: fill both mates.
  useEffect(() => {
    if (autoFillRanks) {
      const recent = battleLog.filter((e) => !e.manual && e.teammateElos?.length > 0);
      if (recent.length > 0) {
        const last = recent[0];
        // Only auto-fill if the last battle was duo or trio
        if (last.queueType !== "duo" && last.queueType !== "trio") return;

        const transitions = computeParticipantTransitions(last);
        const updatedElos = transitions.mates.map((t) => String(Math.round(t.after)));

        if (last.queueType === "duo") {
          // Duo: only fill mate1, leave mate2 blank
          setTeammateElos([updatedElos[0] || "", ""]);
        } else {
          // Trio: fill both mates
          setTeammateElos(updatedElos);
        }
      }
    }
  }, [autoFillRanks, battleLog]);

  const allFilled = [...teammateElos, ...enemyElos].every(
    (v) => v !== "" && Number(v) >= 0
  );

  const lobbyCheck = validateLobby(
    playerElo,
    teammateElos.map(Number),
    enemyElos.map(Number),
    queueType
  );

  const queueCheck = canQueue(
    queueType,
    [playerElo, ...teammateElos.map(Number)],
    enemyElos.map(Number)
  );

  const isMythicPlus = playerElo >= 4500;
  const selectedBrawlers = Object.values(brawlers).filter(Boolean);
  const hasDuplicates = isMythicPlus && new Set(selectedBrawlers).size !== selectedBrawlers.length;

  const manualDeltaNum =
    manualDeltaOn && manualDeltaStr !== "" && !isNaN(Number(manualDeltaStr))
      ? Number(manualDeltaStr)
      : null;

  // Manual Δ mode: bypass lobby/queue validation and required Elo inputs
  // so the user can log a match with just their manually-entered delta.
  const canSubmit = manualDeltaOn
    ? manualDeltaNum !== null && !hasDuplicates
    : allFilled && lobbyCheck.valid && queueCheck.canQueue && !hasDuplicates;

  const previewDelta = manualDeltaOn
    ? manualDeltaNum
    : allFilled && lobbyCheck.valid
    ? calculateDelta(playerElo, teammateElos.map(Number), enemyElos.map(Number), result, seasonRefreshed, queueType, highestElo || playerElo, starPlayer, teammateProfiles)
    : null;

  const setBrawler = (key, value) => {
    setBrawlers((prev) => ({ ...prev, [key]: value || "" }));
  };

  const handleStarToggle = (key) => {
    setStarPlayer((prev) => (prev === key ? null : key));
  };

  const handleQueueChange = (type) => {
    setQueueType(type);
    if (type !== "solo") {
      setShowTeammateRoom(true);
    }
  };

  const handleLog = () => {
    if (!canSubmit) return;
    // Anti-tilt lock — refuse to log another battle when the player is on a
    // configured loss streak unless they explicitly confirm.
    const tilt = checkTiltLock(battleLog);
    if (tilt.locked) {
      const ok = typeof window !== "undefined" && window.confirm(
        `Anti-tilt lock: you're on a ${tilt.lossStreak}-game losing streak.\n\nTake a short break before queueing again. Log this battle anyway?`
      );
      if (!ok) return;
    }
    // If lobby validation surfaced a soft warning (e.g. lone Diamond enemy in a
    // Mythic party), require explicit confirmation before logging so accidental
    // Elo swings from mis-entered opponents are avoided.
    const warnings = lobbyCheck.warnings || [];
    if (warnings.length > 0) {
      const ok = typeof window !== "undefined" && window.confirm(
        `${warnings.join("\n\n")}\n\nContinue and log this battle?`
      );
      if (!ok) return;
    }
    const manualDeltaVal = manualDeltaNum !== null ? manualDeltaNum : undefined;
    const cleanMateDeltas = manualDeltaOn
      ? manualMateDeltas.slice(0, teammateElos.length).map((v) => (v === "" || isNaN(Number(v)) ? null : Number(v)))
      : [];
    const cleanEnemyDeltas = manualDeltaOn
      ? manualEnemyDeltas.slice(0, enemyElos.length).map((v) => (v === "" || isNaN(Number(v)) ? null : Number(v)))
      : [];
    onLog({
      mode,
      result,
      brawlers,
      starPlayer,
      duration: duration ? Number(duration) : null,
      teammateElos: teammateElos.map(Number),
      teammateProfiles,
      enemyElos: enemyElos.map(Number),
      seasonRefreshed,
      queueType,
      performance: Object.keys(performance).length > 0 ? performance : null,
      manualTeammateDeltas: cleanMateDeltas,
      manualEnemyDeltas: cleanEnemyDeltas,
      ...(manualDeltaVal !== undefined ? { manualDelta: manualDeltaVal } : {}),
    });
    if (!editingEntry) {
      // Update teammate Elos to post-battle values, preserve profiles (highestElo, etc.)
      const transitions = computeParticipantTransitions({
        playerElo: Number(playerElo),
        teammateElos: teammateElos.map(Number),
        enemyElos: enemyElos.map(Number),
        result,
        seasonRefreshed,
        queueType,
        starPlayer,
        eloAfter: Number(playerElo) + (previewDelta || 0),
      });
      const updatedMateElos = transitions.mates.map((t) => String(Math.round(t.after)));
      setTeammateElos(updatedMateElos.length >= 2 ? updatedMateElos : ["", ""]);

      setBrawlers({ self: "", mate1: "", mate2: "", mate3: "", enemy1: "", enemy2: "", enemy3: "" });
      setStarPlayer(null);
      setEnemyElos(["", "", ""]);
      setResult("victory");
      setDuration("");
      setPerformance({});
      setManualDeltaStr("");
    }
  };

  const handleSaveTeam = () => {
    onSaveTeam?.(teammateElos.map(Number), teammateProfiles);
  };

  const handleLoadTeam = () => {
    if (teamElos && teamElos.length >= 2) {
      setTeammateElos(teamElos.map(String));
    }
    if (savedProfiles && savedProfiles.length >= 2) {
      setTeammateProfiles(savedProfiles);
    }
  };

  const perfField = PERFORMANCE_FIELDS[mode];
  const hasPerfData = Object.keys(performance).length > 0;

  // Teammate summary for duo/trio
  const teammateSummary = teammateElos
    .map((elo, i) => ({ elo: Number(elo), idx: i }))
    .filter((t) => t.elo > 0);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
      {editingEntry && (
        <div className="flex items-center justify-between rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5">
          <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
            <Pencil className="w-3 h-3" /> Editing battle log entry
          </span>
          <button onClick={onCancelEdit} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Lobby validation error banner */}
      <AnimatePresence>
        {!lobbyCheck.valid && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg bg-red-500/15 border-2 border-red-500/50 px-3 py-2 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-[10px] font-bold text-red-500 leading-tight">
              {lobbyCheck.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* canQueue tier-specific validation warnings */}
      <AnimatePresence>
        {!queueCheck.canQueue && queueCheck.violations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg bg-orange-500/15 border-2 border-orange-500/50 px-3 py-2 space-y-1"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
              <p className="text-[10px] font-bold text-orange-500 leading-tight">
                {queueCheck.tier} Matchmaking Violation — invalid team composition
              </p>
            </div>
            {queueCheck.violations.map((v, i) => (
              <p key={i} className="text-[9px] text-orange-500/80 leading-tight pl-6">
                • {v}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue type + Predictor + API buttons */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex gap-1 rounded-lg bg-muted p-0.5">
          <button
            onClick={() => setQueueType("solo")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-display font-bold transition ${
              queueType === "solo" ? "bg-cyan-500 text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="w-3 h-3" /> Solo
          </button>
          <>
            <button
              onClick={() => handleQueueChange("duo")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-display font-bold transition ${
                queueType === "duo" ? "bg-purple-500 text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserPlus className="w-3 h-3" /> Duo
            </button>
            <button
              onClick={() => handleQueueChange("trio")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-display font-bold transition ${
                queueType === "trio" ? "bg-pink-500 text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-3 h-3" /> Trio
            </button>
          </>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPredictor(!showPredictor)}
          className={`text-[10px] h-7 border-border rounded-lg ${
            showPredictor ? "bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-400" : "bg-card text-foreground hover:bg-muted"
          }`}
        >
          <TrendingUp className="w-3 h-3 mr-1" /> Predict
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowApiMsg("api")} className="text-[10px] h-7 border-border bg-card text-foreground hover:bg-muted rounded-lg">
          <Search className="w-3 h-3 mr-1" /> Fetch
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowApiMsg("ocr")} className="text-[10px] h-7 border-border bg-card text-foreground hover:bg-muted rounded-lg">
          <Camera className="w-3 h-3 mr-1" /> Screenshot
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRestrictions(!showRestrictions)}
          className={`text-[10px] h-7 border-border rounded-lg ${
            showRestrictions ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "bg-card text-foreground hover:bg-muted"
          }`}
        >
          <Shield className="w-3 h-3 mr-1" /> Rules
        </Button>
        {seasonRefreshed && (
          <span className="ml-auto text-[10px] font-bold text-cyan-400">
            🔄 Season Refresh (+100/-30)
          </span>
        )}
      </div>

      {showApiMsg && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] text-muted-foreground italic"
          onClick={() => setShowApiMsg(false)}
        >
          {showApiMsg === "api" ? "🔗 Player Tag API fetch — coming soon!" : "📸 Screenshot OCR — coming soon!"}
        </motion.p>
      )}

      {/* Team Restrictions reference table */}
      <AnimatePresence>
        {showRestrictions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <TeamRestrictionsTable />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battle Predictor */}
      <AnimatePresence>
        {showPredictor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <BattlePredictor
              playerElo={playerElo}
              winRate={65}
              queueType={queueType}
              teammateElos={teammateElos.map(Number)}
              enemyElos={enemyElos.map(Number)}
              highestElo={highestElo || playerElo}
              battleLog={battleLog}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Your Brawler + Mode + Input Rank Toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground">Your Brawler</Label>
          <div className="flex items-center gap-1 flex-wrap">
            <BrawlerSelect value={brawlers.self} onChange={(v) => setBrawler("self", v)} className="flex-1 min-w-[80px]" />
            <StarToggle isActive={starPlayer === "self"} onClick={() => handleStarToggle("self")} label="You" />
            <button
              type="button"
              onClick={() => setAutoFillRanks(!autoFillRanks)}
              title="Auto-fill teammate ranks from battle history (uses updated rank)"
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-bold transition border whitespace-nowrap ${
                autoFillRanks
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                  : "bg-muted border-transparent text-muted-foreground hover:text-cyan-400"
              }`}
            >
              <Wand2 className="w-3 h-3" /> Input duo/trio rank?
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground">Game Mode</Label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full bg-muted border border-border text-foreground text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Result + Duration + Performance toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {["victory", "defeat", "draw"].map((r) => (
            <button
              key={r}
              onClick={() => setResult(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold transition capitalize ${
                result === r
                  ? r === "victory" ? "bg-emerald-500 text-white"
                    : r === "defeat" ? "bg-red-500 text-white"
                    : "bg-yellow-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <Input
          type="number"
          min="0"
          step="1"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="Duration (sec)"
          className="bg-muted border-border text-foreground focus-visible:ring-cyan-500 text-xs h-8 w-28"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPerformance(!showPerformance)}
          className={`text-[10px] h-7 px-2 ${hasPerfData ? "text-cyan-400" : "text-muted-foreground"}`}
        >
          <BarChart3 className="w-3 h-3 mr-1" />
          Stats
          {hasPerfData && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />}
        </Button>
        {previewDelta !== null && (
          <motion.div
            key={`${result}-${queueType}-${starPlayer}-${teammateElos.join(",")}-${enemyElos.join(",")}-${manualDeltaOn}-${previewDelta}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`ml-auto font-display text-lg font-bold flex items-baseline gap-1.5 ${
              previewDelta > 0 ? "text-emerald-500" : previewDelta < 0 ? "text-red-500" : "text-yellow-500"
            }`}
          >
            <span>{previewDelta > 0 ? "+" : ""}{previewDelta}</span>
            <span className="text-[10px] font-normal text-muted-foreground">
              → {(Number(playerElo) + previewDelta).toLocaleString()}
            </span>
          </motion.div>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setManualDeltaOn((v) => !v)}
            className={`text-[10px] font-bold uppercase px-2 h-7 rounded border transition ${
              manualDeltaOn
                ? "bg-cyan-500 text-white border-cyan-500"
                : "bg-transparent text-muted-foreground border-border hover:text-foreground"
            }`}
            title="Manually override the auto-calculated Elo change"
          >
            Manual Δ
          </button>
          {manualDeltaOn && (
            <input
              type="number"
              inputMode="numeric"
              value={manualDeltaStr}
              onChange={(e) => setManualDeltaStr(e.target.value)}
              placeholder="±Elo"
              className="w-20 h-7 text-xs font-bold text-center rounded border border-cyan-500/50 bg-background text-foreground"
            />
          )}
        </div>
      </div>

      {/* Performance heatmap fields */}
      <AnimatePresence>
        {showPerformance && perfField && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
              <Label className="text-[10px] uppercase text-muted-foreground whitespace-nowrap">
                {perfField.label}
              </Label>
              <Input
                type="number"
                min="0"
                value={performance[perfField.key] ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setPerformance((prev) => {
                    const next = { ...prev };
                    if (val === "") delete next[perfField.key];
                    else next[perfField.key] = Number(val);
                    return next;
                  });
                }}
                placeholder={perfField.placeholder}
                className="bg-background border-border text-foreground text-xs h-8 w-32"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teammates */}
      <div className="space-y-1.5">
        {/* Solo: 2 random teammates as inline inputs */}
        {queueType === "solo" && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" /> Teammates (estimate randoms)
              </Label>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={handleLoadTeam} className="h-6 px-2 text-[10px]">
                  <Download className="w-3 h-3 mr-1" /> Load
                </Button>
                <Button size="sm" variant="ghost" onClick={handleSaveTeam} className="h-6 px-2 text-[10px]">
                  <Save className="w-3 h-3 mr-1" /> Save Team
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              {teammateElos.map((elo, i) => (
                <div key={i} className="flex items-center gap-2">
                  <EloInput
                    value={elo}
                    onChange={(v) => setTeammateElos((prev) => prev.map((x, idx) => (idx === i ? v : x)))}
                    placeholder={`Mate ${i + 1}`}
                  />
                  <BrawlerSelect value={brawlers[`mate${i + 1}`]} onChange={(v) => setBrawler(`mate${i + 1}`, v)} className="flex-1" />
                  <StarToggle isActive={starPlayer === `mate${i + 1}`} onClick={() => handleStarToggle(`mate${i + 1}`)} label={`Mate ${i + 1}`} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Duo: friend (TeammateRoom) + random teammate (inline) */}
        {queueType === "duo" && (
          <>
            <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-2.5">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                  <UserPlus className="w-3 h-3" /> Duo Partner
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTeammateRoom(true)}
                  className="h-6 px-2 text-[10px] border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                >
                  <Pencil className="w-3 h-3 mr-1" /> Edit
                </Button>
              </div>
              {teammateSummary.length > 0 && teammateSummary[0]?.elo > 0 ? (
                <div className="flex items-center gap-2">
                  <RankBadge elo={teammateSummary[0].elo} size={28} />
                  <span className="text-[10px] font-bold text-foreground">{teammateSummary[0].elo.toLocaleString()}</span>
                  <BrawlerSelect value={brawlers.mate1} onChange={() => {}} disabled className="flex-1 min-w-[80px]" />
                  <StarToggle isActive={starPlayer === "mate1"} onClick={() => {}} disabled label="Mate 1" />
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground italic">
                  No partner entered. Click "Edit" to add your duo partner.
                </p>
              )}
            </div>
            {/* Random teammate (mate 2) */}
            <div>
              <Label className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" /> Random Teammate
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <EloInput
                  value={teammateElos[1] || ""}
                  onChange={(v) => setTeammateElos((prev) => prev.map((x, idx) => (idx === 1 ? v : x)))}
                  placeholder="Mate 2"
                />
                <BrawlerSelect value={brawlers.mate2} onChange={(v) => setBrawler("mate2", v)} className="flex-1" />
                <StarToggle isActive={starPlayer === "mate2"} onClick={() => handleStarToggle("mate2")} label="Mate 2" />
              </div>
            </div>
          </>
        )}

        {/* Trio: 2 friends (TeammateRoom) */}
        {queueType === "trio" && (
          <div className="rounded-lg bg-pink-500/10 border border-pink-500/20 p-2.5">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" /> Trio Team
              </Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTeammateRoom(true)}
                className="h-6 px-2 text-[10px] border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
              >
                <Pencil className="w-3 h-3 mr-1" /> Edit Team
              </Button>
            </div>
            {teammateSummary.length > 0 ? (
              <div className="space-y-1.5">
                {teammateSummary.map((t) => (
                  <div key={t.idx} className="flex items-center gap-2">
                    <RankBadge elo={t.elo} size={28} />
                    <span className="text-[9px] text-muted-foreground">M{t.idx + 1}</span>
                    <span className="text-[10px] font-bold text-foreground">{t.elo.toLocaleString()}</span>
                    <BrawlerSelect value={brawlers[`mate${t.idx + 1}`]} onChange={() => {}} disabled className="flex-1 min-w-[60px]" />
                    <StarToggle isActive={starPlayer === `mate${t.idx + 1}`} onClick={() => {}} disabled label={`Mate ${t.idx + 1}`} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic">
                No teammates entered. Click "Edit Team" to add your trio.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Enemies */}
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
          <Swords className="w-3 h-3" /> Enemies
        </Label>
        <div className="space-y-1.5">
          {enemyElos.map((elo, i) => (
            <div key={i} className="flex items-center gap-2">
              <EloInput
                value={elo}
                onChange={(v) => setEnemyElos((prev) => prev.map((x, idx) => (idx === i ? v : x)))}
                placeholder={`Enemy ${i + 1}`}
              />
              <BrawlerSelect value={brawlers[`enemy${i + 1}`]} onChange={(v) => setBrawler(`enemy${i + 1}`, v)} className="flex-1" />
              <StarToggle isActive={starPlayer === `enemy${i + 1}`} onClick={() => handleStarToggle(`enemy${i + 1}`)} label={`Enemy ${i + 1}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Live Synergy Grade — updates as brawlers/teammates are selected */}
      {brawlers.self && (
        <SynergyGrade brawlers={brawlers} battleLog={battleLog} />
      )}

      {/* Auto-suggest best teammates based on historical synergy */}
      {brawlers.self && (
        <SynergyAutoSuggest brawlers={brawlers} battleLog={battleLog} />
      )}

      {/* Duplicate brawler warning */}
      {hasDuplicates && (
        <p className="text-[10px] text-red-500 font-bold">
          ⚠️ Duplicate brawlers are not allowed at Mythic+ rank
        </p>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleLog}
          disabled={!canSubmit}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-display font-bold rounded-xl disabled:opacity-50"
        >
          {editingEntry ? (
            <><Save className="w-4 h-4 mr-2" /> Save Edit</>
          ) : (
            <><Plus className="w-4 h-4 mr-2" /> Log Battle</>
          )}
        </Button>
        {editingEntry && (
          <Button variant="outline" onClick={onCancelEdit} className="border-border rounded-xl">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Teammate Room Dialog */}
      <TeammateRoom
        open={showTeammateRoom}
        onClose={() => setShowTeammateRoom(false)}
        queueType={queueType}
        teammateElos={teammateElos}
        setTeammateElos={setTeammateElos}
        teammateProfiles={teammateProfiles}
        setTeammateProfiles={setTeammateProfiles}
        brawlers={brawlers}
        setBrawlers={setBrawlers}
        starPlayer={starPlayer}
        setStarPlayer={setStarPlayer}
        onSaveTeam={handleSaveTeam}
      />
    </div>
  );
}
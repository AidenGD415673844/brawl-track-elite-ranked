import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { AnimatePresence } from "framer-motion";
import { Swords, Trash2, Undo2 } from "lucide-react";
import {
  loadBattleLog,
  clearBattleLog,
  addBattle,
  addManualAdjustment,
  editBattle,
  deleteBattle,
  getWinStreak,
} from "@/lib/battleLog";
import BattleLogInput from "@/components/BattleLogInput";
import BattleLogCard from "@/components/BattleLogCard";
import ManualEloAdjust from "@/components/ManualEloAdjust";
import PowerBrawlerGate, { getGateStatus } from "@/components/PowerBrawlerGate";

export default function BattleLog({ currentElo, highestElo, battleLog: externalLog, onBattleLogged, onBattleDeleted, onBattleEdited, seasonRefreshed, teamElos, teamProfiles, onSaveTeam, power9Brawlers, power11Brawlers, matePower9, matePower11, onUpdatePower }) {
  const [log, setLog] = useState(() => loadBattleLog());
  const [editingEntry, setEditingEntry] = useState(null);

  const handleLog = (battleData) => {
    if (editingEntry) {
      const { log: newLog, newElo } = editBattle(editingEntry.id, battleData);
      setLog(newLog);
      setEditingEntry(null);
      onBattleEdited?.(newLog, newElo);
    } else {
      const { entry, log: newLog } = addBattle(currentElo, { ...battleData, highestElo });
      setLog(newLog);
      onBattleLogged?.(entry, newLog);
    }
  };

  const handleManualAdjust = (adjustment) => {
    const { entry, log: newLog } = addManualAdjustment(currentElo, adjustment);
    setLog(newLog);
    onBattleLogged?.(entry, newLog);
  };

  const handleClear = () => {
    const empty = clearBattleLog();
    setLog(empty);
    onBattleLogged?.(null, empty);
  };

  const handleDelete = (id) => {
    const { log: newLog, newElo, wasManual } = deleteBattle(id);
    setLog(newLog);
    onBattleDeleted?.(newLog, newElo, wasManual);
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
  };

  const gateStatus = getGateStatus(currentElo, power9Brawlers || 0, power11Brawlers || 0);

  const streak = getWinStreak(log);

  // Per-entry running win streak (chronological) for streak-flame accents.
  const streakById = useMemo(() => {
    const map = {};
    let run = 0;
    [...log].reverse().forEach((e) => {
      if (e.manual) return;
      if (e.result === "victory") run += 1;
      else run = 0;
      map[e.id] = run;
    });
    return map;
  }, [log]);
  const wins = log.filter((e) => e.result === "victory").length;
  const losses = log.filter((e) => e.result === "defeat").length;
  const draws = log.filter((e) => e.result === "draw").length;

  return (
    <Card className="bg-card border-border p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-cyan-500" />
          <h3 className="text-sm font-display font-semibold text-foreground">Battle Log</h3>
          <span className="text-xs text-muted-foreground">({log.length})</span>
        </div>
        {log.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const ok = typeof window !== "undefined" && window.confirm("Undo the most recent battle? This removes the last logged entry and reverts your Elo.");
                if (!ok) return;
                handleDelete(log[0].id);
              }}
              title="Undo last logged battle"
              className="text-muted-foreground hover:text-cyan-500 transition p-1 rounded-md"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button onClick={handleClear} title="Clear entire battle log" className="text-muted-foreground hover:text-red-500 transition p-1 rounded-md">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2 text-center">
          <p className="text-lg font-display font-black text-emerald-500">{wins}</p>
          <p className="text-[10px] uppercase text-emerald-600 font-display">Wins</p>
        </div>
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-2 text-center">
          <p className="text-lg font-display font-black text-red-500">{losses}</p>
          <p className="text-[10px] uppercase text-red-600 font-display">Losses</p>
        </div>
        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-2 text-center">
          <p className="text-lg font-display font-black text-yellow-500">{draws}</p>
          <p className="text-[10px] uppercase text-yellow-600 font-display">Draws</p>
        </div>
        <div
          className={`rounded-xl p-2 text-center border ${
            streak > 0
              ? "bg-orange-500/10 border-orange-500/30"
              : streak < 0
              ? "bg-red-500/10 border-red-500/30"
              : "bg-muted/50 border-border"
          }`}
        >
          <p className={`text-lg font-display font-black ${streak > 0 ? "text-orange-500" : streak < 0 ? "text-red-500" : "text-muted-foreground"}`}>
            {streak > 0 ? `${streak}W` : streak < 0 ? `${Math.abs(streak)}L` : "—"}
          </p>
          <p className="text-[10px] uppercase text-muted-foreground font-display">Streak</p>
        </div>
      </div>

      {/* Input — gated by power brawler requirements */}
      {gateStatus.active ? (
        <PowerBrawlerGate
          gateStatus={gateStatus}
          power9Brawlers={power9Brawlers}
          power11Brawlers={power11Brawlers}
          matePower9={matePower9}
          matePower11={matePower11}
          onUpdate={onUpdatePower}
        />
      ) : (
        <BattleLogInput
          playerElo={editingEntry ? editingEntry.playerElo : currentElo}
          highestElo={highestElo}
          battleLog={externalLog || log}
          onLog={handleLog}
          editingEntry={editingEntry}
          onCancelEdit={() => setEditingEntry(null)}
          seasonRefreshed={seasonRefreshed}
          teamElos={teamElos}
          teamProfiles={teamProfiles}
          onSaveTeam={onSaveTeam}
        />
      )}

      {/* Manual Elo Adjustment */}
      <ManualEloAdjust onAdjust={handleManualAdjust} />

      {/* Match cards */}
      {log.length > 0 ? (
        <div className="space-y-3 mt-4 max-h-[28rem] overflow-y-auto pr-1">
          <AnimatePresence>
            {log.map((entry) => (
              <BattleLogCard
                key={entry.id}
                entry={entry}
                onDelete={() => handleDelete(entry.id)}
                onEdit={handleEdit}
                streakCount={streakById[entry.id] || 0}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4 mt-4">
          Log your first battle above — enter your teammates' and enemies' Elo to
          auto-calculate your gains! Or use manual Elo adjustment below.
        </p>
      )}
    </Card>
  );
}
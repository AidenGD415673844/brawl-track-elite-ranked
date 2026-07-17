import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Archive, Download, Trash2, GitCompare } from "lucide-react";
import { loadVault, deleteSnapshot, compareSnapshots, tierColorFor } from "@/lib/seasonVault";
import { TIER_COLORS } from "@/lib/ranks";
import { brawlerImageUrl, PLACEHOLDER_BRAWLER } from "@/lib/brawlers";

function VaultCard({ snap, selected, onSelect, onDelete, onExport }) {
  const c = tierColorFor(snap);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="relative rounded-xl border p-4 overflow-hidden cursor-pointer"
      onClick={onSelect}
      style={{
        borderColor: selected ? c.text : "hsl(var(--border))",
        background: `linear-gradient(160deg, ${c.from}22, ${c.to}11)`,
        boxShadow: selected ? `0 0 24px ${c.glow}` : "none",
      }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-10" style={{ background: `radial-gradient(circle at 80% 20%, ${c.glow}, transparent 60%)` }} />
      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Peak Rank</p>
            <p className="font-display text-lg font-black" style={{ color: c.text }}>{snap.peakRankName}</p>
            <p className="text-xs text-muted-foreground">{snap.peakElo.toLocaleString()} Elo</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Ended</p>
            <p className="text-xs">{new Date(snap.endedAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
          <div className="rounded-lg bg-black/25 p-2 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">Games</p>
            <p className="text-sm font-bold">{snap.games}</p>
          </div>
          <div className="rounded-lg bg-black/25 p-2 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">Win Rate</p>
            <p className="text-sm font-bold" style={{ color: snap.winRate >= 55 ? "#22c55e" : snap.winRate >= 45 ? "#eab308" : "#ef4444" }}>{snap.winRate}%</p>
          </div>
          <div className="rounded-lg bg-black/25 p-2 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">Best Streak</p>
            <p className="text-sm font-bold">{snap.bestStreak}</p>
          </div>
        </div>

        {snap.mvpBrawler && (
          <div className="flex items-center gap-2 rounded-lg bg-black/30 p-2 mb-2">
            <img src={brawlerImageUrl(snap.mvpBrawler.name)} onError={(e) => { e.currentTarget.src = PLACEHOLDER_BRAWLER; }} alt="" className="w-8 h-8 rounded object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] uppercase text-muted-foreground">Season MVP</p>
              <p className="text-xs font-bold truncate">{snap.mvpBrawler.name} · {snap.mvpBrawler.wr}%</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onExport(); }}
            className="flex-1 flex items-center justify-center gap-1 text-[10px] py-1.5 rounded-lg border border-border hover:bg-muted/50"
          >
            <Download className="w-3 h-3" /> Export
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg border border-border hover:bg-destructive/20 hover:border-destructive/40"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function DiffChip({ label, value, unit = "" }) {
  const positive = value > 0;
  const zero = value === 0;
  const color = zero ? "#94a3b8" : positive ? "#22c55e" : "#ef4444";
  const sign = positive ? "+" : "";
  return (
    <div className="rounded-lg bg-muted/40 p-2 text-center">
      <p className="text-[9px] uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-black" style={{ color }}>{sign}{value}{unit}</p>
    </div>
  );
}

export default function SeasonVault() {
  const [vault, setVault] = useState(() => loadVault());
  const [selectedIds, setSelectedIds] = useState([]);

  const selected = selectedIds.map((id) => vault.find((s) => s.id === id)).filter(Boolean);
  const diff = selected.length === 2 ? compareSnapshots(selected[0], selected[1]) : null;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this season snapshot?")) return;
    setVault(deleteSnapshot(id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const handleExport = (snap) => {
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `season-${snap.peakRankName.replace(/\s+/g, "-")}-${snap.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxPeak = Math.max(1, ...vault.map((s) => s.peakElo));

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/">
            <Button variant="outline" className="rounded-xl"><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-black flex items-center gap-2">
            <Archive className="w-6 h-6 text-amber-400" /> Season Vault
          </h1>
          <div className="w-16" />
        </div>

        {vault.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-2">No archived seasons yet.</p>
            <p className="text-xs text-muted-foreground">Reset a season from Home to capture your first snapshot.</p>
          </div>
        ) : (
          <>
            {/* Timeline ribbon */}
            <div className="mb-6 rounded-xl border border-border bg-card p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Season Timeline</p>
              <div className="flex items-end gap-1 h-28">
                {vault.slice().reverse().map((s) => {
                  const c = TIER_COLORS[s.peakTier];
                  const h = Math.max(10, (s.peakElo / maxPeak) * 100);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSelect(s.id)}
                      title={`${s.peakRankName} · ${s.peakElo.toLocaleString()}`}
                      className="flex-1 min-w-[10px] rounded-t transition-opacity hover:opacity-80"
                      style={{
                        height: `${h}%`,
                        background: `linear-gradient(180deg, ${c.text}, ${c.from})`,
                        boxShadow: selectedIds.includes(s.id) ? `0 0 12px ${c.glow}` : "none",
                        outline: selectedIds.includes(s.id) ? `2px solid ${c.text}` : "none",
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {diff && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-xl border border-purple-500/40 bg-purple-500/5 p-4"
              >
                <p className="text-[10px] uppercase tracking-wider text-purple-400 font-bold mb-2 flex items-center gap-1">
                  <GitCompare className="w-3 h-3" /> Compare: {selected[0].peakRankName} vs {selected[1].peakRankName}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  <DiffChip label="Peak Elo" value={diff.peakElo} />
                  <DiffChip label="Win Rate" value={diff.winRate} unit="%" />
                  <DiffChip label="Games" value={diff.games} />
                  <DiffChip label="Best Streak" value={diff.bestStreak} />
                  <DiffChip label="Avg/Game" value={diff.avgPerGame} />
                </div>
              </motion.div>
            )}

            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              {selectedIds.length === 0 ? "Tap 2 cards to compare" : selectedIds.length === 1 ? "Pick one more to compare" : "Comparing 2 seasons"}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {vault.map((s) => (
                <VaultCard
                  key={s.id}
                  snap={s}
                  selected={selectedIds.includes(s.id)}
                  onSelect={() => toggleSelect(s.id)}
                  onDelete={() => handleDelete(s.id)}
                  onExport={() => handleExport(s)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

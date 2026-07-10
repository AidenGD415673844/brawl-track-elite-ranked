import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Save, Trophy, RotateCcw, BarChart3, ChevronDown, ChevronUp } from "lucide-react";

import { TIER_IMAGES, TIER_COLORS } from "@/lib/ranks";
import { TRACKED_TIERS, getRankFrequency, setAllRankFrequency, getEffectLevel } from "@/lib/rankFrequency";

const fields = [
  { key: "currentElo",           label: "Current Elo",             type: "number" },
  { key: "highestElo",           label: "All-Time Peak",           type: "number" },
  { key: "currentSeasonHighest", label: "Current Season Highest",  type: "number" },
  { key: "lastSeasonElo",        label: "Last Season Highest",     type: "number" },
  { key: "trophies",             label: "Trophies (min 1000)",     type: "number" },
  { key: "winRate",              label: "Win Rate (%)",            type: "number" },
  { key: "gamesPlayed",          label: "Games Played",            type: "number" },
  { key: "winStreak",            label: "Current Win Streak",      type: "number" },
];

export default function InputForm({ player, setPlayer, onSave, onResetSeason }) {
  const [freqOpen, setFreqOpen] = useState(false);
  const [freqEdits, setFreqEdits] = useState({});

  const toggleFreq = () => {
    setFreqOpen((prev) => {
      const next = !prev;
      // Sync from localStorage when opening so existing data is shown
      if (next) setFreqEdits({ ...getRankFrequency() });
      return next;
    });
  };

  const update = (key, value) => {
    if (value === "") {
      setPlayer((p) => ({ ...p, [key]: 0 }));
      return;
    }
    let n = Math.max(0, Math.floor(Number(value)));
    // Ranked mode unlocks at 1000 trophies — enforce minimum
    if (key === "trophies" && n < 1000) n = 1000;
    setPlayer((p) => ({ ...p, [key]: isNaN(n) ? 0 : n }));
  };

  const saveFreq = () => {
    setAllRankFrequency(freqEdits);
    setFreqOpen(false);
  };

  return (
    <Card className="bg-card border-border p-5 rounded-2xl">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-cyan-500" />
        <h2 className="text-lg font-display font-bold text-foreground">Player Stats</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{f.label}</Label>
            <Input
              type={f.type}
              min="0"
              step="1"
              value={player[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
              className="bg-muted border-border text-foreground focus-visible:ring-cyan-500"
            />
          </div>
        ))}

        <div className="space-y-2 col-span-2">
          <Label className="text-xs text-muted-foreground">
            Self-Rated Skill:{" "}
            <span className="text-cyan-500 font-display font-bold">{player.skill}/10</span>
          </Label>
          <Slider
            value={[player.skill]}
            min={1}
            max={10}
            step={1}
            onValueChange={(v) => update("skill", v[0])}
            className="py-2"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Power 9 Brawlers</Label>
          <Input
            type="number"
            min="0"
            step="1"
            value={player.power9Brawlers ?? 0}
            onChange={(e) => update("power9Brawlers", e.target.value)}
            className="bg-muted border-border text-foreground focus-visible:ring-cyan-500"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Power 11 Brawlers</Label>
          <Input
            type="number"
            min="0"
            step="1"
            value={player.power11Brawlers ?? 0}
            onChange={(e) => update("power11Brawlers", e.target.value)}
            className="bg-muted border-border text-foreground focus-visible:ring-cyan-500"
          />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button
          onClick={onSave}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-display font-bold rounded-xl"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Snapshot
        </Button>
        {onResetSeason && (
          <Button
            onClick={onResetSeason}
            variant="outline"
            className="border-border bg-card text-foreground hover:bg-muted rounded-xl"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Season
          </Button>
        )}
      </div>

      {/* Rank Frequency — dedicated collapsible section */}
      <div className="mt-4 rounded-xl border border-border overflow-hidden">
        <button
          onClick={toggleFreq}
          className="w-full flex items-center justify-between p-3 hover:bg-muted transition"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-500" />
            <span className="text-sm font-display font-bold text-foreground">Rank Frequency</span>
          </div>
          {freqOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {freqOpen && (
          <div className="p-3 border-t border-border bg-muted/30">
            <p className="text-[10px] text-muted-foreground mb-3">
              How many times you've reached each tier across all seasons. Auto-updates when you hit a new peak rank.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TRACKED_TIERS.map((tier) => {
                const tc = TIER_COLORS[tier];
                const count = freqEdits[tier] || 0;
                const level = getEffectLevel(count);
                return (
                  <div key={tier} className="flex items-center gap-1.5 rounded-lg bg-card border border-border p-2">
                    <img
                      src={TIER_IMAGES[tier]}
                      alt={tier}
                      className="w-6 h-6 object-contain shrink-0"
                      style={{ filter: level >= 2 ? `drop-shadow(0 0 6px ${tc.glow})` : "none" }}
                    />
                    <span className="text-[9px] font-bold flex-1 truncate" style={{ color: tc.text }}>{tier}</span>
                    <Input
                      type="number"
                      min="0"
                      max="99"
                      value={count}
                      onChange={(e) => setFreqEdits((prev) => ({ ...prev, [tier]: Math.max(0, Math.min(99, Number(e.target.value) || 0)) }))}
                      className="bg-muted border-border text-foreground text-xs h-6 w-12 px-1"
                    />
                  </div>
                );
              })}
            </div>
            <Button
              onClick={saveFreq}
              size="sm"
              className="mt-3 w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg"
            >
              <Save className="w-3 h-3 mr-1" /> Save Frequency
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
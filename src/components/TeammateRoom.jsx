import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import BrawlerSelect from "@/components/BrawlerSelect";
import RankBadge from "@/components/RankBadge";
import { Star, Save, UserPlus, Users, Trophy, TrendingUp, Award, Gauge } from "lucide-react";

function clampInput(val) {
  if (val === "") return "";
  const n = Math.floor(Number(val));
  if (isNaN(n) || n < 0) return 0;
  return n;
}

function ProfileField({ icon: Icon, label, value, onChange, placeholder }) {
  return (
    <div className="space-y-0.5">
      <Label className="text-[9px] uppercase text-muted-foreground flex items-center gap-1">
        <Icon className="w-2.5 h-2.5" /> {label}
      </Label>
      <input
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(e) => onChange(clampInput(e.target.value))}
        placeholder={placeholder}
        className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
      />
    </div>
  );
}

function SkillSlider({ value, onChange }) {
  const v = Number(value) || 5;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <Label className="text-[9px] uppercase text-muted-foreground flex items-center gap-1">
          <Gauge className="w-2.5 h-2.5" /> Skill Level
        </Label>
        <span className="text-[10px] font-bold text-cyan-400">{v}/10</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-cyan-500 h-1.5"
      />
    </div>
  );
}

// Teammate Room — dialog for entering duo/trio teammate full profiles.
// Captures: current Elo, highest Elo, last season Elo, trophies, skill level,
// brawler, and star player toggle.
export default function TeammateRoom({
  open,
  onClose,
  queueType,
  teammateElos,
  setTeammateElos,
  teammateProfiles,
  setTeammateProfiles,
  brawlers,
  setBrawlers,
  starPlayer,
  setStarPlayer,
  onSaveTeam,
}) {
  if (!open) return null;

  // Duo = 1 teammate (you + 1 friend), Trio = 2 teammates (you + 2 friends)
  const teammateCount = queueType === "trio" ? 2 : 1;
  const visibleMates = teammateElos.slice(0, teammateCount);

  const handleEloChange = (idx, value) => {
    setTeammateElos((prev) => prev.map((x, i) => (i === idx ? value : x)));
  };

  const handleProfileChange = (idx, field, value) => {
    setTeammateProfiles((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  const handleBrawlerChange = (idx, value) => {
    const key = `mate${idx + 1}`;
    setBrawlers((prev) => ({ ...prev, [key]: value || "" }));
  };

  const handleStarToggle = (idx) => {
    const key = `mate${idx + 1}`;
    setStarPlayer((prev) => (prev === key ? null : key));
  };

  const handleSave = () => {
    onSaveTeam?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {queueType === "trio" ? (
              <Users className="w-4 h-4 text-pink-500" />
            ) : (
              <UserPlus className="w-4 h-4 text-purple-500" />
            )}
            {queueType === "trio" ? "Trio" : "Duo"} Team Room
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground -mt-2 mb-3">
          Enter your {queueType === "trio" ? "teammates'" : "teammate's"} full profile.
          Peak Elo and Skill level are shown on battle cards alongside Elo contribution.
        </p>

        <div className="space-y-3">
          {visibleMates.map((elo, idx) => {
            const key = `mate${idx + 1}`;
            const eloNum = Number(elo) || 0;
            const profile = teammateProfiles[idx] || {};
            return (
              <div
                key={idx}
                className="rounded-xl bg-muted/50 border border-border p-3 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase text-muted-foreground">
                    Teammate {idx + 1}
                  </Label>
                  {eloNum > 0 && <RankBadge elo={eloNum} size={32} />}
                </div>

                {/* Current Elo + Star toggle */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label className="text-[9px] uppercase text-muted-foreground">Current Elo</Label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={elo}
                        onChange={(e) => handleEloChange(idx, e.target.value)}
                        placeholder="Current Elo"
                        className="flex-1 bg-background border border-border text-foreground text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleStarToggle(idx)}
                        title="Star Player"
                        className={`p-2 rounded-lg transition border shrink-0 ${
                          starPlayer === key
                            ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-500"
                            : "bg-muted border-transparent text-muted-foreground hover:text-yellow-500"
                        }`}
                      >
                        <Star className={`w-4 h-4 ${starPlayer === key ? "fill-yellow-500" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile fields grid */}
                <div className="grid grid-cols-2 gap-2">
                  <ProfileField
                    icon={Trophy}
                    label="Highest Elo"
                    value={profile.highestElo ?? ""}
                    onChange={(v) => handleProfileChange(idx, "highestElo", v)}
                    placeholder="Peak"
                  />
                  <ProfileField
                    icon={TrendingUp}
                    label="Last Season Elo"
                    value={profile.lastSeasonElo ?? ""}
                    onChange={(v) => handleProfileChange(idx, "lastSeasonElo", v)}
                    placeholder="Last season"
                  />
                  <ProfileField
                    icon={Award}
                    label="Trophies"
                    value={profile.trophies ?? ""}
                    onChange={(v) => handleProfileChange(idx, "trophies", v)}
                    placeholder="Trophies"
                  />
                  <div className="flex items-end">
                    <div className="w-full">
                      <SkillSlider
                        value={profile.skill ?? 5}
                        onChange={(v) => handleProfileChange(idx, "skill", v)}
                      />
                    </div>
                  </div>
                </div>

                <BrawlerSelect
                  value={brawlers[key]}
                  onChange={(v) => handleBrawlerChange(idx, v)}
                  className="w-full"
                />
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl"
          >
            <Save className="w-4 h-4 mr-2" /> Save Team
          </Button>
          <Button variant="outline" onClick={onClose} className="border-border rounded-xl">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
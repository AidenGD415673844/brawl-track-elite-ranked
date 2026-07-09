import React from "react";
import { Card } from "@/components/ui/card";
import { Award, Flag, Crown, Flame, Trophy, Target, Gamepad2, Star } from "lucide-react";

const ICONS = {
  rank: Crown,
  threshold: Flag,
  peak: Trophy,
  winrate: Target,
  streak: Flame,
  games: Gamepad2,
  season: Star,
};

const COLORS = {
  rank: "from-purple-600 to-fuchsia-500",
  threshold: "from-cyan-500 to-blue-500",
  peak: "from-emerald-500 to-teal-500",
  winrate: "from-amber-500 to-yellow-400",
  streak: "from-red-500 to-orange-500",
  games: "from-indigo-500 to-purple-500",
  season: "from-pink-500 to-rose-500",
};

export default function Milestones({ milestones }) {
  return (
    <Card className="bg-card border-border p-5 rounded-2xl">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-4 h-4 text-purple-500" />
        <h3 className="text-sm font-semibold text-foreground">Milestones</h3>
      </div>
      {milestones.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {milestones.map((m) => {
            const Icon = ICONS[m.type] || Award;
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                    COLORS[m.type] || "from-slate-600 to-slate-500"
                  } flex items-center justify-center shrink-0`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.detail}</p>
                  {m.date && <p className="text-[10px] text-muted-foreground">{m.date}</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Save snapshots as you climb to unlock milestone badges.
        </p>
      )}
    </Card>
  );
}
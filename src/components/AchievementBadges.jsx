import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  Award, Sword, Flag, Shield, Flame, Zap, Rocket, Crown,
  Medal, Gem, Sparkles, Trophy, Star, RotateCcw, Target, Users,
} from "lucide-react";
import { checkAchievements } from "@/lib/achievements";

const ICON_MAP = {
  Sword, Flag, Shield, Flame, Zap, Rocket, Crown,
  Medal, Gem, Sparkles, Trophy, Star, RotateCcw, Target, Users,
};

export default function AchievementBadges({ battleLog, player }) {
  const badges = useMemo(
    () => checkAchievements(battleLog, player),
    [battleLog, player]
  );

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <Card className="bg-card border-border p-4 sm:p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-500" />
          <h3 className="text-sm font-display font-semibold text-foreground">Achievements</h3>
        </div>
        <span className="text-xs font-bold text-muted-foreground">
          {unlockedCount}/{badges.length}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Unlock badges by hitting milestones in your ranked journey
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {badges.map((badge) => {
          const Icon = ICON_MAP[badge.icon] || Award;
          return (
            <div
              key={badge.id}
              className={`rounded-xl border p-2 text-center transition ${
                badge.unlocked
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : "bg-muted/30 border-border opacity-40"
              }`}
              title={badge.description}
            >
              <Icon
                className={`w-6 h-6 mx-auto mb-1 ${
                  badge.unlocked ? "text-yellow-500" : "text-muted-foreground"
                }`}
              />
              <p className="text-[8px] font-display font-bold text-foreground truncate">
                {badge.name}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
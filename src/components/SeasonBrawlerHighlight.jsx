import React from "react";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";

// SeasonBrawlerHighlight — shows the player's most-played brawler this season
// with a stylized hero portrait, match count, and win rate.
export default function SeasonBrawlerHighlight({ story, color }) {
  if (!story.topBrawler) return null;

  return (
    <div
      className="w-full rounded-xl border overflow-hidden relative"
      style={{ background: `${color.from}12`, borderColor: `${color.from}33` }}
    >
      {/* Glow backdrop behind portrait */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 25% 50%, ${color.to}25, transparent 60%)`,
        }}
      />

      <div className="relative flex items-center gap-3 p-3">
        {/* Brawler portrait */}
        <motion.div
          className="relative shrink-0"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${color.from}30, ${color.to}20)`,
              border: `1px solid ${color.text}44`,
            }}
          >
            <img
              src={story.topBrawlerImage}
              alt={story.topBrawler}
              className="w-14 h-14 object-contain"
              style={{ filter: `drop-shadow(0 0 8px ${color.glow})` }}
            />
          </div>
          <div
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: color.text }}
          >
            <Crown className="w-3 h-3 text-black" />
          </div>
        </motion.div>

        {/* Stats */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase font-display text-muted-foreground">Season MVP</p>
          <p className="text-sm font-display font-bold truncate" style={{ color: color.text }}>
            {story.topBrawler}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-muted-foreground">
              <span className="font-bold text-foreground">{story.topBrawlerCount}</span> games
            </span>
            <span className="text-[10px] text-muted-foreground">
              <span className="font-bold" style={{ color: story.topBrawlerWinRate >= 50 ? "#34d399" : "#f87171" }}>
                {story.topBrawlerWinRate}%
              </span>{" "}
              win rate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { computeSynergyGrade } from "@/lib/synergyAnalysis";
import { brawlerImageUrl } from "@/lib/brawlers";

// SynergyGrade — live A-F grade that updates as brawlers/teammates are selected.
// Displays the grade letter, win rate, games sampled, and a contextual insight.
export default function SynergyGrade({ brawlers, battleLog }) {
  const grade = useMemo(
    () => computeSynergyGrade(brawlers, battleLog),
    [brawlers, battleLog]
  );

  const selfBrawler = brawlers?.self;
  const mateBrawlers = [brawlers?.mate1, brawlers?.mate2, brawlers?.mate3].filter(Boolean);
  const hasSelection = selfBrawler || mateBrawlers.length > 0;

  if (!hasSelection) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${selfBrawler}-${mateBrawlers.join(",")}-${grade.grade}`}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.25 }}
        className="rounded-lg border p-2.5 flex items-center gap-3"
        style={{
          background: grade.grade ? `${grade.color}12` : "rgba(100,116,139,0.08)",
          borderColor: grade.grade ? `${grade.color}40` : "rgba(100,116,139,0.2)",
        }}
      >
        {/* Grade letter badge */}
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 font-display font-black text-xl"
          style={{
            background: grade.grade ? `${grade.color}20` : "rgba(100,116,139,0.15)",
            color: grade.color,
            border: `1.5px solid ${grade.color}50`,
          }}
        >
          {grade.grade || "?"}
        </div>

        {/* Brawler portraits */}
        <div className="flex items-center gap-1 shrink-0">
          {selfBrawler && (
            <img
              src={brawlerImageUrl(selfBrawler)}
              alt={selfBrawler}
              className="w-8 h-8 object-contain"
              style={{ filter: `drop-shadow(0 0 3px ${grade.color}80)` }}
            />
          )}
          {mateBrawlers.map((b, i) => (
            <img
              key={i}
              src={brawlerImageUrl(b)}
              alt={b}
              className="w-7 h-7 object-contain opacity-80"
            />
          ))}
        </div>

        {/* Label + insight */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-display font-bold" style={{ color: grade.color }}>
            {grade.label}
            {grade.grade && (
              <span className="text-muted-foreground ml-1.5">
                · {grade.winRate}% WR · {grade.games} games
              </span>
            )}
          </p>
          {grade.insight && (
            <p className="text-[9px] text-muted-foreground leading-tight mt-0.5 truncate">
              {grade.insight}
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
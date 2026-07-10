import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ArrowRight, Trophy } from "lucide-react";
import RankBadge from "@/components/RankBadge";
import ShatterBurst from "@/components/ShatterBurst";
import { TIER_COLORS } from "@/lib/ranks";

// Big-reveal presentation of the Deserved Rank result.
// Shows current → deserved rank with a tier-colored ShatterBurst,
// a skill breakdown per category, and the per-adjustment table.
export default function DeservedRankReveal({ result, onDone, onRetake, readOnly = false }) {
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowBurst(true), 350);
    return () => clearTimeout(t);
  }, []);

  if (!result) return null;

  const c = TIER_COLORS[result.deservedRank.tier];
  const deltaPositive = result.deltaElo > 0;
  const deltaNegative = result.deltaElo < 0;
  const chipClass = deltaPositive
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    : deltaNegative
    ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
    : "bg-muted text-muted-foreground border-border";

  const intensity = Math.min(1, Math.abs(result.deltaIdx) / 6);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Ambient tier glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `radial-gradient(1200px circle at 50% 20%, ${c.glow}, transparent 55%), radial-gradient(900px circle at 50% 100%, ${c.glow}, transparent 60%)`,
        }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
            >
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1
                className="text-2xl font-display font-black"
                style={{ color: c.text }}
              >
                Deserved Rank Analysis
              </h1>
              <p className="text-xs text-muted-foreground">
                {readOnly && result.savedAt
                  ? `Saved ${new Date(result.savedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                  : "Verdict based on self-assessment + battle log data"}
              </p>
            </div>
          </div>
          <Button
            onClick={onDone}
            variant="outline"
            className="rounded-xl border-border bg-card text-foreground hover:bg-muted"
          >
            Close
          </Button>
        </header>

        {/* Big rank reveal */}
        <Card className="bg-card border-border rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          {/* ShatterBurst effect, tier-colored */}
          <AnimatePresence>
            {showBurst && (
              <ShatterBurst color={c} intensity={intensity} delay={0} />
            )}
          </AnimatePresence>

          <div className="relative flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-center"
            >
              <RankBadge elo={result.currentRank.min} size={96} />
              <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                Current
              </p>
              <p className="font-display font-bold text-foreground">
                {result.currentRank.name}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <ArrowRight className="w-8 h-8 text-muted-foreground" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 200 }}
              className="flex flex-col items-center"
              style={{ filter: `drop-shadow(0 0 24px ${c.glow})` }}
            >
              <RankBadge elo={result.deservedRank.min} size={112} />
              <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                Deserved
              </p>
              <p
                className="font-display font-black text-lg"
                style={{ color: c.text }}
              >
                {result.deservedRank.name}
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-6 flex flex-col items-center gap-2"
          >
            <p className="text-sm text-muted-foreground">
              {result.deservedElo.toLocaleString()} Elo
            </p>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${chipClass}`}
            >
              {deltaPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : deltaNegative ? (
                <TrendingDown className="w-4 h-4" />
              ) : null}
              {deltaPositive ? "+" : ""}
              {result.deltaElo.toLocaleString()} vs current
            </div>
            <p className="text-sm text-center text-foreground mt-2 max-w-md">
              {result.verdict}
            </p>
          </motion.div>
        </Card>

        {/* Skill Breakdown */}
        <Card className="bg-card border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-cyan-500 to-purple-600" />
            <h2 className="text-base font-display font-bold text-foreground">
              Skill Breakdown
            </h2>
          </div>
          <div className="space-y-4">
            {result.categories.map((cat, i) => {
              const pct = Math.min(100, (cat.score / 100) * 100);
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-display font-bold text-foreground">
                      {cat.label}
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: cat.color.text }}
                    >
                      {cat.score}/100 · {cat.contribution.toLocaleString()} Elo
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, delay: 0.1 * i }}
                      style={{
                        background: `linear-gradient(90deg, ${cat.color.from}, ${cat.color.to})`,
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>

        {/* Performance Adjustments */}
        <Card className="bg-card border-border rounded-2xl p-5">
          <h2 className="text-base font-display font-bold text-foreground mb-3">
            Performance Adjustments
          </h2>
          <div className="space-y-1.5">
            {result.adjustments.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-b-0"
              >
                <span className="text-muted-foreground">{a.label}</span>
                <span
                  className={`font-bold ${
                    a.value > 0
                      ? "text-emerald-500"
                      : a.value < 0
                      ? "text-rose-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {a.value > 0 ? "+" : ""}
                  {a.value.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm pt-2 mt-1 border-t border-border font-bold">
              <span className="text-foreground">Total adjustment</span>
              <span
                className={
                  result.totalAdjust > 0
                    ? "text-emerald-500"
                    : result.totalAdjust < 0
                    ? "text-rose-500"
                    : "text-foreground"
                }
              >
                {result.totalAdjust > 0 ? "+" : ""}
                {result.totalAdjust.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Confidence */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">
                Confidence ({result.sampleSize} games logged)
              </span>
              <span className="text-foreground font-bold">
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${result.confidence * 100}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          {!readOnly && (
            <Button
              onClick={onRetake}
              variant="outline"
              className="flex-1 rounded-xl border-border bg-card text-foreground hover:bg-muted"
            >
              Retake assessment
            </Button>
          )}
          <Button
            onClick={onDone}
            className="flex-1 rounded-xl text-white hover:opacity-95"
            style={{ background: `linear-gradient(90deg, ${c.from}, ${c.to})` }}
          >
            {readOnly ? "Back" : "Done"}
          </Button>
        </div>
      </div>
    </div>
  );
}

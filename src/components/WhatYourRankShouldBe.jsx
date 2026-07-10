import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, ArrowRight, RefreshCw } from "lucide-react";
import RankBadge from "@/components/RankBadge";
import { CHECKLIST_QUESTIONS, suggestChecklist, computeDeservedRank } from "@/lib/deservedRank";
import { TIER_COLORS } from "@/lib/ranks";

// "What Your Rank Should Be" — a large preset checklist that runs a
// deterministic scoring model and shows current vs deserved rank side by side.
export default function WhatYourRankShouldBe({ player, battleLog }) {
  const suggested = useMemo(() => suggestChecklist(player, battleLog), [player, battleLog]);
  const [answers, setAnswers] = useState(suggested);
  const [computed, setComputed] = useState(null);

  // Refresh suggested defaults if player data changes
  useEffect(() => {
    setAnswers((prev) => ({ ...suggested, ...prev }));
  }, [suggested]);

  const handlePick = (id, value) => {
    setAnswers((a) => ({ ...a, [id]: value }));
  };

  const handleAnalyse = () => {
    setComputed(computeDeservedRank(player, answers));
  };

  const handleReset = () => {
    setAnswers(suggested);
    setComputed(null);
  };

  const verdictColor = computed
    ? computed.verdictClass === "deserved"
      ? "text-emerald-500"
      : computed.verdictClass === "under"
      ? "text-cyan-500"
      : "text-rose-500"
    : "text-foreground";

  return (
    <Card className="bg-card border-border p-5 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
        <ClipboardCheck className="w-5 h-5 text-cyan-500" />
        <h2 className="text-lg font-display font-bold text-foreground">
          What Your Rank Should Be
        </h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Fill the checklist — a fully deterministic scoring model compares your
        profile to your current rank and tells you if you deserve it.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CHECKLIST_QUESTIONS.map((q) => (
          <div key={q.id} className="bg-muted/40 rounded-xl p-3 border border-border">
            <p className="text-xs font-bold text-foreground mb-2">{q.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {q.options.map((opt) => {
                const selected = answers[q.id] === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handlePick(q.id, opt.value)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          onClick={handleAnalyse}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-95"
        >
          Analyse my rank
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          className="rounded-xl border-border bg-card text-foreground hover:bg-muted"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Reset
        </Button>
      </div>

      {computed && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 pt-5 border-t border-border"
        >
          <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
            <RankColumn
              rank={computed.currentRank}
              label="Your current rank"
            />
            <ArrowRight className="w-8 h-8 text-muted-foreground shrink-0" />
            <RankColumn
              rank={computed.deservedRank}
              label="You should be"
              highlight
            />
          </div>
          <p className={`mt-4 text-center text-sm font-bold ${verdictColor}`}>
            {computed.verdict}
          </p>
          <p className="mt-1 text-center text-[11px] text-muted-foreground">
            Model score: {computed.trueElo.toLocaleString()} Elo · gap: {computed.deltaIdx > 0 ? "+" : ""}
            {computed.deltaIdx} sub-rank{Math.abs(computed.deltaIdx) === 1 ? "" : "s"}
          </p>

          <details className="mt-4">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              Show factor breakdown
            </summary>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {computed.breakdown.map((b) => (
                <div
                  key={b.id}
                  className="flex justify-between text-[11px] bg-muted/40 rounded-md px-2 py-1"
                >
                  <span className="text-muted-foreground">{b.label}</span>
                  <span
                    className={
                      b.points > 0
                        ? "text-emerald-500 font-bold"
                        : b.points < 0
                        ? "text-rose-500 font-bold"
                        : "text-muted-foreground"
                    }
                  >
                    {b.points > 0 ? "+" : ""}
                    {b.points}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </motion.div>
      )}
    </Card>
  );
}

function RankColumn({ rank, label, highlight = false }) {
  const c = TIER_COLORS[rank.tier];
  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-2xl p-3"
        style={
          highlight
            ? {
                background: `radial-gradient(circle at 50% 50%, ${c.glow}, transparent 70%)`,
              }
            : undefined
        }
      >
        <RankBadge elo={rank.min} size={84} />
      </div>
      <p
        className="mt-1 text-sm font-display font-bold"
        style={{ color: highlight ? c.text : undefined }}
      >
        {rank.name}
      </p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}

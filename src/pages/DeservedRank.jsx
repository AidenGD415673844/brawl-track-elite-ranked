import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, Brain, Shield, Users, ArrowLeft } from "lucide-react";
import DeservedRankAssessment from "@/components/DeservedRankAssessment";
import DeservedRankReveal from "@/components/DeservedRankReveal";
import AssessmentHistoryPanel from "@/components/AssessmentHistoryPanel";
import { computeDeservedRank, defaultResponses, CATEGORIES } from "@/lib/deservedRankEngine";
import { loadPlayer } from "@/lib/playerStorage";
import { loadBattleLog } from "@/lib/battleLog";
import {
  loadHistory,
  saveAssessment,
  deleteAssessment,
  clearHistory,
  entryToResult,
  importHistory,
} from "@/lib/assessmentHistory";

const CAT_ICONS = { mechanics: Target, gameIQ: Brain, resilience: Shield, brawlerPool: Users };

export default function DeservedRank() {
  const navigate = useNavigate();
  const [player] = useState(() => loadPlayer());
  const [battleLog] = useState(() => loadBattleLog());
  const [responses, setResponses] = useState(defaultResponses());
  const [phase, setPhase] = useState("intro"); // intro | wizard | reveal | history-reveal
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(() => loadHistory());

  const refreshHistory = () => setHistory(loadHistory());

  const startWizard = () => setPhase("wizard");
  const handleComplete = (finalResponses) => {
    setResponses(finalResponses);
    const r = computeDeservedRank(player, finalResponses, battleLog);
    saveAssessment(r, finalResponses);
    refreshHistory();
    setResult(r);
    setPhase("reveal");
  };
  const handleRetake = () => {
    setResult(null);
    setPhase("wizard");
  };
  const goHome = () => navigate("/");

  const handleViewEntry = (entry) => {
    setResult(entryToResult(entry));
    setPhase("history-reveal");
  };
  const handleRerunEntry = (entry) => {
    if (entry?.responses) setResponses(entry.responses);
    setPhase("wizard");
  };
  const handleDeleteEntry = (id) => {
    deleteAssessment(id);
    refreshHistory();
  };
  const handleClearAll = () => {
    clearHistory();
    refreshHistory();
  };
  const handleBackFromHistoryReveal = () => {
    setResult(null);
    setPhase("intro");
  };

  if (phase === "reveal" && result) {
    return <DeservedRankReveal result={result} onDone={goHome} onRetake={handleRetake} />;
  }
  if (phase === "history-reveal" && result) {
    return (
      <DeservedRankReveal
        result={result}
        onDone={handleBackFromHistoryReveal}
        readOnly
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1000px circle at 15% 0%, rgba(34,211,238,0.10), transparent 55%)," +
            "radial-gradient(900px circle at 90% 10%, rgba(168,85,247,0.14), transparent 55%)," +
            "radial-gradient(1200px circle at 50% 110%, rgba(236,72,153,0.10), transparent 60%)",
          animation: "app-aurora 8s ease-in-out infinite",
        }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goHome}
            className="rounded-xl border-border bg-card text-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Home
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-4 h-4 text-purple-400" />
            {battleLog.filter((e) => !e.manual).length} battles feeding this analysis
          </div>
        </header>

        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-display font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Deserved Rank
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            A 4-step honest self-assessment across the pillars of Brawl Stars
            skill. We combine your answers with your battle log (win rate,
            impact grades, streak stability) to compute your true Elo.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = CAT_ICONS[cat.id] || Sparkles;
            return (
              <Card
                key={cat.id}
                className="bg-card border-border rounded-2xl p-4 relative overflow-hidden"
              >
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `linear-gradient(135deg, ${cat.color.from}, transparent 60%)`,
                  }}
                />
                <div className="relative">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                    style={{
                      background: `linear-gradient(135deg, ${cat.color.from}, ${cat.color.to})`,
                    }}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p
                    className="font-display font-bold text-sm"
                    style={{ color: cat.color.text }}
                  >
                    {cat.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {cat.subtitle}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="bg-card border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground mb-3">
            Be honest — the model isn't graded, it just tells you where you'd
            settle if the ladder was purely skill-based. Takes ~2 minutes.
          </p>
          <Button
            onClick={startWizard}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white hover:opacity-95 h-11 font-display font-bold"
          >
            <Sparkles className="w-4 h-4 mr-2" /> Start Assessment
          </Button>
        </Card>

        <AssessmentHistoryPanel
          history={history}
          onView={handleViewEntry}
          onRerun={handleRerunEntry}
          onDelete={handleDeleteEntry}
          onClearAll={handleClearAll}
        />
      </div>

      {phase === "wizard" && (
        <DeservedRankAssessment
          initial={responses}
          onComplete={handleComplete}
          onCancel={() => setPhase("intro")}
        />
      )}
    </div>
  );
}

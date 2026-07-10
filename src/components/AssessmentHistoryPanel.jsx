import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Trash2, ChevronDown, ChevronUp, Eye, RotateCcw, TrendingUp, TrendingDown, Target } from "lucide-react";
import { TIER_COLORS } from "@/lib/ranks";

function fmtDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `Today · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  const days = Math.floor((now - d) / 86400000);
  if (days < 7) return `${days}d ago · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function DeltaChip({ value }) {
  if (!value) return <span className="text-xs text-muted-foreground">±0</span>;
  const positive = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
        positive
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
      }`}
    >
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? "+" : ""}
      {value.toLocaleString()}
    </span>
  );
}

function Sparkline({ points }) {
  if (points.length < 2) return null;
  const w = 220, h = 40, pad = 4;
  const min = Math.min(...points), max = Math.max(...points);
  const range = Math.max(1, max - min);
  const step = (w - pad * 2) / (points.length - 1);
  const path = points
    .map((p, i) => {
      const x = pad + i * step;
      const y = h - pad - ((p - min) / range) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke="url(#spark-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AssessmentHistoryPanel({
  history,
  onView,
  onRerun,
  onDelete,
  onClearAll,
}) {
  const [open, setOpen] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const trendPoints = useMemo(
    () => [...history].reverse().map((e) => e.deservedElo),
    [history]
  );

  return (
    <Card className="bg-card border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-purple-400" />
          <span className="font-display font-bold text-sm text-foreground">
            History
          </span>
          <span className="text-xs text-muted-foreground">
            · {history.length} {history.length === 1 ? "run" : "runs"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Clear all assessment history? This can't be undone.")) onClearAll();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  if (confirm("Clear all assessment history? This can't be undone.")) onClearAll();
                }
              }}
              className="inline-flex items-center text-[11px] text-muted-foreground hover:text-rose-400 px-2 py-1 rounded-md hover:bg-rose-500/10 cursor-pointer"
              aria-label="Clear all history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 pt-0 space-y-3">
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Complete your first assessment to start tracking your growth.
                </p>
              ) : (
                <>
                  {trendPoints.length >= 2 && (
                    <div className="bg-muted/30 rounded-xl px-3 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-muted-foreground">Deserved Elo over time</span>
                        <span className="text-[11px] font-bold text-foreground">
                          {trendPoints[0].toLocaleString()} → {trendPoints[trendPoints.length - 1].toLocaleString()}
                        </span>
                      </div>
                      <Sparkline points={trendPoints} />
                    </div>
                  )}
                  <div className="space-y-2">
                    {history.map((entry) => {
                      const c = TIER_COLORS[entry.deservedRankTier] || TIER_COLORS.Bronze;
                      const expanded = expandedId === entry.id;
                      return (
                        <div
                          key={entry.id}
                          className="rounded-xl border border-border bg-background/50 overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : entry.id)}
                            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
                                style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                              >
                                <Target className="w-4 h-4 text-white" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs text-muted-foreground truncate">
                                    {entry.currentRankName}
                                  </span>
                                  <span className="text-muted-foreground">→</span>
                                  <span
                                    className="text-xs font-bold truncate"
                                    style={{ color: c.text }}
                                  >
                                    {entry.deservedRankName}
                                  </span>
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {fmtDate(entry.timestamp)} · {Math.round((entry.confidence || 0) * 100)}% conf · {entry.sampleSize} games
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                              <DeltaChip value={entry.deltaElo} />
                              {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {expanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.18 }}
                              >
                                <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/50">
                                  {/* Skill mini-bars */}
                                  <div className="space-y-1.5 pt-2">
                                    {entry.categories?.map((cat) => (
                                      <div key={cat.id}>
                                        <div className="flex items-center justify-between text-[10px] mb-0.5">
                                          <span className="text-muted-foreground">{cat.label}</span>
                                          <span className="font-bold" style={{ color: cat.color?.text }}>
                                            {cat.score}/100
                                          </span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                          <div
                                            className="h-full rounded-full"
                                            style={{
                                              width: `${cat.score}%`,
                                              background: `linear-gradient(90deg, ${cat.color?.from}, ${cat.color?.to})`,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex gap-2 flex-wrap">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => onView(entry)}
                                      className="rounded-lg h-8 text-xs border-border bg-card hover:bg-muted"
                                    >
                                      <Eye className="w-3.5 h-3.5 mr-1" /> View reveal
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => onRerun(entry)}
                                      className="rounded-lg h-8 text-xs border-border bg-card hover:bg-muted"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Rerun answers
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        if (confirm("Delete this assessment?")) onDelete(entry.id);
                                      }}
                                      className="rounded-lg h-8 text-xs text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 ml-auto"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

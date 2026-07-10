import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Trash2, ChevronDown, ChevronUp, Eye, RotateCcw, TrendingUp, TrendingDown, Target, GitCompare, Download, Upload, X } from "lucide-react";
import { TIER_COLORS } from "@/lib/ranks";
import { loadHistory } from "@/lib/assessmentHistory";

function fmtDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `Today · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  const days = Math.floor((now - d) / 86400000);
  if (days < 7) return `${days}d ago · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function DeltaChip({ value, size = "sm" }) {
  if (!value) return <span className="text-xs text-muted-foreground">±0</span>;
  const positive = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold border ${
        size === "sm" ? "text-[11px]" : "text-xs"
      } ${
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

function CompareView({ a, b, onClose }) {
  // a = older, b = newer (or vice versa). We render "left → right".
  const [left, right] = a.timestamp <= b.timestamp ? [a, b] : [b, a];
  const catDelta = (id) => {
    const la = left.categories?.find((c) => c.id === id)?.score ?? 0;
    const rb = right.categories?.find((c) => c.id === id)?.score ?? 0;
    return rb - la;
  };
  return (
    <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
          <GitCompare className="w-3.5 h-3.5" /> Comparison
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
        <div className="text-right">
          <div className="text-muted-foreground text-[10px]">{fmtDate(left.timestamp)}</div>
          <div className="font-bold text-foreground">{left.deservedRankName}</div>
          <div className="text-[10px] text-muted-foreground">{left.deservedElo.toLocaleString()} Elo</div>
        </div>
        <div className="text-muted-foreground">→</div>
        <div>
          <div className="text-muted-foreground text-[10px]">{fmtDate(right.timestamp)}</div>
          <div className="font-bold text-foreground">{right.deservedRankName}</div>
          <div className="text-[10px] text-muted-foreground">{right.deservedElo.toLocaleString()} Elo</div>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <DeltaChip value={right.deservedElo - left.deservedElo} size="md" />
      </div>
      <div className="space-y-1.5 pt-2 border-t border-purple-500/20">
        {left.categories?.map((cat) => {
          const d = catDelta(cat.id);
          return (
            <div key={cat.id} className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">{cat.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground tabular-nums">
                  {cat.score} → {right.categories?.find((c) => c.id === cat.id)?.score ?? "?"}
                </span>
                <span
                  className={`font-bold tabular-nums ${
                    d > 0 ? "text-emerald-400" : d < 0 ? "text-rose-400" : "text-muted-foreground"
                  }`}
                >
                  {d > 0 ? "+" : ""}{d}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AssessmentHistoryPanel({
  history,
  onView,
  onRerun,
  onDelete,
  onClearAll,
  onImport,
}) {
  const [open, setOpen] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const trendPoints = useMemo(
    () => [...history].reverse().map((e) => e.deservedElo),
    [history]
  );

  // Biggest category gainer & decliner across the full history
  // (oldest → newest). Only meaningful with 2+ runs.
  const categoryTrend = useMemo(() => {
    if (history.length < 2) return null;
    const oldest = history[history.length - 1];
    const newest = history[0];
    if (!oldest?.categories || !newest?.categories) return null;
    const diffs = oldest.categories.map((c) => {
      const nb = newest.categories.find((x) => x.id === c.id);
      return { id: c.id, label: c.label, color: c.color, delta: (nb?.score ?? 0) - c.score };
    });
    const gainer = [...diffs].sort((a, b) => b.delta - a.delta)[0];
    const decliner = [...diffs].sort((a, b) => a.delta - b.delta)[0];
    return { gainer, decliner };
  }, [history]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const compareEntries = compareMode && selectedIds.length === 2
    ? selectedIds.map((id) => history.find((h) => h.id === id)).filter(Boolean)
    : null;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deserved-rank-history-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) throw new Error("Invalid file");
        onImport?.(parsed);
      } catch {
        alert("Could not import — file is not a valid Deserved Rank history export.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <Card className="bg-card border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-purple-400" />
          <span className="font-display font-bold text-sm text-foreground">History</span>
          <span className="text-xs text-muted-foreground">
            · {history.length} {history.length === 1 ? "run" : "runs"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {history.length >= 2 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setCompareMode((v) => !v);
                setSelectedIds([]);
              }}
              className={`inline-flex items-center text-[11px] px-2 py-1 rounded-md cursor-pointer ${
                compareMode
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              title="Compare two runs"
            >
              <GitCompare className="w-3.5 h-3.5" />
            </span>
          )}
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); handleExport(); }}
            className="inline-flex items-center text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted cursor-pointer"
            title="Export history as JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </span>
          <label
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted cursor-pointer"
            title="Import history JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
          </label>
          {history.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Clear all assessment history? This can't be undone.")) onClearAll();
              }}
              className="inline-flex items-center text-[11px] text-muted-foreground hover:text-rose-400 px-2 py-1 rounded-md hover:bg-rose-500/10 cursor-pointer"
              title="Clear all history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />}
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
              {compareMode && (
                <div className="text-[11px] text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                  Compare mode — pick 2 runs to see the diff.
                  {selectedIds.length > 0 && ` (${selectedIds.length}/2)`}
                </div>
              )}
              {compareEntries && <CompareView a={compareEntries[0]} b={compareEntries[1]} onClose={() => { setCompareMode(false); setSelectedIds([]); }} />}

              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Complete your first assessment to start tracking your growth.
                </p>
              ) : (
                <>
                  {trendPoints.length >= 2 && !compareMode && (
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
                  {categoryTrend && !compareMode && (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "gainer", label: "Most improved", entry: categoryTrend.gainer, positive: true },
                        { key: "decliner", label: "Biggest drop", entry: categoryTrend.decliner, positive: false },
                      ].map(({ key, label, entry, positive }) => {
                        if (!entry) return null;
                        const isGain = entry.delta > 0;
                        const isLoss = entry.delta < 0;
                        const tone = (positive && isGain) || (!positive && isLoss)
                          ? positive
                            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                            : "border-rose-500/30 bg-rose-500/5 text-rose-300"
                          : "border-border bg-muted/30 text-muted-foreground";
                        return (
                          <div key={key} className={`rounded-xl border px-3 py-2 ${tone}`}>
                            <div className="text-[9px] uppercase tracking-widest opacity-70">{label}</div>
                            <div className="text-[12px] font-bold" style={{ color: entry.color?.text }}>
                              {entry.label}
                            </div>
                            <div className="text-[11px] font-bold tabular-nums">
                              {entry.delta > 0 ? "+" : ""}{entry.delta} pts
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="space-y-2">
                    {history.map((entry) => {
                      const c = TIER_COLORS[entry.deservedRankTier] || TIER_COLORS.Bronze;
                      const expanded = expandedId === entry.id;
                      const selected = selectedIds.includes(entry.id);
                      return (
                        <div
                          key={entry.id}
                          className={`rounded-xl border overflow-hidden ${
                            selected
                              ? "border-purple-500/60 bg-purple-500/10"
                              : "border-border bg-background/50"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (compareMode) toggleSelect(entry.id);
                              else setExpandedId(expanded ? null : entry.id);
                            }}
                            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {compareMode && (
                                <div
                                  className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${
                                    selected
                                      ? "bg-purple-500 border-purple-500"
                                      : "border-muted-foreground"
                                  }`}
                                >
                                  {selected && <span className="text-white text-[10px] leading-none">✓</span>}
                                </div>
                              )}
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
                              {!compareMode && (
                                expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {expanded && !compareMode && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.18 }}
                              >
                                <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/50">
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

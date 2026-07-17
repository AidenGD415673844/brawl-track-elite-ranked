import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Sparkles, X, TrendingUp, Trophy, AlertTriangle } from "lucide-react";
import { loadBattleLog } from "@/lib/battleLog";
import { brawlerImageUrl, PLACEHOLDER_BRAWLER } from "@/lib/brawlers";
import { buildBrawlerStats, recommendBrawlers, poolGaps, bestTeammatesFor, nightmareFor } from "@/lib/brawlerLab";

function Sparkline({ points, color = "#22d3ee" }) {
  if (!points || points.length < 2) return null;
  const w = 100, h = 24;
  const min = Math.min(...points), max = Math.max(...points);
  const range = Math.max(1, max - min);
  const step = w / (points.length - 1);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - ((p - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="opacity-80">
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function BrawlerCard({ b, onClick }) {
  const wrColor = b.wr >= 55 ? "#22c55e" : b.wr >= 45 ? "#eab308" : "#ef4444";
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="text-left rounded-xl border border-border bg-card p-3 hover:border-cyan-500/40 hover:shadow-[0_0_16px_rgba(34,211,238,0.15)] transition-all"
    >
      <div className="flex items-center gap-3">
        <img
          src={brawlerImageUrl(b.name)}
          onError={(e) => { e.currentTarget.src = PLACEHOLDER_BRAWLER; }}
          alt={b.name}
          className="w-14 h-14 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="font-bold truncate">{b.name}</p>
          <p className="text-[10px] text-muted-foreground">{b.games} games · {b.w}W / {b.l}L</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-bold" style={{ color: wrColor }}>{b.wr}% WR</span>
            <span className="text-[10px] text-muted-foreground">{b.avgDelta >= 0 ? "+" : ""}{b.avgDelta} avg</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Play Score</div>
        <div className="text-sm font-black" style={{ color: b.playScore >= 70 ? "#22c55e" : b.playScore >= 50 ? "#eab308" : "#94a3b8" }}>
          {b.playScore}
        </div>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${b.playScore}%`, background: `linear-gradient(90deg, ${wrColor}, #22d3ee)` }} />
      </div>
    </motion.button>
  );
}

function Drawer({ brawler, battleLog, onClose }) {
  const mates = useMemo(() => bestTeammatesFor(battleLog, brawler.name), [battleLog, brawler.name]);
  const nightmares = useMemo(() => nightmareFor(battleLog, brawler.name), [battleLog, brawler.name]);
  const modes = Object.entries(brawler.modes || {}).map(([m, s]) => ({
    mode: m, games: s.w + s.l, wr: (s.w + s.l) ? Math.round((s.w / (s.w + s.l)) * 100) : 0,
  })).sort((a, b) => b.wr - a.wr);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        className="w-full max-w-md h-full overflow-y-auto bg-card border-l border-border p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={brawlerImageUrl(brawler.name)} alt={brawler.name} className="w-14 h-14 rounded-lg object-cover" onError={(e) => { e.currentTarget.src = PLACEHOLDER_BRAWLER; }} />
            <div>
              <h2 className="font-display text-xl font-bold">{brawler.name}</h2>
              <p className="text-xs text-muted-foreground">{brawler.games} games · {brawler.wr}% WR</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-lg bg-muted/40 p-2 text-center">
            <p className="text-[9px] uppercase text-muted-foreground">Play Score</p>
            <p className="text-lg font-black text-cyan-400">{brawler.playScore}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2 text-center">
            <p className="text-[9px] uppercase text-muted-foreground">Avg Δ</p>
            <p className="text-lg font-black">{brawler.avgDelta >= 0 ? "+" : ""}{brawler.avgDelta}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2 text-center">
            <p className="text-[9px] uppercase text-muted-foreground">Best Mode</p>
            <p className="text-xs font-bold truncate">{brawler.bestMode?.mode || "—"}</p>
          </div>
        </div>

        {brawler.trajectory?.length > 1 && (
          <div className="mb-4 rounded-lg border border-border p-3">
            <p className="text-[10px] uppercase text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Elo Trajectory</p>
            <Sparkline points={brawler.trajectory} />
          </div>
        )}

        <section className="mb-4">
          <h3 className="text-xs uppercase font-display font-bold mb-2 text-muted-foreground">Per-Mode Win Rate</h3>
          <div className="space-y-1.5">
            {modes.length === 0 && <p className="text-xs text-muted-foreground">No mode data yet.</p>}
            {modes.map((m) => (
              <div key={m.mode} className="flex items-center gap-2">
                <span className="text-xs w-24 truncate">{m.mode}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full" style={{ width: `${m.wr}%`, background: m.wr >= 55 ? "#22c55e" : m.wr >= 45 ? "#eab308" : "#ef4444" }} />
                </div>
                <span className="text-[10px] w-14 text-right text-muted-foreground">{m.wr}% · {m.games}g</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-4">
          <h3 className="text-xs uppercase font-display font-bold mb-2 text-muted-foreground flex items-center gap-1"><Trophy className="w-3 h-3" /> Best Teammates</h3>
          {mates.length === 0 ? (
            <p className="text-xs text-muted-foreground">Need more games with tracked teammates.</p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {mates.map((m) => (
                <div key={m.name} className="flex items-center gap-2 rounded-lg bg-muted/40 p-2">
                  <img src={brawlerImageUrl(m.name)} onError={(e) => { e.currentTarget.src = PLACEHOLDER_BRAWLER; }} alt={m.name} className="w-8 h-8 rounded-md object-cover" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{m.name}</p>
                    <p className="text-[10px] text-green-400">{m.wr}% · {m.g}g</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-xs uppercase font-display font-bold mb-2 text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Nightmare Matchups</h3>
          {nightmares.length === 0 ? (
            <p className="text-xs text-muted-foreground">No repeated enemy brawlers yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {nightmares.map((m) => (
                <div key={m.name} className="flex items-center gap-2 rounded-lg bg-muted/40 p-2">
                  <img src={brawlerImageUrl(m.name)} onError={(e) => { e.currentTarget.src = PLACEHOLDER_BRAWLER; }} alt={m.name} className="w-8 h-8 rounded-md object-cover" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{m.name}</p>
                    <p className="text-[10px] text-red-400">{m.wr}% · {m.g}g</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </motion.div>
    </motion.div>
  );
}

export default function BrawlerLab() {
  const [log] = useState(() => loadBattleLog());
  const [selected, setSelected] = useState(null);
  const stats = useMemo(() => buildBrawlerStats(log), [log]);
  const recs = useMemo(() => recommendBrawlers(stats), [stats]);
  const gaps = useMemo(() => poolGaps(stats), [stats]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/">
            <Button variant="outline" className="rounded-xl"><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-black flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-cyan-400" /> Brawler Lab
          </h1>
          <div className="w-16" />
        </div>

        {stats.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">No brawler data yet. Log some ranked battles to unlock the lab.</p>
          </div>
        ) : (
          <>
            {recs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-4"
              >
                <p className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold mb-2">Queue These Next</p>
                <div className="flex flex-wrap gap-2">
                  {recs.map((r) => (
                    <div key={r.name} className="flex items-center gap-2 rounded-lg bg-background/60 border border-border px-3 py-1.5">
                      <img src={brawlerImageUrl(r.name)} onError={(e) => { e.currentTarget.src = PLACEHOLDER_BRAWLER; }} alt={r.name} className="w-6 h-6 rounded object-cover" />
                      <span className="text-sm font-bold">{r.name}</span>
                      <span className="text-[10px] text-muted-foreground">· {r.why}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="mb-5 rounded-xl border border-border bg-card p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Pool Coverage</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {gaps.map((g) => {
                  const color = g.risk === "critical" ? "#ef4444" : g.risk === "risky" ? "#eab308" : g.risk === "ok" ? "#22d3ee" : "#22c55e";
                  return (
                    <div key={g.mode} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                      <span className="text-xs font-bold">{g.mode}</span>
                      <span className="text-xs" style={{ color }}>{g.count} viable</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.map((b) => (
                <BrawlerCard key={b.name} b={b} onClick={() => setSelected(b)} />
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {selected && <Drawer brawler={selected} battleLog={log} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

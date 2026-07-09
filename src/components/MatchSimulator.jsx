import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { BRAWLERS, brawlerImageUrl, PLACEHOLDER_BRAWLER } from "@/lib/brawlers";
import { MODES } from "@/lib/battleLog";
import { Crosshair } from "lucide-react";

// Match Simulator — predicts win probability from historical battle log data.
// Deterministic: blends brawler WR, mode WR, and overall WR weighted by sample size.
export default function MatchSimulator({ battleLog }) {
  const [brawler, setBrawler] = useState("");
  const [mode, setMode] = useState(MODES[0]);

  const prediction = useMemo(() => {
    const real = (battleLog || []).filter((e) => !e.manual);
    if (real.length === 0) return null;

    // Brawler-specific stats
    let brawlerGames = 0, brawlerWins = 0;
    if (brawler) {
      for (const e of real) {
        if (e.brawler === brawler) {
          brawlerGames++;
          if (e.result === "victory") brawlerWins++;
        }
      }
    }
    const brawlerWR = brawlerGames > 0 ? brawlerWins / brawlerGames : null;

    // Mode-specific stats
    let modeGames = 0, modeWins = 0;
    for (const e of real) {
      if (e.mode === mode) {
        modeGames++;
        if (e.result === "victory") modeWins++;
      }
    }
    const modeWR = modeGames > 0 ? modeWins / modeGames : null;

    // Overall stats
    const totalWins = real.filter((e) => e.result === "victory").length;
    const overallWR = totalWins / real.length;

    // Weighted blend: overall is the base; brawler and mode data
    // pull the prediction with weight proportional to sample size.
    let sum = overallWR * 1;
    let weightSum = 1;

    if (brawlerWR !== null) {
      const w = (Math.min(brawlerGames, 10) / 10) * 2;
      sum += brawlerWR * w;
      weightSum += w;
    }
    if (modeWR !== null) {
      const w = (Math.min(modeGames, 10) / 10) * 2;
      sum += modeWR * w;
      weightSum += w;
    }

    const probability = Math.round((sum / weightSum) * 100);

    // Confidence based on total sample size
    const totalSamples = brawlerGames + modeGames;
    let confidence = "Low";
    if (totalSamples >= 20) confidence = "High";
    else if (totalSamples >= 10) confidence = "Medium";

    return {
      probability,
      confidence,
      brawlerGames,
      brawlerWR: brawlerWR !== null ? Math.round(brawlerWR * 100) : null,
      modeGames,
      modeWR: modeWR !== null ? Math.round(modeWR * 100) : null,
      overallWR: Math.round(overallWR * 100),
    };
  }, [battleLog, brawler, mode]);

  return (
    <Card className="bg-card border-border p-4 sm:p-5 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Crosshair className="w-4 h-4 text-cyan-500" />
        <h3 className="text-sm font-display font-semibold text-foreground">Match Simulator</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Predict your win probability based on historical performance
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground">Brawler</Label>
          <div className="flex items-center gap-2">
            {brawler && (
              <img
                src={brawlerImageUrl(brawler)}
                alt={brawler}
                onError={(e) => { e.target.src = PLACEHOLDER_BRAWLER; }}
                className="w-8 h-8 rounded-lg object-cover shrink-0"
              />
            )}
            <select
              value={brawler}
              onChange={(e) => setBrawler(e.target.value)}
              className="bg-muted border border-border text-foreground text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 flex-1 min-w-0"
            >
              <option value="">Any brawler</option>
              {BRAWLERS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground">Game Mode</Label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full bg-muted border border-border text-foreground text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {prediction ? (
        <div className="space-y-3">
          {/* Win probability */}
          <div className="text-center">
            <p className="text-[10px] uppercase text-muted-foreground mb-1">Predicted Win Probability</p>
            <div className={`text-4xl font-display font-black ${
              prediction.probability >= 55 ? "text-emerald-500" :
              prediction.probability >= 45 ? "text-yellow-500" :
              "text-red-500"
            }`}>
              {prediction.probability}%
            </div>
            <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded font-bold ${
              prediction.confidence === "High" ? "bg-emerald-500/20 text-emerald-500" :
              prediction.confidence === "Medium" ? "bg-yellow-500/20 text-yellow-500" :
              "bg-muted text-muted-foreground"
            }`}>
              {prediction.confidence} Confidence
            </span>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
            <div className="text-center">
              <p className="text-[9px] uppercase text-muted-foreground">Brawler WR</p>
              <p className="text-sm font-display font-bold text-foreground">
                {prediction.brawlerWR !== null ? `${prediction.brawlerWR}%` : "—"}
              </p>
              <p className="text-[8px] text-muted-foreground">
                {prediction.brawlerGames > 0 ? `${prediction.brawlerGames} games` : "no data"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px] uppercase text-muted-foreground">Mode WR</p>
              <p className="text-sm font-display font-bold text-foreground">
                {prediction.modeWR !== null ? `${prediction.modeWR}%` : "—"}
              </p>
              <p className="text-[8px] text-muted-foreground">
                {prediction.modeGames > 0 ? `${prediction.modeGames} games` : "no data"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px] uppercase text-muted-foreground">Overall WR</p>
              <p className="text-sm font-display font-bold text-foreground">
                {prediction.overallWR}%
              </p>
              <p className="text-[8px] text-muted-foreground">all games</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-6">
          Log some battles first to get match predictions!
        </p>
      )}
    </Card>
  );
}
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRank, TIER_COLORS } from "@/lib/ranks";
import { RANKED_TIERS } from "@/lib/seasonReset";
import { brawlerImageUrl } from "@/lib/brawlers";
import BrawlerSelect from "@/components/BrawlerSelect";
import BrawlerSuggestions from "@/components/BrawlerSuggestions";
import { Swords, ShieldCheck, ShieldAlert, Target, Ban, TrendingUp } from "lucide-react";

function RuleTile({ label, value }) {
  return (
    <div className="rounded-xl bg-muted/50 p-2.5">
      <p className="text-[9px] uppercase text-muted-foreground tracking-wider">{label}</p>
      <p className="text-xs font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function ProbBar({ label, prob, color, sub }) {
  const pct = Math.round(prob * 100);
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-display font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-background overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {sub && <p className="text-[9px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function DraftPredictor({ currentElo, winRate, battleLog = [] }) {
  const [poolSize, setPoolSize] = useState("");
  const [picks, setPicks] = useState([null, null, null]);
  const [ban, setBan] = useState(null);

  const rank = getRank(currentElo);
  const tierConfig = RANKED_TIERS[rank.tier];
  const colors = TIER_COLORS[rank.tier];
  const isBo3 = tierConfig.format === "Best of 3";
  const hasBans = tierConfig.picking.includes("Ban");
  const p = Math.max(0.01, Math.min(0.99, (winRate || 50) / 100));

  const bo1Prob = p;
  const bo3Prob = p * p * (3 - 2 * p);
  const meetsReq = poolSize !== "" && Number(poolSize) >= tierConfig.brawlerReq.count;
  const filledPicks = picks.filter(Boolean).length;

  // Projected games to next rank
  const eloToNext = Math.max(0, rank.max + 1 - currentElo);
  const avgEloPerGame = Math.round(80 * (2 * p - 1));
  const gamesToNext = avgEloPerGame > 0 && eloToNext > 0
    ? Math.ceil(eloToNext / avgEloPerGame)
    : null;

  return (
    <Card className="bg-card border-border p-5 rounded-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Swords className="w-5 h-5" style={{ color: colors.text }} />
        <h2 className="text-lg font-display font-bold text-foreground">Draft Predictor</h2>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-display font-bold"
          style={{ backgroundColor: `${colors.from}22`, color: colors.text }}
        >
          {rank.tier} · {tierConfig.eloRange}
        </span>
      </div>

      {/* Tier Rules */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RuleTile label="Format" value={tierConfig.format} />
        <RuleTile label="Picking" value={tierConfig.picking} />
        <RuleTile label="Brawler Req" value={tierConfig.brawlerReq.label} />
        <RuleTile label="Season Reset" value={tierConfig.resetRule} />
      </div>

      {/* Eligibility Check */}
      <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">
            Brawlers at Power {tierConfig.brawlerReq.power}+
          </Label>
          <Input
            type="number"
            min="0"
            value={poolSize}
            onChange={(e) => setPoolSize(e.target.value)}
            placeholder={`Need ${tierConfig.brawlerReq.count}`}
            className="bg-background border-border text-foreground mt-1 h-8"
          />
        </div>
        {poolSize !== "" && (
          <div
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg ${
              meetsReq
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-red-500/15 text-red-500"
            }`}
          >
            {meetsReq ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )}
            <span className="text-xs font-bold">
              {meetsReq ? "ELIGIBLE" : `NEED ${tierConfig.brawlerReq.count - Number(poolSize)} MORE`}
            </span>
          </div>
        )}
      </div>

      {/* Series Probability */}
      <div className="grid grid-cols-2 gap-3">
        <ProbBar
          label="Bo1 Win Chance"
          prob={bo1Prob}
          color={colors.text}
          sub={avgEloPerGame !== 0 ? `~${avgEloPerGame > 0 ? "+" : ""}${avgEloPerGame} Elo/game` : "Even matchup"}
        />
        {isBo3 ? (
          <ProbBar
            label="Bo3 Series Win"
            prob={bo3Prob}
            color={colors.text}
            sub={p > 0.5 ? "Better odds than Bo1" : p < 0.5 ? "Worse odds than Bo1" : "Same as Bo1"}
          />
        ) : (
          <div className="rounded-xl bg-muted/30 p-3 flex items-center justify-center">
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              Bo3 format unlocks at<br /><span className="font-bold text-foreground">Mythic (4,500 Elo)</span>
            </p>
          </div>
        )}
      </div>

      {/* Projected Climb */}
      {gamesToNext && (
        <div className="flex items-center gap-2 rounded-lg bg-cyan-500/5 border border-cyan-500/15 px-3 py-2">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <p className="text-[10px] text-muted-foreground">
            <span className="font-bold text-foreground">~{gamesToNext}</span> {isBo3 ? "series" : "games"} to reach{" "}
            <span className="font-bold text-foreground" style={{ color: colors.text }}>
              {eloToNext.toLocaleString()} Elo
            </span>{" "}
            (next rank)
          </p>
        </div>
      )}

      {/* Draft Planner */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-display font-bold text-foreground uppercase tracking-wider">
            Draft Planner
          </span>
        </div>
        <div className="flex items-start gap-3 flex-wrap">
          {picks.map((pick, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-xl bg-muted border border-border overflow-hidden flex items-center justify-center">
                {pick ? (
                  <img src={brawlerImageUrl(pick)} alt={pick} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[9px] text-muted-foreground">Pick {i + 1}</span>
                )}
              </div>
              <BrawlerSelect
                value={pick}
                onChange={(v) => setPicks((prev) => prev.map((p, idx) => (idx === i ? v : p)))}
              />
            </div>
          ))}

          {hasBans && (
            <>
              <div className="w-px h-14 bg-border mx-1 mt-0" />
              <div className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20 overflow-hidden flex items-center justify-center">
                  {ban ? (
                    <img
                      src={brawlerImageUrl(ban)}
                      alt={ban}
                      className="w-full h-full object-cover opacity-50 grayscale"
                    />
                  ) : (
                    <Ban className="w-5 h-5 text-red-500/50" />
                  )}
                </div>
                <BrawlerSelect value={ban} onChange={setBan} />
              </div>
            </>
          )}
        </div>
        {(filledPicks > 0 || ban) && (
          <p className="text-[10px] text-muted-foreground mt-2">
            {filledPicks}/3 picks{hasBans ? ` · ${ban ? "1" : "0"} ban` : ""} selected
          </p>
        )}
      </div>

      {/* Brawler Suggestions — top picks by mode from battle history */}
      <BrawlerSuggestions battleLog={battleLog} currentElo={currentElo} />
    </Card>
  );
}
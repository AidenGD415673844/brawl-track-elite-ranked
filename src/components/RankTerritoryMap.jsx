import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, TrendingUp, TrendingDown, Minus, MapPin, Telescope, ChevronDown, ChevronUp } from "lucide-react";
import { TIER_COLORS, getRank } from "@/lib/ranks";
import { computeTerritory } from "@/lib/rankTerritory";
import { getAvgDeltas } from "@/lib/battleStats";

const THREAT_STYLES = {
  Safe:     { color: "#10b981", bg: "bg-emerald-500/15", border: "border-emerald-500/40", Icon: Shield },
  Elevated: { color: "#f59e0b", bg: "bg-amber-500/15",   border: "border-amber-500/40",   Icon: AlertTriangle },
  Critical: { color: "#ef4444", bg: "bg-red-500/15",     border: "border-red-500/40",     Icon: AlertTriangle },
};

const TREND_ICONS = { advancing: TrendingUp, holding: Minus, retreating: TrendingDown };
const TREND_COLOR = { advancing: "#10b981", holding: "#94a3b8", retreating: "#ef4444" };

export default function RankTerritoryMap({ currentElo, battleLog }) {
  const t = useMemo(() => computeTerritory(currentElo || 0, battleLog || []), [currentElo, battleLog]);
  const c = TIER_COLORS[t.rank.tier];
  const s = THREAT_STYLES[t.threat];
  const TrendIcon = TREND_ICONS[t.trendVector];
  const trendColor = TREND_COLOR[t.trendVector];
  const posPct = t.position * 100;
  const [showForecast, setShowForecast] = useState(false);

  // Build 5-battle scenarios using shared avg deltas (log-driven, fallback 90/-50).
  const scenarios = useMemo(() => {
    const { avgWin, avgLoss } = getAvgDeltas(battleLog || []);
    const base = currentElo || 0;
    const clamp = (v) => Math.max(base >= 3000 ? 3000 : 0, Math.round(v));
    const build = (wins) => {
      const losses = 5 - wins;
      const projected = clamp(base + wins * avgWin + losses * avgLoss);
      const ter = computeTerritory(projected, battleLog || []);
      return {
        wins, losses, projected,
        deltaElo: projected - base,
        control: ter.control,
        threat: ter.threat,
        rank: ter.rank,
      };
    };
    return { all: build(5), split: build(3), none: build(0), avgWin, avgLoss };
  }, [battleLog, currentElo]);



  return (
    <Card
      className="bg-card border-border p-4 sm:p-5 rounded-2xl relative overflow-hidden"
      style={t.threat === "Critical" ? { boxShadow: `inset 0 0 24px ${s.color}44, 0 0 20px ${s.color}22` } : undefined}
    >
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" style={{ color: c.text }} />
          <h3 className="text-sm font-display font-semibold text-foreground">Rank Territory</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-display font-bold uppercase px-2 py-1 rounded-full border ${s.bg} ${s.border}`}
            style={{ color: s.color }}
          >
            <s.Icon className="w-3 h-3" /> {t.threat}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-display font-bold uppercase px-2 py-1 rounded-full border border-border bg-muted/50" style={{ color: trendColor }}>
            <TrendIcon className="w-3 h-3" /> {t.trendVector}
          </span>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-4">
        <span className="font-bold" style={{ color: c.text }}>{t.rank.name}</span> · Territory Control{" "}
        <span className="font-bold" style={{ color: c.text }}>{t.control}%</span>
      </div>

      {/* Territory bar — 3 zones */}
      <div className="relative h-10 rounded-xl overflow-hidden border border-border bg-muted/30">
        {/* Danger zone (0-25%) */}
        <div
          className="absolute inset-y-0 left-0 w-1/4"
          style={{ background: "linear-gradient(90deg, #ef444455, #ef444422)" }}
        >
          <div className="absolute inset-0 territory-pulse-danger" />
        </div>
        {/* Safe harbor (25-75%) */}
        <div
          className="absolute inset-y-0 left-1/4 w-1/2"
          style={{ background: `linear-gradient(90deg, ${c.from}22, ${c.to}22)` }}
        />
        {/* Promotion front (75-100%) */}
        <div
          className="absolute inset-y-0 right-0 w-1/4"
          style={{ background: "linear-gradient(90deg, #fde04722, #fde04755)" }}
        >
          <div className="absolute inset-0 territory-shimmer-promo" />
        </div>
        {/* Zone labels */}
        <div className="absolute inset-0 flex text-[8px] font-display font-bold uppercase tracking-wider pointer-events-none">
          <div className="w-1/4 flex items-center justify-center text-red-400/80">Danger</div>
          <div className="w-1/2 flex items-center justify-center text-muted-foreground">Safe Harbor</div>
          <div className="w-1/4 flex items-center justify-center text-amber-300/90">Promotion</div>
        </div>
        {/* Player marker */}
        <motion.div
          initial={{ left: "0%" }}
          animate={{ left: `${posPct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className="absolute top-0 bottom-0 -ml-[7px] w-[14px] flex flex-col items-center justify-center z-10"
        >
          <div
            className="w-3 h-3 rounded-full ring-2 ring-white"
            style={{ background: c.text, boxShadow: `0 0 12px ${c.glow}` }}
          />
          <div className="absolute -top-4 text-[9px] font-bold whitespace-nowrap" style={{ color: c.text }}>
            YOU
          </div>
        </motion.div>
      </div>

      {/* Range labels */}
      <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
        <span>{t.bandMin.toLocaleString()}</span>
        <span className="font-bold text-foreground">{currentElo?.toLocaleString?.() ?? 0}</span>
        <span>{isFinite(t.bandMax) ? t.bandMax.toLocaleString() : "∞"}</span>
      </div>

      {/* Threat forecast */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-2">
          <div className="text-[9px] font-display font-bold uppercase text-red-400/80">Games to Demo</div>
          <div className="text-lg font-display font-black text-red-400">{t.gamesToDemo}</div>
          <div className="text-[9px] text-muted-foreground">
            {t.distFloor} Elo above floor · avg loss −{t.avgLoss}
          </div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-2">
          <div className="text-[9px] font-display font-bold uppercase text-amber-400/80">Games to Promo</div>
          <div className="text-lg font-display font-black text-amber-300">{t.gamesToPromo}</div>
          <div className="text-[9px] text-muted-foreground">
            {t.distCeil} Elo to ceiling · avg win +{t.avgWin}
          </div>
        </div>
      </div>

      {/* Next 5 games forecast toggle */}
      <button
        onClick={() => setShowForecast((v) => !v)}
        className="mt-4 w-full flex items-center justify-between rounded-xl border border-border bg-muted/30 hover:bg-muted/50 px-3 py-2 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-foreground">
          <Telescope className="w-3.5 h-3.5" style={{ color: c.text }} />
          Next 5 Games Forecast
        </span>
        {showForecast ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence initial={false}>
        {showForecast && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                { key: "all",   label: "5W-0L", data: scenarios.all,   frame: "bg-emerald-500/5 border-emerald-500/30", accent: "text-emerald-400" },
                { key: "split", label: "3W-2L", data: scenarios.split, frame: "bg-cyan-500/5 border-cyan-500/30",       accent: "text-cyan-400" },
                { key: "none",  label: "0W-5L", data: scenarios.none,  frame: "bg-rose-500/5 border-rose-500/30",       accent: "text-rose-400" },
              ].map(({ key, label, data, frame, accent }) => {
                const sf = THREAT_STYLES[data.threat];
                const tierC = TIER_COLORS[data.rank.tier];
                return (
                  <div key={key} className={`rounded-xl border p-2 ${frame}`}>
                    <div className={`text-[9px] font-display font-black uppercase ${accent}`}>{label}</div>
                    <div className="text-sm font-display font-black" style={{ color: tierC.text }}>
                      {data.projected.toLocaleString()}
                    </div>
                    <div className={`text-[9px] font-bold ${data.deltaElo >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {data.deltaElo >= 0 ? "+" : ""}{data.deltaElo} Elo
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[9px] text-muted-foreground">
                      <span>Ctrl</span>
                      <span className="font-bold" style={{ color: tierC.text }}>{data.control}%</span>
                    </div>
                    <div
                      className={`mt-1 inline-flex items-center gap-1 text-[9px] font-display font-bold uppercase px-1.5 py-0.5 rounded-full border ${sf.bg} ${sf.border}`}
                      style={{ color: sf.color }}
                    >
                      <sf.Icon className="w-2.5 h-2.5" /> {data.threat}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[9px] text-muted-foreground text-center">
              Projected using your avg +{scenarios.avgWin} per win · {scenarios.avgLoss} per loss
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

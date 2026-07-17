import React, { useMemo, useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Map, ChevronDown, ChevronUp } from "lucide-react";
import { RANKS, getRank, TIER_COLORS } from "@/lib/ranks";

// ---------- Path to Pro checkpoints ----------
const ELO_POINTS = [
  0, 100, 200, 250, 300, 400, 500, 600, 700, 750, 800, 900, 1000, 1100, 1200,
  1250, 1300, 1400, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3250, 3500, 3750,
  4000, 4250, 4500, 4750, 5000, 5250, 5500, 5750, 6000, 6375, 6750, 7125, 7500,
  7875, 8250, 8750, 9250, 9750, 10250, 10750, 11250, 12000, 13000, 14000, 15000,
];

// Per-tier theme (bg gradient + accent glow). "brightness" scales the whole
// section — used to make late Masters and Pro visibly more radiant.
const TIER_THEME = {
  Bronze:    { bg: "linear-gradient(160deg,#3d1f10 0%,#5a2a12 45%,#8b4513 100%)", stripe: "rgba(251,191,36,0.08)", brightness: 0.9 },
  Silver:    { bg: "linear-gradient(160deg,#1e293b 0%,#334155 55%,#64748b 100%)", stripe: "rgba(226,232,240,0.08)", brightness: 1.0 },
  Gold:      { bg: "linear-gradient(160deg,#3f2a05 0%,#78560f 55%,#ca8a04 100%)", stripe: "rgba(253,224,71,0.10)", brightness: 1.05 },
  Diamond:   { bg: "linear-gradient(160deg,#082f49 0%,#0369a1 55%,#38bdf8 100%)", stripe: "rgba(125,211,252,0.10)", brightness: 1.08 },
  Mythic:    { bg: "linear-gradient(160deg,#2e1065 0%,#6b21a8 55%,#a855f7 100%)", stripe: "rgba(232,121,249,0.10)", brightness: 1.1 },
  Legendary: { bg: "linear-gradient(160deg,#450a0a 0%,#991b1b 55%,#f87171 100%)", stripe: "rgba(252,165,165,0.10)", brightness: 1.15 },
  Masters:   { bg: "linear-gradient(160deg,#450a0a 0%,#9a3412 55%,#ea580c 100%)", stripe: "rgba(251,146,60,0.12)", brightness: 1.2 },
  Pro:       { bg: "linear-gradient(160deg,#78350f 0%,#d97706 40%,#fde047 100%)", stripe: "rgba(253,224,71,0.18)", brightness: 1.35 },
};

// Elo-level brightness boost inside Masters/Pro tiers.
function eloBrightness(elo) {
  if (elo >= 11250) return 1.4;         // Pro base
  if (elo >= 12000) return 1.5;
  if (elo >= 13000) return 1.6;
  if (elo >= 14000) return 1.75;
  if (elo >= 15000) return 1.9;
  if (elo >= 10750) return 1.28;
  if (elo >= 10250) return 1.22;
  if (elo >= 9250)  return 1.14;
  return 1.0;
}

// Build tier bands (groups of consecutive checkpoints sharing a tier).
function buildBands(points) {
  const bands = [];
  let cur = null;
  points.forEach((elo, i) => {
    const tier = getRank(elo).tier;
    if (!cur || cur.tier !== tier) {
      cur = { tier, startIdx: i, endIdx: i, theme: TIER_THEME[tier] };
      bands.push(cur);
    } else {
      cur.endIdx = i;
    }
  });
  return bands;
}

// A single 3D circular checkpoint node.
function Node({ elo, isMajor, isCurrent, isReached, size }) {
  const rank = getRank(elo);
  const c = TIER_COLORS[rank.tier];
  const bright = eloBrightness(elo);
  const glow = isCurrent ? `0 0 24px ${c.glow}, 0 0 8px #fff` : `0 0 14px ${c.glow}`;
  return (
    <div
      className="flex flex-col items-center gap-1.5"
      style={{ width: size + 24 }}
    >
      <div
        className="relative rounded-full flex items-center justify-center shrink-0"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 30% 25%, #fff5 0%, transparent 40%),
                       radial-gradient(circle at 65% 75%, #0006 0%, transparent 55%),
                       linear-gradient(145deg, ${c.from}, ${c.to})`,
          boxShadow: `inset 0 -${Math.round(size * 0.12)}px ${Math.round(size * 0.18)}px #0009,
                      inset 0 ${Math.round(size * 0.08)}px ${Math.round(size * 0.14)}px #fff4,
                      ${glow}`,
          opacity: isReached ? 1 : 0.55,
          filter: `saturate(${bright}) brightness(${Math.min(1.3, bright)})`,
        }}
      >
        {isMajor && (
          <img
            src={rank.image}
            alt={rank.name}
            style={{
              width: size * 0.72,
              height: size * 0.72,
              objectFit: "contain",
              filter: `drop-shadow(0 2px 4px #000a)`,
            }}
          />
        )}
        {!isMajor && (
          <div
            className="font-display font-black"
            style={{
              fontSize: size * 0.32,
              color: "#fff",
              textShadow: "0 2px 4px #0009",
              opacity: 0.85,
            }}
          >
            {Math.round(elo / 100)}
          </div>
        )}
        {isCurrent && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              border: "2px solid #fff",
              animation: "fade-in 0.6s ease-out",
              boxShadow: `0 0 16px #fff, 0 0 24px ${c.glow}`,
            }}
          />
        )}
      </div>
      <div className="text-center leading-tight">
        {isMajor && (
          <p className="text-[10px] font-display font-bold" style={{ color: c.text }}>
            {rank.name}
          </p>
        )}
        <p className={`text-[10px] font-bold ${isReached ? "text-foreground" : "text-muted-foreground"}`}>
          {elo.toLocaleString()} Elo
        </p>
      </div>
    </div>
  );
}

export default function EloJourneyMap({ battleLog, currentElo }) {
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef(null);
  const currentRef = useRef(null);
  const safeElo = Number.isFinite(Number(currentElo)) ? Number(currentElo) : 0;

  const bands = useMemo(() => buildBands(ELO_POINTS), []);

  // Auto-scroll to current position on mount / when Elo changes.
  useEffect(() => {
    if (collapsed) return;
    const t = setTimeout(() => {
      if (currentRef.current && scrollRef.current) {
        const el = currentRef.current;
        const parent = scrollRef.current;
        const target = el.offsetLeft - parent.clientWidth / 2 + el.clientWidth / 2;
        parent.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
      }
    }, 120);
    return () => clearTimeout(t);
  }, [safeElo, collapsed]);

  const currentRank = getRank(safeElo);
  const currentTierColor = TIER_COLORS[currentRank.tier];

  return (
    <Card className="relative bg-card border-border p-4 sm:p-5 rounded-2xl overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 15% 0%, rgba(34,211,238,0.1), transparent 55%), radial-gradient(circle at 90% 100%, rgba(232,121,249,0.08), transparent 60%)",
        }}
      />
      <div className="relative flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_18px_rgba(34,211,238,0.35)]">
            <Map className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-sm font-display font-semibold text-foreground">
            Path to Pro
          </h3>
          <span className="text-[10px] text-muted-foreground">· 0 → 15,000 Elo</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold" style={{ color: currentTierColor.text }}>
            You: {safeElo.toLocaleString()}
          </span>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            {collapsed ? "Show" : "Hide"}
          </button>
        </div>
      </div>

      {collapsed ? null : (
        <div
          ref={scrollRef}
          className="relative overflow-x-auto overflow-y-hidden rounded-xl border border-cyan-500/25 shadow-[0_0_24px_rgba(34,211,238,0.12)_inset]"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorX: "contain",
          }}
        >
          <div className="flex items-stretch min-w-max">
            {bands.map((band, bi) => {
              const bandPoints = ELO_POINTS.slice(band.startIdx, band.endIdx + 1);
              return (
                <div
                  key={bi}
                  className="relative flex items-center py-8 px-4"
                  style={{
                    background: band.theme.bg,
                    borderRight: bi < bands.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                  }}
                >
                  {/* diagonal stripe overlay for texture */}
                  <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `repeating-linear-gradient(45deg, ${band.theme.stripe} 0 2px, transparent 2px 18px)`,
                      opacity: 0.7,
                    }}
                  />
                  {/* tier label banner */}
                  <div
                    className="absolute top-2 left-3 text-[9px] font-display font-black uppercase tracking-widest"
                    style={{ color: TIER_COLORS[band.tier].text, textShadow: "0 1px 3px #000a" }}
                  >
                    {band.tier}
                  </div>

                  {/* connecting trail line */}
                  <div
                    aria-hidden
                    className="absolute left-0 right-0 h-1 top-1/2 -translate-y-1/2"
                    style={{
                      background: `linear-gradient(90deg, ${TIER_COLORS[band.tier].from}88, ${TIER_COLORS[band.tier].to}88)`,
                      boxShadow: `0 0 12px ${TIER_COLORS[band.tier].glow}`,
                    }}
                  />

                  <div className="relative flex items-center gap-4">
                    {bandPoints.map((elo, i) => {
                      const rank = getRank(elo);
                      const isMajor = rank.min === elo;
                      const size = isMajor ? 68 : 42;
                      const isReached = safeElo >= elo;
                      // Determine if this is the "current" node = highest reached checkpoint.
                      const nextInBand = bandPoints[i + 1];
                      const isCurrent =
                        safeElo >= elo &&
                        (nextInBand === undefined ? true : safeElo < nextInBand) &&
                        // and only for the band that actually contains the player
                        band.tier === currentRank.tier;

                      return (
                        <div
                          key={elo}
                          ref={isCurrent ? currentRef : null}
                          className="relative z-10"
                        >
                          <Node
                            elo={elo}
                            isMajor={isMajor}
                            isCurrent={isCurrent}
                            isReached={isReached}
                            size={size}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="relative mt-3 text-[10px] text-muted-foreground text-center">
        Scroll → to trace the road from Bronze to Pro. Reached checkpoints glow; your current stop pulses.
      </p>
    </Card>
  );
}

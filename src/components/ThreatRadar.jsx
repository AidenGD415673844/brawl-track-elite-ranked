import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Radar } from "lucide-react";
import { liveRadarFactors } from "@/lib/clutchIndex";
import { getRank, TIER_COLORS } from "@/lib/ranks";
import { useIsMobile } from "@/hooks/use-mobile";

const AXES = [
  { key: "streak",    label: "Streak" },
  { key: "opponents", label: "Foes" },
  { key: "border",    label: "Border" },
  { key: "form",      label: "Form" },
];

export default function ThreatRadar({ battleLog, currentElo }) {
  const factors = useMemo(() => liveRadarFactors(battleLog || [], currentElo || 0), [battleLog, currentElo]);
  const tier = getRank(currentElo || 0).tier;
  const c = TIER_COLORS[tier];

  const size = 200;
  const cx = size / 2, cy = size / 2;
  const R = 78;

  const angleFor = (i) => (-Math.PI / 2) + (i * 2 * Math.PI) / AXES.length;
  const pt = (i, r) => {
    const a = angleFor(i);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };

  const polygonPts = AXES.map((ax, i) => {
    const v = Math.max(0.05, Math.min(1, factors[ax.key] || 0));
    return pt(i, R * v);
  });
  const dPolygon = polygonPts.map((p) => p.join(",")).join(" ");

  const pressureAvg = Math.round(
    ((factors.streak + factors.opponents + factors.border + factors.form) / 4) * 100
  );

  return (
    <Card className="bg-card border-border p-4 sm:p-5 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Radar className="w-4 h-4" style={{ color: c.text }} />
        <h3 className="text-sm font-display font-semibold text-foreground">Stress Radar</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Live pressure across four vectors · overall {pressureAvg}/100
      </p>

      <div className="flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={c.to} stopOpacity="0.7" />
              <stop offset="100%" stopColor={c.from} stopOpacity="0.35" />
            </radialGradient>
            <linearGradient id="radar-stroke">
              <stop offset="0%" stopColor={c.from} />
              <stop offset="100%" stopColor={c.to} />
            </linearGradient>
          </defs>
          {/* Rings */}
          {[0.25, 0.5, 0.75, 1].map((f, i) => (
            <circle key={i} cx={cx} cy={cy} r={R * f} fill="none" stroke="currentColor" strokeOpacity="0.1" />
          ))}
          {/* Spokes + labels */}
          {AXES.map((ax, i) => {
            const [x, y] = pt(i, R);
            const [lx, ly] = pt(i, R + 14);
            return (
              <g key={ax.key}>
                <line x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" strokeOpacity="0.12" />
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                      fontSize="9" fill="currentColor" opacity="0.7"
                      className="font-display font-bold uppercase tracking-wider">
                  {ax.label}
                </text>
              </g>
            );
          })}
          {/* Sweep */}
          <circle
            cx={cx} cy={cy} r={R}
            fill="none" stroke="url(#radar-stroke)" strokeWidth="0.8" strokeOpacity="0.4"
            className="radar-sweep-ring"
          />
          {/* Data polygon */}
          <motion.polygon
            points={dPolygon}
            fill="url(#radar-fill)"
            stroke="url(#radar-stroke)"
            strokeWidth="2"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ transformOrigin: `${cx}px ${cy}px`, filter: `drop-shadow(0 0 12px ${c.glow})` }}
          />
          {/* Dots at each axis value */}
          {polygonPts.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={3} fill={c.text} />
          ))}
        </svg>
      </div>
    </Card>
  );
}

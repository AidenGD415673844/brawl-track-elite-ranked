import React from "react";
import { Shield } from "lucide-react";

const ROWS = [
  { rank: "Bronze I – Diamond III", gap: "±8 ranks" },
  { rank: "Mythic I – Masters I", gap: "±3 ranks" },
  { rank: "Masters II – Pro", gap: "±1 rank" },
];

const CROSS_TIER_RULES = [
  {
    rule: "Gold or below ↔ Diamond",
    detail: "Pre-made Diamond teammates allowed only if ≥1 enemy is Diamond. Randoms & enemies cannot be Diamond unless you are Diamond.",
  },
  {
    rule: "Diamond ↔ Mythic",
    detail: "Pre-made Mythic teammates allowed only if ≥1 enemy is Mythic. Randoms & enemies cannot be Mythic unless you are Mythic.",
  },
];

// TeamRestrictionsTable — compact reference table showing ranked team
// matchmaking restrictions based on the highest-ranked player in the party.
export default function TeamRestrictionsTable() {
  return (
    <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
        <Shield className="w-3.5 h-3.5 text-cyan-500" />
        <span className="text-[10px] font-display font-bold text-foreground uppercase tracking-wide">
          Team Restrictions in Ranked
        </span>
      </div>
      <table className="w-full text-[10px]">
        <thead>
          <tr className="bg-muted/40 text-muted-foreground">
            <th className="text-left px-3 py-1.5 font-bold uppercase">Rank</th>
            <th className="text-right px-3 py-1.5 font-bold uppercase">Teammate Restriction</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => (
            <tr
              key={i}
              className={i % 2 === 0 ? "bg-transparent" : "bg-muted/20"}
            >
              <td className="px-3 py-1.5 text-foreground font-medium">{row.rank}</td>
              <td className="px-3 py-1.5 text-right text-cyan-500 font-bold">{row.gap}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-3 py-1.5 text-[9px] text-muted-foreground border-t border-border">
        Based on the highest-ranked player in your party.
      </p>

      {/* Cross-tier matchmaking rules */}
      <div className="px-3 py-2 bg-muted/30 border-t border-border space-y-1.5">
        {CROSS_TIER_RULES.map((r, i) => (
          <div key={i} className="space-y-0.5">
            <p className="text-[10px] font-bold text-cyan-500">{r.rule}</p>
            <p className="text-[9px] text-muted-foreground leading-tight">{r.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
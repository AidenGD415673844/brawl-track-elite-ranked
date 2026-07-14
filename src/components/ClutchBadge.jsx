import React from "react";
import { Snowflake, Flame, ShieldOff } from "lucide-react";

const STYLES = {
  fire:    { cls: "bg-orange-500/15 text-orange-500 border-orange-500/40",  Icon: Flame,       label: "CLUTCH" },
  shatter: { cls: "bg-red-500/15 text-red-500 border-red-500/40",           Icon: ShieldOff,   label: "CHOKE" },
  ice:     { cls: "bg-cyan-500/15 text-cyan-400 border-cyan-500/40",        Icon: Snowflake,   label: "ICE" },
};

export default function ClutchBadge({ kind, pressure }) {
  if (!kind) return null;
  const s = STYLES[kind];
  if (!s) return null;
  const { Icon } = s;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-display font-bold px-1.5 py-0.5 rounded border ${s.cls}`}
      title={pressure ? `Pressure ${pressure}/100` : undefined}
    >
      <Icon className="w-3 h-3" />
      {s.label}
      {pressure ? <span className="opacity-70">{pressure}</span> : null}
    </span>
  );
}

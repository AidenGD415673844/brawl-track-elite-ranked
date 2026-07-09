import React from "react";
import { BRAWLERS } from "@/lib/brawlers";

export default function BrawlerSelect({ value, onChange, className = "", disabled = false }) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
      className={`bg-muted border border-border text-foreground text-[10px] rounded-md px-1.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 min-w-0 ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
    >
      <option value="">Brawler...</option>
      {BRAWLERS.map((b) => (
        <option key={b} value={b}>{b}</option>
      ))}
    </select>
  );
}
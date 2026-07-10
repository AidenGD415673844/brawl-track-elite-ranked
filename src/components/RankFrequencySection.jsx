import React, { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TIER_IMAGES, TIER_COLORS } from "@/lib/ranks";
import {
  getRankFrequency, setAllRankFrequency, TRACKED_TIERS,
} from "@/lib/rankFrequency";


// RankFrequencySection — displays how many times the player has reached
// each tier, with escalating visual effects (1=icon, 2=glow, 3=particles,
// 4+=mastery frame). Editable via pencil toggle.
export default function RankFrequencySection({ peakTier }) {
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({});

  const freq = getRankFrequency();

  // Only show tiers the player has reached at least once
  const reachedTiers = TRACKED_TIERS.filter((tier) => (freq[tier] || 0) > 0);

  const handleEdit = () => {
    setEditValues({ ...freq });
    setEditing(true);
  };

  const handleSave = () => {
    setAllRankFrequency(editValues);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditValues({});
  };

  if (editing) {
    return (
      <div className="w-full rounded-xl border p-4" style={{ background: "rgba(0,0,0,0.4)", borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-display font-bold text-foreground">Rank Frequency Editor</p>
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} className="h-7 px-3 bg-emerald-500 text-white rounded-lg">
              <Check className="w-3 h-3 mr-1" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="h-7 px-3 border-border rounded-lg">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">
          Enter how many times you've reached each tier across all seasons.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TRACKED_TIERS.map((tier) => {
            const c = TIER_COLORS[tier];
            return (
              <div key={tier} className="flex items-center gap-2">
                <img src={TIER_IMAGES[tier]} alt={tier} className="w-7 h-7 object-contain" />
                <span className="text-[10px] font-bold flex-1" style={{ color: c.text }}>{tier}</span>
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={editValues[tier] || 0}
                  onChange={(e) => setEditValues((prev) => ({ ...prev, [tier]: Number(e.target.value) || 0 }))}
                  className="bg-muted border-border text-foreground text-xs h-7 w-14"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (reachedTiers.length === 0) {
    return (
      <div className="w-full rounded-xl border p-4 text-center" style={{ background: "rgba(0,0,0,0.3)", borderColor: "rgba(255,255,255,0.08)" }}>
        <p className="text-xs text-muted-foreground">
          No rank frequency data yet.{" "}
          <button onClick={handleEdit} className="text-cyan-400 underline">
            Set your counts
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border p-4" style={{ background: "rgba(0,0,0,0.4)", borderColor: "rgba(255,255,255,0.1)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-display font-bold text-foreground">Rank Frequency</p>
        <Button size="sm" variant="ghost" onClick={handleEdit} className="h-7 px-2 text-[10px]">
          <Pencil className="w-3 h-3 mr-1" /> Edit
        </Button>
      </div>
      <div className="flex items-center justify-center flex-wrap gap-3">
        {reachedTiers.map((tier) => {
          const count = freq[tier] || 0;
          const c = TIER_COLORS[tier];
          const img = TIER_IMAGES[tier];
          return (
            <FrequencyBadge key={tier} tier={tier} count={count} color={c} image={img} />
          );
        })}

      </div>
    </div>
  );
}

function Star({ lit, color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path
        d="M12,2 L14.5,9 L22,9.5 L16,14.5 L18,22 L12,17.5 L6,22 L8,14.5 L2,9.5 L9.5,9 Z"
        fill={lit ? color.text : "rgba(255,255,255,0.12)"}
        stroke={lit ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.25)"}
        strokeWidth="1"
        style={
          lit
            ? { filter: `drop-shadow(0 0 4px ${color.glow || color.text})` }
            : undefined
        }
      />
    </svg>
  );
}

function FrequencyBadge({ tier, count, color, image }) {
  const lit = Math.min(6, count);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative flex flex-col items-center gap-1"
    >
      <img
        src={image}
        alt={tier}
        className="w-10 h-10 object-contain"
        style={{ filter: `drop-shadow(0 0 5px ${color.glow || color.text})` }}
      />
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Star key={i} lit={i < lit} color={color} />
        ))}
      </div>
      <span className="text-[9px] font-bold" style={{ color: color.text }}>
        {tier}
      </span>
      <span className="text-[8px] text-muted-foreground">
        {Math.min(count, 6)}/6{count > 6 ? ` (${count}x)` : ""}
      </span>
    </motion.div>
  );
}

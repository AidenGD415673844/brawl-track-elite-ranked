import React, { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TIER_IMAGES, TIER_COLORS } from "@/lib/ranks";
import {
  getRankFrequency, setAllRankFrequency, getEffectLevel, TRACKED_TIERS,
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
          const level = getEffectLevel(count);
          const c = TIER_COLORS[tier];
          const img = TIER_IMAGES[tier];

          return (
            <FrequencyBadge key={tier} tier={tier} count={count} level={level} color={c} image={img} />
          );
        })}
      </div>
    </div>
  );
}

function FrequencyBadge({ tier, count, level, color, image }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative flex flex-col items-center"
    >
      <div className="relative">
        {/* Level 2: glow ring */}
        {level >= 2 && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: `0 0 15px ${color.glow}, 0 0 30px ${color.glow}` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        {/* Level 4: mastery frame */}
        {level >= 4 && (
          <motion.div
            className="absolute -inset-2 rounded-full border-2"
            style={{ borderColor: color.text, boxShadow: `0 0 20px ${color.glow}` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        )}
        <img
          src={image}
          alt={tier}
          className="relative w-10 h-10 object-contain"
          style={{ filter: `drop-shadow(0 0 ${level >= 3 ? 10 : 5}px ${color.glow})` }}
        />
        {/* Level 3: particles */}
        {level >= 3 && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  background: color.text,
                  top: "50%",
                  left: "50%",
                }}
                animate={{
                  x: [0, Math.cos((i * Math.PI) / 2) * 25],
                  y: [0, Math.sin((i * Math.PI) / 2) * 25],
                  opacity: [1, 0],
                  scale: [1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </div>
      <span className="text-[9px] font-bold mt-1" style={{ color: color.text }}>
        {tier}
      </span>
      <span className="text-[8px] text-muted-foreground">
        {count}x
      </span>
    </motion.div>
  );
}
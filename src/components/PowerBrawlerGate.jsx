import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Zap } from "lucide-react";

// Check if the player is gated from playing ranked battles.
// Bronze–Gold (0-2999):  3× Power 9   (official Ranked 3.0 rules)
// Diamond  (3000-4499):  9× Power 9
// Mythic+  (4500+):     12× Power 11
export function getGateStatus(playerElo, power9Brawlers = 0, power11Brawlers = 0) {
  if (playerElo >= 4500 && power11Brawlers < 12) {
    return {
      active: true,
      tier: "Mythic",
      required: 12,
      current: power11Brawlers,
      needed: 12 - power11Brawlers,
      powerLevel: 11,
      eloFloor: 4500,
    };
  }
  if (playerElo >= 3000 && power9Brawlers < 9) {
    return {
      active: true,
      tier: "Diamond",
      required: 9,
      current: power9Brawlers,
      needed: 9 - power9Brawlers,
      powerLevel: 9,
      eloFloor: 3000,
    };
  }
  // Bronze–Gold: need 3 Power 9 brawlers to enter Ranked
  if (playerElo < 3000 && power9Brawlers < 3) {
    return {
      active: true,
      tier: "Bronze",
      required: 3,
      current: power9Brawlers,
      needed: 3 - power9Brawlers,
      powerLevel: 9,
      eloFloor: 0,
    };
  }
  return { active: false };
}

const GATE_THEMES = {
  Bronze: {
    container: "bg-gradient-to-br from-amber-900/40 via-orange-800/20 to-amber-900/30 border-amber-500/30",
    badge: "bg-amber-500/20 text-amber-300",
    text: "#fbbf24",
    button: "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white",
    shardBg: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(180,83,9,0.05))",
    shardBorder: "rgba(251,191,36,0.1)",
    iconFrom: "#fbbf24",
    iconTo: "#b45309",
    iconGlow: "rgba(251,191,36,0.5)",
  },
  Diamond: {
    container: "bg-gradient-to-br from-blue-900/40 via-sky-800/20 to-blue-900/30 border-sky-500/30",
    badge: "bg-sky-500/20 text-sky-300",
    text: "#7dd3fc",
    button: "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white",
    shardBg: "linear-gradient(135deg, rgba(56,189,248,0.15), rgba(2,132,199,0.05))",
    shardBorder: "rgba(56,189,248,0.1)",
    iconFrom: "#38bdf8",
    iconTo: "#0284c7",
    iconGlow: "rgba(56,189,248,0.5)",
  },
  Mythic: {
    container: "bg-gradient-to-br from-purple-900/40 via-violet-900/20 to-purple-950/30 border-purple-500/30",
    badge: "bg-purple-500/20 text-purple-300",
    text: "#e879f9",
    button: "bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-400 hover:to-fuchsia-500 text-white",
    shardBg: "linear-gradient(135deg, rgba(168,85,247,0.12), rgba(88,28,135,0.04))",
    shardBorder: "rgba(168,85,247,0.08)",
    iconFrom: "#a855f7",
    iconTo: "#581c87",
    iconGlow: "rgba(168,85,247,0.5)",
  },
};

function GateShard({ style, theme }) {
  return (
    <div
      className="absolute rounded-sm"
      style={{
        ...style,
        transform: `${style.transform || ""} rotate(45deg)`,
        background: theme.shardBg,
        border: `1px solid ${theme.shardBorder}`,
      }}
    />
  );
}

function BigGateIcon({ tier, theme }) {
  if (tier === "Mythic") {
    return (
      <div
        className="relative flex items-center justify-center"
        style={{ transform: "rotate(20deg)", width: 90, height: 80 }}
      >
        <svg viewBox="0 0 100 80" className="w-full h-full" style={{ filter: `drop-shadow(0 0 20px ${theme.iconGlow})` }}>
          <defs>
            <linearGradient id="mythicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.iconFrom} />
              <stop offset="50%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor={theme.iconTo} />
            </linearGradient>
          </defs>
          <path
            d="M 10 70 L 20 25 L 35 50 L 50 15 L 65 50 L 80 25 L 90 70 Z"
            fill="url(#mythicGrad)"
            stroke="rgba(216,180,254,0.4)"
            strokeWidth="2"
          />
          <rect x="10" y="68" width="80" height="8" rx="2" fill="url(#mythicGrad)" />
        </svg>
      </div>
    );
  }
  // Bronze and Diamond use a diamond/gem shape
  return (
    <div className="relative" style={{ transform: "rotate(20deg)", width: 80, height: 80 }}>
      <div
        className="w-full h-full"
        style={{
          transform: "rotate(45deg)",
          background: `linear-gradient(135deg, ${theme.iconFrom}, ${theme.iconTo})`,
          borderRadius: "12px",
          boxShadow: `0 0 40px ${theme.iconGlow}, inset 0 0 20px rgba(255,255,255,0.2)`,
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ transform: "translate(-50%, -50%) rotate(-45deg)" }}
      >
        <Zap className="w-8 h-8 text-white/80" />
      </div>
    </div>
  );
}

export default function PowerBrawlerGate({
  gateStatus,
  power9Brawlers = 0,
  power11Brawlers = 0,
  matePower9 = [0, 0],
  matePower11 = [0, 0],
  onUpdate,
}) {
  const [localP9, setLocalP9] = useState(String(power9Brawlers || ""));
  const [localP11, setLocalP11] = useState(String(power11Brawlers || ""));
  const [localMateP9, setLocalMateP9] = useState(matePower9.map(String));
  const [localMateP11, setLocalMateP11] = useState(matePower11.map(String));

  if (!gateStatus.active) return null;

  const theme = GATE_THEMES[gateStatus.tier] || GATE_THEMES.Diamond;

  const handleSave = () => {
    onUpdate?.({
      power9Brawlers: Number(localP9) || 0,
      power11Brawlers: Number(localP11) || 0,
      matePower9: localMateP9.map((v) => Number(v) || 0),
      matePower11: localMateP11.map((v) => Number(v) || 0),
    });
  };

  const shards = [
    { top: "10%", left: "5%", width: 30, height: 30, transform: "rotate(15deg)" },
    { top: "20%", left: "85%", width: 20, height: 20, transform: "rotate(-10deg)" },
    { top: "60%", left: "10%", width: 25, height: 25, transform: "rotate(25deg)" },
    { top: "70%", left: "80%", width: 35, height: 35, transform: "rotate(-20deg)" },
    { top: "40%", left: "92%", width: 15, height: 15, transform: "rotate(5deg)" },
    { top: "85%", left: "50%", width: 20, height: 20, transform: "rotate(30deg)" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-2xl border p-6 ${theme.container}`}
    >
      {/* Background shards */}
      {shards.map((s, i) => (
        <GateShard key={i} style={s} theme={theme} />
      ))}

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Lock badge */}
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 mb-4 ${theme.badge}`}>
          <Lock className="w-3 h-3" />
          <span className="text-[10px] font-display font-bold uppercase tracking-wider">Ranked Locked</span>
        </div>

        {/* Big tilted icon */}
        <div className="mb-4">
          <BigGateIcon tier={gateStatus.tier} theme={theme} />
        </div>

        {/* Gate message */}
        <h2
          className="font-display text-xl sm:text-2xl font-black mb-2 px-4"
          style={{ color: theme.text }}
        >
          You need {gateStatus.needed} brawler{gateStatus.needed !== 1 ? "s" : ""} at power level {gateStatus.powerLevel} to play in {gateStatus.tier}
        </h2>

        <p className="text-[11px] text-muted-foreground mb-5 max-w-md">
          You currently have {gateStatus.current} of {gateStatus.required} required power {gateStatus.powerLevel} brawlers.
          Enter your counts below to unlock ranked play.
        </p>

        {/* Input section */}
        <div className="w-full max-w-md space-y-3">
          {/* Player inputs */}
          <div className="rounded-xl bg-background/60 border border-border/50 p-3 space-y-2">
            <p className="text-[10px] font-display font-bold text-foreground/70 uppercase">Your Brawlers</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Power 9 Count</Label>
                <Input
                  type="number"
                  min="0"
                  value={localP9}
                  onChange={(e) => setLocalP9(e.target.value)}
                  placeholder="0"
                  className="bg-muted border-border text-foreground text-sm h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Power 11 Count</Label>
                <Input
                  type="number"
                  min="0"
                  value={localP11}
                  onChange={(e) => setLocalP11(e.target.value)}
                  placeholder="0"
                  className="bg-muted border-border text-foreground text-sm h-9"
                />
              </div>
            </div>
          </div>


          <button
            onClick={handleSave}
            className={`w-full py-2.5 rounded-xl font-display font-bold text-sm transition ${theme.button}`}
          >
            Update Brawler Counts
          </button>
        </div>
      </div>
    </motion.div>
  );
}
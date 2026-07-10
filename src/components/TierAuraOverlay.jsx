import React, { useMemo } from "react";

// Full-card tier-specific animated auras.
// All effects run on a 2s ease-in-out cadence for a smooth, premium feel.
// Absolutely-positioned overlays with pointer-events: none.

const DURATION = "2s";

function ProAura() {
  const particles = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        left: `${10 + i * 14}%`,
        x: `${(Math.random() - 0.5) * 20}px`,
        delay: `${(i * 0.3).toFixed(2)}s`,
        size: 3 + Math.random() * 2,
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Prismatic sheen sweep */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, transparent 40%, rgba(254,249,195,0.35) 48%, rgba(255,255,255,0.55) 50%, rgba(254,215,170,0.35) 52%, transparent 60%)",
          animation: `pro-sheen ${DURATION} ease-in-out infinite`,
          mixBlendMode: "screen",
        }}
      />
      {/* Rising golden particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute bottom-0 rounded-full"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: "#fef9c3",
            boxShadow: "0 0 6px rgba(250,204,21,0.9)",
            "--x": p.x,
            animation: `pro-float ${DURATION} ${p.delay} ease-in-out infinite`,
          }}
        />
      ))}
      {/* Soft top glow */}
      <div
        className="absolute inset-x-0 top-0 h-1/3"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(254,249,195,0.35), transparent 70%)",
        }}
      />
    </div>
  );
}

function MastersAura() {
  const orbiters = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        r: `${38 + Math.random() * 10}px`,
        delay: `${(i * 0.33).toFixed(2)}s`,
        size: 3 + Math.random() * 2,
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Radial gold pulse */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          transform: "translate(-50%,-50%)",
          width: 90,
          height: 90,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(254,249,195,0.9) 0%, rgba(251,191,36,0.6) 40%, rgba(146,64,14,0) 75%)",
          filter: "blur(2px)",
          animation: `masters-pulse ${DURATION} ease-in-out infinite`,
        }}
      />
      {/* Orbit debris */}
      {orbiters.map((o, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: o.size,
            height: o.size,
            marginLeft: -o.size / 2,
            marginTop: -o.size / 2,
            background: "#fde68a",
            boxShadow: "0 0 6px rgba(251,191,36,0.9)",
            "--r": o.r,
            animation: `masters-orbit ${DURATION} ${o.delay} linear infinite`,
          }}
        />
      ))}
      {/* Bottom vignette */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/5"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 100%, rgba(251,191,36,0.25), transparent 70%)",
        }}
      />
    </div>
  );
}

function LegendaryAura() {
  const embers = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => ({
        left: `${8 + i * 13}%`,
        dx: `${(Math.random() - 0.5) * 30}px`,
        delay: `${(i * 0.28).toFixed(2)}s`,
        size: 3 + Math.random() * 2.5,
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Smooth neon border pulse */}
      <div
        className="absolute inset-1 rounded-lg"
        style={{
          animation: `legendary-border ${DURATION} ease-in-out infinite`,
        }}
      />
      {/* Rising embers */}
      {embers.map((e, i) => (
        <div
          key={i}
          className="absolute bottom-0 rounded-full"
          style={{
            left: e.left,
            width: e.size,
            height: e.size,
            background: "radial-gradient(circle, #fed7aa 0%, #f97316 60%, transparent 90%)",
            boxShadow: "0 0 8px rgba(249,115,22,0.9)",
            "--dx": e.dx,
            animation: `legendary-ember ${DURATION} ${e.delay} ease-in-out infinite`,
          }}
        />
      ))}
      {/* Bottom fire glow */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "radial-gradient(ellipse 90% 100% at 50% 100%, rgba(249,115,22,0.4), transparent 70%)",
        }}
      />
    </div>
  );
}

function MythicAura() {
  const particles = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        left: `${5 + i * 12}%`,
        dx: `${(Math.random() - 0.5) * 25}px`,
        delay: `${(i * 0.25).toFixed(2)}s`,
        size: 2.5 + Math.random() * 2,
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Slow cosmic nebula drift */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "conic-gradient(from 0deg at 50% 50%, rgba(217,70,239,0) 0deg, rgba(217,70,239,0.35) 90deg, rgba(139,92,246,0.2) 180deg, rgba(232,121,249,0.35) 270deg, rgba(217,70,239,0) 360deg)",
          animation: `mythic-nebula ${DURATION} ease-in-out infinite`,
          mixBlendMode: "screen",
          filter: "blur(6px)",
        }}
      />
      {/* Soft violet particles rising */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute bottom-0 rounded-full"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: "#f0abfc",
            boxShadow: "0 0 8px rgba(232,121,249,0.9)",
            "--dx": p.dx,
            animation: `mythic-particle ${DURATION} ${p.delay} ease-in-out infinite`,
          }}
        />
      ))}
      {/* Center soft glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(240,171,252,0.2), transparent 60%)",
        }}
      />
    </div>
  );
}

function DiamondAura() {
  const drift = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => {
        const a = Math.random() * Math.PI * 2;
        const d = 30 + Math.random() * 30;
        return {
          left: `${20 + (i * 60) / 8}%`,
          top: `${40 + Math.random() * 30}%`,
          dx: `${Math.cos(a) * d}px`,
          dy: `${Math.sin(a) * d - 40}px`,
          delay: `${(i * 0.25).toFixed(2)}s`,
        };
      }),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Soft shimmer sweep */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, transparent 45%, rgba(224,242,254,0.5) 50%, transparent 55%)",
          animation: `diamond-shimmer ${DURATION} ease-in-out infinite`,
          mixBlendMode: "screen",
        }}
      />
      {/* Ice shards drifting */}
      {drift.map((s, i) => (
        <svg
          key={i}
          width="8"
          height="8"
          viewBox="0 0 10 10"
          className="absolute"
          style={{
            left: s.left,
            top: s.top,
            "--dx": s.dx,
            "--dy": s.dy,
            animation: `diamond-drift ${DURATION} ${s.delay} ease-in-out infinite`,
            filter: "drop-shadow(0 0 4px #7dd3fc)",
          }}
        >
          <polygon points="5,0 6,4 10,5 6,6 5,10 4,6 0,5 4,4" fill="#e0f2fe" />
        </svg>
      ))}
      {/* Center depth glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(125,211,252,0.2), transparent 60%)",
        }}
      />
    </div>
  );
}

function GoldAura() {
  const sparks = useMemo(
    () =>
      Array.from({ length: 10 }).map(() => {
        const a = Math.random() * Math.PI * 2;
        const d = 40 + Math.random() * 45;
        return {
          dx: `${Math.cos(a) * d}px`,
          dy: `${Math.sin(a) * d}px`,
          delay: `${(Math.random() * 1.5).toFixed(2)}s`,
          size: 2 + Math.random() * 2,
        };
      }),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(253,224,71,0) 0%, rgba(250,204,21,0.6) 40%, rgba(217,119,6,0.8) 50%, rgba(250,204,21,0.6) 60%, rgba(253,224,71,0) 100%)",
          backgroundSize: "200% 100%",
          animation: `gold-tempest ${DURATION} linear infinite`,
          mixBlendMode: "screen",
        }}
      />
      {sparks.map((s, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: s.size,
            height: s.size,
            background: "#fef08a",
            boxShadow: "0 0 6px #facc15",
            "--dx": s.dx,
            "--dy": s.dy,
            animation: `gold-spark ${DURATION} ${s.delay} ease-out infinite`,
          }}
        />
      ))}
      <div
        className="absolute inset-1 rounded-lg"
        style={{
          boxShadow:
            "inset 0 0 18px 4px rgba(250,204,21,0.7), inset 0 0 4px 1px rgba(255,255,255,0.6)",
          animation: `gold-sunburst ${DURATION} ease-in-out infinite`,
        }}
      />
    </div>
  );
}

function SilverAura() {
  const sparks = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        left: `${8 + (i * 84) / 10 + Math.random() * 4}%`,
        delay: `${(Math.random() * 1.6).toFixed(2)}s`,
        size: 2 + Math.random() * 2.5,
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(226,232,240,0) 0%, rgba(148,163,184,0.5) 50%, rgba(226,232,240,0) 100%)",
          animation: `silver-kinetic ${DURATION} ease-in-out infinite`,
          mixBlendMode: "screen",
        }}
      />
      {sparks.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: s.left,
            bottom: 0,
            width: s.size,
            height: s.size * 3,
            background: "linear-gradient(180deg, #f1f5f9 0%, transparent 100%)",
            boxShadow: "0 0 4px #cbd5e1",
            animation: `silver-spark-up ${DURATION} ${s.delay} ease-out infinite`,
          }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, transparent 40%, rgba(241,245,249,0.9) 50%, transparent 60%)",
          animation: `silver-sheen ${DURATION} ease-in-out infinite`,
        }}
      />
    </div>
  );
}

function BronzeAura() {
  const embers = useMemo(
    () =>
      Array.from({ length: 8 }).map(() => {
        const a = Math.random() * Math.PI * 2;
        const d = 30 + Math.random() * 40;
        return {
          dx: `${Math.cos(a) * d}px`,
          dy: `${Math.sin(a) * d}px`,
          delay: `${(Math.random() * 1.5).toFixed(2)}s`,
          size: 2 + Math.random() * 2,
        };
      }),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(80deg, rgba(120,53,15,0.3) 0 3px, rgba(180,83,9,0.15) 3px 8px, transparent 8px 14px)",
          backgroundSize: "200% 200%",
          animation: `bronze-sandstorm ${DURATION} linear infinite`,
          mixBlendMode: "multiply",
        }}
      />
      {embers.map((e, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: e.size,
            height: e.size,
            background: "#f97316",
            boxShadow: "0 0 4px #c2410c",
            "--dx": e.dx,
            "--dy": e.dy,
            animation: `bronze-ember ${DURATION} ${e.delay} ease-out infinite`,
          }}
        />
      ))}
      <div
        className="absolute inset-x-0 top-1/2 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(217,119,6,0.9), transparent)",
          animation: `bronze-friction ${DURATION} ease-in-out infinite`,
        }}
      />
    </div>
  );
}

const TIER_COMPONENTS = {
  Pro: ProAura,
  Masters: MastersAura,
  Legendary: LegendaryAura,
  Mythic: MythicAura,
  Diamond: DiamondAura,
  Gold: GoldAura,
  Silver: SilverAura,
  Bronze: BronzeAura,
};

export default function TierAuraOverlay({ tier, active = true }) {
  if (!active) return null;
  const Aura = TIER_COMPONENTS[tier];
  if (!Aura) return null;
  return <Aura />;
}

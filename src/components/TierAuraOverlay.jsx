import React, { useMemo } from "react";

// Full-card tier-specific animated auras.
// Each tier gets a signature effect that loops so unlocked cards feel alive.
// Effects are absolutely-positioned inside the card (pointer-events: none)
// so they never block clicks. Kept dependency-free — pure CSS/SVG.

// Shared path that traces the inside of a rounded card frame,
// used by CSS Motion Path for "orbit-the-frame" effects.
const FRAME_PATH =
  "M12 4 H88 Q96 4 96 12 V88 Q96 96 88 96 H12 Q4 96 4 88 V12 Q4 4 12 4 Z";

function FrameOrbit({ children, duration = "0.8s", delay = "0s", iteration = "infinite" }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ perspective: 400 }}
    >
      <div
        style={{
          position: "absolute",
          offsetPath: `path("${FRAME_PATH}")`,
          WebkitOffsetPath: `path("${FRAME_PATH}")`,
          offsetRotate: "auto",
          animation: `pro-arrow-orbit ${duration} linear ${delay} ${iteration}`,
          left: 0,
          top: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Individual tier renderers ────────────────────────────────

function ProAura() {
  return (
    <FrameOrbit duration="0.8s">
      <div style={{ transform: "translate(-50%, -50%)" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3 L20 15 L14 15 L14 21 L10 21 L10 15 L4 15 Z"
            fill="#bbf7d0"
            stroke="#86efac"
            strokeWidth="1"
            style={{ filter: "drop-shadow(0 0 6px #86efac)" }}
          />
        </svg>
      </div>
    </FrameOrbit>
  );
}

function MastersAura() {
  const debris = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const dist = 60 + Math.random() * 40;
        return {
          dx: `${Math.cos(angle) * dist}px`,
          dy: `${Math.sin(angle) * dist}px`,
          size: 3 + Math.random() * 4,
          delay: Math.random() * 0.1,
        };
      }),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Flash core */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          transform: "translate(-50%,-50%)",
          width: 40,
          height: 40,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,240,200,1) 0%, rgba(251,191,36,0.9) 30%, rgba(180,83,9,0) 70%)",
          animation: "masters-explode 0.8s ease-out infinite",
        }}
      />
      {/* Debris shards */}
      {debris.map((d, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2"
          style={{
            width: d.size,
            height: d.size,
            background: "#e7e5e4",
            borderRadius: 1,
            "--dx": d.dx,
            "--dy": d.dy,
            animation: `masters-debris 0.8s ${d.delay}s ease-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

function LegendaryAura() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.95 }}>
      <FrameOrbit duration="0.8s">
        <div
          style={{
            transform: "translate(-50%,-50%)",
            width: 42,
            height: 42,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(254,240,138,1) 0%, rgba(249,115,22,0.95) 35%, rgba(220,38,38,0.7) 60%, rgba(120,20,10,0) 85%)",
            filter: "blur(1px)",
            animation: "legendary-flicker 0.25s ease-in-out infinite",
          }}
        />
      </FrameOrbit>
      {/* Second flame trailing */}
      <FrameOrbit duration="0.8s" delay="-0.4s">
        <div
          style={{
            transform: "translate(-50%,-50%)",
            width: 30,
            height: 30,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(254,215,170,0.95) 0%, rgba(234,88,12,0.9) 45%, rgba(120,20,10,0) 85%)",
            filter: "blur(1.5px)",
            animation: "legendary-flicker 0.25s ease-in-out infinite",
          }}
        />
      </FrameOrbit>
    </div>
  );
}

function MythicAura() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Cosmic vortex */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "conic-gradient(from 0deg at 50% 50%, rgba(217,70,239,0) 0deg, rgba(217,70,239,0.7) 60deg, rgba(139,92,246,0.3) 120deg, rgba(217,70,239,0.8) 180deg, rgba(88,28,135,0) 240deg, rgba(236,72,153,0.6) 300deg, rgba(217,70,239,0) 360deg)",
          animation: "mythic-vortex-spin 0.8s linear infinite",
          mixBlendMode: "screen",
        }}
      />
      {/* Lightning bolts */}
      {[0, 1, 2].map((i) => (
        <svg
          key={i}
          className="absolute inset-0"
          viewBox="0 0 100 100"
          style={{
            animation: `mythic-lightning 0.8s ${i * 0.13}s linear infinite`,
            filter: "drop-shadow(0 0 4px #a855f7)",
          }}
          preserveAspectRatio="none"
        >
          <path
            d={i === 0
              ? "M10 15 L45 40 L30 45 L60 85"
              : i === 1
                ? "M90 20 L55 45 L70 50 L40 85"
                : "M20 80 L50 55 L45 50 L80 20"}
            fill="none"
            stroke="#c084fc"
            strokeWidth="1.4"
          />
        </svg>
      ))}
      {/* Supernova flares from borders */}
      {[
        { top: 0, left: "50%" },
        { top: "50%", left: 0 },
        { bottom: 0, left: "50%" },
        { top: "50%", right: 0 },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            ...pos,
            width: 30,
            height: 30,
            transform: "translate(-50%,-50%)",
            background:
              "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(232,121,249,0.9) 40%, rgba(0,0,0,0) 70%)",
            animation: `mythic-supernova 0.8s ${i * 0.12}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

function DiamondAura() {
  const shards = useMemo(
    () =>
      Array.from({ length: 10 }).map(() => {
        const a = Math.random() * Math.PI * 2;
        const d = 60 + Math.random() * 50;
        return {
          dx: `${Math.cos(a) * d}px`,
          dy: `${Math.sin(a) * d}px`,
          rot: `${Math.random() * 360}deg`,
          delay: Math.random() * 0.3,
        };
      }),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Blizzard streaks */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(75deg, transparent 0 6px, rgba(207,250,254,0.5) 6px 7px, transparent 7px 14px)",
          animation: "diamond-blizzard 0.8s linear infinite",
          mixBlendMode: "screen",
        }}
      />
      {/* Ice shards */}
      {shards.map((s, i) => (
        <svg
          key={i}
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className="absolute left-1/2 top-1/2"
          style={{
            "--dx": s.dx,
            "--dy": s.dy,
            "--rot": s.rot,
            animation: `diamond-shard 0.8s ${s.delay}s ease-out infinite`,
            filter: "drop-shadow(0 0 3px #22d3ee)",
          }}
        >
          <polygon points="5,0 6,4 10,5 6,6 5,10 4,6 0,5 4,4" fill="#e0f2fe" />
        </svg>
      ))}
      {/* Strobe glint */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, transparent 45%, rgba(255,255,255,0.9) 50%, transparent 55%)",
          animation: "diamond-strobe 0.8s linear infinite",
        }}
      />
    </div>
  );
}

function GoldAura() {
  const sparks = useMemo(
    () =>
      Array.from({ length: 14 }).map(() => {
        const a = Math.random() * Math.PI * 2;
        const d = 50 + Math.random() * 55;
        return {
          dx: `${Math.cos(a) * d}px`,
          dy: `${Math.sin(a) * d}px`,
          delay: Math.random() * 0.4,
          size: 2 + Math.random() * 3,
        };
      }),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Solar tempest ribbon */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(253,224,71,0) 0%, rgba(250,204,21,0.7) 30%, rgba(217,119,6,0.9) 50%, rgba(250,204,21,0.7) 70%, rgba(253,224,71,0) 100%)",
          backgroundSize: "200% 100%",
          animation: "gold-tempest 0.8s linear infinite",
          mixBlendMode: "screen",
        }}
      />
      {/* Sparks */}
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
            animation: `gold-spark 0.8s ${s.delay}s ease-out infinite`,
          }}
        />
      ))}
      {/* Sunburst along trim */}
      <div
        className="absolute inset-1 rounded-lg"
        style={{
          boxShadow:
            "inset 0 0 18px 4px rgba(250,204,21,0.9), inset 0 0 4px 1px rgba(255,255,255,0.9)",
          animation: "gold-sunburst 0.8s ease-in-out infinite",
        }}
      />
    </div>
  );
}

function SilverAura() {
  const sparks = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        left: `${8 + (i * 84) / 12 + Math.random() * 4}%`,
        delay: Math.random() * 0.6,
        size: 2 + Math.random() * 2.5,
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Chrome kinetic field */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(226,232,240,0) 0%, rgba(148,163,184,0.5) 50%, rgba(226,232,240,0) 100%)",
          animation: "silver-kinetic 0.8s ease-in-out infinite",
          mixBlendMode: "screen",
        }}
      />
      {/* Upward sparks */}
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
            animation: `silver-spark-up 0.8s ${s.delay}s ease-out infinite`,
          }}
        />
      ))}
      {/* Whip sheens */}
      {[0, 1].map((i) => (
        <div
          key={i}
          className="absolute inset-y-0"
          style={{
            left: 0,
            right: 0,
            background:
              "linear-gradient(115deg, transparent 40%, rgba(241,245,249,0.9) 50%, transparent 60%)",
            animation: `silver-sheen 0.8s ${i * 0.4}s linear infinite`,
          }}
        />
      ))}
    </div>
  );
}

function BronzeAura() {
  const embers = useMemo(
    () =>
      Array.from({ length: 10 }).map(() => {
        const a = Math.random() * Math.PI * 2;
        const d = 40 + Math.random() * 45;
        return {
          dx: `${Math.cos(a) * d}px`,
          dy: `${Math.sin(a) * d}px`,
          delay: Math.random() * 0.4,
          size: 2 + Math.random() * 2,
        };
      }),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Sandstorm layer */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(80deg, rgba(120,53,15,0.35) 0 3px, rgba(180,83,9,0.15) 3px 8px, transparent 8px 14px)",
          backgroundSize: "200% 200%",
          animation: "bronze-sandstorm 0.8s linear infinite",
          mixBlendMode: "multiply",
        }}
      />
      {/* Copper embers erupting from center */}
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
            animation: `bronze-ember 0.8s ${e.delay}s ease-out infinite`,
          }}
        />
      ))}
      {/* Gritty friction flash along border */}
      <div
        className="absolute inset-x-0 top-1/2 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(217,119,6,0.9), transparent)",
          animation: "bronze-friction 0.8s linear infinite",
        }}
      />
    </div>
  );
}

// ── Dispatcher ──────────────────────────────────────────────

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

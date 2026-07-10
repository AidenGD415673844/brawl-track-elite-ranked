import React, { useMemo, useEffect, useState } from "react";

// Detect low-power / reduced-motion contexts. When any of these are true,
// we render a lighter static gradient instead of the full particle aura:
//   • prefers-reduced-motion: reduce
//   • hardwareConcurrency <= 4 (older mobiles / iPads)
//   • deviceMemory <= 4 (Android low-RAM)
//   • window inner width <= 480 (phones)
// Users can override via localStorage.setItem('tierAnimPerf', 'high'|'low').
function useLowPowerMode() {
  const [low, setLow] = useState(false);
  useEffect(() => {
    try {
      const override = typeof localStorage !== "undefined" && localStorage.getItem("tierAnimPerf");
      if (override === "low") { setLow(true); return; }
      if (override === "high") { setLow(false); return; }
      const mm = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
      const reduced = !!(mm && mm.matches);
      const cores = typeof navigator !== "undefined" ? (navigator.hardwareConcurrency || 8) : 8;
      const mem = typeof navigator !== "undefined" ? (navigator.deviceMemory || 8) : 8;
      const narrow = typeof window !== "undefined" && window.innerWidth <= 480;
      setLow(reduced || cores <= 4 || mem <= 4 || narrow);
    } catch { /* noop */ }
  }, []);
  return low;
}

// Lightweight static gradient fallback per tier.
const LOW_POWER_BG = {
  Bronze: "linear-gradient(180deg, #2a1207 0%, #5a2410 100%)",
  Silver: "linear-gradient(180deg, #1e293b 0%, #475569 100%)",
  Gold: "radial-gradient(ellipse at 50% 100%, rgba(250,204,21,0.35), transparent 70%)",
  Diamond: "radial-gradient(ellipse at 50% 40%, rgba(125,211,252,0.25), transparent 70%)",
  Mythic: "radial-gradient(ellipse at 50% 100%, rgba(168,85,247,0.5), transparent 75%)",
  Legendary: "radial-gradient(ellipse at 50% 100%, rgba(249,115,22,0.55), rgba(220,38,38,0.3) 40%, transparent 75%)",
  Masters: "radial-gradient(ellipse at 50% 100%, rgba(251,191,36,0.45), transparent 75%)",
  Pro: "radial-gradient(ellipse at 50% 100%, rgba(250,204,21,0.5), transparent 75%)",
};

function LowPowerAura({ tier }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none rounded-[inherit]"
      style={{ background: LOW_POWER_BG[tier] || "transparent" }}
    />
  );
}



// Full-card tier-specific animated auras.
// Each tier has its own signature effect matching the spec:
//   Bronze    — brick backdrop with diagonally-rising Brawl bullets
//   Silver    — lightning strikes every 0.5–2s
//   Gold      — random shiny stars popping every 1–1.5s
//   Diamond   — transparent whooshes every 1.5–2.5s
//   Mythic    — purple fire whooshing at the bottom every 1.5–2.5s
//   Legendary — orange/red fire whooshing with lightning bolts
//   Masters   — explosions with flying concrete debris every ~2s
//   Pro       — explosions with flying golden crowns every 2–3s

// ─── Helpers ─────────────────────────────────────────────────
const rand = (min, max) => min + Math.random() * (max - min);

// Per-tier grid tint. Kept subtle so text remains readable.
const GRID_TINT = {
  Bronze:    "rgba(251,191,36,0.16)",
  Silver:    "rgba(226,232,240,0.14)",
  Gold:      "rgba(250,204,21,0.18)",
  Diamond:   "rgba(125,211,252,0.16)",
  Mythic:    "rgba(217,70,239,0.18)",
  Legendary: "rgba(249,115,22,0.18)",
  Masters:   "rgba(251,191,36,0.16)",
  Pro:       "rgba(253,224,71,0.20)",
};

// Old-school grid backdrop restored across every battle card. Renders under
// the tier particle layer so effects still pop on top.
function GridBackdrop({ tier }) {
  const line = GRID_TINT[tier] || "rgba(255,255,255,0.12)";
  return (
    <div
      className="absolute inset-0 pointer-events-none rounded-[inherit]"
      style={{
        backgroundImage: `
          linear-gradient(${line} 1px, transparent 1px),
          linear-gradient(90deg, ${line} 1px, transparent 1px),
          radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.35) 100%)
        `,
        backgroundSize: "24px 24px, 24px 24px, 100% 100%",
        backgroundPosition: "0 0, 0 0, 0 0",
        mixBlendMode: "screen",
        opacity: 0.9,
      }}
    />
  );
}

// ─── Bronze ──────────────────────────────────────────────────
function BronzeAura() {
  const bullets = useMemo(
    () =>
      Array.from({ length: 9 }).map((_, i) => ({
        left: `${rand(-5, 95)}%`,
        delay: `${(i * 0.5).toFixed(2)}s`,
        duration: `${rand(4.5, 6.5).toFixed(2)}s`,
        scale: rand(0.7, 1.15),
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
      {/* Dark brick backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #2a1207 0%, #4b1e08 55%, #6b2a0d 100%)",
        }}
      />
      {/* Brick pattern overlay */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            linear-gradient(0deg, rgba(0,0,0,0.55) 0 2px, transparent 2px 30px),
            linear-gradient(90deg, rgba(0,0,0,0.55) 0 2px, transparent 2px 60px),
            linear-gradient(90deg, rgba(0,0,0,0.55) 0 2px, transparent 2px 60px)`,
          backgroundSize: "60px 30px, 60px 30px, 60px 30px",
          backgroundPosition: "0 0, 0 0, 30px 15px",
        }}
      />
      {/* Slight brick texture noise */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(255,180,120,0.15), transparent 50%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.4), transparent 55%)",
        }}
      />
      {/* Diagonally-rising bullets */}
      {bullets.map((b, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: b.left,
            bottom: "-20px",
            transform: `scale(${b.scale})`,
            animation: `bronze-bullet ${b.duration} ${b.delay} linear infinite`,
          }}
        >
          <div
            style={{
              width: 6,
              height: 14,
              borderRadius: "3px 3px 6px 6px",
              background:
                "linear-gradient(180deg, #fef3c7 0%, #fbbf24 45%, #b45309 100%)",
              boxShadow:
                "0 0 8px rgba(251,191,36,0.9), 0 0 14px rgba(249,115,22,0.5)",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Silver ──────────────────────────────────────────────────
function SilverAura() {
  const bolts = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        left: `${rand(8, 88)}%`,
        delay: `${(i * rand(0.5, 2)).toFixed(2)}s`,
        duration: `${rand(0.6, 1.1).toFixed(2)}s`,
        cycle: `${rand(1.2, 3).toFixed(2)}s`,
        d: `M 0 0 L 6 22 L 2 24 L 9 50 L -2 26 L 3 24 Z`,
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
      {/* Stormy sheen */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, transparent 40%, rgba(226,232,240,0.35) 50%, transparent 60%)",
          animation: "silver-sheen 2s ease-in-out infinite",
          mixBlendMode: "screen",
        }}
      />
      {bolts.map((b, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: b.left,
            top: 0,
            width: 12,
            height: 60,
            animation: `silver-bolt ${b.duration} ${b.delay} steps(2,end) infinite`,
            animationDelay: b.delay,
          }}
        >
          <svg
            viewBox="-4 0 14 60"
            width="12"
            height="60"
            style={{
              filter:
                "drop-shadow(0 0 6px #f8fafc) drop-shadow(0 0 14px rgba(148,163,184,0.9))",
            }}
          >
            <path
              d={b.d}
              fill="#f8fafc"
              stroke="#e2e8f0"
              strokeWidth="0.5"
            />
          </svg>
        </div>
      ))}
      {/* Flash overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(226,232,240,0.6)",
          animation: "silver-flash 1.6s ease-in-out infinite",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}

// ─── Gold ────────────────────────────────────────────────────
function GoldAura() {
  const stars = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        left: `${rand(6, 92)}%`,
        top: `${rand(8, 82)}%`,
        delay: `${(i * rand(0.15, 0.35)).toFixed(2)}s`,
        duration: `${rand(1, 1.5).toFixed(2)}s`,
        size: rand(9, 16),
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 100%, rgba(202,138,4,0.35), transparent 65%)",
        }}
      />
      {stars.map((s, i) => (
        <svg
          key={i}
          className="absolute"
          width={s.size}
          height={s.size}
          viewBox="0 0 24 24"
          style={{
            left: s.left,
            top: s.top,
            filter:
              "drop-shadow(0 0 8px #fde047) drop-shadow(0 0 14px rgba(250,204,21,0.9))",
            animation: `gold-star-pop ${s.duration} ${s.delay} ease-in-out infinite`,
          }}
        >
          <polygon
            points="12,1 15,9 23,9 16.5,14 19,22 12,17 5,22 7.5,14 1,9 9,9"
            fill="#fef08a"
            stroke="#fde047"
            strokeWidth="0.5"
          />
        </svg>
      ))}
    </div>
  );
}

// ─── Diamond ─────────────────────────────────────────────────
function DiamondAura() {
  const whooshes = useMemo(
    () =>
      Array.from({ length: 4 }).map((_, i) => ({
        top: `${rand(18, 72)}%`,
        delay: `${(i * rand(0.6, 1.2)).toFixed(2)}s`,
        duration: `${rand(1.5, 2.5).toFixed(2)}s`,
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(125,211,252,0.18), transparent 65%)",
        }}
      />
      {whooshes.map((w, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: w.top,
            left: 0,
            right: 0,
            height: 26,
            animation: `diamond-whoosh ${w.duration} ${w.delay} ease-in-out infinite`,
          }}
        >
          <div
            style={{
              width: "45%",
              height: "100%",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(224,242,254,0.15) 25%, rgba(255,255,255,0.55) 50%, rgba(125,211,252,0.35) 75%, transparent 100%)",
              filter: "blur(3px)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Mythic ──────────────────────────────────────────────────
function MythicAura() {
  const flames = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, i) => ({
        left: `${rand(0, 80)}%`,
        delay: `${(i * rand(0.4, 0.9)).toFixed(2)}s`,
        duration: `${rand(1.5, 2.5).toFixed(2)}s`,
        width: rand(60, 110),
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
      {/* Purple base glow */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 100%, rgba(168,85,247,0.55), rgba(139,92,246,0.25) 40%, transparent 75%)",
        }}
      />
      {flames.map((f, i) => (
        <div
          key={i}
          className="absolute bottom-0"
          style={{
            left: f.left,
            width: f.width,
            height: 70,
            animation: `mythic-fire ${f.duration} ${f.delay} ease-in-out infinite`,
            filter: "blur(4px)",
            mixBlendMode: "screen",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              background:
                "radial-gradient(ellipse 60% 100% at 50% 100%, #f0abfc 0%, #d946ef 30%, #9333ea 65%, transparent 90%)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Legendary ───────────────────────────────────────────────
function LegendaryAura() {
  const flames = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, i) => ({
        left: `${rand(0, 80)}%`,
        delay: `${(i * rand(0.4, 0.9)).toFixed(2)}s`,
        duration: `${rand(1.4, 2.4).toFixed(2)}s`,
        width: rand(70, 130),
      })),
    []
  );
  const bolts = useMemo(
    () =>
      Array.from({ length: 3 }).map((_, i) => ({
        left: `${rand(15, 80)}%`,
        delay: `${(i * rand(0.9, 1.7)).toFixed(2)}s`,
        cycle: `${rand(1.8, 2.8).toFixed(2)}s`,
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
      <div
        className="absolute inset-x-0 bottom-0 h-3/5"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 100%, rgba(249,115,22,0.6), rgba(220,38,38,0.35) 40%, transparent 75%)",
        }}
      />
      {flames.map((f, i) => (
        <div
          key={i}
          className="absolute bottom-0"
          style={{
            left: f.left,
            width: f.width,
            height: 90,
            animation: `legendary-fire ${f.duration} ${f.delay} ease-in-out infinite`,
            filter: "blur(4px)",
            mixBlendMode: "screen",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              background:
                "radial-gradient(ellipse 60% 100% at 50% 100%, #fef08a 0%, #f97316 25%, #dc2626 60%, transparent 90%)",
            }}
          />
        </div>
      ))}
      {bolts.map((b, i) => (
        <svg
          key={i}
          viewBox="-4 0 14 70"
          width="14"
          height="70"
          className="absolute"
          style={{
            left: b.left,
            top: 0,
            filter:
              "drop-shadow(0 0 6px #fef3c7) drop-shadow(0 0 12px rgba(249,115,22,0.9))",
            animation: `legendary-bolt ${b.cycle} ${b.delay} steps(2,end) infinite`,
          }}
        >
          <path
            d="M 0 0 L 6 26 L 1 28 L 8 60 L -2 32 L 3 30 Z"
            fill="#fef3c7"
          />
        </svg>
      ))}
    </div>
  );
}

// ─── Masters ─────────────────────────────────────────────────
function MastersAura() {
  const explosions = useMemo(
    () =>
      Array.from({ length: 3 }).map((_, i) => ({
        left: `${20 + i * 30}%`,
        top: `${rand(35, 65)}%`,
        delay: `${(i * 0.7).toFixed(2)}s`,
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
      <div
        className="absolute inset-x-0 bottom-0 h-2/5"
        style={{
          background:
            "radial-gradient(ellipse 90% 100% at 50% 100%, rgba(251,191,36,0.45), transparent 75%)",
        }}
      />
      {explosions.map((ex, i) => (
        <div
          key={i}
          className="absolute"
          style={{ left: ex.left, top: ex.top }}
        >
          {/* Flash */}
          <div
            className="absolute rounded-full"
            style={{
              width: 60,
              height: 60,
              marginLeft: -30,
              marginTop: -30,
              background:
                "radial-gradient(circle, rgba(254,243,199,0.95) 0%, rgba(251,146,60,0.6) 40%, transparent 70%)",
              animation: `masters-flash 2s ${ex.delay} ease-out infinite`,
              filter: "blur(1px)",
            }}
          />
          {/* Debris */}
          {Array.from({ length: 8 }).map((_, k) => {
            const a = (k / 8) * Math.PI * 2 + rand(-0.15, 0.15);
            const d = 55 + rand(0, 30);
            return (
              <div
                key={k}
                className="absolute"
                style={{
                  left: 0,
                  top: 0,
                  width: 5,
                  height: 5,
                  marginLeft: -2.5,
                  marginTop: -2.5,
                  background: "#9ca3af",
                  borderRadius: "1px",
                  boxShadow: "inset 0 -1px 2px rgba(0,0,0,0.5)",
                  "--dx": `${Math.cos(a) * d}px`,
                  "--dy": `${Math.sin(a) * d}px`,
                  "--rot": `${rand(-360, 360)}deg`,
                  animation: `masters-debris 2s ${ex.delay} ease-out infinite`,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Pro ─────────────────────────────────────────────────────
function ProAura() {
  const explosions = useMemo(
    () =>
      Array.from({ length: 3 }).map((_, i) => ({
        left: `${18 + i * 32}%`,
        top: `${rand(30, 65)}%`,
        delay: `${(i * rand(0.8, 1.2)).toFixed(2)}s`,
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 60% at 50% 100%, rgba(250,204,21,0.45), transparent 70%)",
        }}
      />
      {explosions.map((ex, i) => (
        <div
          key={i}
          className="absolute"
          style={{ left: ex.left, top: ex.top }}
        >
          {/* Golden flash */}
          <div
            className="absolute rounded-full"
            style={{
              width: 70,
              height: 70,
              marginLeft: -35,
              marginTop: -35,
              background:
                "radial-gradient(circle, rgba(254,249,195,0.95) 0%, rgba(250,204,21,0.65) 40%, transparent 70%)",
              animation: `pro-flash 2.5s ${ex.delay} ease-out infinite`,
              filter: "blur(1px)",
            }}
          />
          {/* Flying crowns */}
          {Array.from({ length: 7 }).map((_, k) => {
            const a = (k / 7) * Math.PI * 2 + rand(-0.1, 0.1);
            const d = 60 + rand(0, 35);
            return (
              <svg
                key={k}
                viewBox="0 0 24 24"
                width="14"
                height="14"
                className="absolute"
                style={{
                  left: 0,
                  top: 0,
                  marginLeft: -7,
                  marginTop: -7,
                  filter:
                    "drop-shadow(0 0 4px #fde047) drop-shadow(0 0 8px rgba(250,204,21,0.9))",
                  "--dx": `${Math.cos(a) * d}px`,
                  "--dy": `${Math.sin(a) * d}px`,
                  "--rot": `${rand(-540, 540)}deg`,
                  animation: `pro-crown 2.5s ${ex.delay} ease-out infinite`,
                }}
              >
                <path
                  d="M 3 8 L 6 14 L 9 5 L 12 14 L 15 5 L 18 14 L 21 8 L 20 19 L 4 19 Z"
                  fill="#fef08a"
                  stroke="#ca8a04"
                  strokeWidth="0.8"
                  strokeLinejoin="round"
                />
                <rect x="4" y="18" width="16" height="2" fill="#ca8a04" />
              </svg>
            );
          })}
        </div>
      ))}
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

// Optional extra flourishes layered on top of the base aura. Kept in one
// place so we can iterate without touching each tier component.
function TierExtras({ tier }) {
  switch (tier) {
    case "Bronze":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div className="tier-bronze-dust" />
        </div>
      );
    case "Mythic":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="tier-mythic-ember" style={{ left: `${10 + i * 15}%`, animationDelay: `${i * 0.4}s` }} />
          ))}
        </div>
      );
    case "Legendary":
      return (
        <div className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none tier-legendary-haze" aria-hidden />
      );
    case "Masters":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div className="tier-masters-shockwave" />
        </div>
      );
    default:
      return null;
  }
}

export default function TierAuraOverlay({ tier, active = true }) {
  const lowPower = useLowPowerMode();
  if (!active) return null;
  const Aura = TIER_COMPONENTS[tier];
  if (!Aura) return null;
  if (lowPower) return <LowPowerAura tier={tier} />;
  return (
    <>
      <Aura />
      <TierExtras tier={tier} />
    </>
  );
}

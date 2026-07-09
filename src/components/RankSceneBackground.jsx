import React, { useMemo } from "react";
import { motion } from "framer-motion";

// RankSceneBackground — cinematic, tier-themed parallax environment.
// Three stage styles based on tier:
//   forge      — Bronze/Silver/Gold: rising embers, heat haze, sparks
//   crystal    — Diamond/Mythic/Legendary: floating shards, aurora curtains, prismatic streaks
//   celestial  — Masters/Pro: starfield, nebula clouds, cosmic dust
// Renders as a full-bleed background layer (z-0); place behind content.

function makeRng(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const STAGE_MAP = {
  Bronze: "forge",
  Silver: "forge",
  Gold: "forge",
  Diamond: "crystal",
  Mythic: "crystal",
  Legendary: "crystal",
  Masters: "celestial",
  Pro: "celestial",
};

function ForgeStage({ color }) {
  const rand = useMemo(() => makeRng(42), []);
  const embers = useMemo(
    () => Array.from({ length: 28 }, () => ({
      x: rand() * 100,
      size: 2 + rand() * 5,
      delay: rand() * 6,
      duration: 5 + rand() * 7,
      drift: (rand() - 0.5) * 60,
      sway: 20 + rand() * 40,
    })),
    [rand]
  );
  const sparks = useMemo(
    () => Array.from({ length: 10 }, () => ({
      x: rand() * 100,
      y: 20 + rand() * 60,
      delay: rand() * 4,
      duration: 2 + rand() * 3,
    })),
    [rand]
  );

  return (
    <>
      {/* Molten base glow at bottom */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 90% 50% at 50% 100%, ${color.from}55 0%, ${color.from}20 30%, transparent 60%), linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(20,10,5,0.9) 100%)`,
        }}
      />

      {/* Heat haze — slow drifting blurred blobs */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`haze-${i}`}
          className="absolute rounded-full"
          style={{
            width: 400,
            height: 200,
            left: `${15 + i * 30}%`,
            bottom: "-5%",
            background: `radial-gradient(ellipse, ${color.to}30, transparent 70%)`,
            filter: "blur(30px)",
          }}
          animate={{
            x: [0, 40, -20, 0],
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Rising embers */}
      {embers.map((e, i) => (
        <motion.div
          key={`ember-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${e.x}%`,
            bottom: "-2%",
            width: e.size,
            height: e.size,
            background: color.text,
            filter: "blur(0.5px)",
            boxShadow: `0 0 ${e.size * 2}px ${color.to}`,
          }}
          animate={{
            y: [0, -window.innerHeight * 0.8],
            x: [0, e.drift, e.drift + e.sway, e.drift],
            opacity: [0, 0.9, 0.7, 0],
            scale: [0.5, 1, 0.3],
          }}
          transition={{
            duration: e.duration,
            delay: e.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Bright sparks — quick flash bursts */}
      {sparks.map((s, i) => (
        <motion.div
          key={`spark-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: 3,
            height: 3,
            background: "#fff",
            boxShadow: `0 0 8px ${color.text}, 0 0 16px ${color.to}`,
          }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        />
      ))}
    </>
  );
}

function CrystalStage({ color }) {
  const rand = useMemo(() => makeRng(77), []);
  const shards = useMemo(
    () => Array.from({ length: 18 }, () => ({
      x: rand() * 100,
      y: rand() * 100,
      size: 8 + rand() * 20,
      delay: rand() * 6,
      duration: 8 + rand() * 10,
      rotateSpeed: rand() * 360,
    })),
    [rand]
  );

  return (
    <>
      {/* Deep crystal base */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${color.from}40 0%, ${color.from}15 35%, rgba(0,0,0,0.96) 75%)`,
        }}
      />

      {/* Aurora curtains — flowing horizontal gradient bands */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`aurora-${i}`}
          className="absolute"
          style={{
            width: "140%",
            height: 200,
            left: "-20%",
            top: `${15 + i * 25}%`,
            background: `linear-gradient(90deg, transparent, ${color.to}25, ${color.text}15, ${color.to}25, transparent)`,
            filter: "blur(20px)",
            transformOrigin: "center",
          }}
          animate={{
            x: ["-15%", "10%", "-15%"],
            opacity: [0.3, 0.6, 0.3],
            skewY: [2, -2, 2],
          }}
          transition={{ duration: 12 + i * 4, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Prismatic light streaks */}
      {[0, 1].map((i) => (
        <motion.div
          key={`prism-${i}`}
          className="absolute"
          style={{
            width: "120%",
            height: 2,
            left: "-10%",
            top: `${30 + i * 35}%`,
            background: `linear-gradient(90deg, transparent, ${color.text}40, #fff30, ${color.to}40, transparent)`,
            filter: "blur(1px)",
          }}
          animate={{ x: ["-20%", "10%"], opacity: [0, 0.8, 0] }}
          transition={{ duration: 6, delay: i * 2.5, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
        />
      ))}

      {/* Floating crystal shards */}
      {shards.map((s, i) => (
        <motion.div
          key={`shard-${i}`}
          className="absolute"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size * 1.4,
            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
            background: `linear-gradient(135deg, ${color.text}, ${color.to})`,
            filter: `drop-shadow(0 0 6px ${color.glow})`,
            opacity: 0.5,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            rotate: [0, s.rotateSpeed],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

function CelestialStage({ color }) {
  const rand = useMemo(() => makeRng(99), []);
  const stars = useMemo(
    () => Array.from({ length: 60 }, () => ({
      x: rand() * 100,
      y: rand() * 100,
      size: 1 + rand() * 2.5,
      delay: rand() * 4,
      duration: 2 + rand() * 4,
    })),
    [rand]
  );
  const dust = useMemo(
    () => Array.from({ length: 16 }, () => ({
      x: rand() * 100,
      y: rand() * 100,
      size: 1 + rand() * 3,
      delay: rand() * 8,
      duration: 10 + rand() * 12,
      drift: (rand() - 0.5) * 80,
    })),
    [rand]
  );

  return (
    <>
      {/* Deep space base */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${color.from}30 0%, rgba(5,5,15,0.98) 70%)`,
        }}
      />

      {/* Nebula clouds */}
      {[0, 1].map((i) => (
        <motion.div
          key={`nebula-${i}`}
          className="absolute rounded-full"
          style={{
            width: 500,
            height: 300,
            left: `${i === 0 ? 10 : 55}%`,
            top: `${i === 0 ? 15 : 45}%`,
            background: `radial-gradient(ellipse, ${color.to}25, ${color.from}10, transparent 70%)`,
            filter: "blur(40px)",
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15 + i * 5, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Starfield — twinkling */}
      {stars.map((s, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Cosmic dust — slow drifting */}
      {dust.map((d, i) => (
        <motion.div
          key={`dust-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
            background: color.text,
            filter: "blur(1px)",
          }}
          animate={{
            x: [0, d.drift, 0],
            y: [0, -40, 0],
            opacity: [0.1, 0.5, 0.1],
          }}
          transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Distant shooting star */}
      <motion.div
        className="absolute"
        style={{
          width: 120,
          height: 1.5,
          background: `linear-gradient(90deg, transparent, ${color.text}, #fff)`,
          filter: "blur(0.5px)",
        }}
        initial={{ x: "-10%", y: "20%", opacity: 0 }}
        animate={{ x: ["-10%", "110%"], y: ["20%", "35%"], opacity: [0, 1, 0] }}
        transition={{ duration: 2, delay: 3, repeat: Infinity, repeatDelay: 8, ease: "easeIn" }}
      />
    </>
  );
}

export default function RankSceneBackground({ tier, color }) {
  const stage = STAGE_MAP[tier] || "forge";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {stage === "forge" && <ForgeStage color={color} />}
      {stage === "crystal" && <CrystalStage color={color} />}
      {stage === "celestial" && <CelestialStage color={color} />}

      {/* Vignette overlay — focus toward center */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </div>
  );
}
import React, { useMemo } from "react";
import { motion } from "framer-motion";

// CardParticleBg — enhanced animated tier-themed particles behind the rank icon.
// Each tier has unique particle shapes, speeds, and ambient glow effects.

function generateParticles(count, seed) {
  const particles = [];
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < count; i++) {
    particles.push({
      x: rand() * 100,
      y: rand() * 100,
      size: 3 + rand() * 6,
      delay: rand() * 5,
      duration: 8 + rand() * 12,
      drift: (rand() - 0.5) * 40,
    });
  }
  return particles;
}

const TIER_CONFIG = {
  Bronze:    { type: "circle",  count: 10, seed: 11,  color: "rgba(180,83,9,0.4)",    glow: "rgba(180,83,9,0.15)",   speed: 1.0, sparkle: false },
  Silver:    { type: "circle",  count: 12, seed: 22,  color: "rgba(203,213,225,0.4)", glow: "rgba(203,213,225,0.12)", speed: 1.2, sparkle: false },
  Gold:      { type: "ray",     count: 10, seed: 33,  color: "rgba(253,224,71,0.35)", glow: "rgba(253,224,71,0.15)",  speed: 1.5, sparkle: false },
  Diamond:   { type: "shard",   count: 12, seed: 44,  color: "rgba(56,189,248,0.4)",  glow: "rgba(56,189,248,0.18)",   speed: 1.8, sparkle: true },
  Mythic:    { type: "flame",   count: 14, seed: 55,  color: "rgba(217,70,239,0.45)", glow: "rgba(217,70,239,0.2)",   speed: 2.0, sparkle: true },
  Legendary: { type: "flame",   count: 16, seed: 66,  color: "rgba(248,113,113,0.45)",glow: "rgba(248,113,113,0.2)",  speed: 2.5, sparkle: true },
  Masters:   { type: "circle",  count: 14, seed: 77,  color: "rgba(251,146,60,0.4)",  glow: "rgba(251,146,60,0.18)",  speed: 2.2, sparkle: true },
  Pro:       { type: "ray",     count: 16, seed: 88,  color: "rgba(34,197,94,0.45)",  glow: "rgba(34,197,94,0.2)",    speed: 3.0, sparkle: true },
};

function SparkleParticle({ x, y, delay, duration, color }) {
  return (
    <motion.div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        scale: [0, 1, 0],
        opacity: [0, 1, 0],
        rotate: [0, 180],
      }}
      transition={{
        duration: duration / 2,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg width={8} height={8} viewBox="0 0 24 24" fill={color}>
        <path d="M12,0 L14,10 L24,12 L14,14 L12,24 L10,14 L0,12 L10,10 Z" />
      </svg>
    </motion.div>
  );
}

export default function CardParticleBg({ tier, color }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.Bronze;
  const particles = useMemo(
    () => generateParticles(config.count, config.seed),
    [config.count, config.seed]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Pulsing radial glow behind icon */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: "50%",
          top: "50%",
          width: "70%",
          height: "70%",
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, ${config.glow} 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 4 / config.speed,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Tier-specific particles */}
      {particles.map((p, i) => {
        const duration = p.duration / config.speed;

        if (config.type === "flame") {
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                bottom: "-10%",
                width: p.size,
                height: p.size * 3,
                background: config.color,
                filter: "blur(2px)",
              }}
              animate={{
                y: [0, -120],
                x: [0, p.drift],
                opacity: [0, 0.8, 0],
                scale: [0.5, 1.2, 0.3],
              }}
              transition={{
                duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          );
        }

        if (config.type === "ray") {
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size * 4,
                height: 1,
                background: config.color,
                transformOrigin: "left center",
                transform: `rotate(${p.delay * 72}deg)`,
              }}
              animate={{
                opacity: [0, 0.6, 0],
                scaleX: [0, 1, 0.5],
              }}
              transition={{
                duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          );
        }

        if (config.type === "shard") {
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size * 1.5,
                background: config.color,
                clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, p.drift * 0.5, 0],
                opacity: [0.2, 0.7, 0.2],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          );
        }

        // Default: circle (Bronze, Silver, Masters)
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: config.color,
              filter: "blur(1px)",
            }}
            animate={{
              y: [0, -25, 0],
              x: [0, p.drift, 0],
              opacity: [0.15, 0.5, 0.15],
            }}
            transition={{
              duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Sparkle particles for high tiers (Diamond+) */}
      {config.sparkle &&
        particles.slice(0, 5).map((p, i) => (
          <SparkleParticle
            key={`spark-${i}`}
            x={p.x}
            y={p.y}
            delay={p.delay + 1}
            duration={p.duration}
            color={config.color}
          />
        ))}
    </div>
  );
}
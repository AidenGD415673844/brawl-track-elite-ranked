import React, { useMemo } from "react";
import { motion } from "framer-motion";

// Tier-specific sparkle particle systems.
// Each tier has a unique particle type and color palette.

const PARTICLE_COUNT = 24;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// Pre-compute particle configs so they don't reshuffle on re-render
function useParticleConfigs(count) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        angle: randomBetween(0, 360),
        distance: randomBetween(80, 320),
        size: randomBetween(8, 22),
        delay: randomBetween(0, 0.6),
        duration: randomBetween(0.8, 1.8),
        rotation: randomBetween(-180, 180),
        startX: randomBetween(20, 80),
        drift: randomBetween(-60, 60),
      })),
    [count]
  );
}

// BRONZE — bullet sparkles (small copper cylinders flying outward)
function BulletSparkles({ delay, color }) {
  const particles = useParticleConfigs(PARTICLE_COUNT);
  return (
    <>
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const dx = Math.cos(rad) * p.distance;
        const dy = Math.sin(rad) * p.distance;
        return (
          <motion.div
            key={p.id}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              width: p.size * 0.5,
              height: p.size,
              background: `linear-gradient(to bottom, ${color.text}, ${color.from})`,
              borderRadius: "50%",
              clipPath: "polygon(30% 0%, 70% 0%, 70% 85%, 50% 100%, 30% 85%)",
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: dx,
              y: [0, dy, dy + 80],
              opacity: [0, 1, 0],
              scale: [0, 1, 0.6],
              rotate: p.rotation,
            }}
            transition={{ duration: p.duration, delay: delay + p.delay, ease: "easeOut" }}
          />
        );
      })}
    </>
  );
}

// SILVER — lightning sparks (zig-zag bolts)
function LightningSparkles({ delay, color }) {
  const particles = useParticleConfigs(PARTICLE_COUNT);
  return (
    <>
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const dx = Math.cos(rad) * p.distance;
        const dy = Math.sin(rad) * p.distance;
        return (
          <motion.div
            key={p.id}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              width: p.size * 0.6,
              height: p.size * 1.5,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: dx,
              y: dy,
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0],
              rotate: p.angle,
            }}
            transition={{
              duration: p.duration * 0.6,
              delay: delay + p.delay,
              times: [0, 0.2, 0.5, 1],
              ease: "easeOut",
            }}
          >
            <svg viewBox="0 0 10 30" width="100%" height="100%">
              <path
                d="M5,0 L7,10 L3,12 L8,22 L4,30 L6,20 L2,18 L5,0"
                fill={color.text}
                stroke={color.to}
                strokeWidth="0.5"
              />
            </svg>
          </motion.div>
        );
      })}
    </>
  );
}

// GOLD — gold stars (5-point stars that twinkle)
function GoldStarSparkles({ delay, color }) {
  const particles = useParticleConfigs(PARTICLE_COUNT);
  return (
    <>
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const dx = Math.cos(rad) * p.distance;
        const dy = Math.sin(rad) * p.distance;
        return (
          <motion.div
            key={p.id}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              width: p.size,
              height: p.size,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: dx,
              y: [dy, dy - 40, dy],
              opacity: [0, 1, 1, 0],
              scale: [0, 1.3, 1, 0],
              rotate: p.rotation,
            }}
            transition={{
              duration: p.duration,
              delay: delay + p.delay,
              times: [0, 0.3, 0.7, 1],
              ease: "easeOut",
            }}
          >
            <svg viewBox="0 0 24 24" width="100%" height="100%">
              <path
                d="M12,2 L14.5,9 L22,9.5 L16,14.5 L18,22 L12,17.5 L6,22 L8,14.5 L2,9.5 L9.5,9 Z"
                fill={color.text}
                stroke={color.from}
                strokeWidth="1"
              />
            </svg>
          </motion.div>
        );
      })}
    </>
  );
}

// DIAMOND — diamond shapes that rotate and sparkle
function DiamondSparkles({ delay, color }) {
  const particles = useParticleConfigs(PARTICLE_COUNT);
  return (
    <>
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const dx = Math.cos(rad) * p.distance;
        const dy = Math.sin(rad) * p.distance;
        return (
          <motion.div
            key={p.id}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              width: p.size,
              height: p.size * 1.4,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: dx,
              y: dy,
              opacity: [0, 1, 1, 0],
              scale: [0, 1.4, 1, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: p.duration,
              delay: delay + p.delay,
              times: [0, 0.3, 0.7, 1],
              ease: "easeOut",
            }}
          >
            <svg viewBox="0 0 20 28" width="100%" height="100%">
              <path
                d="M10,0 L20,10 L10,28 L0,10 Z M10,0 L10,28 M0,10 L20,10"
                fill={color.to}
                stroke={color.text}
                strokeWidth="1"
                opacity="0.9"
              />
              <path d="M10,0 L15,10 L10,14 L5,10 Z" fill={color.text} opacity="0.6" />
            </svg>
          </motion.div>
        );
      })}
    </>
  );
}

// MYTHIC — purple crown-shaped sparkles
function CrownSparkles({ delay, color }) {
  const particles = useParticleConfigs(PARTICLE_COUNT);
  return (
    <>
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const dx = Math.cos(rad) * p.distance;
        const dy = Math.sin(rad) * p.distance;
        return (
          <motion.div
            key={p.id}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              width: p.size * 1.3,
              height: p.size,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: dx,
              y: [dy, dy - 50, dy - 30],
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0.5],
              rotate: p.rotation * 0.3,
            }}
            transition={{
              duration: p.duration,
              delay: delay + p.delay,
              times: [0, 0.3, 0.7, 1],
              ease: "easeOut",
            }}
          >
            <svg viewBox="0 0 30 22" width="100%" height="100%">
              <path
                d="M3,20 L0,8 L8,14 L15,2 L22,14 L30,8 L27,20 Z"
                fill={color.to}
                stroke={color.text}
                strokeWidth="1"
              />
              <circle cx="15" cy="4" r="1.5" fill={color.text} />
              <rect x="3" y="18" width="24" height="4" fill={color.from} opacity="0.6" />
            </svg>
          </motion.div>
        );
      })}
    </>
  );
}

// LEGENDARY — fiery ember sparkles (rising upward)
function FireSparkles({ delay, color }) {
  const particles = useParticleConfigs(PARTICLE_COUNT);
  return (
    <>
      {particles.map((p) => {
        const dx = p.drift;
        const dy = -p.distance - randomBetween(50, 150);
        return (
          <motion.div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.startX}%`,
              top: "50%",
              width: p.size * 0.8,
              height: p.size * 0.8,
              background: `radial-gradient(circle, ${color.text} 0%, ${color.to} 40%, ${color.from} 70%, transparent 100%)`,
              borderRadius: "50%",
              filter: `blur(${p.size * 0.1}px)`,
            }}
            initial={{ y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: [0, dx, dx * 1.5],
              y: dy,
              opacity: [0, 1, 0.8, 0],
              scale: [0, 1.5, 1, 0.3],
            }}
            transition={{
              duration: p.duration * 1.2,
              delay: delay + p.delay,
              times: [0, 0.2, 0.6, 1],
              ease: "easeOut",
            }}
          />
        );
      })}
    </>
  );
}

// MASTERS — concrete debris falling + fiery embers rising
function DebrisFireSparkles({ delay, color }) {
  const debris = useParticleConfigs(16);
  const embers = useParticleConfigs(16);
  return (
    <>
      {/* Concrete debris — gray chunks falling outward */}
      {debris.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const dx = Math.cos(rad) * p.distance * 0.8;
        const dy = Math.sin(rad) * p.distance * 0.8;
        return (
          <motion.div
            key={`debris-${p.id}`}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              width: p.size,
              height: p.size * randomBetween(0.6, 1.2),
              background: `linear-gradient(135deg, #6b7280, #374151)`,
              clipPath: "polygon(20% 0%, 80% 10%, 100% 50%, 90% 90%, 30% 100%, 0% 60%)",
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: dx,
              y: [0, dy, dy + 120],
              opacity: [0, 1, 0],
              scale: [0, 1, 0.7],
              rotate: [0, p.rotation, p.rotation * 2],
            }}
            transition={{
              duration: p.duration,
              delay: delay + p.delay,
              ease: "easeOut",
            }}
          />
        );
      })}
      {/* Fiery embers rising */}
      {embers.map((p) => {
        const dx = p.drift;
        const dy = -p.distance;
        return (
          <motion.div
            key={`ember-${p.id}`}
            className="absolute"
            style={{
              left: `${p.startX}%`,
              top: "50%",
              width: p.size * 0.7,
              height: p.size * 0.7,
              background: `radial-gradient(circle, ${color.text} 0%, ${color.to} 50%, transparent 100%)`,
              borderRadius: "50%",
              filter: "blur(2px)",
            }}
            initial={{ y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: [0, dx, dx * 1.5],
              y: dy,
              opacity: [0, 1, 0],
              scale: [0, 1.4, 0.3],
            }}
            transition={{
              duration: p.duration * 1.1,
              delay: delay + p.delay,
              ease: "easeOut",
            }}
          />
        );
      })}
    </>
  );
}

// PRO — trophy sparks (gold trophy shapes rising)
function TrophySparkles({ delay, color }) {
  const particles = useParticleConfigs(PARTICLE_COUNT);
  return (
    <>
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const dx = Math.cos(rad) * p.distance;
        const dy = -Math.abs(Math.sin(rad) * p.distance) - 40;
        return (
          <motion.div
            key={p.id}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              width: p.size * 1.1,
              height: p.size * 1.3,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: dx,
              y: [0, dy, dy - 30],
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0.4],
              rotate: p.rotation * 0.2,
            }}
            transition={{
              duration: p.duration,
              delay: delay + p.delay,
              times: [0, 0.25, 0.7, 1],
              ease: "easeOut",
            }}
          >
            <svg viewBox="0 0 24 30" width="100%" height="100%">
              <path
                d="M6,2 L18,2 L18,8 Q18,14 12,14 Q6,14 6,8 Z"
                fill={color.text}
                stroke={color.from}
                strokeWidth="0.8"
              />
              <path d="M6,4 Q2,4 2,8 Q2,11 6,11" fill="none" stroke={color.text} strokeWidth="1.5" />
              <path d="M18,4 Q22,4 22,8 Q22,11 18,11" fill="none" stroke={color.text} strokeWidth="1.5" />
              <rect x="10" y="14" width="4" height="4" fill={color.from} />
              <rect x="7" y="18" width="10" height="3" rx="1" fill={color.text} />
              <rect x="6" y="21" width="12" height="4" rx="1" fill={color.from} />
            </svg>
          </motion.div>
        );
      })}
    </>
  );
}

const SPARKLE_COMPONENTS = {
  Bronze: BulletSparkles,
  Silver: LightningSparkles,
  Gold: GoldStarSparkles,
  Diamond: DiamondSparkles,
  Mythic: CrownSparkles,
  Legendary: FireSparkles,
  Masters: DebrisFireSparkles,
  Pro: TrophySparkles,
};

export default function TierSparkles({ tier, delay = 0, color }) {
  const SparkleComponent = SPARKLE_COMPONENTS[tier] || BulletSparkles;
  return <SparkleComponent delay={delay} color={color} />;
}
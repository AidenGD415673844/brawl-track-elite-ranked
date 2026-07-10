import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";

// Hook: reads device gyroscope tilt (gamma=left/right, beta=front/back).
// On desktop (no gyroscope), tilt stays at {0,0} — no effect.
// On iOS 13+, permission must be granted via a user gesture elsewhere;
// we silently listen and apply drift when data is available.
function useDeviceTilt() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined" || typeof DeviceOrientationEvent === "undefined") return;

    let handler = (e) => {
      const gamma = e.gamma || 0; // -90..90 (left-right)
      const beta = e.beta || 0;   // -180..180 (front-back)
      setTilt({
        x: Math.max(-25, Math.min(25, gamma)),
        y: Math.max(-25, Math.min(25, beta - 45)), // normalize around typical 45° hold
      });
    };

    // Try to request permission on iOS 13+
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission()
        .then((state) => {
          if (state === "granted") {
            window.addEventListener("deviceorientation", handler);
          }
        })
        .catch(() => {});
    } else {
      window.addEventListener("deviceorientation", handler);
    }

    return () => {
      window.removeEventListener("deviceorientation", handler);
    };
  }, []);

  return tilt;
}

// ShatterBurst — shard explosion effect for major rank-up animations.
// Generates tier-colored triangular shards that fly outward from center
// when the old rank icon "shatters" into the new one.
//
// `intensity` (0-1): controls chaos — higher = more shards, wider spread,
// faster rotation. Scaled by Elo delta magnitude.
// Device gyroscope adds a subtle drift to shard trajectories on mobile.
export default function ShatterBurst({ color, delay = 0, intensity = 0.5 }) {
  const tilt = useDeviceTilt();

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Cap intensity so wild deltas don't spawn hundreds of shards on low-end devices
  const cappedIntensity = Math.min(0.85, Math.max(0, intensity));

  const shards = useMemo(() => {
    if (prefersReducedMotion) return [];
    const count = Math.round(12 + cappedIntensity * 10);
    const maxDistance = 140 + cappedIntensity * 220;
    const maxRotation = 360 + cappedIntensity * 540;

    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 360 + (Math.random() * 15 - 7.5);
      const distance = 100 + Math.random() * maxDistance;
      const rad = (angle * Math.PI) / 180;
      return {
        x: Math.cos(rad) * distance,
        y: Math.sin(rad) * distance,
        rotate: Math.random() * maxRotation - maxRotation / 2,
        size: 8 + Math.random() * (12 + cappedIntensity * 8),
        delayOffset: Math.random() * 0.08,
        duration: 0.7 + Math.random() * (0.4 + cappedIntensity * 0.4),
        isAccent: i % 3 === 0,
      };
    });
  }, [delay, cappedIntensity, prefersReducedMotion]);

  // Tilt drift: shards lean toward the device tilt direction
  const driftX = tilt.x * 2;
  const driftY = tilt.y * 2;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[25]">
      {prefersReducedMotion && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at center, ${color.glow}, transparent 60%)`,
            opacity: 0.6,
          }}
        />
      )}
      {shards.map((s, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: s.size,
            height: s.size * 1.4,
            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
            background: s.isAccent
              ? `linear-gradient(135deg, ${color.text}, ${color.to})`
              : `linear-gradient(135deg, ${color.from}, ${color.to})`,
            filter: `drop-shadow(0 0 ${4 + intensity * 6}px ${color.glow})`,
          }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
          animate={{ x: s.x + driftX, y: s.y + driftY, scale: 0.2, opacity: 0, rotate: s.rotate }}
          transition={{
            duration: s.duration * 1.15,
            delay: delay + s.delayOffset,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}
    </div>
  );
}
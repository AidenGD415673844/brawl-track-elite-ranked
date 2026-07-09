import React from "react";
import { motion } from "framer-motion";

// HolographicOverlay — animated foil/shimmer effect for unlocked battle cards.
// Adds a prismatic light sweep and subtle refraction gradient.
export default function HolographicOverlay({ color, active }) {
  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
      {/* Prismatic refraction tint */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          background: `linear-gradient(135deg, ${color.from}50, transparent 25%, ${color.to}50 50%, transparent 75%, ${color.text}30)`,
        }}
      />

      {/* Animated diagonal light sweep — main shimmer */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(110deg, transparent 35%, ${color.text}25 50%, transparent 65%)`,
        }}
        animate={{ x: ["-120%", "220%"] }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 2.5,
        }}
      />

      {/* Secondary shimmer — faster, thinner, offset timing */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(100deg, transparent 45%, rgba(255,255,255,0.15) 50%, transparent 55%)`,
        }}
        animate={{ x: ["-120%", "220%"] }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 4,
          delay: 1.5,
        }}
      />
    </div>
  );
}
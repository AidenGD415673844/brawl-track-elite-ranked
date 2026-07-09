import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TIER_COLORS } from "@/lib/ranks";

// GhostRankAftermath — after a rank-up animation completes, a semi-transparent
// "ghost" of the OLD rank icon lingers in the background, slowly drifting
// upward and fading away over ~8 seconds. Adds weight to the progression.
export default function GhostRankAftermath({ oldRank, onComplete }) {
  const [visible, setVisible] = useState(true);
  const c = TIER_COLORS[oldRank?.tier] || TIER_COLORS.Bronze;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 8000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && oldRank && (
        <motion.div
          className="fixed inset-0 z-[90] pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.25, 0.18, 0.1, 0] }}
          transition={{ duration: 8, times: [0, 0.1, 0.4, 0.7, 1], ease: "easeOut" }}
        >
          <motion.img
            src={oldRank.image}
            alt={oldRank.name}
            className="absolute"
            style={{
              width: 200,
              height: 200,
              objectFit: "contain",
              filter: `brightness(0) invert(1) drop-shadow(0 0 30px ${c.glow}) opacity(0.3)`,
            }}
            initial={{ y: 0, scale: 1, rotate: 0 }}
            animate={{ y: -120, scale: 1.3, rotate: 8 }}
            transition={{ duration: 8, ease: "easeOut" }}
          />
          {/* Faint tier name watermark */}
          <motion.span
            className="absolute mt-48 font-display tracking-[0.3em] uppercase"
            style={{
              fontSize: "1.2rem",
              color: c.text,
              opacity: 0.15,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0] }}
            transition={{ duration: 8, times: [0, 0.2, 1] }}
          >
            {oldRank.tier}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
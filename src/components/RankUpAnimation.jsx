import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TIER_COLORS, getRank } from "@/lib/ranks";
import { playRankSFX, playRankClickSFX } from "@/lib/sfx";
import TierSparkles from "@/components/TierSparkles";
import ShatterBurst from "@/components/ShatterBurst";
import RankSceneBackground from "@/components/RankSceneBackground";
import GhostRankAftermath from "@/components/GhostRankAftermath";

const TIER_SPLASH = {
  Bronze:    { bg: "rgba(180,83,9,0.9)",    glow: "rgba(245,158,11,0.5)" },
  Silver:    { bg: "rgba(100,116,139,0.9)",  glow: "rgba(203,213,225,0.5)" },
  Gold:      { bg: "rgba(202,138,4,0.9)",    glow: "rgba(253,224,71,0.5)" },
  Diamond:   { bg: "rgba(2,132,199,0.9)",    glow: "rgba(56,189,248,0.5)" },
  Mythic:    { bg: "rgba(147,51,234,0.9)",   glow: "rgba(217,70,239,0.5)" },
  Legendary: { bg: "rgba(127,29,29,0.9)",    glow: "rgba(248,113,113,0.5)" },
  Masters:   { bg: "rgba(127,29,29,0.9)",    glow: "rgba(234,88,12,0.5)" },
  Pro:       { bg: "rgba(180,83,9,0.9)",     glow: "rgba(251,191,36,0.5)" },
};

// Structured fire splash — angular blade/flame shapes radiating from center
function StructuredFireSplash({ tier, color, delay }) {
  const splash = TIER_SPLASH[tier] || TIER_SPLASH.Bronze;
  const blades = Array.from({ length: 10 }, (_, i) => i);
  const flames = Array.from({ length: 6 }, (_, i) => i);

  return (
    <>
      {/* Full-screen dark radial background */}
      <motion.div
        className="fixed inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay }}
        style={{
          background: `radial-gradient(circle at center, ${splash.glow} 0%, ${splash.bg} 30%, rgba(0,0,0,0.98) 80%)`,
        }}
      />

      {/* Full-screen diagonal slash shapes */}
      {Array.from({ length: 4 }, (_, i) => (
        <motion.div
          key={`slash-${i}`}
          className="fixed"
          style={{
            width: "180vw",
            height: 120,
            left: "-40vw",
            top: i < 2 ? `${15 + i * 20}%` : `${60 + (i - 2) * 12}%`,
            background: `linear-gradient(90deg, transparent 0%, ${color.to}50 15%, ${color.text}80 45%, ${color.from} 50%, ${color.text}80 55%, ${color.to}50 85%, transparent 100%)`,
            clipPath: "polygon(0% 40%, 100% 5%, 100% 60%, 0% 95%)",
            transformOrigin: "center",
          }}
          initial={{ x: i % 2 === 0 ? "-100vw" : "100vw", opacity: 0, rotate: i % 2 === 0 ? -8 : 8 }}
          animate={{ x: 0, opacity: [0, 0.85, 0], rotate: i % 2 === 0 ? -8 : 8 }}
          transition={{ duration: 1.1, delay: delay + 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}

      {/* Background flame wisps — enlarged for full-screen coverage */}
      {flames.map((i) => {
        const angle = (i / flames.length) * 360 + 30;
        return (
          <motion.div
            key={`wisp-${i}`}
            className="fixed"
            style={{
              width: 1200, height: 200, left: "50%", top: "50%",
              marginLeft: -600, marginTop: -100,
              background: `linear-gradient(90deg, transparent, ${splash.bg}, ${color.from}, transparent)`,
              clipPath: "polygon(0% 50%, 50% 10%, 75% 25%, 100% 50%, 75% 75%, 50% 90%, 0% 50%)",
              transformOrigin: "center",
            }}
            initial={{ scale: 0, rotate: angle, opacity: 0 }}
            animate={{ scale: [0, 1.8, 1.0], opacity: [0, 0.4, 0], rotate: angle }}
            transition={{ duration: 1.5, delay: delay + 0.2, ease: [0.22, 1, 0.36, 1] }}
          />
        );
      })}

      {/* Angular blade slashes — enlarged for full-screen coverage */}
      {blades.map((i) => {
        const angle = (i / blades.length) * 360;
        const isAccent = i % 2 === 0;
        const bladeColor = isAccent ? color.to : color.from;
        return (
          <motion.div
            key={`blade-${i}`}
            className="fixed"
            style={{
              width: 900, height: 110, left: "50%", top: "50%",
              marginLeft: -450, marginTop: -55,
              background: `linear-gradient(90deg, transparent 0%, ${bladeColor} 25%, ${color.text} 50%, ${bladeColor} 75%, transparent 100%)`,
              clipPath: "polygon(0% 45%, 60% 8%, 78% 30%, 100% 50%, 78% 70%, 60% 92%, 0% 55%)",
              transformOrigin: "center",
            }}
            initial={{ scale: 0, rotate: angle, opacity: 0 }}
            animate={{ scale: [0, 1.5, 0.85], opacity: [0, 1, 0], rotate: angle }}
            transition={{ duration: 1.0, delay: delay + 0.1 + (i % 3) * 0.07, ease: [0.22, 1, 0.36, 1] }}
          />
        );
      })}

      {/* Inner concentrated burst — enlarged */}
      {blades.slice(0, 6).map((i) => {
        const angle = (i / 6) * 360 + 15;
        return (
          <motion.div
            key={`inner-${i}`}
            className="fixed"
            style={{
              width: 480, height: 70, left: "50%", top: "50%",
              marginLeft: -240, marginTop: -35,
              background: `linear-gradient(90deg, transparent, ${color.text}, ${color.to}, transparent)`,
              clipPath: "polygon(0% 45%, 55% 5%, 80% 30%, 100% 50%, 80% 70%, 55% 95%, 0% 55%)",
              transformOrigin: "center",
            }}
            initial={{ scale: 0, rotate: angle, opacity: 0 }}
            animate={{ scale: [0, 1.8, 0], opacity: [0, 0.9, 0], rotate: angle }}
            transition={{ duration: 0.8, delay: delay + 0.3 + (i % 2) * 0.05, ease: [0.22, 1, 0.36, 1] }}
          />
        );
      })}
    </>
  );
}

// Vertical wind particles for major rank-up pipeline
function WindParticles({ delay }) {
  const particles = Array.from({ length: 20 }, (_, i) => i);
  return (
    <>
      {particles.map((i) => {
        const x = Math.random() * 100;
        const duration = 0.4 + Math.random() * 0.6;
        const delayOffset = Math.random() * 0.5;
        const height = 40 + Math.random() * 80;
        return (
          <motion.div
            key={`wind-${i}`}
            className="absolute"
            style={{
              left: `${x}%`,
              bottom: 0,
              width: 2,
              height,
              background: "linear-gradient(to top, transparent, rgba(255,255,255,0.4), transparent)",
            }}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: [-100, -window.innerHeight], opacity: [0, 0.6, 0] }}
            transition={{ duration, delay: delay + delayOffset, repeat: 3, ease: "linear" }}
          />
        );
      })}
    </>
  );
}

// Left-to-right fire whoosh sweep
function FireWhoosh({ color, delay }) {
  return (
    <motion.div
      className="absolute inset-0 z-20"
      initial={{ x: "-100%" }}
      animate={{ x: "100%" }}
      transition={{ duration: 1.0, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: `linear-gradient(90deg, transparent 0%, ${color.from}40 20%, ${color.to}80 40%, ${color.text} 50%, ${color.to}80 60%, ${color.from}40 80%, transparent 100%)`,
      }}
    />
  );
}

// === MAJOR RANK UP ANIMATION ===
// Pipeline: before icon → white silhouette → rise + wind → morph → color blend → fire whoosh + splash → audio → text
function MajorRankUpAnimation({ oldRank, newRank, withVoiceover, autoDismiss, onComplete }) {
  const [visible, setVisible] = useState(true);
  const c = TIER_COLORS[newRank.tier];

  const dismiss = () => {
    setVisible(false);
    onComplete?.();
  };

  useEffect(() => {
    // Play audio: intro first, then voiceover (async, non-blocking)
    if (withVoiceover) {
      playRankSFX(newRank, true);
    }
    if (autoDismiss) {
      const timer = setTimeout(dismiss, 9000);
      return () => clearTimeout(timer);
    }
  }, [newRank, autoDismiss, withVoiceover]);

  // Timeline (seconds):
  // 0.0: Show oldRank icon
  // 0.5: White silhouette
  // 1.5: Rise + wind particles
  // 2.5: Crossfade oldRank → newRank silhouette
  // 3.5: Color blend (remove white filter) — syncs with voiceover start (after ~3s intro)
  // 3.5: Fire whoosh + structured splash
  // 5.0: Text slide-in

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={dismiss}
        >
          {/* Cinematic tier-themed background */}
          <RankSceneBackground tier={newRank.tier} color={c} />

          {/* Background sparkles — persist throughout animation */}
          <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
            <TierSparkles tier={newRank.tier} color={c} delay={0.5} />
          </div>

          {/* Phase 1-5: Icon transformation (0s - 3.5s) */}
          <div className="relative z-30" style={{ width: 140, height: 140 }}>
            {/* Old rank icon → white silhouette → rise → crossfade to new rank */}
            <motion.img
              src={oldRank.image}
              alt={oldRank.name}
              className="absolute inset-0"
              style={{ width: 140, height: 140, objectFit: "contain" }}
              initial={{ y: 0, x: 0, scale: 1, opacity: 1, filter: "none" }}
              animate={{
                x: [0, -4, 4, -3, 3, -2, 2, 0, 0, 0],
                y: [0, 0, -40, -80],
                scale: [1, 1.1, 1.2, 0.8],
                opacity: [1, 1, 0.5, 0],
                filter: ["none", "brightness(0) invert(1)", "brightness(0) invert(1)", "brightness(0) invert(1)"],
              }}
              transition={{ duration: 1.6, times: [0, 0.15, 0.3, 0.45, 0.55, 0.65, 0.7, 0.75, 0.85, 1], ease: [0.22, 1, 0.36, 1] }}
            />
            {/* New rank silhouette → color blend */}
            <motion.img
              src={newRank.image}
              alt={newRank.name}
              className="absolute inset-0"
              style={{ width: 140, height: 140, objectFit: "contain" }}
              initial={{ y: 60, scale: 0.8, opacity: 0, filter: "brightness(0) invert(1)" }}
              animate={{
                y: [60, 0, 0],
                scale: [0.8, 1.2, 1],
                opacity: [0, 1, 1],
                filter: ["brightness(0) invert(1)", "brightness(0) invert(1)", "none"],
              }}
              transition={{ duration: 1.1, delay: 1.2, times: [0, 0.5, 1], ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {/* Shatter burst — old rank icon explodes into shards (intensity from Elo jump) */}
          <ShatterBurst color={c} delay={1.2} intensity={Math.min(1, ((newRank.min - oldRank.min) || 500) / 1500)} />

          {/* Wind particles (rise phase) */}
          <WindParticles delay={0.6} />

          {/* Phase 6: Fire whoosh + splash + tier sparkles */}
          <FireWhoosh color={c} delay={2.0} />
          <StructuredFireSplash tier={newRank.tier} color={c} delay={2.0} />
          <TierSparkles tier={newRank.tier} color={c} delay={2.0} />

          {/* Multi-ring expanding blast waves */}
          {[0, 0.15, 0.3].map((offset, i) => (
            <motion.div
              key={`ring-${i}`}
              className="absolute rounded-full z-20"
              initial={{ width: 0, height: 0, opacity: 0.9 }}
              animate={{ width: 600 + i * 200, height: 600 + i * 200, opacity: 0 }}
              transition={{ duration: 1.0, delay: 2.0 + offset, ease: [0.16, 1, 0.3, 1] }}
              style={{
                border: `${4 - i}px solid ${c.text}`,
                boxShadow: `0 0 ${60 - i * 15}px ${c.glow}`,
              }}
            />
          ))}

          {/* Double flash overlay */}
          <motion.div
            className="absolute inset-0 bg-white z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0, 0.4, 0] }}
            transition={{ duration: 0.6, delay: 2.3, times: [0, 0.25, 0.5, 0.75, 1], ease: "easeInOut" }}
          />

          {/* Phase 8: Text slide-in */}
          <motion.h1
            className="relative z-30 mt-8 text-center"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 3.0, type: "spring", stiffness: 200, damping: 18 }}
            style={{
              fontFamily: "'Lilita One', cursive",
              fontSize: "2.5rem",
              color: c.text,
              textShadow: `0 0 20px ${c.glow}, 0 2px 4px rgba(0,0,0,0.5)`,
              letterSpacing: "0.05em",
            }}
          >
            {newRank.tier.toUpperCase()}
          </motion.h1>

          <motion.p
            className="relative z-30 mt-2 text-sm font-bold tracking-widest uppercase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.3, type: "spring", stiffness: 250, damping: 20 }}
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Major Rank Up!
          </motion.p>

          {/* Ghost of the old rank lingers after animation */}
          <GhostRankAftermath oldRank={oldRank} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// === STANDARD (NON-MAJOR) RANK UP ANIMATION ===
function StandardRankUpAnimation({ newRank, withVoiceover, autoDismiss, onComplete }) {
  const [visible, setVisible] = useState(true);
  const c = TIER_COLORS[newRank.tier];

  const dismiss = () => {
    setVisible(false);
    onComplete?.();
  };

  useEffect(() => {
    if (withVoiceover) {
      playRankSFX(newRank, true);
    }
    if (autoDismiss) {
      const timer = setTimeout(dismiss, 6000);
      return () => clearTimeout(timer);
    }
  }, [newRank, autoDismiss, withVoiceover]);

  // Intro audio plays for ~3s, then voiceover — splash syncs at 3s
  const PRE_ROLL = 3.0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={dismiss}
        >
          {/* Cinematic tier-themed background */}
          <RankSceneBackground tier={newRank.tier} color={c} />

          {/* Background sparkles — persist throughout animation */}
          <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
            <TierSparkles tier={newRank.tier} color={c} delay={0.5} />
          </div>

          <StructuredFireSplash tier={newRank.tier} color={c} delay={PRE_ROLL} />
          <TierSparkles tier={newRank.tier} color={c} delay={PRE_ROLL} />

          <motion.div
            className="absolute rounded-full"
            initial={{ width: 0, height: 0, opacity: 0.9 }}
            animate={{ width: 600, height: 600, opacity: 0 }}
            transition={{ duration: 1.3, delay: PRE_ROLL, ease: [0.16, 1, 0.3, 1] }}
            style={{ border: `4px solid ${c.text}`, boxShadow: `0 0 60px ${c.glow}` }}
          />

          <motion.div
            className="absolute inset-0 bg-white z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.85, 0] }}
            transition={{ duration: 0.5, delay: PRE_ROLL + 0.5, ease: "easeInOut" }}
          />

          <motion.div
            className="relative z-30"
            initial={{ y: -400, scale: 2, opacity: 0, filter: "brightness(0) invert(1)" }}
            animate={{
              y: [-400, 0, -20, 0],
              scale: [2, 1.3, 1.4, 1],
              opacity: [0, 1, 1, 1],
              filter: ["brightness(0) invert(1)", "brightness(0) invert(1)", "brightness(1)", "brightness(1)"],
            }}
            transition={{ duration: 1.1, delay: PRE_ROLL, times: [0, 0.6, 0.8, 1], ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={newRank.image}
              alt={newRank.name}
              style={{ width: 140, height: 140, objectFit: "contain", filter: `drop-shadow(0 0 30px ${c.glow})` }}
            />
          </motion.div>

          <motion.h1
            className="relative z-30 mt-4 text-center"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: PRE_ROLL + 0.6, type: "spring", stiffness: 200, damping: 18 }}
            style={{
              fontFamily: "'Lilita One', cursive",
              fontSize: "2.5rem",
              color: c.text,
              textShadow: `0 0 20px ${c.glow}, 0 2px 4px rgba(0,0,0,0.5)`,
              letterSpacing: "0.05em",
            }}
          >
            {newRank.name.toUpperCase()}
          </motion.h1>

          <motion.p
            className="relative z-30 mt-2 text-sm font-bold tracking-widest uppercase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: PRE_ROLL + 0.8, type: "spring", stiffness: 250, damping: 20 }}
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Rank Up!
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// === MAIN EXPORT — routes to major or standard animation ===
export default function RankUpAnimation({ oldRank, newRank, isMajor, withVoiceover = true, autoDismiss = true, onComplete }) {
  if (isMajor && oldRank) {
    return (
      <MajorRankUpAnimation
        oldRank={oldRank}
        newRank={newRank}
        withVoiceover={withVoiceover}
        autoDismiss={autoDismiss}
        onComplete={onComplete}
      />
    );
  }
  return (
    <StandardRankUpAnimation
      newRank={newRank}
      withVoiceover={withVoiceover}
      autoDismiss={autoDismiss}
      onComplete={onComplete}
    />
  );
}

// Lightweight click splash (no voiceover, auto-dismiss faster)
export function RankClickSplash({ rank, onComplete }) {
  const [visible, setVisible] = useState(true);
  const c = TIER_COLORS[rank.tier];

  useEffect(() => {
    playRankClickSFX(rank);
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 2500);
    return () => clearTimeout(timer);
  }, [rank]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Cinematic tier-themed background */}
          <RankSceneBackground tier={rank.tier} color={c} />

          {/* Background sparkles */}
          <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
            <TierSparkles tier={rank.tier} color={c} delay={0.1} />
          </div>
          <StructuredFireSplash tier={rank.tier} color={c} delay={0} />
          <motion.img
            src={rank.image}
            alt={rank.name}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 1] }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: 100, height: 100, objectFit: "contain", filter: `drop-shadow(0 0 20px ${c.glow})` }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Award } from "lucide-react";
import BattleCard from "@/components/BattleCard";
import CardMasteryProgress from "@/components/CardMasteryProgress";
import ProfileBattleCard from "@/components/ProfileBattleCard";
import { BATTLE_CARDS, isCardUnlocked } from "@/lib/battleCards";
import { playCardSFX, primeCardAudio } from "@/lib/cardSfx";
import TierSparkles from "@/components/TierSparkles";

// Battle Card Gallery — grid of all tier cards.
// Unlocked cards can be equipped; equipping plays tier SFX (voiceover only for Pro).
export default function BattleCardGallery({ player, onEquip }) {
  const [equipAnim, setEquipAnim] = useState(null);
  const [animNonce, setAnimNonce] = useState(0);
  const timeoutRef = useRef(null);

  const handleEquip = (card) => {
    if (!isCardUnlocked(card, player)) return;

    primeCardAudio();
    onEquip(card.tier);

    // Uses dedicated card SFX — NOT the rank-up animation SFX
    playCardSFX(card.tier);

    // Clear any existing timeout so switching cards re-triggers the animation
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setEquipAnim(null);

    // Use a nonce so AnimatePresence sees each click as a fresh element
    // (same key = no re-trigger). Small delay lets exit animation process.
    const newNonce = animNonce + 1;
    setAnimNonce(newNonce);
    setTimeout(() => {
      setEquipAnim({ ...card, nonce: newNonce });
      timeoutRef.current = setTimeout(() => setEquipAnim(null), 2500);
    }, 50);
  };

  const unlockedCount = BATTLE_CARDS.filter((c) => isCardUnlocked(c, player)).length;

  return (
    <Card className="bg-card border-border p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-cyan-500" />
          <h2 className="text-lg font-display font-bold text-foreground">Battle Cards</h2>
        </div>
        <span className="text-xs text-muted-foreground font-bold">
          {unlockedCount}/{BATTLE_CARDS.length}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Equip a card to represent your journey. Unlock cards by reaching each rank tier.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {BATTLE_CARDS.map((card) => (
          <BattleCard
            key={card.tier}
            card={card}
            unlocked={isCardUnlocked(card, player)}
            equipped={player.equippedCard === card.tier}
            onClick={() => handleEquip(card)}
          />
        ))}
      </div>

      {/* Featured profile battle card — shows all-time peak rank, below the grid */}
      <div className="mt-4 flex justify-center">
        <ProfileBattleCard player={player} />
      </div>

      <CardMasteryProgress player={player} />

      {/* Equip animation overlay */}
      <AnimatePresence>
        {equipAnim && (
          <motion.div
            key={equipAnim.nonce}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <TierSparkles tier={equipAnim.tier} color={equipAnim.color} delay={0} />
            </div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.4, 1, 1, 0],
                opacity: [0, 1, 1, 1, 0],
              }}
              transition={{
                duration: 2.5,
                times: [0, 0.25, 0.4, 0.8, 1],
                ease: "easeOut",
              }}
              className="relative flex flex-col items-center"
            >
              <img
                src={equipAnim.image}
                alt={equipAnim.tier}
                style={{
                  width: 140,
                  height: 140,
                  objectFit: "contain",
                  filter: `drop-shadow(0 0 30px ${equipAnim.color.glow})`,
                }}
              />
              <p
                className="font-display text-center mt-2 text-lg font-bold"
                style={{ color: equipAnim.color.text }}
              >
                {equipAnim.tier.toUpperCase()}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
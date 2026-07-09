// Tier upgrade deep-analysis content.
// Sent as inbox notifications when a player reaches a new major tier.
// Diamond & Mythic: how to play + how to draft + what to expect.
// Legendary & Masters: what to expect only.

import { addInboxMessage } from "@/lib/inbox";

export const TIER_UPGRADES = {
  Diamond: {
    title: "Diamond Tier Reached! 💎 Deep Analysis",
    howToPlay: "Diamond introduces Ban + All Pick drafting and requires 9 Power 9 brawlers. The format is still Best of 1, but the ban phase changes everything. Your first ban should target the enemy's strongest brawler or the one that counters your planned comp. Track enemy supers and cooldowns — at this level, macro awareness separates climbers from stagnators. Practice the 'retreat and regroup': if you're outnumbered at center, fall back rather than feeding. In Knockout, learn to trade advantageously — if you're up 2v1, zone them out and let the timer work for you.",
    howToDraft: "With bans active, draft strategy becomes critical. Don't ban the 'strongest' brawler — ban the one that counters YOUR planned composition. Have 3-4 comfort picks across different roles (tank, DPS, thrower, support) so you can flex after seeing the enemy team. Counter-drafting is deliberate: if they pick a tank, pick a tank-counter. Think about team synergy, not just individual counters — a team of good individual picks with no synergy loses to a coordinated team of flex picks.",
    whatToExpect: "Diamond is where the grind gets real. You'll hit walls and feel stuck. Players here track supers, count gems, and read the flow of battle. Loss streaks of 3-4 are normal — stop queueing after 2 losses. Your randoms are still inconsistent, but the enemies are getting better. The gap between Diamond III and Mythic is brutal — you need near-flawless play and 12 Power 11 brawlers to progress. Track your win rate over 20-game samples, not individual games.",
  },
  Mythic: {
    title: "Mythic Tier Reached! 🔮 Deep Analysis",
    howToPlay: "Mythic shifts to Best of 3 format with Ban + Turn Pick — this is a completely different game. Bo3 means consistency matters more than single-game heroics. You need 12 Power 11 brawlers to even queue. Turn pick means draft order matters: first pick should be a safe, flexible brawler; last pick should be your counter to the enemy comp. Track multiple cooldowns simultaneously. In Bo3, adapt between games — if you lost game 1, identify why and adjust your draft and playstyle for game 2.",
    howToDraft: "Turn pick is chess, not checkers. First pick: safe meta brawler that's hard to counter. Middle picks: fill your team's needs (tank, DPS, support). Last pick: counter the enemy's biggest threat. Value flex picks — being able to play multiple roles at a high level makes you invaluable in draft. One-tricks plateau at Mythic. Start innovating within the meta — surprise picks that catch the enemy off-guard can win games, but make sure they're strategic, not reckless. Ban strategically — ban the brawler that would counter your planned comp, not just the 'strongest' brawler.",
    whatToExpect: "At Mythic, every player is good. The difference between climbing and stagnating is almost entirely mental. You'll face losing streaks that feel undeserved — accept that variance is real. Even the best players lose 40% of their games. Focus on process over outcome: did you make the right decision, even if the result was bad? Bo3 format means each match is longer and more draining — mental fatigue is a bigger enemy than bad randoms. Build a pre-game routine: warm up in unranked, set a session goal (not a rank target), and stop when you feel fatigue.",
  },
  Legendary: {
    title: "Legendary Tier Reached! 🔥 What to Expect",
    whatToExpect: "Legendary is where the mental game becomes the entire game. Your mechanics are already elite; what separates you from Masters is consistency under pressure. Each loss feels heavier because each one matters more — counteract this by zooming out: in a 200-game season, one loss is 0.5%. Don't let a single bad game cascade into a tilt streak. Develop a reset ritual between games — take a breath, stretch, refocus. At this level, taking a break IS climbing. A rested mind plays better than a tired one grinding games. You should be able to carry a 2v3 against good players — if you can't, you don't belong here yet. The enemies are just as good as you; the difference-maker is who makes fewer mistakes. Be perfect.",
  },
  Masters: {
    title: "Masters Tier Reached! 👑 What to Expect",
    whatToExpect: "Masters is the top fraction of a percent. Every player here is elite. The mental game is 80% of the difference between winning and losing. You need a tournament mindset: treat every session like a competitive match. Set goals, review replays, and be brutally honest about your mistakes. Ego is your biggest enemy — the moment you think you have nothing to learn, you start declining. The difference between winning and losing is a single decision, a single shot, a single moment of hesitation. Be the one who doesn't hesitate. Stay humble, stay hungry, and never stop studying the game. You're not just playing the meta — you're shaping it. The meta evolves constantly, and what you innovate today will be countered tomorrow.",
  },
};

export function notifyTierUpgrade(tier) {
  const upgrade = TIER_UPGRADES[tier];
  if (!upgrade) return;

  const sections = [];
  if (upgrade.howToPlay) sections.push(`🎮 HOW TO PLAY:\n${upgrade.howToPlay}`);
  if (upgrade.howToDraft) sections.push(`⚔️ HOW TO DRAFT:\n${upgrade.howToDraft}`);
  if (upgrade.whatToExpect) sections.push(`📊 WHAT TO EXPECT:\n${upgrade.whatToExpect}`);

  addInboxMessage({
    type: "upgrade",
    title: upgrade.title,
    body: sections.join("\n\n"),
    icon: "book",
  });
}
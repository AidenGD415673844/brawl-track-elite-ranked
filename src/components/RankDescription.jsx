import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Trophy, Gamepad2, Swords, Crosshair, Target, Lightbulb, AlertTriangle, TrendingUp, TrendingDown, Activity, Zap, Laugh } from "lucide-react";
import { getRank, TIER_COLORS } from "@/lib/ranks";
import { SUB_RANK_DESCRIPTIONS } from "@/lib/subRankDescriptions";
import RankBadge from "@/components/RankBadge";

const TIER_EXTRA = {
  Bronze: {
    macro: "Your map awareness is minimal — you likely don't track enemy positions or count gems. Start by glancing at the minimap every few seconds. In Gem Grab, never push past 10 gems without retreating. In Heist, learn the shortest path to the enemy vault. Macro wins games before the fighting even starts, and at this level, simply knowing the objective puts you ahead of most players.",
    mental: "You're going to get frustrated by bad teammates — that's normal at this level. The key is to accept that you can't control your randoms and focus entirely on your own play. Don't queue again immediately after a frustrating loss; take a 5-minute break. Tilt is the #1 reason Bronze players stay in Bronze. If you find yourself getting angry, switch to an unranked match or a different game mode to decompress before pushing ranked again.",
  },
  Silver: {
    macro: "You're starting to understand objectives but often forget them mid-fight. Practice 'objective checks' — every 10 seconds, ask yourself: 'Am I helping win the objective right now?' If the answer is no, reposition. In Brawl Ball, stop chasing kills and get back on defense. In Hot Zone, learn which zone to contest and which to give up. Your macro is developing, but you still get distracted by fights that don't matter.",
    mental: "Silver is where tilt starts to become a real problem. You're good enough to recognize bad plays (yours and others'), but not good enough to consistently overcome them. Don't flame your teammates — it makes them play worse and it makes you play worse. Mute toxic players immediately. Set a rule: after 2 losses in a row, take a 10-minute break. Your mental game is just as important as your mechanical game, and learning to manage tilt early will pay dividends at every rank above this one.",
  },
  Gold: {
    macro: "Your macro is improving — you hold lanes and retreat when low. But you need to start tracking enemy supers and rotations. Count how many enemies have their super charged. If two enemies have supers and you don't, you're about to lose a fight — back off. In Gem Grab, start counting the enemy's gems and predicting when they'll rush. In Heist, track which enemies are flanking vs. vault-rushing. Macro awareness is what separates Gold from Diamond.",
    mental: "Gold is the 'I think I'm better than I am' rank. You'll be tempted to blame teammates for every loss. Resist that urge. After every loss, identify one thing YOU could have done better — even if your teammates were terrible. This habit alone will carry you to Diamond. If you find yourself getting frustrated with randoms, queue with a friend. And remember: your rank doesn't define your worth as a person. It's just a game — play to improve, not to prove.",
  },
  Diamond: {
    macro: "Strong macro fundamentals. You read the flow of battle and track enemy supers. Now you need to master rotations — knowing when to leave your lane to help a struggling teammate, and when to stay and hold your ground. In Gem Grab, practice the 'retreat and regroup' — if you're outnumbered at center, fall back and let your team regroup rather than feeding. In Knockout, learn to trade advantageously — if you're up 2v1, don't rush; zone them out and let the timer work for you.",
    mental: "Diamond is where the grind gets real. You'll hit walls and feel stuck. The key is to stop focusing on your rank number and start focusing on your improvement rate. Track your win rate over 20-game samples, not individual games. If you lose 3 in a row, stop — your play is degrading and you're on tilt even if you don't feel it. Watch replays of your losses. Identify patterns. At this level, the mental game is 50% of your performance, and players who manage their mental state climb faster than those who don't.",
  },
  Mythic: {
    macro: "Advanced macro play. You track multiple cooldowns, predict enemy movements, and position proactively. Now you need to master draft-phase macro — your pick should set up your team's win condition, not just counter one enemy. In Brawl Ball, learn to read the enemy's kickoff formation and adjust. In Hot Zone, master zone trading — give up a zone to secure two others. You're no longer reacting to the game; you're shaping it.",
    mental: "At Mythic, every player is good. The difference between climbing and stagnating is almost entirely mental. You'll face losing streaks that feel undeserved. Accept that variance is real — even the best players lose 40% of their games. Focus on process over outcome: did you make the right decision, even if the result was bad? If yes, you played well. Build a pre-game routine: warm up in unranked, set a goal for the session (not a rank target), and stop when you feel fatigue setting in. Mental fatigue is a bigger enemy than bad randoms at this level.",
  },
  Legendary: {
    macro: "Near-expert macro. You read the game several steps ahead and understand win conditions deeply. You know exactly when to trade, when to disengage, and when to all-in. Now you need to master macro mind games — baiting enemy supers by feigning aggression, then punishing when they've wasted them. In every mode, your positioning alone shapes the flow of the match. You don't just play the objective — you control the enemy's access to it.",
    mental: "Legendary is where the mental game becomes the entire game. Your mechanics are already elite; what separates you from Masters is consistency under pressure. You'll feel the weight of every loss because each one feels like it matters more. Counteract this by zooming out: in a 200-game season, one loss is 0.5%. Don't let a single bad game cascade into a tilt streak. Develop a reset ritual between games — take a breath, stretch, refocus. And remember: at this level, taking a break IS climbing. A rested mind plays better than a tired one grinding games.",
  },
  Masters: {
    macro: "Expert-level macro. You dictate the pace of the game and control engagements. You think in terms of team compositions and win conditions, not individual plays. At this level, macro is about innovation — finding new strategies, adapting to meta shifts, and exploiting patterns that other players haven't discovered yet. You're not just playing the meta; you're shaping it.",
    mental: "Masters is the top fraction of a percent. Every player here is elite. The mental game is 80% of the difference between winning and losing at this level. You need to develop a tournament mindset: treat every session like a competitive match. Set goals, review replays, and be brutally honest about your mistakes. At this level, ego is your biggest enemy — the moment you think you have nothing to learn, you start declining. Stay humble, stay hungry, and never stop studying the game.",
  },
  Pro: {
    macro: "Professional-level macro. Your game knowledge is encyclopedic, your strategic understanding is world-class, and your ability to read and shape the game is unmatched. You think in terms of draft-phase strategy, win conditions, and counter-strategies that span the entire match. You don't just adapt to the meta — you define it. Other players study your play to improve their own.",
    mental: "At the professional level, the mental game is everything. Your mechanics are perfect, your macro is world-class — what separates the best from the rest is mental resilience under maximum pressure. You need to perform flawlessly in high-stakes situations, maintain focus over long sessions, and recover instantly from mistakes. Develop a pre-match routine that puts you in the zone. Learn to recognize the signs of mental fatigue before they affect your play. And remember: even at the professional level, the game should be fun. If it stops being fun, take a step back. Burnout is real, and the best players are the ones who know when to rest.",
  },
};

const BAND_FOCUS = {
  Bronze: "Drafting Fundamentals",
  Silver: "Drafting Fundamentals",
  Gold: "Positioning Analysis",
  Diamond: "Positioning Analysis",
  Mythic: "Resource & Objective Tracking",
  Legendary: "Resource & Objective Tracking",
  Masters: "Resource & Objective Tracking",
  Pro: "Resource & Objective Tracking",
};

const TIER_ADVICE = {
  Bronze: "Focus on mastering one brawler at a time. Watch beginner guides on YouTube. Your goal right now is game knowledge, not rank. Play 5 unranked matches for every ranked match to practice without pressure.",
  Silver: "Start studying the meta. Learn 3 brawlers per mode. Turn off auto-aim permanently. Watch your replays — identify one mistake per game and focus on fixing it. Play during off-peak hours for easier matchmaking.",
  Gold: "Master counter-picking. Memorize which brawlers counter which. Study map-specific tier lists. Start warming up in unranked before ranked. Set a stop-loss rule: 2 losses in a row = take a break.",
  Diamond: "Study team compositions and synergy. Practice predictive aim. Learn to track enemy supers and cooldowns. Watch competitive gameplay and analyze their decision-making. Focus on macro — rotations, zone control, and win conditions.",
  Mythic: "Master draft-phase strategy. Study tournament VODs. Focus on macro decisions. Develop a pre-game routine. Track your win rate over 20-game samples. If you lose 3 in a row, stop — you're tilted even if you don't feel it.",
  Legendary: "Innovate within the meta. Study professional matches frame by frame. Your mental game is everything now — develop a reset ritual between games. Take breaks — a rested mind plays better than a tired one grinding games.",
  Masters: "You're at the top fraction of players. Study tournament VODs and innovate strategies. Your mental game is 80% of your performance — stay humble, stay hungry. Treat every session like a competitive match. Review your replays with brutal honesty.",
  Pro: "Go touch grass, or join the eSports team. You've mastered the game — now master yourself. Consider coaching, content creation, or competitive play. The world is yours.",
};

const TILT_RECOVERY = [
  "Stop queueing immediately. Take a 15-minute break — walk, stretch, hydrate. Tilt is real and it's degrading your play more than you think.",
  "Switch to unranked or a different game mode to decompress. Don't push ranked while tilted — you'll only lose more and dig yourself deeper.",
  "Review your last 3 losses. Look for patterns: overextending? Autolocking? Ignoring objectives? Identify ONE thing to fix next session.",
  "Pick your most comfortable brawler for your next session. Play safe, play smart. Fundamentals win games — not fancy plays.",
  "Set a hard stop-loss rule: 2 losses in a row = done for the session. No exceptions. Your rank will thank you tomorrow.",
];

const PILLARS = [
  { key: "skill", label: "Rank Skill", icon: Trophy, source: "sub" },
  { key: "playstyle", label: "How You Play", icon: Gamepad2, source: "sub" },
  { key: "drafting", label: "How You Draft", icon: Swords, source: "sub" },
  { key: "mechanics", label: "Mechanics", icon: Crosshair, source: "sub" },
];

export default function RankDescription({ elo, winStreak = 0 }) {
  const rank = getRank(elo);
  const subDesc = SUB_RANK_DESCRIPTIONS[rank.name];
  const tierExtra = TIER_EXTRA[rank.tier];
  const c = TIER_COLORS[rank.tier];
  const bandFocus = BAND_FOCUS[rank.tier];
  const advice = TIER_ADVICE[rank.tier];

  if (!subDesc) return null;

  const isOnTilt = winStreak < 0 && Math.abs(winStreak) >= 3;
  const isWinStreak = winStreak > 0;

  // Momentum calculation: -100 (max tilt) to +100 (max momentum)
  const momentum = winStreak === 0 ? 0 : winStreak > 0
    ? Math.min(100, winStreak * 15)
    : Math.max(-100, winStreak * 15);

  const eloRange = isFinite(rank.max)
    ? `${rank.min.toLocaleString()} – ${rank.max.toLocaleString()}`
    : `${rank.min.toLocaleString()}+`;

  return (
    <Card className="bg-card border-border p-5 rounded-2xl">
      <div className="flex items-center gap-3 mb-5">
        <RankBadge elo={elo} size={48} />
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">What Your Rank Means</h3>
          <p className="text-xs font-semibold" style={{ color: c.text }}>
            {rank.name} · {eloRange} Elo
          </p>
        </div>
        <div
          className="text-[9px] font-bold px-2 py-1 rounded-lg border"
          style={{ background: `${c.from}22`, borderColor: `${c.from}44`, color: c.text }}
        >
          <Target className="w-2.5 h-2.5 inline mr-1" />
          {bandFocus}
        </div>
      </div>

      {/* Momentum View */}
      <div className="mb-4 rounded-xl bg-muted/40 border border-border p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: momentum > 0
                  ? "rgba(16,185,129,0.15)"
                  : momentum < 0
                  ? "rgba(239,68,68,0.15)"
                  : "rgba(148,163,184,0.15)",
              }}
            >
              {momentum > 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : momentum < 0 ? (
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              ) : (
                <Activity className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Momentum</p>
              <p className="text-[9px] text-muted-foreground">
                {momentum > 0
                  ? `${winStreak}-game win streak — riding the wave`
                  : momentum < 0
                  ? `${Math.abs(winStreak)}-game loss streak — cool down`
                  : "Neutral — no streak active"}
              </p>
            </div>
          </div>
          <span
            className={`text-sm font-display font-black ${
              momentum > 0 ? "text-emerald-500" : momentum < 0 ? "text-red-500" : "text-slate-400"
            }`}
          >
            {momentum > 0 ? `+${momentum}` : momentum}
          </span>
        </div>
        {/* Momentum bar — centered at 0, fills left (negative) or right (positive) */}
        <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
          <div className="absolute left-1/2 top-0 h-full w-px bg-border" />
          {momentum !== 0 && (
            <motion.div
              className="absolute top-0 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.abs(momentum) / 2}%` }}
              transition={{ duration: 0.5 }}
              style={
                momentum > 0
                  ? { left: "50%", background: "linear-gradient(90deg, #10b981, #34d399)" }
                  : { right: "50%", background: "linear-gradient(270deg, #ef4444, #f87171)" }
              }
            />
          )}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] text-red-500/60 font-display">TILT</span>
          <span className="text-[8px] text-muted-foreground/60 font-display">NEUTRAL</span>
          <span className="text-[8px] text-emerald-500/60 font-display">ON FIRE</span>
        </div>
      </div>

      {isOnTilt && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-xs font-bold text-red-500">
              Tilt Recovery Mode — {Math.abs(winStreak)}-game losing streak detected
            </p>
          </div>
          <div className="space-y-1.5">
            {TILT_RECOVERY.map((drill, i) => (
              <p key={i} className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="text-red-500 font-bold mr-1">{i + 1}.</span>
                {drill}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          const text = subDesc[pillar.key] || "";
          if (!text) return null;
          return (
            <div key={pillar.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${c.from}22` }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: c.text }} />
                </div>
                <p className="text-xs font-bold text-foreground">{pillar.label}</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {text}
              </p>
            </div>
          );
        })}
      </div>

      {/* Funny sub-rank commentary */}
      {subDesc.funny && (
        <div
          className="mt-4 rounded-xl border p-3"
          style={{ background: `${c.from}10`, borderColor: `${c.from}33` }}
        >
          <div className="flex items-start gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${c.from}22` }}
            >
              <Laugh className="w-3.5 h-3.5" style={{ color: c.text }} />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground mb-1">Reality Check</p>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "{subDesc.funny}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tier mental/macro context */}
      <div className="mt-4 pt-4 border-t border-border space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${c.from}22` }}
            >
              <Zap className="w-3.5 h-3.5" style={{ color: c.text }} />
            </div>
            <p className="text-xs font-bold text-foreground">Macro-Awareness</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tierExtra?.macro || ""}
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${c.from}22` }}
            >
              <Lightbulb className="w-3.5 h-3.5" style={{ color: c.text }} />
            </div>
            <p className="text-xs font-bold text-foreground">Mental Game & Coach's Advice</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tierExtra?.mental || ""}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
            <span className="font-bold text-foreground/80">Advice: </span>{advice}
          </p>
        </div>
      </div>
    </Card>
  );
}
import { getRank, getRankIndex, TIER_COLORS, RANKS } from "@/lib/ranks";

// ─── Rank Analyser ──────────────────────────────────────────────
// Pure preset-based analysis. No AI / LLM calls.
// Crafts a coaching message from rule-based presets.

export function analyzeRank(player, forecast, boost, battleLog = []) {
  const rank = getRank(player.currentElo);
  const peakRank = getRank(player.highestElo);
  const c = TIER_COLORS[rank.tier];

  // 1. Headline — trajectory vs last season
  const eloDelta = player.currentElo - player.lastSeasonElo;
  let headline;
  if (eloDelta > 500)
    headline = `You're on fire — up ${eloDelta} Elo since last season!`;
  else if (eloDelta > 0)
    headline = `Steady climb — you're up ${eloDelta} Elo from last season.`;
  else if (eloDelta === 0)
    headline = `Holding strong at last season's level.`;
  else
    headline = `Tough season — you're down ${Math.abs(eloDelta)} Elo from your last season peak.`;

  // 2. Win rate analysis
  const wr = player.winRate;
  let winRateMsg;
  if (wr >= 65)
    winRateMsg = `Your ${wr}% win rate is elite — you're winning nearly two out of every three matches. Keep doing what you're doing.`;
  else if (wr >= 55)
    winRateMsg = `A ${wr}% win rate is solidly above break-even. You're climbing — just stay consistent and avoid tilt.`;
  else if (wr >= 50)
    winRateMsg = `At ${wr}%, you're barely above even. Focus on closing out close games and protecting your lead to push higher.`;
  else if (wr >= 45)
    winRateMsg = `Your ${wr}% win rate is slightly below break-even. Review your losses — are there patterns in the modes or maps where you struggle?`;
  else
    winRateMsg = `A ${wr}% win rate means you're losing more than winning. Consider stepping back, reviewing your gameplay, and focusing on fundamentals before pushing ranked.`;

  // 3. Streak analysis
  const streak = player.winStreak;
  let streakMsg;
  if (streak >= 5)
    streakMsg = `You're on a ${streak}-game win streak — ride the momentum, but don't get reckless. One bad call can end it fast.`;
  else if (streak >= 2)
    streakMsg = `A ${streak}-game streak is building confidence. Keep the pressure on and play your best brawlers.`;
  else if (streak === 0)
    streakMsg = `Your streak is reset — every match is a fresh start. Pick a comfortable brawler and get back in the groove.`;
  else
    streakMsg = `You're on a ${Math.abs(streak)}-game losing streak. Take a breather, regroup, and come back fresh — tilted play only makes it worse.`;

  // 4. Boost analysis
  let boostMsg;
  if (boost.active)
    boostMsg = `${boost.label} — you're ${boost.ranksAway} rank${boost.ranksAway > 1 ? "s" : ""} from ${boost.targetRank.name}. Capitalize on the bonus gains while you can; every win is worth more right now.`;
  else
    boostMsg = `No rank boost active — you're at or near your peak rank of ${peakRank.name}. Every win matters from here, so play smart and consistent.`;

  // 5. Forecast summary
  let forecastMsg = "";
  if (forecast) {
    const dir = forecast.evPerMatch;
    if (dir > 0)
      forecastMsg = `Based on your win rate, you're projected to climb to ${forecast.final.median} Elo over the next ${forecast.paths.length - 1} matches (+${forecast.evPerMatch} per game on average).`;
    else if (dir < 0)
      forecastMsg = `Based on your win rate, you're projected to drop to ${forecast.final.median} Elo over the next ${forecast.paths.length - 1} matches (${forecast.evPerMatch} per game on average). Time to adjust your strategy.`;
    else
      forecastMsg = `Based on your win rate, you're projected to stay around ${forecast.final.median} Elo over the next ${forecast.paths.length - 1} matches. You need to tip the scales to start climbing.`;
  }

  // 6. Experience level
  const gp = player.gamesPlayed;
  let expMsg;
  if (gp >= 500)
    expMsg = `With ${gp} games under your belt, you have the experience to make real adjustments. Trust your reads and refine your craft.`;
  else if (gp >= 200)
    expMsg = `At ${gp} games, you're getting seasoned — start paying attention to patterns in your play and exploit them.`;
  else
    expMsg = `With ${gp} games, you're still early in your ranked journey. Focus on learning — matchups, maps, and modes — not just the scoreboard.`;

  // 7. Skill self-rating context
  const sk = player.skill;
  let skillMsg;
  if (sk >= 8)
    skillMsg = `Your self-rated skill of ${sk}/10 shows strong confidence. Make sure your gameplay backs it up — review replays to confirm you're playing at the level you believe.`;
  else if (sk >= 5)
    skillMsg = `A self-rated ${sk}/10 is honest and balanced. You know your strengths and gaps — focus on shoring up the weak spots.`;
  else
    skillMsg = `At ${sk}/10 self-rated skill, you're still developing. That's perfectly fine — focus on one improvement at a time rather than trying to fix everything.`;

  // 8. Trophies analysis
  const tr = player.trophies;
  const elo = player.currentElo;
  let trophiesMsg;
  if (tr > elo * 1.2)
    trophiesMsg = `Your ${tr.toLocaleString()} trophies are well ahead of your ${elo.toLocaleString()} Elo — you have strong overall game knowledge. Translate that consistency into ranked to climb faster.`;
  else if (tr > elo * 0.8)
    trophiesMsg = `Your ${tr.toLocaleString()} trophies are well-matched with your ${elo.toLocaleString()} Elo — you're balanced across all game modes.`;
  else
    trophiesMsg = `Your ${tr.toLocaleString()} trophies trail your ${elo.toLocaleString()} Elo — your ranked performance outpaces your overall trophy count. Consider broadening your brawler roster.`;

  // 9. Rank Gap — distance to next rank
  const rankIdx = getRankIndex(elo);
  const nextRank = RANKS[Math.min(RANKS.length - 1, rankIdx + 1)];
  let gapMsg;
  if (rankIdx === RANKS.length - 1)
    gapMsg = `You're at the pinnacle — ${rank.name} is the highest rank. There's nowhere left to climb; focus on maintaining your position and helping others improve.`;
  else {
    const gap = Math.max(0, nextRank.min - elo);
    const ev = forecast?.evPerMatch || 1;
    const matchesAway = ev > 0 ? Math.ceil(gap / ev) : Math.ceil(gap / 90);
    gapMsg = `You're ${gap.toLocaleString()} Elo away from ${nextRank.name}. At your current pace, that's roughly ${matchesAway} matches away — every game counts!`;
  }

  // 10. Consistency
  let consistencyMsg;
  if (wr >= 60)
    consistencyMsg = `Your ${wr}% win rate shows dominant consistency — you're reliably beating the field. This is the zone where climbing feels effortless. Keep your routine steady.`;
  else if (wr >= 50)
    consistencyMsg = `Your ${wr}% win rate shows moderate consistency — you win more than you lose, but games are competitive. Tightening up a few matchups could push you to the next tier.`;
  else
    consistencyMsg = `Your ${wr}% win rate suggests inconsistency — results are swingy. Focus on your strongest brawlers and favorite modes to stabilize your climb.`;

  // 11. Momentum (from recent battle log)
  let momentumMsg = "";
  const recentBattles = battleLog.filter((e) => !e.manual).slice(0, 5);
  if (recentBattles.length > 0) {
    const recentWins = recentBattles.filter((e) => e.result === "victory").length;
    const recentRate = Math.round((recentWins / recentBattles.length) * 100);
    if (recentRate >= 60)
      momentumMsg = `In your last ${recentBattles.length} battles, you've won ${recentWins} (${recentRate}%). Your momentum is strong — ride the wave but stay focused!`;
    else if (recentRate >= 40)
      momentumMsg = `In your last ${recentBattles.length} battles, you've won ${recentWins} (${recentRate}%). You're hovering around break-even — a small adjustment could tip the scales in your favor.`;
    else
      momentumMsg = `In your last ${recentBattles.length} battles, you've won ${recentWins} (${recentRate}%). You're in a slump — consider taking a short break, switching brawlers, or reviewing your losses.`;
  } else {
    momentumMsg = `No recent battles logged. Start tracking your games in the Battle Log to get momentum insights.`;
  }

  // 12. Improvement Tips
  let tipsMsg;
  if (wr < 50)
    tipsMsg = `Focus on mastering 2-3 brawlers deeply rather than spreading thin. Watch replays of your losses to identify patterns. Play during off-peak hours for easier matchmaking, and don't queue tilted.`;
  else if (wr < 60)
    tipsMsg = `You're performing well. To push further, study the current meta, practice your weakest mode, and always have a counter-pick ready in draft. Warm up in unranked before pushing ranked.`;
  else
    tipsMsg = `You're performing exceptionally. To maintain this level, avoid tilt by taking breaks after 2 losses, stay hydrated, and keep your brawler pool fresh to avoid becoming predictable.`;

  // 13. Season Performance
  const seasonPeak = player.currentSeasonHighest || elo;
  const seasonGain = seasonPeak - player.lastSeasonElo;
  let seasonMsg;
  if (seasonGain > 0)
    seasonMsg = `Your current season peak is ${seasonPeak.toLocaleString()} Elo — that's ${seasonGain} above your last season's highest. You're climbing season over season!`;
  else if (seasonGain === 0)
    seasonMsg = `Your current season peak of ${seasonPeak.toLocaleString()} matches your last season's highest. A strong push from here sets a new personal record.`;
  else
    seasonMsg = `Your current season peak of ${seasonPeak.toLocaleString()} is ${Math.abs(seasonGain)} below your last season's highest. Don't stress — focus on consistent play and the climb will follow.`;

  // 14. Drafting Tips (tier-based)
  let draftingMsg;
  if (rank.tier === "Bronze" || rank.tier === "Silver")
    draftingMsg = "Stop autolocking. Wait to see what your team picks and what the enemy picks. Choose a brawler that fits the map and mode — not just your favorite. Learn 2-3 brawlers per mode so you always have a strong pick.";
  else if (rank.tier === "Gold")
    draftingMsg = "Start counter-picking deliberately. If the enemy picks a tank, pick a tank-counter. If they pick a sniper, pick an assassin. Memorize which brawlers counter which — it's the fastest way to climb from Gold.";
  else if (rank.tier === "Diamond")
    draftingMsg = "Think about team synergy, not just individual counters. A team of good individual picks with no synergy loses to a coordinated flex comp. Value brawlers that can fill multiple roles and adapt to the enemy draft.";
  else
    draftingMsg = "Master the draft matrix. Predict enemy picks and counter them before they lock in. Use flex picks to keep your strategy hidden. Study the competitive meta and innovate within it — surprise picks win games.";

  // 15. Positioning Tips (tier-based)
  let positioningMsg;
  if (rank.tier === "Bronze" || rank.tier === "Silver")
    positioningMsg = "Stop standing in the open. Use walls and bushes to break line of sight. Retreat when low — dying is worse than not getting a kill. Hold your lane and don't wander into 1v2 fights.";
  else if (rank.tier === "Gold")
    positioningMsg = "Start wall-peeking: pop out from behind cover, shoot, and retreat. Hold your super for repositioning plays, not just damage. Learn to zone enemies away from objectives by threatening your range.";
  else if (rank.tier === "Diamond")
    positioningMsg = "Master lane assignments — know which brawler should hold which lane. Practice rotating to help teammates when your lane is won. Use your positioning to create crossfires that enemies can't escape.";
  else
    positioningMsg = "Position to control the flow of the game. Bait enemy supers by feigning aggression, then punish when they've wasted them. Master spacing — know exactly how far each brawler's effective range reaches and stay just outside it when retreating.";

  // 16. Mode-Specific Practice Drills (based on battle log performance)
  const MODE_DRILLS = {
    Bounty: "Practice tracking enemy positions and pre-aiming common routes. Focus on staying alive — in Bounty, deaths are permanent. Play a safe sniper and hold long sightlines.",
    Heist: "Drill your safe-damage rotation. Learn the fastest vault routes for your brawler. Practice bursting the safe with supers — time your super charge to peak right when you reach the vault.",
    "Brawl Ball": "Practice dribbling and passing. Learn to position for the kickoff — the first 5 seconds determine the play. Drill your goalkeeping: stand in the goal and practice blocking shots.",
    "Gem Grab": "Practice gem management — never over-commit to the center. Drill your countdown awareness: know exactly when the 10-second timer starts and position accordingly. Practice retreating with gems.",
    "Hot Zone": "Practice zone control — learn which zones to contest and which to give up. Drill your ability to hold a zone alone against two enemies. Practice timing your super for zone captures.",
    Knockout: "Practice patience — in Knockout, one mistake ends the round. Drill your 1v1 dueling skills. Learn to track enemy supers and play around them. Practice crossfire positioning.",
  };

  const modeStats = {};
  for (const e of (battleLog || []).filter((e) => !e.manual)) {
    if (!modeStats[e.mode]) modeStats[e.mode] = { wins: 0, total: 0 };
    modeStats[e.mode].total++;
    if (e.result === "victory") modeStats[e.mode].wins++;
  }

  const weakModes = Object.entries(modeStats)
    .map(([mode, { wins, total }]) => ({ mode, winRate: Math.round((wins / total) * 100), total }))
    .filter((m) => m.total >= 3 && m.winRate < 40)
    .sort((a, b) => a.winRate - b.winRate);

  let drillMsg;
  if (weakModes.length > 0) {
    const tips = weakModes.map(
      (m) => `${m.mode} (${m.winRate}% WR, ${m.total} games): ${MODE_DRILLS[m.mode] || "Focus on improving your fundamentals in this mode."}`
    );
    drillMsg = `Your weakest modes need work:\n\n${tips.join("\n\n")}`;
  } else if (Object.keys(modeStats).length > 0) {
    drillMsg = "You're performing respectably across all tracked modes. Keep practicing your weakest mode to round out your game.";
  } else {
    drillMsg = "Log battles with mode data to get contextual practice drills based on your weakest modes.";
  }

  // 17. Trophy-based context (nuanced rank × trophy analysis)
  let trophyContextMsg;
  if (tr < 2000)
    trophyContextMsg = `With ${tr.toLocaleString()} trophies, your overall game knowledge is still developing. Focus on mastering a small pool of brawlers deeply rather than spreading thin. Ranked will get easier as your fundamentals improve.`;
  else if (tr < 5000)
    trophyContextMsg = `Your ${tr.toLocaleString()} trophies show solid game breadth. You know multiple brawlers and modes — now focus on translating that breadth into ranked depth. Master the meta picks for your favorite modes.`;
  else if (tr < 10000)
    trophyContextMsg = `With ${tr.toLocaleString()} trophies, you have extensive game knowledge. Your brawler pool is deep enough to flex in any draft. Focus on the micro-decisions — positioning, super timing, and ammo management — to push higher.`;
  else
    trophyContextMsg = `Your ${tr.toLocaleString()} trophies reflect elite-level game mastery. You know every brawler, every map, every matchup. At this level, improvement comes from mental game — tilt management, consistency, and decision-making under pressure.`;

  return {
    rank,
    peakRank,
    color: c,
    headline,
    sections: [
      { label: "Win Rate", text: winRateMsg },
      { label: "Streak", text: streakMsg },
      { label: "Boost", text: boostMsg },
      { label: "Forecast", text: forecastMsg },
      { label: "Experience", text: expMsg },
      { label: "Skill", text: skillMsg },
      { label: "Trophies", text: trophiesMsg },
      { label: "Trophy Context", text: trophyContextMsg },
      { label: "Rank Gap", text: gapMsg },
      { label: "Consistency", text: consistencyMsg },
      { label: "Momentum", text: momentumMsg },
      { label: "Season Performance", text: seasonMsg },
      { label: "Drafting", text: draftingMsg },
      { label: "Positioning", text: positioningMsg },
      { label: "Practice Drills", text: drillMsg },
      { label: "Improvement Tips", text: tipsMsg },
    ].filter((s) => s.text),
  };
}

// ─── What Your Rank Means ───────────────────────────────────────
// Detailed per-tier descriptions of skill, playstyle, drafting, mechanics.

export const RANK_DESCRIPTIONS = {
  Bronze: {
    skill: "You're learning the fundamentals — brawler abilities, map layouts, and how each game mode works. Mistakes are common, but that's how growth happens. Focus on understanding one brawler at a time.",
    playstyle: "Play tends to be aggressive and uncoordinated. Players often chase kills instead of playing the objective. Teammates rarely sync up, and engagements are chaotic. Learning when to retreat is your first big step.",
    drafting: "Picks are driven by personal favorites rather than meta or map synergy. Counter-picking isn't on the radar yet — comfort picks dominate. Start paying attention to which brawlers perform well on which maps.",
    mechanics: "Auto-aim is frequent, supers are used as soon as they're charged, and ammo management is rarely considered. Movement is straightforward — running in straight lines is common. Practice manual aim and holding supers for the right moment.",
  },
  Silver: {
    skill: "You're starting to grasp team compositions and mode-specific strategies, but execution is still inconsistent. You know what you should do — you just can't always do it yet. The gap between knowledge and execution is closing.",
    playstyle: "A mix of objective-focused and kill-chasing play. Positioning improves but is still reactive rather than proactive. Some players begin to hold lanes and retreat when low. Start thinking one step ahead of the enemy.",
    drafting: "You're beginning to think about counters, but picks are still largely comfort-based. You might know a brawler is strong on a map but not always why. Start studying the 'why' behind meta picks.",
    mechanics: "Aim is improving and you're starting to use supers deliberately rather than on cooldown. Gadgets see occasional use, but timing isn't yet strategic. Practice saving your super for high-impact moments.",
  },
  Gold: {
    skill: "Solid fundamental understanding. You know which brawlers excel in which modes and you begin to read the enemy composition. You can hold your own in most matchups and contribute meaningfully to your team.",
    playstyle: "More objective-focused. You start holding lanes, retreating when low, and recognizing when to push versus when to defend. Game sense is developing well — trust your reads more and commit to plays.",
    drafting: "Picks begin to follow meta trends. Counter-drafting emerges — you might pick a tank-counter when you see a tank — but it's not always consistent or map-specific. Start memorizing which brawlers counter which.",
    mechanics: "Manual aim is now standard. Supers are saved for key moments rather than fired immediately. Wall peeking, brush usage, and basic ammo cycling become part of your toolkit. Focus on shooting from behind cover whenever possible.",
  },
  Diamond: {
    skill: "Strong game sense. You read the flow of battle, track enemy supers, and adjust your positioning accordingly. You understand win conditions and play toward them. This is where ranked starts feeling like a real strategy game.",
    playstyle: "Disciplined and purposeful. You hold lanes, rotate when needed, and play around objectives with intent. You know when to apply pressure and when to give ground. Your rotations are starting to make a real difference.",
    drafting: "Counter-drafting is deliberate. Map-specific picks are common — you know which brawlers thrive on which maps. Team synergy factors into your choices. Start thinking about what your team needs, not just what you want to play.",
    mechanics: "Precise aim, effective use of walls and cover. Gadgets and supers are timed for maximum impact. Ammo management is conscious — you don't dump all three shots at once. Start practicing predictive aim against moving targets.",
  },
  Mythic: {
    skill: "Advanced understanding. You have deep knowledge of matchups, timing windows, and macro play. You track multiple cooldowns and anticipate enemy movements. You're no longer reacting — you're predicting.",
    playstyle: "Highly coordinated. You pressure lanes intelligently, zone enemies away from objectives, and create space for teammates. Every engagement has a purpose. You know exactly when to trade and when to disengage.",
    drafting: "Full meta awareness. Your picks consider the enemy comp, the map, the mode, and team synergies. Flex picks are valued — you can play multiple roles at a high level. Your draft adaptability is a real weapon.",
    mechanics: "Excellent aim and movement. Super cycling, gadget timing, and ammo management are second nature. Juking, mind games, and predictive aiming are part of your arsenal. You make hard plays look smooth.",
  },
  Legendary: {
    skill: "Near-expert game sense. You read the game several steps ahead, understand win conditions deeply, and play to them relentlessly. You can carry games through decision-making alone. Very few players reach this level.",
    playstyle: "Calculated aggression. Every move is intentional — positioning, zoning, and pressure all serve a purpose. You exploit enemy mistakes punishingly and rarely make unforced errors. Your presence alone shapes the flow of the match.",
    drafting: "Expert-level drafting. You consider the full draft matrix — likely enemy picks, counter-picks, and map-specific strategies. Your draft often sets up the win before the match starts. You think in terms of team compositions, not individual picks.",
    mechanics: "Near-flawless execution. Pixel-perfect aim, advanced movement techniques, and masterful use of every tool in the kit. You make difficult plays look routine. Your mechanical skill ceiling is very high.",
  },
  Masters: {
    skill: "Expert-level. Deep meta knowledge, exceptional game sense, and the ability to carry games through sheer individual skill. You compete with the best and hold your own. This is the top fraction of a percent of players.",
    playstyle: "Dominate-and-control. You dictate the pace of the game, control engagements, and exploit every enemy mistake. Your presence on a lane changes how the enemy plays. You don't just win your lane — you win the game through it.",
    drafting: "Top-tier meta mastery. Every pick is optimized for the specific map, mode, and enemy composition. You know the meta inside out and can innovate within it. Your draft choices put your team ahead before the first shot is fired.",
    mechanics: "Flawless execution. Every shot, dodge, and super is intentional and impactful. Your mechanical skill ceiling is among the highest in the game. You execute plays that most players wouldn't even attempt.",
  },
  Pro: {
    skill: "Professional / top-tier. You compete at the highest level. Game knowledge is encyclopedic and execution is elite. You are the meta — others study your play. This is the pinnacle of ranked competition.",
    playstyle: "Tournament-level. Every decision is calculated, every movement optimized. Team coordination is seamless. You don't just play the game — you shape how it's played. Your game sense is world-class.",
    drafting: "Professional draft strategy. You consider the full competitive meta, including niche picks, surprise strategies, and draft-phase mind games. Your bans and picks tell a story and execute a plan.",
    mechanics: "Perfection. Every mechanical skill is executed at the highest possible level. Movement, aim, and ability usage are all elite. You set the standard that others aspire to reach.",
  },
};
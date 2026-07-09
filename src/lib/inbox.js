// Inbox system — replaces toast notifications and milestone pop-ups.
// Messages persist in localStorage and can be read/dismissed.

const INBOX_KEY = "ranked_inbox_v1";
const MAX_MESSAGES = 50;

export function loadInbox() {
  try {
    const raw = localStorage.getItem(INBOX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveInbox(messages) {
  localStorage.setItem(INBOX_KEY, JSON.stringify(messages.slice(0, MAX_MESSAGES)));
}

const TYPE_TO_CATEGORY = {
  streak: "insights",
  tilt: "alerts",
  rankup: "achievements",
  milestone: "achievements",
  achievement: "achievements",
  upgrade: "insights",
};

export function addInboxMessage({ type, title, body, icon }) {
  const messages = loadInbox();
  const msg = {
    id: Date.now() + Math.random(),
    type,
    category: TYPE_TO_CATEGORY[type] || "insights",
    title,
    body,
    icon,
    read: false,
    timestamp: new Date().toISOString(),
  };
  const updated = [msg, ...messages].slice(0, MAX_MESSAGES);
  saveInbox(updated);
  return msg;
}

export function markInboxRead(id) {
  const messages = loadInbox();
  const updated = messages.map((m) => (m.id === id ? { ...m, read: true } : m));
  saveInbox(updated);
  return updated;
}

export function markAllInboxRead() {
  const messages = loadInbox();
  const updated = messages.map((m) => ({ ...m, read: true }));
  saveInbox(updated);
  return updated;
}

export function deleteInboxMessage(id) {
  const messages = loadInbox();
  const updated = messages.filter((m) => m.id !== id);
  saveInbox(updated);
  return updated;
}

export function clearInbox() {
  localStorage.removeItem(INBOX_KEY);
  return [];
}

export function getUnreadCount() {
  return loadInbox().filter((m) => !m.read).length;
}

// Convenience helpers for common message types.
export function notifyStreak(streak) {
  const milestones = {
    3: { title: "3 Win Streak! 🔥", body: "Momentum is building — stay focused!" },
    5: { title: "5 Win Streak! 🔥", body: "You're on fire! Keep the pressure on!" },
    7: { title: "7 Win Streak! 🔥", body: "Dominant run — don't get reckless!" },
    10: { title: "10 Win Streak! 🔥🔥", body: "You're unstoppable! Ride the wave!" },
    15: { title: "15 Win Streak! 🔥🔥🔥", body: "Legendary form — this is your moment!" },
    20: { title: "20 WIN STREAK! 🏆🔥", body: "Godlike performance — you're making history!" },
  };
  const m = milestones[streak];
  if (!m) return;
  addInboxMessage({ type: "streak", title: m.title, body: m.body, icon: "flame" });
}

export function notifyLossStreak(streak) {
  if (streak < 3) return;
  const messages = {
    3: { title: "3 Loss Streak ⚠️", body: "Take a breather. Tilt loses more games than bad matchups." },
    5: { title: "5 Loss Streak ⚠️", body: "Stop queueing. Review your losses, switch brawlers, come back fresh." },
    7: { title: "7 Loss Streak 🚨", body: "Tilt alert! Step away from ranked. Your mental state matters more than your Elo right now." },
  };
  const m = messages[streak] || messages[7];
  addInboxMessage({ type: "tilt", title: m.title, body: m.body, icon: "alert" });
}

export function notifyRankUp(oldRank, newRank, isMajor) {
  addInboxMessage({
    type: "rankup",
    title: isMajor ? `${newRank.tier} Tier Reached! 🎉` : `Promoted to ${newRank.name}! 🎉`,
    body: isMajor
      ? `You've climbed to ${newRank.tier} tier — ${newRank.name}! Keep pushing!`
      : `You advanced from ${oldRank.name} to ${newRank.name}. Next stop: the next sub-rank!`,
    icon: "trophy",
  });
}

export function notifyMilestone(title, body) {
  addInboxMessage({ type: "milestone", title, body, icon: "star" });
}

export function notifyAchievement(name, description) {
  addInboxMessage({
    type: "achievement",
    title: `Achievement Unlocked: ${name}! 🏆`,
    body: description,
    icon: "trophy",
  });
}
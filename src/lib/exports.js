// CSV + PDF export helpers.
import jsPDF from "jspdf";
import { getRank, RANKS, TIER_COLORS } from "@/lib/ranks";
import { getBestWinStreak, getWinStreak } from "@/lib/battleLog";

// iOS Safari ignores the `download` attribute on blob URLs and often refuses
// to save the file at all — the tap looks successful but nothing lands on disk.
// Detect iOS/iPadOS and open the blob in a new tab so the user can save it
// via the browser's share sheet.
function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  // iPadOS 13+ reports as Mac; detect via touch points.
  const iPadOS = ua.includes("Mac") && typeof document !== "undefined" && "ontouchend" in document;
  return iOS || iPadOS;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  if (isIOS()) {
    // Open in a new tab; user long-presses / uses Share → Save to Files.
    const win = window.open(url, "_blank");
    if (!win) {
      // Popup blocked — fall through to anchor approach so at least *something* happens.
      const a = document.createElement("a");
      a.href = url; a.target = "_blank"; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return { ios: true };
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { ios: false };
}


export function exportCSV(player, forecast, snapshots, battleLog = []) {
  const rows = [];
  rows.push(["Ranked Analytics — Full Data Export"]);
  rows.push(["Generated", new Date().toLocaleString()]);
  rows.push([]);

  // ─── Player Profile ──────────────────────────────────────────
  rows.push(["=== PLAYER PROFILE ==="]);
  rows.push(["Metric", "Value"]);
  rows.push(["Current Elo", player.currentElo]);
  rows.push(["Current Rank", getRank(player.currentElo).name]);
  rows.push(["Current Tier", getRank(player.currentElo).tier]);
  rows.push(["Highest Elo (All-Time)", player.highestElo]);
  rows.push(["Highest Rank (All-Time)", getRank(player.highestElo || 0).name]);
  rows.push(["Current Season Highest", player.currentSeasonHighest]);
  rows.push(["Last Season Highest Elo", player.lastSeasonElo]);
  rows.push(["Last Season Rank", getRank(player.lastSeasonElo || 0).name]);
  rows.push(["Trophies", player.trophies]);
  rows.push(["Win Rate (%)", player.winRate]);
  rows.push(["Games Played (All-Time)", player.gamesPlayed]);
  rows.push(["Current Win Streak", player.winStreak]);
  rows.push(["Self-Rated Skill", player.skill]);
  rows.push(["Season Refreshed", player.seasonRefreshed ? "Yes" : "No"]);
  rows.push(["Equipped Battle Card", player.equippedCard || "None"]);
  rows.push(["Power 9 Brawlers", player.power9Brawlers || 0]);
  rows.push(["Power 11 Brawlers", player.power11Brawlers || 0]);
  if (player.teamElos?.length > 0) {
    rows.push(["Saved Team Elo 1", player.teamElos[0]]);
    rows.push(["Saved Team Elo 2", player.teamElos[1]]);
  }
  rows.push([]);

  // ─── Forecast ────────────────────────────────────────────────
  if (forecast) {
    rows.push(["=== FORECAST ==="]);
    rows.push(["Expected Elo per Match", forecast.evPerMatch]);
    rows.push(["Gain per Win (with boost)", forecast.gainPerWin]);
    rows.push([]);
    rows.push(["Match", "Low (P10)", "Median (P50)", "High (P90)", "Trend"]);
    forecast.paths.forEach((p) =>
      rows.push([p.match, p.low, p.median, p.high, p.trend])
    );
    rows.push([]);
  }

  // ─── Battle Log (Full) ──────────────────────────────────────
  if (battleLog.length > 0) {
    rows.push(["=== BATTLE LOG ==="]);
    rows.push([
      "Date", "Mode", "Result", "Queue Type", "Brawler",
      "Player Elo (Before)", "Player Elo (After)", "Delta",
      "Star Player", "Duration (sec)",
      "Mate 1 Elo", "Mate 1 Brawler",
      "Mate 2 Elo", "Mate 2 Brawler",
      "Enemy 1 Elo", "Enemy 1 Brawler",
      "Enemy 2 Elo", "Enemy 2 Brawler",
      "Enemy 3 Elo", "Enemy 3 Brawler",
      "Performance",
    ]);

    const realLog = battleLog.filter((e) => !e.manual);
    for (const e of realLog) {
      rows.push([
        e.timestamp ? new Date(e.timestamp).toLocaleString() : "",
        e.mode || "",
        e.result || "",
        e.queueType || "solo",
        e.brawlers?.self || e.brawler || "",
        e.playerElo ?? "",
        e.eloAfter ?? "",
        e.delta ?? "",
        e.starPlayer || "",
        e.duration ?? "",
        e.teammateElos?.[0] ?? "",
        e.brawlers?.mate1 ?? "",
        e.teammateElos?.[1] ?? "",
        e.brawlers?.mate2 ?? "",
        e.enemyElos?.[0] ?? "",
        e.brawlers?.enemy1 ?? "",
        e.enemyElos?.[1] ?? "",
        e.brawlers?.enemy2 ?? "",
        e.enemyElos?.[2] ?? "",
        e.brawlers?.enemy3 ?? "",
        e.performance ? JSON.stringify(e.performance) : "",
      ]);
    }

    // Manual adjustments
    const manualLog = battleLog.filter((e) => e.manual);
    if (manualLog.length > 0) {
      rows.push([]);
      rows.push(["=== MANUAL ADJUSTMENTS ==="]);
      rows.push(["Date", "Player Elo (Before)", "Player Elo (After)", "Delta"]);
      for (const e of manualLog) {
        rows.push([
          e.timestamp ? new Date(e.timestamp).toLocaleString() : "",
          e.playerElo ?? "",
          e.eloAfter ?? "",
          e.delta ?? "",
        ]);
      }
    }

    // Battle log summary stats
    rows.push([]);
    rows.push(["=== BATTLE LOG SUMMARY ==="]);
    rows.push(["Total Battles", realLog.length]);
    rows.push(["Wins", realLog.filter((e) => e.result === "victory").length]);
    rows.push(["Losses", realLog.filter((e) => e.result === "defeat").length]);
    rows.push(["Draws", realLog.filter((e) => e.result === "draw").length]);
    rows.push(["Best Win Streak", getBestWinStreak(battleLog)]);
    rows.push(["Current Streak", getWinStreak(battleLog)]);

    // Mode breakdown
    rows.push([]);
    rows.push(["=== MODE BREAKDOWN ==="]);
    rows.push(["Mode", "Games", "Wins", "Losses", "Draws", "Win Rate (%)"]);
    const modes = [...new Set(realLog.map((e) => e.mode))];
    for (const mode of modes) {
      const modeBattles = realLog.filter((e) => e.mode === mode);
      const mWins = modeBattles.filter((e) => e.result === "victory").length;
      const mLosses = modeBattles.filter((e) => e.result === "defeat").length;
      const mDraws = modeBattles.filter((e) => e.result === "draw").length;
      const mTotal = mWins + mLosses + mDraws;
      rows.push([
        mode, modeBattles.length, mWins, mLosses, mDraws,
        mTotal > 0 ? Math.round((mWins / mTotal) * 100) : 0,
      ]);
    }
    rows.push([]);
  }

  // ─── History Snapshots ───────────────────────────────────────
  rows.push(["=== HISTORY SNAPSHOTS ==="]);
  rows.push(["Date", "Current Elo", "Current Rank", "Win Rate", "Trophies", "Games", "Win Streak", "Skill"]);
  (snapshots || []).forEach((s) =>
    rows.push([
      new Date(s.date).toLocaleString(),
      s.currentElo,
      getRank(s.currentElo || 0).name,
      s.winRate,
      s.trophies,
      s.gamesPlayed,
      s.winStreak,
      s.skill,
    ])
  );

  // ─── Rank Progression Map ────────────────────────────────────
  rows.push([]);
  rows.push(["=== RANK PROGRESSION MAP ==="]);
  rows.push(["Rank", "Tier", "Min Elo", "Max Elo", "Reached?"]);
  for (const r of RANKS) {
    const reached = (player.highestElo || 0) >= r.min;
    rows.push([r.name, r.tier, r.min, isFinite(r.max) ? r.max : "Infinity", reached ? "Yes" : "No"]);
  }

  const csv = rows
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  try {
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const { ios } = downloadBlob(blob, "ranked-analytics-full-export.csv");
    return { success: true, ios };
  } catch (err) {
    console.error("CSV export failed:", err);
    return { success: false, error: err.message || "Failed to export CSV." };
  }
}

export function exportPDF(player, forecast, battleLog = []) {
  try {
    const doc = new jsPDF();
    doc.setFillColor(10, 12, 20);
    doc.rect(0, 0, 210, 297, "F");

    doc.setTextColor(56, 189, 248);
    doc.setFontSize(20);
    doc.text("Ranked Analytics Report", 14, 20);

    doc.setTextColor(200, 200, 210);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    const lines = [
      `Current Elo: ${player.currentElo}  (${getRank(player.currentElo).name})`,
      `Highest Elo: ${player.highestElo}  (${getRank(player.highestElo).name})`,
      `Last Season Highest: ${player.lastSeasonElo}  (${getRank(player.lastSeasonElo).name})`,
      `Trophies: ${player.trophies}`,
      `Win Rate: ${player.winRate}%`,
      `Games Played: ${player.gamesPlayed}`,
      `Self-Rated Skill: ${player.skill}/10`,
    ];
    doc.setFontSize(12);
    doc.setTextColor(230, 230, 240);
    let y = 42;
    lines.forEach((l) => {
      doc.text(l, 14, y);
      y += 9;
    });

    if (forecast) {
      y += 6;
      doc.setTextColor(217, 70, 239);
      doc.setFontSize(14);
      doc.text("Forecast", 14, y);
      y += 9;
      doc.setTextColor(230, 230, 240);
      doc.setFontSize(11);
      const f = forecast.final;
      [
        `Expected Elo per match: ${forecast.evPerMatch}`,
        `Gain per win (boost applied): +${forecast.gainPerWin}`,
        `After ${f.match} matches -> Low: ${f.low} | Median: ${f.median} | High: ${f.high}`,
      ].forEach((l) => {
        doc.text(l, 14, y);
        y += 8;
      });
    }

    // Battle log summary
    const realLog = (battleLog || []).filter((e) => !e.manual);
    if (realLog.length > 0) {
      y += 8;
      doc.setTextColor(34, 211, 238);
      doc.setFontSize(14);
      doc.text("Battle Log Summary", 14, y);
      y += 9;
      doc.setFontSize(11);
      doc.setTextColor(230, 230, 240);
      const wins = realLog.filter((e) => e.result === "victory").length;
      const losses = realLog.filter((e) => e.result === "defeat").length;
      const draws = realLog.filter((e) => e.result === "draw").length;
      [
        `Total battles: ${realLog.length}`,
        `Wins: ${wins}   Losses: ${losses}   Draws: ${draws}`,
        `Best win streak: ${getBestWinStreak(battleLog)}`,
        `Current streak: ${getWinStreak(battleLog)}`,
      ].forEach((l) => {
        doc.text(l, 14, y);
        y += 8;
      });
    }

    doc.save("ranked-analytics.pdf");
    return { success: true };
  } catch (err) {
    console.error("PDF export failed:", err);
    return { success: false, error: err.message || "Failed to export PDF." };
  }
}
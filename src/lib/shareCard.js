// Canvas-based share card generator for season report.
// Produces a 1080x1350 PNG and either downloads it or opens it in a new tab
// (Safari-friendly). Uses `html2canvas` if available; falls back to a hand-
// drawn canvas so it works with zero deps.
import { TIER_COLORS } from "@/lib/ranks";
import { getRankTitle } from "@/lib/rankTitles";

export async function generateSeasonShareCard({ peakRank, peakElo, wins, losses, games, winRate, badges, streak }) {
  const c = TIER_COLORS[peakRank.tier];
  const W = 1080, H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0b0d17");
  grad.addColorStop(1, c.from);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  // Overlay soft radial glow
  const glow = ctx.createRadialGradient(W / 2, 380, 20, W / 2, 380, 500);
  glow.addColorStop(0, `${c.to}66`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  // Title
  ctx.textAlign = "center"; ctx.fillStyle = "#fff";
  ctx.font = "bold 44px system-ui, -apple-system, sans-serif";
  ctx.fillText("BRAWLTRACK · SEASON RECAP", W / 2, 110);

  // Rank name
  ctx.font = "bold 96px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = c.text;
  ctx.fillText(peakRank.name.toUpperCase(), W / 2, 260);

  // Peak elo
  ctx.font = "bold 200px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#fff";
  ctx.fillText(peakElo.toLocaleString(), W / 2, 480);
  ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("PEAK ELO", W / 2, 520);

  // Stat row
  const stats = [
    ["GAMES", String(games)],
    ["WINS", String(wins)],
    ["LOSSES", String(losses)],
    ["WIN RATE", `${winRate}%`],
  ];
  const cellW = 240;
  stats.forEach(([label, value], i) => {
    const x = 60 + i * cellW;
    ctx.fillStyle = `${c.from}55`;
    roundRect(ctx, x, 620, cellW - 20, 160, 24);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "bold 22px system-ui, sans-serif";
    ctx.fillText(label, x + (cellW - 20) / 2, 670);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 60px system-ui, sans-serif";
    ctx.fillText(value, x + (cellW - 20) / 2, 740);
  });

  // Badges
  ctx.textAlign = "left";
  ctx.fillStyle = "#fff";
  ctx.font = "bold 32px system-ui, sans-serif";
  ctx.fillText("BADGES EARNED", 60, 870);
  const shownBadges = (badges || []).slice(0, 10);
  shownBadges.forEach((b, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 60 + col * 480;
    const y = 910 + row * 78;
    ctx.fillStyle = `${c.from}44`;
    roundRect(ctx, x, y, 460, 62, 16);
    ctx.fill();
    ctx.font = "36px system-ui, sans-serif";
    ctx.fillText(b.emoji, x + 16, y + 44);
    ctx.font = "bold 24px system-ui, sans-serif";
    ctx.fillStyle = "#fff";
    ctx.fillText(b.label, x + 68, y + 40);
  });

  // Footer
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.fillText("Track your rank at BrawlTrack", W / 2, H - 60);

  // Download
  const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
  const url = URL.createObjectURL(blob);
  const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    window.open(url, "_blank");
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = `brawltrack-season-${peakRank.tier.toLowerCase()}-${peakElo}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 15000);
  return url;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

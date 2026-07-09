import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Star } from "lucide-react";
import { brawlerImageUrl } from "@/lib/brawlers";

// SeasonTimeline — interactive Elo journey scrubber.
// Renders a sparkline of the season's Elo progression with a draggable
// scrubber. Marks the breakthrough (best gain) and stumble (worst loss).
// Shows battle details at the scrubbed position.
export default function SeasonTimeline({ story, color }) {
  const { eloPoints, breakthrough, stumble } = story;
  const [scrubIdx, setScrubIdx] = useState(eloPoints.length - 1);

  const geom = useMemo(() => {
    const W = 100;
    const H = 42;
    const elos = eloPoints.map((p) => p.elo);
    const minE = Math.min(...elos);
    const maxE = Math.max(...elos);
    const range = maxE - minE || 1;

    const pts = eloPoints.map((p, i) => {
      const x = eloPoints.length === 1 ? W / 2 : (i / (eloPoints.length - 1)) * W;
      const y = H - 2 - ((p.elo - minE) / range) * (H - 4);
      return { x, y, ...p };
    });

    const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
    const areaPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;

    const btIdx = breakthrough ? eloPoints.findIndex((p) => p.timestamp === breakthrough.timestamp) : -1;
    const stIdx = stumble ? eloPoints.findIndex((p) => p.timestamp === stumble.timestamp) : -1;

    return { W, H, pts, linePath, areaPath, btIdx, stIdx };
  }, [eloPoints, breakthrough, stumble]);

  const current = eloPoints[scrubIdx];
  const currentPt = geom.pts[scrubIdx];
  const isVictory = current?.result === "victory";
  const isDraw = current?.result === "draw";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase font-display text-muted-foreground">Elo Journey</p>
        <span className="text-[10px] font-bold" style={{ color: color.text }}>
          {eloPoints.length} battles
        </span>
      </div>

      {/* Sparkline chart */}
      <div className="relative w-full" style={{ aspectRatio: "100 / 42" }}>
        <svg viewBox="0 0 100 42" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="elo-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color.to} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color.to} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path d={geom.areaPath} fill="url(#elo-area)" />

          {/* Elo line */}
          <motion.path
            d={geom.linePath}
            fill="none"
            stroke={color.text}
            strokeWidth="1.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ filter: `drop-shadow(0 0 2px ${color.glow})` }}
          />

          {/* Breakthrough marker */}
          {geom.btIdx >= 0 && geom.pts[geom.btIdx] && (
            <circle cx={geom.pts[geom.btIdx].x} cy={geom.pts[geom.btIdx].y} r="1.8" fill="#34d399" stroke="#fff" strokeWidth="0.4" />
          )}
          {/* Stumble marker */}
          {geom.stIdx >= 0 && geom.pts[geom.stIdx] && (
            <circle cx={geom.pts[geom.stIdx].x} cy={geom.pts[geom.stIdx].y} r="1.8" fill="#f87171" stroke="#fff" strokeWidth="0.4" />
          )}

          {/* Scrubber position dot */}
          {currentPt && (
            <circle cx={currentPt.x} cy={currentPt.y} r="2.2" fill="#fff" stroke={color.text} strokeWidth="1" />
          )}
        </svg>

        {/* Scrubber vertical guide line */}
        {currentPt && (
          <div
            className="absolute top-0 bottom-0 w-px pointer-events-none"
            style={{
              left: `${currentPt.x}%`,
              background: `linear-gradient(180deg, ${color.text}50, transparent)`,
            }}
          />
        )}
      </div>

      {/* Range slider */}
      <input
        type="range"
        min={0}
        max={eloPoints.length - 1}
        value={scrubIdx}
        onChange={(e) => setScrubIdx(Number(e.target.value))}
        className="w-full mt-1 accent-current"
        style={{ accentColor: color.text }}
      />

      {/* Battle detail card at scrubbed position */}
      {current && (
        <motion.div
          key={scrubIdx}
          className="mt-2 rounded-lg border p-2.5 flex items-center gap-3"
          style={{ background: `${color.from}12`, borderColor: `${color.from}33` }}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {current.brawler && (
            <img
              src={brawlerImageUrl(current.brawler)}
              alt={current.brawler}
              className="w-10 h-10 object-contain shrink-0"
              style={{ filter: `drop-shadow(0 0 4px ${color.glow})` }}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase" style={{ color: color.text }}>
                {current.mode}
              </span>
              {isVictory && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Battle #{scrubIdx + 1} · {current.brawler || "Unknown"}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-display font-bold" style={{ color: current.elo >= (eloPoints[scrubIdx - 1]?.elo || 0) ? "#34d399" : "#f87171" }}>
              {current.elo.toLocaleString()}
            </p>
            <p
              className="text-[10px] font-bold flex items-center justify-end gap-0.5"
              style={{ color: current.delta >= 0 ? "#34d399" : "#f87171" }}
            >
              {current.delta >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {current.delta >= 0 ? "+" : ""}{current.delta}
            </p>
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 mt-2">
        {breakthrough && (
          <span className="text-[9px] text-muted-foreground flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Best Gain +{breakthrough.delta}
          </span>
        )}
        {stumble && (
          <span className="text-[9px] text-muted-foreground flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Worst Loss {stumble.delta}
          </span>
        )}
      </div>
    </div>
  );
}
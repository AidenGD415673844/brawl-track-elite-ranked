import React, { useMemo, useRef, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Map, ChevronDown, ChevronUp, Flag as FlagIcon } from "lucide-react";
import { buildJourney, BIOMES } from "@/lib/journeyMap";
import { getRank, TIER_COLORS } from "@/lib/ranks";
import { getParticleIntensity, getParticlesEnabled } from "@/lib/animPrefs";
import { useIsMobile } from "@/hooks/use-mobile";

// Terrain patterns (per biome motif) — layered SVG shapes.
function BiomeLayer({ biome, x0, x1, height, animated }) {
  const w = x1 - x0;
  if (w <= 0) return null;
  const { motif, top, mid, horizon } = biome.biome;
  const c = biome.colors;
  const gradId = `bg-${biome.tier}-${Math.round(x0)}`;
  return (
    <g>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={top} />
          <stop offset="60%"  stopColor={mid} />
          <stop offset="100%" stopColor={horizon} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect x={x0} y={0} width={w} height={height} fill={`url(#${gradId})`} />

      {/* Motif overlay */}
      {motif === "canyon" && (
        <g opacity="0.55">
          <polygon points={`${x0},${height} ${x0},${height - 42} ${x0 + w * 0.25},${height - 68} ${x0 + w * 0.5},${height - 40} ${x0 + w * 0.75},${height - 76} ${x1},${height - 48} ${x1},${height}`} fill={mid} />
          <polygon points={`${x0},${height} ${x0 + w * 0.35},${height - 22} ${x0 + w * 0.7},${height - 30} ${x1},${height - 14} ${x1},${height}`} fill={horizon} opacity="0.6" />
        </g>
      )}
      {motif === "tundra" && (
        <g opacity="0.5">
          <path d={`M ${x0},${height - 20} Q ${x0 + w / 3},${height - 44} ${x0 + w / 2},${height - 26} T ${x1},${height - 20} L ${x1},${height} L ${x0},${height} Z`} fill={horizon} opacity="0.7" />
          {animated && Array.from({ length: 6 }).map((_, i) => (
            <circle key={i} cx={x0 + (w * (i + 0.5)) / 6} cy={height * 0.3 + (i % 2) * 20} r="1.6" fill="#fff" opacity="0.7">
              <animate attributeName="cy" values={`${height * 0.3};${height - 20}`} dur={`${5 + i}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      )}
      {motif === "savanna" && (
        <g opacity="0.55">
          <ellipse cx={x0 + w * 0.5} cy={height * 0.25} rx={w * 0.35} ry="12" fill={horizon} opacity="0.4" />
          <path d={`M ${x0},${height - 24} Q ${x0 + w * 0.4},${height - 46} ${x1},${height - 20} L ${x1},${height} L ${x0},${height} Z`} fill={mid} />
        </g>
      )}
      {motif === "glacier" && (
        <g opacity="0.7">
          <polygon points={`${x0},${height} ${x0 + w * 0.2},${height - 60} ${x0 + w * 0.45},${height - 30} ${x0 + w * 0.65},${height - 78} ${x1},${height - 40} ${x1},${height}`} fill={horizon} opacity="0.4" />
          {animated && (
            <rect x={x0} y="0" width={w} height="6" fill={horizon} opacity="0.6">
              <animate attributeName="opacity" values="0.2;0.8;0.2" dur="4s" repeatCount="indefinite" />
            </rect>
          )}
        </g>
      )}
      {motif === "nebula" && (
        <g opacity="0.75">
          <circle cx={x0 + w * 0.3} cy={height * 0.35} r={Math.min(50, w * 0.35)} fill={horizon} opacity="0.25" />
          <circle cx={x0 + w * 0.7} cy={height * 0.5} r={Math.min(40, w * 0.28)} fill={c.from} opacity="0.35" />
          {Array.from({ length: 10 }).map((_, i) => (
            <circle key={i} cx={x0 + Math.random() * w} cy={Math.random() * height * 0.7} r="1" fill="#fff" opacity="0.85">
              {animated && <animate attributeName="opacity" values="0.2;1;0.2" dur={`${2 + (i % 4)}s`} repeatCount="indefinite" />}
            </circle>
          ))}
        </g>
      )}
      {motif === "volcanic" && (
        <g opacity="0.8">
          <path d={`M ${x0},${height - 30} Q ${x0 + w * 0.3},${height - 70} ${x0 + w * 0.5},${height - 44} T ${x1},${height - 30} L ${x1},${height} L ${x0},${height} Z`} fill={horizon} opacity="0.5" />
          {animated && Array.from({ length: 5 }).map((_, i) => (
            <circle key={i} cx={x0 + (w * (i + 0.5)) / 5} cy={height - 30} r="2" fill="#f97316" opacity="0.9">
              <animate attributeName="cy" values={`${height - 30};${height * 0.4}`} dur={`${3 + i}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0" dur={`${3 + i}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      )}
      {motif === "ruins" && (
        <g opacity="0.75">
          {[0.15, 0.4, 0.65, 0.85].map((f, i) => (
            <rect key={i} x={x0 + w * f - 10} y={height - 60 - (i % 2) * 20} width="20" height={60 + (i % 2) * 20} fill={mid} />
          ))}
          <rect x={x0} y={height - 8} width={w} height="8" fill={horizon} opacity="0.4" />
        </g>
      )}
      {motif === "throne" && (
        <g opacity="0.85">
          <circle cx={x0 + w * 0.5} cy={height * 0.3} r={Math.min(48, w * 0.3)} fill={horizon} opacity="0.35" />
          {Array.from({ length: 5 }).map((_, i) => (
            <polygon
              key={i}
              points={`${x0 + w * (0.1 + i * 0.2)},${height * 0.6} ${x0 + w * (0.13 + i * 0.2)},${height * 0.65} ${x0 + w * (0.07 + i * 0.2)},${height * 0.65}`}
              fill="#fcd34d"
              opacity="0.9"
            />
          ))}
        </g>
      )}

      {/* Biome label */}
      <text x={x0 + 8} y={16} fontSize="9" fill={horizon} className="font-display font-bold uppercase tracking-wider" opacity="0.9">
        {biome.biome.name}
      </text>
    </g>
  );
}

export default function EloJourneyMap({ battleLog, currentElo }) {
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState(null);
  const scrollRef = useRef(null);
  const [viewX, setViewX] = useState(0);
  const [viewW, setViewW] = useState(0);
  const isMobile = useIsMobile();

  const enabled = getParticlesEnabled ? getParticlesEnabled() : true;
  const intensity = getParticleIntensity ? getParticleIntensity() : "medium";
  // Never animate biome sub-layers on mobile — pure static paint = smooth scroll.
  const animated = enabled && intensity !== "low" && !isMobile;

  const j = useMemo(
    () => buildJourney(battleLog, currentElo || 0, {
      pxPerStep: isMobile ? 34 : 42,
      height: isMobile ? 200 : 260,
      padY: isMobile ? 22 : 30,
    }),
    [battleLog, currentElo, isMobile]
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let rafId = 0;
    const update = () => {
      rafId = 0;
      setViewX(el.scrollLeft);
      setViewW(el.clientWidth);
    };
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(update);
    };
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    // Auto-scroll to end (most recent)
    el.scrollLeft = el.scrollWidth;
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [j.width]);

  // Wheel → horizontal (desktop only; mobile uses native touch scroll)
  const onWheel = (e) => {
    if (isMobile) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <Card className="relative bg-card border-border p-4 sm:p-5 rounded-2xl overflow-hidden">
      {/* Beautiful ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, rgba(34,211,238,0.12), transparent 55%), radial-gradient(circle at 90% 100%, rgba(232,121,249,0.10), transparent 60%)",
        }}
      />
      <div className="relative flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_18px_rgba(34,211,238,0.35)]">
            <Map className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-sm font-display font-semibold text-foreground">Elo Journey Map</h3>
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
        >
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          {collapsed ? "Show" : "Hide"}
        </button>
      </div>
      <p className="relative text-xs text-muted-foreground mb-3">
        Scroll horizontally through your season. Each biome is a tier · flags mark rank-ups · dips are losing ravines.
      </p>

      {collapsed ? null : j.empty ? (
        <div className="relative py-10 text-center text-xs text-muted-foreground">
          Log at least 2 battles to reveal your journey through the ranked realms.
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            onWheel={onWheel}
            className="relative overflow-x-auto overflow-y-hidden rounded-xl border border-cyan-500/30 select-none shadow-[0_0_24px_rgba(34,211,238,0.15)_inset]"
            style={{
              WebkitOverflowScrolling: "touch",
              background:
                "linear-gradient(180deg, #030712 0%, #0b0f1c 60%, #050510 100%)",
              overscrollBehaviorX: "contain",
              contain: "content",
            }}
          >
            <svg width={j.width} height={j.height} className="block" style={{ willChange: "transform" }}>
              {/* Biome bands */}
              {j.biomes.map((b, i) => (
                <BiomeLayer key={i} biome={b} x0={b.xStart} x1={b.xEnd} height={j.height} animated={animated} />
              ))}

              {/* Ravine fills */}
              {j.ravines.map((r, i) => {
                const seg = j.series.slice(r.start, r.end + 1);
                if (!seg.length) return null;
                const pathTop = seg.map((p, k) => `${k === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                const pathClose = ` L ${seg[seg.length - 1].x} ${j.height} L ${seg[0].x} ${j.height} Z`;
                return (
                  <path key={i} d={pathTop + pathClose} fill="rgba(239,68,68,0.18)" stroke="rgba(239,68,68,0.4)" strokeWidth="1" />
                );
              })}

              {/* Trail path */}
              <path
                d={j.path}
                fill="none"
                stroke="#fff"
                strokeOpacity="0.9"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.4))" }}
              />

              {/* Battle markers */}
              {j.series.map((p, i) => {
                const win = p.entry.result === "victory";
                const color = win ? "#10b981" : p.entry.result === "defeat" ? "#ef4444" : "#f59e0b";
                return (
                  <g key={i} onClick={() => setSelected({ x: p.x, y: p.y, entry: p.entry })} style={{ cursor: "pointer" }}>
                    <circle cx={p.x} cy={p.y} r="5" fill={color} stroke="#fff" strokeWidth="1.5" />
                  </g>
                );
              })}

              {/* Rank-up checkpoints */}
              {j.checkpoints.map((cp, i) => {
                const tc = TIER_COLORS[cp.rank.tier];
                return (
                  <g key={i}>
                    <line x1={cp.x} y1={cp.y - 6} x2={cp.x} y2={cp.y - 42} stroke={tc.text} strokeWidth="2" />
                    <polygon
                      points={`${cp.x},${cp.y - 42} ${cp.x + 22},${cp.y - 36} ${cp.x},${cp.y - 30}`}
                      fill={tc.text}
                      opacity="0.95"
                      style={{ filter: `drop-shadow(0 0 6px ${tc.glow})` }}
                    />
                    <text x={cp.x + 26} y={cp.y - 34} fontSize="9" fill={tc.text} className="font-display font-bold">
                      {cp.rank.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Selected battle popover */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="mt-3 rounded-xl border border-border bg-card/80 backdrop-blur p-3 text-xs flex items-center justify-between flex-wrap gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className={`font-display font-bold ${selected.entry.result === "victory" ? "text-emerald-500" : "text-red-500"}`}>
                    {selected.entry.result === "victory" ? "VICTORY" : selected.entry.result === "defeat" ? "DEFEAT" : "DRAW"}
                  </span>
                  <span className="text-foreground font-bold">{selected.entry.mode}</span>
                  <span className="text-muted-foreground">{selected.entry.brawler || ""}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    {new Date(selected.entry.timestamp).toLocaleString()}
                  </span>
                  <span className="font-bold" style={{ color: TIER_COLORS[getRank(selected.entry.eloAfter).tier].text }}>
                    {selected.entry.eloAfter.toLocaleString()} Elo
                  </span>
                  <span className={`font-bold ${selected.entry.delta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {selected.entry.delta > 0 ? "+" : ""}{selected.entry.delta}
                  </span>
                  <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Minimap */}
          <div className="mt-3 relative h-6 rounded-lg border border-border bg-black/40 overflow-hidden">
            <div className="absolute inset-0 flex">
              {j.biomes.map((b, i) => (
                <div
                  key={i}
                  style={{
                    width: `${((b.xEnd - b.xStart) / j.width) * 100}%`,
                    background: `linear-gradient(180deg, ${b.biome.top}, ${b.biome.horizon})`,
                  }}
                />
              ))}
            </div>
            {j.width > 0 && viewW > 0 && (
              <div
                className="absolute top-0 bottom-0 border-2 border-white/80 rounded"
                style={{
                  left: `${(viewX / j.width) * 100}%`,
                  width: `${Math.min(100, (viewW / j.width) * 100)}%`,
                  background: "rgba(255,255,255,0.15)",
                }}
              />
            )}
          </div>

          <div className="mt-2 text-[10px] text-muted-foreground text-center flex items-center justify-center gap-3 flex-wrap">
            <span className="flex items-center gap-1"><FlagIcon className="w-3 h-3" /> Rank-up</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Win</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Loss</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-red-500/30 border border-red-500/60 rounded-sm" /> Ravine</span>
          </div>
        </>
      )}
    </Card>
  );
}

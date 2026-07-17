import React, { useMemo, useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Map, ChevronDown, ChevronUp } from "lucide-react";
import { RANKS, getRank, TIER_COLORS } from "@/lib/ranks";

// ---------- Path to Pro checkpoints ----------
const ELO_POINTS = [
  0, 100, 200, 250, 300, 400, 500, 600, 700, 750, 800, 900, 1000, 1100, 1200,
  1250, 1300, 1400, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3250, 3500, 3750,
  4000, 4250, 4500, 4750, 5000, 5250, 5500, 5750, 6000, 6375, 6750, 7125, 7500,
  7875, 8250, 8750, 9250, 9750, 10250, 10750, 11250, 12000, 13000, 14000, 15000,
];

// Per-tier theme (bg gradient + accent glow). "brightness" scales the whole
// section — used to make late Masters and Pro visibly more radiant.
const TIER_THEME = {
  Bronze:    { bg: "linear-gradient(160deg,#3d1f10 0%,#5a2a12 45%,#8b4513 100%)", stripe: "rgba(251,191,36,0.08)", brightness: 0.9 },
  Silver:    { bg: "linear-gradient(160deg,#1e293b 0%,#334155 55%,#64748b 100%)", stripe: "rgba(226,232,240,0.08)", brightness: 1.0 },
  Gold:      { bg: "linear-gradient(160deg,#3f2a05 0%,#78560f 55%,#ca8a04 100%)", stripe: "rgba(253,224,71,0.10)", brightness: 1.05 },
  Diamond:   { bg: "linear-gradient(160deg,#082f49 0%,#0369a1 55%,#38bdf8 100%)", stripe: "rgba(125,211,252,0.10)", brightness: 1.08 },
  Mythic:    { bg: "linear-gradient(160deg,#2e1065 0%,#6b21a8 55%,#a855f7 100%)", stripe: "rgba(232,121,249,0.10)", brightness: 1.1 },
  Legendary: { bg: "linear-gradient(160deg,#450a0a 0%,#991b1b 55%,#f87171 100%)", stripe: "rgba(252,165,165,0.10)", brightness: 1.15 },
  Masters:   { bg: "linear-gradient(160deg,#450a0a 0%,#9a3412 55%,#ea580c 100%)", stripe: "rgba(251,146,60,0.12)", brightness: 1.2 },
  Pro:       { bg: "linear-gradient(160deg,#78350f 0%,#d97706 40%,#fde047 100%)", stripe: "rgba(253,224,71,0.18)", brightness: 1.35 },
};

// Elo-level brightness boost inside Masters/Pro tiers.
function eloBrightness(elo) {
  if (elo >= 11250) return 1.4;         // Pro base
  if (elo >= 12000) return 1.5;
  if (elo >= 13000) return 1.6;
  if (elo >= 14000) return 1.75;
  if (elo >= 15000) return 1.9;
  if (elo >= 10750) return 1.28;
  if (elo >= 10250) return 1.22;
  if (elo >= 9250)  return 1.14;
  return 1.0;
}

// Build tier bands (groups of consecutive checkpoints sharing a tier).
function buildBands(points) {
  const bands = [];
  let cur = null;
  points.forEach((elo, i) => {
    const tier = getRank(elo).tier;
    if (!cur || cur.tier !== tier) {
      cur = { tier, startIdx: i, endIdx: i, theme: TIER_THEME[tier] };
      bands.push(cur);
    } else {
      cur.endIdx = i;
    }
  });
  return bands;
}

// ── Biome scenery — inline SVG per tier, sized to frame the path ──
// Densely packed: sky layer + midground silhouettes + ground props + animated
// particles + foreground horizon. All layered so the path threads through.
function Scenery({ tier }) {
  const common = "absolute inset-0 pointer-events-none";
  switch (tier) {
    case "Bronze":
      return (
        <svg viewBox="0 0 400 220" preserveAspectRatio="none" className={common}>
          <defs>
            <linearGradient id="bzSky" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#fbbf24" stopOpacity="0.25" />
              <stop offset="1" stopColor="#7c2d12" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="400" height="90" fill="url(#bzSky)" />
          {/* far mesas */}
          <path d="M0 140 L50 115 L90 130 L140 105 L200 120 L250 100 L310 115 L360 95 L400 110 L400 220 L0 220 Z" fill="#3a1608" opacity="0.55" />
          <path d="M0 165 L70 148 L130 158 L200 140 L280 155 L340 145 L400 155 L400 220 L0 220 Z" fill="#2a1004" opacity="0.75" />
          {/* cacti — more, varied sizes */}
          {[25,70,110,155,205,245,290,335,375].map((x,i) => (
            <g key={i} transform={`translate(${x} ${185 - (i%3)*3}) scale(${0.7 + (i%4)*0.15})`} opacity="0.85">
              <rect x="-3" y="-28" width="6" height="30" rx="2" fill="#166534" />
              <rect x="-11" y="-18" width="6" height="14" rx="2" fill="#166534" />
              <rect x="5" y="-22" width="6" height="16" rx="2" fill="#166534" />
              <circle cx="0" cy="-30" r="1.5" fill="#fbbf24" />
            </g>
          ))}
          {/* tumbleweed */}
          <g opacity="0.7">
            <circle cx="80" cy="200" r="7" fill="none" stroke="#78350f" strokeWidth="1.5" strokeDasharray="3 2">
              <animate attributeName="cx" values="-10;410" dur="14s" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="rotate" from="0 80 200" to="360 80 200" dur="4s" repeatCount="indefinite" additive="sum" />
            </circle>
          </g>
          {/* bullet casings */}
          {[60,150,230,300,360].map((x,i) => (
            <rect key={i} x={x} y={207} width="5" height="2" rx="1" fill="#fbbf24" opacity="0.7" transform={`rotate(${i*20} ${x+2} 208)`} />
          ))}
          {/* dust motes */}
          {[70,180,300,50,240,340].map((x,i) => (
            <circle key={i} cx={x} cy={180+i*3} r="1.5" fill="#fcd34d" opacity="0.4">
              <animate attributeName="cx" values={`${x};${x+40};${x}`} dur={`${5+i}s`} repeatCount="indefinite" />
            </circle>
          ))}
          {/* sun */}
          <circle cx="340" cy="35" r="18" fill="#fbbf24" opacity="0.55" />
        </svg>
      );
    case "Silver":
      return (
        <svg viewBox="0 0 400 220" preserveAspectRatio="none" className={common}>
          <defs>
            <linearGradient id="svSky" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#94a3b8" stopOpacity="0.2" />
              <stop offset="1" stopColor="#0c1a24" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="400" height="100" fill="url(#svSky)" />
          {/* aurora ribbons */}
          <path d="M0 30 Q100 8 200 40 T400 25" fill="none" stroke="#7dd3fc" strokeWidth="14" opacity="0.28">
            <animate attributeName="d" values="M0 30 Q100 8 200 40 T400 25;M0 32 Q100 14 200 34 T400 22;M0 30 Q100 8 200 40 T400 25" dur="8s" repeatCount="indefinite" />
          </path>
          <path d="M0 55 Q120 40 240 60 T400 50" fill="none" stroke="#c4b5fd" strokeWidth="8" opacity="0.22" />
          {/* mountains */}
          <path d="M0 155 L60 105 L110 135 L170 90 L230 130 L290 100 L350 130 L400 115 L400 220 L0 220 Z" fill="#1e293b" opacity="0.8" />
          {/* pines — many */}
          {[20,55,90,130,170,210,250,290,325,365].map((x,i) => (
            <g key={i} transform={`translate(${x} ${180 - (i%3)*2}) scale(${0.8 + (i%3)*0.2})`} opacity="0.9">
              <polygon points="0,-32 -13,0 13,0" fill="#0f172a" />
              <polygon points="0,-32 -11,-12 11,-12" fill="#e2e8f0" opacity="0.95" />
              <polygon points="0,-22 -7,-6 7,-6" fill="#e2e8f0" opacity="0.9" />
              <rect x="-2" y="0" width="4" height="6" fill="#3b2312" />
            </g>
          ))}
          {/* snow ground patches */}
          <ellipse cx="80" cy="205" rx="60" ry="6" fill="#f8fafc" opacity="0.3" />
          <ellipse cx="260" cy="208" rx="80" ry="7" fill="#f8fafc" opacity="0.3" />
          {/* snowflakes */}
          {Array.from({length:14}).map((_,i)=>(
            <circle key={i} cx={(i*29)%400} cy={i*8} r={i%3?1.2:1.8} fill="#f8fafc" opacity="0.85">
              <animate attributeName="cy" values={`-10;220`} dur={`${5+(i%4)}s`} begin={`${i*0.4}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      );
    case "Gold":
      return (
        <svg viewBox="0 0 400 220" preserveAspectRatio="none" className={common}>
          <defs>
            <radialGradient id="goldSun" cx="50%" cy="0%" r="80%">
              <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="400" height="220" fill="url(#goldSun)" />
          {/* sun rays */}
          {[80,150,220,290].map((x,i)=>(
            <polygon key={i} points={`${x},0 ${x-40},220 ${x+40},220`} fill="#fef3c7" opacity="0.1" />
          ))}
          {/* distant hills */}
          <path d="M0 170 Q80 140 160 170 T320 170 T480 170 L480 220 L0 220 Z" fill="#78350f" opacity="0.55" />
          {/* acacia trees */}
          {[35,110,180,255,325,385].map((x,i) => (
            <g key={i} transform={`translate(${x} ${180 - (i%2)*4}) scale(${0.9 + (i%3)*0.15})`} opacity="0.9">
              <rect x="-2" y="-32" width="4" height="32" fill="#78350f" />
              <ellipse cx="0" cy="-34" rx="24" ry="9" fill="#166534" />
              <ellipse cx="-6" cy="-38" rx="10" ry="4" fill="#14532d" opacity="0.7" />
            </g>
          ))}
          {/* tall grass — dense */}
          {Array.from({length:40}).map((_,i)=>(
            <line key={i} x1={i*10} y1="210" x2={i*10+3} y2="192" stroke="#ca8a04" strokeWidth="1.5" opacity="0.7" />
          ))}
          {/* coin piles */}
          {[130,290].map((x,i)=>(
            <g key={i} transform={`translate(${x} 200)`}>
              <ellipse cx="0" cy="6" rx="14" ry="3" fill="#000" opacity="0.3" />
              <circle cx="-4" cy="0" r="4" fill="#fde047" stroke="#ca8a04" />
              <circle cx="4" cy="-1" r="4" fill="#fde047" stroke="#ca8a04" />
              <circle cx="0" cy="-6" r="4" fill="#fef08a" stroke="#ca8a04" />
            </g>
          ))}
        </svg>
      );
    case "Diamond":
      return (
        <svg viewBox="0 0 400 220" preserveAspectRatio="none" className={common}>
          <defs>
            <linearGradient id="dmSky" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#7dd3fc" stopOpacity="0.35" />
              <stop offset="1" stopColor="#082f49" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="400" height="120" fill="url(#dmSky)" />
          {/* aurora */}
          <path d="M0 30 Q120 5 220 35 T400 20" fill="none" stroke="#a5f3fc" strokeWidth="12" opacity="0.4" />
          <path d="M0 55 Q140 30 260 60 T400 45" fill="none" stroke="#67e8f9" strokeWidth="6" opacity="0.3" />
          {/* crystal spires — many */}
          {[30,80,140,200,250,310,370].map((x,i)=>(
            <g key={i}>
              <polygon points={`${x},${170-(i%3)*10} ${x-16},210 ${x+16},210`} fill="#7dd3fc" opacity="0.65" />
              <polygon points={`${x},${170-(i%3)*10} ${x-16},210 ${x},210`} fill="#38bdf8" opacity="0.4" />
            </g>
          ))}
          {/* ice ground */}
          <path d="M0 205 L400 205 L400 220 L0 220 Z" fill="#e0f2fe" opacity="0.35" />
          {/* floating shards */}
          {[50,130,230,330].map((x,i)=>(
            <polygon key={i} points={`${x},50 ${x-6},72 ${x+6},72`} fill="#e0f2fe" opacity="0.7">
              <animateTransform attributeName="transform" type="translate" values="0 0;0 15;0 0" dur={`${4+i}s`} repeatCount="indefinite" />
            </polygon>
          ))}
          {/* shimmer stars */}
          {Array.from({length:12}).map((_,i)=>(
            <circle key={i} cx={(i*37)%400} cy={(i*17)%80} r="1" fill="#f0f9ff" opacity="0.9" />
          ))}
        </svg>
      );
    case "Mythic":
      return (
        <svg viewBox="0 0 400 220" preserveAspectRatio="none" className={common}>
          <defs>
            <radialGradient id="mythNeb" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#e879f9" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#e879f9" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="mythNeb2" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="90" cy="70" rx="140" ry="70" fill="url(#mythNeb)" />
          <ellipse cx="330" cy="120" rx="120" ry="60" fill="url(#mythNeb2)" />
          <ellipse cx="200" cy="180" rx="180" ry="50" fill="url(#mythNeb)" opacity="0.6" />
          {/* dense stars */}
          {Array.from({length:60}).map((_,i)=>(
            <circle key={i} cx={(i*37)%400} cy={(i*23)%220} r={i%5===0 ? 2 : i%3===0 ? 1.2 : 0.7} fill={i%4===0 ? "#f5d0fe" : "#fff"} opacity={0.5 + (i%5)*0.1}>
              {i%7===0 && <animate attributeName="opacity" values="0.3;1;0.3" dur={`${2+(i%3)}s`} repeatCount="indefinite" />}
            </circle>
          ))}
          {/* asteroids */}
          {[80,180,300,360].map((x,i)=>(
            <g key={i} transform={`translate(${x} ${130+i*8})`}>
              <circle r="7" fill="#4c1d95" opacity="0.8" />
              <circle cx="-2" cy="-2" r="2" fill="#7c3aed" opacity="0.6" />
            </g>
          ))}
          {/* portal ring */}
          <circle cx="200" cy="110" r="35" fill="none" stroke="#e879f9" strokeWidth="2" opacity="0.4" strokeDasharray="4 6">
            <animateTransform attributeName="transform" type="rotate" from="0 200 110" to="360 200 110" dur="20s" repeatCount="indefinite" />
          </circle>
        </svg>
      );
    case "Legendary":
      return (
        <svg viewBox="0 0 400 220" preserveAspectRatio="none" className={common}>
          <defs>
            <linearGradient id="lgSky" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#450a0a" stopOpacity="0.8" />
              <stop offset="1" stopColor="#f97316" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <rect width="400" height="130" fill="url(#lgSky)" />
          {/* volcano silhouettes */}
          <path d="M0 170 L80 100 L140 170 Z" fill="#1c1917" opacity="0.85" />
          <path d="M220 180 L310 90 L400 180 Z" fill="#1c1917" opacity="0.85" />
          <path d="M80 100 L90 90 L100 105" stroke="#f97316" strokeWidth="3" fill="none" opacity="0.9" />
          <path d="M310 90 L320 78 L332 95" stroke="#fbbf24" strokeWidth="3" fill="none" opacity="0.9" />
          {/* lava rivers */}
          <path d="M0 190 Q100 180 200 190 T400 190 L400 220 L0 220 Z" fill="#f97316" opacity="0.65">
            <animate attributeName="d" values="M0 190 Q100 180 200 190 T400 190 L400 220 L0 220 Z;M0 190 Q100 195 200 188 T400 190 L400 220 L0 220 Z;M0 190 Q100 180 200 190 T400 190 L400 220 L0 220 Z" dur="3s" repeatCount="indefinite" />
          </path>
          <path d="M0 200 Q120 195 240 202 T400 200 L400 220 L0 220 Z" fill="#dc2626" opacity="0.55" />
          {/* ash palms */}
          {[40,120,240,340].map((x,i) => (
            <g key={i} transform={`translate(${x} 180)`} opacity="0.75">
              <rect x="-2" y="-32" width="4" height="32" fill="#0c0a09" />
              <path d={`M0 -32 Q-18 -40 -28 -28`} stroke="#292524" strokeWidth="3" fill="none" />
              <path d={`M0 -32 Q18 -40 28 -28`} stroke="#292524" strokeWidth="3" fill="none" />
              <path d={`M0 -32 Q-8 -46 -14 -42`} stroke="#292524" strokeWidth="2.5" fill="none" />
            </g>
          ))}
          {/* embers rising */}
          {[40,90,160,220,280,340,380].map((x,i) => (
            <circle key={i} cx={x} cy={190} r={1.5+i%2} fill={i%2?"#fbbf24":"#f97316"} opacity="0.95">
              <animate attributeName="cy" values="200;20" dur={`${2.5+i*0.3}s`} begin={`${i*0.3}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0" dur={`${2.5+i*0.3}s`} begin={`${i*0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}
          {/* lightning bolt */}
          <path d="M180 20 L175 55 L185 55 L172 90" stroke="#fef08a" strokeWidth="2" fill="none" opacity="0.8">
            <animate attributeName="opacity" values="0;1;0;0;0" dur="4s" repeatCount="indefinite" />
          </path>
        </svg>
      );
    case "Masters":
      return (
        <svg viewBox="0 0 400 220" preserveAspectRatio="none" className={common}>
          {/* obsidian ground */}
          <path d="M0 165 L400 165 L400 220 L0 220 Z" fill="#0c0a09" opacity="0.85" />
          {/* fissure glow */}
          <ellipse cx="200" cy="190" rx="220" ry="14" fill="#f97316" opacity="0.5" />
          <ellipse cx="200" cy="192" rx="180" ry="6" fill="#fbbf24" opacity="0.6" />
          {/* fissure cracks */}
          {[40,110,180,255,330,375].map((x,i)=>(
            <path key={i} d={`M${x} 165 L${x+(i%2?5:-5)} 220`} stroke="#f97316" strokeWidth="2" opacity="0.9">
              <animate attributeName="opacity" values="0.4;1;0.4" dur={`${1.5+i*0.2}s`} repeatCount="indefinite" />
            </path>
          ))}
          {/* ruins pillars */}
          {[50,130,220,310,375].map((x,i) => (
            <g key={i}>
              <rect x={x-8} y={120-(i%2)*15} width="16" height={45+(i%2)*15} fill="#292524" opacity="0.9" />
              <rect x={x-10} y={118-(i%2)*15} width="20" height="4" fill="#44403c" opacity="0.9" />
              <rect x={x-3} y={135-(i%2)*15} width="6" height="6" fill="#f97316" opacity="0.7" />
            </g>
          ))}
          {/* floating debris */}
          {[60,180,300].map((x,i)=>(
            <rect key={i} x={x} y={40+i*20} width="6" height="6" fill="#78716c" opacity="0.7" transform={`rotate(${i*30} ${x+3} ${43+i*20})`}>
              <animateTransform attributeName="transform" type="rotate" from={`0 ${x+3} ${43+i*20}`} to={`360 ${x+3} ${43+i*20}`} dur={`${4+i}s`} repeatCount="indefinite" />
            </rect>
          ))}
          {/* sparks */}
          {Array.from({length:8}).map((_,i)=>(
            <circle key={i} cx={40+i*45} cy={190} r="1.5" fill="#fbbf24" opacity="0.9">
              <animate attributeName="cy" values="190;100" dur={`${2+i*0.3}s`} begin={`${i*0.4}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0" dur={`${2+i*0.3}s`} begin={`${i*0.4}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      );
    case "Pro":
      return (
        <svg viewBox="0 0 400 220" preserveAspectRatio="none" className={common}>
          <defs>
            <radialGradient id="proHalo" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#fef9c3" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="400" height="220" fill="url(#proHalo)" />
          {/* god rays */}
          {[60,140,220,300,360].map((x,i)=>(
            <polygon key={i} points={`${x},0 ${x-25},220 ${x+25},220`} fill="#fef9c3" opacity="0.18" />
          ))}
          {/* cloud sea */}
          <path d="M0 170 Q60 155 120 170 T240 170 T360 170 T480 170 L480 220 L0 220 Z" fill="#fef3c7" opacity="0.65" />
          <path d="M0 185 Q80 175 160 188 T320 185 T480 185 L480 220 L0 220 Z" fill="#fde68a" opacity="0.55" />
          {/* floating crowns — many */}
          {[40,110,180,250,320,380].map((x,i) => (
            <g key={i} transform={`translate(${x} ${50+(i%3)*25})`} opacity="0.95">
              <path d="M-12 4 L-10 -8 L-4 -2 L0 -12 L4 -2 L10 -8 L12 4 Z" fill="#fde047" stroke="#ca8a04" strokeWidth="0.8" />
              <circle cx="-10" cy="-8" r="1.5" fill="#fef08a" />
              <circle cx="0" cy="-12" r="1.5" fill="#fef08a" />
              <circle cx="10" cy="-8" r="1.5" fill="#fef08a" />
              <animateTransform attributeName="transform" type="translate" values={`${x} ${50+(i%3)*25};${x} ${40+(i%3)*25};${x} ${50+(i%3)*25}`} dur={`${3+i*0.4}s`} repeatCount="indefinite" />
            </g>
          ))}
          {/* halo rings */}
          {[100,300].map((x,i)=>(
            <ellipse key={i} cx={x} cy={130} rx="30" ry="8" fill="none" stroke="#fde047" strokeWidth="1.5" opacity="0.6" />
          ))}
          {/* golden sparkles */}
          {Array.from({length:20}).map((_,i)=>(
            <circle key={i} cx={(i*29)%400} cy={(i*19)%180} r="1" fill="#fef9c3" opacity="0.9">
              <animate attributeName="opacity" values="0.3;1;0.3" dur={`${1.5+(i%3)}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      );
    default:
      return null;
  }
}

// A single 3D circular checkpoint node.
function Node({ elo, isMajor, isCurrent, isReached, size }) {
  const rank = getRank(elo);
  const c = TIER_COLORS[rank.tier];
  const bright = eloBrightness(elo);
  const glow = isCurrent ? `0 0 24px ${c.glow}, 0 0 8px #fff` : `0 0 14px ${c.glow}`;
  return (
    <div
      className="flex flex-col items-center gap-1.5"
      style={{ width: size + 24 }}
    >
      <div
        className="relative rounded-full flex items-center justify-center shrink-0"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 30% 25%, #fff5 0%, transparent 40%),
                       radial-gradient(circle at 65% 75%, #0006 0%, transparent 55%),
                       linear-gradient(145deg, ${c.from}, ${c.to})`,
          boxShadow: `inset 0 -${Math.round(size * 0.12)}px ${Math.round(size * 0.18)}px #0009,
                      inset 0 ${Math.round(size * 0.08)}px ${Math.round(size * 0.14)}px #fff4,
                      ${glow}`,
          opacity: isReached ? 1 : 0.55,
          filter: `saturate(${bright}) brightness(${Math.min(1.3, bright)})`,
        }}
      >
        {isMajor && (
          <img
            src={rank.image}
            alt={rank.name}
            style={{
              width: size * 0.72,
              height: size * 0.72,
              objectFit: "contain",
              filter: `drop-shadow(0 2px 4px #000a)`,
            }}
          />
        )}
        {!isMajor && (
          <div
            className="font-display font-black"
            style={{
              fontSize: size * 0.32,
              color: "#fff",
              textShadow: "0 2px 4px #0009",
              opacity: 0.85,
            }}
          >
            {Math.round(elo / 100)}
          </div>
        )}
        {isCurrent && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              border: "2px solid #fff",
              animation: "fade-in 0.6s ease-out",
              boxShadow: `0 0 16px #fff, 0 0 24px ${c.glow}`,
            }}
          />
        )}
      </div>
      <div className="text-center leading-tight">
        {isMajor && (
          <p className="text-[10px] font-display font-bold" style={{ color: c.text }}>
            {rank.name}
          </p>
        )}
        <p className={`text-[10px] font-bold ${isReached ? "text-foreground" : "text-muted-foreground"}`}>
          {elo.toLocaleString()} Elo
        </p>
      </div>
    </div>
  );
}

export default function EloJourneyMap({ battleLog, currentElo }) {
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef(null);
  const currentRef = useRef(null);
  const safeElo = Number.isFinite(Number(currentElo)) ? Number(currentElo) : 0;

  const bands = useMemo(() => buildBands(ELO_POINTS), []);

  // Auto-scroll to current position on mount / when Elo changes.
  useEffect(() => {
    if (collapsed) return;
    const t = setTimeout(() => {
      if (currentRef.current && scrollRef.current) {
        const el = currentRef.current;
        const parent = scrollRef.current;
        const target = el.offsetLeft - parent.clientWidth / 2 + el.clientWidth / 2;
        parent.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
      }
    }, 120);
    return () => clearTimeout(t);
  }, [safeElo, collapsed]);

  const currentRank = getRank(safeElo);
  const currentTierColor = TIER_COLORS[currentRank.tier];

  return (
    <Card className="relative bg-card border-border p-4 sm:p-5 rounded-2xl overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 15% 0%, rgba(34,211,238,0.1), transparent 55%), radial-gradient(circle at 90% 100%, rgba(232,121,249,0.08), transparent 60%)",
        }}
      />
      <div className="relative flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_18px_rgba(34,211,238,0.35)]">
            <Map className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-sm font-display font-semibold text-foreground">
            Path to Pro
          </h3>
          <span className="text-[10px] text-muted-foreground">· 0 → 15,000 Elo</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold" style={{ color: currentTierColor.text }}>
            You: {safeElo.toLocaleString()}
          </span>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            {collapsed ? "Show" : "Hide"}
          </button>
        </div>
      </div>

      {collapsed ? null : (
        <div
          ref={scrollRef}
          className="relative overflow-x-auto overflow-y-hidden rounded-xl border border-cyan-500/25 shadow-[0_0_24px_rgba(34,211,238,0.12)_inset]"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorX: "contain",
          }}
        >
          <div className="flex items-stretch min-w-max">
            {bands.map((band, bi) => {
              const bandPoints = ELO_POINTS.slice(band.startIdx, band.endIdx + 1);
              return (
                <div
                  key={bi}
                  className="relative flex items-center py-14 px-4"
                  style={{
                    minHeight: 280,
                    background: band.theme.bg,
                    borderRight: bi < bands.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                  }}
                >
                  {/* diagonal stripe overlay for texture */}
                  <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `repeating-linear-gradient(45deg, ${band.theme.stripe} 0 2px, transparent 2px 18px)`,
                      opacity: 0.45,
                    }}
                  />
                  {/* biome scenery — inline SVG layered behind the trail */}
                  <div aria-hidden className="absolute inset-0 pointer-events-none">
                    <Scenery tier={band.tier} />
                  </div>
                  {/* tier label banner */}
                  <div
                    className="absolute top-2 left-3 text-[9px] font-display font-black uppercase tracking-widest"
                    style={{ color: TIER_COLORS[band.tier].text, textShadow: "0 1px 3px #000a" }}
                  >
                    {band.tier}
                  </div>

                  {/* connecting trail line */}
                  <div
                    aria-hidden
                    className="absolute left-0 right-0 h-1 top-1/2 -translate-y-1/2"
                    style={{
                      background: `linear-gradient(90deg, ${TIER_COLORS[band.tier].from}88, ${TIER_COLORS[band.tier].to}88)`,
                      boxShadow: `0 0 12px ${TIER_COLORS[band.tier].glow}`,
                    }}
                  />

                  <div className="relative flex items-center gap-4">
                    {bandPoints.map((elo, i) => {
                      const rank = getRank(elo);
                      const isMajor = rank.min === elo;
                      const size = isMajor ? 68 : 42;
                      const isReached = safeElo >= elo;
                      // Determine if this is the "current" node = highest reached checkpoint.
                      const nextInBand = bandPoints[i + 1];
                      const isCurrent =
                        safeElo >= elo &&
                        (nextInBand === undefined ? true : safeElo < nextInBand) &&
                        // and only for the band that actually contains the player
                        band.tier === currentRank.tier;

                      return (
                        <div
                          key={elo}
                          ref={isCurrent ? currentRef : null}
                          className="relative z-10"
                        >
                          <Node
                            elo={elo}
                            isMajor={isMajor}
                            isCurrent={isCurrent}
                            isReached={isReached}
                            size={size}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="relative mt-3 text-[10px] text-muted-foreground text-center">
        Scroll → to trace the road from Bronze to Pro. Reached checkpoints glow; your current stop pulses.
      </p>
    </Card>
  );
}

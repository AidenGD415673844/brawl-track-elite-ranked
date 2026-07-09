import React from "react";

// Minimalist sub-rank pips indicator — shows I/II/III as filled dots.
// Placed below rank icons that no longer have sub-rank markers baked in.
export default function SubRankPips({ roman, color, size = "sm" }) {
  const count = roman === "I" ? 1 : roman === "II" ? 2 : roman === "III" ? 3 : 0;
  if (count === 0) return null; // Pro has no pips

  const dotSize = size === "lg" ? "w-2 h-2" : "w-1.5 h-1.5";

  return (
    <div className="flex gap-0.5 justify-center items-center">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className={`${dotSize} rounded-full transition-all`}
          style={{
            background: i < count ? color : "rgba(255,255,255,0.12)",
            boxShadow: i < count ? `0 0 4px ${color}` : "none",
          }}
        />
      ))}
    </div>
  );
}
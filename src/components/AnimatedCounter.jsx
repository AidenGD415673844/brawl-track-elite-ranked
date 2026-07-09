import React, { useEffect, useRef, useState } from "react";

// Lightweight count-up animation for numbers (Elo deltas, percentages).
// Eases from `from` to `value` over `duration` ms using cubic ease-out.
export default function AnimatedCounter({
  value,
  from = 0,
  duration = 650,
  prefix = "",
  suffix = "",
  showSign = false,
  className = "",
}) {
  const [display, setDisplay] = useState(from);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const to = Number(value) || 0;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const sign = showSign && display > 0 ? "+" : "";
  return (
    <span className={className}>
      {prefix}
      {sign}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

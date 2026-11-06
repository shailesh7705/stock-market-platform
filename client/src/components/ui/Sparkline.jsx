// client/src/components/ui/Sparkline.jsx
import React from "react";

export default function Sparkline({ data = [], positive = true, width = 84, height = 24, strokeWidth = 1.5 }) {
  if (!Array.isArray(data) || data.length < 2) {
    return null;
  }

  const validNumbers = data.map(Number).filter((n) => Number.isFinite(n));
  if (validNumbers.length < 2) return null;

  const min = Math.min(...validNumbers);
  const max = Math.max(...validNumbers);
  const range = max - min || 1;

  const points = validNumbers
    .map((val, i) => {
      const x = (i / (validNumbers.length - 1)) * (width - 4) + 2;
      const y = height - 4 - ((val - min) / range) * (height - 8) + 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const color = positive ? "#10b981" : "#ef4444";

  return (
    <svg width={width} height={height} className="overflow-visible inline-block" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

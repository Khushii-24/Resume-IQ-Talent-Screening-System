// src/components/ConfidenceGauge.jsx
import { useEffect, useState } from "react";

function getColor(pct) {
  if (pct >= 70) return "#22c55e";
  if (pct >= 40) return "#f59e0b";
  return "#ef4444";
}

function getLabel(pct) {
  if (pct >= 70) return "High confidence";
  if (pct >= 40) return "Moderate confidence";
  return "Low confidence";
}

export default function ConfidenceGauge({ confidence }) {
  const [animated, setAnimated] = useState(0);

  const pct    = Math.round(confidence * 100);
  const radius = 54;
  const stroke = 10;
  const size   = (radius + stroke) * 2;
  const cx     = size / 2;
  const cy     = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Animate from 0 to actual value on mount
  useEffect(() => {
    const timeout = setTimeout(() => setAnimated(pct), 50);
    return () => clearTimeout(timeout);
  }, [pct]);

  const offset = circumference - (circumference * animated) / 100;
  const color  = getColor(pct);

  return (
    <div style={{ textAlign: "center", display: "inline-block" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={stroke}
        />
        {/* Arc */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s ease" }}
        />
      </svg>

      {/* Center text — overlaid with absolute positioning */}
      <div style={{
        marginTop: `-${size / 2 + 16}px`,
        height: size,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <span style={{ fontSize: "26px", fontWeight: 800, color: "#1e293b" }}>
          {pct}%
        </span>
        <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
          confidence
        </span>
      </div>

      <p style={{ margin: "8px 0 0", fontSize: "12px", color, fontWeight: 600 }}>
        {getLabel(pct)}
      </p>
    </div>
  );
}
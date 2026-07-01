// src/components/ShapChart.jsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
} from "recharts";

// Custom tooltip — shows word + exact SHAP value on hover
function ShapTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { word, shap_value } = payload[0].payload;
  return (
    <div style={{
      background: "#1e293b",
      color: "#f8fafc",
      padding: "8px 12px",
      borderRadius: "8px",
      fontSize: "13px",
    }}>
      <strong>{word}</strong>
      <br />
      SHAP: {shap_value > 0 ? "+" : ""}{shap_value.toFixed(4)}
    </div>
  );
}

export default function ShapChart({ topWords }) {
  if (!topWords || topWords.length === 0) return null;

  // Sort by shap_value descending so highest positive is at top
  const sorted = [...topWords].sort((a, b) => b.shap_value - a.shap_value);

  return (
    <div style={{ marginTop: "32px" }}>
      <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
        SHAP FEATURE IMPORTANCE
      </p>
      <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>
        Green = pushed model toward predicted role · Red = pulled away
      </p>

      <ResponsiveContainer width="100%" height={sorted.length * 36 + 40}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 24, bottom: 0, left: 90 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="word"
            tick={{ fontSize: 13, fill: "#475569" }}
            axisLine={false}
            tickLine={false}
            width={85}
          />
          <Tooltip content={<ShapTooltip />} cursor={{ fill: "#f1f5f9" }} />
          <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1} />
          <Bar dataKey="shap_value" radius={[0, 4, 4, 0]}>
            {sorted.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.shap_value > 0 ? "#22c55e" : "#ef4444"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
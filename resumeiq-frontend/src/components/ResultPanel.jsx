// src/components/ResultPanel.jsx
import ShapChart from "./ShapChart";
import ConfidenceGauge from "./ConfidenceGauge";

export default function ResultPanel({ result }) {
  if (!result) return null;

  const {
  predicted_category,
  confidence,
  model_note,
  skills,
  top_words,
} = result;

  return (
    <div style={{ marginTop: "32px", fontFamily: "sans-serif" }}>

      {/* Role + Confidence Gauge */}

<div
  style={{
    marginBottom: "28px",
    display: "flex",
    alignItems: "center",
    gap: "28px",
  }}
>
  <ConfidenceGauge confidence={confidence} />

  <div>
    <p
      style={{
        fontSize: "13px",
        color: "#64748b",
        margin: "0 0 4px",
      }}
    >
      MODEL ROLE SUGGESTION
    </p>

    <p
      style={{
        fontSize: "28px",
        fontWeight: 700,
        color: "#f8fafc",
        margin: 0,
      }}
    >
      {predicted_category}
    </p>

    <p
      style={{
        fontSize: "13px",
        color: "#94a3b8",
        marginTop: "6px",
      }}
    >
      AI role suggestion · secondary ranking signal
    </p>

    {model_note && (
      <div
        style={{
          marginTop: "14px",
          padding: "10px 14px",
          borderRadius: "8px",
          background: "#FEF3C7",
          color: "#92400E",
          fontSize: "13px",
        }}
      >
        ⚠ {model_note}
      </div>
    )}
  </div>
</div>
        
      {/* Skills */}
      <div style={{ marginBottom: "24px" }}>
        <p
  style={{
    marginBottom: "12px",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: 600,
  }}
>
  DETECTED SKILLS ({skills.length})
</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {skills.length > 0
            ? skills.map((skill) => (
                <span key={skill} style={{
                  background: "#EEF2FF",
                  color: "#4338CA",
                  borderRadius: "999px",
                  padding: "4px 12px",
                  fontSize: "13px",
                  fontWeight: 500,
                  border: "1px solid #C7D2FE",
                }}>
                  {skill}
                </span>
              ))
            : <p style={{ color: "#94a3b8" }}>No skills detected</p>
          }
        </div>
      </div>

      {/* SHAP top words */}
      <ShapChart
  topWords={top_words.filter(
    ({ shap_value }) => Math.abs(shap_value) > 0.001
  )}
/>
          
    </div>
  );
}
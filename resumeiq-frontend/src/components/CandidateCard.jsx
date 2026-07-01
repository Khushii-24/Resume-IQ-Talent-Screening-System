// src/components/CandidateCard.jsx
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

function SkillChip({ label, type }) {
  const colors = {
    matched: { bg: "#dcfce7", color: "#166534" },
    missing: { bg: "#fee2e2", color: "#991b1b" },
    extra:   { bg: "#e0e7ff", color: "#3730a3" },
  };
  const { bg, color } = colors[type];
  return (
    <span style={{
      background: bg, color,
      borderRadius: "999px",
      padding: "3px 10px",
      fontSize: "12px",
      fontWeight: 500,
    }}>
      {label}
    </span>
  );
}

function MatchBar({ skill, matched }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
      <span style={{ width: "110px", fontSize: "12px", color: "#475569", flexShrink: 0 }}>
        {skill}
      </span>
      <div style={{ flex: 1, background: "#e2e8f0", borderRadius: "999px", height: "12px" }}>
        <div style={{
          width: matched ? "100%" : "0%",
          background: matched ? "#22c55e" : "transparent",
          borderRadius: "999px",
          height: "12px",
          transition: "width 0.8s ease-in-out",
        }} />
      </div>
      <span style={{ fontSize: "11px", color: matched ? "#16a34a" : "#ef4444", width: "20px" }}>
        {matched ? "✓" : "✗"}
      </span>
    </div>
  );
}

export default function CandidateCard({ candidate, rank, jdSkills }) {
const [showExplanation, setShowExplanation] = useState(false);
  const {
    filename,
    predicted_category,
    confidence,
    skill_gap,
    similarity_score,
    // skills,
    
  } = candidate;

  const { matched, missing, extra, match_score } = skill_gap;
  const matchLabel =
  match_score >= 80
    ? "Excellent Match"
    : match_score >= 60
    ? "Strong Match"
    : match_score >= 40
    ? "Moderate Match"
    : "Needs Review";
  const name = filename
    .replace(".pdf", "")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .trim();

  return (
    <div style={{
      background: "#fff",
      borderRadius: "14px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
      padding: "24px",
      marginBottom: "16px",
      border: rank === 1 ? "1.5px solid #6366f1" : "1.5px solid #f1f5f9",
    }}>

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              background: rank === 1 ? "#6366f1" : "#e2e8f0",
              color: rank === 1 ? "#fff" : "#64748b",
              borderRadius: "999px",
              padding: "2px 10px",
              fontSize: "12px",
              fontWeight: 700,
            }}>
              #{rank}
            </span>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#1e293b" }}>
              {name}
            </h3>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
            {predicted_category} · {(confidence * 100).toFixed(0)}% model confidence
          </p>
        </div>

        {/* Match score */}
        <div style={{ textAlign: "right" }}>
          <p
    style={{
      margin: 0,
      fontSize: "12px",
      fontWeight: 600,
      color:
        match_score >= 70
          ? "#16a34a"
          : match_score >= 40
          ? "#d97706"
          : "#ef4444",
    }}
  >
    {matchLabel}
  </p>

  <p
    style={{
      margin: 0,
      fontSize: "28px",
      fontWeight: 800,
    }}
  >
    {match_score}%
  </p>

  <p>JD Match</p>
          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94a3b8" }}>
            {(similarity_score * 100).toFixed(1)}% similarity
          </p>
        </div>
      </div>

      {/* Skill match bars — one per JD skill */}
      {jdSkills.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "8px" }}>JD SKILL COVERAGE</p>
          {jdSkills.map((skill) => (
            <MatchBar key={skill} skill={skill} matched={matched.includes(skill)} />
          ))}
        </div>
      )}

      {/* Skill chips */}
      <div style={{ marginBottom: "18px" }}>

  <p style={{ fontWeight: 600 }}>Matched Skills</p>

  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
    {matched.map((s) => (
      <SkillChip key={s} label={s} type="matched" />
    ))}
  </div>

  <p style={{ fontWeight: 600 }}>Missing Skills</p>

  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
    {missing.map((s) => (
      <SkillChip key={s} label={s} type="missing" />
    ))}
  </div>

  <p style={{ fontWeight: 600 }}>Additional Skills</p>

  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
    {extra.slice(0, 5).map((s) => (
      <SkillChip key={s} label={s} type="extra" />
    ))}

    {extra.length > 5 && (
      <SkillChip
        label={`+${extra.length - 5} more`}
        type="extra"
      />
    )}
  </div>

</div>
        <div
  style={{
    marginTop: "20px",
    marginBottom: "20px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  }}
>
  <p
    style={{
      margin: "0 0 8px",
      fontWeight: 600,
      color: "#334155",
    }}
  >
    AI Recruiter Summary
  </p>

  <p
    style={{
      margin: 0,
      fontSize: "14px",
      color: "#64748b",
      lineHeight: 1.6,
    }}
  >
This candidate matches <strong>{match_score}%</strong> of the job
  requirements and has a{" "}
  <strong>{(similarity_score * 100).toFixed(0)}%</strong> similarity
  score.

  {missing.length > 0 &&
    <> Primary gaps include <strong>{missing.join(", ")}</strong>.</>}  </p>
</div>
      {/* SHAP toggle */}
      <button
        onClick={() => setShowExplanation(!showExplanation)}
        style={{
          background: "none",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "8px 14px",
          fontSize: "12px",
          color: "#64748b",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {showExplanation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showExplanation ? "Hide" : "Why this candidate?"}
      </button>
      {showExplanation && (
  <div
    style={{
      marginTop: "18px",
      padding: "18px",
      background: "#f8fafc",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
    }}
  >
    <h4
      style={{
        margin: "0 0 14px",
        color: "#1e293b",
      }}
    >
      Why this candidate?
    </h4>

    <ul
      style={{
        margin: 0,
        paddingLeft: "20px",
        color: "#475569",
        lineHeight: 1.9,
      }}
    >
      <li>
        Matched <strong>{matched.length}</strong> of{" "}
        <strong>{jdSkills.length}</strong> required skills.
      </li>

      <li>
        JD Similarity Score:{" "}
        <strong>{(similarity_score * 100).toFixed(1)}%</strong>
      </li>

      <li>
        Suggested Role:{" "}
        <strong>{predicted_category}</strong>
      </li>

      <li>
        Model Confidence:{" "}
        <strong>{(confidence * 100).toFixed(1)}%</strong>
      </li>

      {missing.length > 0 && (
        <li>
          Missing Skills:{" "}
          <strong>{missing.join(", ")}</strong>
        </li>
      )}

      {extra.length > 0 && (
        <li>
          Additional Skills:{" "}
          <strong>{extra.join(", ")}</strong>
        </li>
      )}

      <li>
        Recommendation:{" "}
        <strong>
          {match_score >= 80
            ? "Strongly recommend technical interview."
            : match_score >= 60
            ? "Good fit. Consider shortlisting."
            : match_score >= 40
            ? "Potential fit after further review."
            : "Needs further evaluation."}
        </strong>
      </li>
    </ul>
  </div>
)}
    </div>
  );
}
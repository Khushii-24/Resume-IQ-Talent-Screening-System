// src/components/CandidateList.jsx
import CandidateCard from "./CandidateCard";

export default function CandidateList({ candidates, jdSkills }) {
  if (!candidates || candidates.length === 0) return null;

  return (
    <div style={{ marginTop: "32px" }}>
      <h2
  style={{
    marginBottom: "8px",
    color: "#1e293b",
  }}
>
  Top Ranked Candidates
</h2>

<p
  style={{
    marginBottom: "24px",
    color: "#64748b",
  }}
>
  Showing {candidates.length} candidates ranked by job description match.
</p>
      {candidates.map((c, i) => (
        <CandidateCard
          key={c.filename}
          candidate={c}
          rank={i + 1}
          jdSkills={jdSkills}
        />
      ))}
    </div>
  );
}
// src/App.jsx
import { useState, } from "react";
import RoleGate from "./components/RoleGate";
import DragDropZone from "./components/DragDropZone";
import ResultPanel from "./components/ResultPanel";
import ScreenForm from "./components/ScreenForm";
import CandidateList from "./components/CandidateList";

export default function App() {
const [role, setRole] = useState(() => {
    return localStorage.getItem("resumeiq_role");
  });
    const [singleResult, setSingleResult] = useState(null);
  const [screenData, setScreenData]     = useState(null);

  // Persist role across refreshes
  // useEffect(() => {
  //   const saved = localStorage.getItem("resumeiq_role");
  //   if (saved) setRole(saved);
  // }, []);

  function handleRoleSelect(r) {
    localStorage.setItem("resumeiq_role", r);
    setRole(r);
  }

  function handleLogout() {
    localStorage.removeItem("resumeiq_role");
    setRole(null);
  }

  if (!role) return <RoleGate onSelect={handleRoleSelect} />;

  return (
    <div style={{
      maxWidth: "780px",
      margin: "60px auto",
      padding: "0 24px",
      fontFamily: "system-ui, sans-serif",
    }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#1e293b", margin: 0 }}>
            ResumeIQ
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "12px", margin: "4px 0 0" }}>
            Signed in as <strong style={{ color: "#6366f1" }}>{role}</strong>
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "none", border: "1px solid #e2e8f0",
            borderRadius: "8px", padding: "6px 14px",
            fontSize: "12px", color: "#64748b", cursor: "pointer",
          }}
        >
          Switch role
        </button>
      </div>

      {/* Candidate view */}
      {role === "candidate" && (
        <>
          <DragDropZone onResult={setSingleResult} />
          <ResultPanel result={singleResult} />
        </>
      )}

      {/* Recruiter view */}
      {role === "recruiter" && (
        <>
          <ScreenForm onResults={setScreenData} />
          {screenData && (
            <CandidateList
              candidates={screenData.candidates}
              jdSkills={screenData.jd_skills}
            />
          )}
        </>
      )}

    </div>
  );
}
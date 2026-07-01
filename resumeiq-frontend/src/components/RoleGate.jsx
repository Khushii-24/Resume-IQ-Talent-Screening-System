// src/components/RoleGate.jsx
import { Briefcase, User } from "lucide-react";

export default function RoleGate({ onSelect }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f8fafc",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center", maxWidth: "420px", padding: "0 24px" }}>

        <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}>
          ResumeIQ
        </h1>
        <p style={{ color: "#64748b", marginBottom: "48px", fontSize: "15px" }}>
          AI-powered resume screening platform
        </p>

        <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "20px", letterSpacing: "0.08em" }}>
          WHO ARE YOU?
        </p>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          {[
            { role: "candidate", label: "Candidate", sub: "Analyze your resume", Icon: User, bg: "#e0e7ff", color: "#3730a3" },
            { role: "recruiter", label: "Recruiter",  sub: "Screen candidates",  Icon: Briefcase, bg: "#dcfce7", color: "#166534" },
          ].map(({ role, label, sub, Icon, bg, color }) => (
            <button
              key={role}
              onClick={() => onSelect(role)}
              style={{
                background: "#fff",
                border: "1.5px solid #e2e8f0",
                borderRadius: "14px",
                padding: "28px 24px",
                cursor: "pointer",
                width: "160px",
                textAlign: "center",
                transition: "all 0.15s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = color;
                e.currentTarget.style.boxShadow = `0 4px 16px rgba(0,0,0,0.1)`;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{
                width: "48px", height: "48px",
                background: bg, borderRadius: "12px",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px",
              }}>
                <Icon size={22} color={color} />
              </div>
              <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>
                {label}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                {sub}
              </p>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
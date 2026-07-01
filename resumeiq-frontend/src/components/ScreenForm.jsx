// src/components/ScreenForm.jsx
import { useState, useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import api from "../api/client";

export default function ScreenForm({ onResults }) {
  const [jd, setJd]         = useState("");
  const [files, setFiles]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const inputRef = useRef(null);

  async function handleSubmit() {
    if (!jd.trim())        return setError("Paste a job description.");
    if (files.length === 0) return setError("Upload at least one resume PDF.");
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("job_description", jd);
      files.forEach((f) => formData.append("files", f));

      const { data } = await api.post("/screen/v2", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Add this temporarily in ScreenForm.jsx after the API call
console.log("screen/v2 response:", JSON.stringify(data, null, 2));
      onResults(data);
    } catch (err) {
      setError(err.response?.data?.detail ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>

      {/* JD input */}
      <label style={{ fontSize: "13px", color: "white", display: "block", marginBottom: "6px" }}>
        JOB DESCRIPTION
      </label>
      <textarea
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        placeholder="Paste the full job description here..."
        rows={6}
        style={{
          width: "100%",
          padding: "18px",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          fontSize: "14px",
          color: "white",
          resize: "vertical",
          boxSizing: "border-box",
          outline: "none",
          fontFamily: "inherit",
        }}
      />

      {/* File upload */}
      <div style={{ marginTop: "16px" }}>
        <label style={{ fontSize: "13px", color: "#64748b", display: "block", marginBottom: "6px" }}>
          CANDIDATE RESUMES
        </label>
        <div
          onClick={() => inputRef.current.click()}
          style={{
            border: "2px dashed #cbd5e1",
            borderRadius: "10px",
            padding: "20px",
            textAlign: "center",
            cursor: "pointer",
            background: "#f8fafc",
          }}
        >
          <Upload size={20} style={{ color: "#94a3b8", margin: "0 auto 8px" }} />
          <p style={{ fontSize: "13px", color: "#64748b" }}>
            {files.length > 0
              ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
              : "Click to upload PDF resumes"}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            style={{ display: "none" }}
            onChange={(e) => setFiles(Array.from(e.target.files))}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <ul style={{ marginTop: "8px", padding: 0, listStyle: "none" }}>
            {files.map((f) => (
              <li key={f.name} style={{ fontSize: "13px", color: "#475569", padding: "2px 0" }}>
                · {f.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "10px" }}>{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          marginTop: "16px",
          background: loading ? "#a5b4fc" : "#6366f1",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "12px 28px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
        {loading ? "Screening..." : "Screen Candidates"}
      </button>
    </div>
  );
}
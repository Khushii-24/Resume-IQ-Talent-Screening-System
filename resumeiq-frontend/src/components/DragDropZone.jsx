// src/components/DragDropZone.jsx
import { useState, useRef } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import api from "../api/client";

export default function DragDropZone({ onResult }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [filename, setFilename] = useState(null);
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file || file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    setFilename(file.name);
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await api.post("/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onResult(data);
    } catch (err) {
      setError(err.response?.data?.detail ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      style={{
        border: `2px dashed ${dragging ? "#6366f1" : "#cbd5e1"}`,
        borderRadius: "12px",
        padding: "48px",
        textAlign: "center",
        cursor: "pointer",
        background: dragging ? "#eef2ff" : "#f8fafc",
        transition: "all 0.2s",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {loading ? (
        <>
          <Loader2 size={36} style={{ color: "#6366f1", margin: "0 auto 12px" }} />
          <p style={{ color: "#6366f1" }}>Analyzing {filename}...</p>
        </>
      ) : (
        <>
          {filename
            ? <FileText size={36} style={{ color: "#6366f1", margin: "0 auto 12px" }} />
            : <Upload size={36} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
          }
          <p style={{ color: "#475569", fontWeight: 500 }}>
            {filename ?? "Drop a resume PDF here or click to upload"}
          </p>
          {error && (
            <p style={{ color: "#ef4444", marginTop: "8px", fontSize: "14px" }}>{error}</p>
          )}
        </>
      )}
    </div>
  );
}
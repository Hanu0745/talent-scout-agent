import { useState } from "react";

export default function JDInput({ onSubmit, loading }) {
  const [value, setValue] = useState("");

  function handleClick() {
    if (value.trim()) onSubmit(value.trim());
  }

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        marginBottom: 24,
      }}
    >
      <label
        style={{ display: "block", fontWeight: 600, marginBottom: 10, color: "#1e293b" }}
      >
        Job Description
      </label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Paste your job description here..."
        disabled={loading}
        style={{
          width: "100%",
          minHeight: 120,
          padding: 12,
          borderRadius: 8,
          border: "1.5px solid #cbd5e1",
          fontSize: 14,
          resize: "vertical",
          outline: "none",
          fontFamily: "inherit",
          color: "#1e293b",
          background: loading ? "#f8fafc" : "#fff",
          boxSizing: "border-box",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
        onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
      />
      <button
        onClick={handleClick}
        disabled={loading || !value.trim()}
        style={{
          marginTop: 12,
          padding: "10px 28px",
          background: loading || !value.trim() ? "#94a3b8" : "#0f172a",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: loading || !value.trim() ? "not-allowed" : "pointer",
          transition: "background 0.2s",
        }}
      >
        {loading ? "Scanning..." : "Find Candidates"}
      </button>
    </div>
  );
}

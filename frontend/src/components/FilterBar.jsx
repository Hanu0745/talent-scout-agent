import { useState, useEffect, useRef } from "react";

export default function FilterBar({ candidates, onFilter }) {
  const [interestLevel, setInterestLevel] = useState("all");
  const [seniority, setSeniority] = useState("all");
  const [openToWorkOnly, setOpenToWorkOnly] = useState(false);
  const checkboxRef = useRef(null);

  const isFiltered = interestLevel !== "all" || seniority !== "all" || openToWorkOnly;

  useEffect(() => {
    let filtered = [...candidates];
    if (interestLevel !== "all") {
      filtered = filtered.filter((c) => c.interestLevel.toLowerCase() === interestLevel);
    }
    if (seniority !== "all") {
      filtered = filtered.filter((c) => c.seniority.toLowerCase() === seniority);
    }
    if (openToWorkOnly) {
      filtered = filtered.filter((c) => c.openToWork === true);
    }
    onFilter(filtered);
  }, [interestLevel, seniority, openToWorkOnly, candidates]);

  function reset() {
    setInterestLevel("all");
    setSeniority("all");
    setOpenToWorkOnly(false);
  }

  const selectStyle = {
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 13,
    background: "white",
    cursor: "pointer",
    minWidth: 120,
    outline: "none",
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        padding: "16px 20px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 500, color: "#64748b" }}>Filter</span>

      {/* Interest Level */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, color: "#64748b" }}>Interest</span>
        <select value={interestLevel} onChange={(e) => setInterestLevel(e.target.value)} style={selectStyle}>
          <option value="all">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Seniority */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, color: "#64748b" }}>Seniority</span>
        <select value={seniority} onChange={(e) => setSeniority(e.target.value)} style={selectStyle}>
          <option value="all">All</option>
          <option value="junior">Junior</option>
          <option value="mid">Mid</option>
          <option value="senior">Senior</option>
          <option value="lead">Lead</option>
        </select>
      </div>

      {/* Open to Work toggle */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
        onClick={() => setOpenToWorkOnly((v) => !v)}
      >
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={openToWorkOnly}
          onChange={() => {}}
          style={{ display: "none" }}
        />
        <div
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            background: openToWorkOnly ? "#22c55e" : "#e2e8f0",
            cursor: "pointer",
            transition: "background 0.2s",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "white",
              position: "absolute",
              top: 2,
              left: openToWorkOnly ? 18 : 2,
              transition: "left 0.2s",
            }}
          />
        </div>
        <span style={{ fontSize: 13, color: "#64748b" }}>Open to work only</span>
      </div>

      {/* Reset button */}
      {isFiltered && (
        <button
          onClick={reset}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            color: "#3b82f6",
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Reset filters
        </button>
      )}
    </div>
  );
}

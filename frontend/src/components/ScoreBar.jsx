import { useEffect, useState } from "react";

export default function ScoreBar({ label, score, color }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{score}%</span>
      </div>
      <div
        style={{
          height: 8,
          background: "#e2e8f0",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${width}%`,
            background: color,
            borderRadius: 99,
            transition: "width 0.8s ease-out",
          }}
        />
      </div>
    </div>
  );
}

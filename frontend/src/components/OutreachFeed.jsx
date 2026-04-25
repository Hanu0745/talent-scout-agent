import { useEffect, useRef, useState } from "react";

function buildInterleavedMessages(candidates) {
  const maxLen = Math.max(0, ...candidates.map((c) => c.transcript?.length || 0));
  const result = [];
  for (let i = 0; i < maxLen; i++) {
    for (const c of candidates) {
      const msg = c.transcript?.[i];
      if (msg) result.push({ candidateName: c.name, role: msg.role, message: msg.message });
    }
  }
  return result;
}

function Avatar({ name }) {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "#0f172a",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function OutreachFeed({ candidates }) {
  if (!candidates?.length) return null;

  const active = candidates.filter((c) => c.transcript?.length > 0);
  const allMessages = buildInterleavedMessages(active);

  const [count, setCount] = useState(0);
  const bottomRef = useRef(null);
  const done = count >= allMessages.length;

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => setCount((n) => n + 1), 600);
    return () => clearTimeout(t);
  }, [count, done]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [count]);

  const visible = allMessages.slice(0, count);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      }}
    >
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 17, color: "#0f172a" }}>
          Live Outreach Feed
        </span>
        {!done && (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#22c55e",
              animation: "outreach-pulse 1.5s ease-in-out infinite",
            }}
          />
        )}
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748b" }}>
        AI agent engaged {active.length} candidate{active.length !== 1 ? "s" : ""}
      </p>

      {/* Feed container */}
      <div
        style={{
          height: 320,
          overflowY: "auto",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 12,
        }}
      >
        {visible.length === 0 && (
          <p style={{ color: "#cbd5e1", fontSize: 13, textAlign: "center", marginTop: 120 }}>
            Starting outreach…
          </p>
        )}

        {visible.map((msg, i) => {
          const isRecruiter = msg.role === "recruiter";
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: isRecruiter ? "row-reverse" : "row",
                alignItems: "flex-end",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <Avatar name={msg.candidateName} />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isRecruiter ? "flex-end" : "flex-start",
                  maxWidth: "72%",
                }}
              >
                <span style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>
                  {msg.candidateName}
                </span>
                <div
                  style={{
                    padding: "7px 11px",
                    borderRadius: isRecruiter
                      ? "12px 12px 3px 12px"
                      : "12px 12px 12px 3px",
                    background: isRecruiter ? "#0f172a" : "#f1f5f9",
                    color: isRecruiter ? "#fff" : "#1e293b",
                    fontSize: 12,
                    lineHeight: 1.45,
                  }}
                >
                  {msg.message}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Completion bar */}
      {done && allMessages.length > 0 && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 14px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "#166534",
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: 15 }}>✓</span>
          Outreach complete — {active.length} response{active.length !== 1 ? "s" : ""} collected
        </div>
      )}

      <style>{`
        @keyframes outreach-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}

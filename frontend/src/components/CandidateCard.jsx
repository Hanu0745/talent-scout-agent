import { useState } from "react";
import ScoreBar from "./ScoreBar";
import ConversationModal from "./ConversationModal";

const INTEREST_COLORS = {
  high:   { bg: "#dcfce7", color: "#166534" },
  medium: { bg: "#fef9c3", color: "#854d0e" },
  low:    { bg: "#fee2e2", color: "#991b1b" },
};

const INTEREST_BORDER = {
  high:   "#22c55e",
  medium: "#f59e0b",
  low:    "#ef4444",
};

function SkillPill({ label, matched }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 500,
        background: matched ? "#dcfce7" : "#fee2e2",
        color: matched ? "#166534" : "#991b1b",
        marginRight: 5,
        marginBottom: 4,
      }}
    >
      {label}
    </span>
  );
}

function SignalTag({ label }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 11,
        background: "#f1f5f9",
        color: "#64748b",
        marginRight: 5,
        marginBottom: 4,
      }}
    >
      {label}
    </span>
  );
}

export default function CandidateCard({ candidate }) {
  const [showConversation, setShowConversation] = useState(false);
  const [hovered, setHovered] = useState(false);

  const interest = candidate.interestLevel || "low";
  const interestStyle = INTEREST_COLORS[interest] || INTEREST_COLORS.low;
  const borderColor = INTEREST_BORDER[interest] || INTEREST_BORDER.low;

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
          borderLeft: `4px solid ${borderColor}`,
          boxShadow: hovered
            ? "0 4px 16px rgba(0,0,0,0.12)"
            : "0 1px 3px rgba(0,0,0,0.08)",
          transition: "box-shadow 0.2s ease",
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
          <div
            style={{
              minWidth: 36,
              height: 36,
              borderRadius: "50%",
              background: "#0f172a",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {candidate.rank}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, fontSize: 17, color: "#0f172a" }}>
                {candidate.name}
              </span>
              <span
                style={{
                  padding: "2px 10px",
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 600,
                  background: interestStyle.bg,
                  color: interestStyle.color,
                  textTransform: "capitalize",
                }}
              >
                {interest} interest
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
              {candidate.title} · {candidate.currentCompany}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              {candidate.location} · Notice: {candidate.noticePeriod} · {candidate.salaryExpectation}
            </div>
          </div>
        </div>

        {/* Score bars */}
        <ScoreBar label="Match Score"    score={candidate.matchScore}    color="#3b82f6" />
        <ScoreBar label="Interest Score" score={candidate.interestScore} color="#22c55e" />
        <ScoreBar label="Combined Score" score={candidate.combinedScore} color="#8b5cf6" />

        {/* Match explanation */}
        {candidate.matchExplanation && (
          <p
            style={{
              fontSize: 13,
              color: "#64748b",
              fontStyle: "italic",
              margin: "12px 0",
              lineHeight: 1.5,
            }}
          >
            {candidate.matchExplanation}
          </p>
        )}

        {/* Skills */}
        {(candidate.matchedSkills?.length > 0 || candidate.missingSkills?.length > 0) && (
          <div style={{ marginBottom: 10 }}>
            {candidate.matchedSkills?.map((s) => <SkillPill key={s} label={s} matched />)}
            {candidate.missingSkills?.map((s) => <SkillPill key={s} label={s} matched={false} />)}
          </div>
        )}

        {/* Key signals */}
        {candidate.keySignals?.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {candidate.keySignals.map((s) => <SignalTag key={s} label={s} />)}
          </div>
        )}

        {/* AI Reasoning */}
        {candidate.reasoning && candidate.reasoning !== "Engagement failed" && (
          <div
            style={{
              background: "#f8fafc",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              fontStyle: "italic",
              color: "#475569",
              marginBottom: 14,
              lineHeight: 1.5,
            }}
          >
            💡 <strong style={{ fontStyle: "normal" }}>AI Reasoning:</strong>{" "}
            {candidate.reasoning}
          </div>
        )}

        {/* Toggle conversation button */}
        <button
          onClick={() => setShowConversation((v) => !v)}
          style={{
            padding: "8px 18px",
            background: "transparent",
            border: "1.5px solid #cbd5e1",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "#475569",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#0f172a";
            e.currentTarget.style.color = "#0f172a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#cbd5e1";
            e.currentTarget.style.color = "#475569";
          }}
        >
          {showConversation ? "Hide Conversation" : "View Conversation"}
        </button>
      </div>

      {showConversation && (
        <ConversationModal
          transcript={candidate.transcript || []}
          candidateName={candidate.name}
          onClose={() => setShowConversation(false)}
        />
      )}
    </>
  );
}

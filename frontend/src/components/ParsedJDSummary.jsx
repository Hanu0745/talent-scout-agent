function Pill({ label, color }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 500,
        background: color === "blue" ? "#dbeafe" : "#ede9fe",
        color: color === "blue" ? "#1d4ed8" : "#7c3aed",
        marginRight: 6,
        marginBottom: 4,
      }}
    >
      {label}
    </span>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "#1e293b" }}>{value}</div>
    </div>
  );
}

export default function ParsedJDSummary({ parsedJD }) {
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
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: "#0f172a" }}>
        Parsed Job Description
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px 24px",
          marginBottom: 16,
        }}
      >
        <Field label="Role" value={parsedJD.role} />
        <Field label="Seniority" value={parsedJD.seniority} />
        <Field label="Experience" value={`${parsedJD.experienceYears}+ years`} />
        <Field label="Location" value={parsedJD.location} />
        <Field label="Remote Allowed" value={parsedJD.remoteAllowed ? "Yes" : "No"} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Required Skills</div>
        <div>
          {parsedJD.requiredSkills?.map((s) => (
            <Pill key={s} label={s} color="blue" />
          ))}
        </div>
      </div>

      {parsedJD.cultureSignals?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Culture Signals</div>
          <div>
            {parsedJD.cultureSignals.map((s) => (
              <Pill key={s} label={s} color="purple" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

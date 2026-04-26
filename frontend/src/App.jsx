import { useEffect, useState } from "react";
import { scoutCandidates } from "./api/client";
import JDInput from "./components/JDInput";
import ParsedJDSummary from "./components/ParsedJDSummary";
import OutreachFeed from "./components/OutreachFeed";
import CandidateCard from "./components/CandidateCard";
import FilterBar from "./components/FilterBar";

const LOADING_STEPS = [
  "Parsing job description",
  "Discovering candidates",
  "Running engagement conversations",
  "Scoring and ranking",
];

export default function App() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [error, setError] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // Reveal one new step every 15s while loading
  useEffect(() => {
    if (!loading || loadingStep >= LOADING_STEPS.length - 1) return;
    const t = setTimeout(() => setLoadingStep((s) => s + 1), 15000);
    return () => clearTimeout(t);
  }, [loading, loadingStep]);

  async function handleSubmit(jobDescription) {
    setLoading(true);
    setLoadingStep(0);
    setError(null);
    setResults(null);
    try {
      const data = await scoutCandidates(jobDescription);
      setResults(data);
      setFilteredCandidates(data.candidates);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const exportShortlist = () => {
    const data = results.candidates.map((c) => ({
      rank: c.rank,
      name: c.name,
      title: c.title,
      company: c.currentCompany,
      location: c.location,
      matchScore: c.matchScore,
      interestScore: c.interestScore,
      combinedScore: c.combinedScore,
      interestLevel: c.interestLevel,
      matchedSkills: c.matchedSkills,
      noticePeriod: c.noticePeriod,
      salaryExpectation: c.salaryExpectation,
      reasoning: c.reasoning,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shortlist.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Header */}
      <div style={{ background: "#0f172a", padding: "20px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.3px",
            }}
          >
            Talent Scout Agent
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
            AI-powered candidate matching &amp; engagement
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
        <JDInput onSubmit={handleSubmit} loading={loading} />

        {/* Loading card */}
        {loading && (
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 40,
              textAlign: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                border: "4px solid #e5e7eb",
                borderTopColor: "#0f172a",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px",
              }}
            />
            <p
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#0f172a",
                margin: "0 0 16px",
              }}
            >
              Finding &amp; engaging candidates…
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
              {LOADING_STEPS.slice(0, loadingStep + 1).map((step) => (
                <span key={step} style={{ fontSize: 14, color: "#64748b" }}>
                  ✓ {step}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: "14px 18px",
              color: "#b91c1c",
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            {error}
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <>
            <ParsedJDSummary parsedJD={results.parsedJD} />
            {/* <OutreachFeed candidates={results.candidates} /> */}

            <FilterBar candidates={results.candidates} onFilter={setFilteredCandidates} />

            {/* Heading row with export button */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: "0 0 8px",
              }}
            >
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Ranked Candidates
              </h2>
              <button
                onClick={exportShortlist}
                style={{
                  padding: "8px 16px",
                  background: "#fff",
                  border: "1px solid #0f172a",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#0f172a",
                  cursor: "pointer",
                }}
              >
                Export Shortlist
              </button>
            </div>

            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 16px" }}>
              Showing {filteredCandidates.length} of {results.candidates.length} candidates
            </p>

            {filteredCandidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      `}</style>
    </div>
  );
}

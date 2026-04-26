const fs = require("fs/promises");
const path = require("path");
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SENIORITY_LEVEL = {
  junior: 1,
  mid: 2,
  senior: 3,
  lead: 4,
  executive: 5,
};

// Roles that are irrelevant to frontend/React JDs
const ML_DATA_KEYWORDS = [
  "tensorflow", "pytorch", "spark", "airflow", "dbt",
  "machine learning", "data science", "kafka", "hadoop"
];
const FRONTEND_KEYWORDS = ["react", "vue", "angular", "next.js", "svelte"];

function toLower(value) {
  return String(value || "").trim().toLowerCase();
}

// FIX 4 — Negative filtering: remove clearly irrelevant candidates
function isRelevantCandidate(candidate, parsedJD) {
  const requiredSkillsLower = parsedJD.requiredSkills.map(toLower);
  const candidateSkillsLower = (candidate.skills || []).map(toLower);

  // Must match at least 1 required skill
  const hasAnySkillMatch = requiredSkillsLower.some((skill) =>
    candidateSkillsLower.some((cs) => cs.includes(skill))
  );

  if (!hasAnySkillMatch) return false;

  // If JD is frontend-focused, filter out pure ML/Data candidates
  const isFrontendJD = requiredSkillsLower.some((s) =>
    FRONTEND_KEYWORDS.includes(s)
  );
  const isMlOrDataCandidate =
    candidateSkillsLower.filter((s) =>
      ML_DATA_KEYWORDS.some((kw) => s.includes(kw))
    ).length >= 2;

  if (isFrontendJD && isMlOrDataCandidate) return false;

  return true;
}

function calculateSkillsScore(requiredSkills, candidateSkills) {
  if (requiredSkills.length === 0) {
    return { score: 25, matchedSkills: [], missingSkills: [] };
  }

  const candidateSkillsLower = candidateSkills.map(toLower);

  const matchedSkills = [];
  const missingSkills = [];
  let rawScore = 0;

  requiredSkills.forEach((skill, index) => {
    const skillLower = toLower(skill);
    const found = candidateSkillsLower.some((cs) => cs.includes(skillLower));

    if (found) {
      matchedSkills.push(skill);
      // FIX 1 — Primary skills (listed first) worth more than secondary
      // First skill = full weight, subsequent skills slightly less
      const weight = index === 0 ? 1.0 : index === 1 ? 0.9 : 0.8;
      rawScore += weight;
    } else {
      missingSkills.push(skill);
    }
  });

  // Normalize to 50 points max
  const maxPossible = requiredSkills.reduce((sum, _, i) =>
    sum + (i === 0 ? 1.0 : i === 1 ? 0.9 : 0.8), 0
  );
  const score = (rawScore / maxPossible) * 50;

  return { score, matchedSkills, missingSkills };
}

// FIX 3 — Stricter seniority penalties with real differentiation
function calculateSeniorityScore(jdSeniority, candidateSeniority) {
  const jdLevel = SENIORITY_LEVEL[toLower(jdSeniority)];
  const candidateLevel = SENIORITY_LEVEL[toLower(candidateSeniority)];

  if (!jdLevel || !candidateLevel) return 0;

  const diff = jdLevel - candidateLevel; // signed: negative = overqualified

  if (diff === 0) return 20;          // exact match
  if (diff === 1) return 8;           // 1 level under (was 10, now stricter)
  if (diff === -1) return 12;         // 1 level over (overqualified, slight penalty)
  if (diff === 2) return 2;           // 2 levels under (was 0, now very low)
  if (diff === -2) return 6;          // 2 levels over
  return 0;                           // 3+ levels off = 0
}

// FIX 3 — Stricter experience scoring with penalty for large gaps
function calculateExperienceScore(jdExperienceYears, candidateExperienceYears) {
  const jdYears = Number.isFinite(Number(jdExperienceYears))
    ? Number(jdExperienceYears)
    : 0;
  const candidateYears = Number.isFinite(Number(candidateExperienceYears))
    ? Number(candidateExperienceYears)
    : 0;

  const gap = jdYears - candidateYears;

  if (gap <= 0) return 15;      // meets or exceeds requirement
  if (gap <= 1) return 5;       // 1 year under (was 8, now stricter)
  if (gap <= 2) return 0;       // 2 years under
  return -5;                    // 3+ years under = penalty
}

function calculateLocationScore(parsedJD, candidate) {
  if (parsedJD?.remoteAllowed === true && candidate?.remoteOk === true) {
    return 15;
  }

  const jdLocation = toLower(parsedJD?.location);
  const candidateLocation = toLower(candidate?.location);

  if (jdLocation && candidateLocation.includes(jdLocation)) {
    return 15;
  }

  return 0;
}

// FIX 2 — Explanation is now score-aware so it can't contradict the score
async function generateMatchExplanation(parsedJD, candidate, matchScore) {
  const scoreLabel =
    matchScore >= 80 ? "strong match" :
    matchScore >= 60 ? "partial match" :
    matchScore >= 40 ? "weak match" : "poor match";

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a recruitment assistant. Write a concise 1-2 sentence explanation " +
          "that is CONSISTENT with the computed match score provided. " +
          "Do not contradict the score label. Return plain text only.",
      },
      {
        role: "user",
        content:
          `Candidate: ${candidate.name}\n` +
          `Computed match score: ${matchScore}/100 (${scoreLabel})\n` +
          `Matched skills: ${candidate.matchedSkills?.join(", ") || "none"}\n` +
          `Missing skills: ${candidate.missingSkills?.join(", ") || "none"}\n` +
          `Candidate seniority: ${candidate.seniority} | JD seniority: ${parsedJD.seniority}\n` +
          `Candidate experience: ${candidate.experienceYears}yrs | JD requires: ${parsedJD.experienceYears}yrs\n\n` +
          `Write an explanation that reflects this is a ${scoreLabel}.`,
      },
    ],
    max_tokens: 150,
    temperature: 0.3,
  });

  return response.choices?.[0]?.message?.content?.trim() || "";
}

async function matchCandidates(parsedJD) {
  const filePath = path.join(process.cwd(), "data", "candidates.json");
  const fileContent = await fs.readFile(filePath, "utf8");
  const allCandidates = JSON.parse(fileContent);

  const requiredSkills = Array.isArray(parsedJD?.requiredSkills)
    ? parsedJD.requiredSkills
    : [];

  // FIX 4 — Filter irrelevant candidates before scoring
  const relevantCandidates = allCandidates.filter((c) =>
    isRelevantCandidate(c, parsedJD)
  );

  const scoredCandidates = relevantCandidates.map((candidate) => {
    const { score: skillsScore, matchedSkills, missingSkills } =
      calculateSkillsScore(
        requiredSkills,
        Array.isArray(candidate.skills) ? candidate.skills : []
      );

    const seniorityScore = calculateSeniorityScore(
      parsedJD?.seniority,
      candidate?.seniority
    );
    const experienceScore = calculateExperienceScore(
      parsedJD?.experienceYears,
      candidate?.experienceYears
    );
    const locationScore = calculateLocationScore(parsedJD, candidate);

    // FIX 1 — Add small variance to break ties and create realistic spread
    const variance = parseFloat((Math.random() * 4 - 2).toFixed(1)); // ±2 pts
    const rawScore = skillsScore + seniorityScore + experienceScore + locationScore;
    const matchScore = Math.min(100, Math.max(0, Math.round((rawScore + variance) * 10) / 10));

    return {
      ...candidate,
      matchScore,
      matchedSkills,
      missingSkills,
    };
  });

  const topCandidates = scoredCandidates
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

  // FIX 2 — Pass matchScore into explanation generator
  const withExplanations = await Promise.all(
    topCandidates.map(async (candidate) => {
      const matchExplanation = await generateMatchExplanation(
        parsedJD,
        candidate,
        candidate.matchScore
      );
      return { ...candidate, matchExplanation };
    })
  );

  return withExplanations;
}

module.exports = { matchCandidates };
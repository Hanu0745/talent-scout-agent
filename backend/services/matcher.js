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

function toLower(value) {
  return String(value || "").trim().toLowerCase();
}

function calculateSkillsScore(requiredSkills, candidateSkills) {
  if (requiredSkills.length === 0) {
    return { score: 25, matchedSkills: [], missingSkills: [] };
  }

  const candidateSkillsSet = new Set(candidateSkills.map(toLower));
  const matchedSkills = requiredSkills.filter((skill) =>
    candidateSkillsSet.has(toLower(skill))
  );
  const missingSkills = requiredSkills.filter(
    (skill) => !candidateSkillsSet.has(toLower(skill))
  );

  const score = (matchedSkills.length / requiredSkills.length) * 50;

  return { score, matchedSkills, missingSkills };
}

function calculateSeniorityScore(jdSeniority, candidateSeniority) {
  const jdLevel = SENIORITY_LEVEL[toLower(jdSeniority)];
  const candidateLevel = SENIORITY_LEVEL[toLower(candidateSeniority)];

  if (!jdLevel || !candidateLevel) {
    return 0;
  }

  const diff = Math.abs(jdLevel - candidateLevel);

  if (diff === 0) {
    return 20;
  }

  if (diff === 1) {
    return 10;
  }

  return 0;
}

function calculateExperienceScore(jdExperienceYears, candidateExperienceYears) {
  const jdYears = Number.isFinite(Number(jdExperienceYears))
    ? Number(jdExperienceYears)
    : 0;
  const candidateYears = Number.isFinite(Number(candidateExperienceYears))
    ? Number(candidateExperienceYears)
    : 0;

  if (candidateYears >= jdYears) {
    return 15;
  }

  if (candidateYears >= jdYears - 1) {
    return 8;
  }

  return 0;
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

async function generateMatchExplanation(parsedJD, candidate) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a recruitment assistant. Write a concise 1-2 sentence explanation of why this candidate is or is not a good match. Be specific. Return plain text only.",
      },
      {
        role: "user",
        content:
          `Candidate name: ${candidate.name}\n` +
          `Candidate skills: ${JSON.stringify(candidate.skills)}\n` +
          `Candidate seniority: ${candidate.seniority}\n` +
          `Candidate experienceYears: ${candidate.experienceYears}\n` +
          `JD requiredSkills: ${JSON.stringify(parsedJD.requiredSkills || [])}\n` +
          `JD seniority: ${parsedJD.seniority}`,
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
  const candidates = JSON.parse(fileContent);

  const requiredSkills = Array.isArray(parsedJD?.requiredSkills)
    ? parsedJD.requiredSkills
    : [];

  const scoredCandidates = candidates.map((candidate) => {
    const { score: skillsScore, matchedSkills, missingSkills } =
      calculateSkillsScore(requiredSkills, Array.isArray(candidate.skills) ? candidate.skills : []);

    const seniorityScore = calculateSeniorityScore(
      parsedJD?.seniority,
      candidate?.seniority
    );
    const experienceScore = calculateExperienceScore(
      parsedJD?.experienceYears,
      candidate?.experienceYears
    );
    const locationScore = calculateLocationScore(parsedJD, candidate);

    const matchScore = skillsScore + seniorityScore + experienceScore + locationScore;

    return {
      ...candidate,
      matchScore: Math.round(matchScore * 10) / 10,
      matchedSkills,
      missingSkills,
    };
  });

  const topCandidates = scoredCandidates
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

  const withExplanations = await Promise.all(
    topCandidates.map(async (candidate) => {
      const matchExplanation = await generateMatchExplanation(parsedJD, candidate);

      return {
        ...candidate,
        matchExplanation,
      };
    })
  );

  return withExplanations;
}

module.exports = {
  matchCandidates,
};

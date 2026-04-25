const OpenAI = require("openai");
const { extractJSON } = require("../utils/extractJSON");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildRecruiterQuestions(candidate, parsedJD) {
  const role = parsedJD?.role || "software engineer";
  const seniority = parsedJD?.seniority || "mid";
  const requiredSkills = Array.isArray(parsedJD?.requiredSkills)
    ? parsedJD.requiredSkills.join(", ")
    : "";

  return [
    `Hi ${candidate.name}, I came across your profile and think you could be a great fit for a ${role} role. Are you currently open to exploring new opportunities?`,
    `The role is ${seniority}-level, fully remote, at a fast-paced startup. Does that kind of environment appeal to you?`,
    `The position requires ${requiredSkills}. How would you rate your confidence with these technologies?`,
    `What's your current notice period, and what would your ideal next step look like?`,
  ];
}

function buildCandidateSystemPrompt(candidate) {
  return (
    "You are simulating a real software engineer responding to a recruiter message on LinkedIn. " +
    "Reply naturally and conversationally in 2-4 sentences. " +
    `Base your personality and answers on this profile: Name: ${candidate.name}, ` +
    `Title: ${candidate.title}, ` +
    `Skills: ${JSON.stringify(candidate.skills || [])}, ` +
    `Seniority: ${candidate.seniority}, ` +
    `Experience: ${candidate.experienceYears} years, ` +
    `Open to work: ${candidate.openToWork}, ` +
    `Notice period: ${candidate.noticePeriod}. ` +
    "Be authentic - if openToWork is false, be hesitant but polite. If true, be genuinely interested."
  );
}

async function generateCandidateReply(candidate, question) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: buildCandidateSystemPrompt(candidate) },
      { role: "user", content: question },
    ],
    max_tokens: 200,
    temperature: 0.8,
  });
  return response.choices?.[0]?.message?.content?.trim() || "";
}

async function scoreInterest(transcript) {
  const transcriptText = transcript
    .map((l) => `${l.role === "recruiter" ? "Recruiter" : "Candidate"}: ${l.message}`)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a recruitment analyst. Read this recruiter-candidate conversation and return a JSON object with exactly these fields: " +
          '{ "interestScore": number between 0 and 100, "interestLevel": one of "high" | "medium" | "low", ' +
          '"reasoning": string of 1-2 sentences explaining the score, "keySignals": array of 2-4 short strings that indicate interest or disinterest }.',
      },
      { role: "user", content: transcriptText },
    ],
    max_tokens: 300,
    temperature: 0,
  });

  const raw = response.choices?.[0]?.message?.content || "{}";
  return extractJSON(raw);
}

async function engageCandidate(candidate, parsedJD) {
  try {
    const questions = buildRecruiterQuestions(candidate, parsedJD);
    const transcript = [];

    for (let i = 0; i < questions.length; i++) {
      transcript.push({ role: "recruiter", message: questions[i] });

      const reply = await generateCandidateReply(candidate, questions[i]);
      transcript.push({ role: "candidate", message: reply });
    }

    const analysis = await scoreInterest(transcript);

    return {
      transcript,
      interestScore: analysis.interestScore ?? 0,
      interestLevel: analysis.interestLevel ?? "low",
      reasoning: analysis.reasoning ?? "",
      keySignals: analysis.keySignals ?? [],
    };
  } catch (error) {
    console.error(`Engagement failed for ${candidate.name}:`, error.message);
    return {
      transcript: [],
      interestScore: 0,
      interestLevel: "low",
      reasoning: "Engagement failed",
      keySignals: [],
    };
  }
}

module.exports = { engageCandidate };

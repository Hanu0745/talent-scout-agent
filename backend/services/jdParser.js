const OpenAI = require("openai");
const { extractJSON } = require("../utils/extractJSON");

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function parseJobDescription(jdText) {
  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a recruitment analysis assistant. Extract structured information from job descriptions and return ONLY valid JSON.",
      },
      {
        role: "user",
        content:
          "Parse this job description and return a JSON object with exactly these fields:\n\n" +
          "role (string): job title\n" +
          'seniority (string): one of "junior", "mid", "senior", "lead", "executive"\n' +
          "requiredSkills (array of strings): hard technical skills explicitly required\n" +
          "niceToHaveSkills (array of strings): optional or preferred skills\n" +
          'location (string): city/country or "remote" or "hybrid"\n' +
          "remoteAllowed (boolean)\n" +
          'cultureSignals (array of strings): soft culture keywords like "fast-paced", "collaborative", "startup"\n' +
          "experienceYears (number): minimum years of experience, or 0 if not specified\n" +
          "summary (string): one sentence describing the role\n" +
          "rawJD (string): the original job description text verbatim\n\n" +
          "Raw JD text:\n" +
          jdText,
      },
    ],
    max_tokens: 800,
    temperature: 0,
  });

  const content = completion.choices?.[0]?.message?.content || "";

  try {
    return extractJSON(content);
  } catch {
    throw new Error(`JD parsing failed: model returned unparseable output — ${content.slice(0, 120)}`);
  }
}

module.exports = { parseJobDescription };

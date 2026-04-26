const OpenAI = require('openai');
const { extractJSON } = require('../utils/extractJSON');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function engageCandidate(candidate, parsedJD) {
  try {
    const recruiterSystemPrompt = `You are an expert technical recruiter doing LinkedIn outreach.
Your goal: assess if this candidate is genuinely interested and a good fit.

Job you are hiring for:
- Role: ${parsedJD.role}
- Seniority: ${parsedJD.seniority}
- Required skills: ${parsedJD.requiredSkills.join(', ')}
- Remote: ${parsedJD.remoteAllowed}
- Culture: ${parsedJD.cultureSignals.join(', ')}

Rules:
- Keep messages short: 2-3 sentences max
- Sound human and natural, not scripted
- Turn 1: introduce yourself and ask if they are open to opportunities
- Turn 2: adapt based on their reply — if hesitant, be more compelling; if keen, go deeper
- Turn 3: ask about their confidence with the required skills specifically
- Turn 4: ask about notice period and ideal next step
- If candidate mentions something specific (a skill, a preference, a concern) — follow up on it
- Never repeat a question already asked
- Always address the candidate by their first name: ${candidate.name.split(' ')[0]}
- Never use placeholder text like [Candidate's Name] or [Your Name]
- Sign off as "Hanu" if you need a recruiter name
Return only the recruiter message text, no labels or prefixes.`;

    const candidateSystemPrompt = `You are simulating ${candidate.name}, a ${candidate.title} with ${candidate.experienceYears} years experience.
Skills: ${candidate.skills.join(', ')}
Seniority: ${candidate.seniority}
Currently open to work: ${candidate.openToWork}
Notice period: ${candidate.noticePeriod}

Personality rules:
- If openToWork is false: start hesitant, be polite but say you are not actively looking. You might warm up slightly if the role sounds genuinely interesting but never fully commit.
- If openToWork is true: be genuinely interested but not desperate. Ask one real follow-up question per turn based on what matters to you (tech stack, team size, growth, remote culture).
- Vary your tone naturally across turns — don't repeat the same phrases
- React to what the recruiter specifically says — don't give generic answers
- Keep replies to 2-4 sentences
Return only the candidate reply, no labels.`;

    const conversationHistory = [];
    const transcript = [];

    for (let turn = 0; turn < 4; turn++) {
      const recruiterMsg = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: recruiterSystemPrompt },
          ...conversationHistory,
          {
            role: 'user',
            content: turn === 0
              ? 'Start the conversation. Send your opening message.'
              : 'Send your next message based on the conversation so far.'
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });
      const recruiterText = recruiterMsg.choices[0].message.content.trim();

      transcript.push({ role: 'recruiter', message: recruiterText });
      conversationHistory.push({ role: 'assistant', content: recruiterText });

      await sleep(300);

      const candidateMsg = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: candidateSystemPrompt },
          ...transcript.map((t) => ({
            role: t.role === 'recruiter' ? 'user' : 'assistant',
            content: t.message
          }))
        ],
        max_tokens: 200,
        temperature: 0.85
      });
      const candidateText = candidateMsg.choices[0].message.content.trim();

      transcript.push({ role: 'candidate', message: candidateText });
      conversationHistory.push({ role: 'user', content: candidateText });

      await sleep(300);
    }

    const transcriptText = transcript
      .map((l) => `${l.role === 'recruiter' ? 'Recruiter' : 'Candidate'}: ${l.message}`)
      .join('\n');

    const scoreResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a recruitment analyst. Read this recruiter-candidate conversation and return a JSON object with exactly these fields: ' +
            '{ "interestScore": number between 0 and 100, "interestLevel": one of "high" | "medium" | "low", ' +
            '"reasoning": string of 1-2 sentences explaining the score, "keySignals": array of 2-4 short strings that indicate interest or disinterest }.'
        },
        { role: 'user', content: transcriptText }
      ],
      max_tokens: 300,
      temperature: 0
    });

    const raw = scoreResponse.choices?.[0]?.message?.content || '{}';
    const analysis = extractJSON(raw);

    return {
      transcript,
      interestScore: analysis.interestScore ?? 0,
      interestLevel: analysis.interestLevel ?? 'low',
      reasoning: analysis.reasoning ?? '',
      keySignals: analysis.keySignals ?? []
    };
  } catch (error) {
    console.error('Engagement failed for', candidate.name, ':', error.message);
    return {
      transcript: [],
      interestScore: 0,
      interestLevel: 'low',
      reasoning: 'Engagement failed',
      keySignals: []
    };
  }
}

module.exports = { engageCandidate };

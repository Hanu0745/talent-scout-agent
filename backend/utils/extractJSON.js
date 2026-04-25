/**
 * Strips markdown code fences from LLM output before JSON.parse.
 * Models occasionally wrap JSON in ```json ... ``` despite being told not to.
 */
function extractJSON(raw) {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

module.exports = { extractJSON };

const express = require("express");
const { parseJobDescription } = require("../services/jdParser");
const { matchCandidates } = require("../services/matcher");
const { engageCandidate } = require("../services/engagementAgent");
const { rankCandidates } = require("../services/scorer");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription || typeof jobDescription !== "string" || !jobDescription.trim()) {
      return res.status(400).json({ error: "jobDescription is required and must be a non-empty string." });
    }

    const parsedJD = await parseJobDescription(jobDescription.trim());
    const matchedCandidates = await matchCandidates(parsedJD);

    // Engage all candidates in parallel — each candidate's questions are still
    // sequential internally, so at most 10 concurrent API calls at any moment.
    const engagementResults = await Promise.all(
      matchedCandidates.map((candidate) => engageCandidate(candidate, parsedJD))
    );

    const candidatesWithEngagement = matchedCandidates.map((candidate, index) => ({
      ...candidate,
      transcript: engagementResults[index].transcript,
      interestScore: engagementResults[index].interestScore,
      interestLevel: engagementResults[index].interestLevel,
      reasoning: engagementResults[index].reasoning,
      keySignals: engagementResults[index].keySignals,
    }));

    const rankedCandidates = rankCandidates(candidatesWithEngagement);

    res.json({ parsedJD, candidates: rankedCandidates });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

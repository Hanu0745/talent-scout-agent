function rankCandidates(candidates) {
  const ranked = candidates
    .map((candidate) => {
      const matchScore = Number(candidate?.matchScore) || 0;
      const interestScore = Number(candidate?.interestScore) || 0;
      const combinedScore = Math.round((matchScore * 0.6 + interestScore * 0.4) * 10) / 10;

      return {
        ...candidate,
        combinedScore,
      };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
    }));

  return ranked;
}

module.exports = {
  rankCandidates,
};

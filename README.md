# Talent Scout Agent

An AI-powered recruitment agent that takes a job description, discovers matching candidates, engages them in simulated conversations, and returns a ranked shortlist scored on Match and Interest.

## Features

- **JD parsing** — extracts role, seniority, skills, location, culture signals
- **Candidate matching** — weighted scoring with explainability
- **Simulated conversational outreach** — dynamic AI-to-AI conversations per candidate
- **Interest scoring** — analyzes conversation to detect genuine intent
- **Combined ranking** — 60% match + 40% interest weighted score
- **React dashboard** — score bars, conversation transcripts, filters, export

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **AI:** OpenAI GPT-4o
- **Styling:** Inline CSS (no UI libraries)

## Local Setup

### Prerequisites

- Node.js 18+
- OpenAI API key

### Steps

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd talent-scout-agent
   ```

2. **Backend setup**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` folder:
   ```
   OPENAI_API_KEY=your_key_here
   ```
   Start the server:
   ```bash
   node server.js
   ```

3. **Frontend setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173)

## Usage

1. Paste a job description into the text area
2. Click **"Find Candidates"**
3. Wait ~60 seconds while the agent parses, matches, and engages candidates
4. Review the ranked shortlist with scores and conversation transcripts
5. Use filters to narrow results
6. Click **"Export Shortlist"** to download results as JSON

## Project Structure

```
talent-scout-agent/
├── backend/
│   ├── data/candidates.json
│   ├── routes/scout.js
│   ├── services/
│   │   ├── jdParser.js
│   │   ├── matcher.js
│   │   ├── engagementAgent.js
│   │   └── scorer.js
│   └── server.js
├── frontend/
│   └── src/
│       ├── api/client.js
│       ├── components/
│       │   ├── CandidateCard.jsx
│       │   ├── ConversationModal.jsx
│       │   ├── FilterBar.jsx
│       │   ├── JDInput.jsx
│       │   ├── OutreachFeed.jsx
│       │   ├── ParsedJDSummary.jsx
│       │   └── ScoreBar.jsx
│       └── App.jsx
└── README.md
```

## Scoring Logic

**Match Score (0–100):** Skills match contributes 50 points, seniority alignment 20 points, years of experience 15 points, and location 15 points. Primary skills are weighted higher than secondary ones. A seniority penalty is applied when the candidate's level doesn't match the role, and an experience gap reduces the score proportionally.

**Interest Score (0–100):** GPT-4o reads the full conversation transcript and scores based on enthusiasm, follow-up questions asked by the candidate, availability signals, and hesitation markers.

**Combined Score:** `(Match × 0.6) + (Interest × 0.4)`

## Environment Variables

```
OPENAI_API_KEY=your_openai_api_key_here
PORT=7007
```

## Notes

- Candidate data is mocked in `data/candidates.json` (25 profiles)
- Each run takes 60–90 seconds due to sequential API calls to avoid rate limits
- Conversations are fully AI-simulated — no real candidates are contacted

## Sample Input JD

```
We are looking for a senior React developer with 5+ years experience in TypeScript and Node.js. Remote friendly. Fast-paced startup environment.
```

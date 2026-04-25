# Talent Scout Agent

An AI-powered recruitment pipeline that parses a job description, matches candidates from a talent pool, simulates live recruiter–candidate conversations, and ranks the results by a combined fit and interest score.

---

## What It Does

1. **Parses** a free-text job description into structured requirements (role, seniority, required skills, location, culture signals) using GPT-4o.
2. **Scores & matches** every candidate in the pool against those requirements — skills coverage, seniority alignment, experience, and location.
3. **Engages** the top 10 matches in parallel: an AI recruiter agent conducts a 4-turn conversation with each candidate, adapting tone based on their profile.
4. **Analyses** each conversation transcript for interest level, key signals, and an interest score (0–100).
5. **Ranks** all candidates by a combined score (60% match, 40% interest) and returns a structured result.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js 18+ / CommonJS |
| API framework | Express 5 |
| AI model | OpenAI GPT-4o (`response_format: json_object`) |
| Frontend | React 19 + Vite 8 |
| Styling | Inline styles — no CSS framework |
| HTTP client | Native `fetch` |

---

## Project Structure

```
talent-scout-agent/
├── backend/
│   ├── data/
│   │   └── candidates.json        # 25 candidate profiles
│   ├── routes/
│   │   └── scout.js               # POST /api/scout
│   ├── services/
│   │   ├── jdParser.js            # JD → structured object (GPT-4o)
│   │   ├── matcher.js             # Score + rank candidates
│   │   ├── engagementAgent.js     # Simulate recruiter conversations
│   │   └── scorer.js             # Combine match + interest scores
│   ├── utils/
│   │   └── extractJSON.js         # Strip markdown fences from LLM output
│   ├── server.js
│   └── .env                       # OPENAI_API_KEY, PORT, CORS_ORIGIN
│
└── frontend/
    └── src/
        ├── api/
        │   └── client.js          # scoutCandidates(jobDescription)
        └── components/
            ├── JDInput.jsx        # Job description textarea + submit
            ├── ParsedJDSummary.jsx# Structured JD display card
            ├── OutreachFeed.jsx   # Animated live message feed
            ├── CandidateCard.jsx  # Full candidate result card
            ├── ScoreBar.jsx       # Animated progress bar
            └── ConversationModal.jsx # Chat bubble transcript viewer
```

---

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later
- An **OpenAI API key** with access to `gpt-4o`

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd talent-scout-agent
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env   # or create .env manually
```

Add your key to `backend/.env`:

```env
OPENAI_API_KEY=sk-...
PORT=7007
CORS_ORIGIN=http://localhost:5173
```

### 3. Install and start the backend

```bash
# inside backend/
npm install
npm run dev        # node --watch (auto-restarts on file changes)
# or
npm start          # production
```

The API will be available at `http://localhost:7007`.

### 4. Install and start the frontend

```bash
cd ../frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## API Reference

### `POST /api/scout`

Runs the full pipeline for a given job description.

**Request**

```json
{
  "jobDescription": "We are looking for a senior React developer..."
}
```

**Response**

```json
{
  "parsedJD": {
    "role": "React Developer",
    "seniority": "senior",
    "requiredSkills": ["React", "TypeScript", "Node.js"],
    "niceToHaveSkills": [],
    "location": "remote",
    "remoteAllowed": true,
    "cultureSignals": ["fast-paced", "startup"],
    "experienceYears": 5,
    "summary": "...",
    "rawJD": "..."
  },
  "candidates": [
    {
      "id": "c002",
      "name": "Priya Menon",
      "rank": 1,
      "matchScore": 90,
      "interestScore": 90,
      "combinedScore": 90,
      "interestLevel": "high",
      "matchedSkills": ["React", "TypeScript", "Node.js"],
      "missingSkills": [],
      "matchExplanation": "...",
      "keySignals": ["open to new opportunities", "..."],
      "transcript": [...]
    }
  ]
}
```

**Error responses**

| Status | Meaning |
|---|---|
| `400` | `jobDescription` missing or empty |
| `500` | Internal error (upstream API failure, etc.) |

### `GET /api/health`

Returns `{ "status": "ok", "uptime": <seconds> }`. Use for liveness checks.

---

## Scoring Breakdown

### Match Score (0–100)

| Dimension | Max points |
|---|---|
| Required skills coverage | 50 |
| Seniority alignment (exact = 20, ±1 level = 10) | 20 |
| Experience years (meets requirement = 15, within 1yr = 8) | 15 |
| Location / remote compatibility | 15 |

### Interest Score (0–100)

Derived by GPT-4o analysing the 4-turn engagement conversation. Factors include enthusiasm, openness to the role, alignment with the environment, and notice period pragmatics.

### Combined Score

```
combinedScore = (matchScore × 0.6) + (interestScore × 0.4)
```

---

## How the Engagement Pipeline Works

```
Job Description
      │
      ▼
 jdParser.js ──── GPT-4o ────► Structured JD object
      │
      ▼
 matcher.js ─── rule-based ──► Top 10 candidates (scored + explanation)
      │
      ▼
 engagementAgent.js                     ← runs for all 10 in parallel
   ├─ 4 recruiter questions (sequential per candidate)
   ├─ GPT-4o simulates candidate replies (persona-driven)
   └─ GPT-4o scores the full transcript
      │
      ▼
 scorer.js ─── weighted average ──► Final ranked list
```

All GPT-4o calls that return JSON use `response_format: { type: "json_object" }` to guarantee parseable output. A defensive `extractJSON` utility additionally strips any accidental markdown fences.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | Yes | — | OpenAI API key |
| `PORT` | No | `7007` | Port the Express server listens on |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin |

---

## Development Scripts

### Backend

```bash
npm run dev     # node --watch server.js (Node 18+ built-in)
npm start       # node server.js
```

### Frontend

```bash
npm run dev     # Vite dev server with HMR
npm run build   # Production build → dist/
npm run preview # Serve the production build locally
npm run lint    # ESLint
```

---

## Candidate Data

The talent pool lives in `backend/data/candidates.json` — 25 profiles with the following fields:

```
id · name · title · location · remoteOk · experienceYears
seniority · skills · currentCompany · openToWork · noticePeriod
salaryExpectation · bio
```

Seniority levels: `junior` · `mid` · `senior` · `lead` · `executive`

To use a different talent pool, replace the file with an array of objects following the same schema.

---

## Performance Notes

- **Response time:** ~15–20 seconds for 10 candidates (all engagements run in parallel).
- **API calls per request:** 1 (JD parse) + 10 (match explanations) + 40 (engagement turns) + 10 (interest scoring) = ~61 calls to GPT-4o.
- **Rate limits:** At most 10 concurrent calls at any moment (one per candidate). Well within Tier 1 OpenAI limits (500 RPM).

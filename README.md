# GrowEasy AI-Powered CSV Importer

An AI-powered CSV importer that ingests CRM lead exports in **any column layout**
(Facebook Lead Ads, Google Ads, Excel sheets, real-estate CRMs, sales reports,
manually created spreadsheets, etc.) and intelligently maps them into the
GrowEasy CRM schema — without assuming fixed column names.

Built for the GrowEasy Software Developer Assignment.

---

## How it works

1. **Upload** — user uploads any valid CSV (drag & drop or file picker).
2. **Preview** — the file is parsed client-side against the backend's
   `/api/parse` endpoint and shown in a scrollable, sticky-header table.
   No AI is called at this stage.
3. **Confirm** — only after the user clicks *Confirm Import* does the app
   call `/api/extract`.
4. **AI Extraction** — the backend batches the raw rows (default 20/batch)
   and sends each batch to an LLM (Claude / OpenAI / Gemini — configurable)
   with a strict system prompt that maps arbitrary source columns onto the
   fixed GrowEasy CRM schema, enforces the allowed `crm_status` /
   `data_source` enums, and skips rows with no email or mobile number.
5. **Result** — the frontend displays imported vs. skipped records, with
   totals for both.

A programmatic sanitizer runs on every AI response as a safety net: it
re-validates enum values, re-checks the date is parseable via
`new Date(created_at)`, and re-applies the "must have email or mobile"
rule in case the model's own output slips.

---

## Tech stack

| Layer    | Tech                                              |
|----------|----------------------------------------------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS  |
| Backend  | Node.js, Express                                   |
| AI       | Anthropic Claude (default), OpenAI, or Gemini      |
| Parsing  | `csv-parse`                                        |
| Uploads  | `multer` (in-memory, 15MB limit)                   |

---

## Project structure

```
groweasy-csv-importer/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express app entry point
│   │   ├── routes/
│   │   │   ├── parse.js          # POST /api/parse   -> preview only
│   │   │   └── extract.js        # POST /api/extract -> AI mapping
│   │   └── services/
│   │       ├── csvParser.js      # column-agnostic CSV -> row objects
│   │       └── aiExtractor.js    # batching, prompting, retries, sanitizing
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── app/                      # Next.js App Router pages
│   ├── components/               # Dropzone, DataTable, Stepper, Hero
│   ├── lib/api.ts                # typed fetch helpers
│   ├── Dockerfile
│   └── .env.local.example
├── samples/                      # sample CSVs to test with
├── docker-compose.yml
└── README.md
```

---

## Local setup

### Prerequisites
- Node.js 18+
- An API key for at least one of: Anthropic Claude, OpenAI, Gemini

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env: set AI_PROVIDER and the matching API key
npm install
npm run dev        # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL should point at the backend above
npm install
npm run dev        # http://localhost:3000
```

Open `http://localhost:3000`, upload one of the CSVs in `/samples`, preview
it, confirm the import, and inspect the AI-mapped result.

### 3. With Docker (optional)

```bash
cp backend/.env.example backend/.env   # fill in your API key first
docker compose up --build
```

---

## Environment variables

**backend/.env**

| Variable          | Description                                         |
|-------------------|------------------------------------------------------|
| `PORT`             | Port for the Express server (default `4000`)        |
| `AI_PROVIDER`      | `anthropic` \| `openai` \| `gemini`                  |
| `ANTHROPIC_API_KEY`| Required if `AI_PROVIDER=anthropic`                  |
| `OPENAI_API_KEY`   | Required if `AI_PROVIDER=openai`                     |
| `GEMINI_API_KEY`   | Required if `AI_PROVIDER=gemini`                     |
| `BATCH_SIZE`       | Rows sent to the AI per request (default `20`)       |
| `CORS_ORIGIN`      | Comma-separated list of allowed frontend origins     |

**frontend/.env.local**

| Variable              | Description                     |
|-----------------------|----------------------------------|
| `NEXT_PUBLIC_API_URL` | Base URL of the deployed backend |

---

## API reference

### `POST /api/parse`
`multipart/form-data`, field `file` — the CSV to preview.
Returns `{ headers, rows, totalRows }`. Parsing only, no AI call.

### `POST /api/extract`
`application/json` — `{ rows: Record<string,string>[] }` (max 5000 rows).
Returns:
```json
{
  "records": [ { "created_at": "...", "name": "...", "...": "..." } ],
  "skipped": [ { "row": {}, "reason": "No email or mobile number found." } ],
  "totalImported": 0,
  "totalSkipped": 0
}
```

### `GET /api/health`
Returns `{ status: "ok", provider: "<active AI provider>" }`.

---

## Design decisions & notes

- **Column-agnostic by design** — `csvParser.js` never assumes header names;
  all field-mapping intelligence lives in the AI prompt in `aiExtractor.js`.
- **Batching** — rows are chunked (default 20) and batches are sent
  concurrently via `Promise.all`, keeping large files responsive.
- **Retries** — each batch retries up to 2 times on failure; if a batch still
  fails, those rows are marked skipped with the error reason rather than
  crashing the whole import.
- **Two-step confirm** — the frontend never calls the AI endpoint until the
  user explicitly confirms the preview, avoiding wasted API calls on bad
  uploads.
- **Enum safety net** — `crm_status` and `data_source` are re-validated
  server-side after the AI call, so a hallucinated value can never reach the
  response.

## Possible next steps
- Persist import history to a database (kept stateless for this assignment).
- Streaming/incremental batch progress over SSE or WebSockets.
- Unit tests for `csvParser.js` and the sanitizer in `aiExtractor.js`.

---

## Submission

- **Position applied for:** *[Software Developer Intern / Full-Time — fill in]*
- **Hosted app:** *[add deployed URL here]*
- **GitHub repo:** *[add repo URL here]*

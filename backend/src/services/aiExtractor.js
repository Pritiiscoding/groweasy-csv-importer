import Anthropic from "@anthropic-ai/sdk";

export const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
];

export const DATA_SOURCE_VALUES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
];

const CRM_FIELDS = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
];

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 20);
const MAX_RETRIES = 2;

function buildSystemPrompt() {
  return `You are a data-mapping engine for GrowEasy's CRM. You receive raw CSV rows exported from arbitrary sources (Facebook lead ads, Google Ads, Excel sheets, real-estate CRMs, sales reports, manual spreadsheets, etc). Column names, ordering and structure vary between files. Your job is to map each raw row into the fixed GrowEasy CRM schema below, using your judgement about what each raw column actually represents.

CRM SCHEMA (return exactly these keys per record, use "" for anything you cannot determine):
${CRM_FIELDS.map((f) => `- ${f}`).join("\n")}

RULES YOU MUST FOLLOW EXACTLY:
1. crm_status must be one of: ${CRM_STATUS_VALUES.join(", ")}. If nothing in the row maps confidently to one of these, leave it as "".
2. data_source must be one of: ${DATA_SOURCE_VALUES.join(", ")}. If none match confidently, leave it as "".
3. created_at must be a string parseable by JavaScript's "new Date(created_at)". If no date is present, leave it as "".
4. Use crm_note to capture: remarks, follow-up notes, additional comments, extra phone numbers, extra email addresses, or any other useful information from the row that doesn't fit a schema field.
5. If a row has multiple email addresses, put the first in "email" and append the rest into crm_note. If a row has multiple mobile numbers, put the first in "mobile_without_country_code" (digits only, no country code) and append the rest into crm_note.
6. Every record must stay a single logical row - never introduce raw line breaks inside a field. If a field's source text contains a line break, replace it with "\\n" (escaped), never a literal newline.
7. If a row has NEITHER an email NOR a mobile number anywhere in it, skip that row entirely - do not include it in "records", instead include it in "skipped" with a short one-sentence "reason".
8. Never invent data that is not present or reasonably inferable from the row.

OUTPUT FORMAT:
Return ONLY raw JSON (no markdown fences, no commentary, no preamble) matching exactly:
{
  "records": [ { ${CRM_FIELDS.map((f) => `"${f}": ""`).join(", ")} } ],
  "skipped": [ { "row": <original row object>, "reason": "" } ]
}`;
}

function buildUserPrompt(batch) {
  return `Map the following ${batch.length} raw CSV rows (as JSON objects, keys are the original column headers from the source file) into the CRM schema. Return JSON only.\n\n${JSON.stringify(
    batch,
    null,
    2
  )}`;
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}

function stripCodeFences(text) {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");
}

function isValidDate(value) {
  if (!value) return true; // blank is allowed
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

/**
 * Programmatic safety net on top of the model's own instruction-following:
 * enforce enums, drop bad dates back to blank, and re-check the
 * email/mobile skip rule in case the model missed it.
 */
function sanitizeRecord(raw) {
  const record = {};
  for (const field of CRM_FIELDS) {
    record[field] = typeof raw[field] === "string" ? raw[field].trim() : "";
  }

  if (!CRM_STATUS_VALUES.includes(record.crm_status)) record.crm_status = "";
  if (!DATA_SOURCE_VALUES.includes(record.data_source)) record.data_source = "";
  if (!isValidDate(record.created_at)) record.created_at = "";

  return record;
}

function hasContactInfo(record) {
  return Boolean(record.email) || Boolean(record.mobile_without_country_code);
}

async function callAnthropic(batch) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: 4096,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserPrompt(batch) }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return JSON.parse(stripCodeFences(text));
}

async function callOpenAI(batch) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(batch) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI request failed: ${res.status}`);
  const data = await res.json();
  return JSON.parse(stripCodeFences(data.choices[0].message.content));
}

async function callGemini(batch) {
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
        contents: [{ role: "user", parts: [{ text: buildUserPrompt(batch) }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini request failed: ${res.status}`);
  const data = await res.json();
  const text = data.candidates[0].content.parts.map((p) => p.text).join("\n");
  return JSON.parse(stripCodeFences(text));
}

async function callProvider(batch) {
  const provider = process.env.AI_PROVIDER || "anthropic";
  if (provider === "openai") return callOpenAI(batch);
  if (provider === "gemini") return callGemini(batch);
  return callAnthropic(batch);
}

async function processBatchWithRetry(batch, batchIndex) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const parsed = await callProvider(batch);
      const records = Array.isArray(parsed.records)
        ? parsed.records.map(sanitizeRecord).filter(hasContactInfo)
        : [];
      const modelSkipped = Array.isArray(parsed.skipped) ? parsed.skipped : [];

      // Anything the model returned as a "record" but that fails the
      // contact-info rule gets reclassified as skipped rather than lost.
      const rejected = Array.isArray(parsed.records)
        ? parsed.records
            .map(sanitizeRecord)
            .filter((r) => !hasContactInfo(r))
            .map((r) => ({ row: r, reason: "No email or mobile number found." }))
        : [];

      return { records, skipped: [...modelSkipped, ...rejected] };
    } catch (e) {
      lastError = e;
    }
  }
  // Every retry failed - skip the whole batch but keep the pipeline alive.
  return {
    records: [],
    skipped: batch.map((row) => ({
      row,
      reason: `AI extraction failed for this batch: ${lastError?.message || "unknown error"}`,
    })),
  };
}

/**
 * @param {Record<string, string>[]} rows raw CSV rows as parsed from the file
 * @returns {Promise<{records: object[], skipped: object[], totalImported: number, totalSkipped: number}>}
 */
export async function extractCrmRecords(rows) {
  const batches = chunk(rows, BATCH_SIZE);
  const results = await Promise.all(
    batches.map((batch, i) => processBatchWithRetry(batch, i))
  );

  const records = results.flatMap((r) => r.records);
  const skipped = results.flatMap((r) => r.skipped);

  return {
    records,
    skipped,
    totalImported: records.length,
    totalSkipped: skipped.length,
  };
}

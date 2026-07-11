const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type ParsePreview = {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
};

export type CrmRecord = {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
};

export type SkippedRow = {
  row: Record<string, string>;
  reason: string;
};

export type ExtractResult = {
  records: CrmRecord[];
  skipped: SkippedRow[];
  totalImported: number;
  totalSkipped: number;
};

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // response wasn't JSON - keep default message
    }
    throw new Error(message);
  }
  return res.json();
}

export async function uploadCsv(file: File): Promise<ParsePreview> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/parse`, {
    method: "POST",
    body: formData,
  });
  return handle<ParsePreview>(res);
}

export async function extractRecords(
  rows: Record<string, string>[]
): Promise<ExtractResult> {
  const res = await fetch(`${API_BASE}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  return handle<ExtractResult>(res);
}

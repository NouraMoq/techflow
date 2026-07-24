import "server-only";
import type { FetchResult, RawSignal, TrendDataProvider, SignalMetrics } from "../types";

// Minimal RFC-ish CSV parser (handles quoted fields with commas/newlines).
function parseCSV(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQ = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (inQ) {
      if (c === '"') { if (raw[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && raw[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((x) => x.trim() !== "")) rows.push(row); }
  return rows;
}

const num = (v?: string) => { const n = Number((v ?? "").replace(/[^\d.]/g, "")); return Number.isFinite(n) && n > 0 ? n : undefined; };

// Expected header (any order): text,hashtags,views,likes,shares,comments,accounts,postedAt,lang
// hashtags separated by space, ';' or '|'.
export class CsvProvider implements TrendDataProvider {
  readonly source = "csv" as const;
  readonly mode = "imported" as const;

  async fetch(payload?: unknown): Promise<FetchResult> {
    const raw = typeof payload === "string" ? payload : String((payload as { csv?: string })?.csv ?? "");
    const rows = parseCSV(raw);
    if (rows.length < 2) return { source: this.source, mode: this.mode, signals: [] };
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const idx = (k: string) => header.indexOf(k);
    const iText = idx("text"), iTags = idx("hashtags");
    const signals: RawSignal[] = [];
    for (const r of rows.slice(1)) {
      const text = (iText >= 0 ? r[iText] : r[0] ?? "").trim();
      if (!text) continue;
      const tags = (iTags >= 0 ? r[iTags] ?? "" : "").split(/[ ;|]+/).map((t) => t.trim()).filter(Boolean);
      const metrics: SignalMetrics = {
        views: num(r[idx("views")]), likes: num(r[idx("likes")]), shares: num(r[idx("shares")]),
        comments: num(r[idx("comments")]), accounts: num(r[idx("accounts")]),
        postedAt: idx("postedat") >= 0 ? (r[idx("postedat")] || undefined) : undefined,
      };
      signals.push({ text, hashtags: tags, metrics, lang: idx("lang") >= 0 ? r[idx("lang")] : undefined });
    }
    return { source: this.source, mode: this.mode, signals, note: `تم استيراد ${signals.length} إشارة من CSV` };
  }
}

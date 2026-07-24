import "server-only";
import type {
  FetchResult, RawSignal, TrendDataProvider, TrendSource, ProviderMode, SignalMetrics,
} from "../types";
import { TrendSourceNotConfiguredError } from "../types";

/**
 * ExternalLicensedProvider — a generic, production-ready adapter for a LICENSED
 * trends-data API (any vendor with a legitimate, official API).
 *
 * Deliberately vendor-agnostic: no specific company is assumed and NO real or
 * paid service is connected. It stays inert (NotConfigured) until you supply
 * credentials via environment variables — and even then only against a base URL
 * you explicitly set. This is the compliant alternative to Google Trends, which
 * has no official public API (its only libraries do scraping — forbidden here).
 *
 * Guarantees:
 *  - Secrets live ONLY in env, server-side; the key is never sent to the client
 *    and never persisted. The stored signal keeps a source label + fetch time
 *    (TrendSignal.source + TrendSignal.createdAt), never the raw key.
 *  - Pagination (page-number or cursor), rate-limit backoff (honours 429
 *    Retry-After), retry with exponential backoff on 5xx/network errors.
 *  - Response shape is configurable via env (field names) so a new vendor is a
 *    config change, not a code change.
 *  - Per-record validation: malformed records are skipped, not ingested.
 *  - Within-batch de-duplication by external ref (DB-level dedup is in ingest).
 *  - Disable switch: TREND_LICENSED_DISABLED=1 forces NotConfigured.
 *  - No scraping, no unofficial access.
 */

const SOURCE: TrendSource = "licensed";

function env(k: string): string | undefined {
  const v = process.env[k];
  return v && v.trim() ? v.trim() : undefined;
}
function envInt(k: string, d: number): number {
  const n = Number(env(k));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : d;
}
function disabled(): boolean {
  const v = (env("TREND_LICENSED_DISABLED") ?? "").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** NotConfigured unless a key AND a base URL exist and the provider isn't disabled. */
export function licensedConfigured(): boolean {
  if (disabled()) return false;
  return Boolean(env("TREND_LICENSED_API_KEY") && env("TREND_LICENSED_BASE_URL"));
}

interface LicensedConfig {
  baseUrl: string;
  apiKey: string;
  path: string;            // endpoint path, e.g. /v1/trends
  authHeader: string;      // header carrying the credential
  authScheme: string;      // "" | "Bearer" | "ApiKey" ...
  pageSize: number;
  maxPages: number;        // hard ceiling so we never loop forever
  pageParam: string;       // query param for page number
  sizeParam: string;       // query param for page size
  cursorParam: string;     // query param for cursor pagination (if used)
  pageDelayMs: number;     // polite gap between pages
  retries: number;
  // response mapping (field names in the vendor payload)
  itemsField: string;      // dotted path to the array, e.g. "data" or "result.items"
  nextField: string;       // dotted path to the next cursor (empty = page-number mode)
  textField: string;
  refField: string;
  hashtagsField: string;
  langField: string;
  viewsField: string;
  likesField: string;
  sharesField: string;
  commentsField: string;
  postedAtField: string;
}

function loadConfig(): LicensedConfig {
  const baseUrl = env("TREND_LICENSED_BASE_URL")!;
  const apiKey = env("TREND_LICENSED_API_KEY")!;
  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
    path: env("TREND_LICENSED_PATH") ?? "/trends",
    authHeader: env("TREND_LICENSED_AUTH_HEADER") ?? "Authorization",
    authScheme: env("TREND_LICENSED_AUTH_SCHEME") ?? "Bearer",
    pageSize: envInt("TREND_LICENSED_PAGE_SIZE", 50),
    maxPages: envInt("TREND_LICENSED_MAX_PAGES", 20),
    pageParam: env("TREND_LICENSED_PAGE_PARAM") ?? "page",
    sizeParam: env("TREND_LICENSED_SIZE_PARAM") ?? "page_size",
    cursorParam: env("TREND_LICENSED_CURSOR_PARAM") ?? "cursor",
    pageDelayMs: envInt("TREND_LICENSED_PAGE_DELAY_MS", 250),
    retries: envInt("TREND_LICENSED_RETRIES", 3),
    itemsField: env("TREND_LICENSED_ITEMS_FIELD") ?? "data",
    nextField: env("TREND_LICENSED_NEXT_FIELD") ?? "",
    textField: env("TREND_LICENSED_TEXT_FIELD") ?? "text",
    refField: env("TREND_LICENSED_REF_FIELD") ?? "id",
    hashtagsField: env("TREND_LICENSED_HASHTAGS_FIELD") ?? "hashtags",
    langField: env("TREND_LICENSED_LANG_FIELD") ?? "lang",
    viewsField: env("TREND_LICENSED_VIEWS_FIELD") ?? "views",
    likesField: env("TREND_LICENSED_LIKES_FIELD") ?? "likes",
    sharesField: env("TREND_LICENSED_SHARES_FIELD") ?? "shares",
    commentsField: env("TREND_LICENSED_COMMENTS_FIELD") ?? "comments",
    postedAtField: env("TREND_LICENSED_POSTED_AT_FIELD") ?? "posted_at",
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

function pick(obj: unknown, dotted: string): unknown {
  if (!dotted) return undefined;
  return dotted.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined), obj);
}
function num(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function strArr(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim());
  return out.length ? out : undefined;
}

/** Map one vendor record → RawSignal, or null if it fails validation. */
function mapRecord(rec: unknown, cfg: LicensedConfig): RawSignal | null {
  if (!rec || typeof rec !== "object") return null;
  const text = pick(rec, cfg.textField);
  if (typeof text !== "string" || !text.trim()) return null; // text is mandatory
  const metrics: SignalMetrics = {};
  const views = num(pick(rec, cfg.viewsField)); if (views !== undefined) metrics.views = views;
  const likes = num(pick(rec, cfg.likesField)); if (likes !== undefined) metrics.likes = likes;
  const shares = num(pick(rec, cfg.sharesField)); if (shares !== undefined) metrics.shares = shares;
  const comments = num(pick(rec, cfg.commentsField)); if (comments !== undefined) metrics.comments = comments;
  const postedAt = pick(rec, cfg.postedAtField); if (typeof postedAt === "string") metrics.postedAt = postedAt;
  const refRaw = pick(rec, cfg.refField);
  const lang = pick(rec, cfg.langField);
  return {
    text: text.trim().slice(0, 2000),
    externalRef: refRaw != null ? String(refRaw) : undefined,
    hashtags: strArr(pick(rec, cfg.hashtagsField)),
    lang: typeof lang === "string" ? lang : undefined,
    metrics: Object.keys(metrics).length ? metrics : undefined,
  };
}

/** GET with retry + rate-limit backoff. Honours 429 Retry-After. */
async function requestWithRetry(url: string, cfg: LicensedConfig): Promise<unknown> {
  const authValue = cfg.authScheme ? `${cfg.authScheme} ${cfg.apiKey}` : cfg.apiKey;
  const headers: Record<string, string> = { accept: "application/json", [cfg.authHeader]: authValue };
  let lastErr: unknown;
  for (let attempt = 0; attempt <= cfg.retries; attempt++) {
    try {
      const res = await fetch(url, { method: "GET", headers, signal: AbortSignal.timeout(20_000) });
      if (res.status === 429 || res.status >= 500) {
        const ra = Number(res.headers.get("retry-after"));
        const wait = Number.isFinite(ra) && ra > 0 ? ra * 1000 : 500 * 2 ** attempt;
        if (attempt < cfg.retries) { await sleep(wait); continue; }
        throw new Error(`licensed API ${res.status}`);
      }
      if (!res.ok) throw new Error(`licensed API ${res.status}`); // 4xx (not 429) — don't retry
      return await res.json();
    } catch (e) {
      lastErr = e;
      if (attempt < cfg.retries) { await sleep(500 * 2 ** attempt); continue; }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("licensed API request failed");
}

export class ExternalLicensedProvider implements TrendDataProvider {
  readonly source = SOURCE;
  readonly mode: ProviderMode = "live";

  async fetch(payload?: unknown): Promise<FetchResult> {
    if (!licensedConfigured()) throw new TrendSourceNotConfiguredError(SOURCE);
    const cfg = loadConfig();
    const query = typeof payload === "object" && payload && "q" in payload ? String((payload as { q: unknown }).q) : undefined;

    const signals: RawSignal[] = [];
    const seen = new Set<string>(); // within-batch dedup by ref (fallback: text)
    let cursor: string | undefined;
    let pages = 0;

    for (let page = 1; page <= cfg.maxPages; page++) {
      const url = new URL(cfg.baseUrl + cfg.path);
      url.searchParams.set(cfg.sizeParam, String(cfg.pageSize));
      if (query) url.searchParams.set("q", query);
      if (cfg.nextField && cursor) url.searchParams.set(cfg.cursorParam, cursor);
      else url.searchParams.set(cfg.pageParam, String(page));

      const body = await requestWithRetry(url.toString(), cfg);
      pages++;
      const itemsRaw = pick(body, cfg.itemsField);
      const items = Array.isArray(itemsRaw) ? itemsRaw : [];

      for (const rec of items) {
        const rs = mapRecord(rec, cfg);
        if (!rs) continue;
        const key = rs.externalRef ?? rs.text;
        if (seen.has(key)) continue;
        seen.add(key);
        signals.push(rs);
      }

      // Cursor pagination: stop when the vendor returns no next cursor.
      // Page-number pagination: stop on a short/empty page.
      if (cfg.nextField) {
        const next = pick(body, cfg.nextField);
        cursor = typeof next === "string" && next ? next : undefined;
        if (!cursor) break;
      } else if (items.length < cfg.pageSize) {
        break;
      }
      if (page < cfg.maxPages) await sleep(cfg.pageDelayMs);
    }

    return {
      source: SOURCE,
      mode: "live",
      signals,
      note: `licensed:${hostOf(cfg.baseUrl)} · ${signals.length} إشارة · ${pages} صفحة`,
    };
  }
}

function hostOf(u: string): string {
  try { return new URL(u).host; } catch { return "vendor"; }
}

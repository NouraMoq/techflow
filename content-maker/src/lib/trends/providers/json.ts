import "server-only";
import type { FetchResult, RawSignal, TrendDataProvider, SignalMetrics } from "../types";

type JsonItem = {
  text?: string; caption?: string; description?: string;
  hashtags?: string[] | string;
  views?: number; likes?: number; shares?: number; comments?: number; accounts?: number;
  postedAt?: string; lang?: string; metrics?: SignalMetrics; externalRef?: string; id?: string;
};

const asTags = (h: JsonItem["hashtags"]): string[] =>
  Array.isArray(h) ? h.map(String) : typeof h === "string" ? h.split(/[ ;|,]+/).filter(Boolean) : [];

// Accepts a JSON array (or {items:[...]}) of signal-like objects, as string or parsed.
export class JsonProvider implements TrendDataProvider {
  readonly source = "json" as const;
  readonly mode = "imported" as const;

  async fetch(payload?: unknown): Promise<FetchResult> {
    let data: unknown = payload;
    if (typeof payload === "string") {
      try { data = JSON.parse(payload); } catch { return { source: this.source, mode: this.mode, signals: [], note: "JSON غير صالح" }; }
    }
    const arr: JsonItem[] = Array.isArray(data)
      ? (data as JsonItem[])
      : Array.isArray((data as { items?: JsonItem[] })?.items)
      ? (data as { items: JsonItem[] }).items
      : [];
    const signals: RawSignal[] = [];
    for (const it of arr) {
      const text = (it.text ?? it.caption ?? it.description ?? "").toString().trim();
      if (!text) continue;
      signals.push({
        text,
        hashtags: asTags(it.hashtags),
        externalRef: it.externalRef ?? (it.id != null ? String(it.id) : undefined),
        lang: it.lang,
        metrics: it.metrics ?? {
          views: it.views, likes: it.likes, shares: it.shares, comments: it.comments,
          accounts: it.accounts, postedAt: it.postedAt,
        },
      });
    }
    return { source: this.source, mode: this.mode, signals, note: `تم استيراد ${signals.length} إشارة من JSON` };
  }
}

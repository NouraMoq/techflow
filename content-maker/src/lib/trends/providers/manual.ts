import "server-only";
import type { FetchResult, RawSignal, TrendDataProvider } from "../types";

// Manual entry: the payload is a single signal typed by the user.
export class ManualProvider implements TrendDataProvider {
  readonly source = "manual" as const;
  readonly mode = "manual" as const;

  async fetch(payload?: unknown): Promise<FetchResult> {
    const p = (payload ?? {}) as Partial<RawSignal>;
    const text = typeof p.text === "string" ? p.text.trim() : "";
    const signals: RawSignal[] = text
      ? [{
          text,
          hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
          metrics: p.metrics ?? {},
          externalRef: typeof p.externalRef === "string" ? p.externalRef : undefined,
        }]
      : [];
    return { source: this.source, mode: this.mode, signals };
  }
}

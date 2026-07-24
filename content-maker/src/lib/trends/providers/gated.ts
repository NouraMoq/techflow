import "server-only";
import type { FetchResult, TrendDataProvider, TrendSource, ProviderMode } from "../types";
import { TrendSourceNotConfiguredError } from "../types";

// Real-source skeletons. Each throws until official credentials/approval exist.
// This mirrors src/lib/integrations/tiktok.ts — no scraping, no unofficial access.
abstract class GatedProvider implements TrendDataProvider {
  abstract readonly source: TrendSource;
  readonly mode: ProviderMode = "live";
  protected abstract configured(): boolean;
  protected assertConfigured() {
    if (!this.configured()) throw new TrendSourceNotConfiguredError(this.source);
  }
  async fetch(): Promise<FetchResult> {
    this.assertConfigured();
    // Real impl: call the official/licensed API and map results to RawSignal[].
    throw new TrendSourceNotConfiguredError(this.source);
  }
}

// Google Trends: kept ONLY as a future integration. Google exposes no general
// official public API today; a limited-access official API exists in Alpha. Do
// not depend on it in the current version — this stays gated/NotConfigured.
// (The licensed provider is the compliant path today — see providers/licensed.ts.)
export class GoogleTrendsProvider extends GatedProvider {
  readonly source = "google_trends" as const;
  protected configured() { return googleTrendsConfigured(); }
}
export class CreativeCenterProvider extends GatedProvider {
  readonly source = "creative_center" as const;
  protected configured() { return creativeCenterConfigured(); }
}
export class OfficialTikTokProvider extends GatedProvider {
  readonly source = "official_tiktok" as const;
  protected configured() { return officialTikTokConfigured(); }
}

export const googleTrendsConfigured = () => Boolean(process.env.GOOGLE_TRENDS_API_KEY);
export const creativeCenterConfigured = () => Boolean(process.env.TIKTOK_CREATIVE_CENTER_TOKEN);
export const officialTikTokConfigured = () =>
  Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);

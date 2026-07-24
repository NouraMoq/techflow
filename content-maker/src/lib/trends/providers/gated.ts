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
export class LicensedProvider extends GatedProvider {
  readonly source = "licensed" as const;
  protected configured() { return licensedConfigured(); }
}

export const googleTrendsConfigured = () => Boolean(process.env.GOOGLE_TRENDS_API_KEY);
export const creativeCenterConfigured = () => Boolean(process.env.TIKTOK_CREATIVE_CENTER_TOKEN);
export const officialTikTokConfigured = () =>
  Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
export const licensedConfigured = () => Boolean(process.env.TREND_LICENSED_API_KEY);

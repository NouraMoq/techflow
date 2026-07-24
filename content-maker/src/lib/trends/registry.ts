import "server-only";
import type { TrendDataProvider, TrendSource } from "./types";
import { ManualProvider } from "./providers/manual";
import { MockProvider } from "./providers/mock";
import { CsvProvider } from "./providers/csv";
import { JsonProvider } from "./providers/json";
import {
  GoogleTrendsProvider, CreativeCenterProvider, OfficialTikTokProvider, LicensedProvider,
  googleTrendsConfigured, creativeCenterConfigured, officialTikTokConfigured, licensedConfigured,
} from "./providers/gated";

/** Factory — the rest of the system asks for a source, never for a concrete class. */
export function getTrendProvider(source: TrendSource): TrendDataProvider {
  switch (source) {
    case "manual": return new ManualProvider();
    case "mock": return new MockProvider();
    case "csv": return new CsvProvider();
    case "json": return new JsonProvider();
    case "google_trends": return new GoogleTrendsProvider();
    case "creative_center": return new CreativeCenterProvider();
    case "official_tiktok": return new OfficialTikTokProvider();
    case "licensed": return new LicensedProvider();
    default: return new ManualProvider();
  }
}

export function isSourceConfigured(source: TrendSource): boolean {
  switch (source) {
    case "manual": case "mock": case "csv": case "json": return true;
    case "google_trends": return googleTrendsConfigured();
    case "creative_center": return creativeCenterConfigured();
    case "official_tiktok": return officialTikTokConfigured();
    case "licensed": return licensedConfigured();
    default: return false;
  }
}

// Metadata for the "اكتشف" tab UI. `planned` = gated skeleton (not live yet).
export const TREND_SOURCES: { key: TrendSource; label: string; planned: boolean; kind: "input" | "import" | "live" }[] = [
  { key: "manual", label: "إدخال يدوي", planned: false, kind: "input" },
  { key: "mock", label: "بيانات تجريبية", planned: false, kind: "input" },
  { key: "csv", label: "استيراد CSV", planned: false, kind: "import" },
  { key: "json", label: "استيراد JSON", planned: false, kind: "import" },
  { key: "google_trends", label: "Google Trends", planned: true, kind: "live" },
  { key: "creative_center", label: "TikTok Creative Center", planned: true, kind: "live" },
  { key: "official_tiktok", label: "TikTok الرسمي", planned: true, kind: "live" },
  { key: "licensed", label: "مزوّد مرخّص", planned: true, kind: "live" },
];

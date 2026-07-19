import type { PublishAdapter, Platform } from "./types";
import { MockTikTokAdapter } from "./mock-tiktok";
import { TikTokAdapter, tiktokLiveConfigured } from "./tiktok";

// ============================================================================
// Adapter registry / factory. Returns the LIVE adapter when credentials exist,
// otherwise the MOCK adapter. Adding a new platform later = register it here;
// the rest of the app is unchanged (Adapter Pattern).
// ============================================================================

export function isLiveConfigured(platform: Platform): boolean {
  switch (platform) {
    case "tiktok":
      return tiktokLiveConfigured();
    default:
      return false; // other platforms are planned (mock-only for now)
  }
}

export function getPublishAdapter(platform: Platform): PublishAdapter {
  switch (platform) {
    case "tiktok":
      return tiktokLiveConfigured() ? new TikTokAdapter() : new MockTikTokAdapter();
    default:
      // Until a platform has its own adapter, fall back to a TikTok-shaped mock
      // so the pipeline works. Real adapters get added per platform.
      return new MockTikTokAdapter();
  }
}

// Platform metadata for the Integration Hub UI.
export const PLATFORMS: { key: Platform; label: string; planned: boolean }[] = [
  { key: "tiktok", label: "TikTok", planned: false },
  { key: "instagram", label: "Instagram", planned: true },
  { key: "youtube", label: "YouTube", planned: true },
  { key: "snapchat", label: "Snapchat", planned: true },
  { key: "x", label: "X", planned: true },
  { key: "linkedin", label: "LinkedIn", planned: true },
];

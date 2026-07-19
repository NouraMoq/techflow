import type {
  PublishAdapter, Platform, AdapterMode, ConnectResult, PublishInput, PublishResult,
} from "./types";

// ============================================================================
// MockTikTokAdapter — a SIMULATED provider used until official TikTok API
// credentials/approvals exist. It performs NO network calls and NEVER touches a
// real TikTok account. Everything it returns is clearly flagged mode: "mock".
// It exists so the whole publish pipeline can be built & tested end-to-end
// without unofficial automation and without asking users for TikTok passwords.
// ============================================================================
export class MockTikTokAdapter implements PublishAdapter {
  readonly platform: Platform = "tiktok";
  readonly mode: AdapterMode = "mock";

  getAuthUrl(state: string): string {
    // A simulated authorize URL (not a real TikTok endpoint).
    return `/integrations/mock-oauth?provider=tiktok&state=${encodeURIComponent(state)}`;
  }

  async connect(): Promise<ConnectResult> {
    // Simulate a successful consent + token exchange.
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60); // ~60d
    return {
      status: "connected",
      mode: "mock",
      accountRef: "@layan.creates (تجريبي)",
      scopes: ["video.publish", "video.list", "user.info.basic"],
      expiresAt,
      note: "اتصال تجريبي (Mock) — لا حساب TikTok حقيقي.",
    };
  }

  async refresh(): Promise<ConnectResult> {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60);
    return { status: "connected", mode: "mock", expiresAt, note: "تم تجديد الرمز (تجريبي)." };
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    // Simulate the platform confirming a publish. In mock mode we DO return a
    // confirmed id — but it is explicitly mode:"mock" so the UI can label it as
    // a simulation and never present it as a real live post.
    if (!input.caption || input.caption.trim().length < 3) {
      return { status: "failed", mode: "mock", error: "الوصف مطلوب قبل النشر." };
    }
    const id = "mock_" + Math.abs(hash(input.caption + (input.scheduledAt?.toISOString() ?? ""))).toString(36);
    return {
      status: "published",
      mode: "mock",
      externalId: id,
      externalUrl: `https://www.tiktok.com/@layan.creates/video/${id}`,
    };
  }
}

// Deterministic small hash (no Math.random — keeps behavior reproducible).
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

import {
  IntegrationNotConfiguredError,
  type PublishAdapter, type Platform, type AdapterMode,
  type ConnectResult, type PublishInput, type PublishResult,
} from "./types";

// ============================================================================
// TikTokAdapter — the REAL adapter skeleton. It is only usable once the app is
// registered with TikTok, the required approvals are granted, and credentials
// are provided via env. Until then every operation throws
// IntegrationNotConfiguredError — we never fake a live integration.
//
// The publish() flow deliberately treats success as ONLY what the official API
// confirms (an HTTP 200 with a published id). Anything else → failed/pending.
// No unofficial automation, no scraping, no account passwords.
// ============================================================================
export class TikTokAdapter implements PublishAdapter {
  readonly platform: Platform = "tiktok";
  readonly mode: AdapterMode = "live";

  private clientKey = process.env.TIKTOK_CLIENT_KEY;
  private clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  private redirectUri = process.env.TIKTOK_REDIRECT_URI;

  private assertConfigured() {
    if (!this.clientKey || !this.clientSecret || !this.redirectUri) {
      throw new IntegrationNotConfiguredError("tiktok");
    }
  }

  getAuthUrl(state: string): string {
    this.assertConfigured();
    // Real TikTok OAuth authorize endpoint + scopes (built here; not called until
    // the app is approved). Scopes must match what TikTok granted the app.
    const params = new URLSearchParams({
      client_key: this.clientKey!,
      response_type: "code",
      scope: "video.publish,video.list,user.info.basic",
      redirect_uri: this.redirectUri!,
      state,
    });
    return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
  }

  async connect(): Promise<ConnectResult> {
    this.assertConfigured();
    // Real impl: exchange the authorization code for tokens, store token via a
    // secret manager (never in plaintext), read granted scopes + expiry.
    throw new IntegrationNotConfiguredError("tiktok");
  }

  async refresh(): Promise<ConnectResult> {
    this.assertConfigured();
    // Real impl: call the refresh-token endpoint; handle expiry → needs_reauth.
    throw new IntegrationNotConfiguredError("tiktok");
  }

  async publish(_input: PublishInput): Promise<PublishResult> {
    this.assertConfigured();
    // Real impl: call the official Content Posting API, poll until the platform
    // returns a CONFIRMED published status + id, then (and only then) return
    // { status: "published", externalId, externalUrl }. On any non-confirmation
    // return { status: "pending" | "failed" } — never claim success early.
    throw new IntegrationNotConfiguredError("tiktok");
  }
}

/** Whether real TikTok credentials are present in the environment. */
export function tiktokLiveConfigured(): boolean {
  return Boolean(
    process.env.TIKTOK_CLIENT_KEY &&
    process.env.TIKTOK_CLIENT_SECRET &&
    process.env.TIKTOK_REDIRECT_URI
  );
}

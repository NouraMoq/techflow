// ============================================================================
// Publish/Integration Adapter contract (Adapter Pattern).
// Every platform (TikTok first; Instagram/YouTube/… later) implements this,
// so the rest of the app never depends on a specific platform's API.
// ============================================================================

export type Platform = "tiktok" | "instagram" | "youtube" | "snapchat" | "x" | "linkedin";

// Integration status state machine (mirrors docs/tiktok-integration-plan-ar.md).
export type IntegrationStatus =
  | "disconnected" | "connected" | "needs_reauth" | "expired" | "error" | "paused";

export type AdapterMode = "mock" | "live";

export interface ConnectResult {
  status: IntegrationStatus;
  mode: AdapterMode;
  accountRef?: string;      // handle/id — never a token
  scopes?: string[];
  expiresAt?: Date | null;
  note?: string;
}

export interface PublishInput {
  caption: string;
  assetRef?: string;        // storage key / reference, not a URL with secrets
  scheduledAt?: Date | null;
}

// A publish is only "published" when the platform CONFIRMS it with an id.
export interface PublishResult {
  status: "published" | "failed" | "pending";
  mode: AdapterMode;
  externalId?: string;      // present ONLY on confirmed success
  externalUrl?: string;
  error?: string;
}

export interface PublishAdapter {
  readonly platform: Platform;
  readonly mode: AdapterMode;
  /** Build the OAuth authorization URL (real adapter) or a simulated one (mock). */
  getAuthUrl(state: string): string;
  /** Complete the connection (mock simulates; live exchanges the code). */
  connect(): Promise<ConnectResult>;
  /** Refresh an expiring token. */
  refresh(): Promise<ConnectResult>;
  /** Publish content. MUST NOT report success unless the API confirms it. */
  publish(input: PublishInput): Promise<PublishResult>;
}

/** Thrown by live adapters when real credentials/approvals are not yet available. */
export class IntegrationNotConfiguredError extends Error {
  constructor(platform: string) {
    super(`Integration for "${platform}" is not configured (missing credentials/approval).`);
    this.name = "IntegrationNotConfiguredError";
  }
}

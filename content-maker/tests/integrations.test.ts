import { describe, it, expect } from "vitest";
import { getPublishAdapter, isLiveConfigured } from "../src/lib/integrations/registry";
import { MockTikTokAdapter } from "../src/lib/integrations/mock-tiktok";
import { TikTokAdapter } from "../src/lib/integrations/tiktok";
import { IntegrationNotConfiguredError } from "../src/lib/integrations/types";

describe("Integration adapter layer", () => {
  it("falls back to the mock adapter when no live credentials", () => {
    expect(isLiveConfigured("tiktok")).toBe(false);
    expect(getPublishAdapter("tiktok")).toBeInstanceOf(MockTikTokAdapter);
  });

  it("mock connect returns a connected, mock-flagged result (no real account)", async () => {
    const r = await new MockTikTokAdapter().connect();
    expect(r.status).toBe("connected");
    expect(r.mode).toBe("mock");
    expect(r.scopes).toContain("video.publish");
  });

  it("mock publish confirms with an external id (clearly mock)", async () => {
    const r = await new MockTikTokAdapter().publish({ caption: "منشور تجريبي" });
    expect(r.status).toBe("published");
    expect(r.mode).toBe("mock");
    expect(r.externalId).toBeTruthy();
    expect(r.externalUrl).toContain("tiktok.com");
  });

  it("mock publish refuses an empty caption (never a false success)", async () => {
    const r = await new MockTikTokAdapter().publish({ caption: "" });
    expect(r.status).toBe("failed");
    expect(r.externalId).toBeUndefined();
  });

  it("live TikTok adapter throws until configured — never fakes success", async () => {
    const live = new TikTokAdapter();
    await expect(live.publish({ caption: "x" })).rejects.toBeInstanceOf(IntegrationNotConfiguredError);
    await expect(live.connect()).rejects.toBeInstanceOf(IntegrationNotConfiguredError);
  });
});

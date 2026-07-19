"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, assertCan } from "@/lib/session";
import { getPublishAdapter, isLiveConfigured } from "@/lib/integrations/registry";
import type { Platform, IntegrationStatus } from "@/lib/integrations/types";

const PLATFORMS = ["tiktok", "instagram", "youtube", "snapchat", "x", "linkedin"] as const;
const connectSchema = z.object({ provider: z.enum(PLATFORMS) });

// Connect (or re-connect) a platform. Uses the configured adapter — mock unless
// real credentials exist. Stores ONLY a token reference, never a raw token.
export async function connectIntegration(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "content.publish"); } catch { return; }
  const parsed = connectSchema.safeParse({ provider: formData.get("provider") });
  if (!parsed.success) return;
  const provider = parsed.data.provider as Platform;

  const adapter = getPublishAdapter(provider);
  let result;
  try {
    result = await adapter.connect();
  } catch {
    // Live adapter not configured yet → record a clear "needs_reauth" state.
    await upsertIntegration(s.tid, provider, "needs_reauth", isLiveConfigured(provider) ? "live" : "mock",
      "التكامل المباشر غير مهيأ بعد — يتطلب تسجيل التطبيق وموافقات TikTok.");
    await audit(s, "integration.connect_failed", provider);
    revalidatePath("/integrations");
    return;
  }

  const integration = await upsertIntegration(s.tid, provider, result.status, result.mode, result.note ?? null);
  await prisma.oAuthConnection.upsert({
    where: { integrationId: integration.id },
    create: {
      integrationId: integration.id, accountRef: result.accountRef ?? null,
      scopesJson: JSON.stringify(result.scopes ?? []),
      tokenRef: "secret://vault/tiktok/" + s.tid, // reference only — NEVER a raw token
      expiresAt: result.expiresAt ?? null,
    },
    update: {
      accountRef: result.accountRef ?? null,
      scopesJson: JSON.stringify(result.scopes ?? []),
      expiresAt: result.expiresAt ?? null,
    },
  });
  await audit(s, "integration.connect", provider);
  revalidatePath("/integrations");
}

const statusSchema = z.object({
  provider: z.enum(PLATFORMS),
  status: z.enum(["disconnected", "connected", "needs_reauth", "expired", "error", "paused"]),
});

// Manually move an integration through its state machine (pause / reauth / disconnect).
export async function setIntegrationStatus(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "content.publish"); } catch { return; }
  const parsed = statusSchema.safeParse({ provider: formData.get("provider"), status: formData.get("status") });
  if (!parsed.success) return;
  await prisma.integration.updateMany({
    where: { tenantId: s.tid, provider: parsed.data.provider },
    data: { status: parsed.data.status },
  });
  await audit(s, "integration.status", parsed.data.provider, { status: parsed.data.status });
  revalidatePath("/integrations");
}

async function upsertIntegration(
  tenantId: string, provider: string, status: IntegrationStatus, mode: string, note: string | null
) {
  return prisma.integration.upsert({
    where: { tenantId_provider: { tenantId, provider } },
    create: { tenantId, provider, status, mode, note },
    update: { status, mode, note },
  });
}

async function audit(s: { tid: string; uid: string }, action: string, provider: string, meta?: object) {
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action, entity: "Integration", entityId: provider, metaJson: meta ? JSON.stringify(meta) : null },
  });
}

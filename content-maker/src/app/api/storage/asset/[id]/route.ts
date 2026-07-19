import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage/registry";

export const runtime = "nodejs";

// Authenticated, tenant-scoped access point for an asset. Resolves a short-lived
// signed URL (S3 presigned GET, or the Local signed-download route) and redirects
// to it — so the client never sees keys/credentials, only a time-limited link.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return new NextResponse("Unauthorized", { status: 401 });
  if (!can(s.role, "analytics.view")) return new NextResponse("Forbidden", { status: 403 });

  const asset = await prisma.asset.findFirst({
    where: { id: params.id, tenantId: s.tid, deletedAt: null },
  });
  if (!asset || !asset.storageKey || !asset.uploaded) {
    return new NextResponse("Not found or no file stored", { status: 404 });
  }

  const url = await getStorage().getSignedUrl(asset.storageKey, 300);
  return NextResponse.redirect(new URL(url, _req.url), 302);
}

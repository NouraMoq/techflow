import { NextResponse } from "next/server";
import { verifyStorageToken } from "@/lib/storage/token";
import { LocalStorageAdapter } from "@/lib/storage/local";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Serves a Local-provider object for a valid, unexpired signed token (the token
// IS the capability — same model as an S3 presigned URL). Used only in local mode.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const key = await verifyStorageToken(token);
  if (!key) return new NextResponse("Invalid or expired link", { status: 403 });

  // Look up asset metadata (content type / name) for correct headers.
  const asset = await prisma.asset.findFirst({ where: { storageKey: key } });
  let bytes: Buffer;
  try {
    bytes = await new LocalStorageAdapter().read(key);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": asset?.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(asset?.name || "file")}"`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}

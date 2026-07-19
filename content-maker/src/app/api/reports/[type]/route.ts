import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { getReport, toCsv, isReportType } from "@/lib/reports";

// GET /api/reports/:type  → tenant-scoped CSV download.
export async function GET(_req: Request, { params }: { params: { type: string } }) {
  const s = await getSession();
  if (!s) return new NextResponse("Unauthorized", { status: 401 });
  if (!can(s.role, "report.export")) return new NextResponse("Forbidden", { status: 403 });
  if (!isReportType(params.type)) return new NextResponse("Not found", { status: 404 });

  const report = await getReport(s.tid, params.type); // scoped to the session tenant
  const csv = toCsv(report);
  const filename = `report-${params.type}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

import Link from "next/link";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { WORKFLOW_STAGES } from "@/lib/constants";
import { dateAr, sar } from "@/lib/commerce";
import {
  IconCheck, IconCamera, IconCalendar, IconAlert, IconBulb, IconChart, IconHandshake,
} from "@/components/icons";
import { decideApproval } from "../../(app)/approvals/actions";
import QuickIdea from "./QuickIdea";

export default async function PortalPage() {
  const s = await requireSession();
  const tenantId = s.tid;

  const [approvals, shoot, upcoming, scheduledCount, productionCount, activeCampaigns, contract, openTasks, overdueInvoices] =
    await Promise.all([
      prisma.approval.findMany({ where: { tenantId, status: "pending" }, orderBy: { createdAt: "desc" }, take: 3 }),
      prisma.shootSession.findFirst({ where: { tenantId, deletedAt: null, status: { in: ["confirmed", "planned", "in_progress"] } }, orderBy: { date: "asc" } }),
      prisma.contentProject.findMany({ where: { tenantId, deletedAt: null, status: { in: ["scheduled", "approved", "production"] } }, orderBy: { dueDate: "asc" }, take: 4 }),
      prisma.contentProject.count({ where: { tenantId, deletedAt: null, status: "scheduled" } }),
      prisma.contentProject.count({ where: { tenantId, deletedAt: null, status: "production" } }),
      prisma.campaign.count({ where: { tenantId, deletedAt: null, status: { in: ["planning", "in_production", "live"] } } }),
      prisma.contract.findFirst({ where: { tenantId, deletedAt: null }, include: { brand: true }, orderBy: { endDate: "asc" } }),
      prisma.task.count({ where: { tenantId, done: false } }),
      prisma.invoice.count({ where: { tenantId, status: "overdue" } }),
    ]);

  const mayApprove = can(s.role, "content.approve");
  const first = s.name.split(" ")[0];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>مرحبًا، {first} 👋</h1>
        <p className="muted" style={{ fontSize: 13.5, margin: "4px 0 0" }}>كل ما يحتاج انتباهك اليوم في مكان واحد.</p>
      </div>

      {/* Needs your approval */}
      <div className="p-card">
        <h2>{icon(<IconCheck />, "var(--amber)")} يحتاج موافقتك
          {approvals.length > 0 && <span className="badge b-rose" style={{ marginInlineStart: "auto" }}>{approvals.length}</span>}
        </h2>
        {approvals.length === 0 && <div className="faint" style={{ fontSize: 13 }}>لا شيء بانتظار موافقتك الآن ✓</div>}
        {approvals.map((a) => (
          <div className="p-approve" key={a.id}>
            <div className="row between" style={{ marginBottom: 8 }}>
              <b style={{ fontSize: 14 }}>{a.title}</b>
              <span className="badge b-slate">{a.version}</span>
            </div>
            {mayApprove ? (
              <div className="row" style={{ gap: 8 }}>
                <form action={decideApproval} style={{ flex: 1 }}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="decision" value="approved" />
                  <button className="btn btn-primary" style={{ width: "100%" }}>اعتماد</button>
                </form>
                <form action={decideApproval} style={{ flex: 1 }}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="decision" value="changes_requested" />
                  <button className="btn btn-ghost" style={{ width: "100%" }}>طلب تعديل</button>
                </form>
              </div>
            ) : <div className="faint" style={{ fontSize: 12.5 }}>بانتظار المعتمد النهائي</div>}
          </div>
        ))}
      </div>

      {/* Today's shoot */}
      {shoot && (
        <div className="p-card">
          <h2>{icon(<IconCamera />, "#0e7490")} تصوير قادم</h2>
          <b style={{ fontSize: 15 }}>{shoot.name}</b>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{dateAr(shoot.date)}{shoot.location ? ` · ${shoot.location}` : ""}</div>
        </div>
      )}

      {/* Week plan */}
      <div className="p-card">
        <h2>{icon(<IconCalendar />, "var(--primary-ink)")} خطة الأسبوع</h2>
        <div className="grid g-3" style={{ gap: 10 }}>
          <div className="p-metric"><b>{upcoming.length}</b><span>محتوى قادم</span></div>
          <div className="p-metric"><b>{productionCount}</b><span>قيد الإنتاج</span></div>
          <div className="p-metric"><b>{activeCampaigns}</b><span>حملة نشطة</span></div>
        </div>
      </div>

      {/* Upcoming content */}
      {upcoming.length > 0 && (
        <div className="p-card">
          <h2>{icon(<IconBulb />, "var(--primary-ink)")} المحتوى القادم</h2>
          {upcoming.map((p) => (
            <div className="row between" key={p.id} style={{ padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
              <b style={{ fontSize: 13.5 }}>{p.title}</b>
              <span className="faint" style={{ fontSize: 12 }}>{WORKFLOW_STAGES[p.stageIndex]} · {dateAr(p.dueDate)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Key metrics (demo) */}
      <div className="p-card">
        <h2>{icon(<IconChart />, "var(--green)")} مؤشراتك</h2>
        <div className="grid g-3" style={{ gap: 10 }}>
          <div className="p-metric"><b>4.8M</b><span>مشاهدات</span></div>
          <div className="p-metric"><b>+34K</b><span>متابعون جدد</span></div>
          <div className="p-metric"><b>7.8%</b><span>تفاعل</span></div>
        </div>
        <div className="faint" style={{ fontSize: 11, textAlign: "center", marginTop: 8 }}>بيانات تجريبية</div>
      </div>

      {/* Important contract/opportunity */}
      {contract && (
        <div className="p-card">
          <h2>{icon(<IconHandshake />, "var(--violet)")} فرصة/عقد مهم</h2>
          <div className="row between">
            <b style={{ fontSize: 14 }}>{contract.brand?.name ?? "عقد"}</b>
            <span className="tnum" style={{ fontWeight: 800 }}>{sar(contract.value)}</span>
          </div>
          <div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>حتى {dateAr(contract.endDate)} · {contract.exclusivity ?? ""}</div>
        </div>
      )}

      {/* Alerts */}
      {(openTasks > 0 || overdueInvoices > 0) && (
        <div className="p-card" style={{ background: "var(--amber-tint)", border: "none" }}>
          <h2>{icon(<IconAlert />, "var(--amber)")} تنبيهات</h2>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>
            {openTasks > 0 && <div>• {openTasks} مهمة قيد التنفيذ في الفريق</div>}
            {overdueInvoices > 0 && <div>• {overdueInvoices} فاتورة متأخرة تحتاج متابعة</div>}
          </div>
        </div>
      )}

      {/* Quick idea capture */}
      <div className="p-card">
        <h2>{icon(<IconBulb />, "var(--primary-ink)")} سجّل فكرة سريعة</h2>
        {can(s.role, "idea.create") ? <QuickIdea /> : <div className="faint" style={{ fontSize: 13 }}>ليست لديك صلاحية إضافة فكرة.</div>}
      </div>

      <div style={{ textAlign: "center", marginTop: 10 }}>
        <Link href="/dashboard" className="faint" style={{ fontSize: 13, fontWeight: 700 }}>الانتقال إلى اللوحة الكاملة →</Link>
      </div>
    </>
  );
}

function icon(node: React.ReactNode, color: string) {
  return <span style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: color + "1a", color }}>{node}</span>;
}

import "server-only";
import { prisma } from "./db";
import { WORKFLOW_STAGES, ideaStatusLabel } from "./constants";
import { SHOOT_STATUS } from "./production";
import { CONTRACT_TYPE_LABEL, PAYMENT_STATUS, INVOICE_STATUS, OBLIGATION_LABEL, dateAr } from "./commerce";
import { ROLE_LABELS, type RoleKey } from "./rbac";

// ============================================================================
// Reports layer. getReport() returns a structured, tenant-scoped ReportData
// used by BOTH the printable HTML view and the CSV export route (single source
// of truth). All data is real; demo-only fields are labeled.
// ============================================================================
export type ReportTable = { heading: string; columns: string[]; rows: (string | number)[][] };
export type ReportData = {
  key: string;
  title: string;
  subtitle?: string;
  kpis?: { label: string; value: string }[];
  tables: ReportTable[];
  note?: string;
};

export const REPORT_TYPES: { key: string; title: string; desc: string }[] = [
  { key: "executive", title: "تقرير تنفيذي للمشهور", desc: "ملخّص مؤشرات ومحتوى وتجارة في صفحة واحدة" },
  { key: "content", title: "تقرير المحتوى", desc: "مشاريع المحتوى ومراحلها وحالاتها" },
  { key: "pillars", title: "تقرير أعمدة المحتوى", desc: "توزيع الأعمدة ومؤشراتها والتوازن" },
  { key: "team", title: "تقرير الفريق والإنتاجية", desc: "الفريق وحالات المهام" },
  { key: "contracts", title: "تقرير العقود والالتزامات", desc: "العقود، الالتزامات، والفواتير" },
  { key: "revenue", title: "تقرير الإيرادات والمدفوعات", desc: "الفواتير والمدفوعات والإجماليات" },
  { key: "compliance", title: "تقرير الامتثال", desc: "مراجعات الامتثال وحالاتها" },
];

export const isReportType = (t: string) => REPORT_TYPES.some((r) => r.key === t);
export const reportTitle = (t: string) => REPORT_TYPES.find((r) => r.key === t)?.title ?? t;

const num = (n: number) => n.toLocaleString("ar-EG");
const sar = (n: number) => num(n) + " ر.س";

export async function getReport(tenantId: string, type: string): Promise<ReportData> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const creator = await prisma.creator.findFirst({ where: { tenantId, deletedAt: null } });
  const subtitle = `${creator?.name ?? tenant?.name ?? ""} — ${tenant?.name ?? ""}`;

  switch (type) {
    case "content": return contentReport(tenantId, subtitle);
    case "pillars": return pillarsReport(tenantId, subtitle);
    case "team": return teamReport(tenantId, subtitle);
    case "contracts": return contractsReport(tenantId, subtitle);
    case "revenue": return revenueReport(tenantId, subtitle);
    case "compliance": return complianceReport(tenantId, subtitle);
    case "executive":
    default: return executiveReport(tenantId, subtitle);
  }
}

async function executiveReport(tenantId: string, subtitle: string): Promise<ReportData> {
  const [ideas, projects, published, pendingApprovals, campaigns, contracts, invoices] = await Promise.all([
    prisma.idea.count({ where: { tenantId, deletedAt: null } }),
    prisma.contentProject.count({ where: { tenantId, deletedAt: null } }),
    prisma.publishJob.count({ where: { tenantId, status: "published" } }),
    prisma.approval.count({ where: { tenantId, status: "pending" } }),
    prisma.campaign.count({ where: { tenantId, deletedAt: null } }),
    prisma.contract.findMany({ where: { tenantId, deletedAt: null } }),
    prisma.invoice.findMany({ where: { tenantId } }),
  ]);
  const contractValue = contracts.reduce((s, c) => s + c.value, 0);
  const collected = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  return {
    key: "executive", title: "تقرير تنفيذي للمشهور", subtitle,
    kpis: [
      { label: "الأفكار", value: num(ideas) },
      { label: "مشاريع المحتوى", value: num(projects) },
      { label: "منشورات مؤكَّدة", value: num(published) },
      { label: "بانتظار الموافقة", value: num(pendingApprovals) },
      { label: "حملات تجارية", value: num(campaigns) },
      { label: "قيمة العقود", value: sar(contractValue) },
    ],
    tables: [{
      heading: "لمحة تجارية",
      columns: ["المؤشر", "القيمة"],
      rows: [
        ["إجمالي قيمة العقود", sar(contractValue)],
        ["المحصّل من الفواتير", sar(collected)],
        ["عدد العقود", num(contracts.length)],
        ["عدد الفواتير", num(invoices.length)],
      ],
    }],
    note: "المؤشرات الإعلامية (مشاهدات/تفاعل) تجريبية في هذه النسخة؛ التجارية فعلية من قاعدة البيانات.",
  };
}

async function contentReport(tenantId: string, subtitle: string): Promise<ReportData> {
  const projects = await prisma.contentProject.findMany({
    where: { tenantId, deletedAt: null }, orderBy: { dueDate: "asc" },
  });
  return {
    key: "content", title: "تقرير المحتوى", subtitle,
    kpis: [
      { label: "إجمالي المشاريع", value: num(projects.length) },
      { label: "قيد الإنتاج", value: num(projects.filter((p) => p.status === "production").length) },
      { label: "مجدولة", value: num(projects.filter((p) => p.status === "scheduled").length) },
    ],
    tables: [{
      heading: "مشاريع المحتوى",
      columns: ["المشروع", "المرحلة", "المسؤول", "الاستحقاق", "الحالة"],
      rows: projects.map((p) => [p.title, `${p.stageIndex + 1}. ${WORKFLOW_STAGES[p.stageIndex]}`, p.ownerName ?? "—", dateAr(p.dueDate), ideaStatusLabel(p.status)]),
    }],
  };
}

async function pillarsReport(tenantId: string, subtitle: string): Promise<ReportData> {
  const pillars = await prisma.contentPillar.findMany({ where: { tenantId }, orderBy: { targetPct: "desc" } });
  const total = pillars.reduce((s, p) => s + p.targetPct, 0);
  return {
    key: "pillars", title: "تقرير أعمدة المحتوى", subtitle,
    kpis: [
      { label: "عدد الأعمدة", value: num(pillars.length) },
      { label: "مجموع النسب", value: `${total}%` },
      { label: "التوازن", value: total === 100 ? "متوازن" : "غير متوازن" },
    ],
    tables: [{
      heading: "الأعمدة",
      columns: ["العمود", "النسبة المستهدفة", "المؤشر"],
      rows: pillars.map((p) => [p.name, `${p.targetPct}%`, p.kpi ?? "—"]),
    }],
  };
}

async function teamReport(tenantId: string, subtitle: string): Promise<ReportData> {
  const [memberships, tasks] = await Promise.all([
    prisma.membership.findMany({ where: { tenantId, scope: "client" }, include: { user: true } }),
    prisma.task.findMany({ where: { tenantId } }),
  ]);
  const byStatus = (st: string) => tasks.filter((t) => t.status === st).length;
  return {
    key: "team", title: "تقرير الفريق والإنتاجية", subtitle,
    kpis: [
      { label: "أعضاء الفريق", value: num(memberships.length) },
      { label: "مهام قيد التنفيذ", value: num(byStatus("in_progress")) },
      { label: "مهام مكتملة", value: num(tasks.filter((t) => t.done).length) },
    ],
    tables: [
      { heading: "الفريق", columns: ["العضو", "الدور"], rows: memberships.map((m) => [m.user.name, ROLE_LABELS[m.role as RoleKey] ?? m.role]) },
      { heading: "حالة المهام", columns: ["الحالة", "العدد"], rows: [["قيد التنفيذ", num(byStatus("in_progress"))], ["بانتظار المراجعة", num(byStatus("review"))], ["لم تبدأ", num(byStatus("todo"))], ["مكتملة", num(tasks.filter((t) => t.done).length)]] },
    ],
  };
}

async function contractsReport(tenantId: string, subtitle: string): Promise<ReportData> {
  const [contracts, obligations, invoices] = await Promise.all([
    prisma.contract.findMany({ where: { tenantId, deletedAt: null }, include: { brand: true } }),
    prisma.contractObligation.findMany({ where: { contract: { tenantId } }, include: { contract: { include: { brand: true } } } }),
    prisma.invoice.findMany({ where: { tenantId } }),
  ]);
  return {
    key: "contracts", title: "تقرير العقود والالتزامات", subtitle,
    kpis: [
      { label: "العقود", value: num(contracts.length) },
      { label: "الالتزامات", value: num(obligations.length) },
      { label: "قيمة العقود", value: sar(contracts.reduce((s, c) => s + c.value, 0)) },
    ],
    tables: [
      { heading: "العقود", columns: ["العلامة", "النوع", "القيمة", "المدة", "الدفع"], rows: contracts.map((c) => [c.brand?.name ?? "—", CONTRACT_TYPE_LABEL[c.type] ?? c.type, sar(c.value), `${dateAr(c.startDate)} - ${dateAr(c.endDate)}`, (PAYMENT_STATUS[c.paymentStatus] ?? PAYMENT_STATUS.pending).label]) },
      { heading: "الالتزامات", columns: ["النوع", "العنوان", "العلامة", "الاستحقاق", "الحالة"], rows: obligations.map((o) => [OBLIGATION_LABEL[o.type] ?? o.type, o.title, o.contract.brand?.name ?? "—", dateAr(o.dueDate), o.status]) },
      { heading: "الفواتير", columns: ["الرقم", "العلامة", "المبلغ", "الاستحقاق", "الحالة"], rows: invoices.map((i) => [i.number, i.brandName ?? "—", sar(i.amount), dateAr(i.dueDate), (INVOICE_STATUS[i.status] ?? INVOICE_STATUS.due).label]) },
    ],
  };
}

async function revenueReport(tenantId: string, subtitle: string): Promise<ReportData> {
  const invoices = await prisma.invoice.findMany({ where: { tenantId }, include: { payments: true } });
  const totalBilled = invoices.reduce((s, i) => s + i.amount, 0);
  const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  return {
    key: "revenue", title: "تقرير الإيرادات والمدفوعات", subtitle,
    kpis: [
      { label: "إجمالي الفواتير", value: sar(totalBilled) },
      { label: "المحصّل", value: sar(paid) },
      { label: "المتأخر", value: sar(overdue) },
    ],
    tables: [{
      heading: "الفواتير",
      columns: ["الرقم", "العلامة", "المبلغ", "مدفوعات", "الاستحقاق", "الحالة"],
      rows: invoices.map((i) => [i.number, i.brandName ?? "—", sar(i.amount), sar(i.payments.reduce((s, p) => s + p.amount, 0)), dateAr(i.dueDate), (INVOICE_STATUS[i.status] ?? INVOICE_STATUS.due).label]),
    }],
  };
}

async function complianceReport(tenantId: string, subtitle: string): Promise<ReportData> {
  const reviews = await prisma.complianceReview.findMany({ where: { tenantId, deletedAt: null }, orderBy: { createdAt: "desc" } });
  return {
    key: "compliance", title: "تقرير الامتثال", subtitle,
    kpis: [
      { label: "المراجعات", value: num(reviews.length) },
      { label: "مطابقة", value: num(reviews.filter((r) => r.status === "passed").length) },
      { label: "تحتاج معالجة", value: num(reviews.filter((r) => r.status === "failed").length) },
    ],
    tables: [{
      heading: "مراجعات الامتثال",
      columns: ["المحتوى", "الحالة", "المراجع", "التاريخ"],
      rows: reviews.map((r) => [r.subject, r.status === "passed" ? "مطابق" : r.status === "failed" ? "يحتاج معالجة" : "قيد المراجعة", r.reviewedBy ?? "—", dateAr(r.createdAt)]),
    }],
    note: "تنبيه: المراجعة النظامية/القانونية النهائية يجب أن ينفذها مختص مرخّص.",
  };
}

// ---- CSV serialization (Excel-friendly: UTF-8 BOM + escaped cells) --------
export function toCsv(report: ReportData): string {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines: string[] = [report.title, report.subtitle ?? "", ""];
  if (report.kpis?.length) {
    lines.push("المؤشرات");
    report.kpis.forEach((k) => lines.push(`${esc(k.label)},${esc(k.value)}`));
    lines.push("");
  }
  for (const t of report.tables) {
    lines.push(esc(t.heading));
    lines.push(t.columns.map(esc).join(","));
    t.rows.forEach((r) => lines.push(r.map(esc).join(",")));
    lines.push("");
  }
  if (report.note) lines.push(esc(report.note));
  return "﻿" + lines.join("\r\n"); // BOM so Excel renders Arabic correctly
}

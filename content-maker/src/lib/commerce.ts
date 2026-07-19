// Shared labels/helpers for the commercial modules (Arabic UI strings).

export const OPPORTUNITY_STAGES: { key: string; label: string }[] = [
  { key: "lead", label: "فرصة محتملة" },
  { key: "contacted", label: "تواصل أولي" },
  { key: "brief", label: "استلام Brief" },
  { key: "pricing", label: "تسعير" },
  { key: "negotiation", label: "تفاوض" },
  { key: "contract", label: "عقد" },
  { key: "production", label: "إنتاج" },
  { key: "published", label: "منشور" },
  { key: "invoice", label: "فاتورة" },
  { key: "collected", label: "محصّل" },
];
export const opportunityStageLabel = (k: string) =>
  OPPORTUNITY_STAGES.find((s) => s.key === k)?.label ?? k;
export function nextOpportunityStage(current: string): string {
  const i = OPPORTUNITY_STAGES.findIndex((s) => s.key === current);
  return i < 0 || i >= OPPORTUNITY_STAGES.length - 1 ? current : OPPORTUNITY_STAGES[i + 1].key;
}

export const CONTRACT_TYPE_LABEL: Record<string, string> = {
  ad_collab: "تعاون إعلاني", seasonal: "حملة موسمية", ambassador: "سفير علامة", ugc: "محتوى UGC",
};
export const PAYMENT_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "بانتظار", cls: "b-slate" },
  partial: { label: "مدفوع جزئيًا", cls: "b-amber" },
  paid: { label: "مدفوع", cls: "b-green" },
  overdue: { label: "متأخر", cls: "b-rose" },
};
export const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "مسودة", cls: "b-slate" },
  due: { label: "مستحقة", cls: "b-amber" },
  paid: { label: "مدفوعة", cls: "b-green" },
  overdue: { label: "متأخرة", cls: "b-rose" },
  cancelled: { label: "ملغاة", cls: "b-slate" },
};
export const OBLIGATION_LABEL: Record<string, string> = {
  exclusivity_end: "انتهاء الحصرية", usage_rights_end: "انتهاء حقوق الاستخدام",
  post_duration: "بقاء المنشور", delivery: "تسليم", invoice: "فاتورة", payment: "دفعة",
};

export const ASSET_TYPE_LABEL: Record<string, string> = {
  raw_video: "فيديو خام", final_video: "فيديو نهائي", image: "صورة", logo: "هوية",
  music: "موسيقى", contract: "عقد", thumbnail: "صورة مصغرة", subtitle: "ترجمة", template: "قالب",
};

export const sar = (n: number) => n.toLocaleString("ar-EG") + " ر.س";
export const dateAr = (d: Date | null) => (d ? new Date(d).toLocaleDateString("ar-SA") : "—");

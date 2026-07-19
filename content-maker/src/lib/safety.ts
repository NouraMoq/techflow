// Shared labels/helpers for compliance & crisis modules (Arabic UI strings).

export const COMPLIANCE_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "قيد المراجعة", cls: "b-slate" },
  passed: { label: "مطابق", cls: "b-green" },
  failed: { label: "يحتاج معالجة", cls: "b-rose" },
};

export const ANSWER_OPTIONS: { value: string; label: string }[] = [
  { value: "yes", label: "نعم" },
  { value: "no", label: "لا" },
  { value: "na", label: "لا ينطبق" },
];

// A checklist answer is "ok" when it is not an unresolved "no".
export const answerOk = (a: string) => a === "yes" || a === "na";

export const SEVERITY: Record<string, { label: string; cls: string }> = {
  low: { label: "منخفضة", cls: "b-slate" },
  medium: { label: "متوسطة", cls: "b-amber" },
  high: { label: "مرتفعة", cls: "b-rose" },
  critical: { label: "حرجة", cls: "b-rose" },
};

export const CRISIS_STATUS: { key: string; label: string; cls: string }[] = [
  { key: "open", label: "مفتوحة", cls: "b-amber" },
  { key: "in_progress", label: "قيد المعالجة", cls: "b-primary" },
  { key: "contained", label: "تحت السيطرة", cls: "b-accent" },
  { key: "resolved", label: "منتهية", cls: "b-green" },
  { key: "closed", label: "مغلقة", cls: "b-slate" },
];
export const crisisStatusMeta = (k: string) =>
  CRISIS_STATUS.find((s) => s.key === k) ?? CRISIS_STATUS[0];
export function nextCrisisStatus(current: string): string {
  const order = CRISIS_STATUS.map((s) => s.key);
  const i = order.indexOf(current);
  return i < 0 || i >= order.length - 1 ? current : order[i + 1];
}

export const APPROVAL_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "مسودة", cls: "b-slate" },
  pending: { label: "بانتظار الاعتماد", cls: "b-amber" },
  approved: { label: "معتمد للرد", cls: "b-green" },
  published: { label: "نُشر الرد", cls: "b-primary" },
};

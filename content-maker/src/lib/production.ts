// Shared labels for shoot sessions + trend radar (Arabic UI strings).

export const SHOOT_STATUS: { key: string; label: string; cls: string }[] = [
  { key: "draft", label: "مسودة", cls: "b-slate" },
  { key: "planned", label: "مخطّطة", cls: "b-amber" },
  { key: "confirmed", label: "مؤكّدة", cls: "b-primary" },
  { key: "in_progress", label: "جارية", cls: "b-accent" },
  { key: "done", label: "منتهية", cls: "b-green" },
  { key: "cancelled", label: "ملغاة", cls: "b-rose" },
];
export const shootStatusMeta = (k: string) => SHOOT_STATUS.find((s) => s.key === k) ?? SHOOT_STATUS[0];
export function nextShootStatus(current: string): string {
  const flow = ["draft", "planned", "confirmed", "in_progress", "done"];
  const i = flow.indexOf(current);
  return i < 0 || i >= flow.length - 1 ? current : flow[i + 1];
}

export const SHOT_STATUS: Record<string, { label: string; cls: string }> = {
  todo: { label: "بانتظار التصوير", cls: "b-slate" },
  shot: { label: "تم التصوير", cls: "b-primary" },
  approved: { label: "معتمد", cls: "b-green" },
  reshoot: { label: "إعادة تصوير", cls: "b-amber" },
};

export const TREND_DECISION: Record<string, { label: string; cls: string }> = {
  studying: { label: "قيد الدراسة", cls: "b-amber" },
  use: { label: "قرار: استخدام", cls: "b-green" },
  ignore: { label: "قرار: تجاهل", cls: "b-slate" },
  used: { label: "مُستخدَم", cls: "b-primary" },
};

export const FIT_LABEL: Record<string, string> = { high: "مرتفعة", medium: "متوسطة", low: "منخفضة" };
export const RISK_LABEL: Record<string, string> = { low: "منخفضة", medium: "متوسطة", high: "مرتفعة" };
export const TREND_TYPE_LABEL: Record<string, string> = {
  sound: "صوت", effect: "تأثير بصري", challenge: "تحدٍّ", format: "صيغة",
};

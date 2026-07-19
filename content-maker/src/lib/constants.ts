// Shared domain constants (used by seed + UI). UI strings in Arabic.

export const WORKFLOW_STAGES = [
  "فكرة", "بحث", "كتابة السيناريو", "مراجعة المحتوى", "اعتماد صانع المحتوى",
  "تجهيز التصوير", "تصوير", "رفع المواد الخام", "مونتاج أولي", "مراجعة المونتاج",
  "تعديلات", "اعتماد نهائي", "تجهيز الوصف والهاشتاقات", "جدولة", "نشر",
  "إدخال النتائج", "تحليل", "إعادة استخدام المحتوى",
] as const;

export const IDEA_STATUSES: { key: string; label: string; color: string }[] = [
  { key: "draft", label: "مسودة", color: "#64748b" },
  { key: "research", label: "تحتاج بحثًا", color: "#b45309" },
  { key: "proposed", label: "مقترحة", color: "#06b6d4" },
  { key: "approved", label: "معتمدة", color: "#4f46e5" },
  { key: "scripting", label: "كتابة السيناريو", color: "#7c3aed" },
  { key: "scheduled", label: "مجدولة", color: "#0e7490" },
  { key: "production", label: "قيد الإنتاج", color: "#b45309" },
  { key: "published", label: "منشورة", color: "#15803d" },
];

export const ideaStatusLabel = (key: string) =>
  IDEA_STATUSES.find((s) => s.key === key)?.label ?? key;
export const ideaStatusColor = (key: string) =>
  IDEA_STATUSES.find((s) => s.key === key)?.color ?? "#64748b";

export const PRIORITY_LABELS: Record<string, string> = {
  high: "عالية", medium: "متوسطة", low: "منخفضة",
};

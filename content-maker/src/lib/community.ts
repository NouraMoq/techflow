// Shared labels for audience & recommendations (Arabic UI strings).

export const QUESTION_CATEGORY: Record<string, { label: string; cls: string }> = {
  faq: { label: "سؤال متكرر", cls: "b-slate" },
  content_opportunity: { label: "فرصة محتوى", cls: "b-primary" },
  potential_ad: { label: "إعلان محتمل", cls: "b-amber" },
  escalation: { label: "تصعيد", cls: "b-rose" },
};

export const QUESTION_STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "جديد", cls: "b-amber" },
  answered: { label: "تمت الإجابة", cls: "b-green" },
  converted: { label: "حُوّل لفكرة", cls: "b-primary" },
  escalated: { label: "مُصعّد", cls: "b-rose" },
};

export const CONFIDENCE: Record<string, { label: string; cls: string }> = {
  high: { label: "ثقة عالية", cls: "b-green" },
  medium: { label: "ثقة متوسطة", cls: "b-amber" },
  low: { label: "ثقة منخفضة", cls: "b-slate" },
};

export const REC_STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: "مفتوحة", cls: "b-amber" },
  applied: { label: "نُفّذت", cls: "b-green" },
  dismissed: { label: "مؤجّلة", cls: "b-slate" },
};

// Arabic UI labels for the Trend Intelligence layer.
import type { TrendSource } from "./types";

export const TREND_SOURCE_LABEL: Record<TrendSource, string> = {
  manual: "إدخال يدوي",
  mock: "بيانات تجريبية",
  csv: "استيراد CSV",
  json: "استيراد JSON",
  google_trends: "Google Trends",
  creative_center: "TikTok Creative Center",
  official_tiktok: "TikTok الرسمي",
  licensed: "مزوّد مرخّص",
};

export const TREND_STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  new: { label: "جديد", cls: "b-slate" },
  analyzed: { label: "مُحلَّل", cls: "b-primary" },
  actioned: { label: "حُوّل لمحتوى", cls: "b-green" },
};

export const SENTIMENT_LABEL: Record<string, string> = {
  positive: "إيجابي", neutral: "محايد", negative: "سلبي", mixed: "مختلط",
};

export const COMPETITION_LABEL: Record<string, string> = {
  low: "منخفضة", medium: "متوسطة", high: "مرتفعة",
};

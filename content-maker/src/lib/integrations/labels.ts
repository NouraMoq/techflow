// Arabic UI labels for integration + publish state machines.

export const INTEGRATION_STATUS: Record<string, { label: string; cls: string }> = {
  disconnected: { label: "غير متصل", cls: "b-slate" },
  connected: { label: "متصل", cls: "b-green" },
  needs_reauth: { label: "يحتاج إعادة تصريح", cls: "b-amber" },
  expired: { label: "انتهت الصلاحية", cls: "b-rose" },
  error: { label: "توجد مشكلة", cls: "b-rose" },
  paused: { label: "متوقف مؤقتًا", cls: "b-slate" },
};

export const PUBLISH_STATUS: Record<string, { label: string; cls: string }> = {
  preparing: { label: "قيد التجهيز", cls: "b-slate" },
  ready: { label: "جاهز للنشر", cls: "b-amber" },
  publishing: { label: "جارٍ النشر…", cls: "b-primary" },
  published: { label: "منشور (مؤكَّد)", cls: "b-green" },
  failed: { label: "فشل النشر", cls: "b-rose" },
  manual: { label: "نُشر يدويًا", cls: "b-violet" },
};

export const modeLabel = (mode: string) => (mode === "live" ? "مباشر" : "تجريبي (Mock)");

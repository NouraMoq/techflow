// Shared labels/helpers for the script editor + editorial calendar.

export const SCRIPT_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "مسودة", cls: "b-slate" },
  review: { label: "قيد المراجعة", cls: "b-amber" },
  changes_requested: { label: "طلب تعديل", cls: "b-rose" },
  approved: { label: "معتمد", cls: "b-green" },
};

// Calendar event types → Arabic label + color (used in the month grid + legend).
export const CALENDAR_TYPES: Record<string, { label: string; color: string }> = {
  publish: { label: "نشر", color: "#15803d" },
  shoot: { label: "تصوير", color: "#06b6d4" },
  approval: { label: "اعتماد", color: "#b45309" },
  campaign: { label: "حملة", color: "#7c3aed" },
  deliverable: { label: "تسليم", color: "#be123c" },
  event: { label: "مناسبة", color: "#4f46e5" },
  trend: { label: "ترند", color: "#0e7490" },
  contract: { label: "عقد", color: "#be123c" },
  note: { label: "ملاحظة", color: "#64748b" },
  no_publish: { label: "يوم عدم نشر", color: "#94a3b8" },
};
export const calType = (t: string) => CALENDAR_TYPES[t] ?? CALENDAR_TYPES.note;

export const DOW = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
export const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export type CalEvent = { day: number; type: string; title: string };

// Build a 6-row (42-cell) month grid. Returns cells with day number (or null for
// leading/trailing blanks) so the view can render a fixed grid.
export function monthGrid(year: number, month0: number): (number | null)[] {
  const first = new Date(year, month0, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

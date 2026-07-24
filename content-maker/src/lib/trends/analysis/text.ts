// Lightweight, deterministic Arabic/Latin text helpers for rule-based analysis.
// No external NLP, no randomness — pure functions so results are reproducible.

const AR_DIACRITICS = /[ً-ْٰ]/g;
const AR_STOP = new Set([
  "من","في","على","الى","إلى","عن","مع","هذا","هذه","ذلك","التي","الذي","الذين","ما","لا","أن","إن","كان",
  "قد","كل","بعض","هو","هي","هم","هن","و","أو","ثم","يا","أنا","أنت","نحن","لكن","حتى","إذا","عند","عندما",
  "كيف","لماذا","هل","ماذا","اي","أي","بين","بعد","قبل","كما","لقد","هناك","هنا","به","بها","له","لها","عليه",
  "فيه","فيها","التى","الي","او","انا","انت","نحن","صار","يعني","شي","شيء","كذا","جدا","جداً","عشان","علشان",
]);
const EN_STOP = new Set([
  "the","and","for","are","but","not","you","all","can","her","was","one","our","out","has","him","his","how",
  "with","this","that","from","they","will","your","have","more","were","when","what","which","their","about",
]);

export function normalizeAr(s: string): string {
  return s
    .replace(AR_DIACRITICS, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ـ/g, "") // tatweel
    .trim();
}

export function tokenize(s: string): string[] {
  return normalizeAr(s.toLowerCase())
    .split(/[^\p{L}\p{N}_]+/u)
    .filter(Boolean);
}

export function isStop(w: string): boolean {
  return w.length < 3 || AR_STOP.has(w) || EN_STOP.has(w) || /^\d+$/.test(w);
}

// Merge the Arabic definite article so "العناية" and "عناية" count as one keyword.
function stripAl(w: string): string {
  return w.startsWith("ال") && w.length > 4 ? w.slice(2) : w;
}

/** Top keywords by frequency from text + hashtags (hashtags weighted ×2). */
export function keywords(text: string, hashtags: string[] = [], limit = 8): string[] {
  const freq = new Map<string, number>();
  for (const w0 of tokenize(text)) { const w = stripAl(w0); if (!isStop(w)) freq.set(w, (freq.get(w) ?? 0) + 1); }
  for (const h of hashtags) {
    const hw = stripAl(normalizeAr(h.replace(/^#+/, "").toLowerCase()));
    if (hw && !isStop(hw)) freq.set(hw, (freq.get(hw) ?? 0) + 2);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ar"))
    .slice(0, limit)
    .map((e) => e[0]);
}

const POS = ["رائع","ممتاز","جميل","حب","مذهل","نجاح","مفيد","سهل","افضل","حلو","خيالي","يستاهل","انصح","قوي","ملهم"];
const NEG = ["سيء","غلاء","ارتفاع","مشكلة","خطر","ازمة","صعب","فشل","مقاطعة","خيبة","غالي","احتكار","شكوى","سلبي","مزعج","خدعة"];

export type Sent = "positive" | "neutral" | "negative" | "mixed";
export function sentiment(text: string): Sent {
  const t = " " + normalizeAr(text.toLowerCase()) + " ";
  let p = 0, n = 0;
  for (const w of POS) if (t.includes(w)) p++;
  for (const w of NEG) if (t.includes(w)) n++;
  if (p && n) return "mixed";
  if (p) return "positive";
  if (n) return "negative";
  return "neutral";
}

/** Jaccard overlap between two keyword sets (0..1). */
export function jaccard(a: string[], b: string[]): number {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

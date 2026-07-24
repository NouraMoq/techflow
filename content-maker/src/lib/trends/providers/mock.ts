import "server-only";
import type { FetchResult, RawSignal, TrendDataProvider } from "../types";

// Deterministic demo signals across 3 topics (no network, no randomness).
// Several signals per topic — so clustering has something real to group.
const MOCK: RawSignal[] = [
  // Topic: أسعار القهوة المختصة (negative tone)
  { text: "ليش ارتفاع أسعار القهوة المختصة هالفترة؟ صار الكوب غالي جدًا", hashtags: ["#قهوة", "#قهوة_مختصة"], metrics: { views: 210000, likes: 18000, shares: 2400, accounts: 1, postedAt: "2026-07-17" } },
  { text: "غلاء حبوب القهوة المختصة والمحامص ترفع الأسعار، شرح سبب الارتفاع", hashtags: ["#قهوة_مختصة", "#اقتصاد"], metrics: { views: 155000, likes: 12000, shares: 1900, accounts: 1, postedAt: "2026-07-18" } },
  { text: "مقارنة أسعار القهوة المختصة بين المحامص، وهل يستاهل السعر الغالي؟", hashtags: ["#قهوة"], metrics: { views: 98000, likes: 8600, shares: 1200, accounts: 1, postedAt: "2026-07-18" } },
  { text: "احتكار موردي القهوة وتأثيره على غلاء الأسعار للمستهلك", hashtags: ["#قهوة_مختصة"], metrics: { views: 74000, likes: 5100, shares: 900, accounts: 1, postedAt: "2026-07-16" } },
  // Topic: روتين العناية بالبشرة الشتوي (positive tone)
  { text: "روتين العناية بالبشرة في الشتاء، ترطيب رائع وخطوات سهلة", hashtags: ["#عناية", "#بشرة", "#ترطيب"], metrics: { views: 320000, likes: 41000, shares: 5200, accounts: 1, postedAt: "2026-07-18" } },
  { text: "أفضل كريمات ترطيب البشرة الجافة للشتاء، تجربتي الحلوة", hashtags: ["#بشرة", "#عناية"], metrics: { views: 187000, likes: 22000, shares: 2600, accounts: 1, postedAt: "2026-07-17" } },
  { text: "خطوات روتين العناية بالبشرة الصباحي، مفيد وسهل للمبتدئات", hashtags: ["#عناية", "#روتيني"], metrics: { views: 140000, likes: 15500, shares: 1800, accounts: 1, postedAt: "2026-07-18" } },
  // Topic: انتقالات المرآة (format/effect)
  { text: "طريقة انتقالات المرآة في الفيديو، شرح كيف تسويها بسهولة", hashtags: ["#انتقالات", "#مونتاج"], metrics: { views: 260000, likes: 30000, shares: 4100, accounts: 1, postedAt: "2026-07-18" } },
  { text: "أفكار انتقالات المرآة للريلز، ترند حلو ومنتشر", hashtags: ["#انتقالات", "#ترند"], metrics: { views: 120000, likes: 13000, shares: 1500, accounts: 1, postedAt: "2026-07-17" } },
];

export class MockProvider implements TrendDataProvider {
  readonly source = "mock" as const;
  readonly mode = "mock" as const;

  async fetch(): Promise<FetchResult> {
    return {
      source: this.source,
      mode: this.mode,
      signals: MOCK.map((s) => ({ ...s })),
      note: "بيانات تجريبية للعرض — ليست من مصدر حقيقي.",
    };
  }
}

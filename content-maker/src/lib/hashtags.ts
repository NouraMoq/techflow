import "server-only";
import { prisma } from "@/lib/db";
import { parseArr } from "@/lib/json";

export type HashtagStat = { tag: string; count: number };

// Normalize a raw hashtag/tag into a comparable key: drop leading '#', trim,
// collapse whitespace to '_', lowercase Latin (Arabic is unaffected).
function norm(raw: string): string {
  return raw.replace(/^#+/, "").trim().replace(/\s+/g, "_").toLowerCase();
}

/**
 * Top hashtags for a tenant, aggregated from REAL data only:
 * trends (hashtag) + scripts (hashtagsJson) + idea tags (tagsJson).
 * Ranked by frequency. No fabricated values. Strictly tenant-scoped.
 */
export async function getTopHashtags(tenantId: string, limit = 18): Promise<HashtagStat[]> {
  const [trends, scripts, ideas] = await Promise.all([
    prisma.trend.findMany({ where: { tenantId, deletedAt: null }, select: { hashtag: true } }),
    prisma.script.findMany({ where: { tenantId, deletedAt: null }, select: { hashtagsJson: true } }),
    prisma.idea.findMany({ where: { tenantId, deletedAt: null }, select: { tagsJson: true } }),
  ]);

  const raw: string[] = [];
  for (const t of trends) if (t.hashtag) raw.push(t.hashtag);
  for (const s of scripts) raw.push(...parseArr(s.hashtagsJson));
  for (const i of ideas) raw.push(...parseArr(i.tagsJson));

  const map = new Map<string, HashtagStat>();
  for (const r of raw) {
    const key = norm(r);
    if (!key || key === "—") continue;
    const cur = map.get(key);
    if (cur) cur.count++;
    else map.set(key, { tag: "#" + key, count: 1 });
  }

  return [...map.values()]
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "ar"))
    .slice(0, limit);
}

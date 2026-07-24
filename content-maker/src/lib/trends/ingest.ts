import "server-only";
import { prisma } from "@/lib/db";
import { toJson } from "@/lib/json";
import type { RawSignal, SignalView, TrendSource } from "./types";

/** Persist provider RawSignals as TrendSignal rows (tenant-scoped) and return in-memory views. */
export async function ingestSignals(
  tenantId: string,
  source: TrendSource,
  raws: RawSignal[],
  createdBy?: string,
): Promise<SignalView[]> {
  // Dedup: never ingest an external ref we've already stored for this
  // tenant+source (idempotent re-fetch), and skip repeats within this batch.
  const refs = raws.map((r) => r.externalRef).filter((x): x is string => Boolean(x));
  const existing = refs.length
    ? new Set(
        (await prisma.trendSignal.findMany({
          where: { tenantId, source, externalRef: { in: refs } },
          select: { externalRef: true },
        })).map((x) => x.externalRef).filter((x): x is string => Boolean(x)),
      )
    : new Set<string>();
  const seenBatch = new Set<string>();

  const views: SignalView[] = [];
  for (const r of raws) {
    const text = r.text.trim();
    if (!text) continue;
    const ref = r.externalRef ?? null;
    if (ref) {
      if (existing.has(ref) || seenBatch.has(ref)) continue; // duplicate — skip
      seenBatch.add(ref);
    }
    const row = await prisma.trendSignal.create({
      data: {
        tenantId,
        source,
        text,
        externalRef: r.externalRef ?? null,
        hashtagsJson: toJson(r.hashtags ?? []),
        metricsJson: r.metrics ? toJson(r.metrics) : null,
        lang: r.lang ?? null,
        createdBy: createdBy ?? null,
      },
    });
    views.push({
      id: row.id,
      source,
      text,
      hashtags: r.hashtags ?? [],
      keywords: [],
      lang: r.lang,
      metrics: r.metrics ?? {},
    });
  }
  return views;
}

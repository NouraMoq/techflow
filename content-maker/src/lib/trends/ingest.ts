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
  const views: SignalView[] = [];
  for (const r of raws) {
    const text = r.text.trim();
    if (!text) continue;
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

import "server-only";
import type { AnalysisContext, PipelineStage } from "../types";
import { extractTopicStage } from "./stages/extract-topic";
import { clusterStage } from "./stages/cluster";
import { measureStage } from "./stages/measure";
import { enrichStage } from "./stages/enrich";
import { scoreStage } from "./stages/score";

// Ordered analysis pipeline. Add / reorder / remove stages HERE — the stages
// themselves stay untouched. This is the single extension point for analysis.
export const STAGES: PipelineStage[] = [
  extractTopicStage,
  clusterStage,
  measureStage,
  enrichStage,
  scoreStage,
];

export async function runPipeline(ctx: AnalysisContext): Promise<AnalysisContext> {
  let cur = ctx;
  for (const stage of STAGES) cur = await stage.run(cur);
  return cur;
}

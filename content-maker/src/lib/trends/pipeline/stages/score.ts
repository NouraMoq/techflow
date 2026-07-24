import "server-only";
import type { PipelineStage } from "../../types";
import { defaultScorer } from "../../analysis/scorer";

// Stage 5: score client-fit using the real client context (strategy/pillars/
// audience/compliance/crisis). Records a human-readable basis.
export const scoreStage: PipelineStage = {
  name: "score",
  async run(ctx) {
    for (const t of ctx.topics) {
      const r = await defaultScorer.score(t, ctx.client);
      t.clientScore = r.score;
      t.scoreBasis = r.basis;
      t.fit = r.fit;
      if (r.basis.some((b) => b.includes("حسّاسة"))) t.risk = "high"; // guardrail wins
    }
    return ctx;
  },
};

import type { GrowthWeights } from "../types";

// Growth-score weights. Tunable later (could be moved to per-tenant config).
export const DEFAULT_GROWTH_WEIGHTS: GrowthWeights = {
  velocity: 0.22,     // posting velocity (new posts on the topic)
  views: 0.16,        // view volume
  engagement: 0.20,   // likes + shares + comments relative to views
  accounts: 0.14,     // breadth: distinct accounts
  recency: 0.12,      // how fresh the posts are
  continuity: 0.08,   // sustained over time
  spread: 0.08,       // shares (virality)
};

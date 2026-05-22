/**
 * User Resource Search — Layer 1 of the research funnel.
 *
 * Before hitting the web, search the user's existing resource library.
 * Resources that have already been analyzed may contain relevant context.
 */

import type { Resource, AnalysisRecord } from "@/core/types";

export interface UserResourceMatch {
  resourceId: string;
  title: string;
  summary: string;
  relevance: number; // 0-1
}

/**
 * Simple keyword-based search across user resources and their analyses.
 * In production, this would use embeddings + vector search.
 */
export function searchUserResources(
  query: string,
  resources: Resource[],
  analyses: AnalysisRecord[],
  limit = 3,
): UserResourceMatch[] {
  const analysisMap = new Map(analyses.map((a) => [a.resourceId, a]));
  const queryTerms = query.toLowerCase().split(/\s+/);

  const scored = resources.map((r) => {
    const analysis = analysisMap.get(r.id);
    const searchText = [r.title, r.content, r.tags?.join(" "), analysis?.summary]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    let score = 0;
    for (const term of queryTerms) {
      if (searchText.includes(term)) score += 1;
      // Bonus for title match
      if (r.title.toLowerCase().includes(term)) score += 2;
      // Bonus for tag match
      if (r.tags?.some((t) => t.toLowerCase().includes(term))) score += 1.5;
    }

    const relevance = Math.min(1, score / (queryTerms.length * 3));

    return {
      resourceId: r.id,
      title: r.title,
      summary: analysis?.summary ?? "No analysis yet",
      relevance,
    };
  });

  return scored
    .filter((m) => m.relevance > 0.1)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

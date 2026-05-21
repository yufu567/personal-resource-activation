import type { ActivationGoal, AnalysisRecord, Resource } from "@/core/types";

export interface AnalyzeResourceInput {
  resource: Resource;
}

export type GeneratedAnalysis = Pick<
  AnalysisRecord,
  "summary" | "tags" | "valueScore" | "recommendation" | "activationOpportunities" | "gaps" | "reasoning"
>;

export interface PlanActivationInput {
  intent: string;
  resources: Resource[];
  analyses: AnalysisRecord[];
}

export type GeneratedActivationPlan = Pick<
  ActivationGoal,
  "title" | "tasks" | "checkpoints" | "gaps"
>;

export interface AIProvider {
  analyzeResource(input: AnalyzeResourceInput): Promise<GeneratedAnalysis>;
  planActivation(input: PlanActivationInput): Promise<GeneratedActivationPlan>;
}

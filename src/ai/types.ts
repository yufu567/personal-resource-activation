import type {
  ActivationGoal,
  AnalysisRecord,
  Resource,
  ResourceActualValue,
  ReviewLog,
  ReviewSuggestion
} from "@/core/types";

export interface AnalyzeResourceInput {
  resource: Resource;
}

export type GeneratedBasicAnalysis = Pick<AnalysisRecord, "summary" | "category" | "tags" | "confidence">;

export interface EvaluateResourceValueInput {
  resource: Resource;
  basicAnalysis: GeneratedBasicAnalysis;
}

export type GeneratedValueAssessment = Pick<
  AnalysisRecord,
  "valueScore" | "recommendation" | "activationOpportunities" | "gaps" | "nextBestAction" | "reasoning"
>;

export type GeneratedAnalysis = GeneratedBasicAnalysis & GeneratedValueAssessment;

export interface PlanActivationInput {
  intent: string;
  resources: Resource[];
  analyses: AnalysisRecord[];
}

export type GeneratedActivationPlan = Pick<
  ActivationGoal,
  "title" | "phases" | "tasks" | "checkpoints" | "gaps" | "resourceGaps" | "supplementalMaterials"
>;

export interface SuggestReviewInput {
  resource: Resource;
  analysis?: AnalysisRecord;
  goal?: ActivationGoal;
  review: Pick<ReviewLog, "outcome" | "actualValue" | "reflection" | "goalId" | "outputUrl">;
}

export interface GeneratedReviewAdvice {
  actualValue: ResourceActualValue;
  reviewSuggestions: ReviewSuggestion[];
  suggestedNextStep: string;
  valueDelta: number;
}

export interface AIProvider {
  analyzeResource(input: AnalyzeResourceInput): Promise<GeneratedBasicAnalysis>;
  evaluateResourceValue(input: EvaluateResourceValueInput): Promise<GeneratedValueAssessment>;
  planActivation(input: PlanActivationInput): Promise<GeneratedActivationPlan>;
  suggestReview(input: SuggestReviewInput): Promise<GeneratedReviewAdvice>;
}

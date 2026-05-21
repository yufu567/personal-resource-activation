import type { AIProvider } from "@/ai/types";
import type { ResourceActualValue, ReviewLog, ReviewSuggestion } from "./types";
import { InMemoryResourceStore } from "./resource-store";

export type RecordReviewInput = Omit<
  ReviewLog,
  "id" | "createdAt" | "lifecycleStage" | "reviewSuggestions" | "suggestedNextStep" | "valueDelta"
> &
  Partial<Pick<ReviewLog, "reviewSuggestions" | "suggestedNextStep" | "valueDelta">>;

export class ReviewEngine {
  constructor(
    private readonly store: InMemoryResourceStore,
    private readonly aiProvider?: AIProvider
  ) {}

  recordReview(input: RecordReviewInput): ReviewLog {
    const analysis = this.store.getAnalysis(input.userId, input.resourceId);
    const advice = createReviewAdvice(input.actualValue, analysis?.valueScore);
    const review = this.store.saveReview({
      ...input,
      reviewSuggestions: input.reviewSuggestions ?? advice.reviewSuggestions,
      suggestedNextStep: input.suggestedNextStep ?? advice.suggestedNextStep,
      valueDelta: input.valueDelta ?? advice.valueDelta
    });
    this.store.updateResourceStatus(input.userId, input.resourceId, "reviewed");
    this.store.updateResourceActualValue(input.userId, input.resourceId, input.actualValue);
    this.store.updateAnalysisReviewOutcome(input.userId, input.resourceId, {
      actualValue: input.actualValue,
      reviewSuggestions: review.reviewSuggestions
    });
    this.store.addAuditEvent({
      userId: input.userId,
      resourceId: input.resourceId,
      type: "review.completed",
      message: `Review recorded with actual value "${input.actualValue}".`,
      metadata: { outcome: input.outcome, goalId: input.goalId, valueDelta: review.valueDelta }
    });
    return review;
  }
}

function createReviewAdvice(actualValue: ResourceActualValue, previousScore = 50) {
  const targetScore = actualValue === "high" ? 90 : actualValue === "medium" ? 60 : 25;
  return {
    reviewSuggestions: buildReviewSuggestions(actualValue),
    suggestedNextStep:
      actualValue === "high"
        ? "Promote the winning pattern into another internal activation task."
        : actualValue === "medium"
          ? "Keep the next step internal and add missing context before expanding the goal."
          : "Keep the audit trail internal and archive this resource as a weak planning seed.",
    valueDelta: targetScore - previousScore
  };
}

function buildReviewSuggestions(actualValue: ResourceActualValue): ReviewSuggestion[] {
  if (actualValue === "high") {
    return [
      {
        title: "Promote the pattern",
        action: "Turn the successful activation into an internal template for similar resources.",
        priority: "high",
        permissionScope: "internal"
      }
    ];
  }
  if (actualValue === "medium") {
    return [
      {
        title: "Add context",
        action: "Attach one missing note or supporting resource before using this again.",
        priority: "medium",
        permissionScope: "internal"
      }
    ];
  }
  return [
    {
      title: "Archive with reason",
      action: "Keep the review trail, but stop using this resource as a planning seed.",
      priority: "medium",
      permissionScope: "internal"
    }
  ];
}

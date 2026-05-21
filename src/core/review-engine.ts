import type { ReviewLog } from "./types";
import { InMemoryResourceStore } from "./resource-store";

export type RecordReviewInput = Omit<ReviewLog, "id" | "createdAt" | "lifecycleStage">;

export class ReviewEngine {
  constructor(private readonly store: InMemoryResourceStore) {}

  recordReview(input: RecordReviewInput): ReviewLog {
    const review = this.store.saveReview(input);
    this.store.updateResourceStatus(input.userId, input.resourceId, "reviewed");
    this.store.addAuditEvent({
      userId: input.userId,
      resourceId: input.resourceId,
      type: "review.completed",
      message: `Review recorded with actual value "${input.actualValue}".`,
      metadata: { outcome: input.outcome, goalId: input.goalId }
    });
    return review;
  }
}

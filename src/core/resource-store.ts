import type {
  ActivationGoal,
  AnalysisRecord,
  AuditEvent,
  CreateResourceInput,
  Resource,
  ResourceActualValue,
  ResourceStatus,
  ReviewLog
} from "./types";

function now() {
  return new Date().toISOString();
}

export class InMemoryResourceStore {
  private counters = new Map<string, number>();
  private resources = new Map<string, Resource>();
  private analyses = new Map<string, AnalysisRecord>();
  private goals = new Map<string, ActivationGoal>();
  private reviews = new Map<string, ReviewLog>();
  private auditEvents: AuditEvent[] = [];

  createResource(input: CreateResourceInput): Resource {
    const timestamp = now();
    const resource: Resource = {
      id: this.nextId("res"),
      userId: input.userId,
      source: input.source,
      title: input.title,
      url: input.url,
      content: input.content,
      collectionPath: input.collectionPath,
      tags: input.tags ?? [],
      raw: input.raw,
      status: "new",
      shareVisibility: "private",
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.resources.set(resource.id, resource);
    this.addAuditEvent({
      userId: resource.userId,
      resourceId: resource.id,
      type: "resource.created",
      message: `Resource "${resource.title}" was added.`
    });
    return resource;
  }

  getResource(userId: string, resourceId: string): Resource | undefined {
    const resource = this.resources.get(resourceId);
    return resource?.userId === userId ? resource : undefined;
  }

  listResources(userId: string): Resource[] {
    return [...this.resources.values()].filter((resource) => resource.userId === userId);
  }

  listGoals(userId: string): ActivationGoal[] {
    return [...this.goals.values()].filter((goal) => goal.userId === userId);
  }

  listReviews(userId: string): ReviewLog[] {
    return [...this.reviews.values()].filter((review) => review.userId === userId);
  }

  updateResourceStatus(userId: string, resourceId: string, status: ResourceStatus): Resource {
    const resource = this.requireResource(userId, resourceId);
    const updated = { ...resource, status, updatedAt: now() };
    this.resources.set(resourceId, updated);
    return updated;
  }

  updateResourceActualValue(userId: string, resourceId: string, actualValue: ResourceActualValue): Resource {
    const resource = this.requireResource(userId, resourceId);
    const updated = { ...resource, actualValue, updatedAt: now() };
    this.resources.set(resourceId, updated);
    return updated;
  }

  saveAnalysis(
    record: Omit<AnalysisRecord, "id" | "createdAt" | "reviewSuggestions"> &
      Partial<Pick<AnalysisRecord, "reviewSuggestions">>
  ): AnalysisRecord {
    this.requireResource(record.userId, record.resourceId);
    const analysis: AnalysisRecord = {
      ...record,
      reviewSuggestions: record.reviewSuggestions ?? [],
      id: this.nextId("analysis"),
      createdAt: now()
    };
    this.analyses.set(analysis.resourceId, analysis);
    return analysis;
  }

  getAnalysis(userId: string, resourceId: string): AnalysisRecord | undefined {
    const analysis = this.analyses.get(resourceId);
    return analysis?.userId === userId ? analysis : undefined;
  }

  listAnalyses(userId: string): AnalysisRecord[] {
    return [...this.analyses.values()].filter((analysis) => analysis.userId === userId);
  }

  updateAnalysisReviewOutcome(
    userId: string,
    resourceId: string,
    update: Pick<AnalysisRecord, "actualValue" | "reviewSuggestions">
  ): AnalysisRecord | undefined {
    const analysis = this.getAnalysis(userId, resourceId);
    if (!analysis) return undefined;
    const updated = { ...analysis, ...update };
    this.analyses.set(resourceId, updated);
    return updated;
  }

  saveGoal(goal: Omit<ActivationGoal, "id" | "createdAt">): ActivationGoal {
    const saved: ActivationGoal = {
      ...goal,
      id: this.nextId("goal"),
      createdAt: now()
    };
    this.goals.set(saved.id, saved);
    return saved;
  }

  getGoal(userId: string, goalId: string): ActivationGoal | undefined {
    const goal = this.goals.get(goalId);
    return goal?.userId === userId ? goal : undefined;
  }

  saveReview(
    review: Omit<ReviewLog, "id" | "createdAt" | "lifecycleStage" | "reviewSuggestions" | "suggestedNextStep" | "valueDelta"> &
      Partial<Pick<ReviewLog, "reviewSuggestions" | "suggestedNextStep" | "valueDelta">>
  ): ReviewLog {
    this.requireResource(review.userId, review.resourceId);
    const saved: ReviewLog = {
      ...review,
      id: this.nextId("review"),
      lifecycleStage: "reviewed",
      reviewSuggestions: review.reviewSuggestions ?? [],
      suggestedNextStep: review.suggestedNextStep ?? "Review captured; keep the next action internal.",
      valueDelta: review.valueDelta ?? 0,
      createdAt: now()
    };
    this.reviews.set(saved.id, saved);
    return saved;
  }

  addAuditEvent(input: Omit<AuditEvent, "id" | "createdAt">): AuditEvent {
    const event: AuditEvent = {
      ...input,
      id: this.nextId("audit"),
      createdAt: now()
    };
    this.auditEvents.push(event);
    return event;
  }

  getAuditEvents(userId: string, resourceId?: string): AuditEvent[] {
    return this.auditEvents.filter((event) => {
      if (event.userId !== userId) return false;
      return resourceId ? event.resourceId === resourceId : true;
    });
  }

  requireResource(userId: string, resourceId: string): Resource {
    const resource = this.getResource(userId, resourceId);
    if (!resource) {
      throw new Error(`Resource ${resourceId} was not found for this user.`);
    }
    return resource;
  }

  private nextId(prefix: string) {
    const next = (this.counters.get(prefix) ?? 0) + 1;
    this.counters.set(prefix, next);
    return `${prefix}_${next}`;
  }
}

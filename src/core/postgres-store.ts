import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import type {
  ActivationGoal,
  AnalysisRecord,
  AuditEvent,
  CreateResourceInput,
  Resource,
  ResourceActualValue,
  ResourceStatus,
  ReviewLog,
} from "./types";

function now() {
  return new Date().toISOString();
}

function nextId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Row → Domain type mappers ──

function toResource(row: typeof schema.resources.$inferSelect): Resource {
  return {
    id: row.id,
    userId: row.userId,
    source: row.source as Resource["source"],
    title: row.title,
    url: row.url ?? undefined,
    content: row.content ?? undefined,
    status: row.status as ResourceStatus,
    shareVisibility: (row.shareVisibility as Resource["shareVisibility"]) ?? "private",
    actualValue: (row.actualValue as ResourceActualValue) ?? undefined,
    collectionPath: row.collectionPath ?? undefined,
    tags: row.tags as string[],
    raw: row.raw as Record<string, unknown> | undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toAnalysis(row: typeof schema.analysisRecords.$inferSelect): AnalysisRecord {
  return {
    id: row.id,
    userId: row.userId,
    resourceId: row.resourceId,
    summary: row.summary,
    category: (row.category as AnalysisRecord["category"]) ?? "general",
    tags: (row.tags ?? []) as string[],
    valueScore: row.valueScore,
    recommendation: row.recommendation as AnalysisRecord["recommendation"],
    activationOpportunities: (row.activationOpportunities ?? []) as AnalysisRecord["activationOpportunities"],
    gaps: (row.gaps ?? []) as string[],
    confidence: row.confidence,
    nextBestAction: (row.nextBestAction ?? {
      title: "",
      description: "",
      permissionScope: "internal",
    }) as AnalysisRecord["nextBestAction"],
    reasoning: row.reasoning,
    actualValue: (row.actualValue as ResourceActualValue) ?? undefined,
    reviewSuggestions: (row.reviewSuggestions ?? []) as AnalysisRecord["reviewSuggestions"],
    createdAt: row.createdAt.toISOString(),
  };
}

function toGoal(row: typeof schema.activationGoals.$inferSelect): ActivationGoal {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    intent: row.intent,
    resourceIds: (row.resourceIds ?? []) as string[],
    status: row.status as ActivationGoal["status"],
    phases: (row.phases ?? []) as ActivationGoal["phases"],
    tasks: [],
    checkpoints: (row.checkpoints ?? []) as string[],
    gaps: (row.gaps ?? []) as string[],
    resourceGaps: (row.resourceGaps ?? []) as ActivationGoal["resourceGaps"],
    supplementalMaterials: (row.supplementalMaterials ?? []) as ActivationGoal["supplementalMaterials"],
    createdAt: row.createdAt.toISOString(),
  };
}

function toReview(row: typeof schema.reviewLogs.$inferSelect): ReviewLog {
  return {
    id: row.id,
    userId: row.userId,
    resourceId: row.resourceId,
    goalId: row.goalId ?? undefined,
    outcome: row.outcome as ReviewLog["outcome"],
    actualValue: row.actualValue as ReviewLog["actualValue"],
    reflection: row.reflection,
    outputUrl: row.outputUrl ?? undefined,
    lifecycleStage: row.lifecycleStage as ReviewLog["lifecycleStage"],
    reviewSuggestions: (row.reviewSuggestions ?? []) as ReviewLog["reviewSuggestions"],
    suggestedNextStep: row.suggestedNextStep ?? "",
    valueDelta: row.valueDelta,
    createdAt: row.createdAt.toISOString(),
  };
}

function toAuditEvent(row: typeof schema.auditEvents.$inferSelect): AuditEvent {
  return {
    id: row.id,
    userId: row.userId,
    resourceId: row.resourceId ?? undefined,
    type: row.type,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
  };
}

export class PostgresResourceStore {
  // ── Resources ──

  async createResource(input: CreateResourceInput): Promise<Resource> {
    const db = getDb();
    const timestamp = new Date();
    const id = nextId("res");
    const [row] = await db
      .insert(schema.resources)
      .values({
        id,
        userId: input.userId,
        source: input.source,
        title: input.title,
        url: input.url ?? null,
        content: input.content ?? null,
        collectionPath: input.collectionPath ?? null,
        tags: input.tags ?? [],
        raw: input.raw as Record<string, unknown> | null,
        status: "new",
        shareVisibility: "private",
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();
    const resource = toResource(row);
    await this.addAuditEvent({
      userId: resource.userId,
      resourceId: resource.id,
      type: "resource.created",
      message: `Resource "${resource.title}" was added.`,
    });
    return resource;
  }

  async getResource(userId: string, resourceId: string): Promise<Resource | undefined> {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.resources)
      .where(and(eq(schema.resources.id, resourceId), eq(schema.resources.userId, userId)))
      .limit(1);
    return rows[0] ? toResource(rows[0]) : undefined;
  }

  async listResources(userId: string): Promise<Resource[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.resources)
      .where(eq(schema.resources.userId, userId));
    return rows.map(toResource);
  }

  async updateResourceStatus(userId: string, resourceId: string, status: ResourceStatus): Promise<Resource> {
    const db = getDb();
    const [row] = await db
      .update(schema.resources)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(schema.resources.id, resourceId), eq(schema.resources.userId, userId)))
      .returning();
    if (!row) throw new Error(`Resource ${resourceId} not found`);
    return toResource(row);
  }

  async updateResourceActualValue(
    userId: string,
    resourceId: string,
    actualValue: ResourceActualValue,
  ): Promise<Resource> {
    const db = getDb();
    const [row] = await db
      .update(schema.resources)
      .set({ actualValue, updatedAt: new Date() })
      .where(and(eq(schema.resources.id, resourceId), eq(schema.resources.userId, userId)))
      .returning();
    if (!row) throw new Error(`Resource ${resourceId} not found`);
    return toResource(row);
  }

  async requireResource(userId: string, resourceId: string): Promise<Resource> {
    const resource = await this.getResource(userId, resourceId);
    if (!resource) throw new Error(`Resource ${resourceId} was not found for this user.`);
    return resource;
  }

  // ── Analyses ──

  async saveAnalysis(
    record: Omit<AnalysisRecord, "id" | "createdAt" | "reviewSuggestions"> &
      Partial<Pick<AnalysisRecord, "reviewSuggestions">>,
  ): Promise<AnalysisRecord> {
    const db = getDb();
    await this.requireResource(record.userId, record.resourceId);
    const id = nextId("analysis");
    const timestamp = new Date();
    const [row] = await db
      .insert(schema.analysisRecords)
      .values({
        id,
        userId: record.userId,
        resourceId: record.resourceId,
        summary: record.summary,
        category: record.category ?? null,
        tags: record.tags ?? [],
        valueScore: record.valueScore,
        recommendation: record.recommendation,
        activationOpportunities: record.activationOpportunities ?? [],
        gaps: record.gaps ?? [],
        confidence: record.confidence,
        nextBestAction: (record.nextBestAction ?? {
          title: "",
          description: "",
          permissionScope: "internal",
        }) as unknown as Record<string, unknown>,
        reasoning: record.reasoning,
        actualValue: record.actualValue ?? null,
        reviewSuggestions: record.reviewSuggestions ?? [],
        createdAt: timestamp,
      })
      .returning();
    return toAnalysis(row);
  }

  async getAnalysis(userId: string, resourceId: string): Promise<AnalysisRecord | undefined> {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.analysisRecords)
      .where(
        and(
          eq(schema.analysisRecords.resourceId, resourceId),
          eq(schema.analysisRecords.userId, userId),
        ),
      )
      .limit(1);
    return rows[0] ? toAnalysis(rows[0]) : undefined;
  }

  async listAnalyses(userId: string): Promise<AnalysisRecord[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.analysisRecords)
      .where(eq(schema.analysisRecords.userId, userId));
    return rows.map(toAnalysis);
  }

  async updateAnalysisReviewOutcome(
    userId: string,
    resourceId: string,
    update: Pick<AnalysisRecord, "actualValue" | "reviewSuggestions">,
  ): Promise<AnalysisRecord | undefined> {
    const db = getDb();
    const [row] = await db
      .update(schema.analysisRecords)
      .set({
        actualValue: update.actualValue ?? null,
        reviewSuggestions: update.reviewSuggestions ?? [],
      })
      .where(
        and(
          eq(schema.analysisRecords.resourceId, resourceId),
          eq(schema.analysisRecords.userId, userId),
        ),
      )
      .returning();
    return row ? toAnalysis(row) : undefined;
  }

  // ── Goals ──

  async saveGoal(goal: Omit<ActivationGoal, "id" | "createdAt">): Promise<ActivationGoal> {
    const db = getDb();
    const id = nextId("goal");
    const timestamp = new Date();

    const [goalRow] = await db
      .insert(schema.activationGoals)
      .values({
        id,
        userId: goal.userId,
        title: goal.title,
        intent: goal.intent,
        resourceIds: goal.resourceIds ?? [],
        status: goal.status,
        phases: goal.phases ?? [],
        checkpoints: goal.checkpoints ?? [],
        gaps: goal.gaps ?? [],
        resourceGaps: goal.resourceGaps ?? [],
        supplementalMaterials: goal.supplementalMaterials ?? [],
        createdAt: timestamp,
      })
      .returning();

    // Save tasks separately
    if (goal.tasks.length > 0) {
      await db.insert(schema.actionTasks).values(
        goal.tasks.map((t) => ({
          id: t.id,
          goalId: id,
          userId: goal.userId,
          title: t.title,
          description: t.description,
          priority: t.priority,
          permissionScope: t.permissionScope,
          status: t.status,
          createdAt: timestamp,
        })),
      );
    }

    const dbGoal = toGoal(goalRow);
    dbGoal.tasks = goal.tasks;
    return dbGoal;
  }

  async listGoals(userId: string): Promise<ActivationGoal[]> {
    const db = getDb();
    const goalRows = await db
      .select()
      .from(schema.activationGoals)
      .where(eq(schema.activationGoals.userId, userId));

    const goals = goalRows.map(toGoal);

    // Load tasks for each goal
    for (const goal of goals) {
      const taskRows = await db
        .select()
        .from(schema.actionTasks)
        .where(eq(schema.actionTasks.goalId, goal.id));
      goal.tasks = taskRows.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority as "high" | "medium" | "low",
        permissionScope: t.permissionScope as "internal",
        status: t.status as "todo" | "done",
      }));
    }

    return goals;
  }

  // ── Reviews ──

  async saveReview(
    review: Omit<ReviewLog, "id" | "createdAt" | "lifecycleStage" | "reviewSuggestions" | "suggestedNextStep" | "valueDelta"> &
      Partial<Pick<ReviewLog, "reviewSuggestions" | "suggestedNextStep" | "valueDelta">>,
  ): Promise<ReviewLog> {
    const db = getDb();
    await this.requireResource(review.userId, review.resourceId);
    const id = nextId("review");
    const timestamp = new Date();
    const [row] = await db
      .insert(schema.reviewLogs)
      .values({
        id,
        userId: review.userId,
        resourceId: review.resourceId,
        goalId: review.goalId ?? null,
        outcome: review.outcome,
        actualValue: review.actualValue,
        reflection: review.reflection,
        outputUrl: review.outputUrl ?? null,
        lifecycleStage: "reviewed",
        reviewSuggestions: review.reviewSuggestions ?? [],
        suggestedNextStep: review.suggestedNextStep ?? "Review captured.",
        valueDelta: review.valueDelta ?? 0,
        createdAt: timestamp,
      })
      .returning();
    return toReview(row);
  }

  async listReviews(userId: string): Promise<ReviewLog[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.reviewLogs)
      .where(eq(schema.reviewLogs.userId, userId));
    return rows.map(toReview);
  }

  // ── Audit ──

  async addAuditEvent(input: Omit<AuditEvent, "id" | "createdAt">): Promise<AuditEvent> {
    const db = getDb();
    const id = nextId("audit");
    const timestamp = new Date();
    const [row] = await db
      .insert(schema.auditEvents)
      .values({
        id,
        userId: input.userId,
        resourceId: input.resourceId ?? null,
        type: input.type,
        message: input.message,
        metadata: input.metadata as Record<string, unknown> | null,
        createdAt: timestamp,
      })
      .returning();
    return toAuditEvent(row);
  }

  async getAuditEvents(userId: string, resourceId?: string): Promise<AuditEvent[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.auditEvents)
      .where(
        resourceId
          ? and(eq(schema.auditEvents.userId, userId), eq(schema.auditEvents.resourceId, resourceId))
          : eq(schema.auditEvents.userId, userId),
      );
    return rows.map(toAuditEvent);
  }
}

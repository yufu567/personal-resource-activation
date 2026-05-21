import type {
  ActivationGoal,
  AnalysisRecord,
  AuditEvent,
  CreateResourceInput,
  Resource,
  ResourceStatus,
  ReviewLog
} from "@/core/types";

export interface ResourceRepository {
  createResource(input: CreateResourceInput): Resource;
  getResource(userId: string, resourceId: string): Resource | undefined;
  listResources(userId: string): Resource[];
  updateResourceStatus(userId: string, resourceId: string, status: ResourceStatus): Resource;
  requireResource(userId: string, resourceId: string): Resource;
}

export interface AnalysisRepository {
  saveAnalysis(record: Omit<AnalysisRecord, "id" | "createdAt">): AnalysisRecord;
  getAnalysis(userId: string, resourceId: string): AnalysisRecord | undefined;
  listAnalyses(userId: string): AnalysisRecord[];
}

export interface ActivationRepository {
  saveGoal(goal: Omit<ActivationGoal, "id" | "createdAt">): ActivationGoal;
  listGoals(userId: string): ActivationGoal[];
}

export interface ReviewRepository {
  saveReview(review: Omit<ReviewLog, "id" | "createdAt" | "lifecycleStage">): ReviewLog;
  listReviews(userId: string): ReviewLog[];
}

export interface AuditRepository {
  addAuditEvent(input: Omit<AuditEvent, "id" | "createdAt">): AuditEvent;
  getAuditEvents(userId: string, resourceId?: string): AuditEvent[];
}

export type ResourceActivationStore = ResourceRepository &
  AnalysisRepository &
  ActivationRepository &
  ReviewRepository &
  AuditRepository;

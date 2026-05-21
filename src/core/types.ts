export type ResourceSource = "github" | "x" | "upload" | "link" | "drive";
export type ResourceStatus = "new" | "analyzed" | "reviewed" | "archived";
export type ShareVisibility = "private" | "summary-card";

export interface Resource {
  id: string;
  userId: string;
  source: ResourceSource;
  title: string;
  url?: string;
  content?: string;
  status: ResourceStatus;
  shareVisibility: ShareVisibility;
  collectionPath?: string;
  tags: string[];
  raw?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceInput {
  userId: string;
  source: ResourceSource;
  title: string;
  url?: string;
  content?: string;
  collectionPath?: string;
  tags?: string[];
  raw?: unknown;
}

export interface ActivationOpportunity {
  mode: "resource-driven" | "goal-driven" | "review-driven";
  title: string;
  action: string;
  confidence: number;
}

export interface AnalysisRecord {
  id: string;
  userId: string;
  resourceId: string;
  summary: string;
  tags: string[];
  valueScore: number;
  recommendation: "activate" | "review" | "archive";
  activationOpportunities: ActivationOpportunity[];
  gaps: string[];
  reasoning: string;
  createdAt: string;
}

export interface ActionTask {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  permissionScope: "internal";
  status: "todo" | "done";
}

export interface ActivationGoal {
  id: string;
  userId: string;
  title: string;
  intent: string;
  resourceIds: string[];
  status: "active" | "completed" | "paused";
  tasks: ActionTask[];
  checkpoints: string[];
  gaps: string[];
  createdAt: string;
}

export interface ReviewLog {
  id: string;
  userId: string;
  resourceId: string;
  goalId?: string;
  outcome: "produced-output" | "learned" | "discarded" | "needs-more-work";
  actualValue: "high" | "medium" | "low";
  reflection: string;
  outputUrl?: string;
  lifecycleStage: "reviewed";
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  userId: string;
  resourceId?: string;
  type: string;
  message: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

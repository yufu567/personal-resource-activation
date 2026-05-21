export type ResourceSource = "github" | "x" | "upload" | "link" | "drive";
export type ResourceStatus = "new" | "analyzed" | "reviewed" | "archived";
export type ShareVisibility = "private" | "summary-card";
export type ResourceActualValue = "high" | "medium" | "low";
export type AnalysisCategory =
  | "ai-workflow"
  | "product-strategy"
  | "automation"
  | "research"
  | "reference"
  | "low-signal"
  | "general";

export interface Resource {
  id: string;
  userId: string;
  source: ResourceSource;
  title: string;
  url?: string;
  content?: string;
  status: ResourceStatus;
  shareVisibility: ShareVisibility;
  actualValue?: ResourceActualValue;
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

export interface NextBestAction {
  title: string;
  description: string;
  permissionScope: "internal";
}

export interface ReviewSuggestion {
  title: string;
  action: string;
  priority: "high" | "medium" | "low";
  permissionScope: "internal";
}

export interface AnalysisRecord {
  id: string;
  userId: string;
  resourceId: string;
  summary: string;
  category: AnalysisCategory;
  tags: string[];
  valueScore: number;
  recommendation: "activate" | "review" | "archive";
  activationOpportunities: ActivationOpportunity[];
  gaps: string[];
  confidence: number;
  nextBestAction: NextBestAction;
  reasoning: string;
  actualValue?: ResourceActualValue;
  reviewSuggestions: ReviewSuggestion[];
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

export interface ActivationPhase {
  id: string;
  title: string;
  objective: string;
  taskIds: string[];
  checkpoint: string;
}

export interface ResourceGap {
  title: string;
  reason: string;
  howToFill: string;
}

export interface SupplementalMaterialSuggestion {
  title: string;
  reason: string;
  sourceHint: ResourceSource | "manual-note";
}

export interface ActivationGoal {
  id: string;
  userId: string;
  title: string;
  intent: string;
  resourceIds: string[];
  status: "active" | "completed" | "paused";
  phases: ActivationPhase[];
  tasks: ActionTask[];
  checkpoints: string[];
  gaps: string[];
  resourceGaps: ResourceGap[];
  supplementalMaterials: SupplementalMaterialSuggestion[];
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
  reviewSuggestions: ReviewSuggestion[];
  suggestedNextStep: string;
  valueDelta: number;
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

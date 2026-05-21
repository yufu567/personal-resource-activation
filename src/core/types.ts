export type ResourceSource = "github" | "x" | "upload" | "link" | "drive";
export type ResourceStatus = "new" | "analyzed" | "reviewed" | "archived";
export type ShareVisibility = "private" | "summary-card";
export type ResourceActualValue = "high" | "medium" | "low";
export type ResourceMedium = "text" | "image" | "video" | "audio" | "mixed";

// Functional domain — what the resource is about
export type ResourceDomain =
  | "engineering"
  | "product"
  | "finance"
  | "health"
  | "science"
  | "design"
  | "general";

// Activation potential — how likely this resource can be activated
export type ActivationPotential = "seed" | "fuel" | "archive";

export type AnalysisCategory = ResourceDomain | "ai-workflow" | "product-strategy" | "automation" | "research" | "reference" | "low-signal";

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
  /** 物理形态 — 由系统自动推断 */
  medium?: ResourceMedium;
  /** 功能领域 — AI 分析后确定 */
  domain?: ResourceDomain;
  /** 激活潜力 — AI 评估后确定 */
  potential?: ActivationPotential;
  collectionPath?: string;
  tags: string[];
  raw?: unknown;
  createdAt: string;
  updatedAt: string;
}

export type ConnectorCapability =
  | "manual-import"
  | "file-upload"
  | "folder-sync"
  | "cursor-pagination"
  | "mock-bookmarks"
  | "mock-likes";

export interface ConnectorSyncResult {
  resources: Resource[];
  lastCursor?: string;
  nextCursor?: string;
}

export interface Connector<TInput = unknown> {
  readonly source: ResourceSource;
  readonly capabilities: readonly ConnectorCapability[];
  readonly lastCursor?: string;
  readonly nextCursor?: string;
  sync(userId: string, input: TInput): Promise<ConnectorSyncResult>;
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

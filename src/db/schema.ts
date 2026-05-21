import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  displayName: text("display_name"),
  authProvider: text("auth_provider").notNull().default("demo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const connectorAccounts = pgTable("connector_accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id"),
  selectedRootFolderId: text("selected_root_folder_id"),
  selectedRootFolderName: text("selected_root_folder_name"),
  accessTokenCiphertext: text("access_token_ciphertext"),
  refreshTokenCiphertext: text("refresh_token_ciphertext"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const resources = pgTable("resources", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  source: text("source").notNull(),
  title: text("title").notNull(),
  url: text("url"),
  content: text("content"),
  status: text("status").notNull(),
  shareVisibility: text("share_visibility").notNull().default("private"),
  collectionPath: text("collection_path"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  raw: jsonb("raw"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const analysisRecords = pgTable("analysis_records", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  resourceId: text("resource_id").notNull().references(() => resources.id),
  summary: text("summary").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  valueScore: integer("value_score").notNull(),
  recommendation: text("recommendation").notNull(),
  activationOpportunities: jsonb("activation_opportunities").notNull().default([]),
  gaps: jsonb("gaps").$type<string[]>().notNull().default([]),
  reasoning: text("reasoning").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const activationGoals = pgTable("activation_goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  intent: text("intent").notNull(),
  resourceIds: jsonb("resource_ids").$type<string[]>().notNull().default([]),
  status: text("status").notNull(),
  checkpoints: jsonb("checkpoints").$type<string[]>().notNull().default([]),
  gaps: jsonb("gaps").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const actionTasks = pgTable("action_tasks", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").notNull().references(() => activationGoals.id),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(),
  permissionScope: text("permission_scope").notNull().default("internal"),
  status: text("status").notNull().default("todo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const reviewLogs = pgTable("review_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  resourceId: text("resource_id").notNull().references(() => resources.id),
  goalId: text("goal_id"),
  outcome: text("outcome").notNull(),
  actualValue: text("actual_value").notNull(),
  reflection: text("reflection").notNull(),
  outputUrl: text("output_url"),
  lifecycleStage: text("lifecycle_stage").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const auditEvents = pgTable("audit_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  resourceId: text("resource_id"),
  type: text("type").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

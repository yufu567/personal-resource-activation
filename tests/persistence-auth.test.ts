import { describe, expect, test } from "vitest";
import { getTableName } from "drizzle-orm";

import {
  actionTasks,
  activationGoals,
  analysisRecords,
  auditEvents,
  connectorAccounts,
  resources,
  reviewLogs,
  users
} from "@/db/schema";
import type { ResourceActivationStore } from "@/core/store/repositories";
import { InMemoryResourceStore } from "@/core/resource-store";
import { createServerUserContext, DEFAULT_DEMO_USER_ID } from "@/server/user-context";

describe("persistence and auth foundation", () => {
  test("defines launch persistence tables and encrypted connector token columns", () => {
    expect([
      users,
      resources,
      analysisRecords,
      activationGoals,
      actionTasks,
      reviewLogs,
      auditEvents,
      connectorAccounts
    ].map((table) => getTableName(table))).toEqual([
      "users",
      "resources",
      "analysis_records",
      "activation_goals",
      "action_tasks",
      "review_logs",
      "audit_events",
      "connector_accounts"
    ]);

    expect(connectorAccounts.accessTokenCiphertext).toBeDefined();
    expect(connectorAccounts.refreshTokenCiphertext).toBeDefined();
    expect("accessToken" in connectorAccounts).toBe(false);
    expect("refreshToken" in connectorAccounts).toBe(false);
  });

  test("keeps repository reads scoped to the caller user", () => {
    const store: ResourceActivationStore = new InMemoryResourceStore();
    const userA = "user-a";
    const userB = "user-b";

    const userAResource = store.createResource({
      userId: userA,
      source: "link",
      title: "User A resource",
      content: "Visible only to user A."
    });
    const userBResource = store.createResource({
      userId: userB,
      source: "github",
      title: "User B resource",
      content: "Visible only to user B."
    });

    store.saveAnalysis({
      userId: userB,
      resourceId: userBResource.id,
      summary: "Private analysis",
      tags: ["private"],
      valueScore: 88,
      recommendation: "activate",
      activationOpportunities: [],
      gaps: [],
      reasoning: "Belongs to user B."
    });
    store.saveGoal({
      userId: userB,
      title: "Private goal",
      intent: "Keep user B data isolated.",
      resourceIds: [userBResource.id],
      status: "active",
      tasks: [],
      checkpoints: [],
      gaps: []
    });
    store.saveReview({
      userId: userB,
      resourceId: userBResource.id,
      outcome: "learned",
      actualValue: "medium",
      reflection: "Private review."
    });

    expect(store.getResource(userA, userBResource.id)).toBeUndefined();
    expect(() => store.requireResource(userA, userBResource.id)).toThrow(/not found/i);
    expect(store.getAnalysis(userA, userBResource.id)).toBeUndefined();
    expect(store.listResources(userA).map((resource) => resource.id)).toEqual([userAResource.id]);
    expect(store.listAnalyses(userA)).toEqual([]);
    expect(store.listGoals(userA)).toEqual([]);
    expect(store.listReviews(userA)).toEqual([]);
    expect(store.getAuditEvents(userA).every((event) => event.userId === userA)).toBe(true);
  });

  test("creates a server-side user context boundary for future auth adapters", () => {
    expect(createServerUserContext()).toEqual({
      userId: DEFAULT_DEMO_USER_ID,
      authProvider: "demo"
    });
    expect(createServerUserContext({ userId: "user-1", authProvider: "authjs" })).toEqual({
      userId: "user-1",
      authProvider: "authjs"
    });
  });
});

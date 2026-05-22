import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId } from "@/auth/session";
import { fetchStarredRepos, mapGitHubRepoToResource } from "@/connectors/github-api";
import { getResourceActivationService } from "@/server/resource-activation-service";

export const dynamic = "force-dynamic";

const syncSchema = z.object({
  username: z.string().min(1),
  token: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
});

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  const body = await request.json();
  const input = syncSchema.parse(body);

  const { repos, hasMore, error } = await fetchStarredRepos(
    input.username,
    input.token,
    input.page,
  );

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const service = getResourceActivationService();
  const addedResources = [];

  for (const repo of repos) {
    const mapped = mapGitHubRepoToResource(repo);
    // Check if already imported (simple check by url)
    const snapshot = await service.getSnapshot(userId);
    const exists = snapshot.resources.some((r) => r.url === mapped.url);
    if (exists) continue;

    const result = await service.addResource({
      userId,
      source: "github",
      title: mapped.fullName,
      url: mapped.url,
      content: [
        mapped.description,
        mapped.language ? `Language: ${mapped.language}` : null,
        mapped.topics?.length ? `Topics: ${mapped.topics.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      tags: mapped.topics ?? [],
      raw: {
        repoId: mapped.repoId,
        language: mapped.language,
        topics: mapped.topics,
        starredAt: mapped.starredAt,
      },
    });
    addedResources.push(result.resource);
  }

  const snapshot = await service.getSnapshot(userId);

  return NextResponse.json({
    imported: addedResources.length,
    total: repos.length,
    hasMore,
    nextPage: hasMore ? input.page + 1 : null,
    snapshot,
  });
}

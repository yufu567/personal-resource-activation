import { InMemoryResourceStore } from "@/core/resource-store";
import type { Connector, ConnectorSyncResult } from "@/core/types";

export interface GitHubStarItem {
  repoId: string;
  fullName: string;
  url: string;
  description?: string;
  language?: string;
  topics?: string[];
  starredAt?: string;
}

export interface GitHubStarSyncInput {
  stars: GitHubStarItem[];
  cursor?: string;
  pageSize?: number;
}

export class GitHubStarConnector implements Connector<GitHubStarSyncInput> {
  readonly source = "github";
  readonly capabilities = ["cursor-pagination"] as const;
  lastCursor?: string;
  nextCursor?: string;

  constructor(private readonly store: InMemoryResourceStore) {}

  async sync(userId: string, input: GitHubStarSyncInput): Promise<ConnectorSyncResult> {
    const start = parseCursor(input.cursor);
    const pageSize = Math.max(1, input.pageSize ?? input.stars.length);
    const page = input.stars.slice(start, start + pageSize);

    this.lastCursor = input.cursor;
    this.nextCursor = start + pageSize < input.stars.length ? String(start + pageSize) : undefined;

    const resources = page.map((star) =>
      this.store.createResource({
        userId,
        source: this.source,
        title: star.fullName,
        url: star.url,
        content: contentForStar(star),
        tags: star.topics,
        raw: {
          repoId: star.repoId,
          language: star.language,
          topics: star.topics,
          starredAt: star.starredAt
        }
      })
    );

    return { resources, lastCursor: this.lastCursor, nextCursor: this.nextCursor };
  }
}

function parseCursor(cursor: string | undefined): number {
  const parsed = Number(cursor ?? 0);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function contentForStar(star: GitHubStarItem): string | undefined {
  return [
    star.description,
    star.language ? `Language: ${star.language}` : undefined,
    star.topics?.length ? `Topics: ${star.topics.join(", ")}` : undefined
  ]
    .filter(Boolean)
    .join("\n");
}

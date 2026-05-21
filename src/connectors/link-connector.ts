import { InMemoryResourceStore } from "@/core/resource-store";
import type { Connector, ConnectorSyncResult } from "@/core/types";

export interface LinkConnectorInput {
  url: string;
  title?: string;
  content?: string;
  tags?: string[];
  cursor?: string;
}

export class LinkConnector implements Connector<LinkConnectorInput> {
  readonly source = "link";
  readonly capabilities = ["manual-import"] as const;
  lastCursor?: string;
  nextCursor?: string;

  constructor(private readonly store: InMemoryResourceStore) {}

  async sync(userId: string, input: LinkConnectorInput): Promise<ConnectorSyncResult> {
    const originalUrl = input.url;
    const normalizedUrl = new URL(originalUrl.trim()).toString();

    this.lastCursor = input.cursor;
    this.nextCursor = undefined;

    const resource = this.store.createResource({
      userId,
      source: this.source,
      title: input.title?.trim() || normalizedUrl,
      url: normalizedUrl,
      content: input.content?.trim(),
      tags: input.tags,
      raw: { originalUrl, normalizedUrl }
    });

    return { resources: [resource], lastCursor: this.lastCursor, nextCursor: this.nextCursor };
  }
}

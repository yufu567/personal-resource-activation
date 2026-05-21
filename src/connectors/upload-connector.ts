import { InMemoryResourceStore } from "@/core/resource-store";
import type { Connector, ConnectorSyncResult } from "@/core/types";

export interface UploadConnectorInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  content: string;
  collectionPath?: string;
  tags?: string[];
  cursor?: string;
}

export class UploadConnector implements Connector<UploadConnectorInput> {
  readonly source = "upload";
  readonly capabilities = ["file-upload"] as const;
  lastCursor?: string;
  nextCursor?: string;

  constructor(private readonly store: InMemoryResourceStore) {}

  async sync(userId: string, input: UploadConnectorInput): Promise<ConnectorSyncResult> {
    this.lastCursor = input.cursor;
    this.nextCursor = undefined;

    const resource = this.store.createResource({
      userId,
      source: this.source,
      title: input.fileName.trim(),
      content: input.content,
      collectionPath: input.collectionPath,
      tags: input.tags,
      raw: {
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes
      }
    });

    return { resources: [resource], lastCursor: this.lastCursor, nextCursor: this.nextCursor };
  }
}

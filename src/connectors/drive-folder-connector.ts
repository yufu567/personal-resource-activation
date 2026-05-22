import { InMemoryResourceStore } from "@/core/resource-store";
import type { Connector, ConnectorSyncResult } from "@/core/types";

export interface DriveConnectorConfig {
  selectedRootFolderId: string;
  selectedRootName: string;
}

export interface DriveItem {
  id: string;
  parentId?: string;
  name: string;
  mimeType: string;
  content?: string;
}

export interface DriveFolderSyncInput {
  items: DriveItem[];
  cursor?: string;
}

export class DriveFolderConnector implements Connector<DriveFolderSyncInput> {
  readonly source = "drive";
  readonly capabilities = ["folder-sync"] as const;
  lastCursor?: string;
  nextCursor?: string;

  constructor(
    private readonly store: InMemoryResourceStore,
    private readonly config: DriveConnectorConfig
  ) {}

  async sync(userId: string, input: DriveFolderSyncInput | DriveItem[]): Promise<ConnectorSyncResult> {
    const items = Array.isArray(input) ? input : input.items;
    const itemById = new Map(items.map((item) => [item.id, item]));
    const descendants = new Set<string>([this.config.selectedRootFolderId]);
    let changed = true;

    while (changed) {
      changed = false;
      for (const item of items) {
        if (item.parentId && descendants.has(item.parentId) && !descendants.has(item.id)) {
          descendants.add(item.id);
          changed = true;
        }
      }
    }

    this.lastCursor = Array.isArray(input) ? undefined : input.cursor;
    this.nextCursor = undefined;

    const resources = items
      .filter((item) => descendants.has(item.id))
      .filter((item) => item.mimeType !== "folder")
      .map((item) =>
        this.store.createResource({
          userId,
          source: "drive",
          title: item.name,
          content: item.content,
          collectionPath: this.collectionPathFor(item, itemById),
          raw: { driveItemId: item.id, mimeType: item.mimeType }
        })
      );

    return { resources, lastCursor: this.lastCursor, nextCursor: this.nextCursor };
  }

  private collectionPathFor(item: DriveItem, itemById: Map<string, DriveItem>): string {
    const folders: string[] = [];
    let parentId = item.parentId;

    while (parentId && parentId !== this.config.selectedRootFolderId) {
      const parent = itemById.get(parentId);
      if (!parent) break;
      folders.unshift(parent.name);
      parentId = parent.parentId;
    }

    return [this.config.selectedRootName, ...folders].join("/");
  }
}

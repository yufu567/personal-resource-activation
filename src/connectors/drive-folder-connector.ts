import { InMemoryResourceStore } from "@/core/resource-store";
import type { Resource } from "@/core/types";

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

export class DriveFolderConnector {
  constructor(
    private readonly store: InMemoryResourceStore,
    private readonly config: DriveConnectorConfig
  ) {}

  async sync(userId: string, items: DriveItem[]): Promise<Resource[]> {
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

    return items
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

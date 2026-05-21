import { InMemoryResourceStore } from "@/core/resource-store";
import type { Connector, ConnectorSyncResult } from "@/core/types";

export interface XBookmarkItem {
  postId: string;
  url: string;
  authorName: string;
  text: string;
  savedAt?: string;
}

export interface XLikeItem {
  postId: string;
  url: string;
  authorName: string;
  text: string;
  likedAt?: string;
}

export interface XConnectorInput {
  bookmarks?: XBookmarkItem[];
  likes?: XLikeItem[];
  cursor?: string;
}

export class XConnector implements Connector<XConnectorInput> {
  readonly source = "x";
  readonly capabilities = ["mock-bookmarks", "mock-likes"] as const;
  lastCursor?: string;
  nextCursor?: string;

  constructor(private readonly store: InMemoryResourceStore) {}

  async sync(userId: string, input: XConnectorInput): Promise<ConnectorSyncResult> {
    this.lastCursor = input.cursor;
    this.nextCursor = undefined;

    const bookmarkResources = (input.bookmarks ?? []).map((bookmark) =>
      this.store.createResource({
        userId,
        source: this.source,
        title: titleForPost(bookmark.authorName, bookmark.text),
        url: bookmark.url,
        content: bookmark.text,
        raw: {
          interaction: "bookmark",
          postId: bookmark.postId,
          savedAt: bookmark.savedAt
        }
      })
    );
    const likeResources = (input.likes ?? []).map((like) =>
      this.store.createResource({
        userId,
        source: this.source,
        title: titleForPost(like.authorName, like.text),
        url: like.url,
        content: like.text,
        raw: {
          interaction: "like",
          postId: like.postId,
          likedAt: like.likedAt
        }
      })
    );

    return {
      resources: [...bookmarkResources, ...likeResources],
      lastCursor: this.lastCursor,
      nextCursor: this.nextCursor
    };
  }
}

function titleForPost(authorName: string, text: string): string {
  return `${authorName.trim()}: ${text.trim()}`;
}

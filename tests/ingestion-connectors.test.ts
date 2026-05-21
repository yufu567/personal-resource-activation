import { describe, expect, test } from "vitest";

import { DriveFolderConnector } from "@/connectors/drive-folder-connector";
import { GitHubStarConnector } from "@/connectors/github-star-connector";
import { LinkConnector } from "@/connectors/link-connector";
import { UploadConnector } from "@/connectors/upload-connector";
import { XConnector } from "@/connectors/x-connector";
import { InMemoryResourceStore } from "@/core/resource-store";

describe("ingestion connectors", () => {
  test("DriveFolderConnector syncs only the selected root folder and descendants", async () => {
    const store = new InMemoryResourceStore();
    const connector = new DriveFolderConnector(store, {
      selectedRootFolderId: "folder-root",
      selectedRootName: "Pinned Inbox"
    });

    const result = await connector.sync("user-1", {
      items: [
        { id: "folder-root", name: "Pinned Inbox", mimeType: "folder" },
        {
          id: "inside-file",
          parentId: "folder-root",
          name: "inside.md",
          mimeType: "text/markdown",
          content: "Inside the selected folder."
        },
        { id: "inside-folder", parentId: "folder-root", name: "research", mimeType: "folder" },
        {
          id: "nested-file",
          parentId: "inside-folder",
          name: "nested.md",
          mimeType: "text/markdown",
          content: "Inside a selected subfolder."
        },
        { id: "external-folder", name: "External", mimeType: "folder" },
        {
          id: "outside-file",
          parentId: "external-folder",
          name: "outside.md",
          mimeType: "text/markdown",
          content: "Must not be imported."
        }
      ]
    });

    expect(connector.source).toBe("drive");
    expect(connector.capabilities).toContain("folder-sync");
    expect(result.resources.map((resource) => resource.title)).toEqual(["inside.md", "nested.md"]);
    expect(result.resources.every((resource) => resource.source === "drive")).toBe(true);
    expect(result.resources[1]?.collectionPath).toBe("Pinned Inbox/research");
    expect(store.listResources("user-1")).toHaveLength(2);
  });

  test("LinkConnector normalizes a saved URL into a link resource", async () => {
    const store = new InMemoryResourceStore();
    const connector = new LinkConnector(store);

    const result = await connector.sync("user-1", {
      url: " HTTPS://Example.com/articles/resource-activation?ref=Inbox#notes ",
      title: " Resource activation notes ",
      content: " A useful saved article. ",
      tags: ["research"]
    });

    expect(connector.source).toBe("link");
    expect(connector.capabilities).toContain("manual-import");
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0]).toMatchObject({
      source: "link",
      title: "Resource activation notes",
      url: "https://example.com/articles/resource-activation?ref=Inbox#notes",
      content: "A useful saved article.",
      tags: ["research"]
    });
  });

  test("UploadConnector normalizes uploaded text metadata without storing a file", async () => {
    const store = new InMemoryResourceStore();
    const connector = new UploadConnector(store);

    const result = await connector.sync("user-1", {
      fileName: "activation-plan.md",
      mimeType: "text/markdown",
      sizeBytes: 512,
      content: "Plan text extracted from the uploaded file.",
      collectionPath: "Uploads/plans"
    });

    expect(connector.source).toBe("upload");
    expect(connector.capabilities).toContain("file-upload");
    expect(result.resources[0]).toMatchObject({
      source: "upload",
      title: "activation-plan.md",
      content: "Plan text extracted from the uploaded file.",
      collectionPath: "Uploads/plans"
    });
    expect(result.resources[0]?.raw).toEqual({
      fileName: "activation-plan.md",
      mimeType: "text/markdown",
      sizeBytes: 512
    });
  });

  test("GitHubStarConnector paginates mock stars without dropping repos", async () => {
    const store = new InMemoryResourceStore();
    const connector = new GitHubStarConnector(store);
    const stars = [
      {
        repoId: "repo-1",
        fullName: "openai/codex",
        url: "https://github.com/openai/codex",
        description: "Coding agent",
        language: "TypeScript",
        topics: ["ai", "developer-tools"],
        starredAt: "2026-05-20T10:00:00.000Z"
      },
      {
        repoId: "repo-2",
        fullName: "example/resource-activation",
        url: "https://github.com/example/resource-activation",
        description: "Resource activation system",
        language: "TypeScript",
        topics: ["knowledge"],
        starredAt: "2026-05-19T10:00:00.000Z"
      },
      {
        repoId: "repo-3",
        fullName: "example/connector-kit",
        url: "https://github.com/example/connector-kit",
        description: "Connector helpers",
        language: "Go",
        topics: ["connectors"],
        starredAt: "2026-05-18T10:00:00.000Z"
      }
    ];

    const firstPage = await connector.sync("user-1", { stars, pageSize: 2 });
    const secondPage = await connector.sync("user-1", {
      stars,
      pageSize: 2,
      cursor: firstPage.nextCursor
    });

    expect(connector.source).toBe("github");
    expect(connector.capabilities).toContain("cursor-pagination");
    expect(firstPage.resources.map((resource) => resource.title)).toEqual([
      "openai/codex",
      "example/resource-activation"
    ]);
    expect(firstPage.nextCursor).toBe("2");
    expect(secondPage.resources.map((resource) => resource.title)).toEqual(["example/connector-kit"]);
    expect(secondPage.nextCursor).toBeUndefined();
    expect(store.listResources("user-1").map((resource) => resource.title)).toEqual([
      "openai/codex",
      "example/resource-activation",
      "example/connector-kit"
    ]);
    expect(store.listResources("user-1").every((resource) => resource.source === "github")).toBe(true);
  });

  test("XConnector imports bookmarks and likes as x resources", async () => {
    const store = new InMemoryResourceStore();
    const connector = new XConnector(store);

    const result = await connector.sync("user-1", {
      bookmarks: [
        {
          postId: "post-1",
          url: "https://x.com/example/status/1",
          authorName: "Example",
          text: "Bookmark about personal automation.",
          savedAt: "2026-05-20T09:00:00.000Z"
        }
      ],
      likes: [
        {
          postId: "post-2",
          url: "https://x.com/example/status/2",
          authorName: "Example",
          text: "Liked note about connector design.",
          likedAt: "2026-05-20T09:30:00.000Z"
        }
      ]
    });

    expect(connector.source).toBe("x");
    expect(connector.capabilities).toContain("mock-bookmarks");
    expect(connector.capabilities).toContain("mock-likes");
    expect(result.resources.map((resource) => resource.source)).toEqual(["x", "x"]);
    expect(result.resources.map((resource) => resource.title)).toEqual([
      "Example: Bookmark about personal automation.",
      "Example: Liked note about connector design."
    ]);
    expect(result.resources.map((resource) => resource.raw)).toEqual([
      {
        interaction: "bookmark",
        postId: "post-1",
        savedAt: "2026-05-20T09:00:00.000Z"
      },
      {
        interaction: "like",
        postId: "post-2",
        likedAt: "2026-05-20T09:30:00.000Z"
      }
    ]);
  });
});

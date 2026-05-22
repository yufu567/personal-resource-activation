/**
 * SearXNG Search Provider
 *
 * SearXNG 是一个自托管的元搜索引擎，聚合 Google、Bing、DuckDuckGo、百度等结果。
 * 完全免费，无调用限制，中英文都有优秀覆盖。
 *
 * Docker Compose 启动：
 *   searxng:
 *     image: searxng/searxng:latest
 *     ports: ["8080:8080"]
 */

import type { SearchResult } from "./types";

const DEFAULT_ENDPOINT = "http://searxng:8080";

export interface SearXNGConfig {
  endpoint?: string;
  timeout?: number;
}

export function createSearXNGProvider(config: SearXNGConfig = {}) {
  const endpoint = config.endpoint ?? process.env.SEARXNG_ENDPOINT ?? DEFAULT_ENDPOINT;
  const timeout = config.timeout ?? 10000;

  return {
    async search(query: string, limit = 5): Promise<SearchResult[]> {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        const params = new URLSearchParams({
          q: query,
          format: "json",
          categories: "general",
          language: "auto",
          safesearch: "1",
        });

        const res = await fetch(`${endpoint}/search?${params}`, {
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!res.ok) return [];

        const data = (await res.json()) as {
          results?: Array<{
            title: string;
            url: string;
            content: string;
            engine: string;
          }>;
        };

        return (data.results ?? []).slice(0, limit).map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content?.slice(0, 200) ?? "",
          source: "web" as const,
          confidence: r.engine.includes("google") ? ("high" as const) : ("medium" as const),
        }));
      } catch {
        return [];
      }
    },
  };
}

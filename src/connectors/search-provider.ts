/**
 * Search Provider — 搜索抽象层
 *
 * 支持多种搜索后端：
 * - Bing Web Search API (Azure 免费层 1000 次/月)
 * - Mock (返回空，开发用)
 * - 未来可扩展：SearXNG、SerpAPI、Brave Search
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchProvider {
  search(query: string, limit?: number): Promise<SearchResult[]>;
}

// ── Bing Web Search ──

export function createBingSearchProvider(apiKey: string): SearchProvider {
  const endpoint = "https://api.bing.microsoft.com/v7.0/search";

  return {
    async search(query: string, limit = 5): Promise<SearchResult[]> {
      const url = `${endpoint}?q=${encodeURIComponent(query)}&count=${limit}&mkt=zh-CN`;
      const res = await fetch(url, {
        headers: { "Ocp-Apim-Subscription-Key": apiKey },
      });
      if (!res.ok) return [];
      const data = (await res.json()) as {
        webPages?: { value: Array<{ name: string; url: string; snippet: string }> };
      };
      return (data.webPages?.value ?? []).map((r) => ({
        title: r.name,
        url: r.url,
        snippet: r.snippet,
      }));
    },
  };
}

// ── Mock (空搜索，提示用户配置 API) ──

export function createMockSearchProvider(): SearchProvider {
  return {
    async search(_query: string): Promise<SearchResult[]> {
      return [];
    },
  };
}

// ── Factory ──

export function createSearchProvider(apiKey?: string): SearchProvider {
  if (apiKey) return createBingSearchProvider(apiKey);
  return createMockSearchProvider();
}

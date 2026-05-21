/**
 * GitHub API client — fetches real starred repos.
 *
 * Rate limits:
 * - Without token: 60 req/hr (public)
 * - With token: 5000 req/hr
 *
 * API docs: https://docs.github.com/en/rest/activity/starring
 */

export interface GitHubRepo {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
}

const GITHUB_API = "https://api.github.com";

export async function fetchStarredRepos(
  username: string,
  token?: string,
  page = 1,
  perPage = 30,
): Promise<{ repos: GitHubRepo[]; hasMore: boolean; error?: string }> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "personal-resource-activation",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${GITHUB_API}/users/${encodeURIComponent(username)}/starred?page=${page}&per_page=${perPage}&sort=created&direction=desc`;

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      if (res.status === 404) return { repos: [], hasMore: false, error: `用户 ${username} 不存在` };
      if (res.status === 403) return { repos: [], hasMore: false, error: "API 限流，请配置 GitHub Token 或稍后再试" };
      if (res.status === 401) return { repos: [], hasMore: false, error: "Token 无效或已过期" };
      return { repos: [], hasMore: false, error: `GitHub API 错误 (${res.status})` };
    }

    const repos: GitHubRepo[] = await res.json();

    // Check Link header for pagination
    const linkHeader = res.headers.get("link") ?? "";
    const hasMore = linkHeader.includes('rel="next"');

    return { repos, hasMore };
  } catch {
    return { repos: [], hasMore: false, error: "网络错误，无法连接 GitHub API" };
  }
}

export function mapGitHubRepoToResource(repo: GitHubRepo) {
  return {
    repoId: String(repo.id),
    fullName: repo.full_name,
    url: repo.html_url,
    description: repo.description ?? undefined,
    language: repo.language ?? undefined,
    topics: repo.topics,
    starredAt: undefined,
  };
}

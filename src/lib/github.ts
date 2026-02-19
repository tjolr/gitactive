import type { CommitData, RepoInfo } from "../types";

export function parseRepoUrl(url: string): RepoInfo {
  // Handle formats:
  // https://github.com/owner/repo
  // https://github.com/owner/repo.git
  // github.com/owner/repo
  // owner/repo
  const cleaned = url.trim().replace(/\.git$/, "").replace(/\/$/, "");
  const ghMatch = cleaned.match(
    /(?:https?:\/\/)?github\.com\/([^/]+)\/([^/]+)/
  );
  if (ghMatch) {
    return { owner: ghMatch[1], repo: ghMatch[2] };
  }
  const slashMatch = cleaned.match(/^([^/]+)\/([^/]+)$/);
  if (slashMatch) {
    return { owner: slashMatch[1], repo: slashMatch[2] };
  }
  throw new Error("Invalid repo URL. Use format: owner/repo or https://github.com/owner/repo");
}

interface GitHubCommitListItem {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  author: { login: string; avatar_url: string } | null;
}

interface GitHubCommitDetail {
  stats: { additions: number; deletions: number; total: number };
}

async function fetchJSON<T>(url: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    if (res.status === 404) throw new Error("Repository not found");
    if (res.status === 403) throw new Error("Rate limit exceeded. Try adding a personal access token.");
    if (res.status === 401) throw new Error("Invalid token or unauthorized");
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return res.json();
}

export async function fetchCommits(
  repoInfo: RepoInfo,
  token?: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<CommitData[]> {
  const { owner, repo } = repoInfo;
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

  // Fetch commit list
  const commits = await fetchJSON<GitHubCommitListItem[]>(
    `${baseUrl}/commits?per_page=20`,
    token
  );

  const total = commits.length;
  let loaded = 0;

  // Fetch details in batches of 5
  const results: CommitData[] = [];
  for (let i = 0; i < commits.length; i += 5) {
    const batch = commits.slice(i, i + 5);
    const details = await Promise.all(
      batch.map(async (c) => {
        try {
          const detail = await fetchJSON<GitHubCommitDetail>(
            `${baseUrl}/commits/${c.sha}`,
            token
          );
          return detail.stats;
        } catch {
          return { additions: 0, deletions: 0, total: 0 };
        }
      })
    );

    for (let j = 0; j < batch.length; j++) {
      const c = batch[j];
      const stats = details[j];
      results.push({
        sha: c.sha,
        shortSha: c.sha.slice(0, 7),
        message: c.commit.message,
        title: c.commit.message.split("\n")[0],
        authorName: c.commit.author.name,
        authorLogin: c.author?.login ?? c.commit.author.name,
        authorAvatar: c.author?.avatar_url ?? "",
        date: c.commit.author.date,
        stats,
      });
      loaded++;
      onProgress?.(loaded, total);
    }
  }

  return results;
}

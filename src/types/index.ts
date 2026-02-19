export interface CommitData {
  sha: string;
  shortSha: string;
  message: string;
  title: string;
  authorName: string;
  authorLogin: string;
  authorAvatar: string;
  date: string;
  stats: { additions: number; deletions: number; total: number };
}

export interface RepoInfo {
  owner: string;
  repo: string;
}

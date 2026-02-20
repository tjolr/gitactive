export type TechLanguage = "vue" | "react" | "typescript" | "kotlin" | "java";

export interface FileChange {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
}

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
  filesChanged: number;
  files: FileChange[];
  primaryLanguage?: TechLanguage;
}

export interface RepoInfo {
  owner: string;
  repo: string;
}

export type TechLanguage = "vue" | "react" | "typescript" | "kotlin" | "java" | "sql" | "prisma" | "json" | "markdown" | "html" | "png" | "svg";

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
  checkRuns?: CheckRun[];
}

export interface CheckRun {
  id: number;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion: "success" | "failure" | "neutral" | "cancelled" | "skipped" | "timed_out" | "action_required" | null;
}

export interface RepoInfo {
  owner: string;
  repo: string;
}

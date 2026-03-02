const LS_HISTORY = "gitactive:repoHistory";
const MAX_HISTORY = 10;

export function getRepoHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_HISTORY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveRepoToHistory(url: string): void {
  const history = getRepoHistory().filter((u) => u !== url);
  history.unshift(url);
  localStorage.setItem(LS_HISTORY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

/** Extract "owner/repo" display label from any supported URL format */
export function repoLabel(url: string): string {
  const cleaned = url.trim().replace(/\.git$/, "").replace(/\/$/, "");
  const ghMatch = cleaned.match(/(?:https?:\/\/)?github\.com\/([^/]+\/[^/]+)/);
  if (ghMatch) return ghMatch[1];
  const slashMatch = cleaned.match(/^([^/]+\/[^/]+)$/);
  if (slashMatch) return slashMatch[1];
  return url;
}

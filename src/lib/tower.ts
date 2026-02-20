import type { CommitData } from "../types";
import { MIN_BLOCK_HEIGHT } from "../components/scene/CommitBlock";

const GAP = 0.05;

export function commitHeight(filesChanged: number): number {
  // Logarithmic scale: 1 file → small, ~20+ files → 2.0
  const scaled = Math.log10(Math.max(filesChanged, 1)) / Math.log10(25);
  const raw = MIN_BLOCK_HEIGHT + Math.min(scaled, 1) * 1.5;
  return Math.max(raw, MIN_BLOCK_HEIGHT);
}

export interface BlockLayout {
  commit: CommitData;
  y: number;
  height: number;
  dateLabel?: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function computeTowerLayout(commits: CommitData[]): BlockLayout[] {
  // Sort by date ascending (oldest first) so oldest is at bottom
  const ordered = [...commits].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const positions: BlockLayout[] = [];
  let currentY = 0;
  let lastDate = "";

  for (const commit of ordered) {
    const h = commitHeight(commit.filesChanged);
    const commitDate = new Date(commit.date).toDateString();
    const isNewDate = commitDate !== lastDate;
    lastDate = commitDate;

    positions.push({
      commit,
      y: currentY + h / 2,
      height: h,
      ...(isNewDate ? { dateLabel: formatDate(commit.date) } : {}),
    });
    currentY += h + GAP;
  }

  const offsetY = currentY / 2;
  return positions.map((p) => ({ ...p, y: p.y - offsetY }));
}

/** Floor sits just below the lowest block */
export function computeFloorY(layout: BlockLayout[]): number {
  if (layout.length === 0) return 0;
  const lowest = layout[0];
  return lowest.y - lowest.height / 2 - 0.1;
}

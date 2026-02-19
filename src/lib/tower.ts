import type { CommitData } from "../types";

const GAP = 0.05;

export function commitHeight(filesChanged: number): number {
  if (filesChanged <= 1) return 0.3;
  // Logarithmic scale: 1 file → 0.3, ~20+ files → 2.0
  const scaled = Math.log10(filesChanged) / Math.log10(25);
  return 0.3 + Math.min(scaled, 1) * 1.7;
}

export interface BlockLayout {
  commit: CommitData;
  y: number;
  height: number;
}

export function computeTowerLayout(commits: CommitData[]): BlockLayout[] {
  // Oldest at bottom, newest on top
  const ordered = [...commits].reverse();

  const positions: { commit: CommitData; y: number; height: number }[] = [];
  let currentY = 0;
  for (const commit of ordered) {
    const h = commitHeight(commit.filesChanged);
    positions.push({ commit, y: currentY + h / 2, height: h });
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

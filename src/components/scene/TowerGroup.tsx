import { useEffect, useRef } from "react";
import type { BlockLayout } from "../../lib/tower";
import type { RepoInfo } from "../../types";
import { CommitBlock } from "./CommitBlock";

interface TowerGroupProps {
  layout: BlockLayout[];
  repo: RepoInfo;
}

export function TowerGroup({ layout, repo }: TowerGroupProps) {
  const knownShas = useRef<Set<string>>(new Set());
  const isInitialized = useRef(false);
  // Records the wall-clock time (ms) when each commit first appeared as "new"
  const newSinceTimes = useRef<Map<string, number>>(new Map());

  // Compute new SHAs during render (before the effect updates knownShas)
  const newShas = isInitialized.current
    ? new Set(layout.map((b) => b.commit.sha).filter((sha) => !knownShas.current.has(sha)))
    : new Set<string>();

  // Stamp arrival time for each newly detected commit (runs during render, once per SHA)
  newShas.forEach((sha) => {
    if (!newSinceTimes.current.has(sha)) {
      newSinceTimes.current.set(sha, Date.now());
    }
  });

  useEffect(() => {
    isInitialized.current = true;
    layout.forEach((b) => knownShas.current.add(b.commit.sha));
  }, [layout]);

  return (
    <group>
      {layout.map((block) => (
        <group key={block.commit.sha}>
          <CommitBlock
            commit={block.commit}
            position={[0, block.y, 0]}
            height={block.height}
            newSince={newSinceTimes.current.get(block.commit.sha)}
            commitUrl={`https://github.com/${repo.owner}/${repo.repo}/commit/${block.commit.sha}`}
          />
        </group>
      ))}
    </group>
  );
}


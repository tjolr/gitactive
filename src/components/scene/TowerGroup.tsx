import { Html } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { BLOCK_WIDTH } from "./CommitBlock";
import { neutral, scene } from "../../lib/palette";
import type { BlockLayout } from "../../lib/tower";
import { CommitBlock } from "./CommitBlock";

interface TowerGroupProps {
  layout: BlockLayout[];
}

export function TowerGroup({ layout }: TowerGroupProps) {
  const knownShas = useRef<Set<string>>(new Set());
  const isInitialized = useRef(false);

  // Compute new SHAs during render (before the effect updates knownShas)
  const newShas = isInitialized.current
    ? new Set(layout.map((b) => b.commit.sha).filter((sha) => !knownShas.current.has(sha)))
    : new Set<string>();

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
            isNew={newShas.has(block.commit.sha)}
          />
          {block.dateLabel && (
            <Html
              position={[-(BLOCK_WIDTH / 2 + 0.6), block.y, 0]}
              distanceFactor={8}
              style={{ pointerEvents: "none" }}
            >
              <div
                style={{
                  whiteSpace: "nowrap",
                  fontFamily: "'SF Mono', monospace",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: neutral[400],
                  background: `${scene.background}b3`,
                  padding: "3px 8px",
                  borderRadius: "4px",
                  borderLeft: "2px solid #555577",
                }}
              >
                {block.dateLabel}
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}

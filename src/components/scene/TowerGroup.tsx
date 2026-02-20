import { Html } from "@react-three/drei";
import { BLOCK_WIDTH } from "./CommitBlock";
import { neutral, scene } from "../../lib/palette";
import type { BlockLayout } from "../../lib/tower";
import { CommitBlock } from "./CommitBlock";

interface TowerGroupProps {
  layout: BlockLayout[];
}

export function TowerGroup({ layout }: TowerGroupProps) {
  return (
    <group>
      {layout.map((block) => (
        <group key={block.commit.sha}>
          <CommitBlock
            commit={block.commit}
            position={[0, block.y, 0]}
            height={block.height}
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

import type { BlockLayout } from "../../lib/tower";
import { CommitBlock } from "./CommitBlock";

interface TowerGroupProps {
  layout: BlockLayout[];
}

export function TowerGroup({ layout }: TowerGroupProps) {
  return (
    <group>
      {layout.map((block) => (
        <CommitBlock
          key={block.commit.sha}
          commit={block.commit}
          position={[0, block.y, 0]}
          height={block.height}
        />
      ))}
    </group>
  );
}

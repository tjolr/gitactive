import { MeshReflectorMaterial } from "@react-three/drei";
import { scene } from "../../lib/palette";

interface FloorProps {
  yPosition: number;
}

export function Floor({ yPosition }: FloorProps) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, yPosition, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <MeshReflectorMaterial
        blur={[150, 50]}
        resolution={512}
        mixBlur={1}
        mixStrength={0.5}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color={scene.floor}
        metalness={0.5}
        mirror={0.5}
      />
    </mesh>
  );
}

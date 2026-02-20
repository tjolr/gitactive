import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { BlockLayout } from "../../lib/tower";
import { TowerGroup } from "./TowerGroup";
import { SceneLighting } from "./SceneLighting";
import { SceneEffects } from "./SceneEffects";
import { Floor } from "./Floor";
import { Particles } from "./Particles";

interface CommitSceneProps {
  layout: BlockLayout[];
  floorY: number;
  targetY: number;
}

function CameraController({ targetY }: { targetY: number }) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const targetRef = useRef(targetY);

  useEffect(() => {
    targetRef.current = targetY;
  }, [targetY]);

  // Set initial position on mount
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, targetY, 0);
      controlsRef.current.object.position.set(5, targetY + 2, 5);
      controlsRef.current.update();
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    if (!controlsRef.current) return;
    const ctrl = controlsRef.current;
    const currentY = ctrl.target.y;
    const desired = targetRef.current;
    const diff = desired - currentY;
    if (Math.abs(diff) > 0.01) {
      const newY = currentY + diff * 0.08;
      ctrl.target.set(0, newY, 0);
      ctrl.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={false}
      enableZoom
      enablePan={false}
      minDistance={3}
      maxDistance={25}
    />
  );
}

export function CommitScene({ layout, floorY, targetY }: CommitSceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [5, targetY + 2, 5], fov: 50 }}
      gl={{ antialias: true, toneMapping: 0 }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#0a0a0f"]} />
      <fog attach="fog" args={["#0a0a0f", 8, 35]} />

      <SceneLighting />
      <TowerGroup layout={layout} />
      <Floor yPosition={floorY} />
      <Particles targetY={targetY} />
      <SceneEffects />

      <CameraController targetY={targetY} />
    </Canvas>
  );
}

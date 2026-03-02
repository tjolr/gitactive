import { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scene } from "../../lib/palette";
import type { BlockLayout } from "../../lib/tower";
import { TowerGroup } from "./TowerGroup";
import { SceneLighting } from "./SceneLighting";
import { SceneEffects } from "./SceneEffects";
import { Floor } from "./Floor";

const INITIAL_DISTANCE = 10;
const MIN_DISTANCE = 3;
const MAX_DISTANCE = 25;

interface CommitSceneProps {
  layout: BlockLayout[];
  floorY: number;
  targetY: number;
  angle: number;
  zoom: number;
}

function CameraController({ targetY, angle, zoom }: { targetY: number; angle: number; zoom: number }) {
  const { camera } = useThree();
  const targetRef = useRef(targetY);
  const angleRef = useRef(angle);
  const zoomRef = useRef(zoom);
  const currentAngle = useRef(angle);

  useEffect(() => { targetRef.current = targetY; }, [targetY]);
  useEffect(() => { angleRef.current = angle; }, [angle]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // Set initial position on mount
  useEffect(() => {
    camera.position.set(
      Math.cos(angle) * INITIAL_DISTANCE,
      targetY,
      Math.sin(angle) * INITIAL_DISTANCE
    );
    camera.lookAt(0, targetY, 0);
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;

    // Smooth Y interpolation
    const diffY = targetRef.current - cam.position.y;
    if (Math.abs(diffY) > 0.01) {
      cam.position.y += diffY * 0.08;
    }

    // Smooth angle interpolation
    const angleDiff = angleRef.current - currentAngle.current;
    if (Math.abs(angleDiff) > 0.001) {
      currentAngle.current += angleDiff * 0.08;
    }

    // Smooth zoom interpolation — compute desired distance
    const desiredDist = THREE.MathUtils.clamp(
      INITIAL_DISTANCE / zoomRef.current,
      MIN_DISTANCE,
      MAX_DISTANCE
    );
    const currentDist = Math.sqrt(cam.position.x ** 2 + cam.position.z ** 2);
    const diffDist = desiredDist - currentDist;
    const dist = Math.abs(diffDist) > 0.01 ? currentDist + diffDist * 0.08 : currentDist;

    // Apply angle + distance on XZ plane
    cam.position.x = Math.cos(currentAngle.current) * dist;
    cam.position.z = Math.sin(currentAngle.current) * dist;

    cam.lookAt(0, cam.position.y, 0);
  });

  return null;
}

export function CommitScene({ layout, floorY, targetY, angle, zoom }: CommitSceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [Math.cos(angle) * INITIAL_DISTANCE, targetY, Math.sin(angle) * INITIAL_DISTANCE], fov: 50 }}
      gl={{ antialias: true, toneMapping: 0 }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={[scene.background]} />
      <fog attach="fog" args={[scene.fog, 8, 35]} />

      <SceneLighting />
      <TowerGroup layout={layout} />
      <Floor yPosition={floorY} />
<SceneEffects />

      <CameraController targetY={targetY} angle={angle} zoom={zoom} />
    </Canvas>
  );
}

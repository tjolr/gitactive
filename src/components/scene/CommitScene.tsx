import { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scene } from "../../lib/palette";
import type { BlockLayout } from "../../lib/tower";
import type { RepoInfo } from "../../types";
import { TowerGroup } from "./TowerGroup";
import { SceneLighting } from "./SceneLighting";
import { SceneEffects } from "./SceneEffects";
import { Floor } from "./Floor";

const INITIAL_DISTANCE = 10;
const MIN_DISTANCE = 3;
const MAX_DISTANCE = 25;

interface CommitSceneProps {
  layout: BlockLayout[];
  repo: RepoInfo;
  floorY: number;
  targetY: number;
  angle: number;
  zoom: number;
  minY: number;
}

function CameraController({ targetY, zoom, minY }: { targetY: number; zoom: number; minY: number }) {
  const { camera, invalidate } = useThree();
  const targetRef = useRef(targetY);
  const zoomRef = useRef(zoom);

  targetRef.current = targetY;
  zoomRef.current = zoom;

  const prevMinYRef = useRef(minY);

  useEffect(() => {
    camera.position.set(0, targetY, INITIAL_DISTANCE);
    camera.lookAt(0, targetY, 0);
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    let moving = false;

    // When the tower re-centers (new commit added → all block Y positions shift),
    // immediately move the camera by the same delta BEFORE Three.js renders this
    // frame. Blocks and camera shift together — zero visible jump.
    const minYShift = minY - prevMinYRef.current;
    if (Math.abs(minYShift) > 0.001) {
      cam.position.y += minYShift;
      prevMinYRef.current = minY;
      moving = true;
    }

    // Smooth Y interpolation
    const diffY = targetRef.current - cam.position.y;
    if (Math.abs(diffY) > 0.01) {
      cam.position.y += diffY * 0.08;
      moving = true;
    }

    // Smooth zoom interpolation
    const desiredDist = THREE.MathUtils.clamp(
      INITIAL_DISTANCE / zoomRef.current,
      MIN_DISTANCE,
      MAX_DISTANCE
    );
    const currentDist = cam.position.z;
    const diffDist = desiredDist - currentDist;
    if (Math.abs(diffDist) > 0.01) {
      cam.position.z = currentDist + diffDist * 0.08;
      moving = true;
    }

    cam.lookAt(0, cam.position.y, 0);

    if (moving) {
      invalidate();
    }
  });

  return null;
}

function TowerRotator({ angle, children }: { angle: number; children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(angle);
  const currentAngle = useRef(angle);
  const { invalidate } = useThree();

  angleRef.current = angle;

  useFrame(() => {
    const diff = angleRef.current - currentAngle.current;
    if (Math.abs(diff) > 0.001) {
      currentAngle.current += diff * 0.08;
      if (groupRef.current) {
        groupRef.current.rotation.y = -currentAngle.current;
      }
      invalidate();
    }
  });

  return <group ref={groupRef} rotation={[0, -angle, 0]}>{children}</group>;
}

export function CommitScene({ layout, repo, floorY, targetY, angle, zoom, minY }: CommitSceneProps) {
  return (
    <Canvas
      shadows
      frameloop="demand"
      camera={{ position: [0, targetY, INITIAL_DISTANCE], fov: 50 }}
      gl={{ antialias: true, toneMapping: 0 }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={[scene.background]} />
      <fog attach="fog" args={[scene.fog, 8, 35]} />

      <SceneLighting />
      <TowerRotator angle={angle}>
        <TowerGroup layout={layout} repo={repo} />
        <Floor yPosition={floorY} />
      </TowerRotator>
      <SceneEffects />

      <CameraController targetY={targetY} zoom={zoom} minY={minY} />
    </Canvas>
  );
}

import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { BlockLayout } from "../../lib/tower";
import { TowerGroup } from "./TowerGroup";
import { SceneLighting } from "./SceneLighting";
import { SceneEffects } from "./SceneEffects";
import { Floor } from "./Floor";
import { Particles } from "./Particles";

const INITIAL_DISTANCE = 10;
const MIN_DISTANCE = 3;
const MAX_DISTANCE = 25;

interface CommitSceneProps {
  layout: BlockLayout[];
  floorY: number;
  targetY: number;
  zoom: number;
}

function CameraController({ targetY, zoom }: { targetY: number; zoom: number }) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const targetRef = useRef(targetY);
  const zoomRef = useRef(zoom);

  useEffect(() => {
    targetRef.current = targetY;
  }, [targetY]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Set initial position on mount
  useEffect(() => {
    if (controlsRef.current) {
      const d = INITIAL_DISTANCE / Math.SQRT2;
      controlsRef.current.object.position.set(d, targetY, d);
      controlsRef.current.target.set(0, targetY, 0);
      controlsRef.current.update();
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    if (!controlsRef.current) return;
    const ctrl = controlsRef.current;
    const cam = ctrl.object as THREE.PerspectiveCamera;

    // Smooth Y position interpolation — move both camera and target together
    const currentY = cam.position.y;
    const desiredY = targetRef.current;
    const diffY = desiredY - currentY;
    if (Math.abs(diffY) > 0.01) {
      const deltaY = diffY * 0.08;
      cam.position.y += deltaY;
      ctrl.target.y += deltaY;
    }

    // Smooth zoom interpolation
    const dir = new THREE.Vector3().subVectors(cam.position, ctrl.target);
    const currentDist = dir.length();
    const desiredDist = THREE.MathUtils.clamp(
      INITIAL_DISTANCE / zoomRef.current,
      MIN_DISTANCE,
      MAX_DISTANCE
    );
    const diffDist = desiredDist - currentDist;
    if (Math.abs(diffDist) > 0.01) {
      const newDist = currentDist + diffDist * 0.08;
      dir.normalize().multiplyScalar(newDist);
      cam.position.copy(ctrl.target).add(dir);
    }

    ctrl.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={false}
      enableZoom={false}
      enablePan={false}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
    />
  );
}

export function CommitScene({ layout, floorY, targetY, zoom }: CommitSceneProps) {
  const d = INITIAL_DISTANCE / Math.SQRT2;
  return (
    <Canvas
      shadows
      camera={{ position: [d, targetY, d], fov: 50 }}
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

      <CameraController targetY={targetY} zoom={zoom} />
    </Canvas>
  );
}

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 300;
const SPREAD_XZ = 20;
const SPREAD_Y = 20;

interface ParticlesProps {
  targetY: number;
}

export function Particles({ targetY }: ParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const initialized = useRef(false);
  const centerY = useRef(targetY);

  useEffect(() => {
    centerY.current = targetY;
  }, [targetY]);

  const positions = useMemo(() => {
    return new Float32Array(PARTICLE_COUNT * 3);
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const cy = centerY.current;
    const pos = pointsRef.current.geometry.attributes.position;
    const halfY = SPREAD_Y / 2;

    if (!initialized.current) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos.setX(i, (Math.random() - 0.5) * SPREAD_XZ);
        pos.setY(i, cy + (Math.random() - 0.5) * SPREAD_Y);
        pos.setZ(i, (Math.random() - 0.5) * SPREAD_XZ);
      }
      pos.needsUpdate = true;
      initialized.current = true;
      return;
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const y = pos.getY(i);
      pos.setY(i, y + delta * 0.3);
      if (y > cy + halfY) {
        pos.setY(i, cy - halfY);
        pos.setX(i, (Math.random() - 0.5) * SPREAD_XZ);
        pos.setZ(i, (Math.random() - 0.5) * SPREAD_XZ);
      }
      if (y < cy - halfY) {
        pos.setY(i, cy + (Math.random() - 0.5) * SPREAD_Y);
        pos.setX(i, (Math.random() - 0.5) * SPREAD_XZ);
        pos.setZ(i, (Math.random() - 0.5) * SPREAD_XZ);
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={PARTICLE_COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#00ff88"
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        fog={false}
      />
    </points>
  );
}

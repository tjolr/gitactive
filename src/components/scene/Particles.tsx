import { useMemo } from "react";
import * as THREE from "three";
import { accent } from "../../lib/palette";

const PARTICLE_COUNT = 80;
const SPREAD_XZ = 20;
const SPREAD_Y = 20;

interface ParticlesProps {
  targetY: number;
}

export function Particles({ targetY }: ParticlesProps) {
  const positions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * SPREAD_XZ;
      arr[i * 3 + 1] = targetY + (Math.random() - 0.5) * SPREAD_Y;
      arr[i * 3 + 2] = (Math.random() - 0.5) * SPREAD_XZ;
    }
    return arr;
  }, [targetY]);

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={PARTICLE_COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color={accent.neonGreen}
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        fog={false}
      />
    </points>
  );
}

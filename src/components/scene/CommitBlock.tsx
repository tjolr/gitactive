import { useRef, useState } from "react";
import { Html, RoundedBox } from "@react-three/drei";
import type { Mesh } from "three";
import type { CommitData } from "../../types";
import { authorColor, authorColorHex } from "../../lib/colors";

interface CommitBlockProps {
  commit: CommitData;
  position: [number, number, number];
  height: number;
}

export function CommitBlock({ commit, position, height }: CommitBlockProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = authorColorHex(commit.authorLogin);
  const cssColor = authorColor(commit.authorLogin);

  return (
    <group position={position}>
      <RoundedBox
        ref={meshRef}
        args={[2, height, 2]}
        radius={0.15}
        smoothness={4}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.6}
          emissive={color}
          emissiveIntensity={hovered ? 0.3 : 0.05}
        />
      </RoundedBox>

      {hovered && (
        <Html
          position={[1.5, 0, 0]}
          distanceFactor={8}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              background: "rgba(10, 10, 15, 0.9)",
              border: `1px solid ${cssColor}`,
              borderRadius: "8px",
              padding: "10px 14px",
              minWidth: "200px",
              fontFamily: "'SF Mono', monospace",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              {commit.authorAvatar && (
                <img
                  src={commit.authorAvatar}
                  alt=""
                  style={{ width: 20, height: 20, borderRadius: "50%" }}
                />
              )}
              <span style={{ color: cssColor, fontSize: "12px", fontWeight: 600 }}>
                {commit.authorLogin}
              </span>
            </div>
            <div style={{ color: "#e0e0e0", fontSize: "11px", marginBottom: "4px", lineHeight: 1.3 }}>
              {commit.title.length > 60 ? commit.title.slice(0, 60) + "..." : commit.title}
            </div>
            <div style={{ color: "#888899", fontSize: "10px" }}>
              {commit.shortSha} · +{commit.stats.additions} -{commit.stats.deletions}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

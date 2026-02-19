import { useRef, useState, useMemo, useEffect } from "react";
import { Html, RoundedBox, Text3D, Center } from "@react-three/drei";
import * as THREE from "three";
import type { CommitData } from "../../types";
import { authorColor, authorColorHex } from "../../lib/colors";

interface CommitBlockProps {
  commit: CommitData;
  position: [number, number, number];
  height: number;
}

export const BLOCK_WIDTH = 3;
const BLOCK_DEPTH = 3;
const AVATAR_RADIUS = 0.18;
const AVATAR_THICKNESS = 0.04;
const PADDING = 0.12;
const TEXT_SIZE = 0.1;
const TEXT_DEPTH = 0.025;
const LINE_HEIGHT = TEXT_SIZE * 1.35;
const SIDE_OFFSET = BLOCK_DEPTH / 2 + 0.01;

// Available width for text (block half-width minus avatar and padding)
const AVATAR_X = -BLOCK_WIDTH / 2 + PADDING + AVATAR_RADIUS;
const TEXT_LEFT = AVATAR_X + AVATAR_RADIUS + PADDING;
const TEXT_AREA_WIDTH = BLOCK_WIDTH / 2 - TEXT_LEFT - PADDING;

// Approximate chars per line for helvetiker bold at TEXT_SIZE
const CHAR_WIDTH = TEXT_SIZE * 0.62;
const CHARS_PER_LINE = Math.floor(TEXT_AREA_WIDTH / CHAR_WIDTH);

function wrapText(title: string, maxLines: number): string[] {
  const words = title.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (test.length > CHARS_PER_LINE && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    } else {
      current = test;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  // Truncate last line if needed
  const last = lines[lines.length - 1];
  if (last && last.length > CHARS_PER_LINE) {
    lines[lines.length - 1] = last.slice(0, CHARS_PER_LINE - 2) + "..";
  }

  // If we ran out of lines but have remaining text, add ellipsis to last line
  if (lines.length >= maxLines && current && !lines.includes(current)) {
    const lastLine = lines[lines.length - 1];
    if (!lastLine.endsWith("..")) {
      lines[lines.length - 1] =
        lastLine.length > CHARS_PER_LINE - 2
          ? lastLine.slice(0, CHARS_PER_LINE - 2) + ".."
          : lastLine + "..";
    }
  }

  return lines;
}

function useAvatarTexture(url: string | undefined) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) return;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    let cancelled = false;
    loader.load(
      url,
      (tex) => { if (!cancelled) setTexture(tex); },
      undefined,
      () => { /* silently fail */ }
    );
    return () => { cancelled = true; };
  }, [url]);

  return texture;
}

function AvatarCylinder({ url, color, position }: { url: string; color: number; position: [number, number, number] }) {
  const texture = useAvatarTexture(url);

  return (
    <group position={position}>
      {/* Front face with image */}
      <mesh position={[0, 0, AVATAR_THICKNESS / 2]}>
        <circleGeometry args={[AVATAR_RADIUS, 32]} />
        {texture ? (
          <meshStandardMaterial map={texture} side={THREE.FrontSide} />
        ) : (
          <meshStandardMaterial color={color} side={THREE.FrontSide} />
        )}
      </mesh>
      {/* Cylinder rim for depth */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[AVATAR_RADIUS, AVATAR_RADIUS, AVATAR_THICKNESS, 32, 1, true]} />
        <meshStandardMaterial color={0x222233} metalness={0.5} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function FaceContent({
  commit,
  color,
  lines,
  height,
}: {
  commit: CommitData;
  color: number;
  lines: string[];
  height: number;
}) {
  // Vertically center the content block (avatar + text lines)
  const totalTextHeight = lines.length * LINE_HEIGHT;
  const contentHeight = Math.max(AVATAR_RADIUS * 2, totalTextHeight);
  const _ = contentHeight; // used implicitly via centering
  void _;

  // Clamp avatar and text within block height
  const usableHeight = height - PADDING * 2;
  const maxContentHeight = Math.min(contentHeight, usableHeight);
  void maxContentHeight;

  return (
    <>
      <AvatarCylinder
        url={commit.authorAvatar}
        color={color}
        position={[AVATAR_X, 0, 0]}
      />
      <group position={[TEXT_LEFT, (totalTextHeight - LINE_HEIGHT) / 2, 0]}>
        {lines.map((line, i) => (
          <Center key={i} position={[TEXT_AREA_WIDTH / 2, -i * LINE_HEIGHT, 0]} cacheKey={line}>
            <Text3D
              font="/helvetiker_bold.typeface.json"
              size={TEXT_SIZE}
              height={TEXT_DEPTH}
              bevelEnabled
              bevelThickness={0.005}
              bevelSize={0.003}
              bevelSegments={2}
            >
              {line}
              <meshStandardMaterial
                color={0xffffff}
                metalness={0.1}
                roughness={0.5}
                emissive={0xffffff}
                emissiveIntensity={0.1}
              />
            </Text3D>
          </Center>
        ))}
      </group>
    </>
  );
}

export function CommitBlock({ commit, position, height }: CommitBlockProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = authorColorHex(commit.authorLogin);
  const cssColor = authorColor(commit.authorLogin);

  // Max lines based on block height
  const maxLines = useMemo(() => {
    const usable = height - PADDING * 2;
    return Math.max(1, Math.floor(usable / LINE_HEIGHT));
  }, [height]);

  const lines = useMemo(
    () => wrapText(commit.title, maxLines),
    [commit.title, maxLines]
  );

  const faceProps = { commit, color, lines, height };

  return (
    <group position={position}>
      <RoundedBox
        ref={meshRef}
        args={[BLOCK_WIDTH, height, BLOCK_DEPTH]}
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

      {/* Front face */}
      <group position={[0, 0, SIDE_OFFSET]}>
        <FaceContent {...faceProps} />
      </group>

      {/* Back face */}
      <group position={[0, 0, -SIDE_OFFSET]} rotation={[0, Math.PI, 0]}>
        <FaceContent {...faceProps} />
      </group>

      {/* Hover tooltip */}
      {hovered && (
        <Html
          position={[BLOCK_WIDTH / 2 + 0.5, 0, 0]}
          distanceFactor={8}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              background: "rgba(10, 10, 15, 0.9)",
              border: `1px solid ${cssColor}`,
              borderRadius: "8px",
              padding: "10px 14px",
              minWidth: "220px",
              fontFamily: "'SF Mono', monospace",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              {commit.authorAvatar && (
                <img
                  src={commit.authorAvatar}
                  alt=""
                  style={{ width: 22, height: 22, borderRadius: "50%" }}
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
              {commit.shortSha} · {commit.filesChanged} file{commit.filesChanged !== 1 ? "s" : ""} · +{commit.stats.additions} -{commit.stats.deletions}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

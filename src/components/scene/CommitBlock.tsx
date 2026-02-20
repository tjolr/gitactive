import { Center, Html, Text3D } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  authorColor,
  authorColorHex,
  darkenHex,
  timeAgo,
  timeAgoColor,
} from "../../lib/colors";
import { extColors, neutral, scene, stat, white } from "../../lib/palette";
import type { CommitData } from "../../types";
import {
  EXT_TO_LOGO,
  SmallLogoIcon,
  TechLogoMedallion,
} from "./TechLogoMedallion";

interface CommitBlockProps {
  commit: CommitData;
  position: [number, number, number];
  height: number;
}

export const BLOCK_WIDTH = 3;
const BLOCK_DEPTH = 3;
const AVATAR_RADIUS = 0.35;
const AVATAR_THICKNESS = 0.18;
const PADDING = 0.25;
export const MIN_BLOCK_HEIGHT = AVATAR_RADIUS * 2 + PADDING * 2;
const TEXT_SIZE = 0.09;
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

const AVATAR_RIM_COLOR = scene.rimHex;

function AvatarCylinder({
  url,
  position,
}: {
  url: string;
  position: [number, number, number];
}) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const protrude = AVATAR_THICKNESS * 0.6;
  const outerRadius = AVATAR_RADIUS + 0.03;

  useEffect(() => {
    if (!url || !matRef.current) return;
    let cancelled = false;

    fetch(url, { mode: "cors" })
      .then((res) => res.blob())
      .then((blob) => createImageBitmap(blob))
      .then((bitmap) => {
        if (cancelled || !matRef.current) return;
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(bitmap, 0, 0, 256, 256);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        matRef.current.map = tex;
        matRef.current.color.set(white.hex);
        matRef.current.needsUpdate = true;
      })
      .catch(() => {
        /* silently fail — keeps fallback color */
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <group position={[position[0], position[1], position[2] + protrude]}>
      {/* Front face with image */}
      <mesh position={[0, 0, AVATAR_THICKNESS / 2]}>
        <circleGeometry args={[AVATAR_RADIUS, 32]} />
        <meshBasicMaterial
          ref={matRef}
          color={AVATAR_RIM_COLOR}
          toneMapped={false}
          side={THREE.FrontSide}
        />
      </mesh>
      {/* Back cap */}
      <mesh position={[0, 0, -AVATAR_THICKNESS / 2]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[outerRadius, 32]} />
        <meshStandardMaterial color={AVATAR_RIM_COLOR} side={THREE.FrontSide} />
      </mesh>
      {/* Cylinder rim for depth */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry
          args={[outerRadius, outerRadius, AVATAR_THICKNESS, 32, 1, true]}
        />
        <meshStandardMaterial
          color={AVATAR_RIM_COLOR}
          metalness={0.4}
          roughness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

const STATS_SIZE = 0.09;
const STATS_SMALL = 0.07;
const STATS_BEVEL = {
  bevelEnabled: true,
  bevelThickness: 0.003,
  bevelSize: 0.002,
  bevelSegments: 2,
};
const SMALL_BEVEL = {
  bevelEnabled: true,
  bevelThickness: 0.002,
  bevelSize: 0.001,
  bevelSegments: 2,
};
const GREEN = stat.added;
const RED = stat.removed;
const STAT_GREY = stat.grey;

interface ExtBreakdown {
  ext: string;
  changes: number;
  pct: number;
  color: number;
}

function computeExtBreakdown(files: CommitData["files"]): ExtBreakdown[] {
  const byExt = new Map<string, number>();
  for (const f of files) {
    const dot = f.filename.lastIndexOf(".");
    const ext = dot >= 0 ? f.filename.slice(dot + 1).toLowerCase() : "other";
    byExt.set(ext, (byExt.get(ext) ?? 0) + f.changes);
  }
  const total = Array.from(byExt.values()).reduce((a, b) => a + b, 0) || 1;
  return Array.from(byExt.entries())
    .map(([ext, changes]) => ({
      ext,
      changes,
      pct: Math.round((changes / total) * 100),
      color: extColors[ext] ?? stat.grey,
    }))
    .sort((a, b) => b.changes - a.changes);
}

function FileStatsFace({
  commit,
  height,
  textDepth,
}: {
  commit: CommitData;
  height: number;
  textDepth: number;
}) {
  const filesText = `${commit.filesChanged} files changed`;
  const addText = `+${commit.stats.additions}`;
  const delText = `-${commit.stats.deletions}`;

  const cw = STATS_SIZE * 0.62;
  const gap = STATS_SIZE * 1.2;

  const filesW = filesText.length * cw;
  const addW = addText.length * cw;
  const delW = delText.length * cw;
  const bottomW = addW + gap + delW;

  const topY = height / 2 - PADDING - 0.05;
  const lineY = topY - STATS_SIZE * 1.4;

  const breakdown = useMemo(
    () => computeExtBreakdown(commit.files),
    [commit.files],
  );
  const maxFaceWidth = BLOCK_DEPTH - PADDING * 2;
  const barHeight = 0.06;

  // Bar starting Y below the +N -N line
  const barY = lineY - STATS_SIZE * 2.0;
  const cwSmall = STATS_SMALL * 0.62;

  return (
    <group>
      {/* files changed — top line */}
      <group position={[-filesW / 2, topY, 0]}>
        <Text3D
          font="/helvetiker_bold.typeface.json"
          size={STATS_SIZE}
          height={textDepth}
          {...STATS_BEVEL}
        >
          {filesText}
          <meshStandardMaterial
            color={white.hex}
            metalness={0.1}
            roughness={0.5}
            emissive={white.hex}
            emissiveIntensity={0.1}
          />
        </Text3D>
      </group>
      {/* +N -N */}
      <group position={[-bottomW / 2, lineY, 0]}>
        <group position={[0, 0, 0]}>
          <Text3D
            font="/helvetiker_bold.typeface.json"
            size={STATS_SIZE}
            height={textDepth}
            {...STATS_BEVEL}
          >
            {addText}
            <meshStandardMaterial
              color={GREEN}
              metalness={0.1}
              roughness={0.5}
              emissive={GREEN}
              emissiveIntensity={0.25}
            />
          </Text3D>
        </group>
        <group position={[addW + gap, 0, 0]}>
          <Text3D
            font="/helvetiker_bold.typeface.json"
            size={STATS_SIZE}
            height={textDepth}
            {...STATS_BEVEL}
          >
            {delText}
            <meshStandardMaterial
              color={RED}
              metalness={0.1}
              roughness={0.5}
              emissive={RED}
              emissiveIntensity={0.25}
            />
          </Text3D>
        </group>
      </group>

      {/* Stacked percentage bar */}
      {(() => {
        const barDepth = 0.08;
        const barProtrude = barDepth * 0.6;
        let xOff = -maxFaceWidth / 2;
        return breakdown.map((b, i) => {
          const w = (b.pct / 100) * maxFaceWidth;
          const x = xOff + w / 2;
          xOff += w;
          const segW = Math.max(w - 0.01, 0.01);
          return (
            <group key={i} position={[x, barY, barProtrude]}>
              <mesh>
                <boxGeometry args={[segW, barHeight, barDepth]} />
                <meshStandardMaterial
                  color={b.color}
                  metalness={0.35}
                  roughness={0.35}
                  emissive={b.color}
                  emissiveIntensity={0.2}
                />
              </mesh>
              {/* Edge highlight */}
              <lineSegments>
                <edgesGeometry
                  args={[new THREE.BoxGeometry(segW, barHeight, barDepth)]}
                />
                <lineBasicMaterial
                  color={b.color}
                  toneMapped={false}
                  transparent
                  opacity={0.5}
                />
              </lineSegments>
            </group>
          );
        });
      })()}

      {/* Extension labels below bar — horizontal row */}
      {(() => {
        const items = breakdown.slice(0, 4);
        const maxPct = Math.max(...items.map((b) => b.pct), 1);
        const y = barY - barHeight / 2 - 0.3;
        const baseIconSize = 0.28;
        const dotSize = 0.1;
        const MIN_SCALE = 0.5;
        const MAX_SCALE = 1.6;
        // Calculate total width to center the row
        let totalW = 0;
        const itemWidths: number[] = [];
        const scales: number[] = [];
        for (const b of items) {
          const logo = EXT_TO_LOGO[b.ext];
          const s = MIN_SCALE + (b.pct / maxPct) * (MAX_SCALE - MIN_SCALE);
          scales.push(s);
          const iconW = logo ? baseIconSize * s : dotSize;
          const label = `.${b.ext} ${b.pct}%`;
          const labelW = label.length * cwSmall;
          const itemW = iconW + labelW + 0.1;
          itemWidths.push(itemW);
          totalW += itemW;
        }
        let xOff = -totalW / 2;
        return items.map((b, i) => {
          const logo = EXT_TO_LOGO[b.ext];
          const label = `.${b.ext} ${b.pct}%`;
          const s = scales[i];
          const iconW = logo ? baseIconSize * s : dotSize;
          const x = xOff;
          xOff += itemWidths[i];
          return (
            <group key={b.ext}>
              {logo ? (
                <SmallLogoIcon
                  language={logo}
                  scale={s}
                  position={[
                    x + iconW / 2,
                    y + STATS_SMALL * 0.35,
                    textDepth / 2,
                  ]}
                />
              ) : (
                <mesh
                  position={[
                    x + iconW / 2,
                    y + STATS_SMALL * 0.35,
                    textDepth / 2,
                  ]}
                >
                  <circleGeometry args={[0.03 * s, 16]} />
                  <meshStandardMaterial
                    color={b.color}
                    emissive={b.color}
                    emissiveIntensity={0.3}
                  />
                </mesh>
              )}
              <group position={[x + iconW, y, 0]}>
                <Text3D
                  font="/helvetiker_bold.typeface.json"
                  size={STATS_SMALL}
                  height={textDepth}
                  {...SMALL_BEVEL}
                >
                  {label}
                  <meshStandardMaterial
                    color={STAT_GREY}
                    metalness={0.1}
                    roughness={0.5}
                    emissive={STAT_GREY}
                    emissiveIntensity={0.1}
                  />
                </Text3D>
              </group>
            </group>
          );
        });
      })()}
    </group>
  );
}

function FaceContent({
  commit,
  lines,
  height,
  textDepth,
  relTime,
  timeColor,
}: {
  commit: CommitData;
  lines: string[];
  height: number;
  textDepth: number;
  relTime: string;
  timeColor: number;
}) {
  // Vertically center the content block (avatar + text lines)
  const totalTextHeight = lines.length * LINE_HEIGHT;

  return (
    <>
      <AvatarCylinder url={commit.authorAvatar} position={[AVATAR_X, 0, 0]} />
      <group position={[TEXT_LEFT, (totalTextHeight - LINE_HEIGHT) / 2, 0]}>
        {lines.map((line, i) => (
          <Center
            key={i}
            position={[TEXT_AREA_WIDTH / 2, -i * LINE_HEIGHT, 0]}
            cacheKey={line}
          >
            <Text3D
              font="/helvetiker_bold.typeface.json"
              size={TEXT_SIZE}
              height={textDepth}
              bevelEnabled
              bevelThickness={0.005}
              bevelSize={0.003}
              bevelSegments={2}
            >
              {line}
              <meshStandardMaterial
                color={white.hex}
                metalness={0.1}
                roughness={0.5}
                emissive={white.hex}
                emissiveIntensity={0.1}
              />
            </Text3D>
          </Center>
        ))}
      </group>
      {/* Time since — top right corner */}
      <group
        position={[BLOCK_WIDTH / 2 - PADDING, height / 2 - PADDING - 0.05, 0]}
      >
        <Center left top>
          <Text3D
            font="/helvetiker_bold.typeface.json"
            size={0.1}
            height={textDepth}
            bevelEnabled
            bevelThickness={0.003}
            bevelSize={0.002}
            bevelSegments={2}
          >
            {relTime}
            <meshStandardMaterial
              color={timeColor}
              metalness={0.1}
              roughness={0.5}
              emissive={timeColor}
              emissiveIntensity={0.15}
            />
          </Text3D>
        </Center>
      </group>
    </>
  );
}

export function CommitBlock({ commit, position, height }: CommitBlockProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = authorColorHex(commit.authorLogin);
  const cssColor = authorColor(commit.authorLogin);
  const { hex: timeColor, css: timeCssColor } = useMemo(
    () => timeAgoColor(commit.date),
    [commit.date],
  );
  const textDepth = 0;

  // Max lines based on block height
  const maxLines = useMemo(() => {
    const usable = height - PADDING * 2;
    return Math.max(1, Math.floor(usable / LINE_HEIGHT));
  }, [height]);

  const lines = useMemo(
    () => wrapText(commit.title, maxLines),
    [commit.title, maxLines],
  );

  const relTime = useMemo(() => timeAgo(commit.date), [commit.date]);
  const faceProps = {
    commit,
    color,
    lines,
    height,
    textDepth,
    relTime,
    timeColor,
  };

  return (
    <group position={position}>
      {/* Main block — darker tinted faces */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[BLOCK_WIDTH, height, BLOCK_DEPTH]} />
        <meshStandardMaterial
          color={darkenHex(color, 0.55)}
          metalness={0.3}
          roughness={0.6}
          emissive={color}
          emissiveIntensity={hovered ? 0.15 : 0.03}
        />
      </mesh>

      {/* Bright border edges */}
      <lineSegments>
        <edgesGeometry
          args={[new THREE.BoxGeometry(BLOCK_WIDTH, height, BLOCK_DEPTH)]}
        />
        <lineBasicMaterial color={color} toneMapped={false} />
      </lineSegments>

      {/* Front face */}
      <group position={[0, 0, SIDE_OFFSET]}>
        <FaceContent {...faceProps} />
      </group>

      {/* Back face */}
      <group position={[0, 0, -SIDE_OFFSET]} rotation={[0, Math.PI, 0]}>
        <FaceContent {...faceProps} />
      </group>

      {/* Left face — tech logo */}
      {commit.primaryLanguage && (
        <group
          position={[-BLOCK_WIDTH / 2 - 0.01, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <TechLogoMedallion language={commit.primaryLanguage} />
        </group>
      )}

      {/* Right face — file stats */}
      <group
        position={[BLOCK_WIDTH / 2 + 0.01, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <FileStatsFace commit={commit} height={height} textDepth={textDepth} />
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
              }}
            >
              {commit.authorAvatar && (
                <img
                  src={commit.authorAvatar}
                  alt=""
                  style={{ width: 22, height: 22, borderRadius: "50%" }}
                />
              )}
              <span
                style={{ color: cssColor, fontSize: "12px", fontWeight: 600 }}
              >
                {commit.authorLogin}
              </span>
            </div>
            <div
              style={{
                color: neutral[100],
                fontSize: "11px",
                marginBottom: "4px",
                lineHeight: 1.3,
              }}
            >
              {commit.title.length > 60
                ? commit.title.slice(0, 60) + "..."
                : commit.title}
            </div>
            <div
              style={{
                color: timeCssColor,
                fontSize: "10px",
                marginBottom: "4px",
              }}
            >
              {timeAgo(commit.date)}
            </div>
            <div style={{ color: neutral[500], fontSize: "10px" }}>
              {commit.shortSha} · {commit.filesChanged} file
              {commit.filesChanged !== 1 ? "s" : ""} · +{commit.stats.additions}{" "}
              -{commit.stats.deletions}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

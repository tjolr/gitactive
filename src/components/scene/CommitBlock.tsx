import { Center, Html, Text3D } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  authorColor,
  authorColorHex,
  darkenHex,
  timeAgo,
  timeAgoColor,
  timeHasGlow,
} from "../../lib/colors";
import { extColors, neutral, scene, stat, white } from "../../lib/palette";
import type { CommitData } from "../../types";
import { EXT_TO_LOGO, SmallLogoIcon } from "./TechLogoMedallion";
import { DirectoryTreeFace } from "./DirectoryTreeFace";
import { BuildStatusFace } from "./BuildStatusFace";

interface CommitBlockProps {
  commit: CommitData;
  position: [number, number, number];
  height: number;
  /** Wall-clock timestamp (ms) when this commit first appeared. Drives entry animation + glow. */
  newSince?: number;
  commitUrl?: string;
}

const ENTRY_Y_OFFSET = 16; // units above final position
const SPRING_K = 0.35; // spring stiffness — lower = slower, more floaty
const SPRING_DAMP = 1.2; // damping — overdamped, no bounce

const GLOW_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// Regular octagon: all 8 sides = OCT_SIDE
const OCT_SIDE = 3;
const N_SIDES = 8;
const FRONT_FACE_WIDTH = OCT_SIDE;
const OCT_APOTHEM = OCT_SIDE / 2 / Math.tan(Math.PI / N_SIDES); // ≈3.621
const OCT_CIRCUMRADIUS = OCT_SIDE / 2 / Math.sin(Math.PI / N_SIDES); // ≈3.921
export const BLOCK_WIDTH = 2 * OCT_APOTHEM; // ≈7.243

// Vertices in XZ plane, counterclockwise from front-right
// Vertex k at angle (π/N + k·2π/N) from +Z
const OCT_VERTS: [number, number][] = Array.from(
  { length: N_SIDES },
  (_, k) => {
    const angle = Math.PI / N_SIDES + k * ((2 * Math.PI) / N_SIDES);
    return [
      OCT_CIRCUMRADIUS * Math.sin(angle),
      OCT_CIRCUMRADIUS * Math.cos(angle),
    ];
  },
);

// Face k has outward normal at angle k·2π/N from +Z
// Face center at (apothem·sin(θ), apothem·cos(θ))
// Face 0 = front (+Z), face 1 = front-right, ... face 7 = front-left
const FACE_ANGLES = Array.from(
  { length: N_SIDES },
  (_, k) => k * ((2 * Math.PI) / N_SIDES),
);

const AVATAR_RADIUS = 0.25;
const AVATAR_THICKNESS = 0.14;
const PADDING = 0.15;
export const MIN_BLOCK_HEIGHT = (AVATAR_RADIUS * 2 + PADDING * 2) * 1.5;
const TEXT_SIZE = 0.09;
const LINE_HEIGHT = TEXT_SIZE * 1.35;

// Available width for text (front face half-width minus avatar and padding)
const AVATAR_X = -FRONT_FACE_WIDTH / 2 + PADDING + AVATAR_RADIUS;
const TEXT_LEFT = AVATAR_X + AVATAR_RADIUS + PADDING;
const TEXT_AREA_WIDTH = FRONT_FACE_WIDTH / 2 - TEXT_LEFT - PADDING;

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
  const { invalidate } = useThree();
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
        invalidate();
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

function FileListFace({
  commit,
  height,
  textDepth,
  faceWidth = OCT_SIDE,
}: {
  commit: CommitData;
  height: number;
  textDepth: number;
  faceWidth?: number;
}) {
  const maxW = faceWidth - PADDING * 2;
  const lineH = STATS_SMALL * 1.45;
  // Empirical char width for helvetiker bold at STATS_SMALL size in 3D
  const cwSmall = STATS_SMALL * 0.75;

  // Header stats
  const filesText = `${commit.filesChanged} files changed`;
  const addText = `+${commit.stats.additions}`;
  const delText = `-${commit.stats.deletions}`;
  const cw = STATS_SIZE * 0.62;
  const gap = STATS_SIZE * 1.2;
  const filesW = filesText.length * cw;
  const addW = addText.length * cw;
  const delW = delText.length * cw;
  const bottomW = addW + gap + delW;

  const usable = height - PADDING * 2 - STATS_SIZE * 3; // Account for header
  const maxRows = Math.max(1, Math.floor(usable / lineH));

  const files = commit.files.slice(0, maxRows);
  const hasMore = commit.files.length > maxRows;

  // Build stats string per file so we can reserve exact width
  const fileEntries = files.map((f) => {
    const parts: string[] = [];
    if (f.additions > 0) parts.push(`+${f.additions}`);
    if (f.deletions > 0) parts.push(`-${f.deletions}`);
    const statsStr = parts.join(" ");
    // Reserve space for stats + gap (3 char gap between name and stats)
    const statsChars = statsStr.length > 0 ? statsStr.length + 3 : 0;
    const nameMax = Math.min(
      50,
      Math.max(6, Math.floor(maxW / cwSmall) - statsChars),
    );
    let name = f.filename;
    if (name.length > nameMax) {
      name = ".." + name.slice(name.length - nameMax + 2);
    }
    return {
      name,
      statsStr,
      additions: f.additions,
      deletions: f.deletions,
      nameMax,
    };
  });

  // Position file list below the header (with spacing)
  const headerEndY = height / 2 - PADDING - 0.05 - STATS_SIZE * 1.4 - 0.2;
  const topY = headerEndY - STATS_SMALL * 0.5;

  return (
    <group>
      {/* Header: files changed and stats */}
      <group position={[-filesW / 2, height / 2 - PADDING - 0.05, 0]}>
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
      {/* +N -N stats line */}
      <group
        position={[
          -bottomW / 2,
          height / 2 - PADDING - 0.05 - STATS_SIZE * 1.4,
          0,
        ]}
      >
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

      {/* File list entries */}
      {fileEntries.map((entry, i) => {
        const y = topY - i * lineH;
        const nameX = -maxW / 2;
        // Right-align stats at the face edge
        const statsW = entry.statsStr.length * cwSmall;
        const statsX = maxW / 2 - statsW;

        const addStr = entry.additions > 0 ? `+${entry.additions}` : "";
        const delStr = entry.deletions > 0 ? `-${entry.deletions}` : "";
        const delX = addStr ? statsX + (addStr.length + 1) * cwSmall : statsX;

        return (
          <group key={i} position={[0, y, 0]}>
            {/* Filename */}
            <group position={[nameX, 0, 0]}>
              <Text3D
                font="/helvetiker_bold.typeface.json"
                size={STATS_SMALL}
                height={textDepth}
                {...SMALL_BEVEL}
              >
                {entry.name}
                <meshStandardMaterial
                  color={white.hex}
                  metalness={0.1}
                  roughness={0.5}
                  emissive={white.hex}
                  emissiveIntensity={0.08}
                />
              </Text3D>
            </group>
            {/* +N right-aligned */}
            {addStr && (
              <group position={[statsX, 0, 0]}>
                <Text3D
                  font="/helvetiker_bold.typeface.json"
                  size={STATS_SMALL}
                  height={textDepth}
                  {...SMALL_BEVEL}
                >
                  {addStr}
                  <meshStandardMaterial
                    color={GREEN}
                    metalness={0.1}
                    roughness={0.5}
                    emissive={GREEN}
                    emissiveIntensity={0.2}
                  />
                </Text3D>
              </group>
            )}
            {/* -N right-aligned */}
            {delStr && (
              <group position={[delX, 0, 0]}>
                <Text3D
                  font="/helvetiker_bold.typeface.json"
                  size={STATS_SMALL}
                  height={textDepth}
                  {...SMALL_BEVEL}
                >
                  {delStr}
                  <meshStandardMaterial
                    color={RED}
                    metalness={0.1}
                    roughness={0.5}
                    emissive={RED}
                    emissiveIntensity={0.2}
                  />
                </Text3D>
              </group>
            )}
          </group>
        );
      })}
      {/* "and N more" indicator */}
      {hasMore && (
        <group position={[-maxW / 2, topY - files.length * lineH, 0]}>
          <Text3D
            font="/helvetiker_bold.typeface.json"
            size={STATS_SMALL * 0.85}
            height={textDepth}
            {...SMALL_BEVEL}
          >
            {`+${commit.files.length - maxRows} more`}
            <meshStandardMaterial
              color={STAT_GREY}
              metalness={0.1}
              roughness={0.5}
              emissive={STAT_GREY}
              emissiveIntensity={0.1}
            />
          </Text3D>
        </group>
      )}
    </group>
  );
}

function FileStatsFace({
  commit,
}: {
  commit: CommitData;
  height?: number;
  textDepth?: number;
  faceWidth?: number;
}) {
  const breakdown = useMemo(
    () => computeExtBreakdown(commit.files),
    [commit.files],
  );

  return (
    <group>
      {/* Pie chart for file type percentages */}
      <group position={[0, 0, 0]}>
        {(() => {
          const pieRadius = 0.55;
          const pieDepth = 0.18;
          const items = breakdown.slice(0, 6);

          // Create pie slices
          let currentAngle = 0;
          const slices = items.map((b) => {
            const sliceAngle = (b.pct / 100) * Math.PI * 2;
            const slice = {
              color: b.color,
              startAngle: currentAngle,
              endAngle: currentAngle + sliceAngle,
              ext: b.ext,
              pct: b.pct,
            };
            currentAngle += sliceAngle;
            return slice;
          });

          return slices.map((slice, i) => {
            // Create pie segment geometry
            const segments = Math.max(
              4,
              Math.ceil((slice.endAngle - slice.startAngle) * 32),
            );
            const points: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)]; // center

            // Add arc points
            for (let j = 0; j <= segments; j++) {
              const angle =
                slice.startAngle +
                (j / segments) * (slice.endAngle - slice.startAngle);
              points.push(
                new THREE.Vector3(
                  Math.cos(angle) * pieRadius,
                  Math.sin(angle) * pieRadius,
                  0,
                ),
              );
            }

            const geo = new THREE.BufferGeometry();
            geo.setFromPoints(points);
            const indices = [];
            for (let j = 1; j < points.length - 1; j++) {
              indices.push(0, j, j + 1);
            }
            geo.setIndex(
              new THREE.BufferAttribute(new Uint32Array(indices), 1),
            );
            geo.computeVertexNormals();

            return (
              <group key={i} position={[0, 0, pieDepth / 2]}>
                {/* Front and back faces */}
                <mesh geometry={geo} position={[0, 0, pieDepth / 2]}>
                  <meshStandardMaterial
                    color={slice.color}
                    metalness={0.3}
                    roughness={0.4}
                    emissive={slice.color}
                    emissiveIntensity={0.15}
                    side={THREE.FrontSide}
                  />
                </mesh>
                <mesh
                  geometry={geo}
                  position={[0, 0, -pieDepth / 2]}
                  scale={[1, 1, -1]}
                >
                  <meshStandardMaterial
                    color={slice.color}
                    metalness={0.3}
                    roughness={0.4}
                    emissive={slice.color}
                    emissiveIntensity={0.1}
                    side={THREE.FrontSide}
                  />
                </mesh>

                {/* Outer arc wall */}
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                  <cylinderGeometry
                    args={[
                      pieRadius,
                      pieRadius,
                      pieDepth,
                      segments,
                      1,
                      true,
                      slice.startAngle + Math.PI / 2,
                      slice.endAngle - slice.startAngle,
                    ]}
                  />
                  <meshStandardMaterial
                    color={slice.color}
                    metalness={0.3}
                    roughness={0.4}
                    emissive={slice.color}
                    emissiveIntensity={0.1}
                    side={THREE.DoubleSide}
                  />
                </mesh>

                {/* Radial edge walls */}
                {(() => {
                  // Start edge quad
                  const startX = Math.cos(slice.startAngle) * pieRadius;
                  const startY = Math.sin(slice.startAngle) * pieRadius;
                  const startGeo = new THREE.BufferGeometry();
                  const startVertices = new Float32Array([
                    0,
                    0,
                    -pieDepth / 2,
                    startX,
                    startY,
                    -pieDepth / 2,
                    startX,
                    startY,
                    pieDepth / 2,
                    0,
                    0,
                    pieDepth / 2,
                  ]);
                  startGeo.setAttribute(
                    "position",
                    new THREE.BufferAttribute(startVertices, 3),
                  );
                  startGeo.setIndex(
                    new THREE.BufferAttribute(
                      new Uint32Array([0, 1, 2, 0, 2, 3]),
                      1,
                    ),
                  );
                  startGeo.computeVertexNormals();

                  // End edge quad
                  const endX = Math.cos(slice.endAngle) * pieRadius;
                  const endY = Math.sin(slice.endAngle) * pieRadius;
                  const endGeo = new THREE.BufferGeometry();
                  const endVertices = new Float32Array([
                    0,
                    0,
                    -pieDepth / 2,
                    endX,
                    endY,
                    -pieDepth / 2,
                    endX,
                    endY,
                    pieDepth / 2,
                    0,
                    0,
                    pieDepth / 2,
                  ]);
                  endGeo.setAttribute(
                    "position",
                    new THREE.BufferAttribute(endVertices, 3),
                  );
                  endGeo.setIndex(
                    new THREE.BufferAttribute(
                      new Uint32Array([0, 1, 2, 0, 2, 3]),
                      1,
                    ),
                  );
                  endGeo.computeVertexNormals();

                  return (
                    <>
                      <mesh geometry={startGeo}>
                        <meshStandardMaterial
                          color={slice.color}
                          metalness={0.3}
                          roughness={0.4}
                          emissive={slice.color}
                          emissiveIntensity={0.1}
                          side={THREE.DoubleSide}
                        />
                      </mesh>
                      <mesh geometry={endGeo}>
                        <meshStandardMaterial
                          color={slice.color}
                          metalness={0.3}
                          roughness={0.4}
                          emissive={slice.color}
                          emissiveIntensity={0.1}
                          side={THREE.DoubleSide}
                        />
                      </mesh>
                    </>
                  );
                })()}
              </group>
            );
          });
        })()}

        {/* Logos and percentages ON the pie slices */}
        {(() => {
          const items = breakdown.slice(0, 6);
          const pieRadius = 0.55;
          const pieDepth = 0.18;
          const logoDistance = pieRadius * 0.5; // position logos at 50% of radius
          const percentDistance = pieRadius * 0.35; // position percentages more centrally

          let currentAngle = 0;
          return items.map((b) => {
            const sliceAngle = (b.pct / 100) * Math.PI * 2;
            const midAngle = currentAngle + sliceAngle / 2;
            currentAngle += sliceAngle;

            const logo = EXT_TO_LOGO[b.ext];
            const label = `${b.pct}%`;

            // Position logo on outer part of slice
            const logoX = Math.cos(midAngle) * logoDistance;
            const logoY = Math.sin(midAngle) * logoDistance;

            // Position percentage offset perpendicular to the slice angle
            // This avoids collision with the logo
            const perpAngle = midAngle + Math.PI / 2;
            const percentX =
              Math.cos(midAngle) * percentDistance + Math.cos(perpAngle) * 0.25;
            const percentY =
              Math.sin(midAngle) * percentDistance + Math.sin(perpAngle) * 0.25;

            return (
              <group key={b.ext}>
                {/* Logo/icon on the slice */}
                {logo ? (
                  <SmallLogoIcon
                    language={logo}
                    scale={0.9}
                    position={[logoX, logoY, pieDepth + 0.05]}
                  />
                ) : (
                  <mesh position={[logoX, logoY, pieDepth + 0.05]}>
                    <circleGeometry args={[0.02, 16]} />
                    <meshStandardMaterial
                      color={white.hex}
                      emissive={white.hex}
                      emissiveIntensity={0.3}
                    />
                  </mesh>
                )}

                {/* Percentage label - centered on the slice, rendered on top */}
                <group position={[percentX, percentY, pieDepth + 0.02]}>
                  <Text3D
                    font="/helvetiker_bold.typeface.json"
                    size={STATS_SMALL * 0.85}
                    height={0.01}
                    {...SMALL_BEVEL}
                  >
                    {label}
                    <meshStandardMaterial
                      color={white.hex}
                      metalness={0.1}
                      roughness={0.5}
                      emissive={white.hex}
                      emissiveIntensity={0.8}
                    />
                  </Text3D>
                </group>
              </group>
            );
          });
        })()}
      </group>
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
  timeHasGlowEffect,
}: {
  commit: CommitData;
  lines: string[];
  height: number;
  textDepth: number;
  relTime: string;
  timeColor: number;
  timeHasGlowEffect: boolean;
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
        position={[
          FRONT_FACE_WIDTH / 2 - PADDING,
          height / 2 - PADDING - 0.05,
          0,
        ]}
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
              emissiveIntensity={timeHasGlowEffect ? 0.7 : 0.15}
            />
          </Text3D>
        </Center>
      </group>
    </>
  );
}

export function CommitBlock({
  commit,
  position,
  height,
  newSince,
  commitUrl,
}: CommitBlockProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const yOffsetRef = useRef(newSince !== undefined ? ENTRY_Y_OFFSET : 0);
  const yVelocityRef = useRef(0);
  const [hovered, setHovered] = useState(false);

  const { invalidate } = useThree();

  // Static glow: compute color once on mount, then update via interval (every 60s)
  // instead of every frame. This avoids calling invalidate() continuously.
  const updateGlow = () => {
    if (!glowMatRef.current) return;
    const glowAge =
      newSince !== undefined ? Date.now() - newSince : GLOW_DURATION_MS;
    const isGlowing = glowAge < GLOW_DURATION_MS;

    if (!isGlowing) {
      glowMatRef.current.visible = false;
      invalidate();
      return;
    }

    const t = 1 - glowAge / GLOW_DURATION_MS; // 1 → 0
    const intensity = t; // no flicker — stable glow
    const r = intensity * 8.0;
    const g = intensity * (1.0 + 3.0 * t);
    const b = intensity * 0.4 * t;
    glowMatRef.current.color.setRGB(r, g, b);
    glowMatRef.current.opacity = Math.min(1.0, intensity * 2.5);
    glowMatRef.current.visible = true;
    invalidate();
  };

  useEffect(() => {
    if (newSince === undefined) return;
    // Initial glow update (after mount, once ref is available)
    const initialTimeout = setTimeout(updateGlow, 0);
    // Update glow every 60 seconds
    const interval = setInterval(updateGlow, 60_000);
    // Stop after glow duration
    const expireTimeout = setTimeout(() => {
      clearInterval(interval);
      updateGlow(); // final update to hide
    }, GLOW_DURATION_MS);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      clearTimeout(expireTimeout);
    };
  }, [newSince]);

  useFrame((_, delta) => {
    const isAnimating = yOffsetRef.current !== 0 || yVelocityRef.current !== 0;

    if (!isAnimating) return;

    // Spring-based Y entry animation
    const dt = Math.min(delta, 0.05);
    const springForce = -SPRING_K * yOffsetRef.current;
    const dampForce = -SPRING_DAMP * yVelocityRef.current;
    yVelocityRef.current += (springForce + dampForce) * dt;
    yOffsetRef.current += yVelocityRef.current * dt;
    if (
      Math.abs(yOffsetRef.current) < 0.001 &&
      Math.abs(yVelocityRef.current) < 0.001
    ) {
      yOffsetRef.current = 0;
      yVelocityRef.current = 0;
    }
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + yOffsetRef.current;
    }

    invalidate();
  });
  // Tick every 30s so relative timestamps stay fresh
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const color = authorColorHex(commit.authorLogin);
  const cssColor = authorColor(commit.authorLogin);
  const { hex: timeColor, css: timeCssColor } = useMemo(
    () => timeAgoColor(commit.date),
    [commit.date, tick],
  );
  const timeHasGlowEffect = useMemo(
    () => timeHasGlow(commit.date),
    [commit.date, tick],
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

  const relTime = useMemo(() => timeAgo(commit.date), [commit.date, tick]);
  const faceProps = {
    commit,
    color,
    lines,
    height,
    textDepth,
    relTime,
    timeColor,
    timeHasGlowEffect,
  };

  // Octagonal prism geometry (XZ cross-section, extruded along Y)
  const octGeo = useMemo(() => {
    const shape = new THREE.Shape();
    // Start at last vertex (front-left), then trace all 8 vertices
    shape.moveTo(OCT_VERTS[N_SIDES - 1][0], OCT_VERTS[N_SIDES - 1][1]);
    for (const [x, z] of OCT_VERTS) {
      shape.lineTo(x, z);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
    });
    // Extrude goes along +Z; rotate so it goes along +Y, centered
    geo.translate(0, 0, -height / 2);
    geo.rotateX(Math.PI / 2);
    return geo;
  }, [height]);

  // Face position helper: face center at apothem distance along normal
  const faceD = OCT_APOTHEM + 0.01;

  // Track pointer-down position to distinguish clicks from drags
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const CLICK_THRESHOLD = 5; // pixels

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1] + yOffsetRef.current, position[2]]}
    >
      {/* Main octagonal prism */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          if (commitUrl) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "";
        }}
        onPointerDown={(e) => {
          pointerDownPos.current = { x: e.clientX, y: e.clientY };
        }}
        onClick={(e) => {
          if (commitUrl && pointerDownPos.current) {
            const dx = e.clientX - pointerDownPos.current.x;
            const dy = e.clientY - pointerDownPos.current.y;
            if (Math.sqrt(dx * dx + dy * dy) < CLICK_THRESHOLD) {
              e.stopPropagation();
              window.open(commitUrl, "_blank", "noopener");
            }
          }
          pointerDownPos.current = null;
        }}
        castShadow
        receiveShadow
      >
        <primitive object={octGeo} attach="geometry" />
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
        <edgesGeometry args={[octGeo]} />
        <lineBasicMaterial color={color} toneMapped={false} />
      </lineSegments>

      {/* Face 0: Front (+Z) — commit info */}
      <group position={[0, 0, faceD]} rotation={[0, 0, 0]}>
        <FaceContent {...faceProps} />
      </group>

      {/* Face 1: Front-right — file stats */}
      <group
        position={[
          Math.sin(FACE_ANGLES[1]) * faceD,
          0,
          Math.cos(FACE_ANGLES[1]) * faceD,
        ]}
        rotation={[0, FACE_ANGLES[1], 0]}
      >
        <FileStatsFace
          commit={commit}
          height={height}
          textDepth={textDepth}
          faceWidth={OCT_SIDE}
        />
      </group>

      {/* Face 7: Front-left — file list */}
      {commit.files.length > 0 && (
        <group
          position={[
            Math.sin(FACE_ANGLES[7]) * faceD,
            0,
            Math.cos(FACE_ANGLES[7]) * faceD,
          ]}
          rotation={[0, FACE_ANGLES[7], 0]}
        >
          <FileListFace
            commit={commit}
            height={height}
            textDepth={textDepth}
            faceWidth={OCT_SIDE}
          />
        </group>
      )}

      {/* Face 6: Left — directory tree */}
      {commit.files.length > 0 && (
        <group
          position={[
            Math.sin(FACE_ANGLES[6]) * faceD,
            0,
            Math.cos(FACE_ANGLES[6]) * faceD,
          ]}
          rotation={[0, FACE_ANGLES[6], 0]}
        >
          <DirectoryTreeFace
            commit={commit}
            height={height}
            textDepth={textDepth}
            faceWidth={OCT_SIDE}
          />
        </group>
      )}

      {/* Face 2: Right — CI build status */}
      <group
        position={[
          Math.sin(FACE_ANGLES[2]) * faceD,
          0,
          Math.cos(FACE_ANGLES[2]) * faceD,
        ]}
        rotation={[0, FACE_ANGLES[2], 0]}
      >
        <BuildStatusFace
          checkRuns={commit.checkRuns}
          height={height}
          textDepth={textDepth}
          faceWidth={OCT_SIDE}
        />
      </group>

      {/* Faces 3,4,5: empty */}

      {/* Fire aura — outer shell slightly wider than the block, rendered only as a
          fringe beyond the block's silhouette (depth-tested away where it overlaps).
          HDR fire colors drive the existing bloom into a recency glow. */}
      {newSince !== undefined && (
        <group scale={[1.005, 1.005, 1.005]}>
          <mesh renderOrder={2}>
            <primitive object={octGeo} attach="geometry" />
            <meshBasicMaterial
              ref={glowMatRef}
              color="#ff8800"
              transparent
              opacity={0.8}
              toneMapped={false}
              depthWrite={false}
              side={THREE.BackSide}
            />
          </mesh>
        </group>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <Html
          position={[OCT_APOTHEM + 0.5, 0, 0]}
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

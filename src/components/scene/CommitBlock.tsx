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
} from "../../lib/colors";
import { extColors, neutral, scene, stat, white } from "../../lib/palette";
import type { CommitData } from "../../types";
import {
  EXT_TO_LOGO,
  SmallLogoIcon,
} from "./TechLogoMedallion";

interface CommitBlockProps {
  commit: CommitData;
  position: [number, number, number];
  height: number;
  /** Wall-clock timestamp (ms) when this commit first appeared. Drives entry animation + glow. */
  newSince?: number;
  commitUrl?: string;
}

const ENTRY_Y_OFFSET = 16; // units above final position
const SPRING_K = 0.16;     // spring stiffness — lower = slower, more floaty
const SPRING_DAMP = 0.7;   // damping — slightly underdamped for gentle bounce

const GLOW_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const GLOW_MAX_EXTRA = 1.97;             // added on top of base emissiveIntensity at t=0

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

  const usable = height - PADDING * 2;
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
    const nameMax = Math.min(50, Math.max(6, Math.floor(maxW / cwSmall) - statsChars));
    let name = f.filename;
    if (name.length > nameMax) {
      name = ".." + name.slice(name.length - nameMax + 2);
    }
    return { name, statsStr, additions: f.additions, deletions: f.deletions, nameMax };
  });

  const topY = usable / 2 - STATS_SMALL * 0.5;

  return (
    <group>
      {fileEntries.map((entry, i) => {
        const y = topY - i * lineH;
        const nameX = -maxW / 2;
        // Right-align stats at the face edge
        const statsW = entry.statsStr.length * cwSmall;
        const statsX = maxW / 2 - statsW;

        const addStr = entry.additions > 0 ? `+${entry.additions}` : "";
        const delStr = entry.deletions > 0 ? `-${entry.deletions}` : "";
        const delX = addStr
          ? statsX + (addStr.length + 1) * cwSmall
          : statsX;

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
  height,
  textDepth,
  faceWidth = OCT_SIDE,
}: {
  commit: CommitData;
  height: number;
  textDepth: number;
  faceWidth?: number;
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
  const maxFaceWidth = faceWidth - PADDING * 2;
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
        // Precompute positions to avoid mutable xOff during render
        const segments = breakdown.reduce<
          { x: number; w: number; color: number }[]
        >((acc, b) => {
          const prevEnd =
            acc.length > 0
              ? acc[acc.length - 1].x + acc[acc.length - 1].w / 2
              : -maxFaceWidth / 2;
          const w = (b.pct / 100) * maxFaceWidth;
          acc.push({
            x: prevEnd + w / 2,
            w: Math.max(w - 0.01, 0.01),
            color: b.color,
          });
          return acc;
        }, []);
        return segments.map((seg, i) => (
          <group key={i} position={[seg.x, barY, barProtrude]}>
            <mesh>
              <boxGeometry args={[seg.w, barHeight, barDepth]} />
              <meshStandardMaterial
                color={seg.color}
                metalness={0.35}
                roughness={0.35}
                emissive={seg.color}
                emissiveIntensity={0.2}
              />
            </mesh>
            {/* Edge highlight */}
            <lineSegments>
              <edgesGeometry
                args={[new THREE.BoxGeometry(seg.w, barHeight, barDepth)]}
              />
              <lineBasicMaterial
                color={seg.color}
                toneMapped={false}
                transparent
                opacity={0.5}
              />
            </lineSegments>
          </group>
        ));
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
        // Precompute x positions to avoid mutable xOff during render
        const xPositions = itemWidths.reduce<number[]>((acc) => {
          const prev =
            acc.length > 0
              ? acc[acc.length - 1] + itemWidths[acc.length - 1]
              : -totalW / 2;
          acc.push(prev);
          return acc;
        }, []);
        return items.map((b, i) => {
          const logo = EXT_TO_LOGO[b.ext];
          const label = `.${b.ext} ${b.pct}%`;
          const s = scales[i];
          const iconW = logo ? baseIconSize * s : dotSize;
          const x = xPositions[i];
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
              emissiveIntensity={0.15}
            />
          </Text3D>
        </Center>
      </group>
    </>
  );
}

export function CommitBlock({ commit, position, height, newSince, commitUrl }: CommitBlockProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const mainMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const yOffsetRef = useRef(newSince !== undefined ? ENTRY_Y_OFFSET : 0);
  const yVelocityRef = useRef(0);
  const [hovered, setHovered] = useState(false);
  const hoveredRef = useRef(false);
  const glowDoneRef = useRef(!newSince);

  useEffect(() => { hoveredRef.current = hovered; }, [hovered]);

  // For settled non-glowing blocks, keep hover emissive in sync via effect
  // (useFrame returns early for those, so JSX can't drive it)
  useEffect(() => {
    if (glowDoneRef.current && mainMatRef.current) {
      mainMatRef.current.emissiveIntensity = hovered ? 0.15 : 0.03;
    }
  }, [hovered]);

  const { invalidate } = useThree();

  useFrame((_, delta) => {
    const isAnimating = yOffsetRef.current !== 0 || yVelocityRef.current !== 0;
    const isGlowing = !glowDoneRef.current;

    if (!isAnimating && !isGlowing) return;

    // Spring-based Y entry animation
    if (isAnimating) {
      const dt = Math.min(delta, 0.05);
      const springForce = -SPRING_K * yOffsetRef.current;
      const dampForce = -SPRING_DAMP * yVelocityRef.current;
      yVelocityRef.current += (springForce + dampForce) * dt;
      yOffsetRef.current += yVelocityRef.current * dt;
      if (Math.abs(yOffsetRef.current) < 0.001 && Math.abs(yVelocityRef.current) < 0.001) {
        yOffsetRef.current = 0;
        yVelocityRef.current = 0;
      }
      if (groupRef.current) {
        groupRef.current.position.y = position[1] + yOffsetRef.current;
      }
    }

    // Glow decay: emissiveIntensity fades from (base + GLOW_MAX_EXTRA) → base over 10 min,
    // decreasing linearly each minute. Drives the existing bloom above its luminance threshold.
    if (isGlowing && mainMatRef.current && newSince !== undefined) {
      const age = Date.now() - newSince;
      if (age >= GLOW_DURATION_MS) {
        glowDoneRef.current = true;
        mainMatRef.current.emissiveIntensity = hoveredRef.current ? 0.15 : 0.03;
      } else {
        const t = 1 - age / GLOW_DURATION_MS; // 1 → 0 over 10 minutes
        const base = hoveredRef.current ? 0.15 : 0.03;
        mainMatRef.current.emissiveIntensity = base + t * GLOW_MAX_EXTRA;
      }
    }

    invalidate();
  });
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
          ref={mainMatRef}
          color={darkenHex(color, 0.55)}
          metalness={0.3}
          roughness={0.6}
          emissive={color}
          emissiveIntensity={newSince !== undefined ? GLOW_MAX_EXTRA + 0.03 : (hovered ? 0.15 : 0.03)}
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

      {/* Face 4: Back (-Z) — commit info */}
      <group position={[0, 0, -faceD]} rotation={[0, Math.PI, 0]}>
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

      {/* Faces 2,3,5,6: empty */}

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

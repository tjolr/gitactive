import { Text3D } from "@react-three/drei";
import { useMemo } from "react";
import { white } from "../../lib/palette";
import type { CommitData } from "../../types";

const PADDING = 0.15;
const STATS_SIZE = 0.09;
const STATS_SMALL = 0.07;
const LINE_H = STATS_SMALL * 1.45;
const CW_SMALL = STATS_SMALL * 0.75;
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
const STAT_GREY = 0x8b949e;
const DIR_ICON_COLOR = 0x79c0ff; // light blue for folder icon

interface DirEntry {
  path: string;
  count: number;
}

function computeDirectories(files: CommitData["files"]): DirEntry[] {
  const counts = new Map<string, number>();
  for (const f of files) {
    const parts = f.filename.split("/");
    // Use up to 2 levels of directory depth
    const dirParts = parts.slice(0, Math.min(parts.length - 1, 2));
    const dir = dirParts.length > 0 ? dirParts.join("/") : ".";
    counts.set(dir, (counts.get(dir) ?? 0) + 1);
  }

  // Collapse single-child directories
  const entries = Array.from(counts.entries());
  const topLevel = new Map<string, string[]>();
  for (const [dir] of entries) {
    const top = dir.split("/")[0];
    if (!topLevel.has(top)) topLevel.set(top, []);
    topLevel.get(top)!.push(dir);
  }

  const result: DirEntry[] = [];
  for (const [top, children] of topLevel) {
    if (children.length === 1) {
      result.push({ path: children[0], count: counts.get(children[0])! });
    } else {
      // Show each sub-path separately
      for (const child of children) {
        result.push({ path: child, count: counts.get(child)! });
      }
    }
  }

  return result.sort((a, b) => b.count - a.count);
}

export function DirectoryTreeFace({
  commit,
  height,
  textDepth,
  faceWidth,
}: {
  commit: CommitData;
  height: number;
  textDepth: number;
  faceWidth: number;
}) {
  const maxW = faceWidth - PADDING * 2;
  const dirs = useMemo(() => computeDirectories(commit.files), [commit.files]);

  const headerText = "Directories";
  const cw = STATS_SIZE * 0.62;
  const headerW = headerText.length * cw;

  const usable = height - PADDING * 2 - STATS_SIZE * 1.8;
  const maxRows = Math.max(1, Math.floor(usable / LINE_H));
  const visible = dirs.slice(0, maxRows);
  const hasMore = dirs.length > maxRows;

  const maxChars = Math.floor(maxW / CW_SMALL);
  const topY = height / 2 - PADDING - 0.05 - STATS_SIZE * 1.6;

  const entries = visible.map((d) => {
    const countStr = `${d.count}`;
    const nameMax = Math.max(4, maxChars - countStr.length - 3);
    let name = d.path;
    if (name.length > nameMax) {
      name = ".." + name.slice(name.length - nameMax + 2);
    }
    return { name, countStr };
  });

  return (
    <group>
      {/* Header */}
      <group position={[-headerW / 2, height / 2 - PADDING - 0.05, 0]}>
        <Text3D
          font="/helvetiker_bold.typeface.json"
          size={STATS_SIZE}
          height={textDepth}
          {...STATS_BEVEL}
        >
          {headerText}
          <meshStandardMaterial
            color={white.hex}
            metalness={0.1}
            roughness={0.5}
            emissive={white.hex}
            emissiveIntensity={0.1}
          />
        </Text3D>
      </group>

      {/* Directory rows */}
      {entries.map((entry, i) => {
        const y = topY - i * LINE_H;
        const nameX = -maxW / 2;
        const countW = entry.countStr.length * CW_SMALL;
        const countX = maxW / 2 - countW;

        return (
          <group key={i} position={[0, y, 0]}>
            {/* Folder dot indicator */}
            <mesh position={[nameX - 0.06, STATS_SMALL * 0.35, 0]}>
              <circleGeometry args={[0.025, 8]} />
              <meshStandardMaterial
                color={DIR_ICON_COLOR}
                emissive={DIR_ICON_COLOR}
                emissiveIntensity={0.3}
              />
            </mesh>
            {/* Directory name */}
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
            {/* File count (right-aligned) */}
            <group position={[countX, 0, 0]}>
              <Text3D
                font="/helvetiker_bold.typeface.json"
                size={STATS_SMALL}
                height={textDepth}
                {...SMALL_BEVEL}
              >
                {entry.countStr}
                <meshStandardMaterial
                  color={white.hex}
                  metalness={0.1}
                  roughness={0.5}
                  emissive={white.hex}
                  emissiveIntensity={0.3}
                />
              </Text3D>
            </group>
          </group>
        );
      })}

      {/* "and N more" */}
      {hasMore && (
        <group position={[-maxW / 2, topY - visible.length * LINE_H, 0]}>
          <Text3D
            font="/helvetiker_bold.typeface.json"
            size={STATS_SMALL * 0.85}
            height={textDepth}
            {...SMALL_BEVEL}
          >
            {`+${dirs.length - maxRows} more`}
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

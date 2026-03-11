import { Text3D } from "@react-three/drei";
import { useMemo } from "react";
import { greenHex, neutralHex, redHex, yellowHex } from "../../lib/palette";
import { white } from "../../lib/palette";
import type { CheckRun } from "../../types";

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

function checkRunColor(run: CheckRun): number {
  if (run.status !== "completed") return yellowHex[300];
  switch (run.conclusion) {
    case "success": return greenHex[400];
    case "failure": return redHex[200];
    case "cancelled":
    case "skipped": return neutralHex[500];
    default: return yellowHex[300];
  }
}

function aggregateColor(runs: CheckRun[]): number {
  const hasFailure = runs.some((r) => r.conclusion === "failure");
  if (hasFailure) return redHex[200];
  const allDone = runs.every((r) => r.status === "completed");
  if (!allDone) return yellowHex[300];
  const allSuccess = runs.every((r) => r.conclusion === "success" || r.conclusion === "skipped" || r.conclusion === "neutral");
  if (allSuccess) return greenHex[400];
  return yellowHex[300];
}

export function BuildStatusFace({
  checkRuns,
  height,
  textDepth,
  faceWidth,
}: {
  checkRuns: CheckRun[] | undefined;
  height: number;
  textDepth: number;
  faceWidth: number;
}) {
  const maxW = faceWidth - PADDING * 2;
  const cw = STATS_SIZE * 0.62;

  // Loading state
  if (checkRuns === undefined) {
    const text = "Loading CI...";
    const textW = text.length * cw;
    return (
      <group position={[-textW / 2, 0, 0]}>
        <Text3D
          font="/helvetiker_bold.typeface.json"
          size={STATS_SIZE}
          height={textDepth}
          {...STATS_BEVEL}
        >
          {text}
          <meshStandardMaterial
            color={neutralHex[500]}
            metalness={0.1}
            roughness={0.5}
            emissive={neutralHex[500]}
            emissiveIntensity={0.1}
          />
        </Text3D>
      </group>
    );
  }

  // No CI state
  if (checkRuns.length === 0) {
    const text = "No CI";
    const textW = text.length * cw;
    return (
      <group position={[-textW / 2, 0, 0]}>
        <Text3D
          font="/helvetiker_bold.typeface.json"
          size={STATS_SIZE}
          height={textDepth}
          {...STATS_BEVEL}
        >
          {text}
          <meshStandardMaterial
            color={neutralHex[500]}
            metalness={0.1}
            roughness={0.5}
            emissive={neutralHex[500]}
            emissiveIntensity={0.1}
          />
        </Text3D>
      </group>
    );
  }

  // Has runs
  const headerText = "CI / CD";
  const headerW = headerText.length * cw;
  const aggColor = aggregateColor(checkRuns);

  const usable = height - PADDING * 2 - STATS_SIZE * 1.8;
  const maxRows = Math.max(1, Math.floor(usable / LINE_H));
  const visible = checkRuns.slice(0, maxRows);
  const hasMore = checkRuns.length > maxRows;
  const maxChars = Math.floor(maxW / CW_SMALL);
  const topY = height / 2 - PADDING - 0.05 - STATS_SIZE * 1.6;

  const entries = visible.map((run) => {
    let name = run.name;
    if (name.length > maxChars - 2) {
      name = name.slice(0, maxChars - 4) + "..";
    }
    return { name, color: checkRunColor(run) };
  });

  return (
    <group>
      {/* Header with aggregate indicator */}
      <group position={[-headerW / 2 - 0.12, height / 2 - PADDING - 0.05, 0]}>
        {/* Aggregate status circle */}
        <mesh position={[-0.08, STATS_SIZE * 0.35, 0]}>
          <circleGeometry args={[0.04, 16]} />
          <meshStandardMaterial
            color={aggColor}
            emissive={aggColor}
            emissiveIntensity={0.5}
          />
        </mesh>
        <group position={[0, 0, 0]}>
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
      </group>

      {/* Check run rows */}
      {entries.map((entry, i) => {
        const y = topY - i * LINE_H;
        const nameX = -maxW / 2 + 0.12;

        return (
          <group key={i} position={[0, y, 0]}>
            {/* Status circle */}
            <mesh position={[-maxW / 2, STATS_SMALL * 0.35, 0]}>
              <circleGeometry args={[0.03, 16]} />
              <meshStandardMaterial
                color={entry.color}
                emissive={entry.color}
                emissiveIntensity={0.4}
              />
            </mesh>
            {/* Workflow name */}
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
            {`+${checkRuns.length - maxRows} more`}
            <meshStandardMaterial
              color={neutralHex[500]}
              metalness={0.1}
              roughness={0.5}
              emissive={neutralHex[500]}
              emissiveIntensity={0.1}
            />
          </Text3D>
        </group>
      )}
    </group>
  );
}

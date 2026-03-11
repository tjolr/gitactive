import { useState, useEffect, useRef, memo } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BLOCK_WIDTH } from "./scene/CommitBlock";
import { neutral, scene } from "../lib/palette";
import type { BlockLayout } from "../lib/tower";

type Phase = "idle" | "exit" | "enter";

interface StickyDateLabelProps {
  layout: BlockLayout[];
  targetY: number;
}

export function StickyDateLabel({ layout, targetY }: StickyDateLabelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const layoutRef = useRef(layout);
  const targetYRef = useRef(targetY);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDateRef = useRef<string | null>(null);

  layoutRef.current = layout;
  targetYRef.current = targetY;

  const [currentDate, setCurrentDate] = useState<string | null>(() => {
    return computeDate(layout, targetY);
  });

  useFrame(() => {
    // Update group Y to follow camera — purely imperative, no React re-render
    if (groupRef.current) {
      groupRef.current.position.y = camera.position.y;
    }

    // Compute date and debounce updates
    const date = computeDate(layoutRef.current, targetYRef.current);

    if (date !== pendingDateRef.current) {
      pendingDateRef.current = date;

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounced update
      debounceTimerRef.current = setTimeout(() => {
        setCurrentDate(date);
        debounceTimerRef.current = null;
      }, 400);
    }
  });

  if (!currentDate) return null;

  return (
    <group ref={groupRef} position={[-(BLOCK_WIDTH / 2 + 3), camera.position.y, 0]}>
      <Html distanceFactor={10} style={{ pointerEvents: "none" }}>
        <DateLabelInner date={currentDate} />
      </Html>
    </group>
  );
}

function computeDate(layout: BlockLayout[], targetY: number): string | null {
  let label = layout[0]?.dateLabel ?? layout[0]?.commit.date;
  for (const block of layout) {
    if (block.y <= targetY && block.dateLabel) label = block.dateLabel;
  }
  return label ?? null;
}

const DateLabelInner = memo(function DateLabelInner({ date }: { date: string }) {
  const [displayed, setDisplayed] = useState(date);
  const [phase, setPhase] = useState<Phase>("idle");
  const prevDate = useRef(date);

  useEffect(() => {
    if (date === prevDate.current) return;
    prevDate.current = date;

    setPhase("exit");

    const exitTimer = setTimeout(() => {
      setDisplayed(date);
      setPhase("enter");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase("idle");
        });
      });
    }, 250);

    return () => clearTimeout(exitTimer);
  }, [date]);

  const transform =
    phase === "exit"
      ? "translateY(-120%)"
      : phase === "enter"
        ? "translateY(20%)"
        : "translateY(0)";

  const opacity = phase === "idle" ? 1 : 0;

  return (
    <div style={containerStyle}>
      <div
        style={{
          transform,
          opacity,
          transition: phase === "enter" ? "none" : "transform 250ms ease, opacity 250ms ease",
        }}
      >
        {displayed}
      </div>
    </div>
  );
});

const containerStyle: React.CSSProperties = {
  whiteSpace: "nowrap",
  fontFamily: "'SF Mono', monospace",
  fontSize: "28px",
  fontWeight: 600,
  color: neutral[400],
  background: `${scene.background}b3`,
  padding: "3px 8px",
  borderRadius: "4px",
  borderLeft: "2px solid #555577",
  overflow: "hidden",
};

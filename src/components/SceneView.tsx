import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { css } from "styled-system/css";
import type { CommitData, RepoInfo } from "../types";
import { computeTowerLayout, computeFloorY } from "../lib/tower";
import { CommitScene } from "./scene/CommitScene";
import { HUD } from "./HUD";

interface SceneViewProps {
  commits: CommitData[];
  repo: RepoInfo;
  repoHistory: string[];
  onBack: () => void;
  onSwitchRepo: (url: string) => void;
}

const SCROLL_SPEED = 0.01; // world units per pixel of wheel delta
const SCROLL_STEP_Y = 3; // world units per HUD button click
const ROTATE_STEP = Math.PI / 16; // radians per button click / key press
const DRAG_ROTATE_SPEED = 0.005; // radians per pixel of mouse drag

export function SceneView({ commits, repo, repoHistory, onBack, onSwitchRepo }: SceneViewProps) {
  const layout = useMemo(() => computeTowerLayout(commits), [commits]);
  const floorY = useMemo(() => computeFloorY(layout), [layout]);

  const minY = layout.length > 0 ? layout[0].y : 0;
  const maxY = layout.length > 0 ? layout[layout.length - 1].y : 0;

  // Continuous Y target — start at the top (newest commits)
  const [targetY, setTargetY] = useState(maxY);
  const [angle, setAngle] = useState(Math.PI / 4); // horizontal orbit angle (radians)

  const clampY = useCallback(
    (y: number) => Math.max(minY, Math.min(maxY, y)),
    [minY, maxY]
  );

  const canScrollDown = targetY > minY;
  const canScrollUp = targetY < maxY;

  const scrollDown = useCallback(() => {
    setTargetY((y) => clampY(y - SCROLL_STEP_Y));
  }, [clampY]);

  const scrollUp = useCallback(() => {
    setTargetY((y) => clampY(y + SCROLL_STEP_Y));
  }, [clampY]);

  const rotateLeft = useCallback(() => setAngle((a) => a + ROTATE_STEP), []);
  const rotateRight = useCallback(() => setAngle((a) => a - ROTATE_STEP), []);

  const [zoom, setZoom] = useState(1);
  const zoomIn = useCallback(() => setZoom((z) => Math.min(z * 1.3, 3)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(z / 1.3, 0.4)), []);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Mouse drag for horizontal rotation
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMouseX.current = e.clientX;
      el.style.cursor = "grabbing";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouseX.current;
      lastMouseX.current = e.clientX;
      setAngle((a) => a + dx * DRAG_ROTATE_SPEED);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      el.style.cursor = "";
    };

    el.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      el.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Wheel scroll for vertical movement
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setTargetY((y) => Math.max(minY, Math.min(maxY, y - e.deltaY * SCROLL_SPEED)));
      if (e.deltaX !== 0) {
        setAngle((a) => a - e.deltaX * DRAG_ROTATE_SPEED);
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [minY, maxY]);

  // Arrow key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setTargetY((y) => Math.min(maxY, y + SCROLL_STEP_Y));
          break;
        case "ArrowDown":
          e.preventDefault();
          setTargetY((y) => Math.max(minY, y - SCROLL_STEP_Y));
          break;
        case "ArrowLeft":
          e.preventDefault();
          setAngle((a) => a + ROTATE_STEP);
          break;
        case "ArrowRight":
          e.preventDefault();
          setAngle((a) => a - ROTATE_STEP);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [minY, maxY]);

  return (
    <div ref={wrapperRef} className={wrapper}>
      <CommitScene layout={layout} floorY={floorY} targetY={targetY} angle={angle} zoom={zoom} />
      <HUD
        repo={repo}
        commits={commits}
        repoHistory={repoHistory}
        onBack={onBack}
        onSwitchRepo={onSwitchRepo}
        onScrollUp={canScrollUp ? scrollUp : undefined}
        onScrollDown={canScrollDown ? scrollDown : undefined}
        onRotateLeft={rotateLeft}
        onRotateRight={rotateRight}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
      />
    </div>
  );
}

const wrapper = css({
  width: "100%",
  height: "100%",
  position: "relative",
});

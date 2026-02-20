import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { css } from "styled-system/css";
import type { CommitData, RepoInfo } from "../types";
import { computeTowerLayout, computeFloorY } from "../lib/tower";
import { CommitScene } from "./scene/CommitScene";
import { HUD } from "./HUD";

interface SceneViewProps {
  commits: CommitData[];
  repo: RepoInfo;
  onBack: () => void;
}

const SCROLL_STEP = 5;

export function SceneView({ commits, repo, onBack }: SceneViewProps) {
  const layout = useMemo(() => computeTowerLayout(commits), [commits]);
  const floorY = useMemo(() => computeFloorY(layout), [layout]);

  // focusIndex: index into layout[] (0 = oldest/bottom, length-1 = newest/top)
  // Start focused on the top (newest commits)
  const [focusIndex, setFocusIndex] = useState(layout.length - 1);

  const targetY = layout.length > 0 ? layout[focusIndex].y : 0;

  const canScrollDown = focusIndex > 0;
  const canScrollUp = focusIndex < layout.length - 1;

  const scrollDown = useCallback(() => {
    setFocusIndex((i) => Math.max(0, i - SCROLL_STEP));
  }, []);

  const scrollUp = useCallback(() => {
    setFocusIndex((i) => Math.min(layout.length - 1, i + SCROLL_STEP));
  }, [layout.length]);

  const [zoom, setZoom] = useState(1);
  const zoomIn = useCallback(() => setZoom((z) => Math.min(z * 1.3, 3)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(z / 1.3, 0.4)), []);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Scroll down (positive deltaY) → older commits (lower index)
      // Scroll up (negative deltaY) → newer commits (higher index)
      if (e.deltaY > 0) {
        setFocusIndex((i) => Math.max(0, i - 1));
      } else if (e.deltaY < 0) {
        setFocusIndex((i) => Math.min(layout.length - 1, i + 1));
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [layout.length]);

  return (
    <div ref={wrapperRef} className={wrapper}>
      <CommitScene layout={layout} floorY={floorY} targetY={targetY} zoom={zoom} />
      <HUD
        repo={repo}
        commits={commits}
        onBack={onBack}
        onScrollUp={canScrollUp ? scrollUp : undefined}
        onScrollDown={canScrollDown ? scrollDown : undefined}
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

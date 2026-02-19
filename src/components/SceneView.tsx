import { useMemo, useState, useCallback } from "react";
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

  return (
    <div className={wrapper}>
      <CommitScene layout={layout} floorY={floorY} targetY={targetY} />
      <HUD
        repo={repo}
        commits={commits}
        onBack={onBack}
        onScrollUp={canScrollUp ? scrollUp : undefined}
        onScrollDown={canScrollDown ? scrollDown : undefined}
      />
    </div>
  );
}

const wrapper = css({
  width: "100%",
  height: "100%",
  position: "relative",
});

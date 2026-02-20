import { useMemo } from "react";
import { css } from "styled-system/css";
import type { CommitData, RepoInfo } from "../types";
import { authorColor } from "../lib/colors";

interface HUDProps {
  repo: RepoInfo;
  commits: CommitData[];
  onBack: () => void;
  onScrollUp?: () => void;
  onScrollDown?: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function HUD({ repo, commits, onBack, onScrollUp, onScrollDown, onRotateLeft, onRotateRight, onZoomIn, onZoomOut }: HUDProps) {
  const authors = useMemo(() => {
    const map = new Map<string, { login: string; count: number }>();
    for (const c of commits) {
      const existing = map.get(c.authorLogin);
      if (existing) {
        existing.count++;
      } else {
        map.set(c.authorLogin, { login: c.authorLogin, count: 1 });
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  }, [commits]);

  return (
    <div className={overlay}>
      <div className={topBar}>
        <div className={repoName}>
          {repo.owner}/{repo.repo}
          <span className={commitCount}>{commits.length} commits</span>
        </div>
        <button className={backBtn} onClick={onBack}>
          ← Back
        </button>
      </div>

      <div className={dpad}>
        <div className={dpadRow}>
          <div className={dpadSpacer} />
          <button
            className={scrollBtn}
            onClick={onScrollUp}
            disabled={!onScrollUp}
            title="Scroll up (↑)"
          >
            ▲
          </button>
          <div className={dpadSpacer} />
        </div>
        <div className={dpadRow}>
          <button className={scrollBtn} onClick={onRotateLeft} title="Rotate left (←)">
            ◀
          </button>
          <div className={dpadSpacer} />
          <button className={scrollBtn} onClick={onRotateRight} title="Rotate right (→)">
            ▶
          </button>
        </div>
        <div className={dpadRow}>
          <div className={dpadSpacer} />
          <button
            className={scrollBtn}
            onClick={onScrollDown}
            disabled={!onScrollDown}
            title="Scroll down (↓)"
          >
            ▼
          </button>
          <div className={dpadSpacer} />
        </div>
      </div>

      <div className={zoomControls}>
        <button className={scrollBtn} onClick={onZoomIn} title="Zoom in">
          +
        </button>
        <button className={scrollBtn} onClick={onZoomOut} title="Zoom out">
          −
        </button>
      </div>

      <div className={legend}>
        {authors.map((a) => (
          <div key={a.login} className={legendItem}>
            <div
              className={legendDot}
              style={{ background: authorColor(a.login) }}
            />
            <span className={legendText}>{a.login}</span>
            <span className={legendCount}>{a.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const overlay = css({
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: "16px",
});

const topBar = css({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
});

const repoName = css({
  background: "rgba(10, 10, 15, 0.7)",
  backdropFilter: "blur(10px)",
  border: "1px solid #2a2a3a",
  borderRadius: "8px",
  padding: "10px 16px",
  fontSize: "14px",
  fontWeight: "600",
  color: "#e0e0e0",
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const commitCount = css({
  fontSize: "11px",
  color: "#00ff88",
  background: "rgba(0, 255, 136, 0.1)",
  padding: "2px 8px",
  borderRadius: "4px",
});

const backBtn = css({
  pointerEvents: "auto",
  background: "rgba(10, 10, 15, 0.7)",
  backdropFilter: "blur(10px)",
  border: "1px solid #2a2a3a",
  borderRadius: "8px",
  padding: "10px 16px",
  color: "#e0e0e0",
  fontSize: "13px",
  fontFamily: "inherit",
  cursor: "pointer",
  transition: "border-color 0.2s",
  _hover: {
    borderColor: "#00ff88",
  },
});

const dpad = css({
  position: "absolute",
  right: "16px",
  top: "50%",
  transform: "translateY(-50%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
});

const dpadRow = css({
  display: "flex",
  gap: "4px",
});

const dpadSpacer = css({
  width: "40px",
  height: "40px",
});

const scrollBtn = css({
  pointerEvents: "auto",
  width: "40px",
  height: "40px",
  background: "rgba(10, 10, 15, 0.7)",
  backdropFilter: "blur(10px)",
  border: "1px solid #2a2a3a",
  borderRadius: "8px",
  color: "#e0e0e0",
  fontSize: "16px",
  fontFamily: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s",
  _hover: {
    borderColor: "#00ff88",
    color: "#00ff88",
  },
  _disabled: {
    opacity: 0.3,
    cursor: "default",
    borderColor: "#2a2a3a",
    color: "#e0e0e0",
  },
});

const zoomControls = css({
  position: "absolute",
  right: "16px",
  bottom: "60px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

const legend = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  justifyContent: "center",
});

const legendItem = css({
  background: "rgba(10, 10, 15, 0.7)",
  backdropFilter: "blur(10px)",
  border: "1px solid #2a2a3a",
  borderRadius: "6px",
  padding: "6px 10px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "11px",
});

const legendDot = css({
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  flexShrink: 0,
});

const legendText = css({
  color: "#e0e0e0",
});

const legendCount = css({
  color: "#888899",
});

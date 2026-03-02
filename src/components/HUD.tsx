import { useEffect, useMemo, useRef, useState } from "react";
import { css } from "styled-system/css";
import { authorColor } from "../lib/colors";
import { accent, neutral } from "../lib/palette";
import { repoLabel } from "../lib/repoHistory";
import type { CommitData, RepoInfo } from "../types";

interface HUDProps {
  repo: RepoInfo;
  commits: CommitData[];
  repoHistory: string[];
  onBack: () => void;
  onSwitchRepo: (url: string) => void;
  onScrollUp?: () => void;
  onScrollDown?: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function HUD({
  repo,
  commits,
  repoHistory,
  onBack,
  onSwitchRepo,
  onScrollUp,
  onScrollDown,
  onRotateLeft,
  onRotateRight,
  onZoomIn,
  onZoomOut,
}: HUDProps) {
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

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentLabel = `${repo.owner}/${repo.repo}`;

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className={overlay}>
      <div className={topBar}>
        {/* Repo name pill — clickable to open history menu */}
        <div className={repoPillWrapper} ref={menuRef}>
          <button
            className={repoPill}
            onClick={() => setMenuOpen((o) => !o)}
            title="Switch repository"
          >
            <span className={repoPillName}>{currentLabel}</span>
            <span className={commitCount}>{commits.length} commits</span>
            <span className={chevron} style={{ transform: menuOpen ? "rotate(180deg)" : undefined }}>▾</span>
          </button>

          {menuOpen && (
            <div className={dropdown}>
              {repoHistory.length > 0 && (
                <>
                  <div className={dropdownSection}>Recent</div>
                  {repoHistory.map((url) => {
                    const label = repoLabel(url);
                    const isCurrent = label === currentLabel;
                    return (
                      <button
                        key={url}
                        className={`${dropdownItem} ${isCurrent ? dropdownItemActive : ""}`}
                        onClick={() => {
                          if (!isCurrent) {
                            setMenuOpen(false);
                            onSwitchRepo(url);
                          }
                        }}
                        disabled={isCurrent}
                      >
                        {isCurrent && <span className={checkmark}>✓</span>}
                        <span>{label}</span>
                      </button>
                    );
                  })}
                  <div className={dropdownDivider} />
                </>
              )}
              <button
                className={dropdownAddNew}
                onClick={() => {
                  setMenuOpen(false);
                  onBack();
                }}
              >
                <span className={addNewPlus}>+</span> Add new
              </button>
            </div>
          )}
        </div>

        <button className={backBtn} onClick={onBack}>
          ← Back
        </button>
      </div>

      <button
        className={`${scrollBtn} ${edgeTop}`}
        onClick={onScrollUp}
        disabled={!onScrollUp}
        title="Scroll up (↑)"
      >
        ▲
      </button>
      <button
        className={`${scrollBtn} ${edgeBottom}`}
        onClick={onScrollDown}
        disabled={!onScrollDown}
        title="Scroll down (↓)"
      >
        ▼
      </button>
      <button
        className={`${scrollBtn} ${edgeLeft}`}
        onClick={onRotateLeft}
        title="Rotate left (←)"
      >
        ◀
      </button>
      <button
        className={`${scrollBtn} ${edgeRight}`}
        onClick={onRotateRight}
        title="Rotate right (→)"
      >
        ▶
      </button>

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

const repoPillWrapper = css({
  position: "relative",
  pointerEvents: "auto",
});

const repoPill = css({
  pointerEvents: "auto",
  background: "rgba(10, 10, 15, 0.7)",
  backdropFilter: "blur(10px)",
  border: "1px solid #2a2a3a",
  borderRadius: "8px",
  padding: "10px 16px",
  fontSize: "14px",
  fontWeight: "600",
  color: neutral[100],
  display: "flex",
  alignItems: "center",
  gap: "12px",
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "border-color 0.2s",
  _hover: {
    borderColor: accent.neonGreen,
  },
});

const repoPillName = css({
  color: neutral[100],
});

const chevron = css({
  color: neutral[500],
  fontSize: "12px",
  transition: "transform 0.2s",
  display: "inline-block",
});

const dropdown = css({
  position: "absolute",
  top: "calc(100% + 6px)",
  left: 0,
  minWidth: "240px",
  background: "rgba(10, 10, 15, 0.95)",
  backdropFilter: "blur(16px)",
  border: "1px solid #2a2a3a",
  borderRadius: "10px",
  padding: "6px",
  zIndex: 100,
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
});

const dropdownSection = css({
  fontSize: "10px",
  color: neutral[600],
  textTransform: "uppercase",
  letterSpacing: "1px",
  padding: "6px 10px 4px",
  fontFamily: "inherit",
});

const dropdownItem = css({
  width: "100%",
  background: "none",
  border: "none",
  borderRadius: "6px",
  padding: "9px 10px",
  color: neutral[300],
  fontSize: "13px",
  fontFamily: "'SF Mono', monospace",
  cursor: "pointer",
  textAlign: "left",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  transition: "background 0.15s, color 0.15s",
  _hover: {
    background: "rgba(255,255,255,0.06)",
    color: neutral[100],
  },
  _disabled: {
    cursor: "default",
  },
});

const dropdownItemActive = css({
  color: accent.neonGreen,
  _hover: {
    background: "rgba(0,255,136,0.06)",
    color: accent.neonGreen,
  },
});

const checkmark = css({
  color: accent.neonGreen,
  fontSize: "12px",
  flexShrink: 0,
});

const dropdownDivider = css({
  height: "1px",
  background: "#2a2a3a",
  margin: "6px 4px",
});

const dropdownAddNew = css({
  width: "100%",
  background: "none",
  border: "none",
  borderRadius: "6px",
  padding: "9px 10px",
  color: neutral[400],
  fontSize: "13px",
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "left",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  transition: "background 0.15s, color 0.15s",
  _hover: {
    background: "rgba(0,255,136,0.06)",
    color: accent.neonGreen,
  },
});

const addNewPlus = css({
  fontSize: "16px",
  lineHeight: 1,
  color: accent.neonGreen,
});

const commitCount = css({
  fontSize: "11px",
  color: accent.neonGreen,
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
  color: neutral[100],
  fontSize: "13px",
  fontFamily: "inherit",
  cursor: "pointer",
  transition: "border-color 0.2s",
  _hover: {
    borderColor: accent.neonGreen,
  },
});

const edgeTop = css({
  position: "absolute",
  top: "16px",
  left: "50%",
  transform: "translateX(-50%)",
});

const edgeBottom = css({
  position: "absolute",
  bottom: "16px",
  left: "50%",
  transform: "translateX(-50%)",
});

const edgeLeft = css({
  position: "absolute",
  left: "16px",
  top: "50%",
  transform: "translateY(-50%)",
});

const edgeRight = css({
  position: "absolute",
  right: "16px",
  top: "50%",
  transform: "translateY(-50%)",
});

const scrollBtn = css({
  pointerEvents: "auto",
  width: "40px",
  height: "40px",
  background: "rgba(10, 10, 15, 0.7)",
  backdropFilter: "blur(10px)",
  border: "1px solid #2a2a3a",
  borderRadius: "8px",
  color: neutral[100],
  fontSize: "16px",
  fontFamily: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s",
  _hover: {
    borderColor: accent.neonGreen,
    color: accent.neonGreen,
  },
  _disabled: {
    opacity: 0.3,
    cursor: "default",
    borderColor: neutral[700],
    color: neutral[100],
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
  justifyContent: "flex-start",
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
  color: neutral[100],
});

const legendCount = css({
  color: neutral[500],
});

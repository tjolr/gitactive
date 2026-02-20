import { useState } from "react";
import { css } from "styled-system/css";
import { parseRepoUrl, fetchCommits } from "../lib/github";
import { MOCK_COMMITS, MOCK_REPO } from "../lib/mock-data";
import { accent, neutral, purple, red, scene } from "../lib/palette";
import type { CommitData, RepoInfo } from "../types";

const isLocalhost =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";

interface LandingPageProps {
  onCommitsLoaded: (commits: CommitData[], repo: RepoInfo) => void;
}

const LS_REPO_URL = "gitactive:repoUrl";
const LS_TOKEN = "gitactive:token";

export function LandingPage({ onCommitsLoaded }: LandingPageProps) {
  const [repoUrl, setRepoUrl] = useState(() => localStorage.getItem(LS_REPO_URL) ?? "");
  const [token, setToken] = useState(() => localStorage.getItem(LS_TOKEN) ?? "");
  const [showToken, setShowToken] = useState(() => !!localStorage.getItem(LS_TOKEN));
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setProgress({ loaded: 0, total: 0 });

    try {
      const repoInfo = parseRepoUrl(repoUrl);
      const commits = await fetchCommits(
        repoInfo,
        token || undefined,
        (loaded, total) => setProgress({ loaded, total })
      );
      if (commits.length === 0) {
        throw new Error("No commits found in this repository");
      }
      localStorage.setItem(LS_REPO_URL, repoUrl);
      if (token) {
        localStorage.setItem(LS_TOKEN, token);
      }
      onCommitsLoaded(commits, repoInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch commits");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={container}>
      <div className={card}>
        <h1 className={title}>
          Git<span className={titleAccent}>Active</span>
        </h1>
        <p className={subtitle}>3D Commit Tower Visualizer</p>

        <form onSubmit={handleSubmit} className={form}>
          <div className={inputGroup}>
            <label className={label}>Repository</label>
            <input
              type="text"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => {
                setRepoUrl(e.target.value);
                localStorage.setItem(LS_REPO_URL, e.target.value);
              }}
              className={input}
              disabled={loading}
              required
            />
          </div>

          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className={toggleBtn}
          >
            {showToken ? "▾" : "▸"} Private repo?
          </button>

          {showToken && (
            <div className={inputGroup}>
              <label className={label}>Personal Access Token</label>
              <input
                type="password"
                placeholder="ghp_..."
                value={token}
                onChange={(e) => {
                setToken(e.target.value);
                if (e.target.value) {
                  localStorage.setItem(LS_TOKEN, e.target.value);
                } else {
                  localStorage.removeItem(LS_TOKEN);
                }
              }}
                className={input}
                disabled={loading}
              />
            </div>
          )}

          {error && <div className={errorBox}>{error}</div>}

          <button type="submit" className={submitBtn} disabled={loading || !repoUrl.trim()}>
            {loading
              ? `Loading... ${progress.loaded}/${progress.total}`
              : "Visualize"}
          </button>

          {loading && (
            <div className={progressBar}>
              <div
                className={progressFill}
                style={{
                  width: progress.total
                    ? `${(progress.loaded / progress.total) * 100}%`
                    : "0%",
                }}
              />
            </div>
          )}
        </form>

        {isLocalhost && (
          <button
            className={demoBtn}
            onClick={() => onCommitsLoaded(MOCK_COMMITS, MOCK_REPO)}
            disabled={loading}
          >
            Try demo (mock data)
          </button>
        )}
      </div>
    </div>
  );
}

const container = css({
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "radial-gradient(ellipse at center, #12121a 0%, #0a0a0f 70%)",
});

const card = css({
  background: neutral[900],
  border: "1px solid #2a2a3a",
  borderRadius: "16px",
  padding: "48px",
  maxWidth: "480px",
  width: "100%",
  margin: "0 16px",
  boxShadow: "0 0 60px rgba(0, 255, 136, 0.05), 0 0 120px rgba(124, 58, 237, 0.03)",
});

const title = css({
  fontSize: "48px",
  fontWeight: "800",
  margin: "0 0 4px 0",
  letterSpacing: "-1px",
  color: neutral[100],
});

const titleAccent = css({
  color: accent.neonGreen,
  textShadow: "0 0 20px rgba(0, 255, 136, 0.4)",
});

const subtitle = css({
  fontSize: "14px",
  color: neutral[500],
  margin: "0 0 32px 0",
});

const form = css({
  display: "flex",
  flexDirection: "column",
  gap: "16px",
});

const inputGroup = css({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

const label = css({
  fontSize: "12px",
  color: neutral[500],
  textTransform: "uppercase",
  letterSpacing: "1px",
});

const input = css({
  background: scene.background,
  border: "1px solid #2a2a3a",
  borderRadius: "8px",
  padding: "12px 16px",
  color: neutral[100],
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.2s",
  _focus: {
    borderColor: accent.neonGreen,
    boxShadow: "0 0 10px rgba(0, 255, 136, 0.1)",
  },
  _disabled: {
    opacity: 0.5,
  },
});

const toggleBtn = css({
  background: "none",
  border: "none",
  color: neutral[500],
  fontSize: "13px",
  cursor: "pointer",
  textAlign: "left",
  padding: "0",
  fontFamily: "inherit",
  _hover: {
    color: neutral[100],
  },
});

const errorBox = css({
  background: "rgba(255, 50, 50, 0.1)",
  border: "1px solid rgba(255, 50, 50, 0.3)",
  borderRadius: "8px",
  padding: "12px",
  color: red[300],
  fontSize: "13px",
});

const submitBtn = css({
  background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
  border: "none",
  borderRadius: "8px",
  padding: "14px",
  color: scene.background,
  fontSize: "16px",
  fontWeight: "700",
  fontFamily: "inherit",
  cursor: "pointer",
  transition: "all 0.2s",
  boxShadow: "0 0 20px rgba(0, 255, 136, 0.2)",
  _hover: {
    boxShadow: "0 0 30px rgba(0, 255, 136, 0.4)",
    transform: "translateY(-1px)",
  },
  _disabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    transform: "none",
    boxShadow: "none",
  },
});

const progressBar = css({
  height: "4px",
  background: neutral[800],
  borderRadius: "2px",
  overflow: "hidden",
});

const progressFill = css({
  height: "100%",
  background: "linear-gradient(90deg, #00ff88, #7c3aed)",
  borderRadius: "2px",
  transition: "width 0.3s ease",
});

const demoBtn = css({
  marginTop: "16px",
  background: "none",
  border: "1px dashed #2a2a3a",
  borderRadius: "8px",
  padding: "12px",
  color: neutral[500],
  fontSize: "13px",
  fontFamily: "inherit",
  cursor: "pointer",
  transition: "all 0.2s",
  width: "100%",
  _hover: {
    borderColor: purple[400],
    color: purple[400],
  },
  _disabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
});

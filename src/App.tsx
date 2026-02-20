import { useState, useEffect } from "react";
import type { CommitData, RepoInfo } from "./types";
import { LandingPage } from "./components/LandingPage";
import { SceneView } from "./components/SceneView";
import { parseRepoUrl, fetchCommits } from "./lib/github";
import { resetAuthorColors } from "./lib/colors";

const LS_REPO_URL = "gitactive:repoUrl";
const LS_TOKEN = "gitactive:token";

function App() {
  const [commits, setCommits] = useState<CommitData[] | null>(null);
  const [repo, setRepo] = useState<RepoInfo | null>(null);
  const [autoLoading, setAutoLoading] = useState(false);

  // Auto-fetch on mount if we have a saved repo URL
  useEffect(() => {
    const savedUrl = localStorage.getItem(LS_REPO_URL);
    if (!savedUrl) return;

    let cancelled = false;
    const token = localStorage.getItem(LS_TOKEN) || undefined;

    try {
      const repoInfo = parseRepoUrl(savedUrl);
      setAutoLoading(true);
      fetchCommits(repoInfo, token).then((result) => {
        if (cancelled) return;
        if (result.length > 0) {
          setCommits(result);
          setRepo(repoInfo);
        }
      }).catch(() => {
        // silently fall through to landing page
      }).finally(() => {
        if (!cancelled) setAutoLoading(false);
      });
    } catch {
      // invalid saved URL — fall through to landing page
    }

    return () => { cancelled = true; };
  }, []);

  if (autoLoading) {
    return (
      <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0f",
        color: "#888899",
        fontFamily: "'SF Mono', monospace",
        fontSize: "14px",
      }}>
        Loading saved repository...
      </div>
    );
  }

  if (commits && repo) {
    return (
      <SceneView
        commits={commits}
        repo={repo}
        onBack={() => {
          resetAuthorColors();
          setCommits(null);
          setRepo(null);
        }}
      />
    );
  }

  return (
    <LandingPage
      onCommitsLoaded={(c, r) => {
        setCommits(c);
        setRepo(r);
      }}
    />
  );
}

export default App;

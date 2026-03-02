import { useState, useEffect, useRef } from "react";
import type { CommitData, RepoInfo } from "./types";
import { LandingPage } from "./components/LandingPage";
import { SceneView } from "./components/SceneView";
import { parseRepoUrl, fetchCommits, fetchCommitsSince } from "./lib/github";
import { resetAuthorColors } from "./lib/colors";
import { neutral, scene } from "./lib/palette";
import { getRepoHistory, saveRepoToHistory } from "./lib/repoHistory";

const POLL_INTERVAL = 60_000; // 60 seconds

const LS_REPO_URL = "gitactive:repoUrl";
const LS_TOKEN = "gitactive:token";

function App() {
  const [commits, setCommits] = useState<CommitData[] | null>(null);
  const [repo, setRepo] = useState<RepoInfo | null>(null);
  const [autoLoading, setAutoLoading] = useState(false);
  const [repoHistory, setRepoHistory] = useState<string[]>(() => getRepoHistory());
  const commitsRef = useRef(commits);
  useEffect(() => { commitsRef.current = commits; }, [commits]);

  const loadRepo = async (url: string) => {
    const token = localStorage.getItem(LS_TOKEN) || undefined;
    const repoInfo = parseRepoUrl(url);
    const result = await fetchCommits(repoInfo, token);
    if (result.length === 0) throw new Error("No commits found");
    localStorage.setItem(LS_REPO_URL, url);
    saveRepoToHistory(url);
    resetAuthorColors();
    setCommits(result);
    setRepo(repoInfo);
    setRepoHistory(getRepoHistory());
  };

  // Auto-fetch on mount if we have a saved repo URL
  useEffect(() => {
    const savedUrl = localStorage.getItem(LS_REPO_URL);
    if (!savedUrl) return;

    let cancelled = false;
    setAutoLoading(true);
    loadRepo(savedUrl)
      .catch(() => { /* silently fall through to landing page */ })
      .finally(() => { if (!cancelled) setAutoLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for new commits every 60s while viewing a repo
  useEffect(() => {
    if (!repo) return;

    const token = localStorage.getItem(LS_TOKEN) || undefined;

    const intervalId = setInterval(async () => {
      const current = commitsRef.current;
      if (!current || current.length === 0) return;

      const newestDate = current.reduce(
        (latest, c) => (new Date(c.date) > new Date(latest) ? c.date : latest),
        current[0].date
      );
      const knownShas = new Set(current.map((c) => c.sha));

      try {
        const newCommits = await fetchCommitsSince(repo, newestDate, knownShas, token);
        if (newCommits.length > 0) {
          setCommits((prev) => (prev ? [...prev, ...newCommits] : newCommits));
        }
      } catch {
        // silently ignore poll failures — next tick will retry
      }
    }, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [repo]);

  if (autoLoading) {
    return (
      <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: scene.background,
        color: neutral[500],
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
        repoHistory={repoHistory}
        onBack={() => {
          resetAuthorColors();
          setCommits(null);
          setRepo(null);
        }}
        onSwitchRepo={(url) => {
          loadRepo(url).catch(() => {});
        }}
      />
    );
  }

  return (
    <LandingPage
      onCommitsLoaded={(c, r) => {
        const url = `${r.owner}/${r.repo}`;
        saveRepoToHistory(url);
        setRepoHistory(getRepoHistory());
        setCommits(c);
        setRepo(r);
      }}
    />
  );
}

export default App;

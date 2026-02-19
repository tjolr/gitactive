import { useState } from "react";
import type { CommitData, RepoInfo } from "./types";
import { LandingPage } from "./components/LandingPage";
import { SceneView } from "./components/SceneView";

function App() {
  const [commits, setCommits] = useState<CommitData[] | null>(null);
  const [repo, setRepo] = useState<RepoInfo | null>(null);

  if (commits && repo) {
    return (
      <SceneView
        commits={commits}
        repo={repo}
        onBack={() => {
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

import { useState, useEffect } from "react";
import type { CommitData } from "../types";

const MOCK_AUTHORS = [
  { name: "Alice", login: "alice" },
  { name: "Bob", login: "bob" },
  { name: "Charlie", login: "charlie" },
  { name: "Dana", login: "dana" },
];

const MOCK_FILES = [
  "src/index.ts",
  "src/App.tsx",
  "src/utils/helpers.ts",
  "README.md",
  "package.json",
  "src/components/Button.tsx",
  "src/lib/api.ts",
  "tests/app.test.ts",
];

function makeMockCommit(): CommitData {
  const sha = crypto.randomUUID().replace(/-/g, "").slice(0, 40);
  const author = MOCK_AUTHORS[Math.floor(Math.random() * MOCK_AUTHORS.length)];
  const additions = Math.floor(Math.random() * 200) + 1;
  const deletions = Math.floor(Math.random() * 80);
  const fileCount = Math.floor(Math.random() * 5) + 1;
  const files = Array.from({ length: fileCount }, () => {
    const f = MOCK_FILES[Math.floor(Math.random() * MOCK_FILES.length)];
    const a = Math.floor(Math.random() * 50) + 1;
    const d = Math.floor(Math.random() * 20);
    return { filename: f, additions: a, deletions: d, changes: a + d };
  });

  return {
    sha,
    shortSha: sha.slice(0, 7),
    message: `Mock commit ${sha.slice(0, 7)}`,
    title: `Mock commit ${sha.slice(0, 7)}`,
    authorName: author.name,
    authorLogin: author.login,
    authorAvatar: `https://ui-avatars.com/api/?name=${author.name}&size=64`,
    date: new Date().toISOString(),
    stats: { additions, deletions, total: additions + deletions },
    filesChanged: fileCount,
    files,
  };
}

export function DevMenu({ onAddCommit }: { onAddCommit: (c: CommitData) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        background: "rgba(20, 20, 30, 0.9)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 8,
        padding: "12px 16px",
        fontFamily: "'SF Mono', monospace",
        fontSize: 12,
        color: "#aaa",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ fontWeight: 600, color: "#ccc" }}>Dev Menu</div>
      <button
        onClick={() => onAddCommit(makeMockCommit())}
        style={{
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 4,
          color: "#ddd",
          padding: "6px 12px",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 12,
        }}
      >
        Add Mock Commit
      </button>
    </div>
  );
}

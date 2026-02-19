import type { CommitData, RepoInfo } from "../types";

export const MOCK_REPO: RepoInfo = { owner: "acme", repo: "webapp" };

const authors = [
  { name: "Sarah Chen", login: "sarahchen", avatar: "https://avatars.githubusercontent.com/u/1?v=4" },
  { name: "Marcus Rodriguez", login: "mrodriguez", avatar: "https://avatars.githubusercontent.com/u/2?v=4" },
  { name: "Aisha Patel", login: "aishap", avatar: "https://avatars.githubusercontent.com/u/3?v=4" },
  { name: "Jake Morrison", login: "jmorrison", avatar: "https://avatars.githubusercontent.com/u/4?v=4" },
  { name: "Lin Wei", login: "linwei", avatar: "https://avatars.githubusercontent.com/u/5?v=4" },
  { name: "Emma Larsson", login: "elarsson", avatar: "https://avatars.githubusercontent.com/u/6?v=4" },
  { name: "David Kim", login: "dkim", avatar: "https://avatars.githubusercontent.com/u/7?v=4" },
];

function sha(i: number): string {
  const hex = "0123456789abcdef";
  let s = "";
  let seed = (i + 1) * 2654435761;
  for (let j = 0; j < 40; j++) {
    seed = ((seed ^ (seed << 13)) >>> 0);
    seed = ((seed ^ (seed >> 17)) >>> 0);
    seed = ((seed ^ (seed << 5)) >>> 0);
    s += hex[seed & 0xf];
  }
  return s;
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

const commits: { msg: string; add: number; del: number; files: number; authorIdx: number }[] = [
  { msg: "Initial project setup with Vite and React\n\nScaffolded the project using create-vite with React TypeScript template.", add: 342, del: 0, files: 18, authorIdx: 0 },
  { msg: "Add ESLint and Prettier configuration", add: 89, del: 3, files: 3, authorIdx: 0 },
  { msg: "Set up Tailwind CSS with custom theme tokens", add: 156, del: 12, files: 5, authorIdx: 2 },
  { msg: "Create base layout components (Header, Sidebar, Main)", add: 287, del: 0, files: 7, authorIdx: 2 },
  { msg: "Add React Router with route definitions\n\nSet up client-side routing for dashboard, settings, and profile pages.", add: 134, del: 8, files: 6, authorIdx: 3 },
  { msg: "Implement authentication context and useAuth hook", add: 210, del: 0, files: 4, authorIdx: 0 },
  { msg: "Build login page with email/password form", add: 178, del: 5, files: 3, authorIdx: 1 },
  { msg: "Add JWT token refresh logic\n\nTokens now auto-refresh 5 minutes before expiry.", add: 95, del: 22, files: 2, authorIdx: 0 },
  { msg: "Create user profile API client", add: 67, del: 0, files: 2, authorIdx: 4 },
  { msg: "Fix login redirect not working after session timeout", add: 12, del: 8, files: 1, authorIdx: 3 },
  { msg: "Add dashboard page with stats grid layout", add: 245, del: 0, files: 8, authorIdx: 2 },
  { msg: "Implement data fetching hooks with SWR\n\nAdded useFetch wrapper with error handling and retry logic.", add: 189, del: 34, files: 5, authorIdx: 4 },
  { msg: "Build bar chart component using Recharts", add: 156, del: 0, files: 3, authorIdx: 5 },
  { msg: "Add line chart for weekly activity trends", add: 134, del: 11, files: 3, authorIdx: 5 },
  { msg: "Create notification bell with dropdown panel", add: 203, del: 0, files: 4, authorIdx: 1 },
  { msg: "Fix chart tooltip clipping on small screens", add: 8, del: 3, files: 1, authorIdx: 5 },
  { msg: "Add dark mode toggle with system preference detection\n\nUses prefers-color-scheme media query as default, localStorage for override.", add: 312, del: 45, files: 12, authorIdx: 2 },
  { msg: "Implement settings page with form sections", add: 267, del: 0, files: 6, authorIdx: 3 },
  { msg: "Add avatar upload with image cropping", add: 189, del: 7, files: 4, authorIdx: 1 },
  { msg: "Fix memory leak in notification polling interval", add: 6, del: 14, files: 1, authorIdx: 4 },
  { msg: "Add search command palette (Cmd+K)\n\nFuzzy search across pages, recent items, and actions.", add: 445, del: 12, files: 9, authorIdx: 0 },
  { msg: "Create reusable Modal and Dialog components", add: 178, del: 0, files: 4, authorIdx: 2 },
  { msg: "Build team members list with invite flow", add: 334, del: 0, files: 8, authorIdx: 3 },
  { msg: "Add role-based permission checks to routes", add: 89, del: 23, files: 3, authorIdx: 0 },
  { msg: "Implement WebSocket connection for real-time updates", add: 267, del: 0, files: 5, authorIdx: 4 },
  { msg: "Fix race condition in WebSocket reconnect logic\n\nAdded exponential backoff and dedup for pending messages.", add: 34, del: 19, files: 2, authorIdx: 4 },
  { msg: "Add loading skeletons for dashboard cards", add: 112, del: 28, files: 4, authorIdx: 5 },
  { msg: "Create activity feed component with infinite scroll", add: 223, del: 0, files: 5, authorIdx: 1 },
  { msg: "Add keyboard navigation to data tables", add: 78, del: 12, files: 2, authorIdx: 6 },
  { msg: "Implement CSV export for table data", add: 56, del: 0, files: 2, authorIdx: 6 },
  { msg: "Fix sidebar collapse animation jank on Firefox\n\nSwitched from width transition to transform for GPU compositing.", add: 15, del: 9, files: 1, authorIdx: 2 },
  { msg: "Add E2E tests for authentication flow", add: 345, del: 0, files: 11, authorIdx: 0 },
  { msg: "Create onboarding wizard for new users", add: 489, del: 0, files: 14, authorIdx: 3 },
  { msg: "Add API rate limiting with token bucket", add: 134, del: 0, files: 3, authorIdx: 4 },
  { msg: "Fix date formatting inconsistency across timezones", add: 23, del: 18, files: 2, authorIdx: 6 },
  { msg: "Implement drag-and-drop for dashboard widget reordering\n\nUses @dnd-kit with smooth animations and persistence to localStorage.", add: 378, del: 56, files: 10, authorIdx: 1 },
  { msg: "Add breadcrumb navigation component", add: 67, del: 0, files: 2, authorIdx: 5 },
  { msg: "Create custom 404 and error boundary pages", add: 112, del: 0, files: 3, authorIdx: 2 },
  { msg: "Add Sentry error tracking integration", add: 45, del: 3, files: 3, authorIdx: 0 },
  { msg: "Fix TypeScript strict mode violations\n\nResolved 23 implicit any types and 8 null assertion issues.", add: 89, del: 67, files: 15, authorIdx: 6 },
  { msg: "Implement file upload with progress indicator", add: 198, del: 0, files: 4, authorIdx: 1 },
  { msg: "Add responsive breakpoints for mobile layout", add: 234, del: 78, files: 9, authorIdx: 2 },
  { msg: "Create API documentation with Swagger UI", add: 156, del: 0, files: 4, authorIdx: 4 },
  { msg: "Fix z-index stacking issues with modals and dropdowns", add: 18, del: 12, files: 2, authorIdx: 5 },
  { msg: "Add unit tests for permission utility functions", add: 167, del: 0, files: 5, authorIdx: 0 },
  { msg: "Implement audit log viewer for admin users\n\nShows filterable, paginated history of all user actions.", add: 356, del: 0, files: 10, authorIdx: 3 },
  { msg: "Add PWA manifest and service worker for offline support", add: 123, del: 5, files: 5, authorIdx: 6 },
  { msg: "Fix OAuth callback handling for Google SSO", add: 28, del: 15, files: 2, authorIdx: 0 },
  { msg: "Optimize bundle size by lazy-loading route components\n\nReduced initial JS payload from 480KB to 180KB.", add: 45, del: 89, files: 7, authorIdx: 4 },
  { msg: "Bump dependencies and fix breaking changes from React 19", add: 567, del: 234, files: 22, authorIdx: 6 },
];

function makeDate(i: number): string {
  const base = new Date("2025-12-01T09:00:00Z");
  // Spread commits over ~3 months, roughly 1-2 per day
  base.setTime(base.getTime() + i * 1.8 * 24 * 60 * 60 * 1000);
  // Add some random hour offset
  base.setHours(9 + (i * 7) % 12, (i * 13) % 60, (i * 37) % 60);
  return base.toISOString();
}

export const MOCK_COMMITS: CommitData[] = commits.slice(0, 20).map((c, i) => {
  const author = pick(authors, c.authorIdx);
  const hash = sha(i);
  return {
    sha: hash,
    shortSha: hash.slice(0, 7),
    message: c.msg,
    title: c.msg.split("\n")[0],
    authorName: author.name,
    authorLogin: author.login,
    authorAvatar: author.avatar,
    date: makeDate(i),
    stats: { additions: c.add, deletions: c.del, total: c.add + c.del },
    filesChanged: c.files,
  };
});

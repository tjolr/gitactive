/**
 * Map commit age to a green→blue color.
 * - 0 mins old  → bright green (hue 140)
 * - 10 mins old → teal-ish
 * - 24+ hours   → deep blue (hue 230)
 *
 * Returns both hex number and CSS string.
 */
export function ageColor(dateStr: string): { hex: number; css: string } {
  const ageMs = Date.now() - new Date(dateStr).getTime();
  const ageMins = Math.max(0, ageMs / 60_000);

  // Map 0..1440 mins (0–24h) to hue 140..230, clamped
  const t = Math.min(ageMins / 1440, 1);
  const hue = 140 + t * 90; // 140 (green) → 230 (blue)

  // Saturation: brighter when fresh
  const s = 0.65 - t * 0.15; // 0.65 → 0.50
  const l = 0.42 - t * 0.06; // 0.42 → 0.36

  const css = `hsl(${Math.round(hue)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;

  // HSL → hex
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (hue < 60) { r = c; g = x; }
  else if (hue < 120) { r = x; g = c; }
  else if (hue < 180) { g = c; b = x; }
  else if (hue < 240) { g = x; b = c; }
  else if (hue < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const ri = Math.round((r + m) * 255);
  const gi = Math.round((g + m) * 255);
  const bi = Math.round((b + m) * 255);
  const hex = (ri << 16) | (gi << 8) | bi;

  return { hex, css };
}

/** Color for the relative-time text: green < 1h, orange 1–2h, brown > 2h */
export function timeAgoColor(dateStr: string): { hex: number; css: string } {
  const mins = Math.max(0, (Date.now() - new Date(dateStr).getTime()) / 60_000);
  if (mins < 60) return { hex: 0x44ff44, css: "#44ff44" };       // green
  if (mins < 120) return { hex: 0xffa500, css: "#ffa500" };      // orange
  return { hex: 0x8b5e3c, css: "#8b5e3c" };                      // brown
}

/** Compact relative time: 14m ago, 2h ago, 1d ago, 3mo ago, 1y ago */
export function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const secs = Math.max(0, Math.floor(ms / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

// Assign hues by insertion order — guarantees maximum separation
// between the actual authors in a given repo.
const authorIndex = new Map<string, number>();

function authorHue(username: string): number {
  if (!authorIndex.has(username)) {
    authorIndex.set(username, authorIndex.size);
  }
  const idx = authorIndex.get(username)!;
  // Golden angle spacing starting from hue 0
  return (idx * 137.508) % 360;
}

/** Reset author color assignments (call when switching repos) */
export function resetAuthorColors(): void {
  authorIndex.clear();
}

function hslToRgb(hue: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (hue < 60) { r = c; g = x; }
  else if (hue < 120) { r = x; g = c; }
  else if (hue < 180) { g = c; b = x; }
  else if (hue < 240) { g = x; b = c; }
  else if (hue < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

export function authorColor(username: string): string {
  const hue = authorHue(username);
  return `hsl(${Math.round(hue)}, 70%, 45%)`;
}

export function authorColorHex(username: string): number {
  const hue = authorHue(username);
  const [ri, gi, bi] = hslToRgb(hue, 0.70, 0.45);
  return (ri << 16) | (gi << 8) | bi;
}
